"use client";

// components/Navbar.tsx
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearStoredName, getStoredName } from "@/lib/auth";

const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Predictions", href: "/predictions" },
  { label: "Squares", href: "/squares" },
  { label: "Food & Drinks", href: "/food" },
  { label: "Halftime Show", href: "/halftime" },
  { label: "Commercials", href: "/commercials" },
  { label: "Bingo", href: "/bingo" },
];

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setName(getStoredName());
  }, []);

  // if name changes in another tab, update
  useEffect(() => {
    const onStorage = () => setName(getStoredName());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!mounted) return null;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07101f]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-10">
          <Link href="/dashboard" className="leading-tight">
            <div className="text-lg font-semibold tracking-wide text-white">
              SUPER BOWL HQ
            </div>
            <div className="text-xs text-white/60">RBG Household</div>
          </Link>

          <nav className="hidden gap-5 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "text-sm text-white/70 hover:text-white transition",
                  isActive(item.href) ? "text-white font-semibold" : "",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {name ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-white/80">
                <span className="opacity-70">👤</span> {name}
              </div>

              <button
                onClick={() => {
                  clearStoredName();
                  setName(null);
                  router.replace("/login");
                }}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(pathname || "/dashboard")}`}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
