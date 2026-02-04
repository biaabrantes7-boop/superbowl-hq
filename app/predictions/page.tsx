"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { getStoredName } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

type PredictionRow = {
  id: string;
  created_at: string;
  room: string;
  name: string;
  team: string;
  score: string;
};

export default function PredictionsPage() {
  return (
    <AuthGate>
      <PredictionsInner />
    </AuthGate>
  );
}

function PredictionsInner() {
  const [name, setName] = useState<string>("");
  const [room, setRoom] = useState("2027");
  const [team, setTeam] = useState("Patriots");
  const [score, setScore] = useState("");
  const [rows, setRows] = useState<PredictionRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setName(getStoredName() || "");
  }, []);

  async function loadPredictions(currentRoom: string) {
    setStatus(null);
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("room", currentRoom)
      .order("created_at", { ascending: false });

    if (error) {
      setStatus(`Load error: ${error.message}`);
      return;
    }
    setRows((data as PredictionRow[]) || []);
  }

  useEffect(() => {
    loadPredictions(room);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  async function submitPrediction() {
    setStatus(null);

    if (!name) return setStatus("No name found. Log in again.");
    if (!score.trim()) return setStatus("Enter a score (ex: 27-24)");

    const { error } = await supabase.from("predictions").insert([
      {
        room,
        name,
        team,
        score: score.trim(),
      },
    ]);

    if (error) {
      setStatus(`Save error: ${error.message}`);
      return;
    }

    setScore("");
    setStatus("✅ Saved!");
    loadPredictions(room);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Predictions</h1>
        <p className="mt-2 text-white/70">
          Submit your final score + winner. Everyone in room {room} sees it live.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <div className="text-sm text-white/60">Room</div>
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none"
            />
          </div>

          <div>
            <div className="text-sm text-white/60">Name</div>
            <div className="mt-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              {name || "(not logged in)"}
            </div>
          </div>

          <div>
            <div className="text-sm text-white/60">Winner</div>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none"
            >
              <option>Patriots</option>
              <option>Seahawks</option>
            </select>
          </div>

          <div>
            <div className="text-sm text-white/60">Final score</div>
            <input
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="27-24"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none"
            />
          </div>
        </div>

        <button
          onClick={submitPrediction}
          className="rounded-xl bg-white px-4 py-2 font-semibold text-black hover:opacity-90"
        >
          Save prediction
        </button>

        {status && (
          <div className="text-sm text-white/70">
            {status}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-sm uppercase tracking-widest text-white/50">
          Room {room} predictions
        </div>

        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <div className="text-white/60">No predictions yet.</div>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-sm text-white/60">
                    Winner: {r.team}
                  </div>
                </div>
                <div className="text-lg font-bold">{r.score}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
