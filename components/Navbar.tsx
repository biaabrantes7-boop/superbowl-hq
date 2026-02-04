"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!mounted) return null; // 🚨 fixes hydration glitch

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
      <div className="flex gap-6">
        <Link href="/">Dashboard</Link>
        <Link href="/predictions">Predictions</Link>
        <Link href="/squares">Squares</Link>
        <Link href="/food">Food & Drinks</Link>
        <Link href="/halftime">Halftime</Link>
        <Link href="/commercials">Commercials</Link>
        <Link href="/bingo">Bingo</Link>
      </div>

      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <span className="opacity-70">{user.email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="border px-3 py-1 rounded"
            >
              Log out
            </button>
          </>
        ) : (
          <Link href="/login" className="border px-3 py-1 rounded">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
