import {
	Linking,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	Image,
	useWindowDimensions,
} from "react-native";
import React from "react";
import { useAudio } from "@/context/AudioContext";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CreditsPage({ onClose }: any) {
	const musicCredits = [
		{
			name: "Hazelwood - Lurker",
			link: "https://freetouse.com/music/hazelwood/lurker",
		},
		{
			name: "Rhys Muldoon - Racing a Banjo",
			link: "https://www.youtube.com/watch?v=J0GO5bg3rJI",
		},
		{
			name: "Lukrembo - Bored",
			link: "https://freetouse.com/music/lukrembo/bored",
		},
	];
	const developerCredits = [
		{
			name: "Samuenella",
			link: "https://github.com/samuenella",
		},
	];

	const testerCredits = [
		{
			name: "Judah",
			link: "https://www.linkedin.com/in/judah-kang-624095240/",
		},
		{
			name: "Ajitesh",
			link: "https://github.com/AjitProg",
		},
	];

	const { playSound } = useAudio();
	const { width, height } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.blackTranslucentView]}>
			<TouchableOpacity
				style={StyleSheet.absoluteFill}
				activeOpacity={1}
				onPress={() => {
					onClose();
				}}
			/>
			<View
				style={[
					styles.creditsView,
					{
						width: width * 0.8,
					},
				]}
			>
				{/* X Button */}
				<TouchableOpacity
					style={[
						styles.creditsClose,
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

				{/* Credit Title */}
				<Text
					style={{
						fontSize: width < 600 ? 40 : 40 * 1.25,
						fontWeight: "bold",
					}}
				>
					CREDITS
				</Text>

				{/*Music Credits*/}
				<Text
					style={{
						fontSize: width < 600 ? 30 : 30 * 1.25,
						fontWeight: "bold",
					}}
				>
					Music
				</Text>

				{musicCredits.map((credit, index) => (
					<Text
						key={index}
						style={[
							styles.creditText,
							{ fontSize: width < 600 ? 17 : 17 * 1.25 },
						]}
						onPress={() => Linking.openURL(credit.link)}
					>
						{credit.name}
					</Text>
				))}

				{/*Developer Credits*/}
				<Text
					style={{
						fontSize: width < 600 ? 30 : 30 * 1.25,
						fontWeight: "bold",
						marginTop: 20,
					}}
				>
					Developer
				</Text>

				{developerCredits.map((credit, index) => (
					<Text
						key={index}
						style={[
							styles.creditText,
							{ fontSize: width < 600 ? 17 : 17 * 1.25 },
						]}
						onPress={() => Linking.openURL(credit.link)}
					>
						{credit.name}
					</Text>
				))}

				{/*Play Tester Credits*/}
				<Text
					style={{
						fontSize: width < 600 ? 30 : 30 * 1.25,
						fontWeight: "bold",
						marginTop: 20,
					}}
				>
					Play testers
				</Text>

				{testerCredits.map((credit, index) => (
					<Text
						key={index}
						style={[
							styles.creditText,
							{ fontSize: width < 600 ? 17 : 17 * 1.25 },
						]}
						onPress={() => Linking.openURL(credit.link)}
					>
						{credit.name}
					</Text>
				))}
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
	creditText: {
		textAlign: "center",
		backgroundColor: colors.primary,
		borderWidth: 1,
		borderColor: "#00000052",
		borderRadius: 999,
		paddingHorizontal: 8,
		color: colors.text,
		marginBlock: 3,
	},
	creditsView: {
		borderRadius: 30,
		backgroundColor: colors.background,
		justifyContent: "center",
		alignItems: "center",
		position: "absolute",
		padding: 20,
	},
	creditsClose: {
		position: "absolute",
		borderRadius: 999,
		borderColor: "#000000",
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.hardWrong,
	},
});
