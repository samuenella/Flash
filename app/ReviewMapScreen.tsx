import React, { useEffect, useRef, useState, useMemo } from "react";
import {
    View,
    TouchableOpacity,
    Image,
    StyleSheet,
    Text,
    Animated,
    ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/colors";
import { useRouter, useLocalSearchParams } from "expo-router";
import Building3dLayer from "@/components/Building3dLayer";
import Building2dLayer from "@/components/Building2dLayer";
import LandmarkLayer from "@/components/LandmarkLayer";
import ReviewCard from "@/components/ReviewCard";
import { useAudio } from "@/context/AudioContext";

export default function ReviewMapScreen() {
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
    const isProgrammaticMove = useRef(false);
    const stopRotation = useRef(false);
    const [highlightLandmark, setHighlightLandmark] = useState(true);
    const {
        indexString,
        scoreArrayJSON,
        wrongAnswerArrayJSON,
        levelLandmarkListJSON,
        timeTakenArrayJSON,
    } = useLocalSearchParams<{
        indexString: string;
        scoreArrayJSON: string;
        wrongAnswerArrayJSON: string;
        levelLandmarkListJSON: string;
        timeTakenArrayJSON: string;
    }>();
    const [index, setIndex] = useState(parseInt(indexString, 10));
    const scoreArray = useMemo(
        () => JSON.parse(scoreArrayJSON),
        [scoreArrayJSON],
    );
    const wrongAnswerArray = useMemo(
        () => JSON.parse(wrongAnswerArrayJSON),
        [wrongAnswerArrayJSON],
    );
    const levelLandmarkList = useMemo(
        () => JSON.parse(levelLandmarkListJSON),
        [levelLandmarkListJSON],
    );
    const timeTakenArray = useMemo(
        () => JSON.parse(timeTakenArrayJSON),
        [timeTakenArrayJSON],
    );

    // UI related declarations
    const translateY = useRef(new Animated.Value(0)).current;
    const [expanded, setExpanded] = useState(false);
    const { playSound } = useAudio();

    const toggleSheet = () => {
        if (expanded) {
            // collapse
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            // expand
            Animated.timing(translateY, {
                toValue: -200, // move up 300px
                duration: 300,
                useNativeDriver: true,
            }).start();
        }

        setExpanded(!expanded);
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
                centerCoordinate: levelLandmarkList[index].coordinates,
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
        initCamera();
        return () => {
            cancelRotationFrame();
            clearRotationTimeout();
        };
    }, [index]);

    return (
        <View style={styles.page}>
            <MapLibreGL.MapView
                ref={mapRef}
                style={styles.mapView}
                mapStyle={require("@/assets/mapData.json")}
                compassEnabled={false}
                onDidFinishLoadingMap={() => {
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
                }}
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
                    landmarkID={levelLandmarkList[index].landmarkID}
                />
            </MapLibreGL.MapView>

            <View style={[styles.topUIView, { top: insets.top + 15 }]}>
                <TouchableOpacity
                    style={styles.backTouchable}
                    onPress={() => {
                        playSound("button_press");
                        router.back();
                    }}
                >
                    <Image
                        source={icons.back_button}
                        style={{
                            width: 50,
                            height: 50,
                        }}
                        resizeMode="contain"
                    />
                </TouchableOpacity>

                <View style={styles.titleView}>
                    <Text style={styles.titleText}>Q{index + 1}</Text>
                    <Text style={styles.timerText}>
                        {timeTakenArray[index] === 0
                            ? "-"
                            : timeTakenArray[index]?.toFixed(1)}
                        s
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.compassTouchable}
                    onPress={() => {
                        playSound("button_press");
                        stopRotation.current = true;
                        cancelRotationFrame();
                        // Reset heading programmatically
                        if (heading !== 0) {
                            cameraRef.current?.setCamera({
                                heading: 0,
                                animationDuration: 300,
                            });
                        } else {
                            cameraRef.current?.setCamera({
                                zoomLevel: 16,
                                pitch: 45,
                                animationDuration: 3000,
                                animationMode: "easeTo",
                                centerCoordinate:
                                    levelLandmarkList[index].coordinates,
                            });
                        }
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

            <View
                style={[styles.bottomUIView, { bottom: insets.bottom + 100 }]}
            >
                <TouchableOpacity
                    style={styles.prevLandmarkTouchable}
                    onPress={() => {
                        playSound("button_press");
                        cancelRotationFrame();
                        clearRotationTimeout();
                        rotationHeading.current = 0;
                        stopRotation.current = false;
                        setIndex(
                            (prev) =>
                                (prev - 1 + levelLandmarkList.length) %
                                levelLandmarkList.length,
                        );
                    }}
                >
                    <Image
                        source={icons.prev_button}
                        style={{
                            width: 45,
                            height: 45,
                        }}
                        resizeMode="contain"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.nextLandmarkTouchable}
                    onPress={() => {
                        playSound("button_press");
                        cancelRotationFrame();
                        clearRotationTimeout();
                        rotationHeading.current = 0;
                        stopRotation.current = false;
                        setIndex(
                            (prev) => (prev + 1) % levelLandmarkList.length,
                        );
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

            <Animated.View
                style={[
                    styles.reviewCardTouchable,
                    {
                        transform: [{ translateY }],
                        bottom: insets.bottom + 15 - 200,
                    },
                ]}
            >
                <TouchableOpacity
                    onPress={() => {
                        playSound("button_press");
                        toggleSheet();
                    }}
                >
                    <ReviewCard
                        index={index}
                        correct={scoreArray[index] > 0}
                        wrongAnswers={wrongAnswerArray[index]}
                        landmarkData={levelLandmarkList[index]}
                        arrow={expanded ? "up" : "down"}
                    />
                </TouchableOpacity>
                <ScrollView
                    style={[
                        styles.wrongAnswerScrollView,
                        {
                            opacity: expanded ? 1 : 0,
                        },
                    ]}
                    contentContainerStyle={{
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 15,
                        gap: 10,
                    }}
                >
                    <Text style={styles.submittedAnswerText}>
                        Submitted answers:
                    </Text>
                    {wrongAnswerArray[index]?.map(
                        (value: string, i: number) => (
                            <Text key={i} style={styles.wrongAnswerText}>
                                {value}
                            </Text>
                        ),
                    )}
                </ScrollView>
            </Animated.View>
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
    backTouchable: {
        backgroundColor: colors.primary,
        borderRadius: 999,
        borderColor: "#000000",
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        height: 50,
        width: 50,
    },
    titleView: {
        height: 65,
        width: 100,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.4)",
    },
    titleText: {
        color: colors.text,
        fontSize: 30,
        fontWeight: "bold",
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
    bottomUIView: {
        position: "absolute",
        justifyContent: "space-between",
        flexDirection: "row",
        width: "100%",
        paddingHorizontal: 20,
    },
    nextLandmarkTouchable: {
        width: 45,
        height: 45,
        backgroundColor: colors.primary,
        borderRadius: 999,
        borderColor: "#000000",
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    prevLandmarkTouchable: {
        width: 45,
        height: 45,
        backgroundColor: colors.primary,
        borderRadius: 999,
        borderColor: "#000000",
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    reviewCardTouchable: {
        position: "absolute",
        width: "90%",
        alignSelf: "center",
    },
    wrongAnswerScrollView: {
        width: "100%",
        backgroundColor: colors.background,
        height: 200,
        borderRadius: 10,
    },
    timerText: {
        color: colors.text,
        fontSize: 20,
    },
    submittedAnswerText: {
        fontWeight: "bold",
        fontSize: 18,
        color: colors.text,
    },
    wrongAnswerText: {
        backgroundColor: colors.hardWrong,
        borderRadius: 999,
        paddingHorizontal: 8,
        fontSize: 16,
        textAlign: "center",
        color: colors.text,
    },
});
