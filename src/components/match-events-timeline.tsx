import Link from "next/link";
import { MatchEventIcon } from "@/components/match-event-icon";
import { TeamBadge } from "@/components/team-badge";
import type { MatchEvent, Team } from "@/data/types";
import { eventLabel } from "@/lib/live-results-shared";
import { getPlayer, playerDisplayName } from "@/lib/stats";
import { cn } from "@/lib/utils";

function isPenaltyEvent(event: MatchEvent) {
  const detail = event.detail?.toLowerCase() ?? "";
  return detail.includes("penalty") || detail.includes("pénal");
}

function eventPlayerName(event: MatchEvent) {
  const player = event.playerId ? getPlayer(event.playerId) : undefined;
  if (player) return { player, label: playerDisplayName(player) };
  if (event.detail) {
    return {
      player: undefined,
      label: event.detail.replace(/^penalty\s*[·•-]?\s*/i, "").trim(),
    };
  }
  return { player: undefined, label: eventLabel(event.type) };
}

function EventSide({
  event,
  align,
}: {
  event: MatchEvent;
  align: "home" | "away";
}) {
  const penalty = isPenaltyEvent(event);
  const { player, label } = eventPlayerName(event);
  const assist = event.assistId ? getPlayer(event.assistId) : undefined;
  const isHome = align === "home";

  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-2",
        isHome ? "justify-end text-right" : "justify-start text-left"
      )}
    >
      {isHome && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium sm:text-[15px]">
            {player ? (
              <Link href={`/joueurs/${player.id}`} className="hover:text-primary">
                {label}
              </Link>
            ) : (
              label
            )}
          </p>
          <p className="text-[11px] text-muted-foreground sm:text-xs">
            {eventLabel(event.type)}
            {penalty ? " (P)" : ""}
            {assist ? ` · Passe ${playerDisplayName(assist)}` : ""}
          </p>
        </div>
      )}
      <MatchEventIcon type={event.type} penalty={penalty} className="mt-0.5" />
      {!isHome && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium sm:text-[15px]">
            {player ? (
              <Link href={`/joueurs/${player.id}`} className="hover:text-primary">
                {label}
              </Link>
            ) : (
              label
            )}
          </p>
          <p className="text-[11px] text-muted-foreground sm:text-xs">
            {eventLabel(event.type)}
            {penalty ? " (P)" : ""}
            {assist ? ` · Passe ${playerDisplayName(assist)}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}

export function MatchEventsTimeline({
  events,
  home,
  away,
}: {
  events: MatchEvent[];
  home: Team;
  away: Team;
}) {
  const sorted = [...events].sort((a, b) => a.minute - b.minute);

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border/70 bg-muted/40 px-3 py-3 sm:gap-4 sm:px-5">
        <div className="flex items-center justify-end gap-2">
          <span className="hidden font-display text-sm font-bold sm:inline">
            {home.name}
          </span>
          <span className="font-display text-sm font-bold sm:hidden">
            {home.shortName}
          </span>
          <TeamBadge team={home} size="sm" />
        </div>
        <span className="w-12 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Min
        </span>
        <div className="flex items-center justify-start gap-2">
          <TeamBadge team={away} size="sm" />
          <span className="hidden font-display text-sm font-bold sm:inline">
            {away.name}
          </span>
          <span className="font-display text-sm font-bold sm:hidden">
            {away.shortName}
          </span>
        </div>
      </div>

      <ol>
        {sorted.map((event, index) => {
          const isHome = event.teamId === home.id;
          return (
            <li
              key={event.id ?? `${event.minute}-${event.type}-${index}`}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border/50 px-3 py-2.5 last:border-0 sm:gap-4 sm:px-5"
            >
              <div className="min-w-0">
                {isHome ? <EventSide event={event} align="home" /> : null}
              </div>
              <span className="w-12 shrink-0 text-center font-display text-base font-bold tabular-nums text-pitch">
                {event.minute}&apos;
              </span>
              <div className="min-w-0">
                {!isHome ? <EventSide event={event} align="away" /> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
