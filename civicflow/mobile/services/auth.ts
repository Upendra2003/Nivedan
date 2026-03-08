import { saveSecure, loadSecure, removeSecure } from "../utils/storage";
import { api } from "./api";

const TOKEN_KEY = "civicflow_jwt";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  preferred_language: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  preferred_language: string;
}

// ---------------------------------------------------------------------------
// registerUser — creates account, stores token, returns {token, user}
// ---------------------------------------------------------------------------
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", data);
  await storeToken(response.token);
  return response;
}

// ---------------------------------------------------------------------------
// loginUser — authenticates, stores token, returns {token, user}
// ---------------------------------------------------------------------------
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", { email, password });
  await storeToken(response.token);
  return response;
}

// ---------------------------------------------------------------------------
// storeToken — saves JWT (SecureStore on native, localStorage on web)
// ---------------------------------------------------------------------------
export async function storeToken(token: string): Promise<void> {
  await saveSecure(TOKEN_KEY, token);
}

// ---------------------------------------------------------------------------
// getToken — retrieves JWT (null if not logged in)
// ---------------------------------------------------------------------------
export async function getToken(): Promise<string | null> {
  return loadSecure(TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// logout — clears JWT from storage
// ---------------------------------------------------------------------------
export async function logout(): Promise<void> {
  await removeSecure(TOKEN_KEY);
}
