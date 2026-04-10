import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
    ScrollView,
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
import TutorialCard from "@/components/TutorialCard";

export default function ReviewScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        scoreArrayJSON,
        wrongAnswerArrayJSON,
        levelLandmarkListJSON,
        timeTakenArrayJSON,
    } = useLocalSearchParams<{
        scoreArrayJSON: string;
        wrongAnswerArrayJSON: string;
        levelLandmarkListJSON: string;
        timeTakenArrayJSON: string;
    }>();
    const [optionsScreen, setOptionsScreen] = useState(false);
    const [splitScreen, setSplitScreen] = useState(false);
    const scoreArray = JSON.parse(scoreArrayJSON);
    const wrongAnswerArray = JSON.parse(wrongAnswerArrayJSON);
    const levelLandmarkList = JSON.parse(levelLandmarkListJSON);
    const timeTakenArray = JSON.parse(timeTakenArrayJSON);
    const { playSound, playMusic, pauseMusic } = useAudio();
    const [tutorialSequenceSub, setTutorialSequenceSub] = useState(
        Array(6).fill(0),
    );
    const [tutorialSequenceMain, setTutorialSequenceMain] = useState(0);

    useEffect(() => {
        if (tutorialSequenceMain === 0) {
            setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 1000);
        }
        if (tutorialSequenceMain === 4) {
            setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 500);
        }
    }, [tutorialSequenceMain]);

    useEffect(() => {
        playMusic("review_music");

        return () => {
            pauseMusic("review_screen");
        };
    }, []);

    console.log(tutorialSequenceMain, tutorialSequenceSub);

    return (
        <View style={styles.page}>
            {[0].includes(tutorialSequenceMain) && (
                <View
                    style={{
                        flex: 1,
                        position: "absolute",
                        zIndex: 999,
                        width: "100%",
                        height: "100%",
                    }}
                ></View>
            )}

            {/* Menu Button */}
            <TouchableOpacity
                style={[styles.menuTouchable, { top: insets.top + 15 }]}
                onPress={() => {
                    playSound("button_press");
                    setOptionsScreen(true);
                }}
            >
                <Image
                    source={icons.menu_button}
                    style={{
                        width: 50,
                        height: 50,
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
                        zIndex:
                            tutorialSequenceMain === 1 &&
                            tutorialSequenceSub[1] === 2
                                ? 999
                                : 0,
                    },
                ]}
                onPress={() => {
                    playSound("button_press");
                    setSplitScreen(true);
                    if (
                        tutorialSequenceMain === 1 &&
                        tutorialSequenceSub[1] === 2
                    ) {
                        setTutorialSequenceMain((prev) => prev + 2);
                    } else if (tutorialSequenceMain === 2) {
                        setTutorialSequenceMain((prev) => prev + 1);
                    }
                }}
            >
                <Image
                    source={icons.splits_button}
                    style={{
                        width: 50,
                        height: 50,
                    }}
                    resizeMode="contain"
                />
            </TouchableOpacity>

            {/* Score Display Tutorial*/}
            {tutorialSequenceMain === 1 && tutorialSequenceSub[1] === 1 && (
                <View
                    style={{
                        position: "absolute",
                        top: 40,
                        height: 125,
                        width: 150,
                        borderWidth: 1,
                        borderRightColor: "white",
                        borderLeftColor: "white",
                        borderTopColor: "white",
                        borderBottomColor: "white",
                        borderRadius: 10,
                        zIndex:
                            tutorialSequenceMain === 1 &&
                            tutorialSequenceSub[1] === 1
                                ? 999
                                : 0,
                    }}
                ></View>
            )}

            {/* Score Display */}
            <Text
                style={{
                    fontSize: 40,
                    fontWeight: "bold",
                    marginTop: insets.top,
                    color: colors.text,
                }}
            >
                Score
            </Text>
            <Text
                style={{
                    fontSize: 30,
                    fontWeight: "bold",
                    color: colors.text,
                }}
            >
                {scoreArray.reduce((a: any, b: any) => a + b, 0)} /{" "}
                {scoreArray.length}
            </Text>

            {/* Time taken Display */}
            <Text
                style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: colors.text,
                    marginTop: 5,
                }}
            >
                Time taken: -s
            </Text>

            {tutorialSequenceMain === 5 && tutorialSequenceSub[5] === 0 && (
                <TouchableOpacity
                    style={{
                        position: "absolute",
                        top: 178,
                        width: "72%",
                        zIndex:
                            tutorialSequenceMain === 5 &&
                            tutorialSequenceSub[5] === 0
                                ? 999
                                : 0,
                    }}
                    onPress={() => {
                        playSound("button_press");
                        router.push({
                            pathname: "/TutorialReviewMapScreen",
                            params: {
                                indexString: "0",
                                scoreArrayJSON: scoreArrayJSON,
                                wrongAnswerArrayJSON: wrongAnswerArrayJSON,
                                levelLandmarkListJSON: levelLandmarkListJSON,
                                timeTakenArrayJSON: timeTakenArrayJSON,
                            },
                        });
                    }}
                >
                    <ReviewCard
                        index={0}
                        correct={true}
                        wrongAnswers={wrongAnswerArray[0]}
                        landmarkData={levelLandmarkList[0]}
                    />
                </TouchableOpacity>
            )}

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
                        style={{
                            width: "100%",
                            zIndex: 999,
                        }}
                        onPress={() => {
                            playSound("button_press");
                            router.push({
                                pathname: "/TutorialReviewMapScreen",
                                params: {
                                    indexString: index.toString(),
                                    scoreArrayJSON: scoreArrayJSON,
                                    wrongAnswerArrayJSON: wrongAnswerArrayJSON,
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

            <TouchableOpacity
                style={{
                    position: "absolute",
                    bottom: insets.bottom + 5,
                    justifyContent: "center",
                    alignItems: "center",
                }}
                onPress={() => {
                    playSound("button_press");
                    router.replace("/");
                }}
            >
                <Image
                    source={icons.empty_button}
                    style={{
                        width: 150,
                        height: 80,
                    }}
                    resizeMode="contain"
                />
                <Text style={fonts.button_text}>Finish</Text>
            </TouchableOpacity>

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
                            if (tutorialSequenceMain === 3) {
                                setTutorialSequenceMain((prev) => prev + 1);
                            }
                        }}
                    />
                    <View style={styles.splitScreenView}>
                        <TouchableOpacity
                            style={styles.splitScreenClose}
                            onPress={() => {
                                playSound("button_press");
                                setSplitScreen(false);
                                if (tutorialSequenceMain === 3) {
                                    setTutorialSequenceMain((prev) => prev + 1);
                                }
                            }}
                        >
                            <Image
                                source={icons.close_button}
                                style={{ width: 60, height: 60 }}
                            />
                        </TouchableOpacity>

                        {/* Title */}
                        <Text
                            style={{
                                fontSize: 40,
                                fontWeight: "bold",
                                position: "absolute",
                                top: 25,
                                color: colors.text,
                            }}
                        >
                            Splits
                        </Text>

                        {/* Total time */}
                        <Text
                            style={{
                                fontSize: 25,
                                fontWeight: "bold",
                                marginBottom: 20,
                                marginTop: 60,
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
                        {timeTakenArray.map((time: number, index: number) => (
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
                                        fontSize: 20,
                                        fontWeight: "bold",
                                        color: colors.text,
                                    }}
                                >
                                    Q{index + 1}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontWeight: "bold",
                                        color: colors.text,
                                    }}
                                >
                                    {time !== 0 ? time.toFixed(2) : "-"}s
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {tutorialSequenceMain === 1 && (
                <TouchableOpacity
                    style={styles.tutorialBlackTranslucentView}
                    activeOpacity={1}
                    onPress={() => {
                        if (tutorialSequenceSub[1] < 2) {
                            setTutorialSequenceSub((prev) => {
                                const temp = [...prev];
                                temp[1] += 1;
                                return temp;
                            });
                        } else {
                            setTutorialSequenceMain((prev) => prev + 1);
                        }
                    }}
                >
                    {tutorialSequenceSub[1] === 0 && (
                        <TutorialCard
                            text="This is the review page."
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                    {tutorialSequenceSub[1] === 1 && (
                        <TutorialCard
                            text="Your results are shown here"
                            positionStyle={{ top: 180 }}
                        />
                    )}
                    {tutorialSequenceSub[1] === 2 && (
                        <TutorialCard
                            text="Press this to show your time taken for each question."
                            positionStyle={{ top: 120 }}
                        />
                    )}
                </TouchableOpacity>
            )}

            {tutorialSequenceMain === 5 && (
                <TouchableOpacity
                    style={styles.tutorialBlackTranslucentView}
                    activeOpacity={1}
                    onPress={() => {
                        setTutorialSequenceMain((prev) => prev + 1);
                    }}
                >
                    {tutorialSequenceSub[5] === 0 && (
                        <TutorialCard
                            text="Press this to open a detailed review."
                            positionStyle={{ top: 270 }}
                        />
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        alignItems: "center",
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
        height: 50,
        width: 50,
    },
    cardScrollView: {
        flexGrow: 0,
        width: "80%",
        height: "65%",
        borderColor: "#000000",
        backgroundColor: colors.primary,
        borderWidth: 1,
        borderRadius: 10,
    },
    tutorialBlackTranslucentView: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)", // 50% black overlay
        alignItems: "center",
    },
    blackTranslucentView: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)", // 50% black overlay
    },
    splitScreenView: {
        width: 300,
        height: 500,
        borderRadius: 30,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
    },
    splitScreenClose: {
        position: "absolute",
        top: -20,
        right: -20,
        borderRadius: 999,
        borderColor: "#000000",
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.hardWrong,
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
        height: 50,
        width: 50,
    },
});
