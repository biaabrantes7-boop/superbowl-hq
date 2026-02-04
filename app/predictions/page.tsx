"use client";

// app/predictions/page.tsx
import { useEffect, useState } from "react";
import { getStoredName } from "@/lib/auth";
import AuthGate from "@/components/AuthGate";

export default function PredictionsPage() {
  return (
    <AuthGate>
      <PredictionsInner />
    </AuthGate>
  );
}

function PredictionsInner() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(getStoredName());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Predictions</h1>
        <p className="mt-2 text-white/70">
          Drop your takes before kickoff 😈
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-sm text-white/60">Stored name</div>
        <div className="text-lg font-semibold">{name ?? "(none yet)"}</div>
      </div>

      {/* your actual predictions UI goes here */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
        Coming next: MVP pick, final score, first TD, halftime rating, best commercial 🏈
      </div>
    </div>
  );
}
