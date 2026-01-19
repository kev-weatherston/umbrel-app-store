import { StandingsResponse, TeamRecord, StandingsRecord } from './types';

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
      if (!standingsData.standings) {
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
  if (records.length > 0 && records[0].teamRecords) {
    return records.flatMap(record => record.teamRecords || []);
  }
  
  // Otherwise, records are already flat team records
  return records as TeamRecord[];
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
