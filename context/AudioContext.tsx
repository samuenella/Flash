import { createContext, useContext, useEffect, useRef } from "react";
import { useAudioPlayer } from "expo-audio";
import { sounds } from "@/constants/sounds";
import { useSettings } from "@/context/SettingsContext";

const AudioContext = createContext<any>(null);

export function AudioProvider({ children }: any) {
    const { sfxVolume, musicVolume } = useSettings();
    const currentMusic = useRef<any | null>(null);

    // Music players
    const musicPlayers = {
        menu_music_start: useAudioPlayer(sounds.menu_music_start),
        menu_music_body: useAudioPlayer(sounds.menu_music_body),
        map_bg_music: useAudioPlayer(sounds.map_bg_music),
        review_music: useAudioPlayer(sounds.review_music),
    };

    // SFX Players
    const sfxPlayers = {
        button_press: useAudioPlayer(sounds.button_press),
        ding: useAudioPlayer(sounds.ding),
        level_complete: useAudioPlayer(sounds.level_complete),
        timer_ending: useAudioPlayer(sounds.timer_ending),
        time_up: useAudioPlayer(sounds.time_up),
        silence: useAudioPlayer(sounds.silence), // Added silence player
    };

    // Boot up sfx players on mount to avoid delay on first play
    // useEffect(() => {
    //     sfxPlayers.button_press.volume = 0; // Mute the sound
    //     sfxPlayers.button_press.play();
    //     setTimeout(() => {
    //         sfxPlayers.button_press.volume = sfxVolume / 100; // Set to user volume
    //     }, 1000);
    // }, []);

    // Update SFX volumes when slider changes
    useEffect(() => {
        Object.values(sfxPlayers).forEach((player) => {
            player.volume = sfxVolume / 100;
        });
    }, [sfxVolume]);

    // Update music volume when slider changes
    useEffect(() => {
        musicPlayers.menu_music_body.volume = musicVolume / 100;
        musicPlayers.menu_music_start.volume = musicVolume / 100;
        musicPlayers.menu_music_body.loop = true; // ✅ Loop the body
        musicPlayers.map_bg_music.volume = musicVolume / 100;
        musicPlayers.map_bg_music.loop = true;
        musicPlayers.review_music.volume = musicVolume / 100;
        musicPlayers.review_music.loop = true;
    }, [musicVolume]);

    const playSound = (soundName: keyof typeof sfxPlayers) => {
        const player = sfxPlayers[soundName];
        if (player) {
            player.seekTo(0);
            player.play();
        }
    };

    const playMusic = (musicName: string) => {
        if (currentMusic.current === musicName) {
            return; // Already playing this music, do nothing
        }
        // Stop all music first
        musicPlayers.menu_music_start.pause();
        musicPlayers.menu_music_body.pause();
        musicPlayers.map_bg_music.pause();
        musicPlayers.review_music.pause();

        if (musicName === "menu_music") {
            // Play intro first
            // musicPlayers.menu_music_start.seekTo(0);
            // musicPlayers.menu_music_start.play();
            musicPlayers.menu_music_body.seekTo(0);
            musicPlayers.menu_music_body.play();
            currentMusic.current = "menu_music";
        } else if (musicName === "map_bg_music") {
            musicPlayers.map_bg_music.seekTo(0);
            musicPlayers.map_bg_music.play();
            currentMusic.current = "map_bg_music";
        } else if (musicName === "review_music") {
            musicPlayers.review_music.seekTo(0);
            musicPlayers.review_music.play();
            currentMusic.current = "review_music";
        }
    };

    const pauseMusic = (musicName: string) => {
        if (musicName === "menu_music") {
            //musicPlayers.menu_music_start.pause();
            musicPlayers.menu_music_body.pause();
        } else if (musicName === "map_bg_music") {
            musicPlayers.map_bg_music.pause();
        } else if (musicName === "review_music") {
            musicPlayers.review_music.pause();
        }
        currentMusic.current = null;
    };

    return (
        <AudioContext.Provider value={{ playSound, playMusic, pauseMusic }}>
            {children}
        </AudioContext.Provider>
    );
}

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error("useAudio must be used within AudioProvider");
    }
    return context; // Now TypeScript knows it's never undefined
};
