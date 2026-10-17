import { PageHeader } from "@/components/page-header";
import { PlayersFilters } from "@/components/players-filters";
import { players, teams } from "@/data/championship";
import { getPlayerStats, getTeam } from "@/lib/stats";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Joueurs",
};

export default function JoueursPage() {
  const rows = players
    .map((player) => {
      const team = getTeam(player.teamId);
      if (!team) return null;
      return {
        player,
        team,
        stats: getPlayerStats(player.id) ?? null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort((a, b) => {
      const byTeam = a.team.name.localeCompare(b.team.name, "fr");
      if (byTeam !== 0) return byTeam;
      return a.player.lastName.localeCompare(b.player.lastName, "fr");
    });

  const teamsSorted = [...teams].sort((a, b) =>
    a.name.localeCompare(b.name, "fr")
  );

  return (
    <div>
      <PageHeader
        eyebrow="Individuels"
        title="Stats joueurs"
        description={`${players.length} joueurs · filtrez par poste ou club. Les buteurs/passeurs se rempliront avec les stats saison.`}
      />

      {players.length === 0 ? (
        <p className="animate-rise-delay-1 rounded-xl border border-dashed border-border bg-card px-4 py-12 text-center text-muted-foreground">
          Aucun joueur saisi pour l&apos;instant.
          <br />
          Ajoutez l&apos;effectif dans{" "}
          <code className="text-foreground">src/data/championship.ts</code>.
        </p>
      ) : (
        <PlayersFilters rows={rows} teams={teamsSorted} />
      )}
    </div>
  );
}
