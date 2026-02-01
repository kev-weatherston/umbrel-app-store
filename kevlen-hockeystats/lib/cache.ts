import { StandingsResponse, StandingsCache, PlayerLeadersResponse, PlayerLeader } from './types';
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
  const previousCache = playerLeadersCache; // Preserve previous cache in case of failure
  
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
      fetchWithTimeout('points'),
      fetchWithTimeout('goals'),
    ]);
    
    // Check results and use previous cache for failed fetches
    const pointsSuccess = pointsLeaders.status === 'fulfilled' && pointsLeaders.value.length > 0;
    const goalsSuccess = goalsLeaders.status === 'fulfilled' && goalsLeaders.value.length > 0;
    
    if (pointsLeaders.status === 'rejected') {
      console.warn('Failed to fetch points leaders:', pointsLeaders.reason);
    }
    if (goalsLeaders.status === 'rejected') {
      console.warn('Failed to fetch goals leaders:', goalsLeaders.reason);
    }
    
    // Use new data if successful, otherwise preserve from previous cache
    const pointsData = pointsSuccess 
      ? pointsLeaders.value 
      : (previousCache?.data.points || []);
    const goalsData = goalsSuccess 
      ? goalsLeaders.value 
      : (previousCache?.data.goals || []);
    
    // Only update cache if we got valid data for at least one stat type
    if (pointsSuccess || goalsSuccess) {
      const data: PlayerLeadersResponse = {
        points: pointsData,
        goals: goalsData,
      };
      
      playerLeadersCache = {
        data,
        lastUpdated: new Date(),
      };
      console.log(`Player leaders refreshed successfully at ${playerLeadersCache.lastUpdated.toISOString()}`);
      console.log(`  Points leaders: ${pointsData.length} ${pointsSuccess ? '(fresh)' : '(cached)'}, Goals leaders: ${goalsData.length} ${goalsSuccess ? '(fresh)' : '(cached)'}`);
      return data;
    } else {
      // Both failed - preserve previous cache and log error
      console.error('Failed to refresh player leaders - preserving previous cache');
      if (previousCache) {
        console.log(`  Using cached data from ${previousCache.lastUpdated.toISOString()}`);
        return previousCache.data;
      }
      // No previous cache - return empty but don't cache it
      throw new Error('Failed to fetch player leaders and no previous cache available');
    }
  } catch (error) {
    console.error('Error refreshing player leaders:', error);
    // Preserve previous cache if available
    if (previousCache) {
      console.log('Preserving previous player leaders cache due to error');
      return previousCache.data;
    }
    // No previous cache - throw error so scheduler knows it failed
    throw error;
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
