import * as SecureStore from "expo-secure-store";

const TUTORIAL_KEY = "tutorial_completed";

export const hasSeenTutorial = async (): Promise<boolean> => {
    try {
        const value = await SecureStore.getItemAsync(TUTORIAL_KEY);
        return value === "true";
    } catch (e) {
        console.error("Error reading tutorial status:", e);
        return false;
    }
};

export const markTutorialComplete = async (): Promise<void> => {
    try {
        await SecureStore.setItemAsync(TUTORIAL_KEY, "true");
    } catch (e) {
        console.error("Error saving tutorial status:", e);
    }
};
