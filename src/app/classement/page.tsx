import { PageHeader } from "@/components/page-header";
import { StandingsTabs } from "@/components/standings-tabs";
import { computeStandings } from "@/lib/stats";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Classement",
};

export default function ClassementPage() {
  const standings = computeStandings();

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
