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
import { useRouter, useLocalSearchParams } from "expo-router";
import Building3dLayer from "@/components/Building3dLayer";
import Building2dLayer from "@/components/Building2dLayer";
import LandmarkLayer from "@/components/LandmarkLayer";
import * as FileSystem from "expo-file-system/legacy";
import { landmarkList } from "@/constants/landmarkList";
import OptionsPage from "@/components/OptionsPage";
import { SettingsContext } from "@/context/SettingsContext";
import { useAudio } from "@/context/AudioContext";
import { addWrongAnswer } from "@/services/appwrite";
import { getTodaysQuestions } from "@/utils/dailySeed";

export default function MapScreen() {
	const landmarksFile = FileSystem.documentDirectory + "landmarks.json";

	const saveGeoJSONToFile = async (geojson: any, fileUri: string) => {
		await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(geojson));
		console.log(`GeoJSON saved to ${fileUri}`);
	};
	const tempLandmarksArray = useRef<any[]>([]).current;

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
	const [isChangingLevel, setIsChangingLevel] = useState(false);

	// Logic related declarations
	const [countdown, setCountdown] = useState(30); // DEV
	const intervalRef = useRef<number | null>(null);

	const stopRotation = useRef(false);
	const [highlightLandmark, setHighlightLandmark] = useState(true);
	const totalLevels = useRef(10);
	const { label } = useLocalSearchParams<{ label: string }>();
	const randomLandmarks = useRef(
		label === "Daily"
			? getTodaysQuestions()
			: landmarkList
					.filter((landmark) => landmark.labels.includes(label))
					.sort(() => 0.5 - Math.random()) // shuffle
					.slice(0, totalLevels.current),
	); // take count

	const levelNumber = useRef(0);
	const scoreArray = useRef<number[]>(Array(totalLevels.current).fill(0));
	const wrongAnswerArray = useRef<string[][]>(
		Array.from({ length: totalLevels.current }, () => []),
	);
	const timeTakenArray = useRef<number[]>(Array(totalLevels.current).fill(0));

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
			randomLandmarks.current[levelNumber.current].answers.includes(
				answerText.toLowerCase().replace(/\s+/g, " ").trim(),
			)
		) {
			playSound("ding");
			setCorrectScreen(true);
			vibrationsEnabled && Vibration.vibrate(200);
			scoreArray.current[levelNumber.current] += 1;
			setTimeout(() => {
				nextLandmark();
			}, 500);
		} else {
			// DEV: log wrong answers to Appwrite for analytics
			playSound("wrong_sfx");
			addWrongAnswer(
				label,
				randomLandmarks.current[levelNumber.current].answers[0],
				answerText,
			);
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
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		const endTime = Date.now();
		timeTakenArray.current[levelNumber.current] =
			(endTime - timeTakenArray.current[levelNumber.current]) / 1000; // convert to seconds

		if (levelNumber.current === totalLevels.current - 1) {
			if (skipScreen === true) {
				playSound("level_complete");
				setLevelCompleteScreen(true);
			} else {
				setTimeout(() => {
					playSound("level_complete");
					setLevelCompleteScreen(true);
					setCorrectScreen(false);
				}, 500);
			}
			setTimeout(() => {
				router.replace({
					pathname: "/ReviewScreen",
					params: {
						scoreArrayJSON: JSON.stringify(scoreArray.current),
						wrongAnswerArrayJSON: JSON.stringify(
							wrongAnswerArray.current,
						),
						levelLandmarkListJSON: JSON.stringify(
							randomLandmarks.current,
						),
						timeTakenArrayJSON: JSON.stringify(
							timeTakenArray.current,
						),
						categoryJSON: JSON.stringify(label),
					},
				});
			}, 2500);
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
			// Small delay to prevent countdown bug
			setTimeout(() => {
				initCamera();
				setIsChangingLevel(false);
				setCountdown(30);
				startCountdown();
				timeTakenArray.current[levelNumber.current] = Date.now(); // start timer tracker for next level
			}, 50);
		}
	};

	const startCountdown = () => {
		if (intervalRef.current) {
			//console.log("Countdown already running, clearing first");
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		intervalRef.current = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					// stop interval when countdown reaches 0
					if (intervalRef.current) {
						clearInterval(intervalRef.current);
						intervalRef.current = null;
					}
					setIsChangingLevel(true);
					if (levelNumber.current === totalLevels.current - 1) {
						timeUpSequence();
					} else {
						nextLandmark();
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
		const endTime = Date.now();
		timeTakenArray.current[levelNumber.current] =
			(endTime - timeTakenArray.current[levelNumber.current]) / 1000; // convert to seconds
		console.log(timeTakenArray.current);
		setTimeout(() => {
			router.replace({
				pathname: "/ReviewScreen",
				params: {
					scoreArrayJSON: JSON.stringify(scoreArray.current),
					wrongAnswerArrayJSON: JSON.stringify(
						wrongAnswerArray.current,
					),
					levelLandmarkListJSON: JSON.stringify(
						randomLandmarks.current,
					),
					timeTakenArrayJSON: JSON.stringify(timeTakenArray.current),
					categoryJSON: JSON.stringify(label),
				},
			});
		}, 2000);
	};

	const startAutoRotate = () => {
		const rotate = () => {
			rotationHeading.current = (rotationHeading.current + 0.1) % 360;
			setHeading(rotationHeading.current);
			cameraRef.current?.setStop({
				bearing: rotationHeading.current,
				duration: 0,
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

	const onMapPress = async (e: any) => {
		// screen coordinates
		const x = e.properties?.screenPointX;
		const y = e.properties?.screenPointY;

		// query without layer filter first
		const features = await mapRef.current.queryRenderedFeatures([x, y]);

		// console.log(features.features); DEV
		// console.log(
		// 	`Found ${features.features.length} features at point (${e.geometry.coordinates[0]}, ${e.geometry.coordinates[1]})`,
		// );
		// tempLandmarksArray.push(features.features);
		// console.log(tempLandmarksArray);
	};

	const initCamera = () => {
		//console.log("Map finished loading, initializing camera");
		cameraRef.current?.setStop({
			center: [103.8198, 1.3521], // Singapore
			zoom: 9.2,
			pitch: 45,
			bearing: 0,
		});

		setTimeout(() => {
			//console.log("Starting intro zoom animation");
			cameraRef.current?.setStop({
				zoom: 16,
				pitch: 45,
				duration: 3000,
				easing: "fly",
				center: randomLandmarks.current[levelNumber.current]
					.coordinates,
			});
		}, 300);

		rotationTimeout.current = setTimeout(() => {
			stopRotation.current ? null : startAutoRotate();
		}, 3000);
	};

	useEffect(() => {
		playMusic("map_bg_music");
		startCountdown();
		timeTakenArray.current[levelNumber.current] = Date.now(); // start timer tracker for first level

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
			//console.log("Level complete - stopping timer");
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, [levelCompleteScreen]);

	return (
		<View
			style={styles.page}
			pointerEvents={isChangingLevel ? "none" : "auto"}
		>
			<Map
				ref={mapRef}
				style={styles.mapView}
				mapStyle={require("@/assets/mapData.json")}
				compass={false}
				logo={false}
				onPress={onMapPress}
				onDidFinishLoadingMap={initCamera}
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
						randomLandmarks.current[levelNumber.current].landmarkID
					}
				/>
			</Map>

			<View style={[styles.topUIView, { top: insets.top + 15 }]}>
				{/* Menu Button */}
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

				{/* Timer View */}
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
					<Text
						style={{
							fontSize: width < 600 ? 20 : 20 * 1.25,
							color: colors.text,
						}}
					>
						{countdown}s
					</Text>
				</View>

				{/* Compass Button */}
				<TouchableOpacity
					style={[
						styles.compassTouchable,
						{ width: width * 0.12, height: width * 0.12 },
					]}
					onPress={() => {
						playSound("button_press");
						stopRotation.current = true;
						cancelRotationFrame();
						if (heading === 0) {
							cameraRef.current?.setStop({
								zoom: 16,
								pitch: 45,
								duration: 3000,
								easing: "fly",
								center: randomLandmarks.current[
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
				{/* Skip Button */}
				<TouchableOpacity
					style={[
						styles.skipTouchable,
						{ width: width * 0.12, height: width * 0.12 },
					]}
					onPress={() => {
						playSound("button_press");
						setSkipScreen(true);
						//saveGeoJSONToFile(tempLandmarksArray, landmarksFile); // DEV
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

				{/* 3D toggle button */}
				<TouchableOpacity
					style={[
						styles.threeDTouchable,
						{ width: width * 0.12, height: width * 0.12 },
					]}
					onPress={() => {
						playSound("button_press");
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

				{/* Submit Button */}
				<TouchableOpacity
					style={[
						styles.submitTouchable,
						{ width: width * 0.12, height: width * 0.12 },
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
				style={[{ bottom: insets.bottom + 15 }, styles.answerView]}
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
					/>
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
								textAlign: "center",
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
						Time's up
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
