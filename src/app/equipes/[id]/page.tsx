import Link from "next/link";
import { notFound } from "next/navigation";
import { FormDots } from "@/components/form-dots";
import { MatchRow } from "@/components/match-row";
import { PageHeader } from "@/components/page-header";
import { TeamBadge } from "@/components/team-badge";
import { teams } from "@/data/championship";
import { getMergedMatches } from "@/lib/live-results";
import {
  computeStandings,
  getPlayerStats,
  getTeam,
  getTeamMatches,
  getTeamPlayers,
  playerDisplayName,
  positionLabel,
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
                {team.city} · Fondé en {team.founded}
              </p>
              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                {team.name}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                {team.stadium} · Entraîneur : {team.coach}
              </p>
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

      <section className="animate-rise-delay-1 grid gap-4 sm:grid-cols-2">
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

      <section className="animate-rise-delay-2 space-y-4">
        <PageHeader title="Effectif" description="Joueurs suivis pour cette équipe." />
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
          <ul className="divide-y divide-border/70">
            {squad.map((player) => {
              const stats = getPlayerStats(player.id, allMatches);
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
                        {player.nationality ? ` · ${player.nationality}` : ""}
                        {player.age > 0 ? ` · ${player.age} ans` : ""}
                      </p>
                    </div>
                    <div className="hidden text-right text-sm sm:block">
                      <p className="font-display text-lg font-bold tabular-nums">
                        {stats?.goals ?? 0} B · {stats?.assists ?? 0} P
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats?.appearances ?? 0} matchs
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold">Matchs</h2>
        <div className="space-y-2">
          {teamMatches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </div>
      </section>
    </div>
  );
}
