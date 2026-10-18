import Link from "next/link";
import { notFound } from "next/navigation";
import { StatBar } from "@/components/stat-bar";
import { TeamBadge } from "@/components/team-badge";
import { Badge } from "@/components/ui/badge";
import { matches } from "@/data/championship";
import { eventLabel, getMergedMatch, summarizeCards } from "@/lib/live-results";
import {
  formatLongDate,
  getPlayer,
  getTeam,
  playerDisplayName,
} from "@/lib/stats";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return matches.map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const match = await getMergedMatch(id);
  if (!match) return { title: "Match" };
  const home = getTeam(match.homeTeamId);
  const away = getTeam(match.awayTeamId);
  return {
    title: `${home?.shortName} vs ${away?.shortName} — J${match.matchday}`,
  };
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMergedMatch(id);
  if (!match) notFound();

  const home = getTeam(match.homeTeamId)!;
  const away = getTeam(match.awayTeamId)!;
  const played = match.status === "finished";
  const cards = summarizeCards(match.events);

  return (
    <div className="space-y-10">
      <section className="animate-rise overflow-hidden rounded-2xl bg-pitch-deep text-white shadow-lg">
        <div className="pitch-stripe px-4 py-10 sm:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-center text-xs uppercase tracking-[0.18em] text-white/60">
            <span>Journée {match.matchday}</span>
            <span>·</span>
            <span>{formatLongDate(match.date)}</span>
            <span>·</span>
            <span>{match.kickoff}</span>
            <Badge
              className={
                played
                  ? "bg-white/15 text-white"
                  : "bg-score text-pitch-deep"
              }
            >
              {played ? "Terminé" : match.status === "live" ? "En direct" : "Programmé"}
            </Badge>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
            <Link
              href={`/equipes/${home.id}`}
              className="flex flex-col items-center gap-3 text-center transition hover:opacity-90"
            >
              <TeamBadge team={home} size="lg" />
              <span className="font-display text-xl font-bold sm:text-2xl">{home.name}</span>
              <span className="text-xs text-white/55">Domicile</span>
            </Link>

            <div className="text-center">
              {played || match.status === "live" ? (
                <p className="animate-score-pop font-display text-5xl font-extrabold tabular-nums tracking-wide sm:text-6xl">
                  {match.homeScore ?? 0}
                  <span className="mx-2 text-score">–</span>
                  {match.awayScore ?? 0}
                </p>
              ) : (
                <p className="font-display text-3xl font-bold text-white/70">vs</p>
              )}
            </div>

            <Link
              href={`/equipes/${away.id}`}
              className="flex flex-col items-center gap-3 text-center transition hover:opacity-90"
            >
              <TeamBadge team={away} size="lg" />
              <span className="font-display text-xl font-bold sm:text-2xl">{away.name}</span>
              <span className="text-xs text-white/55">Extérieur</span>
            </Link>
          </div>

          <p className="mt-8 text-center text-sm text-white/60">
            {match.stadium}
            {match.attendance != null && (
              <> · {match.attendance.toLocaleString("fr-FR")} spectateurs</>
            )}
          </p>
        </div>
      </section>

      {match.events.length > 0 && (
        <section className="animate-rise-delay-1 space-y-4">
          <h2 className="font-display text-2xl font-bold">Temps forts</h2>
          <ol className="space-y-2 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            {match.events.map((event, index) => {
              const player = event.playerId ? getPlayer(event.playerId) : undefined;
              const assist = event.assistId ? getPlayer(event.assistId) : undefined;
              const isHome = event.teamId === home.id;
              return (
                <li
                  key={event.id ?? `${event.minute}-${index}`}
                  className="flex items-start gap-3 border-b border-border/50 py-2 last:border-0"
                >
                  <span className="w-10 shrink-0 font-display text-lg font-bold tabular-nums text-pitch">
                    {event.minute}&apos;
                  </span>
                  <div className={`flex-1 ${isHome ? "" : "text-right"}`}>
                    <p className="font-medium">
                      {eventLabel(event.type)}
                      {player && (
                        <>
                          {" · "}
                          <Link
                            href={`/joueurs/${player.id}`}
                            className="hover:text-primary"
                          >
                            {playerDisplayName(player)}
                          </Link>
                        </>
                      )}
                    </p>
                    {assist && (
                      <p className="text-sm text-muted-foreground">
                        Passe :{" "}
                        <Link href={`/joueurs/${assist.id}`} className="hover:text-primary">
                          {playerDisplayName(assist)}
                        </Link>
                      </p>
                    )}
                    {event.type === "second_yellow" && (
                      <p className="text-xs text-loss">Expulsion pour 2e carton jaune</p>
                    )}
                    {event.type === "red" && (
                      <p className="text-xs text-loss">Expulsion — rouge direct</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {(cards.yellowCards > 0 || cards.redCards > 0) && (
            <p className="text-sm text-muted-foreground">
              Cartons : {cards.yellowCards} jaune{cards.yellowCards > 1 ? "s" : ""} ·{" "}
              {cards.redCards} rouge{cards.redCards > 1 ? "s" : ""}
              {cards.redFromSecondYellow > 0 &&
                ` (dont ${cards.redFromSecondYellow} via 2e jaune)`}
              {cards.redDirect > 0 &&
                ` (dont ${cards.redDirect} direct${cards.redDirect > 1 ? "s" : ""})`}
            </p>
          )}
        </section>
      )}

      {match.stats && (
        <section className="animate-rise-delay-2 space-y-6">
          <h2 className="font-display text-2xl font-bold">Statistiques du match</h2>
          <div className="space-y-5 rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-2 flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <TeamBadge team={home} size="sm" />
                {home.shortName}
              </span>
              <span className="flex items-center gap-2">
                {away.shortName}
                <TeamBadge team={away} size="sm" />
              </span>
            </div>
            <StatBar label="Possession" home={match.stats.possession[0]} away={match.stats.possession[1]} suffix="%" />
            <StatBar label="Tirs" home={match.stats.shots[0]} away={match.stats.shots[1]} />
            <StatBar label="Tirs cadrés" home={match.stats.shotsOnTarget[0]} away={match.stats.shotsOnTarget[1]} />
            <StatBar label="Corners" home={match.stats.corners[0]} away={match.stats.corners[1]} />
            <StatBar label="Fautes" home={match.stats.fouls[0]} away={match.stats.fouls[1]} />
            <StatBar label="Cartons jaunes" home={match.stats.yellowCards[0]} away={match.stats.yellowCards[1]} />
            <StatBar label="Cartons rouges" home={match.stats.redCards[0]} away={match.stats.redCards[1]} />
            <StatBar label="Passes" home={match.stats.passes[0]} away={match.stats.passes[1]} />
            <StatBar label="Précision passes" home={match.stats.passAccuracy[0]} away={match.stats.passAccuracy[1]} suffix="%" />
          </div>
        </section>
      )}

      {!played && match.status !== "live" && (
        <p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-muted-foreground">
          Match à venir — encodez le résultat dans{" "}
          <Link href="/admin" className="underline">
            l&apos;admin
          </Link>
          .
        </p>
      )}
    </div>
  );
}
