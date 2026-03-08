import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, logout as clearToken, getToken } from "../services/auth";
import { api } from "../services/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  preferred_language: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  preferred_language: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: check if a stored token exists and validate it with /auth/me
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const me = await api.authedGet<AuthUser>("/auth/me");
          setUser(me);
        }
      } catch {
        // Token expired or invalid — stay logged out, token will be replaced on next login
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u } = await loginUser(email, password);
    setUser(u);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const { user: u } = await registerUser(data);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
