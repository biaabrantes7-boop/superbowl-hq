"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/" },
  { label: "Predictions", href: "/predictions" },
  { label: "Squares", href: "/squares" },
  { label: "Food & Drinks", href: "/food" },
  { label: "Halftime", href: "/halftime" },
  { label: "Commercials", href: "/commercials" },
  { label: "Bingo", href: "/bingo" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [name, setName] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  // Read login state safely on the client
  useEffect(() => {
    const ok = localStorage.getItem("rbg_passed") === "true";
    const storedName = localStorage.getItem("rbg_name");

    setLoggedIn(ok);
    setName(storedName);
  }, [pathname]);

  function logout() {
    localStorage.removeItem("rbg_passed");
    localStorage.removeItem("rbg_name");

    setLoggedIn(false);
    setName(null);

    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07101f]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* LEFT: Logo + Nav */}
        <div className="flex items-center gap-8">
          <div className="leading-tight">
            <div className="font-bold tracking-wide">SUPER BOWL HQ</div>
            <div className="text-xs text-white/60">RBG Household</div>
          </div>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "text-sm transition",
                    active
                      ? "text-white font-semibold"
                      : "text-white/60 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RIGHT: User + Actions */}
        <div className="flex items-center gap-4">
          {loggedIn && name && (
            <div className="text-sm text-white/70">👤 {name}</div>
          )}

          {!loggedIn ? (
            <button
              onClick={() => router.push("/login")}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
            >
              Login
            </button>
          ) : (
            <button
              onClick={logout}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
            >
              Log out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
