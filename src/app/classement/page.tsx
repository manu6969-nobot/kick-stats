import { PageHeader } from "@/components/page-header";
import { StandingsTabs } from "@/components/standings-tabs";
import { getMergedMatches } from "@/lib/live-results";
import { computeStandings } from "@/lib/stats";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Classement",
};

export const dynamic = "force-dynamic";

export default async function ClassementPage() {
  const standings = computeStandings(await getMergedMatches());

  return (
    <div>
      <PageHeader
        eyebrow="Saison en cours"
        title="Classement"
        description="Points, différence de buts, forme récente et répartition domicile / extérieur."
      />
      <StandingsTabs standings={standings} />
    </div>
  );
}
