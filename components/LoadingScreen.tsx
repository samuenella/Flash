import {
    ImageBackground,
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { colors } from "@/constants/colors";

interface LoadingScreenProps {
    progress?: number; // 0 to 1
}

export default function LoadingScreen({ progress }: LoadingScreenProps) {
    const percentage = progress !== undefined ? Math.round(progress * 100) : 0;

    return (
        <ImageBackground
            source={require("@/assets/images/main_menu_bg.png")}
            style={styles.imageBackground}
        >
            {progress !== undefined ? (
                <>
                    <Text
                        style={{
                            position: "relative",
                            marginTop: 400,
                            fontWeight: "bold",
                            fontSize: 25,
                            color: colors.text,
                        }}
                    >
                        Loading...
                    </Text>
                    {/* Progress bar */}
                    <View style={styles.progressBarContainer}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${percentage}%` },
                            ]}
                        />
                    </View>

                    {/* Percentage text */}
                    <Text style={styles.progressText}>{percentage}%</Text>
                </>
            ) : (
                <ActivityIndicator size="large" color={colors.primary} />
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
    progressBarContainer: {
        width: "70%",
        height: 8,
        backgroundColor: "rgba(255,255,255,0.7)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 15,
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: colors.primary,
        borderRadius: 10,
    },
    progressText: {
        fontSize: 18,
        color: colors.text,
        fontWeight: "bold",
    },
});
