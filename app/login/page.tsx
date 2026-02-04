"use client";

// app/login/page.tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStoredName, setStoredName } from "@/lib/auth";

const ACCESS_CODE = "RBG2027"; // change this if you want

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();

  const nextPath = useMemo(() => params.get("next") || "/dashboard", [params]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // if already logged in, go straight to next
  useEffect(() => {
    const existing = getStoredName();
    if (existing) router.replace(nextPath);
  }, [router, nextPath]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (code.trim() !== ACCESS_CODE) {
      setErr("Wrong access code 😈");
      return;
    }

    if (!name.trim()) {
      setErr("Enter your name plz");
      return;
    }

    setStoredName(name.trim());
    router.replace(nextPath);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-white/70">
          Enter your name + the secret code to enter Super Bowl HQ.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-white/70">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none"
              placeholder="Bianca"
            />
          </div>

          <div>
            <label className="text-sm text-white/70">Access code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none"
              placeholder="RBG2027"
            />
          </div>

          {err && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {err}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-white px-4 py-2 font-semibold text-black hover:opacity-90"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
