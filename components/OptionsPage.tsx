import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import React from "react";
import Slider from "@react-native-community/slider";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useAudio } from "@/context/AudioContext";
import { useRouter } from "expo-router";
import { useSettings } from "@/context/SettingsContext";
import { markTutorialComplete } from "@/utils/tutorialCheck";

export default function OptionsPage({
    onClose,
    quitButton = true,
    tutorialButton = false,
}: any) {
    const router = useRouter();
    const {
        musicVolume,
        setMusicVolume,
        sfxVolume,
        setSfxVolume,
        vibrationsEnabled,
        setVibrationsEnabled,
    } = useSettings()!;
    const { playSound } = useAudio();

    return (
        <View style={styles.blackTranslucentView}>
            <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={onClose}
            />
            <View style={styles.optionsView}>
                <TouchableOpacity
                    style={styles.optionsClose}
                    onPress={() => {
                        playSound("button_press");
                        onClose();
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
                    }}
                >
                    OPTIONS
                </Text>

                {/* Music Slider */}
                <Text
                    style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        marginBottom: 10,
                    }}
                >
                    Music
                </Text>
                <View style={{ transform: [{ scaleY: 2 }] }}>
                    <Slider
                        style={{ width: 300, height: 40 }}
                        minimumValue={0}
                        maximumValue={100}
                        step={1}
                        minimumTrackTintColor="#1fb28a"
                        maximumTrackTintColor="#d3d3d3"
                        thumbTintColor="#1e1e1e"
                        value={musicVolume}
                        onValueChange={(val) => setMusicVolume(val)}
                    />
                </View>

                {/* SFX Slider */}
                <Text
                    style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        marginBottom: 10,
                    }}
                >
                    SFX
                </Text>
                <View style={{ transform: [{ scaleY: 2 }] }}>
                    <Slider
                        style={{ width: 300, height: 40 }}
                        minimumValue={0}
                        maximumValue={100}
                        step={1}
                        minimumTrackTintColor="#1fb28a"
                        maximumTrackTintColor="#d3d3d3"
                        thumbTintColor="#1e1e1e"
                        value={sfxVolume}
                        onValueChange={(val) => setSfxVolume(val)}
                    />
                </View>

                {/* Vibrations Toggle */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 90,
                        marginTop: 20,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 20,
                            fontWeight: "bold",
                        }}
                    >
                        Vibrations
                    </Text>
                    <TouchableOpacity
                        onPress={() => setVibrationsEnabled(!vibrationsEnabled)}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <View
                            style={{
                                width: 24,
                                height: 24,
                                borderWidth: 2,
                                borderRadius: 999,
                                borderColor: "black",
                                backgroundColor: vibrationsEnabled
                                    ? "#ad8331"
                                    : "white",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {vibrationsEnabled && (
                                <Text style={{ color: "white" }}>✓</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Quit Button */}
                {quitButton && (
                    <TouchableOpacity
                        style={{
                            position: "absolute",
                            bottom: 20,
                        }}
                        onPress={() => {
                            playSound("button_press");
                            router.replace("/");
                        }}
                    >
                        <Image
                            source={icons.quit_button}
                            style={{
                                height: 80,
                                width: 150,
                            }}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                )}

                {tutorialButton && (
                    <TouchableOpacity
                        style={{
                            position: "absolute",
                            bottom: 40,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                        onPress={async () => {
                            playSound("button_press");
                            await markTutorialComplete();
                            router.replace("/TutorialMapScreen");
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
                        <Text style={fonts.button_text}>Tutorial</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    blackTranslucentView: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)", // 50% black overlay
    },
    optionsView: {
        width: 300,
        height: 500,
        borderRadius: 30,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
    },
    optionsClose: {
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
    optionsQuitTouchable: {
        position: "absolute",
        bottom: 35,
        height: 50,
        width: 200,
        borderRadius: 30,
        borderColor: "#000000",
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.softWrong,
    },
});
