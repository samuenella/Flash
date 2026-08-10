import {
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	Image,
	ScrollView,
	TextInput,
	Keyboard,
	TouchableWithoutFeedback,
	useWindowDimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useState } from "react";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import OptionsPage from "@/components/OptionsPage";
import ReviewCard from "@/components/ReviewCard";
import { useAudio } from "@/context/AudioContext";
import { addLeaderboard } from "@/services/appwrite";
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
	const [boardSubmitScreen, setBoardSubmitScreen] = useState(false);
	const [submitConfirmedScreen, setSubmitConfirmedScreen] = useState(false);
	const [submittedFlag, setSubmittedFlag] = useState(false);
	const [username, setUsername] = useState("");
	const [doubleSubmitScreen, setDoubleSubmitScreen] = useState(false);

	const scoreArray = JSON.parse(scoreArrayJSON);
	const wrongAnswerArray = JSON.parse(wrongAnswerArrayJSON);
	const levelLandmarkList = JSON.parse(levelLandmarkListJSON);
	const timeTakenArray = JSON.parse(timeTakenArrayJSON);
	const category = JSON.parse(categoryJSON);
	const { playSound, playMusic } = useAudio();

	const totalScore = scoreArray.reduce((a: any, b: any) => a + b, 0);

	useEffect(() => {
		playMusic("review_music");
	}, []);

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			<View style={styles.page}>
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
						},
					]}
					onPress={() => {
						playSound("button_press");
						setSplitScreen(true);
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
						{totalScore} / {scoreArray.length}
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
						Time taken:{" "}
						{/* Do not show time taken if it's tutorial */}
						{timeTakenArray.length !== 3
							? timeTakenArray
									.reduce((a: number, b: number) => a + b, 0)
									.toFixed(1)
							: "-"}
						s
					</Text>
				</View>

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
							style={{ width: "100%" }}
							onPress={() => {
								playSound("button_press");
								router.push({
									pathname: "/ReviewMapScreen",
									params: {
										indexString: index.toString(),
										scoreArrayJSON: scoreArrayJSON,
										wrongAnswerArrayJSON:
											wrongAnswerArrayJSON,
										levelLandmarkListJSON:
											levelLandmarkListJSON,
										timeTakenArrayJSON: timeTakenArrayJSON,
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

						{/* Leaderboard button */}
						{category === "Daily" && (
							<TouchableOpacity
								style={[
									styles.leaderboardTouchableOpacity,
									{
										width: width * 0.13,
										height: width * 0.13,
									},
								]}
								onPress={() => {
									playSound("button_press");
									setBoardSubmitScreen(true);
								}}
							>
								<Image
									source={icons.leaderboard_button}
									style={{
										width: width * 0.115,
										height: width * 0.115,
									}}
									resizeMode="contain"
								/>
							</TouchableOpacity>
						)}
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
							}}
						/>
						<View
							style={[
								styles.splitScreenView,
								{ width: width * 0.8 },
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
									marginTop: 20,
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
							{timeTakenArray.map(
								(time: number, index: number) => (
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
												fontSize:
													width < 600
														? 20
														: 20 * 1.25,
												fontWeight: "bold",
												color: colors.text,
											}}
										>
											Q{index + 1}
										</Text>
										<Text
											style={{
												fontSize:
													width < 600
														? 20
														: 20 * 1.25,
												fontWeight: "bold",
												color: colors.text,
											}}
										>
											{time === 0 ? "-" : time.toFixed(2)}
											s
										</Text>
									</View>
								),
							)}
						</View>
					</View>
				)}

				{boardSubmitScreen && (
					<View style={styles.blackTranslucentView}>
						<TouchableOpacity
							style={StyleSheet.absoluteFill}
							activeOpacity={1}
							onPress={() => {
								setBoardSubmitScreen(false);
							}}
						/>
						<View
							style={[
								styles.splitScreenView,
								{ width: width * 0.8 },
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
									setBoardSubmitScreen(false);
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
									fontSize: width < 600 ? 35 : 35 * 1.25,
									fontWeight: "bold",
									color: colors.text,
									textAlign: "center",
									marginBottom: 20,
								}}
							>
								Leaderboard Submission
							</Text>

							{/* Username input */}
							<Text
								style={{
									fontSize: width < 600 ? 20 : 20 * 1.25,
									fontWeight: "bold",
									color: colors.text,
								}}
							>
								Username:
							</Text>

							<TextInput
								style={[
									styles.nameTextInput,
									{
										fontSize: width < 600 ? 18 : 18 * 1.25,
										height: height * 0.05,
									},
								]}
								placeholder="Type here..."
								value={username}
								onChangeText={setUsername}
								textAlign="center"
							/>

							{/* Example leaderboard card */}
							<View
								style={[
									styles.leaderboardCardView,
									{ height: height * 0.04 },
								]}
							>
								<Text
									style={{
										fontSize: width < 600 ? 20 : 20 * 1.25,
										fontWeight: "bold",
										width: "60%",
									}}
									numberOfLines={1}
									ellipsizeMode="tail"
								>
									<Text style={{ color: "#7C7C7C" }}>X</Text>{" "}
									{username}
								</Text>

								<Text
									style={{
										fontSize: width < 600 ? 20 : 20 * 1.25,
										fontWeight: "bold",
									}}
								>
									{totalScore}
									{"/10   "}
									{timeTakenArray
										.reduce(
											(a: number, b: number) => a + b,
											0,
										)
										.toFixed(1)}
									s
								</Text>
							</View>

							{/* View Leaderboard button */}
							<LongButton
								onPress={() => {
									playSound("button_press");
									router.push("/LeaderboardScreen");
								}}
								title="Leaderboard"
								buttonWidth={width * 0.6}
								buttonHeight={
									(height - insets.top - insets.bottom) * 0.1
								}
								screenWidth={width}
							/>

							{/* Submit button */}
							<LongButton
								onPress={() => {
									playSound("button_press");
									if (!submittedFlag) {
										setUsername("");
										addLeaderboard(
											username,
											totalScore,
											Number(
												timeTakenArray
													.reduce(
														(
															a: number,
															b: number,
														) => a + b,
														0,
													)
													.toFixed(1),
											),
										);
										setSubmitConfirmedScreen(true);
										setSubmittedFlag(true);
									} else {
										setDoubleSubmitScreen(true);
									}
								}}
								title="Submit"
								buttonWidth={width * 0.6}
								buttonHeight={
									(height - insets.top - insets.bottom) * 0.1
								}
								screenWidth={width}
							/>
						</View>
					</View>
				)}

				{submitConfirmedScreen && (
					<TouchableOpacity
						style={styles.blackTranslucentView}
						activeOpacity={1}
						onPress={() => {
							setSubmitConfirmedScreen(false);
						}}
					>
						<TutorialCard
							text="Submitted to leaderboards!"
							positionStyle={{ bottom: 100 }}
						/>
					</TouchableOpacity>
				)}

				{doubleSubmitScreen && (
					<TouchableOpacity
						style={styles.blackTranslucentView}
						activeOpacity={1}
						onPress={() => {
							setDoubleSubmitScreen(false);
						}}
					>
						<TutorialCard
							text="Can't submit again!"
							positionStyle={{ bottom: 100 }}
						/>
					</TouchableOpacity>
				)}
			</View>
		</TouchableWithoutFeedback>
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
		padding: 20,
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
	leaderboardCardView: {
		width: "90%",
		justifyContent: "space-between",
		borderRadius: 10,
		paddingHorizontal: 10,
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#EBFFEE",
		marginBottom: 40,
	},
	nameTextInput: {
		width: "90%",
		borderWidth: 1,
		borderRadius: 10,
		backgroundColor: "white",
		marginBottom: 20,
	},
	leaderboardTouchableOpacity: {
		position: "absolute",
		right: 20,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.primary,
		borderRadius: 999,
		borderWidth: 1,
	},
	bottomUIView: {
		flexDirection: "row",
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 10,
	},
});
