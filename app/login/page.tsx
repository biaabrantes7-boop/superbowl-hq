"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PASSCODE = "RBG2027";

export default function LoginPage() {
  const router = useRouter();
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);

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
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6"
      >
        <h1 className="text-2xl font-bold">Super Bowl HQ</h1>
        <p className="mt-1 text-white/60">Enter the code + your name.</p>

        <div className="mt-6 space-y-4">
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
        </div>
      </form>
    </div>
  );
}
