"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type OverviewKpi = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
};

function KpiCard({ label, value, hint, accent }: OverviewKpi) {
  return (
    <div className="rounded-xl border border-border/80 bg-card px-4 py-4 text-center shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-3xl font-extrabold tabular-nums",
          accent
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Affiche 6 KPI par défaut, le reste derrière « Voir plus ». */
export function StatsOverviewKpis({ items }: { items: OverviewKpi[] }) {
  const [expanded, setExpanded] = useState(false);
  const primary = items.slice(0, 6);
  const extra = items.slice(6);
  const visible = expanded ? items : primary;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {visible.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>
      {extra.length > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-pitch transition hover:bg-pitch/10"
          >
            {expanded
              ? "Voir moins"
              : `Voir plus (${extra.length} indicateurs)`}
          </button>
        </div>
      )}
    </div>
  );
}
