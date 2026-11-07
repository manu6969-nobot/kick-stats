import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TeamBadge } from "@/components/team-badge";
import { players } from "@/data/championship";
import { getMergedMatches } from "@/lib/live-results";
import { listPlayerGoals } from "@/lib/live-results-shared";
import {
  formatDate,
  formatGoalsPerMatch,
  getBaseMatch,
  getPlayer,
  getPlayerStats,
  getTeam,
  playerDisplayName,
  positionLabel,
} from "@/lib/stats";
import type { Metadata } from "next";


export const revalidate = 60;
export function generateStaticParams() {
  const params = players.map((p) => ({ id: p.id }));
  // Cache Components exige au moins un résultat même sans joueurs encore saisis.
  return params.length > 0 ? params : [{ id: "_" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const player = getPlayer(id);
  return { title: player ? playerDisplayName(player) : "Joueur" };
}

export default async function JoueurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = getPlayer(id);
  if (!player) notFound();

  const team = getTeam(player.teamId)!;
  const allMatches = await getMergedMatches();
  const stats = getPlayerStats(player.id, allMatches);

  const secondYellows = stats?.secondYellows ?? 0;
  const redDirect = Math.max(0, (stats?.redCards ?? 0) - secondYellows);
  const assists = stats?.assists ?? 0;
  const appearances = stats?.appearances ?? 0;
  const minutes = stats?.minutes ?? 0;
  const goals = stats?.goals ?? 0;
  const avgMinutes =
    appearances > 0 ? Math.round(minutes / appearances) : 0;
  const goalsPerMatch = formatGoalsPerMatch(goals, appearances);
  const avgGoalMinute = stats?.avgGoalMinute;
  const goalLog = listPlayerGoals(player.id, allMatches);
  const cards: { label: string; value: string | number }[] = [
    { label: "Matchs", value: appearances },
    { label: "Titulaire", value: stats?.starts ?? 0 },
    { label: "Entrées", value: stats?.subsIn ?? 0 },
    { label: "Sorties", value: stats?.subsOut ?? 0 },
    { label: "Minutes", value: minutes },
    { label: "Moy. min", value: avgMinutes },
    { label: "Buts", value: goals },
    { label: "Buts/match", value: goalsPerMatch },
    ...(avgGoalMinute != null
      ? [{ label: "Minute moy.", value: `${avgGoalMinute}′` }]
      : []),
    ...(assists > 0 ? [{ label: "Passes D.", value: assists }] : []),
    { label: "Jaunes", value: stats?.yellowCards ?? 0 },
    { label: "2e jaunes", value: secondYellows },
    { label: "Rouges directs", value: redDirect },
  ];

  return (
    <div className="space-y-10">
      <div className="animate-rise flex flex-col gap-6 rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary font-display text-3xl font-bold text-primary-foreground">
            {player.number}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pitch">
              {positionLabel(player.position)}
            </p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              {playerDisplayName(player)}
            </h1>
            <Link
              href={`/equipes/${team.id}`}
              className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <TeamBadge team={team} size="sm" />
              {team.name}
            </Link>
          </div>
        </div>
        {player.age > 0 && (
          <div className="text-sm sm:text-right">
            <p className="text-muted-foreground">Âge</p>
            <p className="font-semibold">{player.age} ans</p>
          </div>
        )}
      </div>

      <section className="animate-rise-delay-1">
        <PageHeader
          title="Saison en cours"
          description="Temps de jeu et buts issus des feuilles RBFA (compositions + temps forts)."
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border/80 bg-card px-3 py-4 text-center shadow-sm sm:px-4 sm:py-5"
            >
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs">
                {card.label}
              </p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums text-pitch sm:text-3xl">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {goalLog.length > 0 && (
        <section className="animate-rise-delay-2">
          <PageHeader
            title="Quand il marque"
            description={
              avgGoalMinute != null
                ? `Minute moyenne ${avgGoalMinute}′ · ${goalsPerMatch} but${goals > 1 ? "s" : ""} / match`
                : "Minutes des buts issus des temps forts."
            }
          />
          <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
            {goalLog.map((g, i) => {
              const match = getBaseMatch(g.matchId);
              const home = match ? getTeam(match.homeTeamId) : null;
              const away = match ? getTeam(match.awayTeamId) : null;
              const label =
                home && away
                  ? `${home.shortName} – ${away.shortName}`
                  : g.matchId;
              return (
                <li
                  key={`${g.matchId}-${g.minute}-${i}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/matchs/${g.matchId}`}
                      className="font-medium hover:text-primary"
                    >
                      {label}
                    </Link>
                    {match && (
                      <p className="text-xs text-muted-foreground">
                        {formatDate(match.date)}
                        {g.detail ? ` · ${g.detail}` : ""}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-display text-lg font-bold tabular-nums text-pitch">
                    {g.minute}′
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
