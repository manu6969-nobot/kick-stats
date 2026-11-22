import Link from "next/link";
import type { StandingRow } from "@/data/types";
import { getTeam } from "@/lib/stats";
import { FormDots } from "@/components/form-dots";
import { TeamBadge } from "@/components/team-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function StandingsTable({
  rows,
  highlightTeamId,
  compact = false,
  /** Nombre de places en zone de descente (P2). 0 = désactivé (ex. aperçu home). */
  relegationSpots = 3,
}: {
  rows: StandingRow[];
  highlightTeamId?: string;
  compact?: boolean;
  relegationSpots?: number;
}) {
  const spots = compact ? 0 : relegationSpots;
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Équipe</TableHead>
            <TableHead className="text-center">J</TableHead>
            {!compact && (
              <>
                <TableHead className="hidden text-center sm:table-cell">G</TableHead>
                <TableHead className="hidden text-center sm:table-cell">N</TableHead>
                <TableHead className="hidden text-center sm:table-cell">P</TableHead>
              </>
            )}
            <TableHead className="text-center">BP</TableHead>
            <TableHead className="text-center">BC</TableHead>
            <TableHead className="text-center">Diff</TableHead>
            <TableHead className="text-center font-bold">Pts</TableHead>
            {!compact && (
              <TableHead className="hidden text-center lg:table-cell">Forme</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const team = getTeam(row.teamId)!;
            const rank = index + 1;
            const leader = rank === 1;
            const relegationZone =
              spots > 0 && rows.length >= spots && rank > rows.length - spots;
            return (
              <TableRow
                key={row.teamId}
                className={cn(
                  highlightTeamId === row.teamId && "bg-primary/5",
                  leader && "border-l-4 border-l-win",
                  relegationZone && "border-l-4 border-l-loss"
                )}
                style={
                  leader
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--win) 22%, transparent)",
                      }
                    : relegationZone
                      ? {
                          backgroundColor:
                            "color-mix(in srgb, var(--loss) 28%, transparent)",
                        }
                      : undefined
                }
              >
                <TableCell
                  className={cn(
                    "text-center font-display font-bold text-muted-foreground",
                    leader && "text-win",
                    relegationZone && "text-loss"
                  )}
                  title={relegationZone ? "Zone de descente en P2" : undefined}
                >
                  {rank}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/equipes/${team.id}`}
                    className={cn(
                      "flex items-center gap-2.5 font-medium hover:text-primary",
                      leader && "text-win",
                      relegationZone && "text-loss"
                    )}
                  >
                    <TeamBadge team={team} size="sm" />
                    <span className="hidden sm:inline">{team.name}</span>
                    <span className="sm:hidden">{team.shortName}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-center tabular-nums">{row.played}</TableCell>
                {!compact && (
                  <>
                    <TableCell className="hidden text-center tabular-nums sm:table-cell">
                      {row.won}
                    </TableCell>
                    <TableCell className="hidden text-center tabular-nums sm:table-cell">
                      {row.drawn}
                    </TableCell>
                    <TableCell className="hidden text-center tabular-nums sm:table-cell">
                      {row.lost}
                    </TableCell>
                  </>
                )}
                <TableCell className="text-center tabular-nums">
                  {row.goalsFor}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {row.goalsAgainst}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-center tabular-nums font-medium",
                    row.goalDiff > 0 && "text-win",
                    row.goalDiff < 0 && "text-loss"
                  )}
                >
                  {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-center font-display text-base font-bold tabular-nums",
                    leader && "text-win",
                    relegationZone && "text-loss"
                  )}
                >
                  {row.points}
                </TableCell>
                {!compact && (
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex justify-center">
                      <FormDots form={row.form} />
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
