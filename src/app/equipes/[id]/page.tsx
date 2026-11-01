import Link from "next/link";
import { notFound } from "next/navigation";
import { FormDots } from "@/components/form-dots";
import { MatchRow } from "@/components/match-row";
import { PageHeader } from "@/components/page-header";
import { TeamBadge } from "@/components/team-badge";
import { TeamCardsPanel } from "@/components/team-cards-panel";
import { TeamGoalsByPeriod } from "@/components/team-goals-by-period";
import { TeamGoalsDistribution } from "@/components/team-goals-distribution";
import { TeamVictoryHighlights } from "@/components/team-victory-highlights";
import { teams } from "@/data/championship";
import { getMergedMatches } from "@/lib/live-results";
import { getTeamDashboard } from "@/lib/team-dashboard";
import {
  getPlayer,
  getTeam,
  getTeamMatches,
  getTeamPlayers,
  getTeamSeasonStats,
  playerDisplayName,
  positionLabel,
  computeStandings,
} from "@/lib/stats";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return teams.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const team = getTeam(id);
  return { title: team?.name ?? "Équipe" };
}

export default async function EquipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = getTeam(id);
  if (!team) notFound();

  const allMatches = await getMergedMatches();
  const standings = computeStandings(allMatches);
  const row = standings.find((s) => s.teamId === id)!;
  const rank = standings.findIndex((s) => s.teamId === id) + 1;
  const squad = getTeamPlayers(id);
  const teamMatches = getTeamMatches(id, allMatches);
  const season = getTeamSeasonStats(id, allMatches, 10);
  const dashboard = getTeamDashboard(id, allMatches);
  const statsByPlayer = new Map(
    season.playerStats.map((s) => [s.playerId, s])
  );

  const rankedSquad = [...squad].sort((a, b) => {
    const sa = statsByPlayer.get(a.id);
    const sb = statsByPlayer.get(b.id);
    const ga = sa?.goals ?? 0;
    const gb = sb?.goals ?? 0;
    if (gb !== ga) return gb - ga;
    const aa = sa?.appearances ?? 0;
    const ab = sb?.appearances ?? 0;
    if (ab !== aa) return ab - aa;
    return a.number - b.number;
  });

  const finishedMatches = teamMatches.filter((m) => m.status === "finished");
  const upcomingMatches = teamMatches.filter((m) => m.status !== "finished");

  return (
    <div className="space-y-10">
      <div className="animate-rise overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div
          className="flex flex-col gap-4 px-6 py-8 text-white sm:flex-row sm:items-center sm:justify-between"
          style={{
            background: `linear-gradient(120deg, ${team.colors.primary}, ${team.colors.primary}dd 50%, #072419)`,
          }}
        >
          <div className="flex items-center gap-4">
            <TeamBadge team={team} size="lg" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                {team.city}
              </p>
              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                {team.name}
              </h1>
              <p className="mt-1 text-sm text-white/80">{team.stadium}</p>
            </div>
          </div>
          <div className="flex gap-6 rounded-xl bg-black/20 px-5 py-3 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-xs text-white/60">Rang</p>
              <p className="font-display text-3xl font-bold">{rank}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/60">Points</p>
              <p className="font-display text-3xl font-bold">{row.points}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/60">Forme</p>
              <div className="mt-1">
                <FormDots form={row.form} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-rise-delay-1 space-y-6">
        <TeamGoalsDistribution goals={dashboard.goals} />
        <TeamGoalsByPeriod periods={dashboard.periods} />
        <TeamCardsPanel
          yellow={dashboard.cards.yellow}
          red={dashboard.cards.red}
          played={dashboard.cards.played}
        />
        <TeamVictoryHighlights records={dashboard.records} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/80 bg-card p-5">
          <h2 className="font-display text-xl font-bold">À domicile</h2>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <dt className="text-muted-foreground">Joués</dt>
              <dd className="font-display text-2xl font-bold">{row.home.played}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">V / N / D</dt>
              <dd className="font-display text-2xl font-bold">
                {row.home.won}/{row.home.drawn}/{row.home.lost}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Buts</dt>
              <dd className="font-display text-2xl font-bold">
                {row.home.goalsFor}:{row.home.goalsAgainst}
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-border/80 bg-card p-5">
          <h2 className="font-display text-xl font-bold">À l&apos;extérieur</h2>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <dt className="text-muted-foreground">Joués</dt>
              <dd className="font-display text-2xl font-bold">{row.away.played}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">V / N / D</dt>
              <dd className="font-display text-2xl font-bold">
                {row.away.won}/{row.away.drawn}/{row.away.lost}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Buts</dt>
              <dd className="font-display text-2xl font-bold">
                {row.away.goalsFor}:{row.away.goalsAgainst}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {season.topScorers.length > 0 && (
        <section className="space-y-4">
          <PageHeader
            title="Buteurs du club"
            description="Buts issus des temps forts des matchs terminés."
          />
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
            <ol className="divide-y divide-border/70">
              {season.topScorers.slice(0, 10).map((scorer, index) => {
                const player = getPlayer(scorer.playerId);
                if (!player) return null;
                return (
                  <li key={scorer.playerId}>
                    <Link
                      href={`/joueurs/${player.id}`}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 sm:px-5"
                    >
                      <span className="w-6 text-center font-display text-sm font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">
                        {player.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{playerDisplayName(player)}</p>
                        <p className="text-xs text-muted-foreground">
                          {positionLabel(player.position)}
                          {scorer.appearances > 0
                            ? ` · vu dans ${scorer.appearances} feuille${scorer.appearances > 1 ? "s" : ""}`
                            : ""}
                        </p>
                      </div>
                      <p className="font-display text-2xl font-bold tabular-nums text-pitch">
                        {scorer.goals}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      <section className="animate-rise-delay-2 space-y-4">
        <PageHeader
          title="Effectif"
          description="Trié par buts puis apparitions dans les temps forts."
        />
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
          <ul className="divide-y divide-border/70">
            {rankedSquad.map((player) => {
              const stats = statsByPlayer.get(player.id);
              const goals = stats?.goals ?? 0;
              const apps = stats?.appearances ?? 0;
              const yellow = stats?.yellowCards ?? 0;
              const red = stats?.redCards ?? 0;
              return (
                <li key={player.id}>
                  <Link
                    href={`/joueurs/${player.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 sm:px-5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground">
                      {player.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{playerDisplayName(player)}</p>
                      <p className="text-xs text-muted-foreground">
                        {positionLabel(player.position)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-right text-sm">
                      <div className="hidden min-w-[4.5rem] sm:block">
                        <p className="font-display text-lg font-bold tabular-nums">
                          {goals} B
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {apps > 0 ? `${apps} feuille${apps > 1 ? "s" : ""}` : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 tabular-nums text-xs text-muted-foreground">
                          <span
                            className="inline-block h-3.5 w-2.5 rounded-[1px] bg-draw"
                            aria-hidden
                          />
                          {yellow}
                        </span>
                        <span className="inline-flex items-center gap-1 tabular-nums text-xs text-muted-foreground">
                          <span
                            className="inline-block h-3.5 w-2.5 rounded-[1px] bg-loss"
                            aria-hidden
                          />
                          {red}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold">Derniers résultats</h2>
        <div className="space-y-2">
          {[...finishedMatches].reverse().slice(0, 8).map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </div>
      </section>

      {upcomingMatches.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold">Prochains matchs</h2>
          <div className="space-y-2">
            {upcomingMatches.slice(0, 6).map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
