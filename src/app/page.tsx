import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MatchRow } from "@/components/match-row";
import { StandingsTable } from "@/components/standings-table";
import { TeamBadge } from "@/components/team-badge";
import { buttonVariants } from "@/components/ui/button";
import { meta, teams } from "@/data/championship";
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

const DESTINATIONS = [
  {
    href: "/classement",
    label: "Classement",
    text: "Points, différence et forme",
  },
  {
    href: "/calendrier",
    label: "Calendrier",
    text: "Résultats et prochaines journées",
  },
  {
    href: "/equipes",
    label: "Équipes",
    text: "Fiches clubs et bilans",
  },
  {
    href: "/joueurs",
    label: "Joueurs",
    text: "Buteurs, minutes et cartons",
  },
  {
    href: "/stats",
    label: "Stats",
    text: "Vue d’ensemble de la saison",
  },
] as const;

export default async function HomePage() {
  const allMatches = await getMergedMatches();
  const standings = computeStandings(allMatches);
  const results = getLatestResults(4, allMatches);
  const upcoming = getUpcomingFixtures(6, allMatches);
  const scorers = getTopScorers(5, allMatches).filter((s) => s.stats.goals > 0);
  const matchdayCount = getMatchdays(allMatches).length;
  const finishedCount = allMatches.filter((m) => m.status === "finished").length;

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Hero — composition unique, marque dominante */}
      <section className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 -mt-8 sm:-mt-10">
        <div className="pitch-stripe relative min-h-[min(72vh,36rem)] overflow-hidden bg-pitch-deep text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 70% 80% at 85% 20%, rgba(212,160,23,0.28), transparent 55%), radial-gradient(ellipse 60% 70% at 0% 100%, rgba(26,92,69,0.55), transparent 50%)",
            }}
          />
          <div className="relative z-10 mx-auto flex min-h-[min(72vh,36rem)] max-w-6xl flex-col justify-end px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24">
            <div className="animate-rise max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-score">
                Saison {meta.season}
              </p>
              <h1 className="mt-4 font-display text-6xl font-extrabold leading-[0.9] tracking-tight sm:text-7xl md:text-8xl">
                {meta.name}
              </h1>
              <p className="mt-5 max-w-lg text-base text-white/75 sm:text-lg">
                {meta.tagline}.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/classement"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "bg-score text-pitch-deep hover:bg-score/90"
                  )}
                >
                  Classement
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/calendrier"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  )}
                >
                  Calendrier
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation métier — pas une grille de cartes icônes */}
      <section className="animate-rise-delay-1" aria-label="Parcourir le site">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pitch">
              Navigation
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
              Explorer le championnat
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {teams.length} clubs · {matchdayCount} journées · {finishedCount}{" "}
            matchs joués
          </p>
        </div>
        <nav className="mt-8 divide-y divide-border/70 border-y border-border/70">
          {DESTINATIONS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between gap-4 py-4 transition hover:bg-pitch/[0.04]"
            >
              <div className="min-w-0">
                <p className="font-display text-xl font-bold tracking-tight text-foreground transition group-hover:text-pitch sm:text-2xl">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{item.text}</p>
              </div>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-pitch" />
            </Link>
          ))}
        </nav>
      </section>

      {/* Classement + buteurs */}
      <div className="animate-rise-delay-2 grid gap-12 lg:grid-cols-[1.45fr_1fr] lg:gap-14">
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pitch">
                Tableau
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
                Classement
              </h2>
            </div>
            <Link
              href="/classement"
              className="inline-flex items-center gap-1 text-sm font-medium text-pitch hover:underline"
            >
              Complet
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <StandingsTable rows={standings.slice(0, 8)} compact />
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pitch">
                Individuel
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
                Buteurs
              </h2>
            </div>
            <Link
              href="/joueurs"
              className="inline-flex items-center gap-1 text-sm font-medium text-pitch hover:underline"
            >
              Joueurs
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {scorers.length === 0 ? (
            <p className="border-y border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Les buteurs apparaîtront dès les premiers résultats encodés.
            </p>
          ) : (
            <ol className="divide-y divide-border/70 border-y border-border/70">
              {scorers.map(({ player, team, stats }, index) => (
                <li key={player.id}>
                  <Link
                    href={`/joueurs/${player.id}`}
                    className="flex items-center gap-3 py-3.5 transition hover:bg-pitch/[0.04]"
                  >
                    <span className="w-6 font-display text-lg font-bold tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <TeamBadge team={team} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {playerDisplayName(player)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {team.shortName}
                      </p>
                    </div>
                    <span className="font-display text-2xl font-bold tabular-nums text-pitch">
                      {stats.goals}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Résultats & prochaines rencontres */}
      <div className="animate-rise-delay-3 grid gap-12 lg:grid-cols-2 lg:gap-14">
        <section className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pitch">
              Récents
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
              Derniers résultats
            </h2>
          </div>
          {results.length === 0 ? (
            <p className="border-y border-dashed border-border py-10 text-center text-sm text-muted-foreground">
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

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pitch">
                À venir
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
                Prochains matchs
              </h2>
            </div>
            <Link
              href="/calendrier"
              className="inline-flex items-center gap-1 text-sm font-medium text-pitch hover:underline"
            >
              Calendrier
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="border-y border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Aucun match programmé pour le moment.
            </p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
