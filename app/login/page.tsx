"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthed, setAuthed } from "@/components/AuthGate";

// ✅ Change these however you want:
const PASSCODE = "RBG2027";

// Add your real friend list here:
const NAME_OPTIONS = [
  "Bianca",
  "Garrett",
  "Aaron",
  "Victoria",
  "Brynna",
  "Aliberti",
  "Jack",
  "Jack K",
  "Justin",
  "Michael",
  "Dhaniel",
  "Kyle",
] as const;

export default function LoginPage() {
  const router = useRouter();

  // Name selection (required)
  const [selectedName, setSelectedName] = useState("");
  const [otherName, setOtherName] = useState("");

  // Passcode
  const [code, setCode] = useState("");

  // UI state
  const [error, setError] = useState("");

  useEffect(() => {
    // If already authed, go home
    if (isAuthed()) router.replace("/");
  }, [router]);

  function onLogin() {
    setError("");

    // Validate passcode
    if (code.trim() !== PASSCODE) {
      setError("Incorrect passcode. Try again 😈");
      return;
    }

    // Validate name selection
    const finalName =
      selectedName === "__other__" ? otherName.trim() : selectedName.trim();

    if (!finalName) {
      setError("Please select your name (or choose Other and type it).");
      return;
    }

    // Set auth + save name
    setAuthed();
    localStorage.setItem("rbg_superbowl_name_v1", finalName);

    // Go to dashboard
    router.replace("/");
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#c60c30]" />
          <div>
            <div className="text-sm font-semibold tracking-wide text-white">
              SUPER BOWL HQ
            </div>
            <div className="text-xs text-white/70">RBG Household Access</div>
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-bold">Login</h1>
        <p className="mt-2 text-white/70 text-sm">
          Select your name + enter the party passcode to unlock the tabs.
        </p>

        {/* Form */}
        <div className="mt-6 space-y-4">
          {/* Name dropdown */}
          <label className="block">
            <div className="mb-2 text-xs text-white/70">Select your name</div>

            <select
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/30"
            >
              <option value="">Choose…</option>

              {NAME_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}

              <option value="__other__">Other</option>
            </select>

            {selectedName === "__other__" && (
              <input
                value={otherName}
                onChange={(e) => setOtherName(e.target.value)}
                placeholder="Type your name..."
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/30"
              />
            )}
          </label>

          {/* Passcode */}
          <label className="block">
            <div className="mb-2 text-xs text-white/70">Party passcode</div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter passcode..."
              type="password"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") onLogin();
              }}
            />
          </label>

          {/* Error */}
          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {/* Submit */}
          <button
            onClick={onLogin}
            className="w-full rounded-xl bg-[#c60c30] px-5 py-3 text-sm font-semibold hover:opacity-90"
          >
            Enter HQ 🏈
          </button>

          <div className="text-xs text-white/50">
            Tip: edit the passcode + names in{" "}
            <span className="text-white">app/login/page.tsx</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
