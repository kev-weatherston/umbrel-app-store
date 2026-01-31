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
    
    // Log the structure for debugging
    console.log('NHL API response structure:', {
      hasRecords: !!(data?.records),
      isArray: Array.isArray(data?.records),
      keys: Object.keys(data || {}),
      recordsLength: data?.records?.length,
      sampleData: JSON.stringify(data).substring(0, 500),
    });
    
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
 * Fetches player leaders from NHL Stats API
 * Uses statsapi.web.nhl.com to get player statistics
 * @param statType 'points' or 'goals'
 * @param limit Number of players to return (default: 25)
 * @returns Promise<PlayerLeader[]>
 */
export async function fetchPlayerLeaders(statType: 'points' | 'goals', limit: number = 25): Promise<PlayerLeader[]> {
  try {
    // Determine current season (format: YYYY0YYYY+1, e.g., 20242025)
    const currentYear = new Date().getFullYear();
    const month = new Date().getMonth(); // 0-11
    // If we're before July, use previous season
    const seasonStartYear = month < 6 ? currentYear - 1 : currentYear;
    const seasonEndYear = seasonStartYear + 1;
    const seasonId = `${seasonStartYear}${seasonEndYear}`;
    
    // NHL Stats API: Get all teams first, then get player stats
    // We'll use the stats endpoint with expand parameters
    // Format: https://statsapi.web.nhl.com/api/v1/people/{playerId}/stats?stats=statsSingleSeason&season={season}
    
    // First, get all teams to get their rosters
    const teamsResponse = await fetch(
      `https://statsapi.web.nhl.com/api/v1/teams?expand=team.roster&season=${seasonId}`,
      { 
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!teamsResponse.ok) {
      throw new Error(`NHL Stats API error: ${teamsResponse.status} ${teamsResponse.statusText}`);
    }

    const teamsData = await teamsResponse.json();
    const allPlayers: PlayerLeader[] = [];
    const playerPromises: Promise<void>[] = [];

    // Collect all player IDs first
    const playerIds: Array<{ id: number; team: any; person: any }> = [];
    for (const team of teamsData.teams || []) {
      if (!team.roster || !team.roster.roster) continue;
      
      for (const rosterEntry of team.roster.roster) {
        if (rosterEntry.person.primaryPosition.type !== 'Forward' && 
            rosterEntry.person.primaryPosition.type !== 'Defenseman') {
          continue; // Skip goalies
        }
        playerIds.push({ id: rosterEntry.person.id, team, person: rosterEntry.person });
      }
    }

    // Fetch stats for players in batches (limit to top teams' players for performance)
    // In production, you'd want to fetch all players, but for now we'll limit
    const maxPlayersToFetch = 200; // Reasonable limit to avoid timeout
    const playersToFetch = playerIds.slice(0, maxPlayersToFetch);

    // Fetch player stats in parallel batches
    const batchSize = 10;
    for (let i = 0; i < playersToFetch.length; i += batchSize) {
      const batch = playersToFetch.slice(i, i + batchSize);
      const batchPromises = batch.map(async ({ id, team, person }) => {
        try {
          const playerStatsResponse = await fetch(
            `https://statsapi.web.nhl.com/api/v1/people/${id}/stats?stats=statsSingleSeason&season=${seasonId}`,
            { 
              cache: 'no-store',
              headers: {
                'Accept': 'application/json',
              },
            }
          );

          if (!playerStatsResponse.ok) return;

          const playerStatsData = await playerStatsResponse.json();
          const stats = playerStatsData.stats?.[0]?.splits?.[0]?.stat;
          
          if (!stats || stats.games === 0) return;

          const playerLeader: PlayerLeader = {
            player: person,
            teamAbbrev: team.abbreviation || getTeamAbbrevFromId(team.id),
            teamId: team.id,
            goals: stats.goals || 0,
            assists: stats.assists || 0,
            points: stats.points || 0,
            games: stats.games || 0,
            rank: 0, // Will be set after sorting
          };

          allPlayers.push(playerLeader);
        } catch (err) {
          // Skip players that fail to fetch
          return;
        }
      });
      
      // Wait for batch to complete before starting next batch
      await Promise.all(batchPromises);
    }

    // Sort by the requested stat type and take top N
    const sorted = allPlayers.sort((a, b) => {
      const aStat = statType === 'points' ? a.points : a.goals;
      const bStat = statType === 'points' ? b.points : b.goals;
      return bStat - aStat;
    });

    // Assign ranks and limit results
    return sorted.slice(0, limit).map((player, index) => ({
      ...player,
      rank: index + 1,
    }));
  } catch (error) {
    console.error(`Error fetching ${statType} leaders:`, error);
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
