import Link from "next/link";
import { FormDots } from "@/components/form-dots";
import { PageHeader } from "@/components/page-header";
import { TeamBadge } from "@/components/team-badge";
import { teams } from "@/data/championship";
import { getMergedMatches } from "@/lib/live-results";
import { computeStandings, getTeamSeasonStats } from "@/lib/stats";
import type { Metadata } from "next";


export const revalidate = 60;
export const metadata: Metadata = {
  title: "Équipes",
};


export default async function EquipesPage() {
  const allMatches = await getMergedMatches();
  const standings = computeStandings(allMatches);
  const rankByTeam = new Map(standings.map((r, i) => [r.teamId, i + 1]));

  const ordered = [...teams].sort((a, b) => {
    const ra = rankByTeam.get(a.id) ?? 99;
    const rb = rankByTeam.get(b.id) ?? 99;
    return ra - rb;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Clubs"
        title="Équipes"
        description="Bilan réel depuis les résultats RBFA : points, buts, cartons et série."
      />

      <div className="animate-rise-delay-1 grid gap-4 sm:grid-cols-2">
        {ordered.map((team) => {
          const rank = rankByTeam.get(team.id);
          const row = standings.find((s) => s.teamId === team.id);
          const season = getTeamSeasonStats(team.id, allMatches, 5);
          return (
            <Link
              key={team.id}
              href={`/equipes/${team.id}`}
              className="group overflow-hidden rounded-xl border border-border/80 bg-card transition hover:border-primary/30 hover:shadow-md"
            >
              <div
                className="flex items-center gap-4 px-5 py-4"
                style={{
                  background: `linear-gradient(135deg, ${team.colors.primary} 0%, ${team.colors.primary}cc 55%, transparent 100%)`,
                }}
              >
                <TeamBadge team={team} size="lg" className="ring-white/50" />
                <div className="text-white">
                  <h2 className="font-display text-2xl font-bold drop-shadow-sm">
                    {team.name}
                  </h2>
                  <p className="text-sm text-white/80">
                    {team.city} · {team.stadium}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 px-4 py-3 text-center text-sm sm:grid-cols-4 sm:px-5">
                <div>
                  <p className="text-muted-foreground">Rang</p>
                  <p className="font-display text-xl font-bold">{rank}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Points</p>
                  <p className="font-display text-xl font-bold">{row?.points ?? 0}</p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-muted-foreground">V/N/D</p>
                  <p className="font-display text-lg font-bold tabular-nums">
                    {season.won}/{season.drawn}/{season.lost}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Buts</p>
                  <p className="font-display text-xl font-bold tabular-nums">
                    <span className="text-win">{season.goalsFor}</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-loss">{season.goalsAgainst}</span>
                  </p>
                </div>
              </div>

              <div className="hidden grid-cols-3 gap-2 border-t border-border/70 px-5 py-3 text-center text-xs sm:grid">
                <div>
                  <p className="text-muted-foreground">Clean sheets</p>
                  <p className="font-display text-base font-bold tabular-nums">
                    {season.cleanSheets}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jaunes</p>
                  <p className="font-display text-base font-bold tabular-nums text-draw">
                    {season.yellowCards}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rouges</p>
                  <p className="font-display text-base font-bold tabular-nums text-loss">
                    {season.redCards}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/70 px-4 py-3 text-xs text-muted-foreground sm:px-5">
                <span>
                  {season.played} match{season.played > 1 ? "s" : ""}
                  <span className="sm:hidden">
                    {" "}
                    · {season.won}/{season.drawn}/{season.lost}
                  </span>
                  <span className="hidden sm:inline">
                    {" "}
                    · diff{" "}
                    <span className="font-medium text-foreground">
                      {season.goalDiff > 0 ? "+" : ""}
                      {season.goalDiff}
                    </span>
                  </span>
                </span>
                <FormDots form={season.form} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
