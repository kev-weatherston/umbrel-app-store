'use client';

import { useEffect, useState } from 'react';
import { StandingsResponse, TeamRecord } from '@/lib/types';
import { getAllTeams, sortTeamsByPoints, groupTeamsByDivision } from '@/lib/nhl-api';

const WIDGET_TEAMS = ['EDM', 'TOR']; // Edmonton Oilers and Toronto Maple Leafs

export default function WidgetPage() {
  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/standings');
        if (!response.ok) {
          throw new Error('Failed to fetch standings');
        }
        const data = await response.json();
        setStandings(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching standings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 dark:text-red-400 text-sm">Error: {error}</p>
      </div>
    );
  }

  if (!standings) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  // Use standings array (current API) or records array (legacy)
  const records = standings.standings || standings.records;
  
  if (!records || !Array.isArray(records)) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 dark:text-red-400 text-sm">
          Invalid standings data structure
        </p>
      </div>
    );
  }

  // Filter for EDM and TOR teams
  const allTeams = getAllTeams(standings);
  const widgetTeams = allTeams.filter((team: TeamRecord) => {
    // Extract abbreviation from object or string
    let abbrev: string;
    if (team.teamAbbrev && typeof team.teamAbbrev === 'object' && 'default' in team.teamAbbrev) {
      abbrev = team.teamAbbrev.default;
    } else if (typeof team.teamAbbrev === 'string') {
      abbrev = team.teamAbbrev;
    } else {
      abbrev = team.team?.abbreviation || '';
    }
    return WIDGET_TEAMS.includes(abbrev);
  });

  // Sort by points
  const sortedWidgetTeams = sortTeamsByPoints(widgetTeams);

  // Get overall ranks
  const overallTeams = sortTeamsByPoints(allTeams);
  const teamsWithRanks = sortedWidgetTeams.map((team: TeamRecord) => {
    const teamId = team.teamId || team.team?.id || 0;
    const overallRank = overallTeams.findIndex((t: TeamRecord) => {
      const tId = t.teamId || t.team?.id || 0;
      return tId === teamId;
    }) + 1;
    return { ...team, overallRank };
  });

  // Group teams by division for finding division ranks
  const divisionRecords = groupTeamsByDivision(allTeams);

  return (
    <div className="p-4 bg-white dark:bg-gray-900">
      <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
        EDM & TOR Standings
      </h2>
      <div className="space-y-4">
        {teamsWithRanks.map((team: TeamRecord & { overallRank: number }) => {
          const teamId = team.teamId || team.team?.id || 0;
          const divisionRecord = divisionRecords.find((record) =>
            record.teamRecords?.some((tr) => {
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

          return (
            <div
              key={team.team.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {team.placeName?.default || team.teamName || team.team?.name || 'Unknown'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Overall: #{team.overallRank}
                  </div>
                  {divisionRank && divisionRecord && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {divisionRecord.division.nameShort}: #{divisionRank}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 text-sm mt-3">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">GP</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {team.gamesPlayed}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">W</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {team.wins || team.leagueRecord?.wins || 0}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">L</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {team.losses || team.leagueRecord?.losses || 0}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">OT</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {team.otLosses || team.leagueRecord?.ot || 0}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Pts</div>
                  <div className="font-semibold text-blue-600 dark:text-blue-400">
                    {team.points}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
