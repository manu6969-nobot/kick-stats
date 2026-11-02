import { PageHeader } from "@/components/page-header";
import { PlayersFilters } from "@/components/players-filters";
import { players } from "@/data/championship";
import { getMergedMatches } from "@/lib/live-results";
import { getAllPlayerSeasonStats } from "@/lib/stats";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Joueurs",
};

export default async function JoueursPage() {
  const allMatches = await getMergedMatches();
  const seasonStats = getAllPlayerSeasonStats(allMatches);
  const scorersCount = seasonStats.filter((s) => s.goals > 0).length;
  const minutesCount = seasonStats.filter((s) => s.minutes > 0).length;

  return (
    <div>
      <PageHeader
        eyebrow="Individuels"
        title="Stats joueurs"
        description={`${players.length} joueurs · ${scorersCount} buteur${scorersCount > 1 ? "s" : ""} · ${minutesCount} avec temps de jeu (compositions RBFA).`}
      />

      {players.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-12 text-center text-muted-foreground">
          Aucun joueur saisi pour l&apos;instant.
        </p>
      ) : (
        <PlayersFilters seasonStats={seasonStats} />
      )}
    </div>
  );
}
