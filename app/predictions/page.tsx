"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type PredictionRow = {
  id: string;
  room_code: string;
  name: string;

  winner: string;
  patriots_score: string;
  seahawks_score: string;

  gatorade_color: string;
  mvp: string;
  awards: string;

  created_at: string;
  updated_at: string;
};

const NAME_KEY = "rbg_superbowl_name_v1";
const ROOM_KEY = "rbg_superbowl_room_code_v1";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PredictionsPage() {
  // identity
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("RBG2026");
  const [roomReady, setRoomReady] = useState(false);

  // form state
  const [winner, setWinner] = useState("");
  const [patsScore, setPatsScore] = useState("");
  const [hawksScore, setHawksScore] = useState("");
  const [gatorade, setGatorade] = useState("");
  const [mvp, setMvp] = useState("");
  const [awards, setAwards] = useState("");

  // board
  const [all, setAll] = useState<PredictionRow[]>([]);
  const [loading, setLoading] = useState(false);

  // autofill from login
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
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("room_code", code)
      .order("updated_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setAll((data ?? []) as PredictionRow[]);
  }

  // realtime sync
  useEffect(() => {
    if (!roomReady || !roomLabel) return;

    loadRoom(roomLabel);

    const channel = supabase
      .channel(`predictions-${roomLabel}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "predictions", filter: `room_code=eq.${roomLabel}` },
        () => loadRoom(roomLabel)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomReady, roomLabel]);

  function joinRoom() {
    const code = roomCode.trim().toUpperCase();
    if (!code) {
      alert("Enter a room code");
      return;
    }
    localStorage.setItem(ROOM_KEY, code);
    setRoomCode(code);
    setRoomReady(true);
  }

  async function submitPrediction() {
    if (!roomReady) {
      alert("Join a room first.");
      return;
    }
    if (!name.trim()) {
      alert("Name missing. Re-login.");
      return;
    }
    if (!winner || !patsScore || !hawksScore) {
      alert("Pick winner and final score.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("predictions").upsert(
      {
        room_code: roomLabel,
        name: name.trim(),
        winner,
        patriots_score: patsScore,
        seahawks_score: hawksScore,
        gatorade_color: gatorade,
        mvp,
        awards,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "room_code,name" }
    );
    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setGatorade("");
    setMvp("");
    setAwards("");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-header tracking-tight">Predictions</h1>
        <p className="mt-2 text-white/70">
          Game + prop predictions only. One card per person. Updates live.
        </p>
      </div>

      {/* Room */}
      <div className="rounded-2xl border border-white/10 bg-white/10 p-6">
        <div className="text-xs uppercase tracking-widest text-white/50">Shared Room</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Room code"
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
          />
          <button
            onClick={joinRoom}
            className="rounded-xl bg-[#c60c30] px-5 py-3 text-sm font-semibold"
          >
            {roomReady ? `Room: ${roomLabel}` : "Join Room"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/10 p-6 space-y-4">
          <h2 className="text-xl font-header">Your Picks</h2>

          <select
            value={winner}
            onChange={(e) => setWinner(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
          >
            <option value="">Winner</option>
            <option>Patriots</option>
            <option>Seahawks</option>
          </select>

          <div className="grid grid-cols-2 gap-3">
            <input
              value={patsScore}
              onChange={(e) => setPatsScore(e.target.value)}
              placeholder="Patriots score"
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
            />
            <input
              value={hawksScore}
              onChange={(e) => setHawksScore(e.target.value)}
              placeholder="Seahawks score"
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
            />
          </div>

          <input
            value={gatorade}
            onChange={(e) => setGatorade(e.target.value)}
            placeholder="Gatorade color"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
          />

          <input
            value={mvp}
            onChange={(e) => setMvp(e.target.value)}
            placeholder="Super Bowl MVP"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
          />

          <textarea
            value={awards}
            onChange={(e) => setAwards(e.target.value)}
            placeholder="Other awards / bold takes"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm min-h-[80px]"
          />

          <button
            onClick={submitPrediction}
            disabled={loading}
            className="w-full rounded-xl bg-[#c60c30] px-5 py-3 text-sm font-semibold"
          >
            {loading ? "Saving..." : "Post / Update My Prediction"}
          </button>
        </section>

        {/* Board */}
        <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/10 p-6">
          <h2 className="text-xl font-header mb-4">Room Predictions</h2>

          {!roomReady ? (
            <p className="text-white/60">Join a room to see predictions.</p>
          ) : all.length === 0 ? (
            <p className="text-white/60">No predictions yet.</p>
          ) : (
            <div className="space-y-4">
              {all.map((p) => (
                <div key={p.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-white/50">{formatTime(p.updated_at)}</span>
                  </div>

                  <div className="mt-2 text-sm">
                    Winner: <b>{p.winner}</b> ({p.patriots_score}–{p.seahawks_score})
                  </div>

                  {p.gatorade_color && (
                    <div className="text-sm text-white/70">
                      Gatorade: {p.gatorade_color}
                    </div>
                  )}
                  {p.mvp && (
                    <div className="text-sm text-white/70">
                      MVP: {p.mvp}
                    </div>
                  )}
                  {p.awards && (
                    <div className="text-sm text-white/70">
                      Notes: {p.awards}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
