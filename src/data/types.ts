export type TeamId = string;
export type PlayerId = string;
export type MatchId = string;

export type Position = "GB" | "DEF" | "MIL" | "ATT";

export interface ChampionshipMeta {
  name: string;
  shortName: string;
  season: string;
  tagline: string;
  country: string;
}

export interface Team {
  id: TeamId;
  name: string;
  shortName: string;
  city: string;
  stadium: string;
  founded: number;
  colors: { primary: string; secondary: string };
  coach: string;
}

export interface Player {
  id: PlayerId;
  teamId: TeamId;
  number: number;
  firstName: string;
  lastName: string;
  position: Position;
  nationality: string;
  age: number;
}

export interface MatchEvent {
  minute: number;
  type: "goal" | "own_goal" | "yellow" | "red" | "sub";
  teamId: TeamId;
  playerId?: PlayerId;
  assistId?: PlayerId;
  detail?: string;
}

export interface MatchStats {
  possession: [number, number];
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  passes: [number, number];
  passAccuracy: [number, number];
}

export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";

export interface Match {
  id: MatchId;
  matchday: number;
  date: string;
  kickoff: string;
  status: MatchStatus;
  homeTeamId: TeamId;
  awayTeamId: TeamId;
  homeScore?: number;
  awayScore?: number;
  stadium: string;
  attendance?: number;
  events: MatchEvent[];
  stats?: MatchStats;
}

export interface StandingRow {
  teamId: TeamId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: ("W" | "D" | "L")[];
  home: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  away: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
  };
}

export interface PlayerSeasonStats {
  playerId: PlayerId;
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutes: number;
}
