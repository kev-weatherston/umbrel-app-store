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

// NHL API returns flat team records with division/conference info embedded
export interface TeamRecord {
  teamAbbrev: string | { default: string };
  teamName: string | { default: string; fr?: string };
  teamId: number;
  conferenceAbbrev: string;
  conferenceName: string;
  conferenceHomeSequence?: number;
  conferenceL10Sequence?: number;
  conferenceRoadSequence?: number;
  conferenceSequence: number;
  divisionAbbrev: string;
  divisionName: string;
  divisionHomeSequence?: number;
  divisionL10Sequence?: number;
  divisionRoadSequence?: number;
  divisionSequence: number;
  date: string;
  gameTypeId: number;
  gamesPlayed: number;
  goalDifferential: number;
  goalDifferentialPctg: number;
  goalAgainst: number;
  goalFor: number;
  goalsAgainstPerGame: number;
  goalsForPerGame: number;
  homeGamesPlayed: number;
  homeGoalDifferential: number;
  homeGoalsAgainst: number;
  homeGoalsFor: number;
  homeLosses: number;
  homeOtLosses: number;
  homePoints: number;
  homeRegulationPlusOtWins: number;
  homeRegulationWins: number;
  homeTies: number;
  homeWins: number;
  l10GamesPlayed: number;
  l10GoalDifferential: number;
  l10GoalsAgainst: number;
  l10GoalsFor: number;
  l10Losses: number;
  l10OtLosses: number;
  l10Points: number;
  l10RegulationPlusOtWins: number;
  l10RegulationWins: number;
  l10Ties: number;
  l10Wins: number;
  leagueHomeSequence?: number;
  leagueL10Sequence?: number;
  leagueRoadSequence?: number;
  leagueSequence: number;
  losses: number;
  otLosses: number;
  placeName: {
    default: string;
  };
  pointPctg: number;
  points: number;
  regulationPlusOtWins: number;
  regulationWins: number;
  roadGamesPlayed: number;
  roadGoalDifferential: number;
  roadGoalsAgainst: number;
  roadGoalsFor: number;
  roadLosses: number;
  roadOtLosses: number;
  roadPoints: number;
  roadRegulationPlusOtWins: number;
  roadRegulationWins: number;
  roadTies: number;
  roadWins: number;
  seasonId: number;
  shootoutLosses: number;
  shootoutWins: number;
  streakCode: string;
  streakCount: number;
  ties: number;
  waiversSequence?: number;
  wildcardSequence?: number;
  wins: number;
  // Legacy fields for compatibility
  team?: Team;
  leagueRecord?: LeagueRecord;
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
  wildCardIndicator?: boolean;
  standingsDateTimeUtc?: string;
  standings: StandingsRecord[];
  // Legacy support for 'records' field
  records?: StandingsRecord[];
}

export interface StandingsCache {
  data: StandingsResponse;
  lastUpdated: Date;
}
