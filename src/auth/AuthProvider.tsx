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

    /* Refresh the profile data without setting the global loading flag.
       Setting loading=true here would cause ProtectedRoute to unmount
       the entire layout and show a loading screen, creating a flash. */
    try {
      await loadProfile(session.user.id);
    } catch {
      /* profile error is already set inside loadProfile */
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
      async (event, nextSession) => {
        if (!alive) return;

        /*
         * Only show the full loading state and update React state for
         * events that genuinely change who is signed in.
         *
         * TOKEN_REFRESHED fires periodically (and when the tab regains
         * focus). Updating session/profile state on every token refresh
         * causes the entire component tree to re-render, which feels
         * like a full page reload to the user. Skip it entirely.
         */
        /*
         * Determine whether this event genuinely changes who is signed in.
         *
         * KEY INSIGHT: Supabase fires SIGNED_IN not only when a user
         * actually signs in, but also when the existing session is
         * recovered on tab return (via _recoverAndRefresh). Firing
         * setLoading(true) for a session recovery unmounts the entire
         * layout tree, destroying all page/game/form state.
         *
         * Fix: compare the incoming user ID with the current one.
         * If they match, it is a recovery — skip the loading state.
         */
        const currentUserId = session?.user?.id;
        const incomingUserId = nextSession?.user?.id;
        const userChanged = incomingUserId !== currentUserId;

        const isStructuralChange =
          event === "INITIAL_SESSION" ||
          event === "SIGNED_OUT" ||
          event === "USER_UPDATED" ||
          (event === "SIGNED_IN" && userChanged);

        if (!isStructuralChange) {
          /* TOKEN_REFRESHED, session recovery (same user), etc. —
             just update the session object silently. Do NOT set
             loading=true or clear profile. */
          setSession(nextSession);
          return;
        }

        /*
         * Genuine sign-in/sign-out/initial-session: show loading,
         * clear profile, re-fetch. This is the only path that
         * unmounts the layout via ProtectedRoute.
         */
        setLoading(true);
        setProfile(null);
        setProfileError(null);

        setSession(nextSession);

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
