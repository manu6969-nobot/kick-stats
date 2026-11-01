"use client";

import { useState } from "react";
import { DonutChart } from "@/components/donut-chart";
import { cn } from "@/lib/utils";

const ORANGE = "#f0a020";
const RED = "#e85a57";
const BLUE = "#2f3eb0";

function fmtAvg(n: number) {
  return n.toLocaleString("fr-BE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function TeamCardsPanel({
  yellow,
  red,
  played,
}: {
  yellow: number;
  red: number;
  played: number;
}) {
  const [scope, setScope] = useState<"league" | "all">("league");
  // Une seule compétition chargée (P1 Luxembourg) — les deux vues partagent les mêmes chiffres.
  const yAvg = played ? yellow / played : 0;
  const rAvg = played ? red / played : 0;

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card">
      <h2 className="px-4 pt-5 text-center font-display text-xl font-bold uppercase tracking-wide sm:text-2xl">
        Cartons
      </h2>

      <div className="mt-4 flex items-center justify-center gap-4 px-4 sm:gap-8">
        <div className="min-w-[5rem] text-center">
          <p
            className="font-display text-5xl font-extrabold tabular-nums sm:text-6xl"
            style={{ color: ORANGE }}
          >
            {yellow}
          </p>
          <p className="mt-1 text-sm text-foreground">Jaunes</p>
        </div>

        <DonutChart
          primary={yellow}
          secondary={red}
          primaryColor={ORANGE}
          secondaryColor={RED}
          size={150}
          thickness={20}
        />

        <div className="min-w-[5rem] text-center">
          <p
            className="font-display text-5xl font-extrabold tabular-nums sm:text-6xl"
            style={{ color: RED }}
          >
            {red}
          </p>
          <p className="mt-1 text-sm text-foreground">Rouges</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 divide-x divide-border/70 border-t border-border/70 text-center">
        <div className="px-3 py-5">
          <p
            className="font-display text-4xl font-extrabold tabular-nums"
            style={{ color: ORANGE }}
          >
            {fmtAvg(yAvg)}
          </p>
          <p className="mt-1 text-sm text-foreground">Moyenne/Match (Jaunes)</p>
        </div>
        <div className="px-3 py-5">
          <p
            className="font-display text-4xl font-extrabold tabular-nums"
            style={{ color: RED }}
          >
            {fmtAvg(rAvg)}
          </p>
          <p className="mt-1 text-sm text-foreground">Moyenne/Match (Rouges)</p>
        </div>
      </div>

      <div className="flex justify-center px-4 pb-5">
        <div
          className="inline-flex overflow-hidden rounded-md border"
          style={{ borderColor: BLUE }}
          role="tablist"
          aria-label="Compétition"
        >
          {(
            [
              { id: "league" as const, label: "Championnat" },
              { id: "all" as const, label: "toutes compétitions" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={scope === f.id}
              onClick={() => setScope(f.id)}
              className={cn(
                "px-3 py-2 text-sm font-medium transition sm:px-4",
                scope === f.id ? "text-white" : "bg-transparent hover:bg-muted/50"
              )}
              style={
                scope === f.id
                  ? { backgroundColor: BLUE, color: "#fff" }
                  : { color: BLUE }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
