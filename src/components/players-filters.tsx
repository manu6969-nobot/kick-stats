"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TeamBadge } from "@/components/team-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Player, PlayerSeasonStats, Team } from "@/data/types";
import { playerDisplayName, positionLabel } from "@/lib/stats";
import { cn } from "@/lib/utils";

type PlayerRow = {
  player: Player;
  team: Team;
  stats: PlayerSeasonStats | null;
};

const POSITIONS = [
  { id: "all", label: "Tous" },
  { id: "GB", label: "Gardiens" },
  { id: "DEF", label: "Défenseurs" },
  { id: "MIL", label: "Milieux" },
  { id: "ATT", label: "Attaquants" },
] as const;

type PosFilter = (typeof POSITIONS)[number]["id"];

export function PlayersFilters({
  rows,
  teams,
}: {
  rows: PlayerRow[];
  teams: Team[];
}) {
  const [tab, setTab] = useState<"effectif" | "buteurs" | "passeurs">("effectif");
  const [position, setPosition] = useState<PosFilter>("all");
  const [teamId, setTeamId] = useState<string>("all");

  const filtered = useMemo(() => {
    return rows.filter(({ player }) => {
      if (position !== "all" && player.position !== position) return false;
      if (teamId !== "all" && player.teamId !== teamId) return false;
      return true;
    });
  }, [rows, position, teamId]);

  const scorers = useMemo(
    () =>
      [...rows]
        .filter((r) => (r.stats?.goals ?? 0) > 0)
        .sort((a, b) => {
          const g = (b.stats?.goals ?? 0) - (a.stats?.goals ?? 0);
          if (g !== 0) return g;
          return (b.stats?.assists ?? 0) - (a.stats?.assists ?? 0);
        }),
    [rows]
  );

  const assists = useMemo(
    () =>
      [...rows]
        .filter((r) => (r.stats?.assists ?? 0) > 0)
        .sort((a, b) => {
          const p = (b.stats?.assists ?? 0) - (a.stats?.assists ?? 0);
          if (p !== 0) return p;
          return (b.stats?.goals ?? 0) - (a.stats?.goals ?? 0);
        }),
    [rows]
  );

  return (
    <div className="animate-rise-delay-1 space-y-6">
      <Tabs
        value={tab}
        onValueChange={(value) =>
          setTab(value as "effectif" | "buteurs" | "passeurs")
        }
        className="gap-6"
      >
        <TabsList className="h-auto flex-wrap bg-muted/80 p-1">
          <TabsTrigger value="effectif" className="px-3 py-1.5">
            Effectif ({rows.length})
          </TabsTrigger>
          <TabsTrigger value="buteurs" className="px-3 py-1.5">
            Buteurs
          </TabsTrigger>
          <TabsTrigger value="passeurs" className="px-3 py-1.5">
            Passeurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="effectif" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap gap-1.5">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setPosition(pos.id)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium transition",
                    position === pos.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {pos.label}
                  {pos.id !== "all" && (
                    <span className="ml-1 opacity-70">
                      (
                      {
                        rows.filter((r) => r.player.position === pos.id).length
                      }
                      )
                    </span>
                  )}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Équipe
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">Toutes</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-sm text-muted-foreground">
            {filtered.length} joueur{filtered.length > 1 ? "s" : ""}
          </p>

          <PlayersTable rows={filtered} showStats={false} />
        </TabsContent>

        <TabsContent value="buteurs">
          {scorers.length === 0 ? (
            <EmptyStats message="Aucun buteur enregistré pour l’instant. Les buts apparaîtront ici dès que les stats joueurs seront saisies." />
          ) : (
            <LeaderTable rows={scorers} mode="goals" />
          )}
        </TabsContent>

        <TabsContent value="passeurs">
          {assists.length === 0 ? (
            <EmptyStats message="Aucune passe décisive enregistrée pour l’instant." />
          ) : (
            <LeaderTable rows={assists} mode="assists" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyStats({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

function PlayersTable({
  rows,
  showStats,
}: {
  rows: PlayerRow[];
  showStats: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        Aucun joueur ne correspond à ces filtres.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 text-center">N°</TableHead>
            <TableHead>Joueur</TableHead>
            <TableHead>Équipe</TableHead>
            <TableHead>Poste</TableHead>
            {showStats && (
              <>
                <TableHead className="text-center">MJ</TableHead>
                <TableHead className="text-center">Buts</TableHead>
                <TableHead className="text-center">Passes</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ player, team }) => (
            <TableRow key={player.id}>
              <TableCell className="text-center font-display font-bold tabular-nums text-muted-foreground">
                {player.number}
              </TableCell>
              <TableCell>
                <Link
                  href={`/joueurs/${player.id}`}
                  className="font-medium hover:text-primary"
                >
                  {playerDisplayName(player)}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/equipes/${team.id}`}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <TeamBadge team={team} size="sm" />
                  <span className="text-sm">{team.shortName}</span>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {positionLabel(player.position)}
              </TableCell>
              {showStats && (
                <>
                  <TableCell className="text-center tabular-nums">—</TableCell>
                  <TableCell className="text-center tabular-nums">—</TableCell>
                  <TableCell className="text-center tabular-nums">—</TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LeaderTable({
  rows,
  mode,
}: {
  rows: PlayerRow[];
  mode: "goals" | "assists";
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Joueur</TableHead>
            <TableHead>Équipe</TableHead>
            <TableHead className="text-center">Buts</TableHead>
            <TableHead className="text-center">Passes</TableHead>
            <TableHead className="text-center">MJ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ player, team, stats }, index) => (
            <TableRow key={player.id}>
              <TableCell className="text-center font-display font-bold text-muted-foreground">
                {index + 1}
              </TableCell>
              <TableCell>
                <Link
                  href={`/joueurs/${player.id}`}
                  className="font-medium hover:text-primary"
                >
                  {playerDisplayName(player)}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <TeamBadge team={team} size="sm" />
                  <span className="text-sm">{team.shortName}</span>
                </div>
              </TableCell>
              <TableCell
                className={cn(
                  "text-center font-display tabular-nums",
                  mode === "goals" && "text-lg font-bold text-pitch"
                )}
              >
                {stats?.goals ?? 0}
              </TableCell>
              <TableCell
                className={cn(
                  "text-center font-display tabular-nums",
                  mode === "assists" && "text-lg font-bold text-pitch"
                )}
              >
                {stats?.assists ?? 0}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {stats?.appearances ?? 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
