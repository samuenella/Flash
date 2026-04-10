import React, { createContext, useState, useContext, useEffect } from "react";
import {
    saveBoolean,
    getBoolean,
    saveNumber,
    getNumber,
} from "@/utils/settingsStorage";

interface SettingsContextType {
    musicVolume: number;
    setMusicVolume: (val: number) => void;
    sfxVolume: number;
    setSfxVolume: (val: number) => void;
    vibrationsEnabled: boolean;
    setVibrationsEnabled: (val: boolean) => void;
}

const SETTINGS_KEYS = {
    vibrationsEnabled: "vibrationsEnabled",
    musicVolume: "musicVolume",
    sfxVolume: "sfxVolume",
};

export const SettingsContext = createContext<SettingsContextType | undefined>(
    undefined,
);

export const SettingsProvider = ({ children }: any) => {
    const [musicVolume, setMusicVolume] = useState(100);
    const [sfxVolume, setSfxVolume] = useState(100);
    const [vibrationsEnabled, setVibrationsEnabled] = useState(true);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Grab previous settings
    useEffect(() => {
        async function loadSettings() {
            const savedMusic = await getNumber(SETTINGS_KEYS.musicVolume, 100);
            setMusicVolume(savedMusic);
            const savedSfx = await getNumber(SETTINGS_KEYS.sfxVolume, 100);
            setSfxVolume(savedSfx);
            const savedVibration = await getBoolean(
                SETTINGS_KEYS.vibrationsEnabled,
                true,
            );
            setVibrationsEnabled(savedVibration);
            setSettingsLoaded(true);
        }

        loadSettings();
    }, []);

    // Save settings for future uses
    useEffect(() => {
        if (!settingsLoaded) return;
        saveBoolean(SETTINGS_KEYS.vibrationsEnabled, vibrationsEnabled);
        saveNumber(SETTINGS_KEYS.musicVolume, musicVolume);
        saveNumber(SETTINGS_KEYS.sfxVolume, sfxVolume);
    }, [vibrationsEnabled, musicVolume, sfxVolume]);

    return (
        <SettingsContext.Provider
            value={{
                musicVolume,
                setMusicVolume,
                sfxVolume,
                setSfxVolume,
                vibrationsEnabled,
                setVibrationsEnabled,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within SettingsProvider");
    }
    return context; // Now TypeScript knows it's never undefined
};
