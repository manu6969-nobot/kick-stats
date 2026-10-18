import { MatchRow } from "@/components/match-row";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { getMergedMatches } from "@/lib/live-results";
import { getMatchdays, getMatchesByMatchday } from "@/lib/stats";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendrier",
};

export const dynamic = "force-dynamic";

export default async function CalendrierPage() {
  const allMatches = await getMergedMatches();
  const matchdays = getMatchdays(allMatches);

  return (
    <div>
      <PageHeader
        eyebrow="Programme officiel"
        title="Calendrier & résultats"
        description={`${allMatches.length} matchs · ${matchdays.length} journées · 8 rencontres par journée.`}
      />

      <nav
        aria-label="Aller à une journée"
        className="animate-rise-delay-1 mb-8 flex flex-wrap gap-1.5"
      >
        {matchdays.map((day) => (
          <a
            key={day}
            href={`#j${day}`}
            className="flex h-8 min-w-8 items-center justify-center rounded-md border border-border/80 bg-card px-2 text-xs font-semibold tabular-nums text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            {day}
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        {matchdays.map((day) => {
          const dayMatches = getMatchesByMatchday(day, allMatches);
          const allDone = dayMatches.every((m) => m.status === "finished");
          const anyDone = dayMatches.some((m) => m.status === "finished");
          return (
            <section key={day} id={`j${day}`} className="scroll-mt-24">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="font-display text-2xl font-bold">Journée {day}</h2>
                <Badge variant={allDone ? "secondary" : "default"}>
                  {allDone ? "Terminée" : anyDone ? "En cours" : "À venir"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {dayMatches[0]?.date}
                  {dayMatches.at(-1)?.date !== dayMatches[0]?.date &&
                    ` → ${dayMatches.at(-1)?.date}`}
                </span>
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
