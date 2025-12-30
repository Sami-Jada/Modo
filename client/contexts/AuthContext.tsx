import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, UserRole } from "@/types";
import * as storage from "@/lib/storage";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (role: UserRole, name: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAvailability: (status: "available" | "busy" | "offline") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await storage.getUser();
      setUser(savedUser);
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (role: UserRole, name: string, phone: string) => {
    const newUser: User = {
      id: storage.generateId(),
      role,
      name,
      phone,
      isVerified: role === "customer",
      isOnProbation: role === "electrician",
      trustScore: role === "electrician" ? 80 : undefined,
      availabilityStatus: role === "electrician" ? "available" : undefined,
    };
    await storage.setUser(newUser);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await storage.clearUser();
    setUser(null);
  }, []);

  const updateAvailability = useCallback(
    async (status: "available" | "busy" | "offline") => {
      if (!user || user.role !== "electrician") return;
      const updatedUser = { ...user, availabilityStatus: status };
      await storage.setUser(updatedUser);
      setUser(updatedUser);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateAvailability }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
