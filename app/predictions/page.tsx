"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PredictionsPage() {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setName(data.user.user_metadata?.full_name ?? data.user.email);
      }
    });
  }, []);

  if (!mounted) return null; // 🚨 hydration fix

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-2">Predictions</h1>
      <p className="opacity-70 mb-6">
        Drop your takes before kickoff 🏈
      </p>

      <div className="rounded-xl border border-white/10 p-6">
        <div className="text-sm opacity-60 mb-1">Stored name</div>
        <div className="text-xl">
          {name ?? "(none yet)"}
        </div>
      </div>
    </div>
  );
}
