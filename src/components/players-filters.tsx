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
import {
  formatGoalsPerMatch,
  playerDisplayName,
  positionLabel,
} from "@/lib/stats";
import { cn } from "@/lib/utils";

type PlayerRow = {
  player: Player;
  team: Team;
  goals: number;
  assists: number;
  appearances: number;
  starts: number;
  subsIn: number;
  subsOut: number;
  minutes: number;
  yellowCards: number;
  secondYellows: number;
  redCards: number;
  avgGoalMinute?: number;
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

/** Limite initiale du DOM sur mobile / listes longues. */
const PAGE_SIZE = 40;

/** Moyenne de minutes / match, arrondie à l’entier. */
function avgMinutesRounded(row: PlayerRow) {
  if (row.appearances <= 0) return 0;
  return Math.round(row.minutes / row.appearances);
}

function buildRows(seasonStats: PlayerSeasonStats[]): PlayerRow[] {
  const statsByPlayer = new Map(seasonStats.map((s) => [s.playerId, s]));
  const teamById = new Map(teams.map((t) => [t.id, t]));

  const rows: PlayerRow[] = [];
  for (const player of players) {
    const team = teamById.get(player.teamId);
    if (!team) continue;
    const stats = statsByPlayer.get(player.id);
    const row: PlayerRow = {
      player,
      team,
      goals: stats?.goals ?? 0,
      assists: stats?.assists ?? 0,
      appearances: stats?.appearances ?? 0,
      starts: stats?.starts ?? 0,
      subsIn: stats?.subsIn ?? 0,
      subsOut: stats?.subsOut ?? 0,
      minutes: stats?.minutes ?? 0,
      yellowCards: stats?.yellowCards ?? 0,
      secondYellows: stats?.secondYellows ?? 0,
      redCards: stats?.redCards ?? 0,
    };
    if (stats?.avgGoalMinute != null) row.avgGoalMinute = stats.avgGoalMinute;
    rows.push(row);
  }
  return rows.sort((a, b) => {
    const byTeam = a.team.name.localeCompare(b.team.name, "fr");
    if (byTeam !== 0) return byTeam;
    return a.player.lastName.localeCompare(b.player.lastName, "fr");
  });
}

const TEAMS_SORTED = [...teams].sort((a, b) => a.name.localeCompare(b.name, "fr"));

function usePagedRows<T>(rows: T[]) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const visible = rows.slice(0, limit);
  const remaining = rows.length - visible.length;
  const showMore =
    remaining > 0 ? (
      <div className="flex justify-center pt-3">
        <button
          type="button"
          onClick={() => setLimit((n) => n + PAGE_SIZE)}
          className="min-h-11 rounded-md border border-border/80 bg-card px-4 text-sm font-medium text-foreground transition hover:border-primary/40"
        >
          Voir plus ({remaining} restant{remaining > 1 ? "s" : ""})
        </button>
      </div>
    ) : null;
  return { visible, showMore };
}

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
  const showAssists = assistsLeaders.length > 0;
  const activeTab =
    tab === "passeurs" && !showAssists ? "buteurs" : tab;

  const tabs = (
    [
      { id: "buteurs" as const, label: `Buteurs (${scorers.length})` },
      ...(showAssists
        ? [
            {
              id: "passeurs" as const,
              label: `Passeurs (${assistsLeaders.length})`,
            },
          ]
        : []),
      { id: "temps" as const, label: `Temps de jeu (${minutesLeaders.length})` },
      { id: "cartons" as const, label: `Cartons (${cardsLeaders.length})` },
      { id: "effectif" as const, label: `Effectif (${allRows.length})` },
    ] as const
  );

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Vues joueurs"
        className="scroll-fade-x scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:rounded-lg sm:bg-muted/80 sm:p-1 sm:px-1"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activeTab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "min-h-11 shrink-0 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition sm:min-h-0 sm:py-1.5",
              activeTab === item.id
                ? "bg-primary text-primary-foreground shadow-sm sm:bg-background sm:text-foreground"
                : "bg-muted/80 text-muted-foreground hover:text-foreground sm:bg-transparent"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeTab === "effectif" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Poste
            </p>
            <div className="scroll-fade-x scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
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
                      "min-h-11 shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition sm:min-h-0",
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
            <div className="scroll-fade-x scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              <button
                type="button"
                onClick={() => setTeamId("all")}
                className={cn(
                  "min-h-11 shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium transition sm:min-h-0",
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
                    "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium transition sm:min-h-0",
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

      {activeTab === "buteurs" &&
        (scorers.length === 0 ? (
          <EmptyStats message="Aucun buteur enregistré pour l’instant. Les buts apparaîtront ici dès que les stats joueurs seront saisies." />
        ) : (
          <LeaderTable rows={scorers} mode="goals" showAssists={showAssists} />
        ))}

      {activeTab === "passeurs" && showAssists && (
        <LeaderTable
          rows={assistsLeaders}
          mode="assists"
          showAssists={showAssists}
        />
      )}

      {activeTab === "temps" &&
        (minutesLeaders.length === 0 ? (
          <EmptyStats message="Aucun temps de jeu calculé pour l’instant." />
        ) : (
          <MinutesTable rows={minutesLeaders} />
        ))}

      {activeTab === "cartons" &&
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
  const { visible, showMore } = usePagedRows(rows);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        Aucun joueur ne correspond à ces filtres.
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center">N°</TableHead>
              <TableHead>Joueur</TableHead>
              <TableHead>Équipe</TableHead>
              <TableHead className="hidden sm:table-cell">Poste</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map(({ player, team }) => (
              <TableRow key={player.id} className="content-auto">
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
                  <p className="text-xs text-muted-foreground sm:hidden">
                    {positionLabel(player.position)}
                  </p>
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
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {positionLabel(player.position)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {showMore}
    </div>
  );
}

function LeaderTable({
  rows,
  mode,
  showAssists,
}: {
  rows: PlayerRow[];
  mode: "goals" | "assists";
  showAssists: boolean;
}) {
  const { visible, showMore } = usePagedRows(rows);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Joueur</TableHead>
              <TableHead className="hidden sm:table-cell">Équipe</TableHead>
              <TableHead className="text-center">Buts</TableHead>
              {mode === "goals" && (
                <>
                  <TableHead
                    className="text-center"
                    title="Buts par match joué"
                  >
                    Moy.
                  </TableHead>
                  <TableHead
                    className="hidden text-center sm:table-cell"
                    title="Minute moyenne à laquelle le joueur marque"
                  >
                    Quand
                  </TableHead>
                </>
              )}
              {showAssists && (
                <TableHead className="hidden text-center sm:table-cell">
                  Passes
                </TableHead>
              )}
              <TableHead className="hidden text-center md:table-cell">MJ</TableHead>
              <TableHead className="hidden text-center md:table-cell">Min</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row, index) => {
              const {
                player,
                team,
                goals,
                assists,
                appearances,
                minutes,
                avgGoalMinute,
              } = row;
              const goalsAvg = formatGoalsPerMatch(goals, appearances);
              return (
                <TableRow key={player.id} className="content-auto">
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
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
                      <TeamBadge team={team} size="sm" />
                      {team.shortName}
                      {mode === "goals" && goals > 0
                        ? ` · moy. ${goalsAvg}${
                            avgGoalMinute != null ? ` · ~${avgGoalMinute}′` : ""
                          }`
                        : ""}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
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
                  {mode === "goals" && (
                    <>
                      <TableCell className="text-center font-display tabular-nums text-muted-foreground">
                        {goalsAvg}
                      </TableCell>
                      <TableCell className="hidden text-center font-display tabular-nums text-muted-foreground sm:table-cell">
                        {avgGoalMinute != null ? `${avgGoalMinute}′` : "—"}
                      </TableCell>
                    </>
                  )}
                  {showAssists && (
                    <TableCell
                      className={cn(
                        "hidden text-center font-display tabular-nums sm:table-cell",
                        mode === "assists" && "text-lg font-bold text-pitch"
                      )}
                    >
                      {assists}
                    </TableCell>
                  )}
                  <TableCell className="hidden text-center tabular-nums md:table-cell">
                    {appearances}
                  </TableCell>
                  <TableCell className="hidden text-center tabular-nums text-muted-foreground md:table-cell">
                    {minutes}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {showMore}
    </div>
  );
}

function MinutesTable({ rows }: { rows: PlayerRow[] }) {
  const { visible, showMore } = usePagedRows(rows);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Joueur</TableHead>
              <TableHead className="hidden sm:table-cell">Équipe</TableHead>
              <TableHead className="hidden text-center md:table-cell">MJ</TableHead>
              <TableHead className="hidden text-center md:table-cell">Tit.</TableHead>
              <TableHead className="hidden text-center sm:table-cell">
                Entrées
              </TableHead>
              <TableHead className="hidden text-center sm:table-cell">
                Sorties
              </TableHead>
              <TableHead className="text-center">Min</TableHead>
              <TableHead className="text-center">Moy.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row, index) => {
              const {
                player,
                team,
                appearances,
                starts,
                subsIn,
                subsOut,
                minutes,
              } = row;
              const avg = avgMinutesRounded(row);
              return (
                <TableRow key={player.id} className="content-auto">
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
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
                      <TeamBadge team={team} size="sm" />
                      {team.shortName} · {appearances} MJ
                      {subsIn > 0 || subsOut > 0
                        ? ` · +${subsIn}/−${subsOut}`
                        : ""}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <TeamBadge team={team} size="sm" />
                      <span className="text-sm">{team.shortName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-center tabular-nums md:table-cell">
                    {appearances}
                  </TableCell>
                  <TableCell className="hidden text-center tabular-nums md:table-cell">
                    {starts}
                  </TableCell>
                  <TableCell className="hidden text-center tabular-nums text-[#1a9e3f] sm:table-cell">
                    {subsIn}
                  </TableCell>
                  <TableCell className="hidden text-center tabular-nums text-loss sm:table-cell">
                    {subsOut}
                  </TableCell>
                  <TableCell className="text-center font-display text-lg font-bold tabular-nums text-pitch">
                    {minutes}
                  </TableCell>
                  <TableCell className="text-center font-display tabular-nums text-muted-foreground">
                    {avg}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {showMore}
    </div>
  );
}

function CardsTable({ rows }: { rows: PlayerRow[] }) {
  const { visible, showMore } = usePagedRows(rows);

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Joueur</TableHead>
              <TableHead className="hidden sm:table-cell">Équipe</TableHead>
              <TableHead className="text-center">Jaunes</TableHead>
              <TableHead className="hidden text-center sm:table-cell">2e j.</TableHead>
              <TableHead className="text-center">Rouges</TableHead>
              <TableHead className="hidden text-center md:table-cell">MJ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row, index) => {
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
                <TableRow key={player.id} className="content-auto">
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
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
                      <TeamBadge team={team} size="sm" />
                      {team.shortName}
                      {secondYellows > 0 ? ` · ${secondYellows} 2e j.` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <TeamBadge team={team} size="sm" />
                      <span className="text-sm">{team.shortName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-display text-lg font-bold tabular-nums text-draw">
                    {yellowCards}
                  </TableCell>
                  <TableCell className="hidden text-center tabular-nums sm:table-cell">
                    {secondYellows}
                  </TableCell>
                  <TableCell className="text-center font-display tabular-nums text-loss">
                    {directReds}
                  </TableCell>
                  <TableCell className="hidden text-center tabular-nums text-muted-foreground md:table-cell">
                    {appearances}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {showMore}
    </div>
  );
}
