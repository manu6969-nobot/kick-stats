import Link from "next/link";
import { TeamBadge } from "@/components/team-badge";
import type { MatchAppearance, MatchEvent, Player, Team } from "@/data/types";
import { getPlayer, playerDisplayName } from "@/lib/stats";

function subMinute(
  events: MatchEvent[],
  playerId: string,
  type: "sub_in" | "sub_out"
) {
  const ev = events.find((e) => e.type === type && e.playerId === playerId);
  return ev ? Number(ev.minute) || undefined : undefined;
}

function sortApps(apps: MatchAppearance[]) {
  return [...apps].sort((a, b) => {
    const pa = getPlayer(a.playerId);
    const pb = getPlayer(b.playerId);
    const na = pa?.number ?? 999;
    const nb = pb?.number ?? 999;
    if (na !== nb) return na - nb;
    return a.playerId.localeCompare(b.playerId);
  });
}

function PlayerRow({
  app,
  events,
}: {
  app: MatchAppearance;
  events: MatchEvent[];
}) {
  const player: Player | undefined = getPlayer(app.playerId);
  const enteredAt = !app.started
    ? subMinute(events, app.playerId, "sub_in")
    : undefined;
  const leftAt = subMinute(events, app.playerId, "sub_out");
  const label = player ? playerDisplayName(player) : app.playerId;
  const meta: string[] = [];
  if (enteredAt != null) meta.push(`Entrée ${enteredAt}′`);
  if (leftAt != null) meta.push(`Sortie ${leftAt}′`);

  return (
    <li className="flex items-center gap-2 py-1.5 text-sm">
      <span className="w-6 shrink-0 text-center font-display text-xs font-bold tabular-nums text-muted-foreground">
        {player?.number ?? "—"}
      </span>
      <div className="min-w-0 flex-1">
        {player ? (
          <Link
            href={`/joueurs/${player.id}`}
            className="block truncate font-medium hover:text-primary"
          >
            {label}
          </Link>
        ) : (
          <span className="block truncate font-medium">{label}</span>
        )}
        {meta.length > 0 && (
          <p className="text-[11px] text-muted-foreground">{meta.join(" · ")}</p>
        )}
      </div>
      <span className="w-9 shrink-0 text-right font-display text-xs font-semibold tabular-nums text-muted-foreground">
        {app.minutes}′
      </span>
    </li>
  );
}

function TeamLineup({
  team,
  apps,
  events,
  sideLabel,
}: {
  team: Team;
  apps: MatchAppearance[];
  events: MatchEvent[];
  sideLabel: string;
}) {
  const starters = sortApps(apps.filter((a) => a.started));
  const bench = sortApps(apps.filter((a) => !a.started));

  return (
    <div className="rounded-xl border border-border/80 bg-card p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-2">
        <TeamBadge team={team} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold">{team.name}</p>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {sideLabel}
          </p>
        </div>
      </div>

      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Titulaires
      </p>
      <ul className="divide-y divide-border/50">
        {starters.map((app) => (
          <PlayerRow key={app.playerId} app={app} events={events} />
        ))}
      </ul>

      {bench.length > 0 && (
        <>
          <p className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Remplaçants
          </p>
          <ul className="divide-y divide-border/50">
            {bench.map((app) => (
              <PlayerRow key={app.playerId} app={app} events={events} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function MatchLineups({
  home,
  away,
  appearances,
  events,
}: {
  home: Team;
  away: Team;
  appearances: MatchAppearance[];
  events: MatchEvent[];
}) {
  const homeApps = appearances.filter((a) => a.teamId === home.id);
  const awayApps = appearances.filter((a) => a.teamId === away.id);
  if (!homeApps.length && !awayApps.length) return null;

  return (
    <section className="animate-rise-delay-1 space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold">Compositions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Feuilles de match — buts et cartons dans les temps forts ci-dessous.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TeamLineup
          team={home}
          apps={homeApps}
          events={events}
          sideLabel="Domicile"
        />
        <TeamLineup
          team={away}
          apps={awayApps}
          events={events}
          sideLabel="Extérieur"
        />
      </div>
    </section>
  );
}
