"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { SupabaseClient, Session, User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True when the user arrived via a password recovery link. */
  isRecovery: boolean;
  clearRecovery: () => void;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  function getSupabase(): SupabaseClient {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Detect password recovery flow
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function clearRecovery() {
    setIsRecovery(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) {
      return { error: error.message, needsConfirmation: false };
    }
    const needsConfirmation = !data.session && !!data.user;
    return { error: null, needsConfirmation };
  }

  async function handleSignOut() {
    setIsRecovery(false);
    await getSupabase().auth.signOut();
  }

  async function updatePassword(newPassword: string) {
    const { error } = await getSupabase().auth.updateUser({
      password: newPassword,
    });
    return { error: error?.message ?? null };
  }

  return (
    <AuthContext
      value={{
        user,
        session,
        loading,
        isRecovery,
        clearRecovery,
        signIn,
        signUp,
        signOut: handleSignOut,
        updatePassword,
      }}
    >
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
