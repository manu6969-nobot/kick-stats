import Link from "next/link";
import { FormDots } from "@/components/form-dots";
import { PageHeader } from "@/components/page-header";
import { TeamBadge } from "@/components/team-badge";
import { teams } from "@/data/championship";
import { getMergedMatches } from "@/lib/live-results";
import {
  computeStandings,
  getTeamPlayers,
  getTeamSeasonStats,
} from "@/lib/stats";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Équipes",
};

export const dynamic = "force-dynamic";

export default async function EquipesPage() {
  const allMatches = await getMergedMatches();
  const standings = computeStandings(allMatches);
  const rankByTeam = new Map(standings.map((r, i) => [r.teamId, i + 1]));

  return (
    <div>
      <PageHeader
        eyebrow="Clubs"
        title="Équipes"
        description="Fiches clubs : buts, cartons, série de résultats et effectifs."
      />

      <div className="animate-rise-delay-1 grid gap-4 sm:grid-cols-2">
        {teams.map((team) => {
          const squad = getTeamPlayers(team.id);
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
              <div className="grid grid-cols-4 gap-2 px-5 py-3 text-center text-sm">
                <div>
                  <p className="text-muted-foreground">Rang</p>
                  <p className="font-display text-xl font-bold">{rank}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Points</p>
                  <p className="font-display text-xl font-bold">{row?.points ?? 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Buts</p>
                  <p className="font-display text-xl font-bold tabular-nums">
                    <span className="text-win">{season.goalsFor}</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-loss">{season.goalsAgainst}</span>
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Joués</p>
                  <p className="font-display text-xl font-bold">{season.played}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border/70 px-5 py-3 text-xs text-muted-foreground">
                <span>{squad.length} joueurs</span>
                <FormDots form={season.form} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
