"use client";

import { useState } from "react";
import { DonutChart } from "@/components/donut-chart";
import type { GoalsSlice, VenueFilter } from "@/lib/team-dashboard";
import { cn } from "@/lib/utils";

const GREEN = "#6fbf63";
const RED = "#e85a57";
const BLUE = "#2f3eb0";

const FILTERS: { id: VenueFilter; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "home", label: "à domicile" },
  { id: "away", label: "à l'extérieur" },
];

function fmtAvg(n: number) {
  return n.toLocaleString("fr-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function TeamGoalsDistribution({
  goals,
}: {
  goals: Record<VenueFilter, GoalsSlice>;
}) {
  const [venue, setVenue] = useState<VenueFilter>("all");
  const slice = goals[venue];
  const diff = slice.goalsFor - slice.goalsAgainst;
  const gfAvg = slice.played ? slice.goalsFor / slice.played : 0;
  const gaAvg = slice.played ? slice.goalsAgainst / slice.played : 0;

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card">
      <h2 className="px-4 pt-5 text-center font-display text-xl font-bold uppercase tracking-wide sm:text-2xl">
        Répartition des buts
      </h2>

      <div className="mt-4 flex items-center justify-center gap-4 px-4 sm:gap-8">
        <div className="min-w-[5.5rem] text-center">
          <p
            className="font-display text-5xl font-extrabold tabular-nums sm:text-6xl"
            style={{ color: GREEN }}
          >
            {slice.goalsFor}
          </p>
          <p className="mt-1 text-sm text-foreground">Buts marqués</p>
        </div>

        <DonutChart
          primary={slice.goalsFor}
          secondary={slice.goalsAgainst}
          primaryColor={GREEN}
          secondaryColor={RED}
          size={150}
          thickness={20}
        />

        <div className="min-w-[5.5rem] text-center">
          <p
            className="font-display text-5xl font-extrabold tabular-nums sm:text-6xl"
            style={{ color: RED }}
          >
            {slice.goalsAgainst}
          </p>
          <p className="mt-1 text-sm text-foreground">Buts encaissés</p>
        </div>
      </div>

      <div className="mt-5 flex justify-center px-4">
        <div
          className="inline-flex overflow-hidden rounded-md border"
          style={{ borderColor: BLUE }}
          role="tablist"
          aria-label="Lieu"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={venue === f.id}
              onClick={() => setVenue(f.id)}
              className={cn(
                "px-3 py-2 text-sm font-medium transition sm:px-4",
                venue === f.id
                  ? "text-white"
                  : "bg-transparent hover:bg-muted/50"
              )}
              style={
                venue === f.id
                  ? { backgroundColor: BLUE, color: "#fff" }
                  : { color: BLUE }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-border/70 border-t border-border/70 text-center text-sm">
        <div className="px-2 py-4">
          <p>
            buts/match{" "}
            <span className="font-display text-lg font-bold tabular-nums" style={{ color: GREEN }}>
              {fmtAvg(gfAvg)}
            </span>
          </p>
        </div>
        <div className="px-2 py-4">
          <p>
            Différence de buts{" "}
            <span
              className="font-display text-lg font-bold tabular-nums"
              style={{ color: diff >= 0 ? GREEN : RED }}
            >
              {diff > 0 ? "+" : ""}
              {diff}
            </span>
          </p>
        </div>
        <div className="px-2 py-4">
          <p>
            <span className="font-display text-lg font-bold tabular-nums" style={{ color: RED }}>
              {fmtAvg(gaAvg)}
            </span>{" "}
            but/match
          </p>
        </div>
      </div>
    </section>
  );
}
