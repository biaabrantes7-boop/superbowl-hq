"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PASSCODE = "RBG2027";

export default function LoginPage() {
  const router = useRouter();
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    // Show who is currently "logged in" (if anyone)
    const ok = localStorage.getItem("rbg_passed") === "true";
    const n = localStorage.getItem("rbg_name");
    setCurrent(ok ? n : null);
  }, []);

  function resetLogin() {
    localStorage.removeItem("rbg_passed");
    localStorage.removeItem("rbg_name");
    setCurrent(null);
    setPass("");
    setName("");
    setErr(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (pass.trim() !== PASSCODE) return setErr("Wrong code 😭");
    if (!name.trim()) return setErr("Enter your name!");

    localStorage.setItem("rbg_passed", "true");
    localStorage.setItem("rbg_name", name.trim());

    router.replace("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
        <h1 className="text-2xl font-bold">Super Bowl HQ</h1>
        <p className="mt-1 text-white/60">Enter the code + your name.</p>

        {current && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
            <div className="text-white/70">
              Currently logged in as: <span className="font-semibold text-white">{current}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => router.replace("/")}
                className="flex-1 rounded-xl bg-white/10 px-4 py-2 hover:bg-white/20"
              >
                Continue
              </button>
              <button
                onClick={resetLogin}
                className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2 hover:bg-white/10"
              >
                Switch user
              </button>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-white/70">Passcode</label>
            <input
              value={pass}
              onChange={(e) => setPass(e.target.value)}
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

          {err && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {err}
            </div>
          )}

          <button className="w-full rounded-xl bg-white/10 px-4 py-3 font-semibold hover:bg-white/20">
            Enter
          </button>

          <button
            type="button"
            onClick={resetLogin}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80 hover:bg-white/10"
          >
            Reset login
          </button>
        </form>
      </div>
    </div>
  );
}
