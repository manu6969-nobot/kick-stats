import { matches as baseMatches, playerStats, players, teams } from "@/data/championship";
import type {
  Match,
  Player,
  PlayerSeasonStats,
  StandingRow,
  Team,
  TeamId,
} from "@/data/types";
import { computePlayerStatsFromMatches } from "@/lib/live-results-shared";

export function getTeam(id: TeamId): Team | undefined {
  return teams.find((t) => t.id === id);
}

export function getPlayer(id: string): Player | undefined {
  return players.find((p) => p.id === id);
}

export function getBaseMatch(id: string): Match | undefined {
  return baseMatches.find((m) => m.id === id);
}

export function getTeamPlayers(teamId: TeamId): Player[] {
  return players
    .filter((p) => p.teamId === teamId)
    .sort((a, b) => a.number - b.number);
}

export function getManualPlayerStats(playerId: string): PlayerSeasonStats | undefined {
  return playerStats.find((s) => s.playerId === playerId);
}

/** Stats manuelles + dérivées des événements de match. */
export function getPlayerStats(
  playerId: string,
  allMatches?: Match[]
): PlayerSeasonStats | undefined {
  const manual = getManualPlayerStats(playerId);
  if (!allMatches?.length) return manual;
  const derived = computePlayerStatsFromMatches(allMatches).find(
    (s) => s.playerId === playerId
  );
  if (!manual && !derived) return undefined;
  if (!manual) return derived;
  if (!derived) return manual;
  const goals = Math.max(manual.goals, derived.goals);
  return {
    playerId,
    appearances: Math.max(manual.appearances, derived.appearances),
    starts: Math.max(manual.starts ?? 0, derived.starts ?? 0),
    subsIn: Math.max(manual.subsIn ?? 0, derived.subsIn ?? 0),
    subsOut: Math.max(manual.subsOut ?? 0, derived.subsOut ?? 0),
    goals,
    assists: Math.max(manual.assists, derived.assists),
    yellowCards: Math.max(manual.yellowCards, derived.yellowCards),
    secondYellows: Math.max(manual.secondYellows ?? 0, derived.secondYellows ?? 0),
    redCards: Math.max(manual.redCards, derived.redCards),
    minutes: Math.max(manual.minutes, derived.minutes),
    avgGoalMinute:
      goals > 0
        ? (derived.avgGoalMinute ?? manual.avgGoalMinute)
        : undefined,
  };
}

/** Buts / match joué, 1 décimale (ex. 0,5). */
export function formatGoalsPerMatch(goals: number, appearances: number): string {
  if (appearances <= 0 || goals <= 0) return "—";
  return (goals / appearances).toLocaleString("fr-BE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${iso}T12:00:00`));
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

function emptyHomeAway() {
  return {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };
}

export function computeStandings(allMatches: Match[] = baseMatches): StandingRow[] {
  const map = new Map<TeamId, StandingRow>();

  for (const team of teams) {
    map.set(team.id, {
      teamId: team.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      form: [],
      home: emptyHomeAway(),
      away: emptyHomeAway(),
    });
  }

  const finished = allMatches
    .filter(
      (m) => m.status === "finished" && m.homeScore != null && m.awayScore != null
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.kickoff.localeCompare(b.kickoff));

  for (const match of finished) {
    const home = map.get(match.homeTeamId)!;
    const away = map.get(match.awayTeamId)!;
    const hs = match.homeScore!;
    const as = match.awayScore!;

    home.played += 1;
    away.played += 1;
    home.goalsFor += hs;
    home.goalsAgainst += as;
    away.goalsFor += as;
    away.goalsAgainst += hs;
    home.home.played += 1;
    home.home.goalsFor += hs;
    home.home.goalsAgainst += as;
    away.away.played += 1;
    away.away.goalsFor += as;
    away.away.goalsAgainst += hs;

    if (hs > as) {
      home.won += 1;
      home.points += 3;
      home.form.push("W");
      home.home.won += 1;
      away.lost += 1;
      away.form.push("L");
      away.away.lost += 1;
    } else if (hs < as) {
      away.won += 1;
      away.points += 3;
      away.form.push("W");
      away.away.won += 1;
      home.lost += 1;
      home.form.push("L");
      home.home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
      home.form.push("D");
      away.form.push("D");
      home.home.drawn += 1;
      away.away.drawn += 1;
    }
  }

  for (const row of map.values()) {
    row.goalDiff = row.goalsFor - row.goalsAgainst;
    row.form = row.form.slice(-5);
  }

  return [...map.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
}

export function getMatchdays(allMatches: Match[] = baseMatches): number[] {
  return [...new Set(allMatches.map((m) => m.matchday))].sort((a, b) => a - b);
}

export function getMatchesByMatchday(
  matchday: number,
  allMatches: Match[] = baseMatches
): Match[] {
  return allMatches
    .filter((m) => m.matchday === matchday)
    .sort((a, b) => a.date.localeCompare(b.date) || a.kickoff.localeCompare(b.kickoff));
}

export function getLatestResults(limit = 4, allMatches: Match[] = baseMatches): Match[] {
  return allMatches
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.date.localeCompare(a.date) || b.kickoff.localeCompare(a.kickoff))
    .slice(0, limit);
}

export function getUpcomingFixtures(limit = 4, allMatches: Match[] = baseMatches): Match[] {
  return allMatches
    .filter((m) => m.status === "scheduled" || m.status === "live")
    .sort((a, b) => a.date.localeCompare(b.date) || a.kickoff.localeCompare(b.kickoff))
    .slice(0, limit);
}

export function getTeamMatches(teamId: TeamId, allMatches: Match[] = baseMatches): Match[] {
  return allMatches
    .filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type TeamFormResult = "W" | "D" | "L";

export type TeamScorer = {
  playerId: string;
  goals: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
};

/** Stats saison pour la fiche club, dérivées des résultats / temps forts. */
export function getTeamSeasonStats(
  teamId: TeamId,
  allMatches: Match[] = baseMatches,
  formLength = 10
) {
  const finished = allMatches
    .filter(
      (m) =>
        (m.homeTeamId === teamId || m.awayTeamId === teamId) &&
        m.status === "finished" &&
        m.homeScore != null &&
        m.awayScore != null
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.kickoff.localeCompare(b.kickoff));

  let goalsFor = 0;
  let goalsAgainst = 0;
  let yellowCards = 0;
  let redCards = 0;
  let won = 0;
  let drawn = 0;
  let lost = 0;
  let cleanSheets = 0;
  let failedToScore = 0;
  let penalties = 0;
  const form: TeamFormResult[] = [];
  const scorerMap = new Map<string, TeamScorer>();

  const bumpScorer = (
    playerId: string,
    field: "goals" | "appearances" | "yellowCards" | "redCards"
  ) => {
    let row = scorerMap.get(playerId);
    if (!row) {
      row = {
        playerId,
        goals: 0,
        appearances: 0,
        yellowCards: 0,
        redCards: 0,
      };
      scorerMap.set(playerId, row);
    }
    row[field] += 1;
  };

  for (const match of finished) {
    const isHome = match.homeTeamId === teamId;
    const scored = isHome ? match.homeScore! : match.awayScore!;
    const conceded = isHome ? match.awayScore! : match.homeScore!;
    goalsFor += scored;
    goalsAgainst += conceded;

    if (scored > conceded) {
      form.push("W");
      won += 1;
    } else if (scored < conceded) {
      form.push("L");
      lost += 1;
    } else {
      form.push("D");
      drawn += 1;
    }

    if (conceded === 0) cleanSheets += 1;
    if (scored === 0) failedToScore += 1;

    const involved = new Set<string>();
    for (const ev of match.events ?? []) {
      if (ev.teamId !== teamId) continue;
      if (ev.playerId) involved.add(ev.playerId);

      if (ev.type === "yellow") {
        yellowCards += 1;
        if (ev.playerId) bumpScorer(ev.playerId, "yellowCards");
      } else if (ev.type === "second_yellow") {
        yellowCards += 1;
        redCards += 1;
        if (ev.playerId) {
          bumpScorer(ev.playerId, "yellowCards");
          bumpScorer(ev.playerId, "redCards");
        }
      } else if (ev.type === "red") {
        redCards += 1;
        if (ev.playerId) bumpScorer(ev.playerId, "redCards");
      } else if (ev.type === "goal" && ev.playerId) {
        bumpScorer(ev.playerId, "goals");
        const detail = ev.detail?.toLowerCase() ?? "";
        if (detail.includes("penalty") || detail.includes("pénal")) {
          penalties += 1;
        }
      }
    }
    for (const pid of involved) bumpScorer(pid, "appearances");
  }

  const points = won * 3 + drawn;
  const goalDiff = goalsFor - goalsAgainst;
  const topScorers = [...scorerMap.values()]
    .filter((s) => s.goals > 0)
    .sort(
      (a, b) =>
        b.goals - a.goals ||
        b.appearances - a.appearances ||
        a.playerId.localeCompare(b.playerId)
    );

  return {
    played: finished.length,
    won,
    drawn,
    lost,
    points,
    goalsFor,
    goalsAgainst,
    goalDiff,
    cleanSheets,
    failedToScore,
    penalties,
    yellowCards,
    redCards,
    goalsPerGame: finished.length ? goalsFor / finished.length : 0,
    concededPerGame: finished.length ? goalsAgainst / finished.length : 0,
    form: form.slice(-formLength),
    topScorers,
    playerStats: [...scorerMap.values()],
  };
}

/** Fusionne stats manuelles (championship) et stats dérivées des événements de match. */
export function getAllPlayerSeasonStats(
  allMatches?: Match[]
): PlayerSeasonStats[] {
  const derived = allMatches?.length
    ? computePlayerStatsFromMatches(allMatches)
    : [];
  const byId = new Map<string, PlayerSeasonStats>();
  for (const s of playerStats) byId.set(s.playerId, { ...s });
  for (const s of derived) {
    const cur = byId.get(s.playerId);
    if (!cur) byId.set(s.playerId, { ...s });
    else {
      const goals = Math.max(cur.goals, s.goals);
      byId.set(s.playerId, {
        playerId: s.playerId,
        appearances: Math.max(cur.appearances, s.appearances),
        starts: Math.max(cur.starts ?? 0, s.starts ?? 0),
        subsIn: Math.max(cur.subsIn ?? 0, s.subsIn ?? 0),
        subsOut: Math.max(cur.subsOut ?? 0, s.subsOut ?? 0),
        goals,
        assists: Math.max(cur.assists, s.assists),
        yellowCards: Math.max(cur.yellowCards, s.yellowCards),
        secondYellows: Math.max(cur.secondYellows ?? 0, s.secondYellows ?? 0),
        redCards: Math.max(cur.redCards, s.redCards),
        minutes: Math.max(cur.minutes, s.minutes),
        avgGoalMinute:
          goals > 0 ? (s.avgGoalMinute ?? cur.avgGoalMinute) : undefined,
      });
    }
  }
  return [...byId.values()];
}

export function getTopScorers(limit = 10, allMatches?: Match[]) {
  return getAllPlayerSeasonStats(allMatches)
    .map((s) => {
      const player = getPlayer(s.playerId);
      if (!player) return null;
      const team = getTeam(player.teamId);
      if (!team) return null;
      return { stats: s, player, team };
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => {
      if (b.stats.goals !== a.stats.goals) return b.stats.goals - a.stats.goals;
      return b.stats.assists - a.stats.assists;
    })
    .slice(0, limit);
}

export function getTopAssists(limit = 10, allMatches?: Match[]) {
  return getTopScorers(1000, allMatches)
    .filter((x) => x.stats.assists > 0)
    .sort((a, b) => {
      if (b.stats.assists !== a.stats.assists) return b.stats.assists - a.stats.assists;
      return b.stats.goals - a.stats.goals;
    })
    .slice(0, limit);
}

export function playerDisplayName(player: Player): string {
  return `${player.firstName} ${player.lastName}`;
}

export function positionLabel(position: Player["position"]): string {
  const labels = { GB: "Gardien", DEF: "Défenseur", MIL: "Milieu", ATT: "Attaquant" };
  return labels[position];
}

export { baseMatches };
