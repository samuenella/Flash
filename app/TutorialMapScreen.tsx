import React, { useRef, useState, useEffect, useContext } from "react";
import {
    View,
    TouchableOpacity,
    Image,
    StyleSheet,
    Text,
    TextInput,
    KeyboardAvoidingView,
    Keyboard,
    Animated,
    Vibration,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/colors";
import { useRouter, useLocalSearchParams } from "expo-router";
import Building3dLayer from "@/components/Building3dLayer";
import Building2dLayer from "@/components/Building2dLayer";
import LandmarkLayer from "@/components/LandmarkLayer";
import * as FileSystem from "expo-file-system/legacy";
import { landmarkList } from "@/constants/landmarkList";
import OptionsPage from "@/components/OptionsPage";
import { SettingsContext } from "@/context/SettingsContext";
import { useAudio } from "@/context/AudioContext";
import TutorialCard from "@/components/TutorialCard";

export default function MapScreen() {
    // Phone related declarations
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Map related declarations
    const cameraRef = useRef<MapLibreGL.Camera>(null);
    const mapRef = useRef<MapLibreGL.MapView>(null);
    const rotationFrame = useRef<number | null>(null);
    const rotationTimeout = useRef<number | null>(null);
    const [heading, setHeading] = useState(0);
    const rotationHeading = useRef(0);
    const pitch = useRef(45);
    const zoomLevel = useRef(16);

    // Logic related declarations
    const [countdown, setCountdown] = useState(30);
    const intervalRef = useRef<number | null>(null);
    const isProgrammaticMove = useRef(false);
    const stopRotation = useRef(false);
    const [highlightLandmark, setHighlightLandmark] = useState(true);
    const tutorialLandmarks = useRef([
        landmarkList[0],
        landmarkList[2],
        landmarkList[1],
    ]);
    const levelNumber = useRef(0);
    const scoreArray = useRef<number[]>(
        Array(tutorialLandmarks.current.length).fill(0),
    );
    const wrongAnswerArray = useRef<string[][]>(
        Array.from({ length: tutorialLandmarks.current.length }, () => []),
    );
    const [tutorialSequenceSub, setTutorialSequenceSub] = useState(
        Array(18).fill(0),
    );
    const [tutorialSequenceMain, setTutorialSequenceMain] = useState(0);
    const timeTakenArray = useRef<number[]>(Array(3).fill(0));

    // UI related declarations
    const [answerText, setAnswerText] = useState("");
    const [timeUpScreen, setTimeUpScreen] = useState(false);
    const [correctScreen, setCorrectScreen] = useState(false);
    const [optionsScreen, setOptionsScreen] = useState(false);
    const [levelCompleteScreen, setLevelCompleteScreen] = useState(false);
    const [skipScreen, setSkipScreen] = useState(false);
    const [flexToggle, setFlexToggle] = useState(false);
    const shakeAnim = useRef(new Animated.Value(0)).current; // initial value 0
    const { vibrationsEnabled } = useContext(SettingsContext)!;
    const { playSound, playMusic, pauseMusic } = useAudio();

    const handleSubmit = async () => {
        if (
            tutorialLandmarks.current[levelNumber.current].answers.includes(
                answerText.toLowerCase().replace(/\s+/g, " ").trim(),
            )
        ) {
            setTutorialSequenceMain((prev) => prev + 1);
            playSound("ding");
            setCorrectScreen(true);
            vibrationsEnabled && Vibration.vibrate(200);
            scoreArray.current[levelNumber.current] += 1;
        } else {
            wrongAnswer();
        }
    };

    const wrongAnswer = () => {
        wrongAnswerArray.current[levelNumber.current].push(answerText);

        // reset the animation value
        shakeAnim.setValue(0);

        Animated.sequence([
            Animated.timing(shakeAnim, {
                toValue: 10,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
                toValue: -10,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
                toValue: 10,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
                toValue: 0,
                duration: 50,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const nextLandmark = () => {
        if (levelNumber.current === tutorialLandmarks.current.length - 1) {
            if (skipScreen === true) {
                playSound("level_complete");
                setLevelCompleteScreen(true);
                if (tutorialSequenceMain === 15) {
                    setTutorialSequenceMain((prev) => prev + 1);
                }
            } else {
                setTimeout(() => {
                    playSound("level_complete");
                    setLevelCompleteScreen(true);
                    setCorrectScreen(false);
                    if (tutorialSequenceMain === 15) {
                        setTutorialSequenceMain((prev) => prev + 1);
                    }
                }, 500);
            }
        } else {
            setCorrectScreen(false);
            setSkipScreen(false);
            setHighlightLandmark(true);
            clearRotationTimeout();
            cancelRotationFrame();
            rotationHeading.current = 0;
            setAnswerText("");
            stopRotation.current = false;
            levelNumber.current += 1;
            //initCamera();
        }
    };
    const startCountdown = () => {
        if (intervalRef.current) return; // prevent multiple intervals

        intervalRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    // stop interval when countdown reaches 0
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                        timeUpSequence(); // DEV
                    }
                    return 0;
                }
                if (prev <= 10) {
                    playSound("timer_ending");
                }
                return prev - 1;
            });
        }, 1000);
    };

    const timeUpSequence = () => {
        playSound("time_up");
        setTimeUpScreen(true);
        if (tutorialSequenceMain === 15) {
            setTutorialSequenceMain((prev) => prev + 1);
        }
    };

    const startAutoRotate = () => {
        console.log("Starting auto-rotation");

        const rotate = () => {
            rotationHeading.current = (rotationHeading.current + 0.1) % 360;
            setHeading(rotationHeading.current);
            cameraRef.current?.setCamera({
                heading: rotationHeading.current,
                animationDuration: 100,
            });
            rotationFrame.current = requestAnimationFrame(rotate);
        };
        rotationFrame.current = requestAnimationFrame(rotate);
    };

    const cancelRotationFrame = () => {
        if (rotationFrame.current) {
            cancelAnimationFrame(rotationFrame.current);
            rotationFrame.current = null;
        }
    };

    const clearRotationTimeout = () => {
        if (rotationTimeout.current) {
            clearTimeout(rotationTimeout.current);
            rotationTimeout.current = null;
        }
    };

    const onMapInteraction = () => {
        console.log("Map interaction detected");

        if (!isProgrammaticMove.current) {
            console.log("User is interacting with the map");
            stopRotation.current = true;

            cancelRotationFrame();
        }
    };

    const initCamera = () => {
        isProgrammaticMove.current = true;
        cameraRef.current?.setCamera({
            centerCoordinate: [103.8198, 1.3521], // Singapore
            zoomLevel: 9.2,
            pitch: 45,
            heading: 0,
            animationDuration: 0,
        });
        setTimeout(() => {
            isProgrammaticMove.current = false;
        }, 100);

        setTimeout(() => {
            isProgrammaticMove.current = true;
            cameraRef.current?.setCamera({
                zoomLevel: 16,
                pitch: 45,
                animationDuration: 3000,
                animationMode: "easeTo",
                centerCoordinate:
                    tutorialLandmarks.current[levelNumber.current].coordinates,
            });
            setTimeout(() => {
                isProgrammaticMove.current = false;
            }, 100);
        }, 300);

        rotationTimeout.current = setTimeout(() => {
            stopRotation.current ? null : startAutoRotate();
        }, 3000);
    };

    useEffect(() => {
        playMusic("map_bg_music");

        const keyboardShowListener = Keyboard.addListener(
            "keyboardDidShow",
            () => {
                setFlexToggle(false);
            },
        );

        const keyboardHideListener = Keyboard.addListener(
            "keyboardDidHide",
            () => {
                setFlexToggle(true);
            },
        );

        return () => {
            pauseMusic("map_bg_music");
            keyboardShowListener.remove();
            keyboardHideListener.remove();
            cancelRotationFrame();
            clearRotationTimeout();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (levelCompleteScreen && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, [levelCompleteScreen]);

    // Tutorial main sequence useEffect
    useEffect(() => {
        if (tutorialSequenceMain === 1) {
            initCamera();
            setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 3000);
        }
        if (tutorialSequenceMain === 4) {
            setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 1000);
        }
        if (tutorialSequenceMain === 6) {
            initCamera();
            setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 3000);
        }
        if (tutorialSequenceMain === 9) {
            setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 2000);
        }
        if (tutorialSequenceMain === 15) {
            initCamera();
            timeTakenArray.current[2] = Date.now();
            startCountdown();
        }
        if (tutorialSequenceMain === 16) {
            const endTime = Date.now();
            timeTakenArray.current[2] =
                (endTime - timeTakenArray.current[2]) / 1000;
            setTimeout(() => setTutorialSequenceMain((prev) => prev + 1), 1000);
        }
        if (tutorialSequenceMain === 18) {
            router.replace({
                pathname: "/TutorialReviewScreen",
                params: {
                    scoreArrayJSON: JSON.stringify(scoreArray.current),
                    wrongAnswerArrayJSON: JSON.stringify(
                        wrongAnswerArray.current,
                    ),
                    levelLandmarkListJSON: JSON.stringify(
                        tutorialLandmarks.current,
                    ),
                    timeTakenArrayJSON: JSON.stringify(timeTakenArray.current),
                },
            });
        }
    }, [tutorialSequenceMain]);

    return (
        <View style={styles.page}>
            {/* Pre-render slow images hidden */}
            <View
                style={{
                    position: "absolute",
                    opacity: 0,
                    pointerEvents: "none",
                }}
            >
                <Image
                    source={icons.tick_button}
                    style={{ width: 70, height: 70 }}
                />
                <Image
                    source={icons.close_button}
                    style={{ width: 70, height: 70 }}
                />
                <Image
                    source={icons.tick_label}
                    style={{ width: 120, height: 120 }}
                />
                <Image
                    source={icons.quit_button}
                    style={{ width: 150, height: 80 }}
                />
                <Image
                    source={icons.highlight_landmark_off}
                    style={{ width: 150, height: 80 }}
                />
                <Image
                    source={icons.highlight_landmark_on}
                    style={{ width: 150, height: 80 }}
                />
                <Image
                    source={icons.skip_button}
                    style={{ width: 150, height: 80 }}
                />
            </View>

            <MapLibreGL.MapView
                ref={mapRef}
                style={styles.mapView}
                mapStyle={require("@/assets/mapData.json")}
                compassEnabled={false}
                onRegionWillChange={onMapInteraction}
                onRegionIsChanging={(region) => {
                    setHeading(region.properties.heading ?? 0);
                    pitch.current = region.properties.pitch ?? pitch.current;
                    zoomLevel.current =
                        region.properties.zoomLevel ?? zoomLevel.current;
                }}
                onRegionDidChange={(region) => {
                    setHeading(region.properties.heading ?? heading);
                    pitch.current = region.properties.pitch ?? pitch.current;
                    zoomLevel.current =
                        region.properties.zoomLevel ?? zoomLevel.current;
                }}
            >
                <MapLibreGL.Camera ref={cameraRef} />

                <Building3dLayer highlightLandmark={highlightLandmark} />
                <Building2dLayer />
                <LandmarkLayer
                    highlightLandmark={highlightLandmark}
                    landmarkID={
                        tutorialLandmarks.current[levelNumber.current]
                            .landmarkID
                    }
                />
            </MapLibreGL.MapView>

            <View style={[styles.topUIView, { top: insets.top + 15 }]}>
                {tutorialSequenceMain === 9 && (
                    <View
                        style={{
                            position: "absolute",
                            zIndex: 999,
                            width: 50,
                            height: 50,
                            left: 20,
                        }}
                    ></View>
                )}
                <TouchableOpacity
                    style={styles.menuTouchable}
                    onPress={() => {
                        playSound("button_press");
                        setOptionsScreen(true);
                        Keyboard.dismiss();
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

                <View style={styles.timerView}>
                    <Text style={styles.questionNumberText}>
                        Q{levelNumber.current + 1}
                    </Text>
                    {tutorialSequenceMain >= 15 && (
                        <Text style={styles.timerText}>{countdown}s</Text>
                    )}
                    {tutorialSequenceMain < 15 && (
                        <Text style={styles.timerText}>-s</Text>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.compassTouchable}
                    onPress={() => {
                        playSound("button_press");
                        stopRotation.current = true;
                        cancelRotationFrame();
                        // Reset heading programmatically
                        if (heading === 0) {
                            cameraRef.current?.setCamera({
                                zoomLevel: 16,
                                pitch: 45,
                                animationDuration: 3000,
                                animationMode: "easeTo",
                                centerCoordinate:
                                    tutorialLandmarks.current[
                                        levelNumber.current
                                    ].coordinates,
                            });
                        } else {
                            cameraRef.current?.setCamera({
                                heading: 0,
                                animationDuration: 300,
                            });
                        }
                        Keyboard.dismiss();
                    }}
                >
                    <Image
                        source={icons.button}
                        style={{
                            width: 40,
                            height: 40,
                            position: "absolute",
                        }}
                        resizeMode="contain"
                    />
                    <Image
                        source={icons.compass}
                        style={{
                            width: 40,
                            height: 40,
                            transform: [{ rotate: `${-heading}deg` }],
                        }}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            </View>

            <View style={[styles.bottomUIView, { bottom: insets.bottom + 70 }]}>
                {tutorialSequenceMain >= 7 && tutorialSequenceSub[7] >= 2 && (
                    <TouchableOpacity
                        style={[
                            styles.threeDTouchable,
                            {
                                zIndex:
                                    tutorialSequenceMain === 7 &&
                                    tutorialSequenceSub[7] === 2
                                        ? 999
                                        : 0,
                            },
                        ]}
                        onPress={() => {
                            playSound("button_press");
                            if (
                                tutorialSequenceMain === 7 &&
                                tutorialSequenceSub[7] === 2
                            ) {
                                setTutorialSequenceMain((prev) => prev + 2);
                            } else if (tutorialSequenceMain === 8) {
                                setTutorialSequenceMain((prev) => prev + 1);
                            }
                            cameraRef.current?.setCamera({
                                pitch: pitch.current,
                                zoomLevel: zoomLevel.current,
                                heading: heading,
                                animationDuration: 0,
                            });
                            setHighlightLandmark(!highlightLandmark);
                        }}
                    >
                        <Image
                            source={
                                highlightLandmark
                                    ? icons.highlight_landmark_off
                                    : icons.highlight_landmark_on
                            }
                            style={{
                                width: 45,
                                height: 45,
                            }}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                )}
                {tutorialSequenceMain >= 10 && tutorialSequenceSub[10] >= 2 && (
                    <TouchableOpacity
                        style={[
                            styles.skipTouchable,
                            {
                                zIndex:
                                    tutorialSequenceMain === 10 &&
                                    tutorialSequenceSub[10] === 2
                                        ? 999
                                        : 0,
                            },
                        ]}
                        onPress={() => {
                            playSound("button_press");
                            setSkipScreen(true);
                            if (tutorialSequenceMain === 11) {
                                setTutorialSequenceMain((prev) => prev + 1);
                            }
                            if (
                                tutorialSequenceMain === 10 &&
                                tutorialSequenceSub[10] === 2
                            ) {
                                setTutorialSequenceMain((prev) => prev + 2);
                            }
                        }}
                    >
                        <Image
                            source={icons.skip_button}
                            style={{
                                width: 45,
                                height: 45,
                            }}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                )}
            </View>

            <KeyboardAvoidingView
                style={[
                    {
                        bottom: insets.bottom + 15,
                        zIndex:
                            tutorialSequenceMain === 2 &&
                            tutorialSequenceSub[2] === 1
                                ? 999
                                : 0,
                    },
                    styles.answerView,
                ]}
                behavior="padding"
                enabled={!flexToggle}
                keyboardVerticalOffset={15}
            >
                <Animated.View
                    style={{
                        transform: [{ translateX: shakeAnim }],
                        width: "80%",
                    }}
                >
                    {(tutorialSequenceMain <= 5 ||
                        tutorialSequenceMain >= 15) && (
                        <TextInput
                            style={styles.answerTextInput}
                            placeholder="Type here..."
                            value={answerText}
                            onChangeText={setAnswerText}
                            textAlign="center"
                            onSubmitEditing={handleSubmit}
                            onFocus={() => {
                                if (
                                    tutorialSequenceMain === 2 &&
                                    tutorialSequenceSub[2] === 1
                                ) {
                                    setTutorialSequenceMain((prev) => prev + 1);
                                }
                            }}
                        />
                    )}
                </Animated.View>
            </KeyboardAvoidingView>

            {optionsScreen && (
                <OptionsPage onClose={() => setOptionsScreen(false)} />
            )}

            {correctScreen && (
                <View style={styles.correctTranslucentView}>
                    <Image
                        source={icons.tick_label}
                        style={{ height: 120, width: 120 }}
                    />
                </View>
            )}

            {skipScreen && (
                <View style={styles.blackTranslucentView}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setSkipScreen(false)}
                    />
                    <View style={styles.skipView}>
                        <Text
                            style={{
                                color: colors.text,
                                fontSize: 50,
                                fontWeight: "bold",
                                marginBottom: 30,
                            }}
                        >
                            Skip?
                        </Text>
                        <TouchableOpacity
                            style={styles.skipYesTouchable}
                            onPress={() => {
                                playSound("button_press");
                                if (tutorialSequenceMain === 13) {
                                    setTutorialSequenceMain((prev) => prev + 1);
                                }
                                nextLandmark();
                            }}
                        >
                            <Image
                                source={icons.tick_button}
                                style={{ width: 70, height: 70 }}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.skipNoTouchable}
                            onPress={() => {
                                playSound("button_press");
                                setSkipScreen(false);
                            }}
                        >
                            <Image
                                source={icons.close_button}
                                style={{ width: 70, height: 70 }}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {timeUpScreen && (
                <View style={styles.blackTranslucentView}>
                    <Text
                        style={{
                            color: colors.primary,
                            fontSize: 30,
                            textShadowColor: "black",
                            textShadowRadius: 4,
                        }}
                    >
                        Time's up!
                    </Text>
                </View>
            )}

            {levelCompleteScreen && (
                <View style={styles.blackTranslucentView}>
                    <Text
                        style={{
                            color: colors.primary,
                            fontSize: 30,
                            textShadowColor: "black",
                            textShadowRadius: 4,
                        }}
                    >
                        Level Complete!
                    </Text>
                </View>
            )}

            {tutorialSequenceMain === 0 && (
                <TouchableOpacity
                    style={styles.tutorialBlackTranslucentView}
                    activeOpacity={1}
                    onPress={() => {
                        if (tutorialSequenceSub[0] < 1) {
                            setTutorialSequenceSub((prev) => {
                                const temp = [...prev];
                                temp[0] += 1;
                                return temp;
                            });
                        } else {
                            setTutorialSequenceMain((prev) => prev + 1);
                        }
                    }}
                >
                    {tutorialSequenceSub[0] === 0 && (
                        <TutorialCard
                            text="Welcome to Flash!"
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                    {tutorialSequenceSub[0] === 1 && (
                        <TutorialCard
                            text="The objective of this game is to guess the building based on its polygon shape"
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                </TouchableOpacity>
            )}

            {tutorialSequenceMain === 2 && (
                <TouchableOpacity
                    style={styles.tutorialBlackTranslucentView}
                    activeOpacity={1}
                    onPress={() => {
                        if (tutorialSequenceSub[2] < 1) {
                            setTutorialSequenceSub((prev) => {
                                const temp = [...prev];
                                temp[2] += 1;
                                return temp;
                            });
                        } else {
                            setTutorialSequenceMain((prev) => prev + 1);
                        }
                    }}
                >
                    {tutorialSequenceSub[2] === 0 && (
                        <TutorialCard
                            text="Do you recognize this building? It's the Marina Bay Sands!"
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                    {tutorialSequenceSub[2] === 1 && (
                        <TutorialCard
                            text="Key in 'Marina Bay Sands' here."
                            positionStyle={{ bottom: 120 }}
                        />
                    )}
                </TouchableOpacity>
            )}

            {tutorialSequenceMain === 5 && (
                <TouchableOpacity
                    style={styles.tutorialBlackTranslucentView}
                    activeOpacity={1}
                    onPress={() => {
                        if (tutorialSequenceSub[5] < 1) {
                            setTutorialSequenceSub((prev) => {
                                const temp = [...prev];
                                temp[5] += 1;
                                return temp;
                            });
                        } else {
                            nextLandmark();
                            setTutorialSequenceMain((prev) => prev + 1);
                        }
                    }}
                >
                    {tutorialSequenceSub[5] === 0 && (
                        <TutorialCard
                            text="Great! Note that other answers are accepted as well. (eg. MBS)"
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                    {tutorialSequenceSub[5] === 1 && (
                        <TutorialCard
                            text="Onto the next building!"
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                </TouchableOpacity>
            )}

            {tutorialSequenceMain === 7 && (
                <TouchableOpacity
                    style={styles.tutorialBlackTranslucentView}
                    activeOpacity={1}
                    onPress={() => {
                        if (tutorialSequenceSub[7] < 2) {
                            setTutorialSequenceSub((prev) => {
                                const temp = [...prev];
                                temp[7] += 1;
                                return temp;
                            });
                        } else {
                            setTutorialSequenceMain((prev) => prev + 1);
                        }
                    }}
                >
                    {tutorialSequenceSub[7] === 0 && (
                        <TutorialCard
                            text="Hmm... This is a bit tricky."
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                    {tutorialSequenceSub[7] === 1 && (
                        <TutorialCard
                            text="I know something that can help!"
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                    {tutorialSequenceSub[7] === 2 && (
                        <TutorialCard
                            text="Press this button to toggle surrounding buildings. Maybe this can help!"
                            positionStyle={{ bottom: 180 }}
                        />
                    )}
                </TouchableOpacity>
            )}

            {tutorialSequenceMain === 10 && (
                <TouchableOpacity
                    style={styles.tutorialBlackTranslucentView}
                    activeOpacity={1}
                    onPress={() => {
                        if (tutorialSequenceSub[10] < 2) {
                            setTutorialSequenceSub((prev) => {
                                const temp = [...prev];
                                temp[10] += 1;
                                return temp;
                            });
                        } else {
                            setTutorialSequenceMain((prev) => prev + 1);
                        }
                    }}
                >
                    {tutorialSequenceSub[10] === 0 && (
                        <TutorialCard
                            text="Still no clue..."
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                    {tutorialSequenceSub[10] === 1 && (
                        <TutorialCard
                            text="This is too hard, we should skip this building."
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                    {tutorialSequenceSub[10] === 2 && (
                        <TutorialCard
                            text="Press this to skip."
                            positionStyle={{ bottom: 180 }}
                        />
                    )}
                </TouchableOpacity>
            )}

            {tutorialSequenceMain === 12 && (
                <TouchableOpacity
                    style={styles.tutorialBlackTranslucentView}
                    activeOpacity={1}
                    onPress={() => {
                        setTutorialSequenceMain((prev) => prev + 1);
                    }}
                >
                    {tutorialSequenceSub[12] === 0 && (
                        <TutorialCard
                            text="Once you skip a question, there's no returning back!"
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                </TouchableOpacity>
            )}

            {tutorialSequenceMain === 14 && (
                <TouchableOpacity
                    style={styles.tutorialBlackTranslucentView}
                    activeOpacity={1}
                    onPress={() => {
                        if (tutorialSequenceSub[14] < 1) {
                            setTutorialSequenceSub((prev) => {
                                const temp = [...prev];
                                temp[14] += 1;
                                return temp;
                            });
                        } else {
                            setTutorialSequenceMain((prev) => prev + 1);
                        }
                    }}
                >
                    {tutorialSequenceSub[14] === 0 && (
                        <TutorialCard
                            text="In a game, you have 10 landmarks to guess, each with a 30s time limit."
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                    {tutorialSequenceSub[14] === 1 && (
                        <TutorialCard
                            text="Now you try!"
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                </TouchableOpacity>
            )}

            {tutorialSequenceMain === 17 && (
                <TouchableOpacity
                    style={styles.tutorialBlackTranslucentView}
                    activeOpacity={1}
                    onPress={() => {
                        if (tutorialSequenceSub[17] < 1) {
                            setTutorialSequenceSub((prev) => {
                                const temp = [...prev];
                                temp[17] += 1;
                                return temp;
                            });
                        } else {
                            setTutorialSequenceMain((prev) => prev + 1);
                        }
                    }}
                >
                    {tutorialSequenceSub[17] === 0 && (
                        <TutorialCard
                            text="Good job!"
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                    {tutorialSequenceSub[17] === 1 && (
                        <TutorialCard
                            text="Now let's go to the review page."
                            positionStyle={{ bottom: 100 }}
                        />
                    )}
                </TouchableOpacity>
            )}

            {[1, 6].includes(tutorialSequenceMain) && (
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
        </View>
    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
    },
    mapView: {
        flex: 1,
    },
    topUIView: {
        position: "absolute",
        justifyContent: "space-between",
        flexDirection: "row",
        width: "100%",
        paddingHorizontal: 20,
    },
    menuTouchable: {
        backgroundColor: colors.primary,
        borderRadius: 999,
        borderColor: "#000000",
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        height: 50,
        width: 50,
    },
    timerView: {
        height: 65,
        width: 100,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.4)",
    },
    questionNumberText: {
        color: colors.text,
        fontSize: 30,
        fontWeight: "bold",
    },
    timerText: {
        color: colors.text,
        fontSize: 20,
    },
    compassTouchable: {
        width: 40,
        height: 40,
        backgroundColor: colors.primary,
        borderRadius: 999,
        borderColor: "#000000",
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    blackTranslucentView: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)", // 50% black overlay
    },
    correctTranslucentView: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 255, 0, 0.5)", // 50% black overlay
    },
    bottomUIView: {
        position: "absolute",
        justifyContent: "space-between",
        flexDirection: "row",
        width: "100%",
        paddingHorizontal: 20,
    },
    skipTouchable: {
        width: 45,
        height: 45,
        backgroundColor: colors.primary,
        borderRadius: 999,
        borderColor: "#000000",
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    threeDTouchable: {
        width: 45,
        height: 45,
        backgroundColor: colors.primary,
        borderRadius: 999,
        borderColor: "#000000",
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    answerView: {
        position: "absolute",
        width: "100%",
        alignItems: "center",
    },
    answerTextInput: {
        height: 40,
        borderColor: "#000000",
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: colors.background,
    },
    skipView: {
        width: 300,
        height: 150,
        borderRadius: 30,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
    },
    skipYesTouchable: {
        position: "absolute",
        bottom: -30,
        right: 40,
        borderRadius: 999,
        borderColor: "#000000",
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.hardCorrect,
    },
    skipNoTouchable: {
        position: "absolute",
        bottom: -30,
        left: 40,
        borderRadius: 999,
        borderColor: "#000000",
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.hardWrong,
    },
    tutorialBlackTranslucentView: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)", // 50% black overlay
        alignItems: "center",
    },
});
