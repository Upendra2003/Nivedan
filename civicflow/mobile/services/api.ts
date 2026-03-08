import Constants from "expo-constants";
import { Platform } from "react-native";
import { loadSecure } from "../utils/storage";

const TOKEN_KEY = "civicflow_jwt";

/**
 * Resolve the backend base URL:
 *  - Web (browser on same machine): always localhost:5000 — avoids LAN IP issues.
 *  - Native: EXPO_PUBLIC_API_URL env var → Metro host auto-detect → localhost fallback.
 */
function getBaseUrl(): string {
  if (Platform.OS === "web") {
    return "http://localhost:5000";
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // hostUri looks like "192.168.1.5:8081" — strip the port and use 5000
  const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (metroHost) {
    return `http://${metroHost}:5000`;
  }
  return "http://localhost:5000";
}

const BASE_URL = getBaseUrl();

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers: optHeaders, ...rest } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...(optHeaders as Record<string, string>) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function authedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await loadSecure(TOKEN_KEY);
  return request<T>(path, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });
}

export const api = {
  // Public — no token needed
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  // Authenticated — auto-injects JWT from storage
  authedGet: <T>(path: string) => authedRequest<T>(path),
  authedPost: <T>(path: string, body: unknown) =>
    authedRequest<T>(path, { method: "POST", body: JSON.stringify(body) }),
  authedPatch: <T>(path: string, body: unknown) =>
    authedRequest<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};
