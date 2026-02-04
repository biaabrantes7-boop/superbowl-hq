"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { label: "Dashboard", href: "/" },
  { label: "Predictions", href: "/predictions" },
  { label: "Squares", href: "/squares" },
  { label: "Food & Drinks", href: "/food" },
  { label: "Halftime Show", href: "/halftime" },
  { label: "Commercials", href: "/commercials" },
  { label: "Bingo", href: "/bingo" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    // If you're saving the selected name somewhere, read it here.
    // Change these keys if yours are different.
    const storedName =
      localStorage.getItem("rbg_name") ||
      localStorage.getItem("name") ||
      "";
    setName(storedName);
  }, []);

  function logout() {
    // Clear whatever you store for login
    localStorage.removeItem("rbg_authed");
    localStorage.removeItem("rbg_name");
    localStorage.removeItem("name");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070f1f]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="font-bold tracking-wide">SUPER BOWL HQ</div>
            <div className="text-xs text-white/60">RBG Household</div>
          </div>

          <nav className="hidden gap-5 md:flex">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "text-sm transition",
                    active ? "text-white font-semibold" : "text-white/60 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {name ? <div className="text-sm text-white/70">{name}</div> : null}

          <button
            onClick={() => router.push("/login")}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
          >
            Login
          </button>

          <button
            onClick={logout}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
