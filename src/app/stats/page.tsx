import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { TeamBadge } from "@/components/team-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMergedMatches } from "@/lib/live-results";
import {
  fmt1,
  fmtPct,
  getGlobalSeasonStats,
  type LeaderRow,
} from "@/lib/global-stats";
import { getTeam } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stats globales",
};

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card px-4 py-4 text-center shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-3xl font-extrabold tabular-nums",
          accent
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function LeaderBoard({
  title,
  rows,
  primaryLabel,
  secondaryLabel,
}: {
  title: string;
  rows: LeaderRow[];
  primaryLabel: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/70 px-4 py-3">
        <h3 className="font-display text-lg font-bold">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          Aucune donnée.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead className="text-center">{primaryLabel}</TableHead>
              {secondaryLabel && (
                <TableHead className="text-center">{secondaryLabel}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const team = row.teamId ? getTeam(row.teamId) : undefined;
              return (
                <TableRow key={`${title}-${row.id}`}>
                  <TableCell className="text-center font-display font-bold text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={row.href}
                      className="font-medium hover:text-primary"
                    >
                      {row.name}
                    </Link>
                    {team && (
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <TeamBadge team={team} size="sm" />
                        {team.shortName}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-display text-lg font-bold tabular-nums text-pitch">
                    {row.primary}
                  </TableCell>
                  {secondaryLabel && (
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {row.secondary ?? "—"}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default async function StatsGlobalesPage() {
  const allMatches = await getMergedMatches();
  const stats = getGlobalSeasonStats(allMatches, 5);
  const o = stats.overview;
  const maxPeriod = Math.max(...stats.periods.map((p) => p.goals), 1);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Saison"
        title="Stats globales"
        description={`Tous les critères issus des feuilles RBFA — ${o.finished} matchs terminés sur ${o.totalMatches}, ${o.teams} clubs, ${o.players} joueurs.`}
      />

      <Section
        title="Vue d’ensemble"
        description="Volumes et moyennes de la saison en cours."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <Kpi label="Matchs joués" value={o.finished} hint={`${o.scheduled} à venir`} />
          <Kpi label="Buts" value={o.goals} hint={`${fmt1(o.goalsPerMatch)} / match`} accent="text-pitch" />
          <Kpi label="Buts domicile" value={o.homeGoals} />
          <Kpi label="Buts extérieur" value={o.awayGoals} />
          <Kpi label="Jaunes" value={o.yellowCards} hint={`${fmt1(o.yellowPerMatch)} / match`} accent="text-draw" />
          <Kpi
            label="Rouges"
            value={o.redTotal}
            hint={`${o.redDirect} directs · ${o.secondYellows} 2e j.`}
            accent="text-loss"
          />
          <Kpi label="Pénaltys" value={o.penalties} />
          <Kpi label="CSC" value={o.ownGoals} />
          <Kpi label="Clean sheets" value={o.cleanSheets} hint="par équipe-match" />
          <Kpi label="0-0" value={o.goallessDraws} />
          <Kpi
            label="Victoires dom."
            value={o.homeWins}
            hint={fmtPct(o.homeWins, o.finished)}
          />
          <Kpi
            label="Nuls / Ext."
            value={`${o.draws} / ${o.awayWins}`}
            hint={`${fmtPct(o.draws, o.finished)} nuls · ${fmtPct(o.awayWins, o.finished)} ext.`}
          />
        </div>
      </Section>

      <Section title="Extrêmes" description="Matchs les plus marquants.">
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.extremes.highestScoring && (
            <Link
              href={stats.extremes.highestScoring.href}
              className="rounded-xl border border-border/80 bg-card px-5 py-5 shadow-sm transition hover:border-primary/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Plus de buts
              </p>
              <p className="mt-2 font-display text-2xl font-bold">
                {stats.extremes.highestScoring.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stats.extremes.highestScoring.total} buts au total
              </p>
            </Link>
          )}
          {stats.extremes.biggestWin && (
            <Link
              href={stats.extremes.biggestWin.href}
              className="rounded-xl border border-border/80 bg-card px-5 py-5 shadow-sm transition hover:border-primary/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Plus large victoire
              </p>
              <p className="mt-2 font-display text-2xl font-bold">
                {stats.extremes.biggestWin.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Écart de {stats.extremes.biggestWin.margin} buts
              </p>
            </Link>
          )}
        </div>
      </Section>

      <Section
        title="Buts par tranche de 15 min"
        description="Répartition de tous les buts (hors tirs au but)."
      >
        <div className="space-y-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm sm:p-5">
          {stats.periods.map((p) => (
            <div key={p.id} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3">
              <p className="text-sm text-muted-foreground">{p.label}</p>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-pitch"
                  style={{ width: `${(100 * p.goals) / maxPeriod}%` }}
                />
              </div>
              <p className="text-right font-display font-bold tabular-nums">
                {p.goals}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Scores les plus fréquents"
        description="Écart affiché du plus grand au plus petit (ex. 2-1)."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.scorelines.map((s) => (
            <div
              key={s.score}
              className="rounded-xl border border-border/80 bg-card px-4 py-4 text-center shadow-sm"
            >
              <p className="font-display text-2xl font-extrabold tabular-nums">
                {s.score}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.count} fois
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Joueurs"
        description="Leaders individuels — voir aussi /joueurs."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <LeaderBoard
            title="Buteurs"
            rows={stats.players.scorers}
            primaryLabel="Buts"
            secondaryLabel="Passes"
          />
          <LeaderBoard
            title="Passeurs"
            rows={stats.players.assists}
            primaryLabel="Passes"
            secondaryLabel="Buts"
          />
          <LeaderBoard
            title="Temps de jeu"
            rows={stats.players.minutes}
            primaryLabel="Min"
            secondaryLabel="MJ"
          />
          <LeaderBoard
            title="Cartons jaunes"
            rows={stats.players.yellows}
            primaryLabel="Jaunes"
            secondaryLabel="Rouges"
          />
          <LeaderBoard
            title="Expulsions"
            rows={stats.players.reds}
            primaryLabel="Rouges"
            secondaryLabel="2e j."
          />
        </div>
        <p className="text-sm text-muted-foreground">
          <Link href="/joueurs" className="hover:text-primary">
            Classements joueurs complets →
          </Link>
        </p>
      </Section>

      <Section title="Clubs" description="Extrêmes collectifs — voir aussi /equipes.">
        <div className="grid gap-4 lg:grid-cols-2">
          <LeaderBoard
            title="Meilleure attaque"
            rows={stats.clubs.attack}
            primaryLabel="BP"
            secondaryLabel="BC"
          />
          <LeaderBoard
            title="Meilleure défense"
            rows={stats.clubs.defense}
            primaryLabel="BC"
            secondaryLabel="CS"
          />
          <LeaderBoard
            title="Points"
            rows={stats.clubs.points}
            primaryLabel="Pts"
            secondaryLabel="Diff"
          />
          <LeaderBoard
            title="Clean sheets"
            rows={stats.clubs.cleanSheets}
            primaryLabel="CS"
            secondaryLabel="MJ"
          />
          <LeaderBoard
            title="Cartons jaunes"
            rows={stats.clubs.yellows}
            primaryLabel="Jaunes"
            secondaryLabel="Rouges"
          />
          <LeaderBoard
            title="Cartons rouges"
            rows={stats.clubs.reds}
            primaryLabel="Rouges"
            secondaryLabel="Jaunes"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          <Link href="/equipes" className="hover:text-primary">
            Fiches clubs →
          </Link>
          {" · "}
          <Link href="/classement" className="hover:text-primary">
            Classement →
          </Link>
        </p>
      </Section>

      <Section
        title="Arbitres"
        description="Centraux les plus sollicités et les plus sévères."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <LeaderBoard
            title="Plus de matchs"
            rows={stats.referees.busiest}
            primaryLabel="Matchs"
            secondaryLabel="Jaunes"
          />
          <LeaderBoard
            title="Moyenne jaunes / match"
            rows={stats.referees.yellowAvg}
            primaryLabel="Moy."
            secondaryLabel="Matchs"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          <Link href="/arbitres" className="hover:text-primary">
            Stats arbitres →
          </Link>
        </p>
      </Section>
    </div>
  );
}
