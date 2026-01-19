import { StandingsResponse } from './types';

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
    return data as StandingsResponse;
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
export function getTeamLogoUrl(abbreviation: string): string {
  return `https://assets.nhle.com/logos/nhl/svg/${abbreviation}_light.svg`;
}

/**
 * Gets all teams from standings response, flattened
 * @param standings Standings response
 * @returns Array of team records
 */
export function getAllTeams(standings: StandingsResponse) {
  return standings.records.flatMap(record => record.teamRecords);
}

/**
 * Sorts teams by points (descending)
 * @param teams Array of team records
 * @returns Sorted array
 */
export function sortTeamsByPoints(teams: any[]) {
  return [...teams].sort((a, b) => b.points - a.points);
}
