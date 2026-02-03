"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error:", error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-[#07010f] text-white p-8">
        <h1 className="text-2xl font-header">Something crashed on this page 😵‍💫</h1>
        <p className="mt-2 text-white/70">
          Open DevTools → Console to see the exact error.
        </p>

        <pre className="mt-6 whitespace-pre-wrap rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          {error?.message}
        </pre>

        <button
          onClick={() => reset()}
          className="mt-6 rounded-xl bg-white/10 px-4 py-2 hover:bg-white/20"
        >
          Retry
        </button>
      </body>
    </html>
  );
}
