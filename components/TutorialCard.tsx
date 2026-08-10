import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import React from "react";

const TutorialCard = ({ text, positionStyle }: any) => {
	const { width, height } = useWindowDimensions();

	return (
		<View
			style={[
				styles.tutorialCard,
				positionStyle,
				{ minHeight: height * 0.12 },
			]}
		>
			<Text
				style={{
					color: "white",
					fontSize: width < 600 ? 20 : 20 * 1.25,
					margin: 10,
				}}
			>
				{text}
			</Text>
			<Text style={styles.arrowNext}>▶</Text>
		</View>
	);
};

export default TutorialCard;

const styles = StyleSheet.create({
	tutorialCard: {
		position: "absolute",
		width: "90%",
		borderRightColor: "white",
		borderLeftColor: "white",
		borderBottomColor: "white",
		borderTopColor: "white",
		borderWidth: 1,
		borderRadius: 10,
		backgroundColor: "black",
		flexDirection: "row",
	},
	arrowNext: {
		position: "absolute",
		right: 10,
		bottom: 10,
		alignSelf: "center",
		color: "white",
		fontSize: 15,
	},
});
