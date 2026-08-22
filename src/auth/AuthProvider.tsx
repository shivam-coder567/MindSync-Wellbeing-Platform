import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import {
  ensureStudentProfileForAuthUser,
  getStudentProfileForAuthUser,
} from "../services/studentService";
import type { StudentProfile } from "../types/auth";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: StudentProfile | null;
  loading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  clearLocalSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = async (authUserId: string) => {
    setProfileError(null);

    try {
      let studentProfile = await getStudentProfileForAuthUser(authUserId);

      if (!studentProfile) {
        await ensureStudentProfileForAuthUser();
        studentProfile = await getStudentProfileForAuthUser(authUserId);
      }

      setProfile(studentProfile);

      if (!studentProfile) {
        setProfileError(
          "Your account is signed in, but a student record could not be created yet.",
        );
      }
    } catch (error) {
      console.error("Failed to load student profile:", error);

      setProfileError(
        "Your account is signed in, but its student profile could not be loaded.",
      );
    }
  };

  const refreshProfile = async () => {
    if (!session?.user) return;

    setLoading(true);

    try {
      await loadProfile(session.user.id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;

    const initializeAuth = async () => {
      setLoading(true);

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!alive) return;

      setSession(currentSession);

      if (currentSession?.user) {
        await loadProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }

      if (alive) {
        setLoading(false);
      }
    };

    void initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!alive) return;

        setLoading(true);
        setSession(nextSession);
        setProfile(null);
        setProfileError(null);

        if (nextSession?.user) {
          await loadProfile(nextSession.user.id);
        }

        if (alive) {
          setLoading(false);
        }
      },
    );

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileError,
      refreshProfile,
      signOut: async () => {
        const { error } = await supabase.auth.signOut();

        setSession(null);
        setProfile(null);
        setProfileError(null);

        if (error) throw error;
      },
      clearLocalSession: async () => {
        const { error } = await supabase.auth.signOut({ scope: "local" });

        setSession(null);
        setProfile(null);
        setProfileError(null);

        if (error) throw error;
      },
    }),
    [session, profile, loading, profileError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
