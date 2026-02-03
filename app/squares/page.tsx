"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type BoardRow = {
  room_code: string;
  locked: boolean;
  row_digits: number[];
  col_digits: number[];
  scores: {
    q1: { pats: string; hawks: string };
    half: { pats: string; hawks: string };
    q3: { pats: string; hawks: string };
    final: { pats: string; hawks: string };
  };
  updated_at: string;
};

type CellRow = {
  room_code: string;
  cell_index: number;
  claimed_by: string;
  updated_at: string;
};

const NAME_KEY = "rbg_superbowl_name_v1";
const ROOM_KEY = "rbg_superbowl_room_code_v1";

function shuffle(arr: number[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function defaultDigits() {
  return shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
}

function squareIndex(row: number, col: number) {
  return row * 10 + col;
}

function safeParseInt(s: string): number | null {
  const t = (s ?? "").trim();
  if (!t) return null;
  if (!/^\d+$/.test(t)) return null;
  return Number(t);
}

function lastDigit(n: number) {
  return n % 10;
}

function getWinnerSquare(
  rowDigits: number[],
  colDigits: number[],
  patsScore: string,
  hawksScore: string
): { row: number; col: number; idx: number } | null {
  const p = safeParseInt(patsScore);
  const h = safeParseInt(hawksScore);
  if (p === null || h === null) return null;

  const pDigit = lastDigit(p);
  const hDigit = lastDigit(h);

  const row = rowDigits.indexOf(pDigit);
  const col = colDigits.indexOf(hDigit);
  if (row === -1 || col === -1) return null;

  return { row, col, idx: squareIndex(row, col) };
}

export default function SquaresPage() {
  const [roomCode, setRoomCode] = useState("2027");
  const [roomReady, setRoomReady] = useState(false);

  const [name, setName] = useState("");

  const [board, setBoard] = useState<BoardRow | null>(null);
  const [cells, setCells] = useState<CellRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Autofill name from login
  useEffect(() => {
    const n = localStorage.getItem(NAME_KEY);
    if (n) setName(n);
  }, []);

  // Autofill room from localStorage (shared with predictions)
  useEffect(() => {
    const saved = localStorage.getItem(ROOM_KEY);
    if (saved) {
      setRoomCode(saved);
      setRoomReady(true);
    }
  }, []);

  const roomLabel = useMemo(() => roomCode.trim().toUpperCase(), [roomCode]);

  async function ensureRoomExists(code: string) {
    // 1) Try load board
    const { data: b, error: bErr } = await supabase
      .from("squares_boards")
      .select("*")
      .eq("room_code", code)
      .maybeSingle();

    if (bErr) throw bErr;

    // 2) If no board, create one
    if (!b) {
      const newBoard = {
        room_code: code,
        locked: false,
        row_digits: defaultDigits(),
        col_digits: defaultDigits(),
        scores: {
          q1: { pats: "", hawks: "" },
          half: { pats: "", hawks: "" },
          q3: { pats: "", hawks: "" },
          final: { pats: "", hawks: "" },
        },
        updated_at: new Date().toISOString(),
      };

      const { error: insErr } = await supabase.from("squares_boards").insert(newBoard);
      if (insErr) throw insErr;
    }

    // 3) Ensure 100 cell rows exist
    const { data: existingCells, error: cErr } = await supabase
      .from("squares_cells")
      .select("cell_index")
      .eq("room_code", code);

    if (cErr) throw cErr;

    const existingSet = new Set((existingCells ?? []).map((x: any) => x.cell_index));
    const missing: any[] = [];
    for (let i = 0; i < 100; i++) {
      if (!existingSet.has(i)) {
        missing.push({
          room_code: code,
          cell_index: i,
          claimed_by: "",
          updated_at: new Date().toISOString(),
        });
      }
    }
    if (missing.length > 0) {
      const { error: addErr } = await supabase.from("squares_cells").insert(missing);
      if (addErr) throw addErr;
    }
  }

  async function loadRoom(code: string) {
    setLoading(true);

    const { data: b, error: bErr } = await supabase
      .from("squares_boards")
      .select("*")
      .eq("room_code", code)
      .single();

    if (bErr) {
      setLoading(false);
      alert(`Failed to load board: ${bErr.message}`);
      return;
    }

    const { data: c, error: cErr } = await supabase
      .from("squares_cells")
      .select("*")
      .eq("room_code", code)
      .order("cell_index", { ascending: true });

    setLoading(false);

    if (cErr) {
      alert(`Failed to load cells: ${cErr.message}`);
      return;
    }

    setBoard(b as BoardRow);
    setCells((c ?? []) as CellRow[]);
  }

  // Realtime subscriptions: refetch on any change
  useEffect(() => {
    if (!roomReady || !roomLabel) return;

    const code = roomLabel;

    (async () => {
      try {
        await ensureRoomExists(code);
        await loadRoom(code);
      } catch (e: any) {
        alert(e?.message ?? "Failed to initialize room");
      }
    })();

    const chBoard = supabase
      .channel(`squares-board-${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "squares_boards", filter: `room_code=eq.${code}` },
        () => loadRoom(code)
      )
      .subscribe();

    const chCells = supabase
      .channel(`squares-cells-${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "squares_cells", filter: `room_code=eq.${code}` },
        () => loadRoom(code)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chBoard);
      supabase.removeChannel(chCells);
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

  const filledCount = useMemo(() => {
    return cells.filter((c) => (c.claimed_by ?? "").trim().length > 0).length;
  }, [cells]);

  const winners = useMemo(() => {
    if (!board) return { q1: null, half: null, q3: null, final: null };
    return {
      q1: getWinnerSquare(board.row_digits, board.col_digits, board.scores?.q1?.pats ?? "", board.scores?.q1?.hawks ?? ""),
      half: getWinnerSquare(board.row_digits, board.col_digits, board.scores?.half?.pats ?? "", board.scores?.half?.hawks ?? ""),
      q3: getWinnerSquare(board.row_digits, board.col_digits, board.scores?.q3?.pats ?? "", board.scores?.q3?.hawks ?? ""),
      final: getWinnerSquare(board.row_digits, board.col_digits, board.scores?.final?.pats ?? "", board.scores?.final?.hawks ?? ""),
    };
  }, [board]);

  function winnerHighlight(idx: number) {
    if (
      winners.q1?.idx === idx ||
      winners.half?.idx === idx ||
      winners.q3?.idx === idx ||
      winners.final?.idx === idx
    ) {
      return "ring-2 ring-white/40 bg-white/10";
    }
    return "";
  }

  async function randomizeNumbers() {
    if (!board) return;
    if (board.locked) {
      alert("Board is locked.");
      return;
    }
    const ok = confirm("Randomize the 0–9 headers? This changes winning squares.");
    if (!ok) return;

    setLoading(true);
    const { error } = await supabase
      .from("squares_boards")
      .update({
        row_digits: defaultDigits(),
        col_digits: defaultDigits(),
        updated_at: new Date().toISOString(),
      })
      .eq("room_code", board.room_code);

    setLoading(false);
    if (error) alert(error.message);
  }

  async function toggleLock() {
    if (!board) return;
    setLoading(true);
    const { error } = await supabase
      .from("squares_boards")
      .update({ locked: !board.locked, updated_at: new Date().toISOString() })
      .eq("room_code", board.room_code);
    setLoading(false);
    if (error) alert(error.message);
  }

  async function clearNames() {
    if (!board) return;
    if (board.locked) {
      alert("Board is locked.");
      return;
    }
    const ok = confirm("Clear ALL names on the board?");
    if (!ok) return;

    setLoading(true);
    const updates = Array.from({ length: 100 }, (_, i) => ({
      room_code: board.room_code,
      cell_index: i,
      claimed_by: "",
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("squares_cells").upsert(updates, {
      onConflict: "room_code,cell_index",
    });

    setLoading(false);
    if (error) alert(error.message);
  }

  // ✅ Only owner can unclaim; no stealing
  async function claimSquare(row: number, col: number) {
    if (!board) return;
    if (board.locked) return;

    const who = (name || "").trim();
    if (!who) {
      alert("Your name is missing. Re-login.");
      return;
    }

    const idx = squareIndex(row, col);
    const current = cells[idx]?.claimed_by?.trim() ?? "";

    // Block stealing
    if (current && current !== who) {
      alert(`That square is already claimed by ${current}.`);
      return;
    }

    // If you own it, allow unclaim
    if (current === who) {
      const ok = confirm("Unclaim this square?");
      if (!ok) return;

      const { error } = await supabase
        .from("squares_cells")
        .update({ claimed_by: "", updated_at: new Date().toISOString() })
        .eq("room_code", board.room_code)
        .eq("cell_index", idx);

      if (error) alert(error.message);
      return;
    }

    // Claim empty square
    const { error } = await supabase
      .from("squares_cells")
      .update({ claimed_by: who, updated_at: new Date().toISOString() })
      .eq("room_code", board.room_code)
      .eq("cell_index", idx);

    if (error) alert(error.message);
  }

  async function setScore(
    key: "q1" | "half" | "q3" | "final",
    team: "pats" | "hawks",
    val: string
  ) {
    if (!board) return;
    const nextScores = {
      ...board.scores,
      [key]: { ...board.scores[key], [team]: val },
    };

    const { error } = await supabase
      .from("squares_boards")
      .update({ scores: nextScores, updated_at: new Date().toISOString() })
      .eq("room_code", board.room_code);

    if (error) alert(error.message);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-header tracking-tight">Squares</h1>
          <p className="mt-2 text-white/70 font-body">
            One shared 10×10 board per room. Claim squares from any device — it syncs live.
          </p>
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
          Everyone must use the same room code to see the same board.
        </div>
      </div>

      {/* Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
          <div className="text-xs text-white/60">Squares Filled</div>
          <div className="mt-2 text-2xl font-semibold">{filledCount} / 100</div>
          <div className="mt-2 text-xs text-white/50">Tip: lock once full so nobody edits.</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/10 p-5 md:col-span-2">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={randomizeNumbers}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80 hover:bg-black/30 disabled:opacity-60"
              disabled={!roomReady || loading || !board}
            >
              Randomize Numbers
            </button>
            <button
              onClick={clearNames}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80 hover:bg-black/30 disabled:opacity-60"
              disabled={!roomReady || loading || !board}
            >
              Clear Names
            </button>
            <button
              onClick={toggleLock}
              className={[
                "rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60",
                board?.locked ? "bg-white text-black" : "bg-[#c60c30] text-white",
              ].join(" ")}
              disabled={!roomReady || loading || !board}
            >
              {board?.locked ? "Locked 🔒" : "Lock Board"}
            </button>

            <div className="ml-auto rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
              {loading ? "Syncing..." : board?.locked ? "Locked" : "Unlocked"}
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Scores */}
        <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/10 p-6">
          <div className="text-xs tracking-wide text-white/70">CHECKPOINT SCORES</div>
          <h2 className="mt-2 text-xl font-header">Enter scores (optional)</h2>
          <p className="mt-2 text-sm text-white/70">
            If you enter scores, we’ll highlight the winning squares.
          </p>

          {!board ? (
            <div className="mt-5 text-white/70">Join a room to load the board.</div>
          ) : (
            <div className="mt-5 space-y-4">
              <ScoreRow
                title="End of Q1"
                pats={board.scores.q1.pats}
                hawks={board.scores.q1.hawks}
                onPats={(v) => setScore("q1", "pats", v)}
                onHawks={(v) => setScore("q1", "hawks", v)}
                winnerName={
                  winners.q1 ? cells[winners.q1.idx]?.claimed_by || "Unclaimed" : null
                }
                digits={
                  winners.q1
                    ? `(${board.row_digits[winners.q1.row]}–${board.col_digits[winners.q1.col]})`
                    : null
                }
              />
              <ScoreRow
                title="Halftime"
                pats={board.scores.half.pats}
                hawks={board.scores.half.hawks}
                onPats={(v) => setScore("half", "pats", v)}
                onHawks={(v) => setScore("half", "hawks", v)}
                winnerName={
                  winners.half ? cells[winners.half.idx]?.claimed_by || "Unclaimed" : null
                }
                digits={
                  winners.half
                    ? `(${board.row_digits[winners.half.row]}–${board.col_digits[winners.half.col]})`
                    : null
                }
              />
              <ScoreRow
                title="End of Q3"
                pats={board.scores.q3.pats}
                hawks={board.scores.q3.hawks}
                onPats={(v) => setScore("q3", "pats", v)}
                onHawks={(v) => setScore("q3", "hawks", v)}
                winnerName={
                  winners.q3 ? cells[winners.q3.idx]?.claimed_by || "Unclaimed" : null
                }
                digits={
                  winners.q3
                    ? `(${board.row_digits[winners.q3.row]}–${board.col_digits[winners.q3.col]})`
                    : null
                }
              />
              <ScoreRow
                title="Final"
                pats={board.scores.final.pats}
                hawks={board.scores.final.hawks}
                onPats={(v) => setScore("final", "pats", v)}
                onHawks={(v) => setScore("final", "hawks", v)}
                winnerName={
                  winners.final ? cells[winners.final.idx]?.claimed_by || "Unclaimed" : null
                }
                digits={
                  winners.final
                    ? `(${board.row_digits[winners.final.row]}–${board.col_digits[winners.final.col]})`
                    : null
                }
              />
            </div>
          )}
        </section>

        {/* Board */}
        <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/10 p-6 overflow-auto">
          <div className="text-xs tracking-wide text-white/70">THE BOARD</div>
          <h2 className="mt-2 text-xl font-header">Seahawks (top) × Patriots (left)</h2>

          {!board ? (
            <div className="mt-5 text-white/70">Join a room to load the board.</div>
          ) : (
            <div className="mt-5">
              <div className="grid" style={{ gridTemplateColumns: "70px repeat(10, 1fr)" }}>
                <div className="h-10 rounded-tl-xl border border-white/10 bg-black/30 flex items-center justify-center text-[10px] text-white/60">
                  PATRIOTS ↓
                </div>
                {board.col_digits.map((d, i) => (
                  <div
                    key={i}
                    className="h-10 border border-white/10 bg-black/30 flex items-center justify-center font-semibold"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {board.row_digits.map((rowDigit, r) => (
                <div
                  key={r}
                  className="grid"
                  style={{ gridTemplateColumns: "70px repeat(10, 1fr)" }}
                >
                  <div className="h-16 border border-white/10 bg-black/30 flex items-center justify-center font-semibold">
                    {rowDigit}
                  </div>

                  {board.col_digits.map((_, c) => {
                    const idx = squareIndex(r, c);
                    const value = cells[idx]?.claimed_by?.trim() ?? "";
                    const myName = (name || "").trim();

                    const title = board.locked
                      ? "Board is locked"
                      : value
                      ? value === myName
                        ? "Click to unclaim"
                        : `Claimed by ${value}`
                      : "Click to claim";

                    return (
                      <button
                        key={c}
                        onClick={() => claimSquare(r, c)}
                        disabled={board.locked}
                        className={[
                          "h-16 border border-white/10 p-2 text-left text-xs",
                          "bg-black/20 hover:bg-black/30",
                          board.locked ? "cursor-not-allowed opacity-90" : "cursor-pointer",
                          winnerHighlight(idx),
                        ].join(" ")}
                        title={title}
                      >
                        <div className="line-clamp-3 text-white/90">
                          {value ? (
                            value
                          ) : (
                            <span className="text-white/30">Click to claim</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}

              <div className="mt-3 text-xs text-white/60">
                Top digits = Seahawks last digit • Left digits = Patriots last digit
              </div>

              <div className="mt-2 text-xs text-white/50">
                Rule: only the person who claimed a square can unclaim it.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ScoreRow({
  title,
  pats,
  hawks,
  onPats,
  onHawks,
  winnerName,
  digits,
}: {
  title: string;
  pats: string;
  hawks: string;
  onPats: (v: string) => void;
  onHawks: (v: string) => void;
  winnerName: string | null;
  digits: string | null;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">{title}</div>
        {winnerName !== null ? (
          <div className="text-xs text-white/70">
            Winner: <span className="text-white">{winnerName}</span>{" "}
            {digits ? <span className="text-white/50">{digits}</span> : null}
          </div>
        ) : (
          <div className="text-xs text-white/50">Enter scores to compute winner</div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <div className="mb-1 text-[10px] text-white/60">Patriots score</div>
          <input
            value={pats}
            onChange={(e) => onPats(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 14"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
          />
        </label>

        <label className="block">
          <div className="mb-1 text-[10px] text-white/60">Seahawks score</div>
          <input
            value={hawks}
            onChange={(e) => onHawks(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 10"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
          />
        </label>
      </div>
    </div>
  );
}
