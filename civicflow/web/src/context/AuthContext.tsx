import React, { createContext, useContext, useState, useCallback } from "react";
import { api, setToken } from "../services/api";

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
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
      email,
      password,
    });
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (formData: RegisterData) => {
    const data = await api.post<{ token: string; user: AuthUser }>("/auth/register", formData);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
