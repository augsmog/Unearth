"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Ensures the user has a Supabase session, signing in anonymously if needed.
 * Returns { userId, isAnonymous, isLoading }.
 */
export function useAnonymousAuth() {
  const [state, setState] = useState<{
    userId: string | null;
    isAnonymous: boolean;
    isLoading: boolean;
  }>({ userId: null, isAnonymous: false, isLoading: true });

  useEffect(() => {
    const supabase = createClient();

    async function ensureSession() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setState({
          userId: user.id,
          isAnonymous: user.is_anonymous === true,
          isLoading: false,
        });
        return;
      }

      // No session — sign in anonymously
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error("Anonymous sign-in failed:", error.message);
        setState({ userId: null, isAnonymous: false, isLoading: false });
        return;
      }

      setState({
        userId: data.user?.id ?? null,
        isAnonymous: true,
        isLoading: false,
      });
    }

    ensureSession();
  }, []);

  return state;
}
