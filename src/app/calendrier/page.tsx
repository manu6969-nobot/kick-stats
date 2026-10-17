import { MatchRow } from "@/components/match-row";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { getMatchdays, getMatchesByMatchday } from "@/lib/stats";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendrier",
};

export default function CalendrierPage() {
  const matchdays = getMatchdays();

  return (
    <div>
      <PageHeader
        eyebrow="Programme"
        title="Calendrier & résultats"
        description="Toutes les journées avec scores, horaires et accès aux feuilles de stats."
      />

      <div className="animate-rise-delay-1 space-y-10">
        {matchdays.map((day) => {
          const dayMatches = getMatchesByMatchday(day);
          const allDone = dayMatches.every((m) => m.status === "finished");
          return (
            <section key={day} id={`j${day}`} className="scroll-mt-24">
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-display text-2xl font-bold">Journée {day}</h2>
                <Badge variant={allDone ? "secondary" : "default"}>
                  {allDone ? "Terminée" : "À venir"}
                </Badge>
              </div>
              <div className="space-y-2">
                {dayMatches.map((match) => (
                  <MatchRow key={match.id} match={match} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
