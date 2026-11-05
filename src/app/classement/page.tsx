import { PitchPageBanner } from "@/components/pitch-page-banner";
import { StandingsTabs } from "@/components/standings-tabs";
import { meta } from "@/data/championship";
import { getMergedMatches } from "@/lib/live-results";
import { computeStandings } from "@/lib/stats";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Classement",
  description:
    "Classement officiel P1 Luxembourg : points, différence de buts, forme récente, domicile et extérieur.",
  alternates: { canonical: "/classement" },
};

export default async function ClassementPage() {
  const standings = computeStandings(await getMergedMatches());

  return (
    <div>
      <PitchPageBanner
        eyebrow={`Saison ${meta.season}`}
        title="Classement"
        description="Points, différence de buts, forme récente et répartition domicile / extérieur."
      />
      <StandingsTabs standings={standings} />
    </div>
  );
}
