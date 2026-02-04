"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // ✅ Always allow the login page
    if (pathname === "/login") {
      setReady(true);
      return;
    }

    const ok = localStorage.getItem("rbg_passed") === "true";
    if (!ok) {
      router.replace("/login");
      return;
    }

    setReady(true);
  }, [pathname, router]);

  // Simple loading state so it doesn't flash
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/70">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
