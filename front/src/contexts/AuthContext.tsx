import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient, User } from "../services/api";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, full_name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = apiClient.getToken();
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const { user } = await apiClient.login({ email, password });
    setUser(user);
  }

  async function signup(email: string, password: string, full_name?: string) {
    const { user } = await apiClient.signup({ email, password, full_name });
    setUser(user);
  }

  async function logout() {
    await apiClient.logout();
    setUser(null);
  }

  async function refreshUser() {
    try {
      const me = await apiClient.getCurrentUser();
      setUser(me);
    } catch (err) {
      // si el token es inválido, limpiar sesión
      await apiClient.logout();
      setUser(null);
    }
  }

  const value = useMemo<AuthContextType>(() => ({ user, loading, login, signup, logout, refreshUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}