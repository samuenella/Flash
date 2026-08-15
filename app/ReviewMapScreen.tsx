// ReviewMapScreen.tsx
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
	const [highlightLandmark, setHighlightLandmark] = useState(true); // Review Map screen does not have toggle highlight, js keep here in case
	const {
		indexString,
		scoreArrayJSON,
		wrongAnswerArrayJSON,
		levelLandmarkListJSON,
		timeTakenArrayJSON,
	} = useLocalSearchParams<{
		indexString: string;
		scoreArrayJSON: string;
		wrongAnswerArrayJSON: string;
		levelLandmarkListJSON: string;
		timeTakenArrayJSON: string;
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

	// UI related declarations
	const translateY = useRef(new Animated.Value(0)).current;
	const [expanded, setExpanded] = useState(false);
	const { playSound } = useAudio();

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
		initCamera(); // needed here since for every index change, the camera needs to be re-initialized to the new landmark's coordinates
		return () => {
			cancelRotationFrame();
			clearRotationTimeout();
		};
	}, [index]);

	return (
		<View style={styles.page}>
			<Map
				ref={mapRef}
				style={styles.mapView}
				mapStyle={require("@/assets/mapData.json")}
				compass={false}
				logo={false}
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
					landmarkID={levelLandmarkList[index].landmarkID}
				/>
			</Map>

			<View style={[styles.topUIView, { top: insets.top + 15 }]}>
				<TouchableOpacity
					style={[
						styles.backTouchable,
						{ width: width * 0.13, height: width * 0.13 },
					]}
					onPress={() => {
						playSound("button_press");
						router.back();
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

				<View
					style={[
						styles.titleView,
						{ minHeight: height * 0.05, width: width * 0.25 },
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
						{timeTakenArray[index] === 0
							? "N.A "
							: timeTakenArray[index]?.toFixed(1)}
						s
					</Text>
				</View>

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
				<TouchableOpacity
					style={[
						styles.prevLandmarkTouchable,
						{ width: width * 0.12, height: width * 0.12 },
					]}
					onPress={() => {
						playSound("button_press");
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

				<TouchableOpacity
					style={[
						styles.nextLandmarkTouchable,
						{ width: width * 0.12, height: width * 0.12 },
					]}
					onPress={() => {
						playSound("button_press");
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
			</View>

			<Animated.View
				style={[
					styles.reviewCardTouchable,
					{
						transform: [{ translateY }],
						bottom: insets.bottom + 15 - 200,
					},
				]}
			>
				<TouchableOpacity
					onPress={() => {
						playSound("button_press");
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
					<Text style={styles.submittedAnswerText}>
						Submitted answers:
					</Text>
					{wrongAnswerArray[index]?.map(
						(value: string, i: number) => (
							<Text key={i} style={styles.wrongAnswerText}>
								{value}
							</Text>
						),
					)}
				</ScrollView>
			</Animated.View>
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
	submittedAnswerText: {
		fontWeight: "bold",
		fontSize: 18,
		color: colors.text,
	},
	wrongAnswerText: {
		backgroundColor: colors.hardWrong,
		borderRadius: 999,
		paddingHorizontal: 8,
		fontSize: 16,
		textAlign: "center",
		color: colors.text,
	},
});
