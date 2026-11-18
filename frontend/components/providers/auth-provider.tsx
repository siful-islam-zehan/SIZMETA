"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setToken, removeToken } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData?: User) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const me = await api.auth.getMe();
      setUser(me);
    } catch {
      setUser(null);
      removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("researchmeta_token") : null;
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (token: string, userData?: User) => {
    setToken(token);
    if (userData) {
      setUser(userData);
      setIsLoading(false);
    } else {
      await refreshUser();
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
