// NHL API Types

export interface LeagueRecord {
  wins: number;
  losses: number;
  ot: number; // Overtime losses
  type: string;
}

export interface Team {
  id: number;
  name: string;
  link: string;
  abbreviation: string;
  teamName: string;
  locationName: string;
}

export interface Division {
  id: number;
  name: string;
  nameShort: string;
  link: string;
  abbreviation: string;
}

export interface Conference {
  id: number;
  name: string;
  link: string;
}

export interface TeamRecord {
  team: Team;
  leagueRecord: LeagueRecord;
  regulationWins: number;
  goalsAgainst: number;
  goalsScored: number;
  points: number;
  divisionRank: string;
  conferenceRank: string;
  leagueRank: string;
  wildCardRank: string;
  row: number;
  gamesPlayed: number;
  streak: {
    streakType: string;
    streakNumber: number;
    streakCode: string;
  };
  clinchIndicator?: string;
  pointsPercentage: number;
  ppDivisionRank?: string;
  ppConferenceRank?: string;
  ppLeagueRank?: string;
  lastUpdated: string;
}

export interface StandingsRecord {
  standingsType: string;
  league: {
    id: number;
    name: string;
    link: string;
  };
  division: Division;
  conference: Conference;
  teamRecords: TeamRecord[];
}

export interface StandingsResponse {
  records: StandingsRecord[];
}

export interface StandingsCache {
  data: StandingsResponse;
  lastUpdated: Date;
}
