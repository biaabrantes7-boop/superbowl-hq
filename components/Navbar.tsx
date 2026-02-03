"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/components/AuthGate";

const tabs = [
  { href: "/", label: "Dashboard" },
  { href: "/predictions", label: "Predictions" },
  { href: "/squares", label: "Squares" },
  { href: "/food", label: "Food & Drinks" },
  { href: "/halftime", label: "Halftime Show" },
  { href: "/commercials", label: "Commercials" },
  { href: "/bingo", label: "Bingo" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide navbar on login page
  if (pathname === "/login") return null;

  function onLogout() {
    logout();
    localStorage.removeItem("rbg_superbowl_name_v1");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#081427]/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* LEFT: Title */}
        <div className="flex flex-col">
          <span className="font-header text-lg tracking-wide text-white">
            SUPER BOWL HQ
          </span>
          <span className="text-xs text-white/60 font-body">
            RBG Household
          </span>
        </div>

        {/* CENTER: Tabs */}
        <nav className="hidden lg:flex items-center gap-6">
          {tabs.map((tab) => {
            const active =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={[
                  "text-sm font-body transition",
                  active
                    ? "text-white font-semibold"
                    : "text-white/60 hover:text-white",
                ].join(" ")}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT: User + Logout */}
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-sm text-white/60 font-body">
            {typeof window !== "undefined"
              ? localStorage.getItem("rbg_superbowl_name_v1")
              : ""}
          </span>

          <button
            onClick={onLogout}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
