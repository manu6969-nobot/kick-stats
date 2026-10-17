import type { LiveMatchResult, Match, MatchEvent, PlayerSeasonStats } from "@/data/types";

/** Entrée « vide » laissée par un ancien Effacer — on l’ignore. */
export function isEmptyLiveResult(live?: LiveMatchResult | null): boolean {
  if (!live) return true;
  if (live.status === "scheduled" && live.homeScore == null && live.awayScore == null) {
    return (live.events?.length ?? 0) === 0;
  }
  return false;
}

export function applyLiveResult(base: Match, live?: LiveMatchResult): Match {
  if (!live || isEmptyLiveResult(live)) return base;

  // Anciennes saisies admin : score présent mais statut resté « programmé »
  let status = live.status;
  if (
    status === "scheduled" &&
    live.homeScore != null &&
    live.awayScore != null
  ) {
    status = "finished";
  }

  return {
    ...base,
    status,
    homeScore: live.homeScore ?? undefined,
    awayScore: live.awayScore ?? undefined,
    events: live.events ?? [],
  };
}

export function summarizeCards(events: MatchEvent[]) {
  let yellowShown = 0;
  let redDirect = 0;
  let redFromSecondYellow = 0;

  const sorted = [...events].sort((a, b) => a.minute - b.minute);
  for (const ev of sorted) {
    if (ev.type === "yellow") yellowShown += 1;
    else if (ev.type === "second_yellow") {
      yellowShown += 1;
      redFromSecondYellow += 1;
    } else if (ev.type === "red") {
      redDirect += 1;
    }
  }

  return {
    yellowCards: yellowShown,
    redCards: redDirect + redFromSecondYellow,
    redDirect,
    redFromSecondYellow,
  };
}

/**
 * Si on ajoute un jaune à un joueur qui en a déjà un (sans expulsion),
 * conversion automatique en second_yellow (2 jaunes = rouge).
 */
export function normalizeCardEvent(
  events: MatchEvent[],
  incoming: MatchEvent
): MatchEvent {
  if (incoming.type !== "yellow" || !incoming.playerId) return incoming;

  const priorYellows = events.filter(
    (e) =>
      e.playerId === incoming.playerId &&
      (e.type === "yellow" || e.type === "second_yellow")
  ).length;
  const alreadySentOff = events.some(
    (e) =>
      e.playerId === incoming.playerId &&
      (e.type === "red" || e.type === "second_yellow")
  );

  if (priorYellows >= 1 && !alreadySentOff) {
    return {
      ...incoming,
      type: "second_yellow",
      detail: incoming.detail ?? "2e carton jaune = rouge",
    };
  }
  return incoming;
}

export function scoreFromGoals(
  events: MatchEvent[],
  homeTeamId: string,
  awayTeamId: string
) {
  let home = 0;
  let away = 0;
  for (const ev of events) {
    if (ev.type === "goal") {
      if (ev.teamId === homeTeamId) home += 1;
      else if (ev.teamId === awayTeamId) away += 1;
    } else if (ev.type === "own_goal") {
      if (ev.teamId === homeTeamId) away += 1;
      else if (ev.teamId === awayTeamId) home += 1;
    }
  }
  return { homeScore: home, awayScore: away };
}

export function computePlayerStatsFromMatches(
  allMatches: Match[]
): PlayerSeasonStats[] {
  const map = new Map<string, PlayerSeasonStats>();

  const ensure = (playerId: string) => {
    let row = map.get(playerId);
    if (!row) {
      row = {
        playerId,
        appearances: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        minutes: 0,
      };
      map.set(playerId, row);
    }
    return row;
  };

  for (const match of allMatches) {
    if (match.status !== "finished" && match.status !== "live") continue;
    const involved = new Set<string>();
    for (const ev of match.events) {
      if (ev.playerId) involved.add(ev.playerId);
      if (ev.assistId) involved.add(ev.assistId);
    }
    for (const pid of involved) {
      const row = ensure(pid);
      row.appearances += 1;
      row.minutes += 90;
    }
    for (const ev of match.events) {
      if (ev.type === "goal" && ev.playerId) ensure(ev.playerId).goals += 1;
      if (ev.assistId) ensure(ev.assistId).assists += 1;
      if (ev.type === "yellow" && ev.playerId) ensure(ev.playerId).yellowCards += 1;
      if (ev.type === "second_yellow" && ev.playerId) {
        ensure(ev.playerId).yellowCards += 1;
        ensure(ev.playerId).redCards += 1;
      }
      if (ev.type === "red" && ev.playerId) ensure(ev.playerId).redCards += 1;
    }
  }

  return [...map.values()];
}

export function eventLabel(type: MatchEvent["type"]): string {
  switch (type) {
    case "goal":
      return "But";
    case "own_goal":
      return "CSC";
    case "yellow":
      return "Carton jaune";
    case "second_yellow":
      return "2e jaune (rouge)";
    case "red":
      return "Carton rouge (direct)";
    case "sub":
      return "Remplacement";
    default:
      return type;
  }
}
