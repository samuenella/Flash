import {
	StyleSheet,
	Text,
	View,
	ImageBackground,
	TouchableOpacity,
	Image,
	ScrollView,
	ActivityIndicator,
	useWindowDimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAudio } from "@/context/AudioContext";
import { icons } from "@/constants/icons";
import { fonts } from "@/constants/fonts";
import { colors } from "@/constants/colors";
import { getLeaderboard, clearLeaderboard } from "@/services/appwrite";
import LongButton from "@/components/LongButton";

type LeaderboardEntry = {
	createdAt: string;
	Username: string;
	Score: number;
	TimeTaken: number;
};

export default function LeaderboardScreen() {
	const insets = useSafeAreaInsets();
	const { playSound } = useAudio();
	const [top10, setTop10] = useState<LeaderboardEntry[] | null>(null);
	const { width, height } = useWindowDimensions();

	useEffect(() => {
		const fetchData = async () => {
			const data = await getLeaderboard();

			// Check if need clear leaderboard
			const todayUTC = new Date();
			todayUTC.setUTCHours(todayUTC.getUTCHours() + 8); // Adjust to UTC+8
			const lastSubmissionDatetime =
				data.length > 0 ? new Date(data[0].createdAt) : new Date(); // if no data, take now
			lastSubmissionDatetime.setUTCHours(
				lastSubmissionDatetime.getUTCHours() + 8,
			); // Adjust to UTC+8
			if (
				todayUTC.toISOString().slice(0, 10) ===
				lastSubmissionDatetime.toISOString().slice(0, 10)
			) {
				setTop10(
					data.sort((a, b) => {
						if (a.Score !== b.Score) return b.Score - a.Score;
						return a.TimeTaken - b.TimeTaken;
					}),
				);
			} else {
				clearLeaderboard();
			}
		};

		fetchData();
	}, []);

	return (
		<ImageBackground
			source={require("@/assets/images/main_menu_bg.png")}
			style={styles.imageBackground}
		>
			<View style={styles.blackTranslucentView}>
				{/**Banner */}
				<View
					style={{
						width: "90%",
						alignSelf: "center",
						paddingTop: insets.top + 10,
					}}
				>
					<ImageBackground
						source={icons.banner}
						style={styles.banner}
						resizeMode="stretch"
					>
						<Text
							style={[
								styles.labelTitleText,
								{
									fontSize: width < 600 ? 33 : 33 * 1.25,
								},
							]}
						>
							LEADERBOARDS
						</Text>
					</ImageBackground>
				</View>

				<Text
					style={[
						styles.dateText,
						{ fontSize: width < 600 ? 30 : 30 * 1.25 },
					]}
				>
					Daily Challenge
				</Text>

				<Text
					style={[
						styles.dateText,
						{
							marginBottom: 10,
							fontSize: width < 600 ? 30 : 30 * 1.25,
						},
					]}
				>
					{new Date().toLocaleDateString("en-SG", { day: "numeric" })}
					/
					{new Date().toLocaleDateString("en-SG", {
						month: "numeric",
					})}
					/
					{new Date().toLocaleDateString("en-SG", {
						year: "numeric",
					})}
				</Text>

				{/* Leaderboard list*/}
				<ScrollView
					style={styles.leaderboardScrollView}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{
						justifyContent: "center",
						alignItems: "center",
						gap: 10,
						padding: 10,
						paddingVertical: 20,
					}}
				>
					{top10 === null ? (
						<>
							<Text
								style={{
									fontSize: width < 600 ? 20 : 20 * 1.25,
									fontWeight: "bold",
								}}
							>
								Loading...
							</Text>
							<ActivityIndicator size="large" />
						</>
					) : top10.length > 0 ? (
						top10.map((data, index) => (
							<View
								key={index}
								style={[
									styles.nameCardView,
									{
										backgroundColor:
											index === 0
												? "#FFDA5C"
												: index === 1
													? "#E6E3D9"
													: index === 2
														? "#BA9A5E"
														: "#EBFFEE",
									},
								]}
							>
								<Text
									style={[
										styles.usernameText,
										{ width: "60%" },
									]}
									numberOfLines={1}
									ellipsizeMode="tail"
								>
									<Text style={{ color: "#7C7C7C" }}>
										{index + 1}
									</Text>{" "}
									{data.Username}
								</Text>

								<Text style={styles.timeTakenText}>
									{data.Score}
									{"/10   "}
									{data.TimeTaken}s
								</Text>
							</View>
						))
					) : (
						<Text
							style={{
								fontSize: width < 600 ? 20 : 20 * 1.25,
								fontWeight: "bold",
							}}
						>
							No submissions yet...
						</Text>
					)}
				</ScrollView>

				{/* Back button */}
				<LongButton
					onPress={() => {
						playSound("button_press");
						router.back();
					}}
					title="Back"
					buttonWidth={width * 0.4}
					buttonHeight={height * 0.07}
					screenWidth={width}
					customStyles={{ marginBottom: insets.bottom + 10 }}
				/>
			</View>
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	blackTranslucentView: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.5)", // 50% black overlay
	},
	labelTitleText: {
		color: colors.text,
		fontWeight: "bold",
		marginBottom: 15,
	},
	imageBackground: {
		position: "absolute",
		flex: 1,
		width: "100%",
		height: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	banner: {
		height: 100,
		justifyContent: "center",
		alignItems: "center",
	},
	dateText: {
		color: "white",
		fontWeight: "200",
	},
	leaderboardScrollView: {
		flexGrow: 1,
		width: "85%",
		borderRadius: 15,
		backgroundColor: colors.background,
		marginBottom: 10,
	},
	nameCardView: {
		width: "100%",
		height: 40,
		justifyContent: "space-between",
		borderRadius: 10,
		paddingHorizontal: 10,
		flexDirection: "row",
		alignItems: "center",
	},
	usernameText: {
		fontSize: 20,
		fontWeight: "bold",
	},
	timeTakenText: {
		fontSize: 20,
		fontWeight: "bold",
	},
});
