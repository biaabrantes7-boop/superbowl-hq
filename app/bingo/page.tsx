"use client";

import { useEffect, useMemo, useState } from "react";

type Cell = {
  text: string;
  checked: boolean;
};

type Board = {
  name: string;
  createdAt: number;
  cells: Cell[]; // 25
};

const STORAGE_KEY = "rbg_superbowl_bingo_myboard_v1";

// Your custom prompts (we can add more anytime)
const DEFAULT_POOL = [
  "Someone yells at the TV",
  "Announcer says “legacy”",
  "Bad call replayed 5x",
  "Someone asks a rules question",
  "Ref-ball discourse begins",
  "Commercial makes no sense",
  "Someone says “this game is over”",
  "Someone says “we’re so back”",
  "Someone gets up exactly as a big play happens",
  "Someone complains about the halftime show",
  "Halftime guest reveal shock",
  "Camera cuts to a celebrity",
  "Someone spills a drink",
  "Someone starts live-tweeting",
  "Someone says “that’s holding”",
  "Announcer says “grit”",
  "Announcer says “momentum”",
  "A wild stat graphic appears",
  "Someone orders food mid-drive",
  "Someone says “I hate the Patriots” (or loves them)",
  "Someone says “what’s a down?”",
  "A coach gets caught yelling",
  "The crowd goes feral",
  "Someone misses the best play",
  "Game goes down to the wire",
  "Overtime mention (even if it doesn’t happen)",
  "Someone switches seats for “luck”",
  "Someone does a dramatic replay reenactment",
  "Someone says “scripted”",
  "Announcer mentions “dynasty”",
];

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeBoard(name: string, pool: string[]): Board {
  const picks = shuffle(pool).slice(0, 24); // 24 phrases + 1 FREE SPACE
  const cells: Cell[] = [];

  // Fill 5x5 with center FREE SPACE
  let p = 0;
  for (let i = 0; i < 25; i++) {
    if (i === 12) {
      cells.push({ text: "FREE SPACE 😈", checked: true });
    } else {
      cells.push({ text: picks[p++], checked: false });
    }
  }

  return { name, createdAt: Date.now(), cells };
}

function hasBingo(cells: Cell[]): boolean {
  const on = (i: number) => cells[i]?.checked;

  // rows
  for (let r = 0; r < 5; r++) {
    let ok = true;
    for (let c = 0; c < 5; c++) ok = ok && !!on(r * 5 + c);
    if (ok) return true;
  }

  // cols
  for (let c = 0; c < 5; c++) {
    let ok = true;
    for (let r = 0; r < 5; r++) ok = ok && !!on(r * 5 + c);
    if (ok) return true;
  }

  // diagonals
  let d1 = true;
  let d2 = true;
  for (let i = 0; i < 5; i++) {
    d1 = d1 && !!on(i * 5 + i);
    d2 = d2 && !!on(i * 5 + (4 - i));
  }
  return d1 || d2;
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

/**
 * Share link format:
 * /bingo?v=1&name=...&b=...  where b is base64-encoded JSON of cells
 *
 * Read-only mode activates when the link has b=...
 */
function encodeBoardForLink(board: Board): string {
  const payload = {
    name: board.name,
    createdAt: board.createdAt,
    cells: board.cells,
  };
  const json = JSON.stringify(payload);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  const params = new URLSearchParams();
  params.set("v", "1");
  params.set("name", board.name);
  params.set("b", base64);
  return `${window.location.origin}/bingo?${params.toString()}`;
}

function decodeBoardFromLink(base64: string): Board | null {
  try {
    const json = decodeURIComponent(escape(atob(base64)));
    const parsed = JSON.parse(json) as Board;
    if (!parsed?.cells || parsed.cells.length !== 25) return null;
    return parsed;
  } catch {
    return null;
  }
}

export default function BingoPage() {
  const [myName, setMyName] = useState("");
  const [myBoard, setMyBoard] = useState<Board | null>(null);

  const [poolText, setPoolText] = useState(DEFAULT_POOL.join("\n"));

  // Read-only board if opened via share link
  const [sharedBoard, setSharedBoard] = useState<Board | null>(null);

  const isReadOnly = useMemo(() => sharedBoard !== null, [sharedBoard]);
  const boardToShow = sharedBoard ?? myBoard;

  // On mount: check URL for shared board; else load my local board
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const b = params.get("b");
    if (b) {
      const decoded = decodeBoardFromLink(b);
      if (decoded) setSharedBoard(decoded);
      return; // do not load local board in shared view
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Board;
      if (parsed?.cells?.length === 25) {
        setMyBoard(parsed);
        setMyName(parsed.name || "");
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist my board
  useEffect(() => {
    if (isReadOnly) return;
    if (myBoard) localStorage.setItem(STORAGE_KEY, JSON.stringify(myBoard));
  }, [myBoard, isReadOnly]);

  const bingoAchieved = useMemo(() => {
    if (!boardToShow) return false;
    return hasBingo(boardToShow.cells);
  }, [boardToShow]);

  function generateBoard() {
    const name = myName.trim();
    if (!name) {
      alert("Enter your name first.");
      return;
    }

    const pool = poolText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (pool.length < 24) {
      alert("Add at least 24 phrases in the pool (one per line).");
      return;
    }

    const b = makeBoard(name, pool);
    setMyBoard(b);
  }

  function toggleCell(i: number) {
    if (!myBoard || isReadOnly) return;
    setMyBoard((prev) => {
      if (!prev) return prev;
      const cells = prev.cells.map((c, idx) =>
        idx === i ? { ...c, checked: !c.checked } : c
      );
      return { ...prev, cells };
    });
  }

  async function copyShareLink() {
    if (!myBoard) {
      alert("Generate your board first.");
      return;
    }
    const link = encodeBoardForLink(myBoard);
    try {
      await navigator.clipboard.writeText(link);
      alert("Share link copied! Paste it in the group chat ✅");
    } catch {
      // fallback
      prompt("Copy this link:", link);
    }
  }

  function resetMyBoard() {
    const ok = confirm("Reset your board (new randomized board)?");
    if (!ok) return;
    generateBoard();
  }

  function clearMyBoard() {
    const ok = confirm("Clear your saved board on this device?");
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    setMyBoard(null);
    setMyName("");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Bowl Bingo</h1>
          <p className="mt-2 text-white/70">
            {isReadOnly
              ? "Viewing a shared board (read-only)."
              : "Make your own board, then share the link so everyone can see it."}
          </p>
        </div>

        {boardToShow ? (
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
            {bingoAchieved ? (
              <span className="font-semibold text-white">BINGO ✅</span>
            ) : (
              <span className="text-white/70">No bingo yet…</span>
            )}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Controls */}
        <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs tracking-wide text-white/70">SETUP</div>
              <h2 className="mt-2 text-xl font-semibold">
                {isReadOnly ? "Shared Board" : "Create your board"}
              </h2>
            </div>
            <div className="hidden sm:block rounded-xl bg-[#c60c30] px-3 py-2 text-xs font-semibold">
              Patriots-coded
            </div>
          </div>

          {isReadOnly ? (
            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
              <div className="text-xs text-white/60">Board owner</div>
              <div className="mt-1 font-semibold">{sharedBoard?.name}</div>
              <div className="mt-2 text-xs text-white/60">
                Created: {sharedBoard ? formatTime(sharedBoard.createdAt) : "—"}
              </div>
              <div className="mt-4 text-xs text-white/50">
                To make your own board, open <span className="text-white">/bingo</span>{" "}
                without the share link.
              </div>
            </div>
          ) : (
            <>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <div className="mb-2 text-xs text-white/70">Your name</div>
                  <input
                    value={myName}
                    onChange={(e) => setMyName(e.target.value)}
                    placeholder="Bianca / Garrett / etc..."
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/30"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 text-xs text-white/70">
                    Phrase pool (one per line)
                  </div>
                  <textarea
                    value={poolText}
                    onChange={(e) => setPoolText(e.target.value)}
                    className="min-h-[220px] w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/30"
                  />
                  <div className="mt-2 text-xs text-white/50">
                    Needs at least 24 lines (FREE SPACE fills the center automatically).
                  </div>
                </label>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={generateBoard}
                    className="rounded-xl bg-[#c60c30] px-5 py-3 text-sm font-semibold hover:opacity-90"
                  >
                    Generate Board
                  </button>

                  <button
                    onClick={copyShareLink}
                    className="rounded-xl border border-white/10 bg-black/20 px-5 py-3 text-sm text-white/80 hover:bg-black/30"
                  >
                    Copy Share Link
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={resetMyBoard}
                      className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80 hover:bg-black/30"
                    >
                      New Random Board
                    </button>
                    <button
                      onClick={clearMyBoard}
                      className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80 hover:bg-black/30"
                    >
                      Clear Saved
                    </button>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-white/50">
                Share works via a link that contains your board data. Anyone opening it can
                view your board.
              </p>
            </>
          )}
        </section>

        {/* Board */}
        <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs tracking-wide text-white/70">BINGO BOARD</div>
              <h2 className="mt-2 text-xl font-semibold">
                {boardToShow ? `${boardToShow.name}'s Board` : "No board yet"}
              </h2>
            </div>

            {boardToShow ? (
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
                {isReadOnly ? "Read-only" : "Tap squares to mark"}
              </div>
            ) : null}
          </div>

          {!boardToShow ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-6 text-white/70">
              Generate a board on the left.
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-5 gap-2">
                {boardToShow.cells.map((cell, i) => {
                  const clickable = !isReadOnly;
                  return (
                    <button
                      key={i}
                      onClick={() => (clickable ? toggleCell(i) : undefined)}
                      className={[
                        "aspect-square rounded-xl border p-2 text-[11px] leading-snug text-left",
                        cell.checked
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-white/10 bg-black/20 text-white/80 hover:bg-black/30",
                        clickable ? "cursor-pointer" : "cursor-default",
                      ].join(" ")}
                      title={clickable ? "Click to toggle" : "Read-only"}
                    >
                      {cell.text}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 text-xs text-white/50">
                Bingo counts rows, columns, or diagonals of checked squares.
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
