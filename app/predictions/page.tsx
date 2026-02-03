"use client";

import { useEffect, useState } from "react";

export default function PredictionsPage() {
  const [who, setWho] = useState<string>("");

  useEffect(() => {
    // Safe localStorage access (only runs in browser)
    const v = window.localStorage.getItem("sb_name") || "";
    setWho(v);
  }, []);

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-header">Predictions</h1>
      <p className="mt-2 text-white/70">
        Predictions page is loading on Vercel ✅
      </p>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/60">Stored name</div>
        <div className="text-lg">{who || "(none yet)"}</div>
      </div>
    </div>
  );
}
