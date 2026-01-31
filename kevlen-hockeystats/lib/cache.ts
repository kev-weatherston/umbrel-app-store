import { StandingsResponse, StandingsCache, PlayerLeadersResponse } from './types';
import { fetchStandings, fetchPlayerLeaders } from './nhl-api';

let cache: StandingsCache | null = null;
let playerLeadersCache: { data: PlayerLeadersResponse; lastUpdated: Date } | null = null;
let isRefreshing = false;
let isRefreshingPlayers = false;

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
 * Gets cached player leaders data
 * @returns PlayerLeadersResponse or null if cache is empty
 */
export function getPlayerLeaders(): PlayerLeadersResponse | null {
  return playerLeadersCache?.data || null;
}

/**
 * Refreshes player leaders data from NHL API and updates cache
 * @returns Promise<PlayerLeadersResponse>
 */
export async function refreshPlayerLeaders(): Promise<PlayerLeadersResponse> {
  if (isRefreshingPlayers) {
    // If already refreshing, wait for existing refresh to complete
    while (isRefreshingPlayers) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (playerLeadersCache) {
      return playerLeadersCache.data;
    }
  }

  isRefreshingPlayers = true;
  try {
    console.log('Refreshing player leaders from API...');
    
    // Fetch with timeout and error handling
    const fetchWithTimeout = async (statType: 'points' | 'goals', timeout: number = 30000) => {
      return Promise.race([
        fetchPlayerLeaders(statType, 25),
        new Promise<PlayerLeader[]>((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout fetching ${statType} leaders`)), timeout)
        ),
      ]);
    };

    const [pointsLeaders, goalsLeaders] = await Promise.allSettled([
      fetchWithTimeout('points').catch(err => {
        console.warn('Failed to fetch points leaders:', err.message);
        return [];
      }),
      fetchWithTimeout('goals').catch(err => {
        console.warn('Failed to fetch goals leaders:', err.message);
        return [];
      }),
    ]);
    
    const data: PlayerLeadersResponse = {
      points: pointsLeaders.status === 'fulfilled' ? pointsLeaders.value : [],
      goals: goalsLeaders.status === 'fulfilled' ? goalsLeaders.value : [],
    };
    
    playerLeadersCache = {
      data,
      lastUpdated: new Date(),
    };
    console.log(`Player leaders refreshed successfully at ${playerLeadersCache.lastUpdated.toISOString()}`);
    return data;
  } catch (error) {
    console.error('Error refreshing player leaders:', error);
    // Return empty data instead of throwing to allow app to continue
    const emptyData: PlayerLeadersResponse = {
      points: [],
      goals: [],
    };
    playerLeadersCache = {
      data: emptyData,
      lastUpdated: new Date(),
    };
    return emptyData;
  } finally {
    isRefreshingPlayers = false;
  }
}

/**
 * Initializes cache on module load (startup refresh)
 */
async function initializeCache() {
  try {
    await Promise.all([
      refreshStandings(),
      refreshPlayerLeaders(),
    ]);
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
