import React, { useRef, useState, useEffect, useContext } from "react";
import {
	View,
	TouchableOpacity,
	Image,
	StyleSheet,
	Text,
	TextInput,
	KeyboardAvoidingView,
	Keyboard,
	Animated,
	Vibration,
	useWindowDimensions,
	NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	Map,
	Camera,
	type CameraRef,
	type MapRef,
	ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/colors";
import { useRouter } from "expo-router";
import Building3dLayer from "@/components/Building3dLayer";
import Building2dLayer from "@/components/Building2dLayer";
import LandmarkLayer from "@/components/LandmarkLayer";
import { landmarkList } from "@/constants/landmarkList";
import OptionsPage from "@/components/OptionsPage";
import { SettingsContext } from "@/context/SettingsContext";
import { useAudio } from "@/context/AudioContext";
import TutorialCard from "@/components/TutorialCard";

export default function MapScreen() {
	// Phone related declarations
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();

	// Map related declarations
	const cameraRef = useRef<CameraRef>(null);
	const mapRef = useRef<MapRef>(null);
	const rotationFrame = useRef<number | null>(null);
	const rotationTimeout = useRef<number | null>(null);
	const [heading, setHeading] = useState(0);
	const rotationHeading = useRef(0);
	const pitch = useRef(45);
	const zoomLevel = useRef(16);

	// Logic related declarations
	const [countdown, setCountdown] = useState(30);
	const intervalRef = useRef<number | null>(null);
	const stopRotation = useRef(false);
	const [highlightLandmark, setHighlightLandmark] = useState(true);
	const tutorialLandmarks = useRef([
		landmarkList[0],
		landmarkList[2],
		landmarkList[1],
	]);
	const levelNumber = useRef(0);
	const scoreArray = useRef<number[]>(
		Array(tutorialLandmarks.current.length).fill(0),
	);
	const wrongAnswerArray = useRef<string[][]>(
		Array.from({ length: tutorialLandmarks.current.length }, () => []),
	);
	const [tutorialSequenceSub, setTutorialSequenceSub] = useState(
		Array(18).fill(0),
	);
	const [tutorialSequenceMain, setTutorialSequenceMain] = useState(0);
	const timeTakenArray = useRef<number[]>(Array(3).fill(0));

	// UI related declarations
	const [answerText, setAnswerText] = useState("");
	const [timeUpScreen, setTimeUpScreen] = useState(false);
	const [correctScreen, setCorrectScreen] = useState(false);
	const [optionsScreen, setOptionsScreen] = useState(false);
	const [levelCompleteScreen, setLevelCompleteScreen] = useState(false);
	const [skipScreen, setSkipScreen] = useState(false);
	const [flexToggle, setFlexToggle] = useState(false);
	const shakeAnim = useRef(new Animated.Value(0)).current; // initial value 0
	const { vibrationsEnabled } = useContext(SettingsContext)!;
	const { playSound, playMusic } = useAudio();

	const handleSubmit = async () => {
		if (
			tutorialLandmarks.current[levelNumber.current].answers.includes(
				answerText.toLowerCase().replace(/\s+/g, " ").trim(),
			)
		) {
			setTutorialSequenceMain((prev) => prev + 1);
			playSound("ding");
			setCorrectScreen(true);
			vibrationsEnabled && Vibration.vibrate(200);
			scoreArray.current[levelNumber.current] += 1;
		} else {
			playSound("wrong_sfx");
			wrongAnswer();
		}
	};

	const wrongAnswer = () => {
		wrongAnswerArray.current[levelNumber.current].push(answerText);

		// reset the animation value
		shakeAnim.setValue(0);

		Animated.sequence([
			Animated.timing(shakeAnim, {
				toValue: 10,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(shakeAnim, {
				toValue: -10,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(shakeAnim, {
				toValue: 10,
				duration: 50,
				useNativeDriver: true,
			}),
			Animated.timing(shakeAnim, {
				toValue: 0,
				duration: 50,
				useNativeDriver: true,
			}),
		]).start();
	};

	const nextLandmark = () => {
		if (levelNumber.current === tutorialLandmarks.current.length - 1) {
			if (skipScreen === true) {
				playSound("level_complete");
				setLevelCompleteScreen(true);
				if (tutorialSequenceMain === 15) {
					setTutorialSequenceMain((prev) => prev + 1);
				}
			} else {
				setTimeout(() => {
					playSound("level_complete");
					setLevelCompleteScreen(true);
					setCorrectScreen(false);
					if (tutorialSequenceMain === 15) {
						setTutorialSequenceMain((prev) => prev + 1);
					}
				}, 500);
			}
		} else {
			setCorrectScreen(false);
			setSkipScreen(false);
			setHighlightLandmark(true);
			clearRotationTimeout();
			cancelRotationFrame();
			rotationHeading.current = 0;
			setAnswerText("");
			stopRotation.current = false;
			levelNumber.current += 1;
			//initCamera();
		}
	};
	const startCountdown = () => {
		if (intervalRef.current) return; // prevent multiple intervals

		intervalRef.current = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					// stop interval when countdown reaches 0
					if (intervalRef.current) {
						clearInterval(intervalRef.current);
						intervalRef.current = null;
						timeUpSequence(); // DEV
					}
					return 0;
				}
				if (prev <= 10) {
					playSound("timer_ending");
				}
				return prev - 1;
			});
		}, 1000);
	};

	const timeUpSequence = () => {
		playSound("time_up");
		Keyboard.dismiss();
		setTimeUpScreen(true);
		if (tutorialSequenceMain === 15) {
			setTutorialSequenceMain((prev) => prev + 1);
		}
	};

	const startAutoRotate = () => {
		//console.log("Starting auto-rotation");

		const rotate = () => {
			rotationHeading.current = (rotationHeading.current + 0.1) % 360;
			setHeading(rotationHeading.current);
			cameraRef.current?.setStop({
				bearing: rotationHeading.current,
				duration: 100,
			});
			rotationFrame.current = requestAnimationFrame(rotate);
		};
		rotationFrame.current = requestAnimationFrame(rotate);
	};

	const cancelRotationFrame = () => {
		if (rotationFrame.current) {
			cancelAnimationFrame(rotationFrame.current);
			rotationFrame.current = null;
		}
	};

	const clearRotationTimeout = () => {
		if (rotationTimeout.current) {
			clearTimeout(rotationTimeout.current);
			rotationTimeout.current = null;
		}
	};

	const onMapInteraction = (
		event: NativeSyntheticEvent<ViewStateChangeEvent>,
	) => {
		if (event.nativeEvent.userInteraction) {
			stopRotation.current = true;
			cancelRotationFrame();
		}
	};

	const initCamera = () => {
		cameraRef.current?.setStop({
			center: [103.8198, 1.3521], // Singapore
			zoom: 9.2,
			pitch: 45,
			bearing: 0,
			duration: 0,
		});

		setTimeout(() => {
			cameraRef.current?.setStop({
				zoom: 16,
				pitch: 45,
				duration: 3000,
				easing: "fly",
				center: tutorialLandmarks.current[levelNumber.current]
					.coordinates,
			});
		}, 300);

		rotationTimeout.current = setTimeout(() => {
			stopRotation.current ? null : startAutoRotate();
		}, 3000);
	};

	useEffect(() => {
		playMusic("map_bg_music");

		const keyboardShowListener = Keyboard.addListener(
			"keyboardDidShow",
			() => {
				setFlexToggle(false);
			},
		);

		const keyboardHideListener = Keyboard.addListener(
			"keyboardDidHide",
			() => {
				setFlexToggle(true);
			},
		);

		return () => {
			keyboardShowListener.remove();
			keyboardHideListener.remove();
			cancelRotationFrame();
			clearRotationTimeout();
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (levelCompleteScreen && intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, [levelCompleteScreen]);

	// Tutorial main sequence useEffect
	useEffect(() => {
		if (tutorialSequenceMain === 1) {
			initCamera();
			setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 3000);
		}
		if (tutorialSequenceMain === 4) {
			setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 1000);
		}
		if (tutorialSequenceMain === 6) {
			initCamera();
			setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 3000);
		}
		if (tutorialSequenceMain === 9) {
			setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 2000);
		}
		if (tutorialSequenceMain === 15) {
			initCamera();
			timeTakenArray.current[2] = Date.now();
			startCountdown();
		}
		if (tutorialSequenceMain === 16) {
			const endTime = Date.now();
			timeTakenArray.current[2] =
				(endTime - timeTakenArray.current[2]) / 1000;
			setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 1000);
		}
		if (tutorialSequenceMain === 18) {
			router.replace({
				pathname: "/TutorialReviewScreen",
				params: {
					scoreArrayJSON: JSON.stringify(scoreArray.current),
					wrongAnswerArrayJSON: JSON.stringify(
						wrongAnswerArray.current,
					),
					levelLandmarkListJSON: JSON.stringify(
						tutorialLandmarks.current,
					),
					timeTakenArrayJSON: JSON.stringify(timeTakenArray.current),
					categoryJSON: JSON.stringify("Tutorial"),
				},
			});
		}
	}, [tutorialSequenceMain]);

	return (
		<View style={styles.page}>
			<Map
				ref={mapRef}
				style={styles.mapView}
				mapStyle={require("@/assets/mapData.json")}
				compass={false}
				logo={false}
				onRegionWillChange={onMapInteraction}
				onRegionIsChanging={(region) => {
					setHeading(region.nativeEvent.bearing ?? 0);
					pitch.current = region.nativeEvent.pitch ?? pitch.current;
					zoomLevel.current =
						region.nativeEvent.zoom ?? zoomLevel.current;
				}}
				onRegionDidChange={(region) => {
					setHeading(region.nativeEvent.bearing ?? heading);
					pitch.current = region.nativeEvent.pitch ?? pitch.current;
					zoomLevel.current =
						region.nativeEvent.zoom ?? zoomLevel.current;
				}}
			>
				<Camera ref={cameraRef} />

				<Building3dLayer highlightLandmark={highlightLandmark} />
				<Building2dLayer />
				<LandmarkLayer
					highlightLandmark={highlightLandmark}
					landmarkID={
						tutorialLandmarks.current[levelNumber.current]
							.landmarkID
					}
				/>
			</Map>

			<View style={[styles.topUIView, { top: insets.top + 15 }]}>
				{tutorialSequenceMain === 9 && (
					<View
						style={{
							position: "absolute",
							zIndex: 999,
							width: 50,
							height: 50,
							left: 20,
						}}
					></View>
				)}

				{/* Menu button */}
				<TouchableOpacity
					style={[
						styles.menuTouchable,
						{ width: width * 0.14, height: width * 0.14 },
					]}
					onPress={() => {
						playSound("button_press");
						setOptionsScreen(true);
						Keyboard.dismiss();
					}}
				>
					<Image
						source={icons.menu_button}
						style={{
							width: width * 0.14,
							height: width * 0.14,
						}}
						resizeMode="contain"
					/>
				</TouchableOpacity>

				{/* Timer and question number */}
				<View
					style={[
						styles.timerView,
						{ minHeight: height * 0.05, width: width * 0.25 },
					]}
				>
					<Text
						style={[
							styles.questionNumberText,
							{ fontSize: width < 600 ? 30 : 30 * 1.25 },
						]}
					>
						Q{levelNumber.current + 1}
					</Text>
					{tutorialSequenceMain >= 15 && (
						<Text
							style={{
								fontSize: width < 600 ? 20 : 20 * 1.25,
								color: colors.text,
							}}
						>
							{countdown}s
						</Text>
					)}
					{tutorialSequenceMain < 15 && (
						<Text
							style={{
								fontSize: width < 600 ? 20 : 20 * 1.25,
								color: colors.text,
							}}
						>
							-s
						</Text>
					)}
				</View>

				{/* Compass button */}
				<TouchableOpacity
					style={[
						styles.compassTouchable,
						{
							width: width * 0.12,
							height: width * 0.12,
							zIndex:
								tutorialSequenceMain === 14 &&
								tutorialSequenceSub[14] === 1
									? 999
									: 0,
							pointerEvents:
								tutorialSequenceMain === 14 &&
								tutorialSequenceSub[14] === 1
									? "none"
									: "auto",
						},
					]}
					onPress={() => {
						playSound("button_press");
						stopRotation.current = true;
						cancelRotationFrame();
						// Reset heading programmatically
						if (heading === 0) {
							cameraRef.current?.setStop({
								zoom: 16,
								pitch: 45,
								duration: 3000,
								easing: "fly",
								center: tutorialLandmarks.current[
									levelNumber.current
								].coordinates,
							});
						} else {
							cameraRef.current?.setStop({
								bearing: 0,
								duration: 300,
								easing: "fly",
							});
						}
						Keyboard.dismiss();
					}}
				>
					<Image
						source={icons.button}
						style={{
							width: width * 0.12,
							height: width * 0.12,
							position: "absolute",
						}}
						resizeMode="contain"
					/>
					<Image
						source={icons.compass}
						style={{
							width: width * 0.12,
							height: width * 0.12,
							transform: [{ rotate: `${-heading}deg` }],
						}}
						resizeMode="contain"
					/>
				</TouchableOpacity>
			</View>

			<View
				style={[
					styles.bottomUIView,
					{ bottom: insets.bottom + height * 0.08 },
				]}
			>
				{/* 3D toggle button */}
				<TouchableOpacity
					style={[
						styles.threeDTouchable,
						{
							width: width * 0.12,
							height: width * 0.12,
							zIndex:
								tutorialSequenceMain === 7 &&
								tutorialSequenceSub[7] === 2
									? 999
									: 0,
							opacity:
								tutorialSequenceMain >= 7 &&
								tutorialSequenceSub[7] >= 2
									? 1
									: 0,
							pointerEvents:
								tutorialSequenceMain >= 7 &&
								tutorialSequenceSub[7] >= 2
									? "auto"
									: "none",
						},
					]}
					onPress={() => {
						playSound("button_press");
						if (
							tutorialSequenceMain === 7 &&
							tutorialSequenceSub[7] === 2
						) {
							setTutorialSequenceMain((prev) => prev + 2);
						} else if (tutorialSequenceMain === 8) {
							setTutorialSequenceMain((prev) => prev + 1);
						}
						cameraRef.current?.setStop({
							pitch: pitch.current,
							zoom: zoomLevel.current,
							bearing: heading,
							duration: 0,
						});
						setHighlightLandmark(!highlightLandmark);
					}}
				>
					<Image
						source={
							highlightLandmark
								? icons.highlight_landmark_off
								: icons.highlight_landmark_on
						}
						style={{
							width: width * 0.12,
							height: width * 0.12,
						}}
						resizeMode="contain"
					/>
				</TouchableOpacity>

				{/* Skip button */}
				<TouchableOpacity
					style={[
						styles.skipTouchable,
						{
							width: width * 0.12,
							height: width * 0.12,
							zIndex:
								tutorialSequenceMain === 10 &&
								tutorialSequenceSub[10] === 2
									? 999
									: 0,
							opacity:
								tutorialSequenceMain >= 10 &&
								tutorialSequenceSub[10] >= 2
									? 1
									: 0,
							pointerEvents:
								tutorialSequenceMain >= 10 &&
								tutorialSequenceSub[10] >= 2
									? "auto"
									: "none",
						},
					]}
					onPress={() => {
						playSound("button_press");
						setSkipScreen(true);
						if (tutorialSequenceMain === 11) {
							setTutorialSequenceMain((prev) => prev + 1);
						}
						if (
							tutorialSequenceMain === 10 &&
							tutorialSequenceSub[10] === 2
						) {
							setTutorialSequenceMain((prev) => prev + 2);
						}
					}}
				>
					<Image
						source={icons.skip_button}
						style={{
							width: width * 0.12,
							height: width * 0.12,
						}}
						resizeMode="contain"
					/>
				</TouchableOpacity>

				{/* Submit Button */}
				<TouchableOpacity
					style={[
						styles.submitTouchable,
						{
							width: width * 0.12,
							height: width * 0.12,
							zIndex:
								tutorialSequenceMain === 2 &&
								tutorialSequenceSub[2] === 1
									? 999
									: 0,
							opacity:
								(tutorialSequenceMain >= 2 &&
									tutorialSequenceMain <= 5 &&
									tutorialSequenceSub[2] >= 1) ||
								tutorialSequenceMain >= 15
									? 1
									: 0,
							pointerEvents:
								(tutorialSequenceMain >= 2 &&
									tutorialSequenceMain <= 5 &&
									tutorialSequenceSub[2] >= 1) ||
								tutorialSequenceMain >= 15
									? "auto"
									: "none",
						},
					]}
					onPress={() => {
						playSound("button_press");
						handleSubmit();
					}}
				>
					<Image
						source={icons.submit_button}
						style={{
							width: width * 0.12,
							height: width * 0.12,
						}}
						resizeMode="contain"
					/>
				</TouchableOpacity>
			</View>

			<KeyboardAvoidingView
				style={[
					{
						bottom: insets.bottom + 15,
						zIndex:
							tutorialSequenceMain === 2 &&
							tutorialSequenceSub[2] === 1
								? 999
								: 0,
					},
					styles.answerView,
				]}
				behavior="padding"
				enabled={!flexToggle}
				keyboardVerticalOffset={15}
			>
				<Animated.View
					style={{
						transform: [{ translateX: shakeAnim }],
						width: "80%",
					}}
				>
					{(tutorialSequenceMain <= 5 ||
						tutorialSequenceMain >= 15) && (
						<TextInput
							style={[
								styles.answerTextInput,
								{
									height: height * 0.05,
									fontSize: width < 600 ? 15 : 15 * 1.25,
								},
							]}
							placeholder="Type here..."
							placeholderTextColor={colors.text}
							value={answerText}
							onChangeText={setAnswerText}
							textAlign="center"
							onSubmitEditing={handleSubmit}
							onFocus={() => {
								if (
									tutorialSequenceMain === 2 &&
									tutorialSequenceSub[2] === 1
								) {
									setTutorialSequenceMain((prev) => prev + 1);
								}
							}}
						/>
					)}
				</Animated.View>
			</KeyboardAvoidingView>

			{optionsScreen && (
				<OptionsPage onClose={() => setOptionsScreen(false)} />
			)}

			{correctScreen && (
				<View style={styles.correctTranslucentView}>
					<Image
						source={icons.tick_label}
						style={{ height: 120, width: 120 }} // DEV too lazy to change this to scale though lmaoo
					/>
				</View>
			)}

			{skipScreen && (
				<View style={styles.blackTranslucentView}>
					<TouchableOpacity
						style={StyleSheet.absoluteFill}
						activeOpacity={1}
						onPress={() => setSkipScreen(false)}
					/>
					<View
						style={[
							styles.skipView,
							{ width: width * 0.8, height: height * 0.2 },
						]}
					>
						<Text
							style={{
								color: colors.text,
								fontSize: width < 600 ? 50 : 50 * 1.25,
								fontWeight: "bold",
								marginBottom: 30,
							}}
						>
							Skip?
						</Text>
						<TouchableOpacity
							style={[
								styles.skipYesTouchable,
								{ right: width * 0.1, bottom: -width * 0.09 },
							]}
							onPress={() => {
								playSound("button_press");
								if (tutorialSequenceMain === 13) {
									setTutorialSequenceMain((prev) => prev + 1);
								}
								nextLandmark();
							}}
						>
							<Image
								source={icons.tick_button}
								style={{
									width: width * 0.18,
									height: width * 0.18,
								}}
							/>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.skipNoTouchable,
								{ left: width * 0.1, bottom: -width * 0.09 },
							]}
							onPress={() => {
								playSound("button_press");
								setSkipScreen(false);
							}}
						>
							<Image
								source={icons.close_button}
								style={{
									width: width * 0.18,
									height: width * 0.18,
								}}
							/>
						</TouchableOpacity>
					</View>
				</View>
			)}

			{timeUpScreen && (
				<View style={styles.blackTranslucentView}>
					<Text
						style={{
							color: colors.primary,
							fontSize: width < 600 ? 30 : 30 * 1.25,
							textShadowColor: "black",
							textShadowRadius: 4,
						}}
					>
						Time's up!
					</Text>
				</View>
			)}

			{levelCompleteScreen && (
				<View style={styles.blackTranslucentView}>
					<Text
						style={{
							color: colors.primary,
							fontSize: width < 600 ? 30 : 30 * 1.25,
							textShadowColor: "black",
							textShadowRadius: 4,
						}}
					>
						Level Complete!
					</Text>
				</View>
			)}

			{tutorialSequenceMain === 0 && (
				<TouchableOpacity
					style={styles.blackTranslucentView}
					activeOpacity={1}
					onPress={() => {
						if (tutorialSequenceSub[0] < 1) {
							setTutorialSequenceSub((prev) => {
								const temp = [...prev];
								temp[0] += 1;
								return temp;
							});
						} else {
							setTutorialSequenceMain((prev) => prev + 1);
						}
					}}
				>
					{tutorialSequenceSub[0] === 0 && (
						<TutorialCard
							text="Welcome to Flash!"
							positionStyle={{ bottom: 50 + insets.bottom }}
						/>
					)}
					{tutorialSequenceSub[0] === 1 && (
						<TutorialCard
							text="The objective of this game is to guess the building based on its polygon shape"
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}
				</TouchableOpacity>
			)}

			{tutorialSequenceMain === 2 && (
				<TouchableOpacity
					style={styles.blackTranslucentView}
					activeOpacity={1}
					onPress={() => {
						if (tutorialSequenceSub[2] < 1) {
							setTutorialSequenceSub((prev) => {
								const temp = [...prev];
								temp[2] += 1;
								return temp;
							});
						} else {
							setTutorialSequenceMain((prev) => prev + 1);
						}
					}}
				>
					{tutorialSequenceSub[2] === 0 && (
						<TutorialCard
							text="Do you recognize this building? It's the Marina Bay Sands!"
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}
					{tutorialSequenceSub[2] === 1 && (
						<TutorialCard
							text="Key in 'Marina Bay Sands', and press the submit button to continue."
							positionStyle={{
								bottom: insets.bottom + height * 0.15,
							}}
						/>
					)}
				</TouchableOpacity>
			)}

			{tutorialSequenceMain === 5 && (
				<TouchableOpacity
					style={styles.blackTranslucentView}
					activeOpacity={1}
					onPress={() => {
						if (tutorialSequenceSub[5] < 1) {
							setTutorialSequenceSub((prev) => {
								const temp = [...prev];
								temp[5] += 1;
								return temp;
							});
						} else {
							nextLandmark();
							setTutorialSequenceMain((prev) => prev + 1);
						}
					}}
				>
					{tutorialSequenceSub[5] === 0 && (
						<TutorialCard
							text="Great! Note that other answers are accepted as well. (eg. MBS)"
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}
					{tutorialSequenceSub[5] === 1 && (
						<TutorialCard
							text="Onto the next building!"
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}
				</TouchableOpacity>
			)}

			{tutorialSequenceMain === 7 && (
				<TouchableOpacity
					style={styles.blackTranslucentView}
					activeOpacity={1}
					onPress={() => {
						if (tutorialSequenceSub[7] < 2) {
							setTutorialSequenceSub((prev) => {
								const temp = [...prev];
								temp[7] += 1;
								return temp;
							});
						} else {
							setTutorialSequenceMain((prev) => prev + 1);
						}
					}}
				>
					{tutorialSequenceSub[7] === 0 && (
						<TutorialCard
							text="Hmm... This is a bit tricky."
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}
					{tutorialSequenceSub[7] === 1 && (
						<TutorialCard
							text="I know something that can help!"
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}
					{tutorialSequenceSub[7] === 2 && (
						<TutorialCard
							text="Press this button to toggle surrounding buildings. Maybe this can help!"
							positionStyle={{
								bottom:
									insets.bottom +
									(height - insets.bottom - insets.top) *
										0.17,
							}}
						/>
					)}
				</TouchableOpacity>
			)}

			{tutorialSequenceMain === 10 && (
				<TouchableOpacity
					style={styles.blackTranslucentView}
					activeOpacity={1}
					onPress={() => {
						if (tutorialSequenceSub[10] < 2) {
							setTutorialSequenceSub((prev) => {
								const temp = [...prev];
								temp[10] += 1;
								return temp;
							});
						} else {
							setTutorialSequenceMain((prev) => prev + 1);
						}
					}}
				>
					{tutorialSequenceSub[10] === 0 && (
						<TutorialCard
							text="Still no clue..."
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}
					{tutorialSequenceSub[10] === 1 && (
						<TutorialCard
							text="This is too hard, we should skip this building."
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}
					{tutorialSequenceSub[10] === 2 && (
						<TutorialCard
							text="Press this to skip."
							positionStyle={{
								bottom:
									insets.bottom +
									(height - insets.bottom - insets.top) *
										0.17,
							}}
						/>
					)}
				</TouchableOpacity>
			)}

			{tutorialSequenceMain === 12 && (
				<TouchableOpacity
					style={styles.blackTranslucentView}
					activeOpacity={1}
					onPress={() => {
						setTutorialSequenceMain((prev) => prev + 1);
					}}
				>
					{tutorialSequenceSub[12] === 0 && (
						<TutorialCard
							text="Once you skip a question, there's no returning back!"
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}
				</TouchableOpacity>
			)}

			{tutorialSequenceMain === 14 && (
				<TouchableOpacity
					style={styles.blackTranslucentView}
					activeOpacity={1}
					onPress={() => {
						if (tutorialSequenceSub[14] < 2) {
							setTutorialSequenceSub((prev) => {
								const temp = [...prev];
								temp[14] += 1;
								return temp;
							});
						} else {
							setTutorialSequenceMain((prev) => prev + 1);
						}
					}}
				>
					{tutorialSequenceSub[14] === 0 && (
						<TutorialCard
							text="In a game, you have 10 landmarks to guess, each with a 30s time limit."
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}
					{tutorialSequenceSub[14] === 1 && (
						<TutorialCard
							text="If you need to reset the camera, simply press the compass button twice."
							positionStyle={{
								top: insets.top + height * 0.09,
							}}
						/>
					)}
					{tutorialSequenceSub[14] === 2 && (
						<TutorialCard
							text="Now you try!"
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}
				</TouchableOpacity>
			)}

			{tutorialSequenceMain === 17 && (
				<TouchableOpacity
					style={styles.blackTranslucentView}
					activeOpacity={1}
					onPress={() => {
						if (tutorialSequenceSub[17] < 1) {
							setTutorialSequenceSub((prev) => {
								const temp = [...prev];
								temp[17] += 1;
								return temp;
							});
						} else {
							setTutorialSequenceMain((prev) => prev + 1);
						}
					}}
				>
					{tutorialSequenceSub[17] === 0 && (
						<TutorialCard
							text="Good job!"
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}
					{tutorialSequenceSub[17] === 1 && (
						<TutorialCard
							text="Now let's go to the review page."
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}
				</TouchableOpacity>
			)}

			{[1, 6].includes(tutorialSequenceMain) && (
				<View
					style={{
						flex: 1,
						position: "absolute",
						zIndex: 999,
						width: "100%",
						height: "100%",
					}}
				></View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	page: {
		flex: 1,
	},
	mapView: {
		flex: 1,
	},
	topUIView: {
		position: "absolute",
		justifyContent: "space-between",
		flexDirection: "row",
		width: "100%",
		paddingHorizontal: 20,
	},
	menuTouchable: {
		backgroundColor: colors.primary,
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	timerView: {
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 10,
		backgroundColor: "rgba(255,255,255,0.4)",
	},
	questionNumberText: {
		color: colors.text,
		fontWeight: "bold",
	},
	compassTouchable: {
		backgroundColor: colors.primary,
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	blackTranslucentView: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.5)", // 50% black overlay
	},
	correctTranslucentView: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0, 255, 0, 0.5)", // 50% black overlay
	},
	bottomUIView: {
		position: "absolute",
		justifyContent: "space-between",
		flexDirection: "row",
		width: "100%",
		paddingHorizontal: 20,
	},
	skipTouchable: {
		backgroundColor: colors.primary,
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	submitTouchable: {
		backgroundColor: colors.primary,
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	threeDTouchable: {
		backgroundColor: colors.primary,
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	answerView: {
		position: "absolute",
		width: "100%",
		alignItems: "center",
	},
	answerTextInput: {
		borderColor: "#000000",
		borderWidth: 1,
		borderRadius: 10,
		backgroundColor: colors.background,
	},
	skipView: {
		borderRadius: 30,
		backgroundColor: colors.background,
		justifyContent: "center",
		alignItems: "center",
	},
	skipYesTouchable: {
		position: "absolute",
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.hardCorrect,
	},
	skipNoTouchable: {
		position: "absolute",
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.hardWrong,
	},
});
