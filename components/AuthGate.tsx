"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

const AUTH_KEY = "rbg_superbowl_authed_v1";

export function isAuthed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function setAuthed() {
  localStorage.setItem(AUTH_KEY, "true");
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (pathname === "/login") {
      setChecked(true);
      return;
    }

    if (!isAuthed()) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  // ⛔️ DO NOT DIM CONTENT
  if (!checked) return null;

  return <>{children}</>;
}
