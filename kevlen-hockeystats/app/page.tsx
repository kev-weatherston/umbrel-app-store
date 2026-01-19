'use client';

import { useEffect, useState } from 'react';
import { StandingsResponse } from '@/lib/types';
import { getAllTeams, sortTeamsByPoints } from '@/lib/nhl-api';
import StandingsTable from '@/components/StandingsTable';
import StandingsByDivision from '@/components/StandingsByDivision';

export default function HomePage() {
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

  const overallTeams = sortTeamsByPoints(getAllTeams(standings));

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            NHL Standings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Current season team standings
          </p>
        </header>

        <div className="space-y-12">
          <section>
            <StandingsTable
              teams={overallTeams}
              showRank={true}
              title="Overall League Standings"
            />
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
              Standings by Division
            </h2>
            <StandingsByDivision records={standings.records} />
          </section>
        </div>
      </div>
    </div>
  );
}
