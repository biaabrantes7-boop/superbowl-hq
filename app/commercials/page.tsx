"use client";

import { useEffect, useMemo, useState } from "react";

type Grade = "S" | "A" | "B" | "C" | "F";

type AdPost = {
  id: string;
  createdAt: number;
  name: string;
  brand: string;
  grade: Grade;
  comment: string;
};

type BingoCell = {
  id: string;
  text: string;
  checked: boolean;
};

type CommercialsState = {
  posts: AdPost[];
  bingo: BingoCell[];
  updatedAt: number;
};

const STORAGE_KEY = "rbg_superbowl_commercials_v1";
const NAME_KEY = "rbg_superbowl_name_v1";

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

const DEFAULT_BINGO_TEXT = [
  "Celebrity cameo",
  "Talking animal",
  "Emotional dad/mom ad",
  "AI reference",
  "Nostalgia throwback",
  "Sports legend appears",
  "Ridiculously expensive CGI",
  "Food ad that makes you hungry",
  "Car ad in the desert",
  "“We’re a family” speech",
  "Plot twist ending",
  "Music drop that goes hard",
  "Ad makes zero sense",
  "Product isn’t shown until the last 3 seconds",
  "Insurance ad",
  "Fast food ad",
  "Tech company ad",
  "Movie trailer disguised as an ad",
  "“This is the future” vibes",
  "Pun so bad it’s good",
  "Unexpected cameo #2",
  "Someone falls/slips",
  "Animal side-eye",
  "Slow-motion hug",
  "Mic drop moment",
];

function defaultState(): CommercialsState {
  const bingo: BingoCell[] = DEFAULT_BINGO_TEXT.slice(0, 25).map((t) => ({
    id: uid(),
    text: t,
    checked: false,
  }));

  return { posts: [], bingo, updatedAt: Date.now() };
}

export default function CommercialsPage() {
  const [state, setState] = useState<CommercialsState>(() => defaultState());

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [grade, setGrade] = useState<Grade>("A");
  const [comment, setComment] = useState("");

  const [filterGrade, setFilterGrade] = useState<Grade | "All">("All");

  // Load state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CommercialsState;
      if (parsed?.posts && parsed?.bingo) setState(parsed);
    } catch {
      // ignore
    }
  }, []);

  // ✅ Autofill name from login
  useEffect(() => {
    const n = localStorage.getItem(NAME_KEY);
    if (n && !name) setName(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const postsFiltered = useMemo(() => {
    const list =
      filterGrade === "All"
        ? state.posts
        : state.posts.filter((p) => p.grade === filterGrade);
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [state.posts, filterGrade]);

  const checkedCount = useMemo(
    () => state.bingo.filter((c) => c.checked).length,
    [state.bingo]
  );

  const gradeCounts = useMemo(() => {
    const counts: Record<Grade, number> = { S: 0, A: 0, B: 0, C: 0, F: 0 };
    for (const p of state.posts) counts[p.grade]++;
    return counts;
  }, [state.posts]);

  function addPost() {
    if (!name.trim()) {
      alert("Your name is missing. Re-login or type your name.");
      return;
    }
    if (!comment.trim()) {
      alert("Write a quick comment about the commercial.");
      return;
    }

    const post: AdPost = {
      id: uid(),
      createdAt: Date.now(),
      name: name.trim(),
      brand: brand.trim(),
      grade,
      comment: comment.trim(),
    };

    setState((prev) => ({
      ...prev,
      posts: [post, ...prev.posts],
      updatedAt: Date.now(),
    }));

    setBrand("");
    setComment("");
  }

  function deletePost(id: string) {
    const ok = confirm("Delete this comment?");
    if (!ok) return;

    setState((prev) => ({
      ...prev,
      posts: prev.posts.filter((p) => p.id !== id),
      updatedAt: Date.now(),
    }));
  }

  function toggleCell(id: string) {
    setState((prev) => ({
      ...prev,
      bingo: prev.bingo.map((c) =>
        c.id === id ? { ...c, checked: !c.checked } : c
      ),
      updatedAt: Date.now(),
    }));
  }

  function resetBingo() {
    const ok = confirm("Reset the commercial bingo board?");
    if (!ok) return;
    setState((prev) => ({
      ...prev,
      bingo: prev.bingo.map((c) => ({ ...c, checked: false })),
      updatedAt: Date.now(),
    }));
  }

  function resetAll() {
    const ok = confirm("Clear ALL commercials posts + reset bingo?");
    if (!ok) return;
    setState(defaultState());
    const savedName = localStorage.getItem(NAME_KEY) || "";
    setName(savedName);
    setBrand("");
    setComment("");
    setGrade("A");
    setFilterGrade("All");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commercials</h1>
          <p className="mt-2 text-white/70">
            Rate the ads like a panel of extremely opinionated analysts.
          </p>
        </div>

        <button
          onClick={resetAll}
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80 hover:bg-black/30"
        >
          Reset (posts + bingo)
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs tracking-wide text-white/70">
                COMMERCIAL FEED
              </div>
              <h2 className="mt-2 text-xl font-semibold">Drop your ratings</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <Pill label={`S: ${gradeCounts.S}`} />
              <Pill label={`A: ${gradeCounts.A}`} />
              <Pill label={`B: ${gradeCounts.B}`} />
              <Pill label={`C: ${gradeCounts.C}`} />
              <Pill label={`F: ${gradeCounts.F}`} />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="grid gap-3 sm:grid-cols-6">
              <label className="block sm:col-span-2">
                <div className="mb-1 text-[10px] text-white/60">Your name</div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="(From login)"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
                />
              </label>

              <label className="block sm:col-span-2">
                <div className="mb-1 text-[10px] text-white/60">
                  Brand / Ad name (optional)
                </div>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Doritos / Apple / etc..."
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
                />
              </label>

              <label className="block sm:col-span-1">
                <div className="mb-1 text-[10px] text-white/60">Grade</div>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as Grade)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
                >
                  <option value="S">S</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="F">F</option>
                </select>
              </label>

              <button
                onClick={addPost}
                className="sm:col-span-1 rounded-xl bg-[#c60c30] px-4 py-3 text-sm font-semibold hover:opacity-90"
              >
                Post
              </button>

              <label className="block sm:col-span-6">
                <div className="mb-1 text-[10px] text-white/60">Comment</div>
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="That ad was insane / hilarious / a flop..."
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(["All", "S", "A", "B", "C", "F"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setFilterGrade(g)}
                className={[
                  "rounded-xl border px-3 py-2 text-xs",
                  filterGrade === g
                    ? "border-white/30 bg-white/10 text-white"
                    : "border-white/10 bg-black/20 text-white/80 hover:bg-black/30",
                ].join(" ")}
              >
                {g === "All" ? "All grades" : `Grade ${g}`}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {postsFiltered.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-white/70">
                No posts yet — roast the next commercial.
              </div>
            ) : (
              postsFiltered.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold">{p.name}</span>
                        <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70">
                          Grade {p.grade}
                        </span>
                        {p.brand ? (
                          <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70">
                            {p.brand}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-white/60">
                        {formatTime(p.createdAt)}
                      </div>
                      <div className="mt-3 text-sm text-white/80">{p.comment}</div>
                    </div>

                    <button
                      onClick={() => deletePost(p.id)}
                      className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80 hover:bg-black/40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="mt-4 text-xs text-white/50">
            Saved on this device (localStorage). Later we can add a shared room so
            everyone’s phones sync.
          </p>
        </section>

        <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs tracking-wide text-white/70">
                COMMERCIAL BINGO / PROPS
              </div>
              <h2 className="mt-2 text-xl font-semibold">Check them off</h2>
              <p className="mt-2 text-sm text-white/70">
                Click squares when you see the trope happen.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
              Checked: <span className="text-white">{checkedCount}</span>/25
            </div>
          </div>

          <button
            onClick={resetBingo}
            className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80 hover:bg-black/30"
          >
            Reset Bingo
          </button>

          <div className="mt-5 grid grid-cols-5 gap-2">
            {state.bingo.map((cell) => (
              <button
                key={cell.id}
                onClick={() => toggleCell(cell.id)}
                className={[
                  "aspect-square rounded-xl border p-2 text-[10px] leading-snug",
                  cell.checked
                    ? "border-white/30 bg-white/10 text-white"
                    : "border-white/10 bg-black/20 text-white/80 hover:bg-black/30",
                ].join(" ")}
                title="Click to toggle"
              >
                {cell.text}
              </button>
            ))}
          </div>

          <div className="mt-4 text-xs text-white/50">
            Want this bingo to be custom to your group? Tell me 10–15 inside-joke
            tropes and I’ll swap them in.
          </div>
        </section>
      </div>
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
      {label}
    </div>
  );
}
