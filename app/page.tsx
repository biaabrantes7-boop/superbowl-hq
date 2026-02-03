"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const KICKOFF = new Date("2026-02-08T18:30:00-05:00");

/**
 * ✅ EDIT THESE NUMBERS/PLAYERS/INJURIES ANYTIME.
 * This is your "producer notes" area.
 */
const TEAMS = {
  patriots: {
    short: "Patriots",
    name: "New England Patriots",
    logo: "/teams/patriots.png",
    color: "#c60c30",
    record: "14–3",
    seed: "#1 AFC",
    stats: {
      ppg: "28.4",
      ypg: "382",
      turnovers: "+11",
      thirdDown: "44%",
    },
    keyPlayers: [
      { pos: "QB", name: "Drake Maye" },
      { pos: "RB", name: "Rhamondre Stevenson" },
      { pos: "WR", name: "DeMario Douglas" },
      { pos: "DEF", name: "Top-5 Scoring Defense" },
    ],
    injuries: ["LT questionable (ankle)", "CB probable (hamstring)"],
  },

  seahawks: {
    short: "Seahawks",
    name: "Seattle Seahawks",
    logo: "/teams/seahawks.png",
    color: "#69BE28",
    record: "13–4",
    seed: "#2 NFC",
    stats: {
      ppg: "26.9",
      ypg: "365",
      turnovers: "+7",
      thirdDown: "41%",
    },
    keyPlayers: [
      { pos: "QB", name: "Geno Smith" },
      { pos: "RB", name: "Kenneth Walker III" },
      { pos: "WR", name: "DK Metcalf" },
      { pos: "DEF", name: "Elite Secondary" },
    ],
    injuries: ["S probable (shoulder)"],
  },
};

export default function DashboardPage() {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = KICKOFF.getTime() - now.getTime();
  const isLive = diff <= 0;

  const countdownText = useMemo(() => {
    if (isLive) return "LIVE";
    const total = Math.max(0, Math.floor(diff / 1000));
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  }, [diff, isLive]);

  return (
    <div className="space-y-10 text-white">
      {/* ================= SCOREBUG ================= */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#081427] via-black to-[#081427] p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            <TeamBug
              logo={TEAMS.patriots.logo}
              name={TEAMS.patriots.short}
              record={TEAMS.patriots.record}
              seed={TEAMS.patriots.seed}
              align="left"
            />

            <div className="text-center">
              <div className="text-xs font-semibold tracking-widest text-white/60">
                SUPER BOWL LX
              </div>

              <div
                className={[
                  "mt-1 rounded-md px-3 py-1 text-sm font-bold",
                  isLive
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-white/10 text-white",
                ].join(" ")}
              >
                {countdownText}
              </div>

              <div className="mt-1 text-xs text-white/60">
                Sun, Feb 8, 2026 • 6:30 PM ET
              </div>
              <div className="text-xs text-white/50">
                Levi’s Stadium • Santa Clara, CA
              </div>
            </div>

            <TeamBug
              logo={TEAMS.seahawks.logo}
              name={TEAMS.seahawks.short}
              record={TEAMS.seahawks.record}
              seed={TEAMS.seahawks.seed}
              align="right"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
            🏈 RBG Household Broadcast
          </div>
        </div>
      </section>

      {/* ================= TEAM COMPARISON ================= */}
      <section className="grid gap-6 md:grid-cols-2">
        <TeamComparisonCard team={TEAMS.patriots} />
        <TeamComparisonCard team={TEAMS.seahawks} />
      </section>

      {/* ================= SUPER BOWL NOTES ================= */}
      <section className="rounded-2xl border border-white/10 bg-white/10 p-6">
        <h2 className="text-xl font-semibold tracking-tight">
          Broadcast Notes (Tonight’s Storylines)
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <StoryCard
            title="What to watch"
            items={[
              "Red zone efficiency + turnovers decide everything.",
              "Explosive plays vs sustained drives.",
              "Halftime show: rate it instantly after it ends.",
            ]}
          />

          <StoryCard
            title="RBG household agenda"
            items={[
              "Arrive 1 hour early (squares + snacks).",
              "Halftime: update ratings + hot takes.",
              "Final: awards + worst take ceremony 😈",
            ]}
          />
        </div>
      </section>

      {/* ================= BRANDING ================= */}
      <section className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
        <div className="text-sm uppercase tracking-widest text-white/50">
          Game Night Coverage
        </div>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">
          SUPER BOWL SUNDAY
        </h2>
        <p className="mt-2 text-white/70">
          Stats. Takes. Commercials. Chaos.
        </p>
      </section>
    </div>
  );
}

/* ================= helpers/components ================= */

function TeamBug({
  logo,
  name,
  record,
  seed,
  align,
}: {
  logo: string;
  name: string;
  record: string;
  seed: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex items-center gap-3 ${
        align === "right" ? "flex-row-reverse" : ""
      }`}
    >
      <Image src={logo} alt={name} width={56} height={56} className="rounded" />
      <div className={align === "right" ? "text-right" : ""}>
        <div className="text-lg font-bold">{name}</div>
        <div className="text-xs text-white/60">
          {record} • {seed}
        </div>
      </div>
    </div>
  );
}

function TeamComparisonCard({ team }: { team: any }) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/10 p-6"
      style={{ borderLeft: `6px solid ${team.color}` }}
    >
      <h3 className="text-xl font-bold">{team.name}</h3>
      <p className="mt-1 text-sm text-white/60">
        {team.record} • {team.seed}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Stat label="Points / Game" value={team.stats.ppg} />
        <Stat label="Yards / Game" value={team.stats.ypg} />
        <Stat label="Turnover Diff." value={team.stats.turnovers} />
        <Stat label="3rd Down %" value={team.stats.thirdDown} />
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="text-xs uppercase tracking-widest text-white/50">
          Key Players
        </div>
        <ul className="mt-2 space-y-1 text-sm text-white/80">
          {team.keyPlayers.map((p: any) => (
            <li key={p.pos}>
              <span className="text-white/50">{p.pos}:</span> {p.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="text-xs uppercase tracking-widest text-white/50">
          Injury Report
        </div>
        <ul className="mt-2 list-disc pl-5 text-sm text-white/80">
          {team.injuries.map((i: string) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/60">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function StoryCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="text-base font-semibold">{title}</div>
      <ul className="mt-2 list-disc pl-5 text-sm text-white/80">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
