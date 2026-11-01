import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchRow } from "@/components/match-row";
import { PageHeader } from "@/components/page-header";
import { getMergedMatches } from "@/lib/live-results";
import {
  getRefereeById,
  officialDisplayName,
  roleLabel,
} from "@/lib/referees";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [{ id: "_" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const allMatches = await getMergedMatches();
  const ref = getRefereeById(id, allMatches);
  return { title: ref ? officialDisplayName(ref) : "Arbitre" };
}

function fmtAvg(n: number) {
  return n.toLocaleString("fr-BE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export default async function ArbitrePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const allMatches = await getMergedMatches();
  const ref = getRefereeById(id, allMatches);
  if (!ref) notFound();

  const matchById = new Map(allMatches.map((m) => [m.id, m]));
  const centralMatches = ref.matches
    .filter((m) => m.role === "referee")
    .map((m) => matchById.get(m.matchId))
    .filter((m): m is NonNullable<typeof m> => m != null)
    .sort((a, b) => b.date.localeCompare(a.date) || b.kickoff.localeCompare(a.kickoff));

  const assistantMatches = ref.matches
    .filter((m) => m.role !== "referee")
    .map((m) => ({
      match: matchById.get(m.matchId),
      role: m.role,
    }))
    .filter((x): x is { match: NonNullable<typeof x.match>; role: typeof x.role } => x.match != null)
    .sort(
      (a, b) =>
        b.match.date.localeCompare(a.match.date) ||
        b.match.kickoff.localeCompare(a.match.kickoff)
    );

  const cards = [
    { label: "Matchs (central)", value: ref.matchesAsReferee },
    { label: "Jaunes", value: ref.yellowCards },
    { label: "2e jaunes", value: ref.secondYellows },
    { label: "Rouges directs", value: ref.redCards },
    { label: "Moy. jaunes/match", value: fmtAvg(ref.avgYellowPerMatch) },
    { label: "Buts dans ses matchs", value: ref.goals },
  ];

  return (
    <div className="space-y-10">
      <div className="animate-rise overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="bg-pitch-deep px-6 py-8 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
            Officiel RBFA
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            {officialDisplayName(ref)}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {ref.matchesAsReferee} match{ref.matchesAsReferee > 1 ? "s" : ""} en
            central
            {ref.matchesAsAssistant > 0
              ? ` · ${ref.matchesAsAssistant} comme assistant`
              : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border/70 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
          {cards.map((c) => (
            <div key={c.label} className="px-4 py-5 text-center">
              <p className="font-display text-2xl font-extrabold tabular-nums sm:text-3xl">
                {c.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {centralMatches.length > 0 && (
        <section className="space-y-4">
          <PageHeader
            title="Matchs dirigés"
            description="Feuilles où cet officiel était arbitre central."
          />
          <div className="space-y-2">
            {centralMatches.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {assistantMatches.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold">Comme assistant</h2>
          <ul className="space-y-2">
            {assistantMatches.map(({ match, role }) => (
              <li key={`${match.id}-${role}`} className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {roleLabel(role)}
                </p>
                <MatchRow match={match} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-muted-foreground">
        <Link href="/arbitres" className="hover:text-primary">
          ← Tous les arbitres
        </Link>
      </p>
    </div>
  );
}
