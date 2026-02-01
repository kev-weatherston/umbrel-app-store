import { NextResponse } from 'next/server';
import { getStandings, getPlayerLeaders } from '@/lib/cache';
import { getAllTeams, sortTeamsByPoints, groupTeamsByDivision, getTeamLogoUrl } from '@/lib/nhl-api';
import { TeamRecord } from '@/lib/types';
import { FAVORITE_TEAMS } from '@/lib/constants';

export async function GET() {
  try {
    const standings = getStandings();
    const playerLeaders = getPlayerLeaders();
    
    if (!standings || !playerLeaders) {
      // Return placeholder data for four-stats
      return NextResponse.json({
        type: 'four-stats',
        refresh: '5m',
        items: [
          { title: 'EDM', text: '-', subtext: 'Loading...', image: getTeamLogoUrl('EDM') },
          { title: 'TOR', text: '-', subtext: 'Loading...', image: getTeamLogoUrl('TOR') },
          { title: 'Goals', text: '-', subtext: 'Loading...' },
          { title: 'Points', text: '-', subtext: 'Loading...' },
        ],
      });
    }

    const allTeams = getAllTeams(standings);
    const overallTeams = sortTeamsByPoints(allTeams);
    const divisionRecords = groupTeamsByDivision(allTeams);

    // Get favorite teams data
    const favoriteTeamsData: Array<{ abbrev: string; points: number; divisionRank: number | null; logoUrl: string }> = [];
    
    for (const teamAbbrev of FAVORITE_TEAMS) {
      const team = allTeams.find((t) => {
        let abbrev: string;
        if (t.teamAbbrev && typeof t.teamAbbrev === 'object' && 'default' in t.teamAbbrev) {
          abbrev = t.teamAbbrev.default;
        } else if (typeof t.teamAbbrev === 'string') {
          abbrev = t.teamAbbrev;
        } else {
          abbrev = t.team?.abbreviation || '';
        }
        return abbrev === teamAbbrev;
      });

      if (team) {
        const teamId = team.teamId || team.team?.id || 0;
        
        // Find division and division rank
        const divisionRecord = divisionRecords.find((record) =>
          record.teamRecords.some((tr) => {
            const trId = tr.teamId || tr.team?.id || 0;
            return trId === teamId;
          })
        );
        
        const divisionRank = divisionRecord
          ? divisionRecord.teamRecords.findIndex((tr) => {
              const trId = tr.teamId || tr.team?.id || 0;
              return trId === teamId;
            }) + 1
          : null;

        favoriteTeamsData.push({
          abbrev: teamAbbrev,
          points: team.points || 0,
          divisionRank,
          logoUrl: getTeamLogoUrl(teamAbbrev),
        });
      }
    }

    // Get top goal scorer
    const topGoalScorer = playerLeaders.goals && playerLeaders.goals.length > 0 
      ? playerLeaders.goals[0] 
      : null;
    
    // Get top points scorer
    const topPointsScorer = playerLeaders.points && playerLeaders.points.length > 0 
      ? playerLeaders.points[0] 
      : null;

    // Format four-stats items
    const items: any[] = [];

    // Stat 1: EDM
    const edmData = favoriteTeamsData.find(t => t.abbrev === 'EDM');
    if (edmData) {
      items.push({
        title: 'EDM',
        text: `${edmData.points}`,
        subtext: edmData.divisionRank !== null ? `Div #${edmData.divisionRank}` : '-',
        image: edmData.logoUrl,
      });
    } else {
      items.push({
        title: 'EDM',
        text: '-',
        subtext: 'No data',
        image: getTeamLogoUrl('EDM'),
      });
    }

    // Stat 2: TOR
    const torData = favoriteTeamsData.find(t => t.abbrev === 'TOR');
    if (torData) {
      items.push({
        title: 'TOR',
        text: `${torData.points}`,
        subtext: torData.divisionRank !== null ? `Div #${torData.divisionRank}` : '-',
        image: torData.logoUrl,
      });
    } else {
      items.push({
        title: 'TOR',
        text: '-',
        subtext: 'No data',
        image: getTeamLogoUrl('TOR'),
      });
    }

    // Stat 3: Goals leader
    if (topGoalScorer) {
      items.push({
        title: 'Goals',
        text: `${topGoalScorer.goals}`,
        subtext: topGoalScorer.player.fullName,
        image: topGoalScorer.headshotUrl || '',
      });
    } else {
      items.push({
        title: 'Goals',
        text: '-',
        subtext: 'No data',
      });
    }

    // Stat 4: Points leader
    if (topPointsScorer) {
      items.push({
        title: 'Points',
        text: `${topPointsScorer.points}`,
        subtext: topPointsScorer.player.fullName,
        image: topPointsScorer.headshotUrl || '',
      });
    } else {
      items.push({
        title: 'Points',
        text: '-',
        subtext: 'No data',
      });
    }

    return NextResponse.json({
      type: 'four-stats',
      refresh: '5m',
      items: items,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in widget API route:', error);
    // Return placeholder data on error
    return NextResponse.json({
      type: 'four-stats',
      refresh: '5m',
      items: [
        { title: 'EDM', text: '-', subtext: 'Error', image: getTeamLogoUrl('EDM') },
        { title: 'TOR', text: '-', subtext: 'Error', image: getTeamLogoUrl('TOR') },
        { title: 'Goals', text: '-', subtext: 'Error' },
        { title: 'Points', text: '-', subtext: 'Error' },
      ],
    }, { status: 500 });
  }
}
