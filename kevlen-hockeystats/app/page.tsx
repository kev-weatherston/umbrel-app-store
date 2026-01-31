'use client';

import { useEffect, useState } from 'react';
import { StandingsResponse, StandingsRecord, PlayerLeader } from '@/lib/types';
import { getAllTeams, sortTeamsByPoints, groupTeamsByDivision } from '@/lib/nhl-api';
import StandingsTable from '@/components/StandingsTable';
import PlayerLeaderboard from '@/components/PlayerLeaderboard';

const FAVORITE_TEAMS = ['TOR', 'EDM'];

export default function HomePage() {
  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [playerLeaders, setPlayerLeaders] = useState<{ points: PlayerLeader[]; goals: PlayerLeader[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overall');

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

    async function fetchPlayerData() {
      try {
        setPlayersLoading(true);
        const [pointsResponse, goalsResponse] = await Promise.all([
          fetch('/api/players/leaders?type=points'),
          fetch('/api/players/leaders?type=goals'),
        ]);
        
        if (pointsResponse.ok && goalsResponse.ok) {
          const pointsData = await pointsResponse.json();
          const goalsData = await goalsResponse.json();
          setPlayerLeaders({
            points: pointsData.players || [],
            goals: goalsData.players || [],
          });
        }
      } catch (err) {
        console.error('Error fetching player leaders:', err);
        // Don't set error state for players - allow standings to still show
      } finally {
        setPlayersLoading(false);
      }
    }

    fetchData();
    fetchPlayerData();
  }, []);

  // Calculate tabs data (this runs on every render but hooks are stable)
  const allTeams = standings ? getAllTeams(standings) : [];
  const overallTeams = standings ? sortTeamsByPoints(allTeams) : [];
  const divisionRecords = standings ? groupTeamsByDivision(allTeams) : [];
  
  const tabs: Array<{
    id: string;
    label: string;
    type: 'standings' | 'players';
    teams?: any[];
    statType?: 'points' | 'goals';
  }> = standings ? [
    { id: 'overall', label: 'Overall', type: 'standings', teams: overallTeams },
    ...divisionRecords.map((record) => ({
      id: record.division.name || record.division.abbreviation || 'unknown',
      label: record.division.name || record.division.nameShort || 'Unknown',
      type: 'standings' as const,
      teams: record.teamRecords,
    })),
    { id: 'point-leaders', label: 'Point Leaders', type: 'players' as const, statType: 'points' as const },
    { id: 'goal-leaders', label: 'Goal Leaders', type: 'players' as const, statType: 'goals' as const },
  ] : [];

  // Update activeTab if it's not in the tabs list (e.g., if data changed)
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(tab => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading NHL standings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!standings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">No standings data available</p>
      </div>
    );
  }

  // Use standings array (current API) or records array (legacy)
  const records = standings?.standings || standings?.records;
  
  if (!standings || !records || !Array.isArray(records)) {
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 text-lg mb-4">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    
    if (!standings) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 text-lg mb-4">
              Invalid standings data structure
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Received: {JSON.stringify(Object.keys(standings || {}))}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
  }
  
  const activeTabData = tabs.find(tab => tab.id === activeTab) || tabs[0];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            NHL Leaderboards
          </h1>
        </header>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTabData?.type === 'players' ? (
            <PlayerLeaderboard
              players={
                activeTabData.statType === 'goals'
                  ? (playerLeaders?.goals || [])
                  : (playerLeaders?.points || [])
              }
              statType={(activeTabData.statType || 'points') as 'points' | 'goals'}
              loading={playersLoading}
            />
          ) : (
            <StandingsTable
              teams={activeTabData?.teams || []}
              showRank={true}
              title={activeTab === 'overall' ? undefined : activeTabData?.label}
              favoriteTeams={FAVORITE_TEAMS}
            />
          )}
        </div>
      </div>
    </div>
  );
}
