"use client";

import { useState } from "react";
import { DonutChart } from "@/components/donut-chart";
import {
  GOAL_PERIODS,
  type GoalPeriodId,
  type TeamDashboard,
} from "@/lib/team-dashboard";
import { cn } from "@/lib/utils";

const GREEN = "#6fbf63";
const RED = "#e85a57";
const BLUE = "#2f3eb0";

export function TeamGoalsByPeriod({
  periods,
}: {
  periods: TeamDashboard["periods"];
}) {
  const [period, setPeriod] = useState<GoalPeriodId>("76-90");
  const slice = periods[period];

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card">
      <h2 className="px-4 pt-5 text-center font-display text-lg font-bold uppercase tracking-wide sm:text-xl">
        Répartition des buts par tranches de 15min
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

      <div className="mt-5 overflow-x-auto px-3 pb-5">
        <div
          className="mx-auto flex min-w-[34rem] overflow-hidden rounded-md border"
          style={{ borderColor: BLUE }}
          role="tablist"
          aria-label="Tranche de minutes"
        >
          {GOAL_PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={period === p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                "flex-1 px-2 py-2.5 text-center text-xs font-semibold transition sm:text-sm",
                period === p.id ? "bg-muted" : "bg-card hover:bg-muted/40"
              )}
              style={{ color: BLUE }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
