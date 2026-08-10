import {
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	Image,
	TextInput,
	KeyboardAvoidingView,
	Keyboard,
	TouchableWithoutFeedback,
	useWindowDimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useAudio } from "@/context/AudioContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/colors";
import { useRouter } from "expo-router";
import { fonts } from "@/constants/fonts";
import { addFeedback } from "@/services/appwrite";
import TutorialCard from "@/components/TutorialCard";
import LongButton from "@/components/LongButton";

export default function FeedbackScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { playSound, playMusic } = useAudio();
	const [confirmFeedback, setConfirmFeedback] = useState(false);
	const [feedbackText, setFeedbackText] = useState("");
	const [submissionConfirmation, setSubmissionConfirmation] = useState(false);
	const { width, height } = useWindowDimensions();

	useEffect(() => {
		playMusic("menu_music");
	}, []);

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			<View style={styles.page}>
				<View style={[styles.topUIView, { top: insets.top + 10 }]}>
					{/* Back Button */}
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

					{/* Title */}
					<Text
						style={[
							styles.title,
							{ fontSize: width < 600 ? 40 : 40 * 1.25 },
						]}
					>
						Feedback
					</Text>
				</View>

				{/* Content */}
				<Text
					style={[
						styles.contentText,
						{ fontSize: width < 600 ? 20 : 20 * 1.25 },
					]}
				>
					As this game is still under development, your feedback is
					greatly appreciated!
				</Text>

				{/* Text box*/}
				<KeyboardAvoidingView behavior="padding">
					<TextInput
						style={[
							styles.textInput,
							{
								height: height * 0.3,
								fontSize: width < 600 ? 16 : 16 * 1.25,
							},
						]}
						onChangeText={setFeedbackText}
						value={feedbackText}
						placeholder="Enter your feedback here..."
						placeholderTextColor={colors.text}
						multiline={true}
						textAlignVertical="top"
					/>
				</KeyboardAvoidingView>

				{/* Submit Button */}
				<LongButton
					onPress={() => {
						playSound("button_press");
						setConfirmFeedback(true);
					}}
					title="Submit"
					buttonWidth={width * 0.4}
					buttonHeight={height * 0.08}
					screenWidth={width}
					customStyles={{
						position: "absolute",
						bottom: insets.bottom + 20,
						alignSelf: "center",
					}}
				/>

				{confirmFeedback && (
					<View style={styles.blackTranslucentView}>
						<TouchableOpacity
							style={StyleSheet.absoluteFill}
							activeOpacity={1}
							onPress={() => setConfirmFeedback(false)}
						/>
						<View
							style={[
								styles.confirmSubmissionView,
								{ width: width * 0.8, height: height * 0.23 },
							]}
						>
							<Text
								style={{
									color: colors.text,
									fontSize: width < 600 ? 35 : 35 * 1.25,
									fontWeight: "bold",
									textAlign: "center",
									marginBottom: 30,
								}}
							>
								Confirm Submission?
							</Text>
							<TouchableOpacity
								style={[
									styles.confirmSubmissionYesTouchable,
									{
										right: width * 0.1,
										bottom: -width * 0.09,
									},
								]}
								onPress={async () => {
									playSound("button_press");
									addFeedback(feedbackText); // submit feedback to database
									setConfirmFeedback(false);
									setFeedbackText("");
									setSubmissionConfirmation(true);
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
									styles.confirmSubmissionNoTouchable,
									{
										left: width * 0.1,
										bottom: -width * 0.09,
									},
								]}
								onPress={() => {
									playSound("button_press");
									setConfirmFeedback(false);
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

				{submissionConfirmation && (
					<TouchableOpacity
						style={[styles.blackTranslucentView]}
						activeOpacity={1}
						onPress={() => {
							setSubmissionConfirmation(false);
						}}
					>
						<TutorialCard
							text="Feedback submitted!"
							positionStyle={{ bottom: 80 }}
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
		backgroundColor: colors.background,
		justifyContent: "center",
	},
	topUIView: {
		position: "absolute",
		width: "100%",
		height: "8%",
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		position: "absolute",
		alignSelf: "center",
		fontWeight: "bold",
		color: colors.text,
	},
	backTouchable: {
		position: "absolute",
		left: 20,
		backgroundColor: colors.primary,
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	contentText: {
		color: colors.text,
		alignSelf: "center",
		textAlign: "center",
	},
	textInput: {
		borderWidth: 1,
		borderRadius: 10,
		margin: 20,
		padding: 10,
		backgroundColor: colors.primary,
	},
	blackTranslucentView: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.5)", // 50% black overlay
	},
	confirmSubmissionView: {
		borderRadius: 30,
		backgroundColor: colors.background,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	confirmSubmissionYesTouchable: {
		position: "absolute",
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.hardCorrect,
	},
	confirmSubmissionNoTouchable: {
		position: "absolute",
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.hardWrong,
	},
});
