import { StandingsResponse, StandingsCache } from './types';
import { fetchStandings } from './nhl-api';

let cache: StandingsCache | null = null;
let isRefreshing = false;

/**
 * Gets cached standings data
 * @returns StandingsResponse or null if cache is empty
 */
export function getStandings(): StandingsResponse | null {
  return cache?.data || null;
}

/**
 * Sets standings data in cache
 * @param data Standings response data
 */
export function setStandings(data: StandingsResponse): void {
  cache = {
    data,
    lastUpdated: new Date(),
  };
}

/**
 * Refreshes standings data from NHL API and updates cache
 * @returns Promise<StandingsResponse>
 */
export async function refreshStandings(): Promise<StandingsResponse> {
  if (isRefreshing) {
    // If already refreshing, wait for existing refresh to complete
    while (isRefreshing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (cache) {
      return cache.data;
    }
  }

  isRefreshing = true;
  try {
    console.log('Refreshing NHL standings from API...');
    const data = await fetchStandings();
    setStandings(data);
    console.log(`Standings refreshed successfully at ${cache?.lastUpdated.toISOString()}`);
    return data;
  } catch (error) {
    console.error('Error refreshing standings:', error);
    throw error;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Gets the last update time of the cache
 * @returns Date or null
 */
export function getLastUpdated(): Date | null {
  return cache?.lastUpdated || null;
}

/**
 * Initializes cache on module load (startup refresh)
 */
async function initializeCache() {
  try {
    await refreshStandings();
  } catch (error) {
    console.error('Failed to initialize cache on startup:', error);
    // Don't throw - allow app to start even if initial fetch fails
  }
}

// Initialize cache on module load
if (typeof window === 'undefined') {
  // Only run on server side
  initializeCache();
}
