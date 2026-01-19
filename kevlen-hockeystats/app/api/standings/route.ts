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
      { error: 'Failed to fetch standings' },
      { status: 500 }
    );
  }
}
