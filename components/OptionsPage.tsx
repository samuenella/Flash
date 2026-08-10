import {
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	Image,
	useWindowDimensions,
} from "react-native";
import React from "react";
import Slider from "@react-native-community/slider";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/colors";
import { useAudio } from "@/context/AudioContext";
import { useRouter } from "expo-router";
import { useSettings } from "@/context/SettingsContext";
import { markTutorialComplete } from "@/utils/tutorialCheck";
import LongButton from "@/components/LongButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OptionsPage({
	onClose,
	quitButton = true,
	tutorialButton = false,
}: any) {
	const router = useRouter();
	const {
		musicVolume,
		setMusicVolume,
		sfxVolume,
		setSfxVolume,
		vibrationsEnabled,
		setVibrationsEnabled,
	} = useSettings()!;
	const { playSound } = useAudio();
	const { width, height } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	return (
		<View style={styles.blackTranslucentView}>
			<TouchableOpacity
				style={StyleSheet.absoluteFill}
				activeOpacity={1}
				onPress={onClose}
			/>
			<View style={styles.optionsView}>
				{/* X Button */}
				<TouchableOpacity
					style={[
						styles.optionsClose,
						{
							top: -width * 0.05,
							right: -width * 0.05,
						},
					]}
					onPress={() => {
						playSound("button_press");
						onClose();
					}}
				>
					<Image
						source={icons.close_button}
						style={{ width: width * 0.15, height: width * 0.15 }}
					/>
				</TouchableOpacity>

				{/* Title */}
				<Text
					style={{
						fontSize: width < 600 ? 40 : 40 * 1.5,
						fontWeight: "bold",
					}}
				>
					OPTIONS
				</Text>

				{/* Music Slider */}
				<Text
					style={{
						fontSize: width < 600 ? 20 : 20 * 1.5,
						fontWeight: "bold",
						marginBottom: 10,
						marginTop: 30,
					}}
				>
					Music
				</Text>
				<View style={{ transform: [{ scaleY: 2 }] }}>
					<Slider
						style={{ width: width * 0.7, height: 40 }}
						minimumValue={0}
						maximumValue={100}
						step={1}
						minimumTrackTintColor="#1fb28a"
						maximumTrackTintColor="#d3d3d3"
						thumbTintColor="#1e1e1e"
						value={musicVolume}
						onValueChange={(val) => setMusicVolume(val)}
					/>
				</View>

				{/* SFX Slider */}
				<Text
					style={{
						fontSize: width < 600 ? 20 : 20 * 1.5,
						fontWeight: "bold",
						marginBottom: 10,
					}}
				>
					SFX
				</Text>
				<View style={{ transform: [{ scaleY: 2 }] }}>
					<Slider
						style={{ width: width * 0.7, height: 40 }}
						minimumValue={0}
						maximumValue={100}
						step={1}
						minimumTrackTintColor="#1fb28a"
						maximumTrackTintColor="#d3d3d3"
						thumbTintColor="#1e1e1e"
						value={sfxVolume}
						onValueChange={(val) => setSfxVolume(val)}
					/>
				</View>

				{/* Vibrations Toggle */}
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 90,
						marginTop: 20,
						marginBottom: 40,
					}}
				>
					<Text
						style={{
							fontSize: width < 600 ? 20 : 20 * 1.5,
							fontWeight: "bold",
						}}
					>
						Vibrations
					</Text>
					<TouchableOpacity
						onPress={() => {
							playSound("button_press");
							setVibrationsEnabled(!vibrationsEnabled);
						}}
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: 10,
						}}
					>
						<View
							style={{
								width: height * 0.03,
								height: height * 0.03,
								borderWidth: 2,
								borderRadius: 999,
								borderColor: "black",
								backgroundColor: vibrationsEnabled
									? "#ad8331"
									: "white",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{vibrationsEnabled && (
								<Text style={{ color: "white" }}>✓</Text>
							)}
						</View>
					</TouchableOpacity>
				</View>

				{quitButton && (
					<LongButton
						onPress={() => {
							playSound("button_press");
							router.replace("/");
						}}
						title="Quit"
						buttonWidth={width * 0.4}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.1
						}
						screenWidth={width}
					/>
				)}

				{/* Tutorial Button */}
				{tutorialButton && (
					<LongButton
						onPress={async () => {
							playSound("button_press");
							await markTutorialComplete();
							router.replace("/TutorialMapScreen");
						}}
						title="Tutorial"
						buttonWidth={width * 0.4}
						buttonHeight={
							(height - insets.top - insets.bottom) * 0.1
						}
						screenWidth={width}
					/>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	blackTranslucentView: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.5)", // 50% black overlay
	},
	optionsView: {
		width: "80%",
		borderRadius: 30,
		backgroundColor: colors.background,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	optionsClose: {
		position: "absolute",
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.hardWrong,
	},
	optionsQuitTouchable: {
		position: "absolute",
		bottom: 35,
		height: 50,
		width: 200,
		borderRadius: 30,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.softWrong,
	},
});
