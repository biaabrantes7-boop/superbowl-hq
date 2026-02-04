"use client";

import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button
        onClick={signIn}
        className="px-6 py-3 border rounded text-lg"
      >
        Sign in with Google
      </button>
    </div>
  );
}
