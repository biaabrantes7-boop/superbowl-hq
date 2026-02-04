"use client";

import { useEffect, useMemo, useState } from "react";

type Prediction = {
  id: string;
  createdAt: number;

  name: string;

  winner: "Patriots" | "Seahawks" | "Other" | "";
  otherWinner?: string;

  finalScorePatriots: string;
  finalScoreSeahawks: string;

  halftimeRating: string; // 1-10 (string for easy input)
  halftimeGuests: string;
  outfitChanges: string;
  songPredictions: string;

  gatoradeColor:
    | "Red"
    | "Orange"
    | "Yellow"
    | "Green"
    | "Blue"
    | "Purple"
    | "Clear/Water"
    | "None"
    | "Other"
    | "";
  gatoradeOther?: string;

  awards: string; // MVP / first TD / etc
};

const STORAGE_KEY = "rbg_superbowl_predictions_v1";

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PredictionsPage() {
  const [all, setAll] = useState<Prediction[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [winner, setWinner] = useState<Prediction["winner"]>("");
  const [otherWinner, setOtherWinner] = useState("");
  const [finalScorePatriots, setFinalScorePatriots] = useState("");
  const [finalScoreSeahawks, setFinalScoreSeahawks] = useState("");

  const [halftimeRating, setHalftimeRating] = useState("");
  const [halftimeGuests, setHalftimeGuests] = useState("");
  const [outfitChanges, setOutfitChanges] = useState("");
  const [songPredictions, setSongPredictions] = useState("");

  const [gatoradeColor, setGatoradeColor] = useState<Prediction["gatoradeColor"]>("");
  const [gatoradeOther, setGatoradeOther] = useState("");
  const [awards, setAwards] = useState("");

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Prediction[];
      setAll(Array.isArray(parsed) ? parsed : []);
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [all]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setWinner("");
    setOtherWinner("");
    setFinalScorePatriots("");
    setFinalScoreSeahawks("");
    setHalftimeRating("");
    setHalftimeGuests("");
    setOutfitChanges("");
    setSongPredictions("");
    setGatoradeColor("");
    setGatoradeOther("");
    setAwards("");
  }

  function loadForEdit(p: Prediction) {
    setEditingId(p.id);
    setName(p.name);
    setWinner(p.winner);
    setOtherWinner(p.otherWinner ?? "");
    setFinalScorePatriots(p.finalScorePatriots);
    setFinalScoreSeahawks(p.finalScoreSeahawks);
    setHalftimeRating(p.halftimeRating);
    setHalftimeGuests(p.halftimeGuests);
    setOutfitChanges(p.outfitChanges);
    setSongPredictions(p.songPredictions);
    setGatoradeColor(p.gatoradeColor);
    setGatoradeOther(p.gatoradeOther ?? "");
    setAwards(p.awards);
  }

  function validate(): string | null {
    if (!name.trim()) return "Please enter your name.";
    if (!winner) return "Pick a winner.";
    if (winner === "Other" && !otherWinner.trim())
      return "If winner is Other, type the team name.";

    // Basic score sanity (optional but helpful)
    if (!finalScorePatriots.trim() || !finalScoreSeahawks.trim())
      return "Enter a final score for both teams.";
    if (!/^\d+$/.test(finalScorePatriots.trim()) || !/^\d+$/.test(finalScoreSeahawks.trim()))
      return "Scores must be whole numbers (e.g., 24).";

    if (halftimeRating && !/^\d+$/.test(halftimeRating.trim()))
      return "Halftime rating should be a number 1–10 (or leave blank).";
    if (halftimeRating) {
      const r = Number(halftimeRating);
      if (r < 1 || r > 10) return "Halftime rating must be between 1 and 10.";
    }

    if (!gatoradeColor) return "Pick a Gatorade color.";

    return null;
  }

  function onSubmit() {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    const payload: Prediction = {
      id: editingId ?? uid(),
      createdAt: editingId
        ? all.find((x) => x.id === editingId)?.createdAt ?? Date.now()
        : Date.now(),

      name: name.trim(),

      winner,
      otherWinner: winner === "Other" ? otherWinner.trim() : undefined,

      finalScorePatriots: finalScorePatriots.trim(),
      finalScoreSeahawks: finalScoreSeahawks.trim(),

      halftimeRating: halftimeRating.trim(),
      halftimeGuests: halftimeGuests.trim(),
      outfitChanges: outfitChanges.trim(),
      songPredictions: songPredictions.trim(),

      gatoradeColor,
      gatoradeOther: gatoradeColor === "Other" ? gatoradeOther.trim() : undefined,

      awards: awards.trim(),
    };

    setAll((prev) => {
      const without = prev.filter((x) => x.id !== payload.id);
      const next = [payload, ...without];
      // Sort newest first
      next.sort((a, b) => b.createdAt - a.createdAt);
      return next;
    });

    resetForm();
  }

  function remove(id: string) {
    const ok = confirm("Delete this prediction?");
    if (!ok) return;
    setAll((prev) => prev.filter((x) => x.id !== id));
    if (editingId === id) resetForm();
  }

  function clearAll() {
    const ok = confirm("Clear ALL predictions on this device?");
    if (!ok) return;
    setAll([]);
    resetForm();
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predictions</h1>
          <p className="mt-2 text-white/70">
            Lock in your takes before the game. No deleting your delusion later 😈
          </p>
        </div>

        <button
          onClick={clearAll}
          className="w-full sm:w-auto rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80 hover:bg-black/30"
        >
          Clear All (this device)
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs tracking-wide text-white/70">SUBMIT PICKS</div>
              <h2 className="mt-2 text-xl font-semibold">
                {isEditing ? "Edit your prediction" : "New prediction"}
              </h2>
            </div>
            <div className="hidden sm:block rounded-xl bg-[#c60c30] px-3 py-2 text-xs font-semibold">
              Patriots-coded
            </div>
          </div>

          <div className="mt-5 space-y-5">
            {/* Name */}
            <Field label="Your Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bianca / Garrett / etc..."
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/30"
              />
            </Field>

            {/* Winner */}
            <Field label="Who wins?">
              <div className="grid grid-cols-3 gap-2">
                {(["Patriots", "Seahawks", "Other"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setWinner(opt)}
                    className={[
                      "rounded-xl border px-3 py-2 text-sm",
                      winner === opt
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-black/20 text-white/80 hover:bg-black/30",
                    ].join(" ")}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {winner === "Other" && (
                <input
                  value={otherWinner}
                  onChange={(e) => setOtherWinner(e.target.value)}
                  placeholder="Type team name..."
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/30"
                />
              )}
            </Field>

            {/* Final score */}
            <Field label="Final Score Prediction">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/60">Patriots</div>
                  <input
                    value={finalScorePatriots}
                    onChange={(e) => setFinalScorePatriots(e.target.value)}
                    placeholder="24"
                    inputMode="numeric"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
                  />
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-white/60">Seahawks</div>
                  <input
                    value={finalScoreSeahawks}
                    onChange={(e) => setFinalScoreSeahawks(e.target.value)}
                    placeholder="20"
                    inputMode="numeric"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
                  />
                </div>
              </div>
            </Field>

            {/* Halftime */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold">Halftime Show</div>

              <div className="mt-3 space-y-3">
                <Field label="Surprise guests (comma-separated)">
                  <input
                    value={halftimeGuests}
                    onChange={(e) => setHalftimeGuests(e.target.value)}
                    placeholder="Guest 1, Guest 2, ..."
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/30"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Outfit changes (# or guess)">
                    <input
                      value={outfitChanges}
                      onChange={(e) => setOutfitChanges(e.target.value)}
                      placeholder="3"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/30"
                    />
                  </Field>
                  <Field label="Rating (1–10, optional)">
                    <input
                      value={halftimeRating}
                      onChange={(e) => setHalftimeRating(e.target.value)}
                      placeholder="9"
                      inputMode="numeric"
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/30"
                    />
                  </Field>
                </div>

                <Field label="Song predictions">
                  <textarea
                    value={songPredictions}
                    onChange={(e) => setSongPredictions(e.target.value)}
                    placeholder="Song 1, Song 2, deep cut surprise..."
                    className="min-h-[80px] w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-white/30"
                  />
                </Field>
              </div>
            </div>

            {/* Gatorade */}
            <Field label="Gatorade color">
              <select
                value={gatoradeColor}
                onChange={(e) => setGatoradeColor(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/30"
              >
                <option value="">Select…</option>
                <option value="Red">Red</option>
                <option value="Orange">Orange</option>
                <option value="Yellow">Yellow</option>
                <option value="Green">Green</option>
                <option value="Blue">Blue</option>
                <option value="Purple">Purple</option>
                <option value="Clear/Water">Clear / Water</option>
                <option value="None">None</option>
                <option value="Other">Other</option>
              </select>

              {gatoradeColor === "Other" && (
                <input
                  value={gatoradeOther}
                  onChange={(e) => setGatoradeOther(e.target.value)}
                  placeholder="Describe it..."
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/30"
                />
              )}
            </Field>

            {/* Awards */}
            <Field label="Awards guesses (MVP / first TD / etc)">
              <textarea
                value={awards}
                onChange={(e) => setAwards(e.target.value)}
                placeholder="MVP: ___ • First TD: ___ • Biggest play: ___"
                className="min-h-[80px] w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/30"
              />
            </Field>

            {/* Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onSubmit}
                className="rounded-xl bg-[#c60c30] px-5 py-3 text-sm font-semibold hover:opacity-90"
              >
                {isEditing ? "Save Changes" : "Submit Prediction"}
              </button>

              <button
                onClick={resetForm}
                className="rounded-xl border border-white/10 bg-black/20 px-5 py-3 text-sm text-white/80 hover:bg-black/30"
              >
                Reset
              </button>
            </div>

            <p className="text-xs text-white/50">
              Saves on your device (localStorage). Next step later: shared room so
              everyone’s picks show up live.
            </p>
          </div>
        </section>

        {/* Leaderboard */}
        <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs tracking-wide text-white/70">ALL PICKS</div>
              <h2 className="mt-2 text-xl font-semibold">Prediction Board</h2>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
              Total: <span className="text-white">{all.length}</span>
            </div>
          </div>

          {all.length === 0 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-6 text-white/70">
              No predictions yet — be the first to drop a take.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {all.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-lg font-semibold">{p.name}</div>
                      <div className="mt-1 text-xs text-white/60">
                        Submitted: {formatTime(p.createdAt)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => loadForEdit(p)}
                        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80 hover:bg-black/40"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80 hover:bg-black/40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <MiniCard
                      title="Winner"
                      value={
                        p.winner === "Other"
                          ? `Other: ${p.otherWinner ?? ""}`
                          : p.winner
                      }
                    />
                    <MiniCard
                      title="Final Score"
                      value={`NE ${p.finalScorePatriots} — SEA ${p.finalScoreSeahawks}`}
                    />
                    <MiniCard
                      title="Gatorade"
                      value={
                        p.gatoradeColor === "Other"
                          ? `Other: ${p.gatoradeOther ?? ""}`
                          : p.gatoradeColor
                      }
                    />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Detail
                      title="Halftime Guests"
                      value={p.halftimeGuests || "—"}
                    />
                    <Detail
                      title="Outfit Changes / Rating"
                      value={`${p.outfitChanges || "—"} outfits • ${
                        p.halftimeRating ? `${p.halftimeRating}/10` : "no rating"
                      }`}
                    />
                    <Detail title="Song Predictions" value={p.songPredictions || "—"} />
                    <Detail title="Awards" value={p.awards || "—"} />
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
