"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthChange, login as firebaseLogin, logout as firebaseLogout, getUserDoc, updateUserDoc } from "@/lib/firebase/auth";
import { uploadProfileImage } from "@/lib/firebase/storage";
import type { User } from "firebase/auth";
import type { AppUser } from "@/lib/schemas/user";

type AuthContextType = {
  user: User | null;
  userDoc: (AppUser & { uid: string }) | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileImage: (file: File) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<(AppUser & { uid: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const unsub = onAuthChange(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          let doc = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              doc = await getUserDoc(firebaseUser.uid);
              if (doc) break;
            } catch {
              // ignore, will retry
            }
            if (attempt < 2) await new Promise((r) => setTimeout(r, 600));
          }
          if (!cancelled) {
            setUser(firebaseUser);
            setUserDoc(doc as (AppUser & { uid: string }) | null);
          }
        } else {
          if (!cancelled) {
            setUser(null);
            setUserDoc(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await firebaseLogin(email, password);
  };

  const logout = async () => {
    await firebaseLogout();
  };

  const updateProfileImage = async (file: File) => {
    if (!user) throw new Error("No authenticated user");
    const photoURL = await uploadProfileImage(user.uid, file);
    await updateUserDoc(user.uid, { photoURL });
    setUserDoc((prev) => prev ? { ...prev, photoURL } : null);
  };

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, login, logout, updateProfileImage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
