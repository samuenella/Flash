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
import { addWrongAnswer } from "@/services/appwrite";

export default function MapScreen() {
    const landmarksFile = FileSystem.documentDirectory + "landmarks.json";

    const saveGeoJSONToFile = async (geojson: any, fileUri: string) => {
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(geojson));
        console.log(`GeoJSON saved to ${fileUri}`);
    };
    const tempLandmarksArray = useRef<any[]>([]).current;

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
    const [isChangingLevel, setIsChangingLevel] = useState(false);

    // Logic related declarations
    const [countdown, setCountdown] = useState(30);
    const intervalRef = useRef<number | null>(null);

    const isProgrammaticMove = useRef(false);
    const stopRotation = useRef(false);
    const [highlightLandmark, setHighlightLandmark] = useState(true);
    const totalLevels = useRef(10);
    const { label } = useLocalSearchParams<{ label: string }>();
    const randomLandmarks = useRef(
        landmarkList
            .filter((landmark) => landmark.labels.includes(label))
            .sort(() => 0.5 - Math.random()) // shuffle
            .slice(0, totalLevels.current),
    ); // take count
    const levelNumber = useRef(0);
    const scoreArray = useRef<number[]>(Array(totalLevels.current).fill(0));
    const wrongAnswerArray = useRef<string[][]>(
        Array.from({ length: totalLevels.current }, () => []),
    );
    const timeTakenArray = useRef<number[]>(Array(totalLevels.current).fill(0));

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
            randomLandmarks.current[levelNumber.current].answers.includes(
                answerText.toLowerCase().replace(/\s+/g, " ").trim(),
            )
        ) {
            playSound("ding");
            setCorrectScreen(true);
            vibrationsEnabled && Vibration.vibrate(200);
            scoreArray.current[levelNumber.current] += 1;
            setTimeout(() => {
                nextLandmark();
            }, 500);
        } else {
            // DEV: log wrong answers to Appwrite for analytics
            addWrongAnswer(
                label,
                randomLandmarks.current[levelNumber.current].answers[0],
                answerText,
            );
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
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        const endTime = Date.now();
        timeTakenArray.current[levelNumber.current] =
            (endTime - timeTakenArray.current[levelNumber.current]) / 1000; // convert to seconds

        if (levelNumber.current === totalLevels.current - 1) {
            if (skipScreen === true) {
                playSound("level_complete");
                setLevelCompleteScreen(true);
            } else {
                setTimeout(() => {
                    playSound("level_complete");
                    setLevelCompleteScreen(true);
                    setCorrectScreen(false);
                }, 500);
            }
            setTimeout(() => {
                router.replace({
                    pathname: "/ReviewScreen",
                    params: {
                        scoreArrayJSON: JSON.stringify(scoreArray.current),
                        wrongAnswerArrayJSON: JSON.stringify(
                            wrongAnswerArray.current,
                        ),
                        levelLandmarkListJSON: JSON.stringify(
                            randomLandmarks.current,
                        ),
                        timeTakenArrayJSON: JSON.stringify(
                            timeTakenArray.current,
                        ),
                    },
                });
            }, 2500);
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
            // Small delay to prevent countdown bug
            setTimeout(() => {
                initCamera();
                setIsChangingLevel(false);
                setCountdown(30);
                startCountdown();
                timeTakenArray.current[levelNumber.current] = Date.now(); // start timer tracker for next level
            }, 50);
        }
    };

    const startCountdown = () => {
        if (intervalRef.current) {
            console.log("Countdown already running, clearing first");
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        intervalRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    // stop interval when countdown reaches 0
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    setIsChangingLevel(true);
                    if (levelNumber.current === totalLevels.current - 1) {
                        timeUpSequence();
                    } else {
                        nextLandmark();
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
        setTimeout(() => {
            router.replace({
                pathname: "/ReviewScreen",
                params: {
                    scoreArrayJSON: JSON.stringify(scoreArray.current),
                    wrongAnswerArrayJSON: JSON.stringify(
                        wrongAnswerArray.current,
                    ),
                    levelLandmarkListJSON: JSON.stringify(
                        randomLandmarks.current,
                    ),
                    timeTakenArrayJSON: JSON.stringify(timeTakenArray.current),
                },
            });
        }, 2000);
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

    const onMapPress = async (e: any) => {
        // screen coordinates
        const x = e.properties?.screenPointX;
        const y = e.properties?.screenPointY;

        // query without layer filter first
        const features = await mapRef.current.queryRenderedFeaturesAtPoint([
            x,
            y,
        ]);

        console.log(features.features);
        console.log(
            `Found ${features.features.length} features at point (${e.geometry.coordinates[0]}, ${e.geometry.coordinates[1]})`,
        );
        tempLandmarksArray.push(features.features);
        console.log(tempLandmarksArray);
    };

    const initCamera = () => {
        console.log("Map finished loading, initializing camera");
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
            console.log("Starting intro zoom animation");
            isProgrammaticMove.current = true;
            cameraRef.current?.setCamera({
                zoomLevel: 16,
                pitch: 45,
                animationDuration: 3000,
                animationMode: "easeTo",
                centerCoordinate:
                    randomLandmarks.current[levelNumber.current].coordinates,
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
        startCountdown();
        timeTakenArray.current[levelNumber.current] = Date.now(); // start timer tracker for first level

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
            console.log("Level complete - stopping timer");
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, [levelCompleteScreen]);

    return (
        <View
            style={styles.page}
            pointerEvents={isChangingLevel ? "none" : "auto"}
        >
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
            </View>

            <MapLibreGL.MapView
                ref={mapRef}
                style={styles.mapView}
                mapStyle={require("@/assets/mapData.json")}
                compassEnabled={false}
                onPress={onMapPress}
                onDidFinishLoadingMap={initCamera}
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
                        randomLandmarks.current[levelNumber.current].landmarkID
                    }
                />
            </MapLibreGL.MapView>

            <View style={[styles.topUIView, { top: insets.top + 15 }]}>
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
                    <Text style={styles.timerText}>{countdown}s</Text>
                </View>

                <TouchableOpacity
                    style={styles.compassTouchable}
                    onPress={() => {
                        playSound("button_press");
                        stopRotation.current = true;
                        cancelRotationFrame();
                        if (heading === 0) {
                            cameraRef.current?.setCamera({
                                zoomLevel: 16,
                                pitch: 45,
                                animationDuration: 3000,
                                animationMode: "easeTo",
                                centerCoordinate:
                                    randomLandmarks.current[levelNumber.current]
                                        .coordinates,
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
                <TouchableOpacity
                    style={styles.threeDTouchable}
                    onPress={() => {
                        playSound("button_press");
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

                <TouchableOpacity
                    style={styles.skipTouchable}
                    onPress={() => {
                        playSound("button_press");
                        setSkipScreen(true);
                        console.log(tempLandmarksArray);
                        // saveGeoJSONToFile(tempLandmarksArray, landmarksFile); // DEV
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
            </View>

            <KeyboardAvoidingView
                style={[{ bottom: insets.bottom + 15 }, styles.answerView]}
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
                    <TextInput
                        style={styles.answerTextInput}
                        placeholder="Type here..."
                        value={answerText}
                        onChangeText={setAnswerText}
                        textAlign="center"
                        onSubmitEditing={handleSubmit}
                    />
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
                        Time's up
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
});
