import { Asset } from "expo-asset";
import { icons } from "@/constants/icons";
import { sounds } from "@/constants/sounds";

export async function preloadAssets(onProgress?: (progress: number) => void) {
    const iconAssets = Object.values(icons);
    const soundAssets = Object.values(sounds);
    const totalAssets = iconAssets.length + soundAssets.length;

    // Track completion with an array instead
    const completed = new Array(totalAssets).fill(false);
    const updateProgress = (index: number) => {
        completed[index] = true;
        const loadedCount = completed.filter(Boolean).length;
        if (onProgress) {
            onProgress(loadedCount / totalAssets);
        }
    };

    // Load images with index tracking
    const imagePromises = iconAssets.map(async (icon, index) => {
        await Asset.fromModule(icon).downloadAsync();
        updateProgress(index);
    });

    // Load audio files with index tracking
    const audioPromises = soundAssets.map(async (sound, index) => {
        await Asset.fromModule(sound).downloadAsync();
        updateProgress(iconAssets.length + index); // Offset by image count
    });

    await Promise.all([...imagePromises, ...audioPromises]);
}
