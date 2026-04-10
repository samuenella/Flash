import { StyleSheet, Text, View } from "react-native";
import React from "react";

const TutorialCard = ({ text, positionStyle }: any) => {
    return (
        <View style={[styles.tutorialCard, positionStyle]}>
            <Text
                style={{
                    color: "white",
                    fontSize: 20,
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
        height: 100,
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
