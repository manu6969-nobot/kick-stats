import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TeamBadge } from "@/components/team-badge";
import { players } from "@/data/championship";
import {
  getPlayer,
  getPlayerStats,
  getTeam,
  playerDisplayName,
  positionLabel,
} from "@/lib/stats";
import type { Metadata } from "next";

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
  const stats = getPlayerStats(player.id);

  const cards = [
    { label: "Matchs", value: stats?.appearances ?? 0 },
    { label: "Buts", value: stats?.goals ?? 0 },
    { label: "Passes D.", value: stats?.assists ?? 0 },
    { label: "Minutes", value: stats?.minutes ?? 0 },
    { label: "Jaunes", value: stats?.yellowCards ?? 0 },
    { label: "Rouges", value: stats?.redCards ?? 0 },
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
        <div className="grid grid-cols-2 gap-3 text-sm sm:text-right">
          <div>
            <p className="text-muted-foreground">Nationalité</p>
            <p className="font-semibold">{player.nationality}</p>
          </div>
          {player.age > 0 && (
            <div>
              <p className="text-muted-foreground">Âge</p>
              <p className="font-semibold">{player.age} ans</p>
            </div>
          )}
        </div>
      </div>

      <section className="animate-rise-delay-1">
        <PageHeader
          title="Saison en cours"
          description="Chiffres saisis manuellement — idéals pour coller à vos stats réelles."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border/80 bg-card px-4 py-5 text-center shadow-sm"
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-1 font-display text-3xl font-bold tabular-nums text-pitch">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
