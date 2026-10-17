"use client";

import { useState } from "react";
import { FormDots } from "@/components/form-dots";
import { StandingsTable } from "@/components/standings-table";
import { TeamBadge } from "@/components/team-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StandingRow } from "@/data/types";
import { getTeam } from "@/lib/stats";
import { cn } from "@/lib/utils";

export function StandingsTabs({ standings }: { standings: StandingRow[] }) {
  const [tab, setTab] = useState<"general" | "home" | "away">("general");

  const homeRows = [...standings].sort((a, b) => {
    const ap = a.home.won * 3 + a.home.drawn;
    const bp = b.home.won * 3 + b.home.drawn;
    if (bp !== ap) return bp - ap;
    return (
      b.home.goalsFor -
      b.home.goalsAgainst -
      (a.home.goalsFor - a.home.goalsAgainst)
    );
  });

  const awayRows = [...standings].sort((a, b) => {
    const ap = a.away.won * 3 + a.away.drawn;
    const bp = b.away.won * 3 + b.away.drawn;
    if (bp !== ap) return bp - ap;
    return (
      b.away.goalsFor -
      b.away.goalsAgainst -
      (a.away.goalsFor - a.away.goalsAgainst)
    );
  });

  return (
    <div className="animate-rise-delay-1 space-y-6">
      <div
        role="tablist"
        className="inline-flex h-auto flex-wrap gap-1 rounded-lg bg-muted/80 p-1"
      >
        {(
          [
            { id: "general", label: "Général" },
            { id: "home", label: "Domicile" },
            { id: "away", label: "Extérieur" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              tab === item.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="space-y-4">
          <StandingsTable rows={standings} />
          <p className="text-sm text-muted-foreground">
            Or : places européennes · Rouge : zone de relégation (indicatif).
          </p>
        </div>
      )}

      {tab === "home" && (
        <SplitTable
          rows={homeRows.map((r) => ({
            teamId: r.teamId,
            played: r.home.played,
            won: r.home.won,
            drawn: r.home.drawn,
            lost: r.home.lost,
            gf: r.home.goalsFor,
            ga: r.home.goalsAgainst,
            points: r.home.won * 3 + r.home.drawn,
            form: r.form,
          }))}
        />
      )}

      {tab === "away" && (
        <SplitTable
          rows={awayRows.map((r) => ({
            teamId: r.teamId,
            played: r.away.played,
            won: r.away.won,
            drawn: r.away.drawn,
            lost: r.away.lost,
            gf: r.away.goalsFor,
            ga: r.away.goalsAgainst,
            points: r.away.won * 3 + r.away.drawn,
            form: r.form,
          }))}
        />
      )}
    </div>
  );
}

function SplitTable({
  rows,
}: {
  rows: {
    teamId: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number;
    ga: number;
    points: number;
    form: ("W" | "D" | "L")[];
  }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Équipe</TableHead>
            <TableHead className="text-center">J</TableHead>
            <TableHead className="text-center">G</TableHead>
            <TableHead className="text-center">N</TableHead>
            <TableHead className="text-center">P</TableHead>
            <TableHead className="text-center">BP</TableHead>
            <TableHead className="text-center">BC</TableHead>
            <TableHead className="text-center font-bold">Pts</TableHead>
            <TableHead className="hidden text-center lg:table-cell">Forme</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const team = getTeam(row.teamId)!;
            return (
              <TableRow key={row.teamId}>
                <TableCell className="text-center font-display font-bold text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5 font-medium">
                    <TeamBadge team={team} size="sm" />
                    {team.name}
                  </div>
                </TableCell>
                <TableCell className="text-center tabular-nums">{row.played}</TableCell>
                <TableCell className="text-center tabular-nums">{row.won}</TableCell>
                <TableCell className="text-center tabular-nums">{row.drawn}</TableCell>
                <TableCell className="text-center tabular-nums">{row.lost}</TableCell>
                <TableCell className="text-center tabular-nums">{row.gf}</TableCell>
                <TableCell className="text-center tabular-nums">{row.ga}</TableCell>
                <TableCell className="text-center font-display text-base font-bold tabular-nums">
                  {row.points}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex justify-center">
                    <FormDots form={row.form} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
