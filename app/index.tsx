import {
    View,
    Text,
    TouchableOpacity,
    ImageBackground,
    Image,
    StyleSheet,
} from "react-native";
import { useEffect, useState } from "react";
import { router, usePathname } from "expo-router";
import OptionsPage from "@/components/OptionsPage";
import { icons } from "@/constants/icons";
import { fonts } from "@/constants/fonts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { useAudio } from "@/context/AudioContext";
import { hasSeenTutorial, markTutorialComplete } from "@/utils/tutorialCheck";
import TutorialCard from "@/components/TutorialCard";

export default function Index() {
    const insets = useSafeAreaInsets();
    const [optionsScreen, setOptionsScreen] = useState(false);
    const [tutorialPopUp, setTutorialPopUp] = useState(false);
    const [categoryScreen, setCategoryScreen] = useState(false);
    const [landmarkScreen, setLandmarkScreen] = useState(false);
    const { playSound, playMusic, pauseMusic } = useAudio();
    const [noticeScreen, setNoticeScreen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Runs when this route becomes active
        if (pathname === "/") {
            // or whatever your menu route is
            playMusic("menu_music");
            playSound("silence"); // Initialise the sound system with a silent sound to prevent delays on first real sound effect later on
        }

        return () => {
            pauseMusic("menu_music");
        };
    }, [pathname]);

    return (
        <ImageBackground
            source={require("@/assets/images/main_menu_bg.png")}
            style={styles.imageBackground}
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
            </View>

            {!categoryScreen && !landmarkScreen && (
                <>
                    <Text style={styles.titleText}>-FLASH-</Text>

                    <TouchableOpacity
                        style={{
                            justifyContent: "center",
                            alignItems: "center",
                            marginTop: 400,
                        }}
                        onPress={async () => {
                            playSound("button_press");
                            const seen = await hasSeenTutorial();

                            if (!seen) {
                                // First time - show tutorial
                                setTutorialPopUp(true);
                            } else {
                                // Not first time - go straight to game
                                setCategoryScreen(true);
                            }
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
                        <Text style={fonts.button_text}>Play</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                        onPress={() => {
                            setOptionsScreen(!optionsScreen);
                            playSound("button_press");
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
                        <Text style={fonts.button_text}>Options</Text>
                    </TouchableOpacity>
                </>
            )}

            {tutorialPopUp && (
                <View style={styles.blackTranslucentView}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setTutorialPopUp(false)}
                    />
                    <View style={styles.skipTutorialView}>
                        <Text
                            style={{
                                color: colors.text,
                                fontSize: 35,
                                fontWeight: "bold",
                                marginBottom: 30,
                            }}
                        >
                            Play tutorial?
                        </Text>
                        <TouchableOpacity
                            style={styles.skipYesTouchable}
                            onPress={async () => {
                                playSound("button_press");
                                await markTutorialComplete();
                                router.replace("/TutorialMapScreen");
                            }}
                        >
                            <Image
                                source={icons.tick_button}
                                style={{ width: 70, height: 70 }}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.skipNoTouchable}
                            onPress={async () => {
                                playSound("button_press");
                                await markTutorialComplete();
                                setTutorialPopUp(false);
                                setCategoryScreen(true);
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

            {optionsScreen && (
                <OptionsPage
                    onClose={() => setOptionsScreen(false)}
                    quitButton={false}
                    tutorialButton={true}
                />
            )}

            {categoryScreen && (
                <View style={styles.blackTranslucentView}>
                    <Text style={styles.labelTitleText}>CATEGORY</Text>

                    <TouchableOpacity
                        style={{
                            justifyContent: "center",
                            alignItems: "center",
                            margin: 10,
                        }}
                        onPress={() => {
                            setCategoryScreen(false);
                            setLandmarkScreen(true);
                            playSound("button_press");
                        }}
                    >
                        <Image
                            source={icons.empty_button}
                            style={{
                                width: 250,
                                height: 90,
                            }}
                            resizeMode="contain"
                        />
                        <Text style={[fonts.button_text, { fontSize: 30 }]}>
                            Landmarks
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            justifyContent: "center",
                            alignItems: "center",
                            margin: 10,
                        }}
                        onPress={() => {
                            playSound("button_press");
                            setNoticeScreen(true);
                        }}
                    >
                        <Image
                            source={icons.empty_button}
                            style={{
                                width: 250,
                                height: 90,
                            }}
                            resizeMode="contain"
                        />
                        <Text style={fonts.button_text}>Neighbourhoods</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            position: "absolute",
                            bottom: insets.bottom + 10,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                        onPress={() => {
                            setCategoryScreen(false);
                            playSound("button_press");
                        }}
                    >
                        <Image
                            source={icons.empty_button}
                            style={{
                                width: 120,
                                height: 80,
                            }}
                            resizeMode="contain"
                        />
                        <Text style={fonts.button_text}>Back</Text>
                    </TouchableOpacity>
                </View>
            )}

            {landmarkScreen && (
                <View style={styles.blackTranslucentView}>
                    <Text style={styles.labelTitleText}>LANDMARKS</Text>

                    <TouchableOpacity
                        style={{
                            justifyContent: "center",
                            alignItems: "center",
                            margin: 10,
                        }}
                        onPress={() => {
                            playSound("button_press");
                            router.replace({
                                pathname: "/MapTimerScreen",
                                params: { label: "Tourist" },
                            });
                        }}
                    >
                        <Image
                            source={icons.empty_button}
                            style={{
                                width: 250,
                                height: 90,
                            }}
                            resizeMode="contain"
                        />
                        <Text style={fonts.button_text}>Tourist Spots</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            justifyContent: "center",
                            alignItems: "center",
                            margin: 10,
                        }}
                        onPress={() => {
                            playSound("button_press");
                            router.replace({
                                pathname: "/MapTimerScreen",
                                params: { label: "Malls" },
                            });
                        }}
                    >
                        <Image
                            source={icons.empty_button}
                            style={{
                                width: 250,
                                height: 90,
                            }}
                            resizeMode="contain"
                        />
                        <Text style={fonts.button_text}>Shopping Malls</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            position: "absolute",
                            bottom: insets.bottom + 10,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                        onPress={() => {
                            playSound("button_press");
                            setCategoryScreen(true);
                            setLandmarkScreen(false);
                        }}
                    >
                        <Image
                            source={icons.empty_button}
                            style={{
                                width: 120,
                                height: 80,
                            }}
                            resizeMode="contain"
                        />
                        <Text style={fonts.button_text}>Back</Text>
                    </TouchableOpacity>
                </View>
            )}

            {noticeScreen && (
                <TouchableOpacity
                    style={styles.tutorialBlackTranslucentView}
                    activeOpacity={1}
                    onPress={() => {
                        setNoticeScreen(false);
                    }}
                >
                    <TutorialCard
                        text="This feature is under development."
                        positionStyle={{ bottom: 100 }}
                    />
                </TouchableOpacity>
            )}
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    imageBackground: {
        position: "absolute",
        flex: 1,
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    blackTranslucentView: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)", // 50% black overlay
    },
    titleText: {
        fontSize: 60,
        position: "absolute",
        top: 60,
        fontFamily: "Monoton",
        color: colors.primary,
    },
    labelTitleText: {
        fontSize: 50,
        color: "white",
        fontWeight: "200",
        marginBottom: 30,
    },
    skipTutorialView: {
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
