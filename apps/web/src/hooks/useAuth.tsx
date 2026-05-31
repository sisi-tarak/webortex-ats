"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getUserProfile } from "@/lib/firebase/firestore";
import type { UserProfile } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isPro: boolean;
  isEnterprise: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  isPro: false,
  isEnterprise: false,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load the Firestore profile for a given UID.
   * Retries once after 1.5 s to handle the race where onAuthStateChanged
   * fires before ensureUserProfile has finished creating the document.
   * Errors are swallowed — the user stays authenticated even without a profile.
   */
  const loadProfile = useCallback(async (uid: string): Promise<void> => {
    try {
      const p = await getUserProfile(uid);
      if (p) {
        setProfile(p);
        return;
      }
      // Document doesn't exist yet (ensureUserProfile still in-flight).
      // Wait and retry once.
      await new Promise((r) => setTimeout(r, 1500));
      const retry = await getUserProfile(uid);
      setProfile(retry);
    } catch {
      // Firestore rules not yet deployed, or network error.
      // Silently ignore — profile stays null, user remains authenticated.
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (user) await loadProfile(user.uid);
  }, [user, loadProfile]);

  useEffect(() => {
    /**
     * IMPORTANT: Do NOT make this callback async.
     * Firebase's onAuthStateChanged does not await the callback's return value.
     * An async callback that throws would become an unhandled Promise rejection.
     */
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Start profile load; errors are handled inside loadProfile.
        loadProfile(firebaseUser.uid).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated: !!user,
        isPro: profile?.plan === "pro" || profile?.plan === "enterprise",
        isEnterprise: profile?.plan === "enterprise",
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
