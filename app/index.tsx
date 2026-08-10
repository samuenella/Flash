import {
	View,
	Text,
	TouchableOpacity,
	ImageBackground,
	Image,
	StyleSheet,
	Linking,
	useWindowDimensions,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import OptionsPage from "@/components/OptionsPage";
import { icons } from "@/constants/icons";
import { fonts } from "@/constants/fonts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { useAudio } from "@/context/AudioContext";
import { hasSeenTutorial, markTutorialComplete } from "@/utils/tutorialCheck";
import CreditsPage from "@/components/CreditsPage";
import LongButton from "@/components/LongButton";

export default function Index() {
	const insets = useSafeAreaInsets();
	const [optionsScreen, setOptionsScreen] = useState(false);
	const [aboutScreen, setAboutScreen] = useState(false);
	const [creditScreen, setCreditScreen] = useState(false);
	const [tutorialPopUp, setTutorialPopUp] = useState(false);
	const [categoryScreen, setCategoryScreen] = useState(false);
	const [landmarkScreen, setLandmarkScreen] = useState(false);
	const [regionScreen, setRegionScreen] = useState(false);
	const { playSound, playMusic } = useAudio();
	const { width, height } = useWindowDimensions();
	const privacyPolicyLink =
		"https://samuenella.github.io/Flash-privacy-policy/";

	useEffect(() => {
		playMusic("menu_music");
		playSound("silence"); // Initialise the sound system with a silent sound to prevent delays on first real sound effect later on
	}, []);

	return (
		<ImageBackground
			source={require("@/assets/images/main_menu_bg.png")}
			style={styles.imageBackground}
		>
			{!categoryScreen && !landmarkScreen && !regionScreen && (
				<>
					{/* Title */}
					<Text
						style={[
							styles.titleText,
							{
								fontSize: width < 600 ? 60 : 60 * 1.25,
							},
						]}
					>
						-FLASH-
					</Text>

					{/* Empty view for spacing */}
					<View
						style={{
							height: "50%",
						}}
					></View>

					{/* Play button */}
					<LongButton
						onPress={async () => {
							playSound("button_press");
							const seen = await hasSeenTutorial();

							if (!seen) {
								// First time - show tutorial
								setTutorialPopUp(true);
							} else {
								// Not first time - go straight to game
								setCategoryScreen(true);
							}
						}}
						title="Play"
						buttonWidth={width * 0.4}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.1
						}
						screenWidth={width}
					/>

					{/* Options button */}
					<LongButton
						onPress={() => {
							setOptionsScreen(!optionsScreen);
							playSound("button_press");
						}}
						title="Options"
						buttonWidth={width * 0.4}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.1
						}
						screenWidth={width}
					/>
				</>
			)}

			{/* About button */}
			{!categoryScreen && !landmarkScreen && !regionScreen && (
				<TouchableOpacity
					style={{
						position: "absolute",
						bottom: insets.bottom + 10,
						right: 10,
						justifyContent: "center",
						alignItems: "center",
						backgroundColor: colors.primary,
						width: width * 0.12,
						height: width * 0.12,
						borderRadius: 999,
						borderWidth: 1,
					}}
					onPress={() => {
						playSound("button_press");
						setAboutScreen(true);
					}}
				>
					<Image
						source={icons.about_button}
						style={{
							width: width * 0.12 * 0.9,
							height: width * 0.12 * 0.9,
							marginTop: 0.5, // DEV IDK
							marginLeft: 0.1,
						}}
						resizeMode="contain"
					/>
				</TouchableOpacity>
			)}

			{tutorialPopUp && (
				<View style={styles.blackTranslucentView}>
					<TouchableOpacity
						style={StyleSheet.absoluteFill}
						activeOpacity={1}
						onPress={() => setTutorialPopUp(false)}
					/>
					<View
						style={[
							styles.skipTutorialView,
							{ width: width * 0.8, height: height * 0.2 },
						]}
					>
						{/* Play Tutorial? */}
						<Text
							style={{
								color: colors.text,
								fontSize: width < 600 ? 35 : 35 * 1.5,
								fontWeight: "bold",
								marginBottom: 30,
							}}
						>
							Play tutorial?
						</Text>

						{/* Tick Button */}
						<TouchableOpacity
							style={[
								styles.skipYesTouchable,
								{ right: width * 0.1, bottom: -width * 0.09 },
							]}
							onPress={async () => {
								playSound("button_press");
								await markTutorialComplete();
								router.replace("/TutorialMapScreen");
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

						{/* Cross Button */}
						<TouchableOpacity
							style={[
								styles.skipNoTouchable,
								{ left: width * 0.1, bottom: -width * 0.09 },
							]}
							onPress={async () => {
								playSound("button_press");
								await markTutorialComplete();
								setTutorialPopUp(false);
								setCategoryScreen(true);
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

			{aboutScreen && (
				<View style={styles.blackTranslucentView}>
					<TouchableOpacity
						style={StyleSheet.absoluteFill}
						activeOpacity={1}
						onPress={() => setAboutScreen(false)}
					/>
					<View
						style={[
							styles.aboutView,
							{
								width: width * 0.75,
							},
						]}
					>
						{/* X Button */}
						<TouchableOpacity
							style={[
								styles.aboutClose,
								{ top: -width * 0.05, right: -width * 0.05 },
							]}
							onPress={() => {
								playSound("button_press");
								setAboutScreen(false);
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
								marginBottom: 20,
							}}
						>
							ABOUT
						</Text>

						{/*Feedback button*/}
						<LongButton
							title="Feedback"
							onPress={() => {
								playSound("button_press");
								setAboutScreen(false);
								router.push("/FeedbackScreen");
							}}
							buttonWidth={width * 0.4}
							buttonHeight={
								(height - insets.top - insets.bottom) * 0.1
							}
							screenWidth={width}
						/>

						{/*Credits button*/}
						<LongButton
							title="Credits"
							onPress={() => {
								playSound("button_press");
								setAboutScreen(false);
								setCreditScreen(true);
							}}
							buttonWidth={width * 0.4}
							buttonHeight={
								(height - insets.top - insets.bottom) * 0.1
							}
							screenWidth={width}
						/>

						{/*Privacy button*/}
						<LongButton
							title="Privacy"
							onPress={() => {
								playSound("button_press");
								setAboutScreen(false);
								Linking.openURL(privacyPolicyLink);
							}}
							buttonWidth={width * 0.4}
							buttonHeight={
								(height - insets.top - insets.bottom) * 0.1
							}
							screenWidth={width}
						/>
					</View>
				</View>
			)}

			{optionsScreen && (
				<OptionsPage
					onClose={() => setOptionsScreen(false)}
					quitButton={false}
					tutorialButton={true}
				/>
			)}

			{creditScreen && (
				<CreditsPage
					onClose={() => {
						setCreditScreen(false);
					}}
				/>
			)}

			{/*Category Selection Screen*/}
			{categoryScreen && (
				<View style={styles.blackTranslucentView}>
					<Text
						style={[
							styles.labelTitleText,
							{ fontSize: width < 600 ? 50 : 50 * 1.25 },
						]}
					>
						CATEGORY
					</Text>

					{/* Leaderboard button */}
					<TouchableOpacity
						style={{
							position: "absolute",
							top: insets.top + 10,
							right: 10,
							justifyContent: "center",
							alignItems: "center",
							backgroundColor: colors.primary,
							width: width * 0.12,
							height: width * 0.12,
							borderRadius: 999,
							borderWidth: 1,
						}}
						onPress={() => {
							playSound("button_press");
							router.push("/LeaderboardScreen");
						}}
					>
						<Image
							source={icons.leaderboard_button}
							style={{
								width: width * 0.12 * 0.9,
								height: width * 0.12 * 0.9,
								marginTop: 0.1, // DEV IDK
								marginLeft: 0.1,
							}}
							resizeMode="contain"
						/>
					</TouchableOpacity>

					{/* Daily Challenge button */}
					<LongButton
						onPress={() => {
							playSound("button_press");
							router.replace({
								pathname: "/MapTimerScreen",
								params: { label: "Daily" },
							});
						}}
						title="Daily Challenge"
						buttonWidth={width * 0.6}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.15
						}
						screenWidth={width}
					/>

					{/* Landmarks button */}
					<LongButton
						onPress={() => {
							playSound("button_press");
							setCategoryScreen(false);
							setLandmarkScreen(true);
						}}
						title="Landmarks"
						buttonWidth={width * 0.6}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.15
						}
						screenWidth={width}
					/>

					{/* Regions button */}
					<LongButton
						onPress={() => {
							playSound("button_press");
							setCategoryScreen(false);
							setRegionScreen(true);
						}}
						title="Regions"
						buttonWidth={width * 0.6}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.15
						}
						screenWidth={width}
					/>

					{/* Back button */}
					<LongButton
						onPress={() => {
							playSound("button_press");
							setCategoryScreen(false);
						}}
						title="Back"
						buttonWidth={width * 0.3}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.1
						}
						screenWidth={width}
						customStyles={{
							position: "absolute",
							bottom: insets.bottom + 10,
						}}
					/>
				</View>
			)}

			{landmarkScreen && (
				<View style={styles.blackTranslucentView}>
					<Text
						style={[
							styles.labelTitleText,
							{ fontSize: width < 600 ? 50 : 50 * 1.25 },
						]}
					>
						LANDMARKS
					</Text>

					{/* Tourist Spots button */}
					<LongButton
						onPress={() => {
							playSound("button_press");
							router.replace({
								pathname: "/MapTimerScreen",
								params: { label: "Tourist" },
							});
						}}
						title="Tourist Spots"
						buttonWidth={width * 0.6}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.15
						}
						screenWidth={width}
					/>

					{/* Shopping Malls button */}
					<LongButton
						onPress={() => {
							playSound("button_press");
							router.replace({
								pathname: "/MapTimerScreen",
								params: { label: "Malls" },
							});
						}}
						title="Shopping Malls"
						buttonWidth={width * 0.6}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.15
						}
						screenWidth={width}
					/>

					{/* Back button */}
					<LongButton
						onPress={() => {
							playSound("button_press");
							setCategoryScreen(true);
							setLandmarkScreen(false);
						}}
						title="Back"
						buttonWidth={width * 0.3}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.1
						}
						screenWidth={width}
						customStyles={{
							position: "absolute",
							bottom: insets.bottom + 10,
						}}
					/>
				</View>
			)}

			{regionScreen && (
				<View style={styles.blackTranslucentView}>
					<Text
						style={[
							styles.labelTitleText,
							{ fontSize: width < 600 ? 50 : 50 * 1.25 },
						]}
					>
						REGIONS
					</Text>

					{/* North button */}
					<LongButton
						onPress={() => {
							playSound("button_press");
							router.replace({
								pathname: "/MapTimerScreen",
								params: { label: "North" },
							});
						}}
						title="North"
						buttonWidth={width * 0.5}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.12
						}
						screenWidth={width}
					/>

					{/* Northeast button */}
					<LongButton
						onPress={() => {
							playSound("button_press");
							router.replace({
								pathname: "/MapTimerScreen",
								params: { label: "Northeast" },
							});
						}}
						title="Northeast"
						buttonWidth={width * 0.5}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.12
						}
						screenWidth={width}
					/>

					{/* Central button */}
					<LongButton
						onPress={() => {
							playSound("button_press");
							router.replace({
								pathname: "/MapTimerScreen",
								params: { label: "Central" },
							});
						}}
						title="Central"
						buttonWidth={width * 0.5}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.12
						}
						screenWidth={width}
					/>

					{/* East button */}
					<LongButton
						onPress={() => {
							playSound("button_press");
							router.replace({
								pathname: "/MapTimerScreen",
								params: { label: "East" },
							});
						}}
						title="East"
						buttonWidth={width * 0.5}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.12
						}
						screenWidth={width}
					/>

					{/* West button */}
					<LongButton
						onPress={() => {
							playSound("button_press");
							router.replace({
								pathname: "/MapTimerScreen",
								params: { label: "West" },
							});
						}}
						title="West"
						buttonWidth={width * 0.5}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.12
						}
						screenWidth={width}
					/>

					{/* Padding View */}
					<View style={{ height: "10%" }} />

					{/* Back button */}
					<LongButton
						onPress={() => {
							playSound("button_press");
							setCategoryScreen(true);
							setRegionScreen(false);
						}}
						title="Back"
						buttonWidth={width * 0.3}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.1
						}
						screenWidth={width}
						customStyles={{
							position: "absolute",
							bottom: insets.bottom + 10,
						}}
					/>
				</View>
			)}
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	imageBackground: {
		position: "absolute",
		flex: 1,
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	blackTranslucentView: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.5)", // 50% black overlay
	},
	titleText: {
		position: "absolute",
		top: 60,
		fontFamily: "Monoton",
		color: colors.primary,
	},
	labelTitleText: {
		color: "white",
		fontWeight: "200",
		marginBottom: 30,
	},
	skipTutorialView: {
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
	aboutView: {
		borderRadius: 30,
		backgroundColor: colors.background,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	aboutClose: {
		position: "absolute",
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.hardWrong,
	},
});
