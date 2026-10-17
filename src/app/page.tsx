import Link from "next/link";
import { ArrowRight, CalendarDays, Trophy, Users } from "lucide-react";
import { MatchRow } from "@/components/match-row";
import { StandingsTable } from "@/components/standings-table";
import { TeamBadge } from "@/components/team-badge";
import { buttonVariants } from "@/components/ui/button";
import { meta, players, teams } from "@/data/championship";
import { getMergedMatches } from "@/lib/live-results";
import {
  computeStandings,
  getLatestResults,
  getMatchdays,
  getTopScorers,
  getUpcomingFixtures,
  playerDisplayName,
} from "@/lib/stats";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const allMatches = getMergedMatches();
  const standings = computeStandings(allMatches);
  const results = getLatestResults(4, allMatches);
  const upcoming = getUpcomingFixtures(8, allMatches);
  const scorers = getTopScorers(5, allMatches);
  const matchdayCount = getMatchdays(allMatches).length;

  return (
    <div className="space-y-12">
      <section className="relative -mx-4 overflow-hidden sm:-mx-6">
        <div className="pitch-stripe relative mx-auto max-w-6xl overflow-hidden bg-pitch-deep px-4 py-14 text-white sm:rounded-2xl sm:px-8 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 20%, rgba(212,160,23,0.35), transparent 40%), radial-gradient(circle at 20% 80%, rgba(26,92,69,0.5), transparent 45%)",
            }}
          />
          <div className="relative z-10 max-w-xl animate-rise">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-score">
              Saison {meta.season}
            </p>
            <h1 className="mt-3 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
              {meta.name}
            </h1>
            <p className="mt-4 max-w-md text-base text-white/75 sm:text-lg">
              {meta.tagline}. {teams.length} équipes · {matchdayCount} journées ·{" "}
              {allMatches.length} matchs au calendrier.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/classement"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-score text-pitch-deep hover:bg-score/90"
                )}
              >
                Voir le classement
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/calendrier"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                )}
              >
                Calendrier
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="animate-rise-delay-1 grid gap-4 sm:grid-cols-3">
        {[
          {
            href: "/classement",
            icon: Trophy,
            title: "Classement",
            text: `${standings.length} clubs · points, forme et stats domicile/extérieur`,
          },
          {
            href: "/calendrier",
            icon: CalendarDays,
            title: "Calendrier",
            text: `${matchdayCount} journées · ${allMatches.length} rencontres officielles`,
          },
          {
            href: "/joueurs",
            icon: Users,
            title: "Stats joueurs",
            text:
              players.length > 0
                ? "Buteurs, passeurs et fiches individuelles"
                : "Ajoutez vos joueurs dans championship.ts",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-border/80 bg-card p-5 transition hover:border-primary/35 hover:shadow-md"
          >
            <item.icon className="size-5 text-pitch transition group-hover:scale-110" />
            <h2 className="mt-3 font-display text-xl font-bold">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section className="animate-rise-delay-2 space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold">Classement</h2>
            <Link
              href="/classement"
              className="text-sm font-medium text-pitch hover:underline"
            >
              Tableau complet
            </Link>
          </div>
          <StandingsTable rows={standings} compact />
        </section>

        <section className="animate-rise-delay-3 space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold">Meilleurs buteurs</h2>
            <Link
              href="/joueurs"
              className="text-sm font-medium text-pitch hover:underline"
            >
              Tous les joueurs
            </Link>
          </div>
          {scorers.length === 0 || scorers.every((s) => s.stats.goals === 0) ? (
            <p className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              Les buteurs apparaîtront dès l&apos;encodage des buts dans{" "}
              <Link href="/admin" className="underline">
                l&apos;admin
              </Link>
              .
            </p>
          ) : (
            <ol className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
              {scorers
                .filter((s) => s.stats.goals > 0)
                .map(({ player, team, stats }, index) => (
                  <li key={player.id}>
                    <Link
                      href={`/joueurs/${player.id}`}
                      className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0 hover:bg-muted/50"
                    >
                      <span className="w-5 font-display text-lg font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <TeamBadge team={team} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {playerDisplayName(player)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {team.name}
                        </p>
                      </div>
                      <span className="font-display text-xl font-bold tabular-nums text-pitch">
                        {stats.goals}
                      </span>
                    </Link>
                  </li>
                ))}
            </ol>
          )}
        </section>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold">Derniers résultats</h2>
          {results.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              Saison pas encore commencée — les scores apparaîtront ici.
            </p>
          ) : (
            <div className="space-y-2">
              {results.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))}
            </div>
          )}
        </section>
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold">Prochains matchs</h2>
            <Link
              href="/calendrier"
              className="text-sm font-medium text-pitch hover:underline"
            >
              Calendrier complet
            </Link>
          </div>
          <div className="space-y-2">
            {upcoming.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
