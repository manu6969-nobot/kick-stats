"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TeamBadge } from "@/components/team-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { players, playerStats, teams } from "@/data/championship";
import type { Player, Team } from "@/data/types";
import { playerDisplayName, positionLabel } from "@/lib/stats";
import { cn } from "@/lib/utils";

type PlayerRow = {
  player: Player;
  team: Team;
  goals: number;
  assists: number;
  appearances: number;
};

const POSITIONS = [
  { id: "all", label: "Tous" },
  { id: "GB", label: "Gardiens" },
  { id: "DEF", label: "Défenseurs" },
  { id: "MIL", label: "Milieux" },
  { id: "ATT", label: "Attaquants" },
] as const;

type PosFilter = (typeof POSITIONS)[number]["id"];
type MainTab = "effectif" | "buteurs" | "passeurs";

function buildRows(): PlayerRow[] {
  const statsByPlayer = new Map(playerStats.map((s) => [s.playerId, s]));
  const teamById = new Map(teams.map((t) => [t.id, t]));

  return players
    .map((player) => {
      const team = teamById.get(player.teamId);
      if (!team) return null;
      const stats = statsByPlayer.get(player.id);
      return {
        player,
        team,
        goals: stats?.goals ?? 0,
        assists: stats?.assists ?? 0,
        appearances: stats?.appearances ?? 0,
      };
    })
    .filter((row): row is PlayerRow => row != null)
    .sort((a, b) => {
      const byTeam = a.team.name.localeCompare(b.team.name, "fr");
      if (byTeam !== 0) return byTeam;
      return a.player.lastName.localeCompare(b.player.lastName, "fr");
    });
}

const ALL_ROWS = buildRows();
const TEAMS_SORTED = [...teams].sort((a, b) => a.name.localeCompare(b.name, "fr"));

export function PlayersFilters() {
  const [tab, setTab] = useState<MainTab>("effectif");
  const [position, setPosition] = useState<PosFilter>("all");
  const [teamId, setTeamId] = useState<string>("all");

  const filtered = useMemo(() => {
    return ALL_ROWS.filter(({ player }) => {
      if (position !== "all" && player.position !== position) return false;
      if (teamId !== "all" && player.teamId !== teamId) return false;
      return true;
    });
  }, [position, teamId]);

  const scorers = useMemo(
    () =>
      [...ALL_ROWS]
        .filter((r) => r.goals > 0)
        .sort((a, b) => b.goals - a.goals || b.assists - a.assists),
    []
  );

  const assistsLeaders = useMemo(
    () =>
      [...ALL_ROWS]
        .filter((r) => r.assists > 0)
        .sort((a, b) => b.assists - a.assists || b.goals - a.goals),
    []
  );

  const selectedTeam = TEAMS_SORTED.find((t) => t.id === teamId);

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Vues joueurs"
        className="inline-flex h-auto flex-wrap gap-1 rounded-lg bg-muted/80 p-1"
      >
        {(
          [
            { id: "effectif", label: `Effectif (${ALL_ROWS.length})` },
            { id: "buteurs", label: "Buteurs" },
            { id: "passeurs", label: "Passeurs" },
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

      {tab === "effectif" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Poste
            </p>
            <div className="flex flex-wrap gap-1.5">
              {POSITIONS.map((pos) => {
                const count =
                  pos.id === "all"
                    ? ALL_ROWS.length
                    : ALL_ROWS.filter((r) => r.player.position === pos.id).length;
                return (
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
                    <span className="ml-1 opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Équipe
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setTeamId("all")}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition",
                  teamId === "all"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                Toutes
              </button>
              {TEAMS_SORTED.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setTeamId(team.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium transition",
                    teamId === team.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <TeamBadge team={team} size="sm" />
                  {team.shortName}
                </button>
              ))}
            </div>
            {selectedTeam && (
              <p className="text-sm text-muted-foreground">
                Filtre actif :{" "}
                <span className="font-medium text-foreground">{selectedTeam.name}</span>
              </p>
            )}
          </div>

          <p className="text-sm font-medium">
            {filtered.length} joueur{filtered.length > 1 ? "s" : ""}
            {position !== "all"
              ? ` · ${POSITIONS.find((p) => p.id === position)?.label}`
              : ""}
            {selectedTeam ? ` · ${selectedTeam.shortName}` : ""}
          </p>

          <PlayersTable key={`${teamId}-${position}`} rows={filtered} />
        </div>
      )}

      {tab === "buteurs" &&
        (scorers.length === 0 ? (
          <EmptyStats message="Aucun buteur enregistré pour l’instant. Les buts apparaîtront ici dès que les stats joueurs seront saisies." />
        ) : (
          <LeaderTable rows={scorers} mode="goals" />
        ))}

      {tab === "passeurs" &&
        (assistsLeaders.length === 0 ? (
          <EmptyStats message="Aucune passe décisive enregistrée pour l’instant." />
        ) : (
          <LeaderTable rows={assistsLeaders} mode="assists" />
        ))}
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

function PlayersTable({ rows }: { rows: PlayerRow[] }) {
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
          {rows.map(({ player, team, goals, assists, appearances }, index) => (
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
                {goals}
              </TableCell>
              <TableCell
                className={cn(
                  "text-center font-display tabular-nums",
                  mode === "assists" && "text-lg font-bold text-pitch"
                )}
              >
                {assists}
              </TableCell>
              <TableCell className="text-center tabular-nums">{appearances}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
