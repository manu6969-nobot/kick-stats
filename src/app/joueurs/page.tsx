import { PageHeader } from "@/components/page-header";
import { PlayersFilters } from "@/components/players-filters";
import { players } from "@/data/championship";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Joueurs",
};

export default function JoueursPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Individuels"
        title="Stats joueurs"
        description={`${players.length} joueurs · filtrez par poste ou club. Les buteurs/passeurs se rempliront avec les stats saison.`}
      />

      {players.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-12 text-center text-muted-foreground">
          Aucun joueur saisi pour l&apos;instant.
        </p>
      ) : (
        <PlayersFilters />
      )}
    </div>
  );
}
