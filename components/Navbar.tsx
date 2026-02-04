import Link from "next/link";

const tabs = [
  { href: "/", label: "Dashboard" },
  { href: "/predictions", label: "Predictions" },
  { href: "/squares", label: "Squares" },
  { href: "/food", label: "Food/Drinks" },
  { href: "/halftime", label: "Halftime" },
  { href: "/commercials", label: "Commercials" },
  { href: "/bingo", label: "Bingo" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#081427]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#c60c30]" />
          <div>
            <div className="text-sm font-semibold tracking-wide text-white">
              SUPER BOWL HQ
            </div>
            <div className="text-xs text-white/70">RBG Household Edition</div>
          </div>
        </div>

        <nav className="hidden gap-4 md:flex">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="text-sm text-white/80 hover:text-white"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ESPN-ish ticker */}
      <div className="border-t border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-4 py-2 text-xs text-white/80">
          🏈 Patriots vs Seahawks • Sun Feb 8, 2026 • 6:30 PM ET • Levi’s Stadium
        </div>
      </div>
    </header>
  );
}
