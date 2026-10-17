import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TeamBadge } from "@/components/team-badge";
import { teams } from "@/data/championship";
import { computeStandings, getTeamPlayers } from "@/lib/stats";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Équipes",
};

export default function EquipesPage() {
  const standings = computeStandings();
  const rankByTeam = new Map(standings.map((r, i) => [r.teamId, i + 1]));

  return (
    <div>
      <PageHeader
        eyebrow="Clubs"
        title="Équipes"
        description="Fiches clubs, effectifs et statistiques domicile / extérieur."
      />

      <div className="animate-rise-delay-1 grid gap-4 sm:grid-cols-2">
        {teams.map((team) => {
          const squad = getTeamPlayers(team.id);
          const rank = rankByTeam.get(team.id);
          const row = standings.find((s) => s.teamId === team.id);
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
              <div className="grid grid-cols-3 gap-2 px-5 py-4 text-center text-sm">
                <div>
                  <p className="text-muted-foreground">Rang</p>
                  <p className="font-display text-xl font-bold">{rank}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Points</p>
                  <p className="font-display text-xl font-bold">{row?.points ?? 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Effectif</p>
                  <p className="font-display text-xl font-bold">{squad.length}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
