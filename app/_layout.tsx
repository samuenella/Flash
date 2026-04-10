import { Stack } from "expo-router";
import { SettingsProvider } from "@/context/SettingsContext";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { preloadAssets } from "@/utils/preloadAssets";
import LoadingScreen from "@/components/LoadingScreen";
import { AudioProvider } from "@/context/AudioContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [appReady, setAppReady] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);

    const [fontsLoaded] = useFonts({
        Monoton: require("@/assets/fonts/Monoton-Regular.ttf"),
    });

    useEffect(() => {
        // Load font first, then load other assets
        if (!fontsLoaded) return;
        async function prepare() {
            try {
                // Await images and audio
                await preloadAssets((progress) => {
                    setLoadingProgress(progress);
                });
                setAppReady(true);
            } catch (e) {
                console.warn("Error loading assets: ", e);
                setAppReady(true);
            }
        }

        prepare();
    }, [fontsLoaded]);

    // Hide splash screen when app is ready, splashscreen is what's shown while react native loads
    useEffect(() => {
        if (appReady) {
            SplashScreen.hideAsync();
        }
    }, [appReady]);

    if (!appReady) {
        return <LoadingScreen progress={loadingProgress} />;
    }

    return (
        <SettingsProvider>
            <AudioProvider>
                <Stack>
                    <Stack.Screen
                        name="index"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="MapTimerScreen"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="ReviewScreen"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="ReviewMapScreen"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="TutorialMapScreen"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="TutorialReviewScreen"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="TutorialReviewMapScreen"
                        options={{
                            headerShown: false,
                        }}
                    />
                </Stack>
            </AudioProvider>
        </SettingsProvider>
    );
}
