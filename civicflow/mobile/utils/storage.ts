/**
 * Platform-aware secure storage.
 *
 * - Native (iOS / Android): expo-secure-store (encrypted keychain/keystore)
 * - Web (Expo web / browser):  localStorage fallback
 *
 * expo-secure-store's native module is not available on web, so any call to it
 * on web throws "setValueWithKeyAsync is not a function". This wrapper fixes that.
 */

import { Platform } from "react-native";
import { setItemAsync, getItemAsync, deleteItemAsync } from "expo-secure-store";

export async function saveSecure(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await setItemAsync(key, value);
}

export async function loadSecure(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return getItemAsync(key);
}

export async function removeSecure(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  await deleteItemAsync(key);
}
