import { NextResponse } from 'next/server';
import { getStandings, refreshStandings } from '@/lib/cache';
import { StandingsResponse } from '@/lib/types';

export async function GET() {
  try {
    // Try to get from cache first
    let standings = getStandings();

    // If cache is empty, fetch fresh data
    if (!standings) {
      console.log('Cache empty, fetching fresh data...');
      standings = await refreshStandings();
    }

    // Validate response structure
    const records = standings?.standings || standings?.records;
    if (!standings || !records || !Array.isArray(records)) {
      console.error('Invalid standings structure:', {
        hasStandings: !!standings,
        hasStandingsArray: !!(standings?.standings),
        hasRecords: !!(standings?.records),
        isArray: Array.isArray(records),
        keys: standings ? Object.keys(standings) : 'no standings',
      });
      throw new Error('Invalid standings data structure received from API');
    }

    // Return cached data with appropriate headers
    return NextResponse.json(standings, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in standings API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
