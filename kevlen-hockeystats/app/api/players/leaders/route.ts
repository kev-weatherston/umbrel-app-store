import { NextResponse } from 'next/server';
import { getPlayerLeaders, refreshPlayerLeaders } from '@/lib/cache';
import { PlayerLeadersResponse } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statType = searchParams.get('type') || 'points'; // 'points' or 'goals'
    
    // Try to get from cache first
    let leaders = getPlayerLeaders();

    // If cache is empty, fetch fresh data
    if (!leaders) {
      console.log('Player leaders cache empty, fetching fresh data...');
      leaders = await refreshPlayerLeaders();
    }

    // Return the requested stat type
    const data = statType === 'goals' ? leaders.goals : leaders.points;

    return NextResponse.json({
      type: statType,
      players: data,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in player leaders API route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch player leaders',
        type: 'points',
        players: [],
      },
      { status: 500 }
    );
  }
}
