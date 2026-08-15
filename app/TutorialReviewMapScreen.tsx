import React, { useEffect, useRef, useState, useMemo } from "react";
import {
	View,
	TouchableOpacity,
	Image,
	StyleSheet,
	Text,
	Animated,
	ScrollView,
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
import ReviewCard from "@/components/ReviewCard";
import { useAudio } from "@/context/AudioContext";
import TutorialCard from "@/components/TutorialCard";

export default function ReviewMapScreen() {
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
	const stopRotation = useRef(false);
	const [highlightLandmark, setHighlightLandmark] = useState(true);
	const {
		indexString,
		scoreArrayJSON,
		wrongAnswerArrayJSON,
		levelLandmarkListJSON,
		timeTakenArrayJSON,
		categoryJSON,
	} = useLocalSearchParams<{
		indexString: string;
		scoreArrayJSON: string;
		wrongAnswerArrayJSON: string;
		levelLandmarkListJSON: string;
		timeTakenArrayJSON: string;
		categoryJSON: string;
	}>();
	const [index, setIndex] = useState(parseInt(indexString, 10));
	const scoreArray = useMemo(
		() => JSON.parse(scoreArrayJSON),
		[scoreArrayJSON],
	);
	const wrongAnswerArray = useMemo(
		() => JSON.parse(wrongAnswerArrayJSON),
		[wrongAnswerArrayJSON],
	);
	const levelLandmarkList = useMemo(
		() => JSON.parse(levelLandmarkListJSON),
		[levelLandmarkListJSON],
	);
	const timeTakenArray = useMemo(
		() => JSON.parse(timeTakenArrayJSON),
		[timeTakenArrayJSON],
	);
	const [tutorialSequenceSub, setTutorialSequenceSub] = useState(
		Array(11).fill(0),
	);
	const [tutorialSequenceMain, setTutorialSequenceMain] = useState(0);

	// UI related declarations
	const translateY = useRef(new Animated.Value(0)).current;
	const [expanded, setExpanded] = useState(false);
	const { playSound } = useAudio();

	// Only for measuring card position for replacement review card
	const cardRef = useRef<View>(null);
	const [cardPosition, setCardPosition] = useState({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
	});
	const measureCard = () => {
		cardRef.current?.measure((x, y, width, height, pageX, pageY) => {
			setCardPosition({ x: pageX, y: pageY, width, height });
		});
	};

	const toggleSheet = () => {
		if (expanded) {
			// collapse
			Animated.timing(translateY, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}).start();
		} else {
			// expand
			Animated.timing(translateY, {
				toValue: -200, // move up 300px
				duration: 300,
				useNativeDriver: true,
			}).start();
		}

		setExpanded(!expanded);
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
		//console.log("Map finished loading, initializing camera");
		cameraRef.current?.setStop({
			center: [103.8198, 1.3521], // Singapore
			zoom: 9.2,
			pitch: 45,
			bearing: 0,
			duration: 0,
		});

		setTimeout(() => {
			//console.log("Starting intro zoom animation");
			cameraRef.current?.setStop({
				zoom: 16,
				pitch: 45,
				duration: 3000,
				easing: "fly",
				center: levelLandmarkList[index].coordinates,
			});
		}, 300);

		rotationTimeout.current = setTimeout(() => {
			stopRotation.current ? null : startAutoRotate();
		}, 3000);
	};

	useEffect(() => {
		initCamera();

		return () => {
			cancelRotationFrame();
			clearRotationTimeout();
		};
	}, [index]);

	useEffect(() => {
		if (tutorialSequenceMain === 0) {
			setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 1000);
		}
		if (tutorialSequenceMain === 3 || tutorialSequenceMain === 6) {
			setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 1000);
			setTimeout(() => measureCard(), 500);
		}
		if (tutorialSequenceMain === 9) {
			setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 3000);
		}
	}, [tutorialSequenceMain]);

	return (
		<View style={styles.page}>
			{[0, 3, 6, 9].includes(tutorialSequenceMain) && (
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

			<Map
				ref={mapRef}
				style={styles.mapView}
				mapStyle={require("@/assets/mapData.json")}
				compass={false}
				logo={false}
				onDidFinishLoadingMap={() => {
					cameraRef.current?.setStop({
						center: [103.8198, 1.3521], // Singapore
						zoom: 9.2,
						pitch: 45,
						bearing: 0,
						duration: 0,
					});
				}}
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
					landmarkID={levelLandmarkList[index].landmarkID}
				/>
			</Map>

			<View style={[styles.topUIView, { top: insets.top + 15 }]}>
				{tutorialSequenceMain < 10 && (
					<View
						style={{
							position: "absolute",
							width: 50,
							height: 50,
							left: 20,
							zIndex: 1000,
						}}
					></View>
				)}
				{/* Back button */}
				<TouchableOpacity
					style={[
						styles.backTouchable,
						{
							opacity: tutorialSequenceMain < 10 ? 0 : 1,
							zIndex: tutorialSequenceMain === 10 ? 999 : 0,
							width: width * 0.13,
							height: width * 0.13,
						},
					]}
					onPress={() => {
						playSound("button_press");
						router.replace({
							pathname: "/ReviewScreen",
							params: {
								scoreArrayJSON: scoreArrayJSON,
								wrongAnswerArrayJSON: wrongAnswerArrayJSON,
								levelLandmarkListJSON: levelLandmarkListJSON,
								timeTakenArrayJSON: timeTakenArrayJSON,
								categoryJSON: categoryJSON,
							},
						});
					}}
				>
					<Image
						source={icons.back_button}
						style={{
							width: width * 0.13,
							height: width * 0.13,
						}}
						resizeMode="contain"
					/>
				</TouchableOpacity>

				{/* Title with question number and time taken */}
				<View
					style={[
						styles.titleView,
						{
							zIndex:
								tutorialSequenceMain === 1 &&
								tutorialSequenceSub[1] === 1
									? 999
									: 0,
							minHeight: height * 0.05,
							width: width * 0.25,
						},
					]}
				>
					<Text
						style={[
							styles.titleText,
							{ fontSize: width < 600 ? 30 : 30 * 1.25 },
						]}
					>
						Q{index + 1}
					</Text>
					<Text
						style={{
							fontSize: width < 600 ? 20 : 20 * 1.25,
							color: colors.text,
						}}
					>
						{index === 2
							? timeTakenArray[index].toFixed(1)
							: "N.A "}
						s
					</Text>
				</View>

				{/* Compass button */}
				<TouchableOpacity
					style={[
						styles.compassTouchable,
						{ width: width * 0.12, height: width * 0.12 },
					]}
					onPress={() => {
						playSound("button_press");
						stopRotation.current = true;
						cancelRotationFrame();
						// Reset heading programmatically
						if (heading !== 0) {
							cameraRef.current?.setStop({
								bearing: 0,
								duration: 300,
								easing: "fly",
							});
						} else {
							cameraRef.current?.setStop({
								zoom: 16,
								pitch: 45,
								duration: 3000,
								easing: "fly",
								center: levelLandmarkList[index].coordinates,
							});
						}
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
				style={[styles.bottomUIView, { bottom: insets.bottom + 100 }]}
			>
				{/* Previous / next landmark buttons */}
				{tutorialSequenceMain >= 7 && (
					<TouchableOpacity
						style={[
							styles.prevLandmarkTouchable,
							{
								zIndex: tutorialSequenceMain === 7 ? 999 : 0,
								width: width * 0.12,
								height: width * 0.12,
							},
						]}
						onPress={() => {
							playSound("button_press");
							if (tutorialSequenceMain === 8) {
								setTutorialSequenceMain((prev) => prev + 1);
							}
							if (tutorialSequenceMain === 7) {
								setTutorialSequenceMain((prev) => prev + 2);
							}
							cancelRotationFrame();
							clearRotationTimeout();
							rotationHeading.current = 0;
							stopRotation.current = false;
							setIndex(
								(prev) =>
									(prev - 1 + levelLandmarkList.length) %
									levelLandmarkList.length,
							);
						}}
					>
						<Image
							source={icons.prev_button}
							style={{
								width: width * 0.12,
								height: width * 0.12,
							}}
							resizeMode="contain"
						/>
					</TouchableOpacity>
				)}

				{tutorialSequenceMain >= 7 && (
					<TouchableOpacity
						style={[
							styles.nextLandmarkTouchable,
							{
								zIndex: tutorialSequenceMain === 7 ? 999 : 0,
								width: width * 0.12,
								height: width * 0.12,
							},
						]}
						onPress={() => {
							playSound("button_press");
							if (tutorialSequenceMain === 8) {
								setTutorialSequenceMain((prev) => prev + 1);
							}
							if (tutorialSequenceMain === 7) {
								setTutorialSequenceMain((prev) => prev + 2);
							}
							cancelRotationFrame();
							clearRotationTimeout();
							rotationHeading.current = 0;
							stopRotation.current = false;
							setIndex(
								(prev) => (prev + 1) % levelLandmarkList.length,
							);
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
				)}
			</View>

			{/* Cover for review card */}
			{tutorialSequenceMain === 4 && tutorialSequenceSub[4] === 0 && (
				<TouchableOpacity
					style={{
						position: "absolute",
						top: cardPosition.y,
						left: cardPosition.x,
						width: cardPosition.width,
						alignSelf: "center",
						zIndex:
							tutorialSequenceMain === 4 &&
							tutorialSequenceSub[4] === 0
								? 999
								: 0,
					}}
					onPress={() => {
						playSound("button_press");
						if (
							tutorialSequenceMain === 4 &&
							tutorialSequenceSub[4] === 0
						) {
							setTutorialSequenceMain((prev) => prev + 2);
						}
						toggleSheet();
					}}
				>
					<ReviewCard
						index={index}
						correct={scoreArray[index] > 0}
						wrongAnswers={wrongAnswerArray[index]}
						landmarkData={levelLandmarkList[index]}
						arrow={expanded ? "up" : "down"}
					/>
				</TouchableOpacity>
			)}

			{/* Actual review card */}
			<Animated.View
				style={[
					styles.reviewCardTouchable,
					{
						transform: [{ translateY }],
						bottom: insets.bottom + 15 - 200,
						zIndex:
							tutorialSequenceMain === 1 &&
							tutorialSequenceSub[1] == 2
								? 999
								: 0,
					},
				]}
			>
				<TouchableOpacity
					ref={cardRef}
					onPress={() => {
						playSound("button_press");
						if (
							tutorialSequenceMain === 2 ||
							tutorialSequenceMain === 5
						) {
							setTutorialSequenceMain((prev) => prev + 1);
						}
						if (
							tutorialSequenceMain === 1 &&
							tutorialSequenceSub[1] === 2
						) {
							setTutorialSequenceMain((prev) => prev + 2);
						}
						toggleSheet();
					}}
					style={{
						zIndex:
							tutorialSequenceMain === 4 &&
							tutorialSequenceSub[4] == 0
								? 999
								: 0,
					}}
				>
					<ReviewCard
						index={index}
						correct={scoreArray[index] > 0}
						wrongAnswers={wrongAnswerArray[index]}
						landmarkData={levelLandmarkList[index]}
						arrow={expanded ? "up" : "down"}
					/>
				</TouchableOpacity>
				<ScrollView
					style={[
						styles.wrongAnswerScrollView,
						{
							opacity: expanded ? 1 : 0,
						},
					]}
					contentContainerStyle={{
						justifyContent: "center",
						alignItems: "center",
						padding: 15,
						gap: 10,
					}}
				>
					<Text
						style={{
							fontWeight: "bold",
							fontSize: 18,
							color: colors.text,
						}}
					>
						Submitted answers:
					</Text>
					{wrongAnswerArray[index]?.map(
						(value: string, i: number) => (
							<Text
								key={i}
								style={{
									backgroundColor: colors.hardWrong,
									borderRadius: 999,
									paddingHorizontal: 8,
									fontSize: 16,
									textAlign: "center",
									color: colors.text,
								}}
							>
								{value}
							</Text>
						),
					)}
				</ScrollView>
			</Animated.View>

			{tutorialSequenceMain === 1 && (
				<TouchableOpacity
					style={styles.blackTranslucentView}
					activeOpacity={1}
					onPress={() => {
						if (tutorialSequenceSub[1] < 2) {
							setTutorialSequenceSub((prev) => {
								const temp = [...prev];
								temp[1] += 1;
								return temp;
							});
						} else {
							setTutorialSequenceMain((prev) => prev + 1);
						}
					}}
				>
					{tutorialSequenceSub[1] === 0 && (
						<TutorialCard
							text="This is the detailed review."
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}

					{tutorialSequenceSub[1] === 1 && (
						<TutorialCard
							text="This shows the question number and time taken for the question."
							positionStyle={{
								top:
									insets.top +
									(height - insets.bottom - insets.top) *
										0.12,
							}}
						/>
					)}
					{tutorialSequenceSub[1] === 2 && (
						<TutorialCard
							text="Press here to view any wrong answers previously submitted."
							positionStyle={{ bottom: insets.bottom + 100 }}
						/>
					)}
				</TouchableOpacity>
			)}

			{tutorialSequenceMain === 4 && (
				<TouchableOpacity
					style={styles.blackTranslucentView}
					activeOpacity={1}
					onPress={() => {
						setTutorialSequenceMain((prev) => prev + 1);
					}}
				>
					{tutorialSequenceSub[4] === 0 && (
						<TutorialCard
							text="Press the card again to close the view."
							positionStyle={{ bottom: insets.bottom + 290 }}
						/>
					)}
				</TouchableOpacity>
			)}

			{tutorialSequenceMain === 7 && (
				<TouchableOpacity
					style={styles.blackTranslucentView}
					activeOpacity={1}
					onPress={() => {
						setTutorialSequenceMain((prev) => prev + 1);
					}}
				>
					{tutorialSequenceSub[7] === 0 && (
						<TutorialCard
							text="Press these to go to the next / previous landmark."
							positionStyle={{
								bottom:
									insets.bottom +
									(height - insets.bottom - insets.top) * 0.2,
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
						setTutorialSequenceMain((prev) => prev + 1);
					}}
				>
					{tutorialSequenceSub[10] === 0 && (
						<TutorialCard
							text="Finally, press this to go back to the review page. That's all for this tutorial. Have fun!"
							positionStyle={{
								top:
									insets.top +
									(height - insets.bottom - insets.top) *
										0.11,
							}}
						/>
					)}
				</TouchableOpacity>
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
	backTouchable: {
		backgroundColor: colors.primary,
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	titleView: {
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 10,
		backgroundColor: "rgba(255,255,255,0.4)",
	},
	titleText: {
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
	bottomUIView: {
		position: "absolute",
		justifyContent: "space-between",
		flexDirection: "row",
		width: "100%",
		paddingHorizontal: 20,
	},
	nextLandmarkTouchable: {
		backgroundColor: colors.primary,
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	prevLandmarkTouchable: {
		backgroundColor: colors.primary,
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	reviewCardTouchable: {
		position: "absolute",
		width: "90%",
		alignSelf: "center",
	},
	wrongAnswerScrollView: {
		width: "100%",
		backgroundColor: colors.background,
		height: 200,
		borderRadius: 10,
	},
	blackTranslucentView: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.5)", // 50% black overlay
		justifyContent: "center",
		alignItems: "center",
	},
});
