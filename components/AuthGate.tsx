"use client";

// components/AuthGate.tsx
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getStoredName } from "@/lib/auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const name = getStoredName();
    if (!name) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
      return;
    }
    setReady(true);
  }, [router, pathname]);

  if (!ready) return null; // prevents hydration mismatch + flashing
  return <>{children}</>;
}
