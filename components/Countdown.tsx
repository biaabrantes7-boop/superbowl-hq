"use client";

import { useEffect, useMemo, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function Countdown() {
  // Kickoff: Feb 8, 2026 @ 6:30 PM ET
  const kickoff = useMemo(() => new Date("2026-02-08T18:30:00-05:00"), []);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(id);
  }, []);

  const diffMs = Math.max(0, kickoff.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="text-xs tracking-wide text-white/70">KICKOFF COUNTDOWN</div>

      <div className="mt-3 grid grid-cols-4 gap-3 text-center">
        <TimeBox label="DAYS" value={String(days)} />
        <TimeBox label="HRS" value={pad(hours)} />
        <TimeBox label="MIN" value={pad(minutes)} />
        <TimeBox label="SEC" value={pad(seconds)} />
      </div>

      <div className="mt-4 text-xs text-white/60">
        Sun, Feb 8, 2026 • 6:30 PM ET
      </div>
    </div>
  );
}

function TimeBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-[10px] text-white/60">{label}</div>
    </div>
  );
}
