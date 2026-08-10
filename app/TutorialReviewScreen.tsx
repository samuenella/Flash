import {
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	Image,
	ScrollView,
	useWindowDimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useState, useRef } from "react";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/colors";
import OptionsPage from "@/components/OptionsPage";
import ReviewCard from "@/components/ReviewCard";
import { useAudio } from "@/context/AudioContext";
import TutorialCard from "@/components/TutorialCard";
import LongButton from "@/components/LongButton";

export default function ReviewScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();
	const {
		scoreArrayJSON,
		wrongAnswerArrayJSON,
		levelLandmarkListJSON,
		timeTakenArrayJSON,
		categoryJSON,
	} = useLocalSearchParams<{
		scoreArrayJSON: string;
		wrongAnswerArrayJSON: string;
		levelLandmarkListJSON: string;
		timeTakenArrayJSON: string;
		categoryJSON: string;
	}>();
	const [optionsScreen, setOptionsScreen] = useState(false);
	const [splitScreen, setSplitScreen] = useState(false);
	const scoreArray = JSON.parse(scoreArrayJSON);
	const wrongAnswerArray = JSON.parse(wrongAnswerArrayJSON);
	const levelLandmarkList = JSON.parse(levelLandmarkListJSON);
	const timeTakenArray = JSON.parse(timeTakenArrayJSON);
	const { playSound, playMusic } = useAudio();
	const [tutorialSequenceSub, setTutorialSequenceSub] = useState(
		Array(6).fill(0),
	);
	const [tutorialSequenceMain, setTutorialSequenceMain] = useState(0);

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

	useEffect(() => {
		if (tutorialSequenceMain === 0) {
			setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 1000);
		}
		if (tutorialSequenceMain === 4) {
			setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 500);
		}
	}, [tutorialSequenceMain]);

	useEffect(() => {
		playMusic("review_music");
		measureCard();
	}, []);

	return (
		<View style={styles.page}>
			{[0].includes(tutorialSequenceMain) && (
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

			{/* Menu Button */}
			<TouchableOpacity
				style={[
					styles.menuTouchable,
					{
						top: insets.top + 15,
						width: width * 0.13,
						height: width * 0.13,
					},
				]}
				onPress={() => {
					playSound("button_press");
					setOptionsScreen(true);
				}}
			>
				<Image
					source={icons.menu_button}
					style={{
						width: width * 0.13,
						height: width * 0.13,
					}}
					resizeMode="contain"
				/>
			</TouchableOpacity>

			{/* Splits Button */}
			<TouchableOpacity
				style={[
					styles.splitsTouchable,
					{
						top: insets.top + 15,
						width: width * 0.13,
						height: width * 0.13,
						zIndex:
							tutorialSequenceMain === 1 &&
							tutorialSequenceSub[1] === 2
								? 999
								: 0,
					},
				]}
				onPress={() => {
					playSound("button_press");
					setSplitScreen(true);
					if (
						tutorialSequenceMain === 1 &&
						tutorialSequenceSub[1] === 2
					) {
						setTutorialSequenceMain((prev) => prev + 2);
					} else if (tutorialSequenceMain === 2) {
						setTutorialSequenceMain((prev) => prev + 1);
					}
				}}
			>
				<Image
					source={icons.splits_button}
					style={{
						width: width * 0.13,
						height: width * 0.13,
					}}
					resizeMode="contain"
				/>
			</TouchableOpacity>

			<View
				style={{
					marginTop: insets.top + 5,
					paddingHorizontal: 10,
					marginBottom: 10,
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: colors.background,
					borderRadius: 10,
					zIndex:
						tutorialSequenceMain === 1 &&
						tutorialSequenceSub[1] === 1
							? 999
							: 0,
				}}
			>
				{/* Score Display */}
				<Text
					style={{
						fontSize: width < 600 ? 40 : 40 * 1.25,
						fontWeight: "bold",
						color: colors.text,
					}}
				>
					Score
				</Text>
				<Text
					style={{
						fontSize: width < 600 ? 30 : 30 * 1.25,
						fontWeight: "bold",
						color: colors.text,
					}}
				>
					{scoreArray.reduce((a: any, b: any) => a + b, 0)} /{" "}
					{scoreArray.length}
				</Text>

				{/* Time taken Display */}
				<Text
					style={{
						fontSize: width < 600 ? 20 : 20 * 1.25,
						fontWeight: "bold",
						color: colors.text,
						marginTop: 5,
					}}
				>
					Time taken: -s
				</Text>
			</View>

			{/**Replacement review card */}
			{tutorialSequenceMain === 5 && tutorialSequenceSub[5] === 0 && (
				<TouchableOpacity
					style={{
						position: "absolute",
						top: cardPosition.y,
						left: cardPosition.x,
						width: cardPosition.width,
						zIndex:
							tutorialSequenceMain === 5 &&
							tutorialSequenceSub[5] === 0
								? 999
								: 0,
					}}
					onPress={() => {
						playSound("button_press");
						router.push({
							pathname: "/TutorialReviewMapScreen",
							params: {
								indexString: "0",
								scoreArrayJSON: scoreArrayJSON,
								wrongAnswerArrayJSON: wrongAnswerArrayJSON,
								levelLandmarkListJSON: levelLandmarkListJSON,
								timeTakenArrayJSON: timeTakenArrayJSON,
								categoryJSON: categoryJSON,
							},
						});
					}}
				>
					<ReviewCard
						index={0}
						correct={true}
						wrongAnswers={wrongAnswerArray[0]}
						landmarkData={levelLandmarkList[0]}
					/>
				</TouchableOpacity>
			)}

			<ScrollView
				style={styles.cardScrollView}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					justifyContent: "center",
					alignItems: "center",
					padding: 15,
					gap: 10,
				}}
			>
				{scoreArray.map((value: number, index: number) => (
					<TouchableOpacity
						key={index}
						ref={index === 0 ? cardRef : null}
						style={{
							width: "100%",
							zIndex: 999,
						}}
						onPress={() => {
							playSound("button_press");
							router.push({
								pathname: "/TutorialReviewMapScreen",
								params: {
									indexString: index.toString(),
									scoreArrayJSON: scoreArrayJSON,
									wrongAnswerArrayJSON: wrongAnswerArrayJSON,
									levelLandmarkListJSON:
										levelLandmarkListJSON,
									timeTakenArrayJSON: timeTakenArrayJSON,
									categoryJSON: categoryJSON,
								},
							});
						}}
					>
						<ReviewCard
							index={index}
							correct={value > 0}
							wrongAnswers={wrongAnswerArray[index]}
							landmarkData={levelLandmarkList[index]}
						/>
					</TouchableOpacity>
				))}
			</ScrollView>

			{/**Outer view to handle bottom safe area */}
			<View
				style={{
					width: "100%",
					paddingBottom: insets.bottom,
				}}
			>
				{/**Inner view to handle horizontal positioning */}
				<View style={styles.bottomUIView}>
					{/* Finish button */}
					<LongButton
						onPress={() => {
							playSound("button_press");
							router.replace("/");
						}}
						title="Finish"
						buttonWidth={width * 0.4}
						buttonHeight={
							(width - insets.top - insets.bottom) * 0.16
						}
						screenWidth={width}
					/>
				</View>
			</View>

			{optionsScreen && (
				<OptionsPage onClose={() => setOptionsScreen(false)} />
			)}

			{splitScreen && (
				<View style={styles.blackTranslucentView}>
					<TouchableOpacity
						style={StyleSheet.absoluteFill}
						activeOpacity={1}
						onPress={() => {
							setSplitScreen(false);
							if (tutorialSequenceMain === 3) {
								setTutorialSequenceMain((prev) => prev + 1);
							}
						}}
					/>
					<View
						style={[
							styles.splitScreenView,
							{ width: width * 0.8, height: height * 0.6 },
						]}
					>
						<TouchableOpacity
							style={[
								styles.splitScreenClose,
								{
									top: -width * 0.05,
									right: -width * 0.05,
								},
							]}
							onPress={() => {
								playSound("button_press");
								setSplitScreen(false);
								if (tutorialSequenceMain === 3) {
									setTutorialSequenceMain((prev) => prev + 1);
								}
							}}
						>
							<Image
								source={icons.close_button}
								style={{
									width: width * 0.15,
									height: width * 0.15,
								}}
							/>
						</TouchableOpacity>

						{/* Title */}
						<Text
							style={{
								fontSize: width < 600 ? 40 : 40 * 1.25,
								fontWeight: "bold",
								position: "absolute",
								top: 25,
								color: colors.text,
							}}
						>
							Splits
						</Text>

						{/* Total time */}
						<Text
							style={{
								fontSize: width < 600 ? 25 : 25 * 1.25,
								fontWeight: "bold",
								marginBottom: 20,
								marginTop: 60,
								color: colors.text,
							}}
						>
							Total time:{" "}
							{timeTakenArray.length === 3
								? "-"
								: timeTakenArray
										.reduce(
											(a: number, b: number) => a + b,
											0,
										)
										.toFixed(2)}
							s
						</Text>

						{/* Individual splits */}
						{timeTakenArray.map((time: number, index: number) => (
							<View
								style={{
									flexDirection: "row",
									justifyContent: "space-between",
									width: "60%",
								}}
								key={index}
							>
								<Text
									style={{
										fontSize: width < 600 ? 20 : 20 * 1.25,
										fontWeight: "bold",
										color: colors.text,
									}}
								>
									Q{index + 1}
								</Text>
								<Text
									style={{
										fontSize: width < 600 ? 20 : 20 * 1.25,
										fontWeight: "bold",
										color: colors.text,
									}}
								>
									{time !== 0 ? time.toFixed(2) : "-"}s
								</Text>
							</View>
						))}
					</View>
				</View>
			)}

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
							text="This is the review page."
							positionStyle={{ bottom: insets.bottom + 50 }}
						/>
					)}
					{tutorialSequenceSub[1] === 1 && (
						<TutorialCard
							text="Your results are shown here"
							positionStyle={{
								top:
									insets.top +
									(height - insets.top - insets.bottom) * 0.2,
							}}
						/>
					)}
					{tutorialSequenceSub[1] === 2 && (
						<TutorialCard
							text="Press this to show your time taken for each question."
							positionStyle={{
								top:
									insets.top +
									(height - insets.top - insets.bottom) *
										0.11,
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
						setTutorialSequenceMain((prev) => prev + 1);
					}}
				>
					{tutorialSequenceSub[5] === 0 && (
						<TutorialCard
							text="Press this to open a detailed review."
							positionStyle={{
								top:
									insets.top +
									(height - insets.bottom - insets.top) *
										0.32,
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
		alignItems: "center",
		backgroundColor: colors.background,
	},
	menuTouchable: {
		position: "absolute",
		left: 20,
		backgroundColor: colors.primary,
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	cardScrollView: {
		flexGrow: 1,
		width: "80%",
		borderColor: "#000000",
		backgroundColor: colors.primary,
		borderWidth: 1,
		borderRadius: 10,
		marginBottom: 10,
	},
	blackTranslucentView: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.5)", // 50% black overlay
	},
	splitScreenView: {
		borderRadius: 30,
		backgroundColor: colors.background,
		justifyContent: "center",
		alignItems: "center",
	},
	splitScreenClose: {
		position: "absolute",
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.hardWrong,
	},
	splitsTouchable: {
		position: "absolute",
		right: 20,
		backgroundColor: colors.primary,
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	bottomUIView: {
		flexDirection: "row",
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
});
