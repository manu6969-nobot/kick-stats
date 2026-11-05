import type { Match, PlayerId } from "@/data/types";
import {
  getMatchesByMatchday,
  getMatchdays,
  getPlayer,
  getTeam,
  playerDisplayName,
} from "@/lib/stats";

export type MatchdayStatus = "live" | "ongoing" | "upcoming" | "done";

export type LiveMatchday = {
  day: number;
  status: MatchdayStatus;
  matches: Match[];
  finishedCount: number;
  totalCount: number;
  label: string;
};

export type MatchdayScorer = {
  playerId: PlayerId;
  goals: number;
  name: string;
  teamId: string;
  teamShort: string;
};

function statusLabel(status: MatchdayStatus, day: number): string {
  switch (status) {
    case "live":
      return `Journée ${day} · en direct`;
    case "ongoing":
      return `Journée ${day} · en cours`;
    case "upcoming":
      return `Prochaine · journée ${day}`;
    case "done":
      return `Dernière · journée ${day}`;
  }
}

/** Journée à mettre en avant sur l’accueil. */
export function getLiveMatchday(allMatches: Match[]): LiveMatchday | null {
  const days = getMatchdays(allMatches);
  if (!days.length) return null;

  const pack = (day: number, status: MatchdayStatus): LiveMatchday => {
    const matches = getMatchesByMatchday(day, allMatches);
    const finishedCount = matches.filter((m) => m.status === "finished").length;
    return {
      day,
      status,
      matches,
      finishedCount,
      totalCount: matches.length,
      label: statusLabel(status, day),
    };
  };

  for (const day of days) {
    const matches = getMatchesByMatchday(day, allMatches);
    if (matches.some((m) => m.status === "live")) return pack(day, "live");
  }

  for (const day of days) {
    const matches = getMatchesByMatchday(day, allMatches);
    const finished = matches.some((m) => m.status === "finished");
    const open = matches.some(
      (m) => m.status === "scheduled" || m.status === "live"
    );
    if (finished && open) return pack(day, "ongoing");
  }

  // Entre deux journées : préférer la dernière jouée (scores + buteur)
  // plutôt qu’une prochaine journée encore vide.
  for (const day of [...days].reverse()) {
    const matches = getMatchesByMatchday(day, allMatches);
    if (
      matches.length > 0 &&
      matches.every((m) => m.status === "finished")
    ) {
      return pack(day, "done");
    }
  }

  for (const day of days) {
    const matches = getMatchesByMatchday(day, allMatches);
    if (
      matches.length > 0 &&
      matches.every((m) => m.status === "scheduled")
    ) {
      return pack(day, "upcoming");
    }
  }

  return null;
}

/**
 * Résultats du week-end = matchs terminés de la journée mise en avant
 * (ou de la dernière journée 100 % jouée).
 */
export function getWeekendResults(
  allMatches: Match[],
  live: LiveMatchday | null
): Match[] {
  if (live) {
    const finished = live.matches.filter((m) => m.status === "finished");
    if (finished.length) return finished;
  }

  const days = getMatchdays(allMatches);
  for (const day of [...days].reverse()) {
    const matches = getMatchesByMatchday(day, allMatches);
    const finished = matches.filter((m) => m.status === "finished");
    if (finished.length) return finished;
  }
  return [];
}

/** Meilleur buteur sur une journée (hors CSC). */
export function getMatchdayTopScorer(
  day: number,
  allMatches: Match[]
): MatchdayScorer | null {
  const matches = getMatchesByMatchday(day, allMatches);
  const goals = new Map<PlayerId, { goals: number; teamId: string }>();

  for (const match of matches) {
    for (const ev of match.events ?? []) {
      if (ev.type !== "goal" || !ev.playerId) continue;
      const cur = goals.get(ev.playerId) ?? { goals: 0, teamId: ev.teamId };
      cur.goals += 1;
      cur.teamId = ev.teamId;
      goals.set(ev.playerId, cur);
    }
  }

  let best: MatchdayScorer | null = null;
  for (const [playerId, { goals: n, teamId }] of goals) {
    const player = getPlayer(playerId);
    const team = getTeam(teamId);
    if (!player || !team) continue;
    const row: MatchdayScorer = {
      playerId,
      goals: n,
      name: playerDisplayName(player),
      teamId,
      teamShort: team.shortName,
    };
    if (
      !best ||
      row.goals > best.goals ||
      (row.goals === best.goals && row.name.localeCompare(best.name, "fr") < 0)
    ) {
      best = row;
    }
  }
  return best;
}
