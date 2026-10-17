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
}: {
  rows: StandingRow[];
  highlightTeamId?: string;
  compact?: boolean;
}) {
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
            <TableHead className="hidden text-center md:table-cell">BP</TableHead>
            <TableHead className="hidden text-center md:table-cell">BC</TableHead>
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
            return (
              <TableRow
                key={row.teamId}
                className={cn(
                  highlightTeamId === row.teamId && "bg-primary/5",
                  rank <= 2 && "border-l-2 border-l-score",
                  rank === rows.length && "border-l-2 border-l-loss/60"
                )}
              >
                <TableCell className="text-center font-display font-bold text-muted-foreground">
                  {rank}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/equipes/${team.id}`}
                    className="flex items-center gap-2.5 font-medium hover:text-primary"
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
                <TableCell className="hidden text-center tabular-nums md:table-cell">
                  {row.goalsFor}
                </TableCell>
                <TableCell className="hidden text-center tabular-nums md:table-cell">
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
                <TableCell className="text-center font-display text-base font-bold tabular-nums">
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
