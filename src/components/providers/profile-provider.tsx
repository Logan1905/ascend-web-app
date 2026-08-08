"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { fetchUserProfile } from "@/lib/supabase/profile";
import type { UserProfile } from "@/types/profile";

/**
 * Shares the signed-in user's profile with the whole app.
 *
 * Phase 2 exists mainly to expose `trackWorkouts` so later phases can branch on
 * it without every tab running its own query.
 */

interface ProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  /** True only when the user finished Progress setup and opted in. */
  trackWorkouts: boolean;
  /** True once Progress setup has been completed. */
  onboarded: boolean;
  /** Re-reads the profile. Call after anything that writes to it. */
  refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setProfile(await fetchUserProfile());
    } catch {
      // A missing profile or a not-yet-run migration shouldn't break the app.
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    // Async IIFE: React 19 forbids calling setState in an effect body.
    void (async () => {
      if (!user) {
        if (!cancelled) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      await refresh();
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, refresh]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading,
      // Opting in only counts once setup is actually finished.
      trackWorkouts: !!profile?.onboarded && !!profile.trackWorkouts,
      onboarded: !!profile?.onboarded,
      refresh,
    }),
    [profile, loading, refresh],
  );

  return <ProfileContext value={value}>{children}</ProfileContext>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
