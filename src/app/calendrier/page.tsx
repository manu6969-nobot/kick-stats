import { MatchRow } from "@/components/match-row";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { getMergedMatches } from "@/lib/live-results";
import { getMatchdays, getMatchesByMatchday } from "@/lib/stats";
import type { Metadata } from "next";


export const revalidate = 60;
export const metadata: Metadata = {
  title: "Calendrier",
  description:
    "Calendrier et résultats du championnat P1 Luxembourg : toutes les journées, scores et prochaines rencontres.",
  alternates: { canonical: "/calendrier" },
};


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
        className="scroll-fade-x scrollbar-none sticky top-[4.25rem] z-30 -mx-4 mb-8 flex gap-1.5 overflow-x-auto bg-background/95 px-4 py-2 backdrop-blur-md sm:mx-0 sm:flex-wrap sm:overflow-visible sm:rounded-lg sm:border sm:border-border/70 sm:px-3"
      >
        {matchdays.map((day) => (
          <a
            key={day}
            href={`#j${day}`}
            className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-md border border-border/80 bg-card px-2.5 text-sm font-semibold tabular-nums text-muted-foreground transition hover:border-primary/40 hover:text-foreground sm:h-8 sm:min-w-8 sm:text-xs"
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
            <section
              key={day}
              id={`j${day}`}
              className="content-auto scroll-mt-36 sm:scroll-mt-28"
            >
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
