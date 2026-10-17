import { matches, playerStats, players, teams } from "@/data/championship";
import type {
  Match,
  Player,
  PlayerSeasonStats,
  StandingRow,
  Team,
  TeamId,
} from "@/data/types";

export function getTeam(id: TeamId): Team | undefined {
  return teams.find((t) => t.id === id);
}

export function getPlayer(id: string): Player | undefined {
  return players.find((p) => p.id === id);
}

export function getMatch(id: string): Match | undefined {
  return matches.find((m) => m.id === id);
}

export function getTeamPlayers(teamId: TeamId): Player[] {
  return players
    .filter((p) => p.teamId === teamId)
    .sort((a, b) => a.number - b.number);
}

export function getPlayerStats(playerId: string): PlayerSeasonStats | undefined {
  return playerStats.find((s) => s.playerId === playerId);
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

export function computeStandings(): StandingRow[] {
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

  const finished = matches
    .filter((m) => m.status === "finished" && m.homeScore != null && m.awayScore != null)
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

export function getMatchdays(): number[] {
  return [...new Set(matches.map((m) => m.matchday))].sort((a, b) => a - b);
}

export function getMatchesByMatchday(matchday: number): Match[] {
  return matches
    .filter((m) => m.matchday === matchday)
    .sort((a, b) => a.date.localeCompare(b.date) || a.kickoff.localeCompare(b.kickoff));
}

export function getLatestResults(limit = 4): Match[] {
  return matches
    .filter((m) => m.status === "finished")
    .sort((a, b) => b.date.localeCompare(a.date) || b.kickoff.localeCompare(a.kickoff))
    .slice(0, limit);
}

export function getUpcomingFixtures(limit = 4): Match[] {
  return matches
    .filter((m) => m.status === "scheduled" || m.status === "live")
    .sort((a, b) => a.date.localeCompare(b.date) || a.kickoff.localeCompare(b.kickoff))
    .slice(0, limit);
}

export function getTeamMatches(teamId: TeamId): Match[] {
  return matches
    .filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getTopScorers(limit = 10) {
  return playerStats
    .map((s) => ({
      stats: s,
      player: getPlayer(s.playerId)!,
      team: getTeam(getPlayer(s.playerId)!.teamId)!,
    }))
    .filter((x) => x.player)
    .sort((a, b) => {
      if (b.stats.goals !== a.stats.goals) return b.stats.goals - a.stats.goals;
      return b.stats.assists - a.stats.assists;
    })
    .slice(0, limit);
}

export function getTopAssists(limit = 10) {
  return playerStats
    .map((s) => ({
      stats: s,
      player: getPlayer(s.playerId)!,
      team: getTeam(getPlayer(s.playerId)!.teamId)!,
    }))
    .filter((x) => x.player && x.stats.assists > 0)
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
