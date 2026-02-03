"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Category = "Food" | "Drinks" | "Dessert" | "Supplies";
type ItemStatus = "Needed" | "Claimed" | "Brought";

type PotluckItem = {
  id: string;
  room_code: string;
  category: Category;
  item: string;
  notes: string | null;
  status: ItemStatus;
  claimed_by: string;
  created_at: string;
  updated_at: string;
};

const NAME_KEY = "rbg_superbowl_name_v1";
const ROOM_KEY = "rbg_superbowl_room_code_v1";

const STARTER_ITEMS: Omit<PotluckItem, "id" | "room_code" | "created_at" | "updated_at">[] = [
  { category: "Food", item: "Wings", notes: "Buffalo / BBQ / mix", status: "Needed", claimed_by: "" },
  { category: "Food", item: "Chips + Salsa / Guac", notes: null, status: "Needed", claimed_by: "" },
  { category: "Food", item: "Pizza", notes: "2–3 pies?", status: "Needed", claimed_by: "" },
  { category: "Dessert", item: "Cookies / brownies", notes: null, status: "Needed", claimed_by: "" },
  { category: "Drinks", item: "Seltzers / beers / sodas", notes: "Bring variety!", status: "Needed", claimed_by: "" },
  { category: "Supplies", item: "Plates / cups / napkins", notes: null, status: "Needed", claimed_by: "" },
];

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function FoodPage() {
  const [roomCode, setRoomCode] = useState("2027");
  const [roomReady, setRoomReady] = useState(false);

  const [name, setName] = useState("");

  const [items, setItems] = useState<PotluckItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [category, setCategory] = useState<Category>("Food");
  const [item, setItem] = useState("");
  const [notes, setNotes] = useState("");

  const [filter, setFilter] = useState<Category | "All">("All");

  // Autofill name from login
  useEffect(() => {
    const n = localStorage.getItem(NAME_KEY);
    if (n) setName(n);
  }, []);

  // Autofill room
  useEffect(() => {
    const saved = localStorage.getItem(ROOM_KEY);
    if (saved) {
      setRoomCode(saved);
      setRoomReady(true);
    }
  }, []);

  const roomLabel = useMemo(() => roomCode.trim().toUpperCase(), [roomCode]);

  async function loadRoom(code: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("potluck_items")
      .select("*")
      .eq("room_code", code)
      .order("status", { ascending: true })
      .order("updated_at", { ascending: false });

    setLoading(false);

    if (error) {
      alert(`Load failed: ${error.message}`);
      return;
    }

    setItems((data ?? []) as PotluckItem[]);
  }

  async function seedIfEmpty(code: string) {
    const { data, error } = await supabase
      .from("potluck_items")
      .select("id")
      .eq("room_code", code)
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      const seedRows = STARTER_ITEMS.map((s) => ({
        room_code: code,
        category: s.category,
        item: s.item,
        notes: s.notes,
        status: s.status,
        claimed_by: s.claimed_by,
        updated_at: new Date().toISOString(),
      }));

      const { error: insErr } = await supabase.from("potluck_items").insert(seedRows);
      if (insErr) throw insErr;
    }
  }

  // Realtime sync
  useEffect(() => {
    if (!roomReady || !roomLabel) return;

    const code = roomLabel;

    (async () => {
      try {
        await seedIfEmpty(code);
        await loadRoom(code);
      } catch (e: any) {
        alert(e?.message ?? "Failed to initialize room");
      }
    })();

    const channel = supabase
      .channel(`potluck-${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "potluck_items", filter: `room_code=eq.${code}` },
        () => loadRoom(code)
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

  const filteredItems = useMemo(() => {
    const list = filter === "All" ? items : items.filter((x) => x.category === filter);

    const order: Record<ItemStatus, number> = { Needed: 0, Claimed: 1, Brought: 2 };
    return [...list].sort((a, b) => {
      const s = order[a.status] - order[b.status];
      if (s !== 0) return s;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [items, filter]);

  const counts = useMemo(() => {
    const byStatus = { Needed: 0, Claimed: 0, Brought: 0 };
    for (const it of items) byStatus[it.status]++;
    return byStatus;
  }, [items]);

  async function addItem() {
    if (!roomReady) {
      alert("Join a room first.");
      return;
    }
    const code = roomLabel;
    const it = item.trim();
    if (!it) {
      alert("Add an item name (e.g., Wings).");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("potluck_items").insert({
      room_code: code,
      category,
      item: it,
      notes: notes.trim() || null,
      status: "Needed",
      claimed_by: "",
      updated_at: new Date().toISOString(),
    });
    setLoading(false);

    if (error) {
      alert(`Add failed: ${error.message}`);
      return;
    }

    setItem("");
    setNotes("");
    loadRoom(code);
  }

  async function editItem(row: PotluckItem) {
    if (!roomReady) return;
    if (row.status !== "Needed") {
      alert("Only items that are still Needed can be edited (keeps it fair).");
      return;
    }

    const newName = prompt("Edit item name:", row.item);
    if (newName === null) return;

    const newNotes = prompt("Edit notes (optional):", row.notes ?? "");
    if (newNotes === null) return;

    setLoading(true);
    const { error } = await supabase
      .from("potluck_items")
      .update({
        item: newName.trim(),
        notes: newNotes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    setLoading(false);

    if (error) alert(`Edit failed: ${error.message}`);
  }

  async function removeItem(row: PotluckItem) {
    if (!roomReady) return;

    const my = name.trim();
    if (row.status !== "Needed" && row.claimed_by !== my) {
      alert("Only the claimer can delete a claimed/brought item.");
      return;
    }

    const ok = confirm("Delete this item?");
    if (!ok) return;

    setLoading(true);
    const { error } = await supabase.from("potluck_items").delete().eq("id", row.id);
    setLoading(false);

    if (error) alert(`Delete failed: ${error.message}`);
  }

  async function claimItem(row: PotluckItem) {
    if (!roomReady) return;
    const my = name.trim();
    if (!my) {
      alert("Your name is missing. Re-login.");
      return;
    }

    if (row.status !== "Needed") return;

    setLoading(true);
    const { error } = await supabase
      .from("potluck_items")
      .update({
        status: "Claimed",
        claimed_by: my,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("status", "Needed");

    setLoading(false);

    if (error) alert(`Claim failed: ${error.message}`);
  }

  async function unclaimItem(row: PotluckItem) {
    if (!roomReady) return;
    const my = name.trim();
    if (!my) {
      alert("Your name is missing. Re-login.");
      return;
    }

    if (row.claimed_by !== my) {
      alert("Only the person who claimed it can unclaim it.");
      return;
    }

    const ok = confirm("Unclaim this item?");
    if (!ok) return;

    setLoading(true);
    const { error } = await supabase
      .from("potluck_items")
      .update({
        status: "Needed",
        claimed_by: "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    setLoading(false);

    if (error) alert(`Unclaim failed: ${error.message}`);
  }

  async function markBrought(row: PotluckItem) {
    if (!roomReady) return;
    const my = name.trim();
    if (!my) {
      alert("Your name is missing. Re-login.");
      return;
    }

    if (row.claimed_by !== my) {
      alert("Only the person who claimed it can mark it brought.");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("potluck_items")
      .update({
        status: "Brought",
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    setLoading(false);

    if (error) alert(`Update failed: ${error.message}`);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-header tracking-tight">Food / Drinks / Location</h1>
          <p className="mt-2 text-white/70 font-body">
            Shared potluck board that syncs live across phones. RBG Household: arrive 1 hour early.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
          🏠 RBG Household • Doors open 1 hour before kickoff
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
          Everyone must use the same room code to see the same potluck list.
        </div>
      </div>

      {/* Layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: add item + counts */}
        <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs tracking-wide text-white/70">ADD ITEM</div>
              <h2 className="mt-2 text-xl font-header">Potluck sign-up</h2>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
              {loading ? "Syncing..." : "Live"}
            </div>
          </div>

          <div className="mt-5 space-y-4 font-body">
            <div className="flex flex-wrap gap-2">
              <StatusPill label={`Needed: ${counts.Needed}`} />
              <StatusPill label={`Claimed: ${counts.Claimed}`} />
              <StatusPill label={`Brought: ${counts.Brought}`} />
            </div>

            <label className="block">
              <div className="mb-2 text-xs text-white/70">Category</div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white"
              >
                <option value="Food">Food</option>
                <option value="Drinks">Drinks</option>
                <option value="Dessert">Dessert</option>
                <option value="Supplies">Supplies</option>
              </select>
            </label>

            <label className="block">
              <div className="mb-2 text-xs text-white/70">Item</div>
              <input
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="Buffalo chicken dip"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white"
              />
            </label>

            <label className="block">
              <div className="mb-2 text-xs text-white/70">Notes (optional)</div>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Spicy? Vegetarian? Needs ice?"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none text-white"
              />
            </label>

            <button
              onClick={addItem}
              disabled={!roomReady || loading}
              className="w-full rounded-xl bg-[#c60c30] px-5 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              Add item
            </button>

            <div className="mt-4">
              <div className="text-xs text-white/70 mb-2">Filter</div>
              <div className="flex flex-wrap gap-2">
                {(["All", "Food", "Drinks", "Dessert", "Supplies"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={[
                      "rounded-xl border px-3 py-2 text-xs",
                      filter === f
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-black/20 text-white/80 hover:bg-black/30",
                    ].join(" ")}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-white/50">
              Rule: only the person who claimed an item can unclaim or mark it brought.
            </div>
          </div>
        </section>

        {/* Right: list */}
        <section className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/10 p-6">
          <div className="text-xs tracking-wide text-white/70">POTLUCK BOARD</div>
          <h2 className="mt-2 text-xl font-header">Who’s bringing what</h2>

          <div className="mt-5 space-y-3">
            {!roomReady ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-white/70">
                Join a room to see the shared potluck list.
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-white/70">
                No items yet — add one on the left.
              </div>
            ) : (
              filteredItems.map((row) => {
                const my = name.trim();
                const mine = my && row.claimed_by === my;

                return (
                  <div key={row.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70">
                            {row.category}
                          </span>
                          <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70">
                            {row.status}
                          </span>
                          <span className="text-xs text-white/50">
                            Updated {formatTime(row.updated_at)}
                          </span>
                        </div>

                        <div className="mt-2 text-base font-semibold break-words">
                          {row.item}
                        </div>

                        {row.notes ? (
                          <div className="mt-1 text-sm text-white/70 break-words">
                            {row.notes}
                          </div>
                        ) : null}

                        <div className="mt-2 text-sm text-white/80">
                          {row.claimed_by ? (
                            <>
                              Claimed by:{" "}
                              <span className="font-semibold text-white">
                                {row.claimed_by}
                              </span>
                            </>
                          ) : (
                            <span className="text-white/50">Nobody claimed yet</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        {row.status === "Needed" ? (
                          <>
                            <button
                              onClick={() => claimItem(row)}
                              className="rounded-xl bg-[#c60c30] px-3 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-60"
                              disabled={loading || !my}
                            >
                              Claim
                            </button>
                            <button
                              onClick={() => editItem(row)}
                              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80 hover:bg-black/40"
                              disabled={loading}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removeItem(row)}
                              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80 hover:bg-black/40"
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </>
                        ) : row.status === "Claimed" ? (
                          <>
                            <button
                              onClick={() => markBrought(row)}
                              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80 hover:bg-black/40 disabled:opacity-60"
                              disabled={loading || !mine}
                              title={mine ? "Mark as brought" : "Only the claimer can mark brought"}
                            >
                              Mark brought
                            </button>
                            <button
                              onClick={() => unclaimItem(row)}
                              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80 hover:bg-black/40 disabled:opacity-60"
                              disabled={loading || !mine}
                              title={mine ? "Unclaim" : "Only the claimer can unclaim"}
                            >
                              Unclaim
                            </button>
                            <button
                              onClick={() => removeItem(row)}
                              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80 hover:bg-black/40 disabled:opacity-60"
                              disabled={loading || !mine}
                              title={mine ? "Delete" : "Only claimer can delete"}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => unclaimItem(row)}
                              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80 hover:bg-black/40 disabled:opacity-60"
                              disabled={loading || !mine}
                              title={mine ? "Move back to Needed (unclaim)" : "Only claimer can change"}
                            >
                              Undo (unclaim)
                            </button>
                            <button
                              onClick={() => removeItem(row)}
                              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80 hover:bg-black/40 disabled:opacity-60"
                              disabled={loading || !mine}
                              title={mine ? "Delete" : "Only claimer can delete"}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
      {label}
    </div>
  );
}
