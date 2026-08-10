import { StyleSheet, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { icons } from "@/constants/icons";

export default function LongButton({
	onPress,
	title,
	buttonWidth,
	buttonHeight,
	screenWidth,
	customStyles = {},
}: {
	onPress: () => void;
	title: string;
	buttonWidth: number;
	buttonHeight: number;
	screenWidth: number;
	customStyles?: any;
}) {
	return (
		<TouchableOpacity
			style={[
				{
					justifyContent: "center",
					alignItems: "center",
					marginBottom: 5,
				},
				customStyles,
			]}
			onPress={onPress}
		>
			<Image
				source={icons.empty_button}
				style={{
					width: buttonWidth,
					height: buttonHeight,
				}}
				resizeMode="contain"
			/>
			<Text
				style={[
					styles.button_text,
					{ fontSize: screenWidth < 600 ? 25 : 25 * 1.25 },
				]}
			>
				{title}
			</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	button_text: {
		position: "absolute",
		fontWeight: "bold",
		color: "#333333",
	},
});
