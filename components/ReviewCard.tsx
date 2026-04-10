import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import React from "react";
import { colors } from "@/constants/colors";
import { icons } from "@/constants/icons";
import { useRouter } from "expo-router";

export default function ReviewCard({
    index,
    correct,
    wrongAnswers,
    landmarkData,
    arrow = "right",
}: any) {
    const router = useRouter();
    const correctAnswer = landmarkData.answers[0]
        .split(" ")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    return (
        <View
            style={[
                styles.cardTouchable,
                {
                    backgroundColor: correct
                        ? colors.softCorrect
                        : colors.softWrong,
                },
            ]}
        >
            {/* Tick or Cross */}
            <Image
                source={correct ? icons.tick_label : icons.cross_label}
                style={styles.label}
            />

            {/* Question Label and Last Input Answer*/}
            <Text
                style={{
                    left: 45,
                    fontSize: 20,
                    fontWeight: "bold",
                    width: "75%",
                    color: colors.text,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
            >
                {index + 1}.{" "}
                {correct
                    ? correctAnswer
                    : wrongAnswers.length > 0
                      ? wrongAnswers[wrongAnswers.length - 1]
                      : "(Skipped)"}
            </Text>

            {/* Show correct answer if wrong */}
            <Text
                style={{
                    left: 45,
                    fontSize: 14,
                    width: "75%",
                    color: colors.text,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
            >
                {correct ? (
                    "Correct!"
                ) : (
                    <Text>
                        Answer:{" "}
                        <Text style={{ fontWeight: "bold" }}>
                            {correctAnswer}
                        </Text>
                    </Text>
                )}
            </Text>

            <Text
                style={{ position: "absolute", right: 15, fontWeight: "bold" }}
            >
                {arrow === "right" ? "▶" : arrow === "down" ? "▼" : "▲"}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    cardTouchable: {
        borderRadius: 10,
        width: "100%",
        height: 70,
        justifyContent: "center",
        padding: 15,
        elevation: 2,
    },
    label: {
        position: "absolute",
        width: 30,
        height: 30,
        left: 15,
    },
});
