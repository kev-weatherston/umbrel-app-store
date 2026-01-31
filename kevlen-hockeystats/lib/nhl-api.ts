import { StandingsResponse, TeamRecord, StandingsRecord, PlayerLeader, PlayerStats } from './types';

const NHL_API_BASE_URL = 'https://api-web.nhle.com/v1/standings/now';

/**
 * Fetches current NHL standings from the NHL API
 * @returns Promise<StandingsResponse>
 */
export async function fetchStandings(): Promise<StandingsResponse> {
  try {
    const response = await fetch(NHL_API_BASE_URL, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`NHL API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle different possible response structures
    // The NHL API returns { standings: [...] } not { records: [...] }
    let standingsData: StandingsResponse;
    
    if (Array.isArray(data)) {
      // If response is directly an array, wrap it
      standingsData = { standings: data };
    } else if (data && Array.isArray(data.standings)) {
      // Current NHL API structure with standings array
      standingsData = data as StandingsResponse;
      // Also set records for backward compatibility
      if (!standingsData.records) {
        standingsData.records = standingsData.standings;
      }
    } else if (data && data.records && Array.isArray(data.records)) {
      // Legacy structure with records array
      standingsData = data as StandingsResponse;
      // Also set standings for consistency
      if (!standingsData.standings && standingsData.records) {
        standingsData.standings = standingsData.records;
      }
    } else {
      console.error('Unexpected API response structure:', JSON.stringify(data, null, 2));
      throw new Error('Invalid response structure from NHL API - expected standings or records array');
    }
    
    return standingsData;
  } catch (error) {
    console.error('Error fetching NHL standings:', error);
    throw new Error(`Failed to fetch NHL standings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates NHL team logo URL
 * @param abbreviation Team abbreviation (e.g., 'EDM', 'TOR')
 * @returns Logo URL
 */
export function getTeamLogoUrl(abbreviation: string | undefined | null): string {
  if (!abbreviation || typeof abbreviation !== 'string') {
    return '';
  }
  // Ensure abbreviation is uppercase for consistency
  const abbrev = abbreviation.toUpperCase();
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`;
}

/**
 * Gets all teams from standings response, flattened
 * @param standings Standings response
 * @returns Array of team records
 */
export function getAllTeams(standings: StandingsResponse | null): TeamRecord[] {
  if (!standings) {
    console.warn('Invalid standings data: null or undefined');
    return [];
  }
  
  // Use standings array (current API) or records array (legacy)
  const records = standings.standings || standings.records;
  
  if (!records || !Array.isArray(records)) {
    console.warn('Invalid standings data: no standings or records array', standings);
    return [];
  }
  
  // If records contain teamRecords (grouped structure), flatten them
  if (records.length > 0 && 'teamRecords' in records[0] && Array.isArray(records[0].teamRecords)) {
    return records.flatMap((record: any) => record.teamRecords || []);
  }
  
  // Otherwise, records are already flat team records
  // Check if it's actually TeamRecord[] by looking for teamAbbrev or teamId
  if (records.length > 0 && ('teamAbbrev' in records[0] || 'teamId' in records[0])) {
    return records as unknown as TeamRecord[];
  }
  
  // Fallback: return empty array if structure is unclear
  console.warn('Unable to determine team record structure');
  return [];
}

/**
 * Groups teams by division
 * @param teams Array of team records
 * @returns Array of StandingsRecord grouped by division
 */
export function groupTeamsByDivision(teams: TeamRecord[]): StandingsRecord[] {
  const divisionMap = new Map<string, TeamRecord[]>();
  
  // Group teams by division
  teams.forEach(team => {
    const divisionKey = team.divisionName || team.divisionAbbrev || 'Unknown';
    if (!divisionMap.has(divisionKey)) {
      divisionMap.set(divisionKey, []);
    }
    divisionMap.get(divisionKey)!.push(team);
  });
  
  // Convert to StandingsRecord format
  return Array.from(divisionMap.entries()).map(([divisionName, teamRecords]) => {
    // Sort teams within division by points
    const sortedTeams = [...teamRecords].sort((a, b) => b.points - a.points);
    
    // Get division info from first team
    const firstTeam = sortedTeams[0];
    
    return {
      standingsType: 'byDivision',
      league: {
        id: firstTeam.seasonId || 0,
        name: 'NHL',
        link: '',
      },
      division: {
        id: 0,
        name: divisionName,
        nameShort: firstTeam.divisionAbbrev || divisionName,
        link: '',
        abbreviation: firstTeam.divisionAbbrev || '',
      },
      conference: {
        id: 0,
        name: firstTeam.conferenceName || '',
        link: '',
      },
      teamRecords: sortedTeams,
    };
  });
}

/**
 * Sorts teams by points (descending)
 * @param teams Array of team records
 * @returns Sorted array
 */
export function sortTeamsByPoints(teams: TeamRecord[]) {
  return [...teams].sort((a, b) => b.points - a.points);
}

/**
 * Fetches player leaders from NHL API
 * Uses api-web.nhle.com skater-stats-leaders endpoint (same API as standings)
 * @param statType 'points' or 'goals'
 * @param limit Number of players to return (default: 25)
 * @returns Promise<PlayerLeader[]>
 */
export async function fetchPlayerLeaders(statType: 'points' | 'goals', limit: number = 25): Promise<PlayerLeader[]> {
  try {
    // Use the dedicated leaders endpoint from api-web.nhle.com (same API as standings)
    const category = statType; // 'points' or 'goals'
    const url = `https://api-web.nhle.com/v1/skater-stats-leaders/current?categories=${category}&limit=${limit}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let response;
    try {
      response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`NHL API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse the response structure
    // The API returns: { points: [...] } or { goals: [...] }
    let players: any[] = [];
    
    if (data[category] && Array.isArray(data[category])) {
      players = data[category];
    } else if (Array.isArray(data)) {
      players = data;
    } else if (data.leaders && Array.isArray(data.leaders)) {
      players = data.leaders;
    } else if (data.data && Array.isArray(data.data)) {
      players = data.data;
    }
    
    // Transform API response to PlayerLeader format
    const playerLeaders: PlayerLeader[] = players.map((item: any, index: number) => {
      // Extract player info - firstName and lastName are objects with 'default' property
      const firstName = typeof item.firstName === 'object' && item.firstName?.default 
        ? item.firstName.default 
        : (typeof item.firstName === 'string' ? item.firstName : '');
      const lastName = typeof item.lastName === 'object' && item.lastName?.default 
        ? item.lastName.default 
        : (typeof item.lastName === 'string' ? item.lastName : '');
      const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
      
      // Extract team info
      const teamAbbrev = item.teamAbbrev || '';
      // Map team abbreviation to team ID
      const teamId = getTeamIdFromAbbrev(teamAbbrev);
      
      // Extract stats
      // The 'value' field contains the stat (points or goals depending on category)
      const statValue = item.value || 0;
      // For this endpoint, we only get the primary stat (points or goals)
      // We don't have assists or games in this response
      // Note: For points leaders, we need to fetch goals separately, and vice versa
      // For now, we'll show the primary stat and leave assists/games as 0
      const goals = statType === 'goals' ? statValue : 0;
      const points = statType === 'points' ? statValue : 0;
      const assists = 0; // Not available in this endpoint response
      const games = 0; // Not available in this endpoint response
      
      // Use headshot URL if available
      const headshotUrl = item.headshot || '';
      
      return {
        player: {
          id: item.id || 0,
          fullName,
          firstName,
          lastName,
          primaryNumber: String(item.sweaterNumber || ''),
          birthDate: '',
          currentAge: 0,
          birthCountry: '',
          nationality: '',
          height: '',
          weight: 0,
          active: true,
          alternateCaptain: false,
          captain: false,
          rookie: false,
          shootsCatches: '',
          rosterStatus: '',
          primaryPosition: {
            code: item.position || '',
            name: item.position || '',
            type: '',
            abbreviation: item.position || '',
          },
        },
        teamAbbrev,
        teamId,
        goals,
        assists,
        points,
        games,
        rank: index + 1,
        // Store headshot URL for use in component
        headshotUrl,
      };
    });

    return playerLeaders;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('fetch failed') || errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
      console.warn(`Network error fetching ${statType} leaders:`, errorMessage);
    } else {
      console.error(`Error fetching ${statType} leaders:`, error);
    }
    // Return empty array instead of throwing to allow app to continue
    return [];
  }
}

/**
 * Gets team abbreviation from team ID
 * @param teamId Team ID
 * @returns Team abbreviation
 */
export function getTeamAbbrevFromId(teamId: number): string {
  // Team ID to abbreviation mapping (common NHL teams)
  const teamMap: Record<number, string> = {
    1: 'NJD', 2: 'NYI', 3: 'NYR', 4: 'PHI', 5: 'PIT', 6: 'BOS', 7: 'BUF', 8: 'MTL', 9: 'OTT',
    10: 'TOR', 12: 'CAR', 13: 'FLA', 14: 'TBL', 15: 'WSH', 16: 'CHI', 17: 'DET', 18: 'NSH',
    19: 'STL', 20: 'CGY', 21: 'COL', 22: 'EDM', 23: 'VAN', 24: 'ANA', 25: 'DAL', 26: 'LAK',
    28: 'SJS', 29: 'CBJ', 30: 'MIN', 52: 'WPG', 53: 'ARI', 54: 'VGK', 55: 'SEA',
  };
  return teamMap[teamId] || 'UNK';
}

/**
 * Gets team ID from team abbreviation (reverse lookup)
 * @param abbrev Team abbreviation
 * @returns Team ID
 */
export function getTeamIdFromAbbrev(abbrev: string): number {
  // Abbreviation to Team ID mapping
  const abbrevMap: Record<string, number> = {
    'NJD': 1, 'NYI': 2, 'NYR': 3, 'PHI': 4, 'PIT': 5, 'BOS': 6, 'BUF': 7, 'MTL': 8, 'OTT': 9,
    'TOR': 10, 'CAR': 12, 'FLA': 13, 'TBL': 14, 'WSH': 15, 'CHI': 16, 'DET': 17, 'NSH': 18,
    'STL': 19, 'CGY': 20, 'COL': 21, 'EDM': 22, 'VAN': 23, 'ANA': 24, 'DAL': 25, 'LAK': 26,
    'SJS': 28, 'CBJ': 29, 'MIN': 30, 'WPG': 52, 'ARI': 53, 'VGK': 54, 'SEA': 55,
  };
  return abbrevMap[abbrev.toUpperCase()] || 0;
}
