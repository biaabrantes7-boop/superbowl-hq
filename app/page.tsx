import Countdown from "@/components/Countdown";
import StatCard from "@/components/StatCard";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Super Bowl HQ 🏈
          </h1>
          <p className="mt-2 text-white/70">
            ESPN/NFL theme, Patriots energy, RBG household rules.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
          Location: <span className="text-white">RBG Household</span> • Doors open{" "}
          <span className="text-white">1 hour before kickoff</span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: countdown + agenda */}
        <div className="space-y-6 lg:col-span-1">
          <Countdown />

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs tracking-wide text-white/70">AGENDA</div>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>🕠 Arrive: 1 hour before kickoff</li>
              <li>🏈 Kickoff: 6:30 PM ET</li>
              <li>🎤 Halftime: rate the show + update predictions</li>
              <li>🍕 Snack check: mid-3rd quarter</li>
              <li>🏆 Final: awards + worst take ceremony</li>
            </ul>
          </div>
        </div>

        {/* Right: facts + stats */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-3">
            <StatCard title="MATCHUP" value="Patriots vs Seahawks" sub="Super Bowl LX" />
            <StatCard title="KICKOFF" value="6:30 PM ET" sub="Sun • Feb 8, 2026" />
            <StatCard title="VENUE" value="Levi’s Stadium" sub="Santa Clara, CA" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs tracking-wide text-white/70">
                  TEAM FUN FACTS
                </div>
                <h2 className="mt-2 text-xl font-semibold">
                  Quick hits for trash talk 😈
                </h2>
              </div>
              <div className="hidden sm:block rounded-xl bg-[#c60c30] px-3 py-2 text-xs font-semibold">
                Patriots-coded
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-semibold">New England Patriots</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/75">
                  <li>Defense-first energy. “Bend don’t break.”</li>
                  <li>Winning DNA: they do not respect your feelings.</li>
                  <li>Key vibe: clutch drives + chaos factor.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-semibold">Seattle Seahawks</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/75">
                  <li>Explosive plays — “blink and it’s 7 points.”</li>
                  <li>Big momentum swings. Loud moments.</li>
                  <li>Key vibe: deep shots + “how did that happen.”</li>
                </ul>
              </div>
            </div>

            <p className="mt-4 text-xs text-white/50">
              (We can swap these for real stats/records if you want — I can
              pull the latest team numbers and add them here cleanly.)
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs tracking-wide text-white/70">SUPER BOWL FUN FACTS</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/80">
              <li>Halftime ratings are mandatory. No “it was fine” allowed.</li>
              <li>Commercials get a tier list: S / A / “why did they do that”.</li>
              <li>Worst prediction owes the room a snack run (optional… 👀).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
