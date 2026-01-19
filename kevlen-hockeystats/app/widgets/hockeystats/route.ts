import { NextResponse } from 'next/server';
import { getStandings } from '@/lib/cache';
import { getAllTeams, sortTeamsByPoints, groupTeamsByDivision } from '@/lib/nhl-api';
import { TeamRecord } from '@/lib/types';

const FAVORITE_TEAMS = ['TOR', 'EDM'];

export async function GET() {
  try {
    const standings = getStandings();
    
    if (!standings) {
      // Return placeholder data so widget still shows structure
      return NextResponse.json({
        type: 'list',
        refresh: '5m',
        items: [
          { title: 'Toronto Maple Leafs', text: '-', subtext: 'Loading...' },
          { title: 'Edmonton Oilers', text: '-', subtext: 'Loading...' },
        ],
      });
    }

    const allTeams = getAllTeams(standings);
    
    // Filter for favorite teams
    const widgetTeams = allTeams.filter((team) => {
      let abbrev: string;
      if (team.teamAbbrev && typeof team.teamAbbrev === 'object' && 'default' in team.teamAbbrev) {
        abbrev = team.teamAbbrev.default;
      } else if (typeof team.teamAbbrev === 'string') {
        abbrev = team.teamAbbrev;
      } else {
        abbrev = team.team?.abbreviation || '';
      }
      return FAVORITE_TEAMS.includes(abbrev);
    });

    // Sort by points
    const sortedTeams = sortTeamsByPoints(widgetTeams);
    const overallTeams = sortTeamsByPoints(allTeams);
    
    // Group teams by division for division ranks
    const divisionRecords = groupTeamsByDivision(allTeams);

    // Format data for Umbrel widget (list type)
    const items = sortedTeams.map((team) => {
      const teamId = team.teamId || team.team?.id || 0;
      
      // Calculate overall rank
      const overallRank = overallTeams.findIndex((t) => {
        const tId = t.teamId || t.team?.id || 0;
        return tId === teamId;
      }) + 1;

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

      // Determine playoff/wildcard status
      // NHL: Top 3 in each division = playoff (P)
      // Wildcard: 2 teams per conference (positions 4-5 in conference standings)
      let playoffStatus = '';
      
      if (divisionRank !== null) {
        // Top 3 in division = automatic playoff spot
        if (divisionRank <= 3) {
          playoffStatus = 'P';
        } else {
          // Check wildcard sequence from API (if available)
          // wildcardSequence indicates position in wildcard race (1 or 2)
          const wildcardSequence = team.wildcardSequence;
          if (wildcardSequence && wildcardSequence > 0) {
            playoffStatus = `WC${wildcardSequence}`;
          } else {
            // Fallback: if division rank is 4 or 5, might be wildcard
            // But we can't determine this without conference-wide standings
            // So we'll only show P for top 3, and WC if wildcardSequence exists
          }
        }
      }

      let teamAbbrev: string;
      if (team.teamAbbrev && typeof team.teamAbbrev === 'object' && 'default' in team.teamAbbrev) {
        teamAbbrev = team.teamAbbrev.default;
      } else if (typeof team.teamAbbrev === 'string') {
        teamAbbrev = team.teamAbbrev;
      } else {
        teamAbbrev = team.team?.abbreviation || '';
      }

      const teamName = team.placeName?.default || 
                       (team.teamName && typeof team.teamName === 'object' ? team.teamName.default : team.teamName) || 
                       team.team?.name || 
                       'Unknown';

      const points = team.points || 0;

      // Build subtext: overall rank, division rank, playoff status
      const subtextParts: string[] = [];
      subtextParts.push(`#${overallRank}`);
      
      if (divisionRank !== null && divisionRecord) {
        subtextParts.push(`${divisionRecord.division.nameShort} #${divisionRank}`);
      }
      
      if (playoffStatus) {
        subtextParts.push(playoffStatus);
      }

      return {
        title: teamName,
        text: `${points} pts`,
        subtext: subtextParts.join(', '),
      };
    });

    return NextResponse.json({
      type: 'list',
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
      type: 'list',
      refresh: '5m',
      items: [
        { title: 'Toronto Maple Leafs', text: '-', subtext: 'Error loading data' },
        { title: 'Edmonton Oilers', text: '-', subtext: 'Error loading data' },
      ],
    }, { status: 500 });
  }
}
