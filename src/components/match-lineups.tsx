import Link from "next/link";
import { MatchEventIcon } from "@/components/match-event-icon";
import { TeamBadge } from "@/components/team-badge";
import type { MatchAppearance, MatchEvent, Player, Team } from "@/data/types";
import { getPlayer, playerDisplayName } from "@/lib/stats";
import { cn } from "@/lib/utils";

function isPenaltyEvent(event: MatchEvent) {
  const detail = event.detail?.toLowerCase() ?? "";
  return detail.includes("penalty") || detail.includes("pénal");
}

function playerEvents(events: MatchEvent[], playerId: string) {
  return events
    .filter((e) => e.playerId === playerId)
    .filter(
      (e) =>
        e.type === "goal" ||
        e.type === "own_goal" ||
        e.type === "yellow" ||
        e.type === "second_yellow" ||
        e.type === "red" ||
        e.type === "sub_out"
    )
    .sort((a, b) => a.minute - b.minute);
}

function subInMinute(events: MatchEvent[], playerId: string) {
  const ev = events.find((e) => e.type === "sub_in" && e.playerId === playerId);
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
  const evs = playerEvents(events, app.playerId);
  const enteredAt = !app.started
    ? subInMinute(events, app.playerId)
    : undefined;
  const label = player ? playerDisplayName(player) : app.playerId;

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
        {enteredAt != null && (
          <p className="text-[11px] text-muted-foreground">Entrée {enteredAt}′</p>
        )}
      </div>
      <div className="flex max-w-[40%] shrink-0 flex-wrap items-center justify-end gap-1">
        {evs.map((ev, i) => (
          <span
            key={`${ev.id ?? ev.type}-${ev.minute}-${i}`}
            className="inline-flex items-center gap-0.5"
            title={`${ev.minute}′`}
          >
            <MatchEventIcon
              type={ev.type}
              penalty={isPenaltyEvent(ev)}
              className="scale-90"
            />
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {ev.minute}′
            </span>
          </span>
        ))}
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
  align,
}: {
  team: Team;
  apps: MatchAppearance[];
  events: MatchEvent[];
  align: "home" | "away";
}) {
  const starters = sortApps(apps.filter((a) => a.started));
  const bench = sortApps(apps.filter((a) => !a.started));

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-3 shadow-sm sm:p-4",
        align === "away" && "sm:text-left"
      )}
    >
      <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-2">
        <TeamBadge team={team} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold">{team.name}</p>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {align === "home" ? "Domicile" : "Extérieur"}
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
      <h2 className="font-display text-2xl font-bold">Compositions</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <TeamLineup
          team={home}
          apps={homeApps}
          events={events}
          align="home"
        />
        <TeamLineup
          team={away}
          apps={awayApps}
          events={events}
          align="away"
        />
      </div>
    </section>
  );
}
