"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type PredictionRow = {
  id: string;
  created_at: string;
  author_name: string;
  room_code: string;
  payload: any; // stored as jsonb
};

const DEFAULT_ROOM = "RBG-SB"; // change if you want

// Safe: create client on client side with env vars
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url.startsWith("http") || !key) return null;
  return createClient(url, key);
}

const CATEGORIES = [
  { key: "winner", label: "Winner" },
  { key: "score", label: "Final Score" },
  { key: "mvp", label: "Super Bowl MVP" },
  { key: "first_td", label: "First TD scorer" },
  { key: "gatorade", label: "Gatorade color" },
  { key: "coin_toss", label: "Coin toss (Heads/Tails)" },
  { key: "halftime_guest", label: "Halftime surprise guest" },
  { key: "halftime_rating", label: "Halftime rating (1–10)" },
  { key: "anthem_over", label: "National anthem: Over/Under" },
  { key: "crazy_event", label: "One chaotic prediction" },
];

export default function PredictionsPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [me, setMe] = useState<string>("");
  const [room, setRoom] = useState<string>(DEFAULT_ROOM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState<Record<string, string>>(() => {
    // start empty draft
    const obj: Record<string, string> = {};
    for (const c of CATEGORIES) obj[c.key] = "";
    return obj;
  });

  const [posts, setPosts] = useState<PredictionRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load my name from localStorage
  useEffect(() => {
    const n = localStorage.getItem("rbg_name") || "";
    setMe(n);
  }, []);

  // Load existing predictions for room
  useEffect(() => {
    let alive = true;

    async function load() {
      setError(null);

      if (!supabase) {
        setLoading(false);
        setError(
          "Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel."
        );
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("room_code", room)
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (error) {
        setError(error.message);
        setPosts([]);
      } else {
        setPosts((data as any) ?? []);
      }

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [room, supabase]);

  // Realtime subscription
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel(`predictions-room-${room}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "predictions", filter: `room_code=eq.${room}` },
        () => {
          // re-fetch when anything changes
          supabase
            .from("predictions")
            .select("*")
            .eq("room_code", room)
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
              if (!error) setPosts((data as any) ?? []);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room, supabase]);

  const myLatest = useMemo(() => {
    if (!me) return null;
    return posts.find((p) => p.author_name === me) ?? null;
  }, [me, posts]);

  async function publish() {
    setError(null);

    if (!me) {
      setError("No name found. Go to Login and choose your name.");
      return;
    }
    if (!supabase) {
      setError("Supabase not configured.");
      return;
    }

    // Simple validation: require winner + score at minimum
    if (!draft.winner.trim() || !draft.score.trim()) {
      setError("Fill at least Winner + Final Score before posting.");
      return;
    }

    setSaving(true);

    const payload = {
      ...draft,
      postedAt: new Date().toISOString(),
    };

    const { error } = await supabase.from("predictions").insert({
      author_name: me,
      room_code: room,
      payload,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Clear draft after successful post
    const cleared: Record<string, string> = {};
    for (const c of CATEGORIES) cleared[c.key] = "";
    setDraft(cleared);
  }

  const shareLink = useMemo(() => {
    // If you later want “share links”, this keeps it simple:
    // People just go to /predictions and set the same room code
    return `${typeof window !== "undefined" ? window.location.origin : ""}/predictions`;
  }, []);

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Predictions</h1>
            <p className="mt-1 text-white/60">
              Everyone posts their own prediction sheet — everyone sees everyone’s picks.
            </p>
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            <div className="text-sm text-white/70">
              Logged in as:{" "}
              <span className="font-semibold text-white">{me || "(not set)"}</span>
            </div>
            <div className="text-xs text-white/50">
              Share: <span className="text-white/70">{shareLink}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: Draft form */}
        <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Picks</h2>
            <span className="text-xs text-white/60">Room</span>
          </div>

          <div className="mt-3">
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none"
              placeholder="RBG-SB"
            />
            <p className="mt-2 text-xs text-white/50">
              Everyone must use the same room code for “sync”.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {CATEGORIES.map((c) => (
              <div key={c.key}>
                <label className="text-sm text-white/70">{c.label}</label>
                <input
                  value={draft[c.key] || ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [c.key]: e.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 outline-none"
                  placeholder="Type your pick…"
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {myLatest && (
            <div className="mt-5 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
              ✅ You’ve posted already. (You can post again; newest shows first.)
            </div>
          )}

          <button
            onClick={publish}
            disabled={saving}
            className="mt-6 w-full rounded-xl bg-white/10 px-4 py-3 font-semibold hover:bg-white/20 disabled:opacity-50"
          >
            {saving ? "Posting..." : "Post my predictions"}
          </button>
        </div>

        {/* RIGHT: Feed */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Everyone’s Predictions</h2>
            <div className="text-xs text-white/60">
              {loading ? "Loading..." : `${posts.length} post(s)`}
            </div>
          </div>

          {loading ? (
            <div className="mt-6 text-white/70">Loading predictions…</div>
          ) : posts.length === 0 ? (
            <div className="mt-6 text-white/70">
              No posts yet. Be the first one 😈
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {posts.map((p) => (
                <PredictionCard
                  key={p.id}
                  author={p.author_name}
                  createdAt={p.created_at}
                  payload={p.payload}
                  highlight={me && p.author_name === me}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function PredictionCard({
  author,
  createdAt,
  payload,
  highlight,
}: {
  author: string;
  createdAt: string;
  payload: any;
  highlight: boolean;
}) {
  const when = new Date(createdAt);
  const stamp = isNaN(when.getTime())
    ? createdAt
    : when.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

  return (
    <div
      className={[
        "rounded-2xl border p-4",
        highlight
          ? "border-white/30 bg-white/10"
          : "border-white/10 bg-black/30",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{author}</div>
          <div className="text-xs text-white/60">{stamp}</div>
        </div>
        {highlight && (
          <div className="text-xs rounded-full border border-white/20 bg-white/10 px-2 py-1">
            you
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
        {CATEGORIES.map((c) => (
          <div key={c.key} className="flex justify-between gap-3">
            <span className="text-white/60">{c.label}</span>
            <span className="font-medium text-right">
              {payload?.[c.key] ? String(payload[c.key]) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}