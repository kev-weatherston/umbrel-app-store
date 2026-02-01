import { NextResponse } from 'next/server';
import { getStandings } from '@/lib/cache';
import { getAllTeams, sortTeamsByPoints, groupTeamsByDivision, getTeamLogoUrl } from '@/lib/nhl-api';
import { TeamRecord } from '@/lib/types';
import { FAVORITE_TEAMS } from '@/lib/constants';

export async function GET() {
  try {
    const standings = getStandings();
    
    if (!standings) {
      // Return placeholder data dynamically based on FAVORITE_TEAMS constant
      return NextResponse.json({
        type: 'list',
        refresh: '5m',
        items: FAVORITE_TEAMS.map((teamAbbrev) => ({
          image: getTeamLogoUrl(teamAbbrev),
          text: 'Loading...',
        })),
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

      let teamAbbrev: string;
      if (team.teamAbbrev && typeof team.teamAbbrev === 'object' && 'default' in team.teamAbbrev) {
        teamAbbrev = team.teamAbbrev.default;
      } else if (typeof team.teamAbbrev === 'string') {
        teamAbbrev = team.teamAbbrev;
      } else {
        teamAbbrev = team.team?.abbreviation || '';
      }

      const points = team.points || 0;
      const logoUrl = getTeamLogoUrl(teamAbbrev);

      // Format: points, overall_position, division_position
      const textParts: string[] = [];
      textParts.push(`${points} pts`);
      textParts.push(`#${overallRank}`);
      if (divisionRank !== null) {
        textParts.push(`#${divisionRank}`);
      }

      const item: any = {
        text: textParts.join(', '),
      };

      // Add image/logo
      if (logoUrl) {
        item.image = logoUrl;
      }

      return item;
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
    // Return placeholder data dynamically based on FAVORITE_TEAMS constant
    return NextResponse.json({
      type: 'list',
      refresh: '5m',
      items: FAVORITE_TEAMS.map((teamAbbrev) => ({
        image: getTeamLogoUrl(teamAbbrev),
        text: 'Error loading data',
      })),
    }, { status: 500 });
  }
}
