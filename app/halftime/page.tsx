"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Vibe = "🔥 Great" | "👌 Solid" | "😐 Mid" | "🗑️ Bad" | "";

type HalftimeRow = {
  id: string;
  room_code: string;
  name: string;

  guests: string | null;
  outfit_changes: string | null;
  song_predictions: string | null;
  vibe_prediction: string;

  rating: number | null;
  review: string | null;

  created_at: string;
  updated_at: string;
};

const NAME_KEY = "rbg_superbowl_name_v1";
const ROOM_KEY = "rbg_superbowl_room_code_v1";

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function clampRating(s: string): string {
  const t = s.trim();
  if (!t) return "";
  if (!/^\d+$/.test(t)) return "";
  const n = Number(t);
  if (n < 1) return "1";
  if (n > 10) return "10";
  return String(n);
}

export default function HalftimePage() {
  // room + identity
  const [roomCode, setRoomCode] = useState("2027");
  const [roomReady, setRoomReady] = useState(false);
  const [name, setName] = useState("");

  // board
  const [all, setAll] = useState<HalftimeRow[]>([]);
  const [loading, setLoading] = useState(false);

  // form
  const [guests, setGuests] = useState("");
  const [outfitChanges, setOutfitChanges] = useState("");
  const [songPredictions, setSongPredictions] = useState("");
  const [vibePrediction, setVibePrediction] = useState<Vibe>("");

  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");

  // Autofill name + room
  useEffect(() => {
    const n = localStorage.getItem(NAME_KEY);
    if (n) setName(n);

    const r = localStorage.getItem(ROOM_KEY);
    if (r) {
      setRoomCode(r);
      setRoomReady(true);
    }
  }, []);

  const roomLabel = useMemo(() => roomCode.trim().toUpperCase(), [roomCode]);

  async function loadRoom(code: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("halftime_entries")
      .select("*")
      .eq("room_code", code)
      .order("updated_at", { ascending: false });

    setLoading(false);

    if (error) {
      alert(`Load failed: ${error.message}`);
      return;
    }

    setAll((data ?? []) as HalftimeRow[]);
  }

  // realtime
  useEffect(() => {
    if (!roomReady || !roomLabel) return;

    loadRoom(roomLabel);

    const channel = supabase
      .channel(`halftime-${roomLabel}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "halftime_entries", filter: `room_code=eq.${roomLabel}` },
        () => loadRoom(roomLabel)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomReady, roomLabel]);

  function joinRoom() {
    const code = roomCode.trim().toUpperCase();
    if (!code) {
      alert("Enter a room code (ex: 2027)");
      return;
    }
    localStorage.setItem(ROOM_KEY, code);
    setRoomCode(code);
    setRoomReady(true);
  }

  function resetForm() {
    setGuests("");
    setOutfitChanges("");
    setSongPredictions("");
    setVibePrediction("");
    setRating("");
    setReview("");
  }

  function validate(): string | null {
    if (!roomReady) return "Join a room first.";
    if (!name.trim()) return "Name missing (re-login).";
    if (!vibePrediction) return "Pick a vibe prediction.";
    if (rating.trim()) {
      if (!/^\d+$/.test(rating.trim())) return "Rating must be a number 1–10.";
      const n = Number(rating);
      if (n < 1 || n > 10) return "Rating must be 1–10.";
    }
    return null;
  }

  async function postOrUpdate() {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    const payload = {
      room_code: roomLabel,
      name: name.trim(),
      guests: guests.trim() || null,
      outfit_changes: outfitChanges.trim() || null,
      song_predictions: songPredictions.trim() || null,
      vibe_prediction: vibePrediction,
      rating: rating.trim() ? Number(rating) : null,
      review: review.trim() || null,
      updated_at: new Date().toISOString(),
    };

    setLoading(true);
    const { error } = await supabase
      .from("halftime_entries")
      .upsert(payload, { onConflict: "room_code,name" });
    setLoading(false);

    if (error) {
      alert(`Post failed: ${error.message}`);
      return;
    }

    resetForm();
    loadRoom(roomLabel);
  }

  async function deleteMine() {
    if (!roomReady) return;
    const ok = confirm("Delete YOUR halftime card from this room?");
    if (!ok) return;

    setLoading(true);
    const { error } = await supabase
      .from("halftime_entries")
      .delete()
      .eq("room_code", roomLabel)
      .eq("name", name.trim());
    setLoading(false);

    if (error) {
      alert(`Delete failed: ${error.message}`);
      return;
    }
    loadRoom(roomLabel);
  }

  function loadIntoForm(row: HalftimeRow) {
    // let people view others by loading, but they can't overwrite unless they share same name
    setGuests(row.guests ?? "");
    setOutfitChanges(row.outfit_changes ?? "");
    setSongPredictions(row.song_predictions ?? "");
    setVibePrediction((row.vibe_prediction as Vibe) ?? "");
    setRating(row.rating === null ? "" : String(row.rating));
    setReview(row.review ?? "");
  }

  const avgRating = useMemo(() => {
    const nums = all
      .map((x) => x.rating)
      .filter((n): n is number => typeof n === "number" && n >= 1 && n <= 10);
    if (nums.length === 0) return null;
    const sum = nums.reduce((a, b) => a + b, 0);
    return Math.round((sum / nums.length) * 10) / 10;
  }, [all]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-header tracking-tight">Halftime Show Central</h1>
          <p className="mt-2 text-white/70 font-body">
            Everyone has ONE halftime card. Posting again updates yours. Syncs live across phones.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70">
            Avg rating:{" "}
            <span className="text-white font-semibold">
              {avgRating === null ? "—" : `${avgRating}/10`}
            </span>
          </div>
          <button
            onClick={deleteMine}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80 hover:bg-black/30 disabled:opacity-60"
            disabled={!roomReady || loading}
          >
            Delete mine
          </button>
        </div>
      </div>

      {/* Room */}
      <div className="rounded-2xl border border-white/10 bg-white/10 p-6">
        <div className="text-xs uppercase tracking-widest text-white/50">Shared Room</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Room code (ex: 2027)"
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (from login)"
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white"
          />
          <button
            onClick={joinRoom}
            className="rounded-xl bg-[#c60c30] px-5 py-3 text-sm font-semibold hover:opacity-90"
          >
            {roomReady ? `Room: ${roomLabel}` : "Join Room"}
          </button>
        </div>
        <div className="mt-3 text-xs text-white/50">
          Everyone must use the same room code to sync.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs tracking-wide text-white/70">YOUR CARD</div>
              <h2 className="mt-2 text-xl font-header">Your halftime take</h2>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
              {loading ? "Syncing..." : "Live"}
            </div>
          </div>

          <div className="mt-5 space-y-5 font-body">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold">Predictions</div>

              <div className="mt-3 space-y-3">
                <Field label="Surprise guests (comma-separated)">
                  <input
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    placeholder="Guest 1, Guest 2..."
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Outfit changes (# guess)">
                    <input
                      value={outfitChanges}
                      onChange={(e) => setOutfitChanges(e.target.value)}
                      placeholder="3"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white"
                    />
                  </Field>

                  <Field label="Vibe prediction (required)">
                    <select
                      value={vibePrediction}
                      onChange={(e) => setVibePrediction(e.target.value as Vibe)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white"
                    >
                      <option value="">Select…</option>
                      <option value="🔥 Great">🔥 Great</option>
                      <option value="👌 Solid">👌 Solid</option>
                      <option value="😐 Mid">😐 Mid</option>
                      <option value="🗑️ Bad">🗑️ Bad</option>
                    </select>
                  </Field>
                </div>

                <Field label="Song predictions">
                  <textarea
                    value={songPredictions}
                    onChange={(e) => setSongPredictions(e.target.value)}
                    className="min-h-[90px] w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white"
                    placeholder="Song 1, Song 2..."
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold">After halftime</div>
              <p className="mt-1 text-xs text-white/60">
                Fill this out after the show (rating optional).
              </p>

              <div className="mt-3 space-y-3">
                <Field label="Rating (1–10)">
                  <input
                    value={rating}
                    onChange={(e) => setRating(clampRating(e.target.value))}
                    inputMode="numeric"
                    placeholder="9"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white"
                  />
                </Field>

                <Field label="Quick review / hot take">
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="min-h-[90px] w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white"
                    placeholder="Best moment? Worst moment?"
                  />
                </Field>
              </div>
            </div>

            <button
              onClick={postOrUpdate}
              disabled={!roomReady || loading}
              className="w-full rounded-xl bg-[#c60c30] px-5 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Posting..." : "Post / Update my halftime card"}
            </button>

            <button
              onClick={resetForm}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-5 py-3 text-sm text-white/80 hover:bg-black/30"
            >
              Reset form
            </button>
          </div>
        </section>

        {/* Board */}
        <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs tracking-wide text-white/70">ROOM BOARD</div>
              <h2 className="mt-2 text-xl font-header">Everyone’s halftime cards</h2>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
              {loading ? "Loading..." : `Total: ${all.length}`}
            </div>
          </div>

          {!roomReady ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-6 text-white/70">
              Join a room to see everyone’s halftime cards.
            </div>
          ) : all.length === 0 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-6 text-white/70">
              No halftime cards yet — be the first.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {all.map((e) => (
                <div key={e.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">{e.name}</div>
                      <div className="text-xs text-white/60">Updated: {formatTime(e.updated_at)}</div>
                    </div>

                    <button
                      onClick={() => loadIntoForm(e)}
                      className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80 hover:bg-black/40"
                      title="Loads into your form (won't overwrite unless you post under your name)"
                    >
                      View fields
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <MiniCard title="Vibe" value={e.vibe_prediction || "—"} />
                    <MiniCard title="Outfit changes" value={e.outfit_changes ?? "—"} />
                    <MiniCard title="Rating" value={e.rating ? `${e.rating}/10` : "—"} />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Detail title="Guests" value={e.guests ?? "—"} />
                    <Detail title="Songs" value={e.song_predictions ?? "—"} />
                    <Detail title="Review" value={e.review ?? "—"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-xs text-white/70">{label}</div>
      {children}
    </label>
  );
}

function MiniCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/60">{title}</div>
      <div className="mt-2 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Detail({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/60">{title}</div>
      <div className="mt-2 whitespace-pre-wrap text-sm text-white/80">{value}</div>
    </div>
  );
}
