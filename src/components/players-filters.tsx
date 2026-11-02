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
import { players, teams } from "@/data/championship";
import type { Player, PlayerSeasonStats, Team } from "@/data/types";
import { playerDisplayName, positionLabel } from "@/lib/stats";
import { cn } from "@/lib/utils";

type PlayerRow = {
  player: Player;
  team: Team;
  goals: number;
  assists: number;
  appearances: number;
  starts: number;
  minutes: number;
  yellowCards: number;
  secondYellows: number;
  redCards: number;
};

const POSITIONS = [
  { id: "all", label: "Tous" },
  { id: "GB", label: "Gardiens" },
  { id: "DEF", label: "Défenseurs" },
  { id: "MIL", label: "Milieux" },
  { id: "ATT", label: "Attaquants" },
] as const;

type PosFilter = (typeof POSITIONS)[number]["id"];
type MainTab = "effectif" | "buteurs" | "passeurs" | "temps" | "cartons";

function avgMinutes(row: PlayerRow) {
  return row.appearances > 0 ? row.minutes / row.appearances : 0;
}

function fmtAvg(n: number) {
  return n.toLocaleString("fr-BE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function buildRows(seasonStats: PlayerSeasonStats[]): PlayerRow[] {
  const statsByPlayer = new Map(seasonStats.map((s) => [s.playerId, s]));
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
        starts: stats?.starts ?? 0,
        minutes: stats?.minutes ?? 0,
        yellowCards: stats?.yellowCards ?? 0,
        secondYellows: stats?.secondYellows ?? 0,
        redCards: stats?.redCards ?? 0,
      };
    })
    .filter((row): row is PlayerRow => row != null)
    .sort((a, b) => {
      const byTeam = a.team.name.localeCompare(b.team.name, "fr");
      if (byTeam !== 0) return byTeam;
      return a.player.lastName.localeCompare(b.player.lastName, "fr");
    });
}

const TEAMS_SORTED = [...teams].sort((a, b) => a.name.localeCompare(b.name, "fr"));

export function PlayersFilters({
  seasonStats,
}: {
  seasonStats: PlayerSeasonStats[];
}) {
  const [tab, setTab] = useState<MainTab>("buteurs");
  const [position, setPosition] = useState<PosFilter>("all");
  const [teamId, setTeamId] = useState<string>("all");

  const allRows = useMemo(() => buildRows(seasonStats), [seasonStats]);

  const filtered = useMemo(() => {
    return allRows.filter(({ player }) => {
      if (position !== "all" && player.position !== position) return false;
      if (teamId !== "all" && player.teamId !== teamId) return false;
      return true;
    });
  }, [allRows, position, teamId]);

  const scorers = useMemo(
    () =>
      [...allRows]
        .filter((r) => r.goals > 0)
        .sort((a, b) => b.goals - a.goals || b.assists - a.assists),
    [allRows]
  );

  const assistsLeaders = useMemo(
    () =>
      [...allRows]
        .filter((r) => r.assists > 0)
        .sort((a, b) => b.assists - a.assists || b.goals - a.goals),
    [allRows]
  );

  const minutesLeaders = useMemo(
    () =>
      [...allRows]
        .filter((r) => r.minutes > 0)
        .sort(
          (a, b) =>
            b.minutes - a.minutes ||
            b.appearances - a.appearances ||
            a.player.lastName.localeCompare(b.player.lastName, "fr")
        ),
    [allRows]
  );

  const cardsLeaders = useMemo(
    () =>
      [...allRows]
        .filter((r) => r.yellowCards > 0 || r.redCards > 0)
        .sort(
          (a, b) =>
            b.yellowCards - a.yellowCards ||
            b.redCards - a.redCards ||
            b.secondYellows - a.secondYellows ||
            a.player.lastName.localeCompare(b.player.lastName, "fr")
        ),
    [allRows]
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
            { id: "buteurs", label: `Buteurs (${scorers.length})` },
            { id: "passeurs", label: `Passeurs (${assistsLeaders.length})` },
            { id: "temps", label: `Temps de jeu (${minutesLeaders.length})` },
            { id: "cartons", label: `Cartons (${cardsLeaders.length})` },
            { id: "effectif", label: `Effectif (${allRows.length})` },
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
                    ? allRows.length
                    : allRows.filter((r) => r.player.position === pos.id).length;
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

      {tab === "temps" &&
        (minutesLeaders.length === 0 ? (
          <EmptyStats message="Aucun temps de jeu calculé pour l’instant." />
        ) : (
          <MinutesTable rows={minutesLeaders} />
        ))}

      {tab === "cartons" &&
        (cardsLeaders.length === 0 ? (
          <EmptyStats message="Aucun carton enregistré pour l’instant." />
        ) : (
          <CardsTable rows={cardsLeaders} />
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
            <TableHead className="text-center">Min</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const { player, team, goals, assists, appearances, minutes } = row;
            return (
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
                <TableCell className="text-center tabular-nums">
                  {appearances}
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {minutes}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function MinutesTable({ rows }: { rows: PlayerRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Joueur</TableHead>
            <TableHead>Équipe</TableHead>
            <TableHead className="text-center">MJ</TableHead>
            <TableHead className="text-center">Tit.</TableHead>
            <TableHead className="text-center">Min</TableHead>
            <TableHead className="text-center">Moy./match</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const { player, team, appearances, starts, minutes } = row;
            return (
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
                  <p className="text-xs text-muted-foreground">
                    {positionLabel(player.position)}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TeamBadge team={team} size="sm" />
                    <span className="text-sm">{team.shortName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {appearances}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {starts}
                </TableCell>
                <TableCell className="text-center font-display text-lg font-bold tabular-nums text-pitch">
                  {minutes}
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {fmtAvg(avgMinutes(row))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function CardsTable({ rows }: { rows: PlayerRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Joueur</TableHead>
            <TableHead>Équipe</TableHead>
            <TableHead className="text-center">Jaunes</TableHead>
            <TableHead className="text-center">2e j.</TableHead>
            <TableHead className="text-center">Rouges</TableHead>
            <TableHead className="text-center">MJ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const {
              player,
              team,
              yellowCards,
              secondYellows,
              redCards,
              appearances,
            } = row;
            const directReds = Math.max(0, redCards - secondYellows);
            return (
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
                  <p className="text-xs text-muted-foreground">
                    {positionLabel(player.position)}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TeamBadge team={team} size="sm" />
                    <span className="text-sm">{team.shortName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-display text-lg font-bold tabular-nums text-draw">
                  {yellowCards}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {secondYellows}
                </TableCell>
                <TableCell className="text-center font-display tabular-nums text-loss">
                  {directReds}
                </TableCell>
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {appearances}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
