"use client";

import { useEffect, useMemo, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function Countdown() {
  // Super Bowl LX: Feb 8, 2026, 6:30pm ET
  const target = useMemo(() => new Date("2026-02-08T18:30:00-05:00"), []);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="text-sm text-white/70">Kickoff Countdown</div>
      <div className="mt-2 flex flex-wrap gap-3 text-3xl font-semibold">
        <span>{days}d</span>
        <span>{pad(hours)}h</span>
        <span>{pad(minutes)}m</span>
        <span>{pad(seconds)}s</span>
      </div>
      <div className="mt-3 text-xs text-white/60">
        Sun, Feb 8, 2026 • 6:30 PM ET
      </div>
    </div>
  );
}
