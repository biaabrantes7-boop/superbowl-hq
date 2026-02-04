"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PASSCODE = "RBG2027";

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // If already logged in, go home
  useEffect(() => {
    const ok = localStorage.getItem("rbg_passed") === "true";
    if (ok) router.replace("/");
  }, [router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (passcode.trim() !== PASSCODE) {
      setError("Wrong code 😭");
      return;
    }
    if (!name.trim()) {
      setError("Enter your name!");
      return;
    }

    localStorage.setItem("rbg_passed", "true");
    localStorage.setItem("rbg_name", name.trim());
    router.replace("/");
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-1 text-white/60">Enter the code + your name.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-white/70">Passcode</label>
            <input
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
              placeholder="RBG2027"
            />
          </div>

          <div>
            <label className="text-sm text-white/70">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
              placeholder="Bianca"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button className="w-full rounded-xl bg-white/10 px-4 py-3 font-semibold">
            Enter
          </button>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("rbg_passed");
              localStorage.removeItem("rbg_name");
              setPasscode("");
              setName("");
              setError(null);
            }}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80"
          >
            Reset login
          </button>
        </div>
      </form>
    </div>
  );
}
