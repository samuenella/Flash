import * as SecureStore from "expo-secure-store";

export async function saveBoolean(key: string, value: boolean) {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export async function getBoolean(key: string, defaultValue: boolean) {
    const storedValue = await SecureStore.getItemAsync(key);
    return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
}

export async function saveNumber(key: string, value: number) {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export async function getNumber(key: string, defaultValue: number) {
    const storedValue = await SecureStore.getItemAsync(key);
    return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
}
