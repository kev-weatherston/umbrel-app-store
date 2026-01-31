import { PlayerLeader } from '@/lib/types';
import { getTeamLogoUrl, getTeamAbbrevFromId } from '@/lib/nhl-api';
import Image from 'next/image';

interface PlayerLeaderboardProps {
  players: PlayerLeader[];
  statType: 'points' | 'goals';
  loading?: boolean;
}

export default function PlayerLeaderboard({ players, statType, loading = false }: PlayerLeaderboardProps) {
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading player stats...</p>
        </div>
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <div className="w-full text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No player data available</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Player
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Team
            </th>
            {statType === 'points' ? (
              <>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Pts
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  G
                </th>
              </>
            ) : (
              <>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  G
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Pts
                </th>
              </>
            )}
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              GP
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {players.map((player) => {
            const teamAbbrev = getTeamAbbrevFromId(player.teamId);
            const logoUrl = getTeamLogoUrl(teamAbbrev);
            const playerPhotoUrl = `https://cms.nhl.bamgrid.com/images/headshots/current/168x168/${player.player.id}.jpg`;

            return (
              <tr 
                key={player.player.id} 
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                  {player.rank}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <Image
                        src={playerPhotoUrl}
                        alt={player.player.fullName}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        unoptimized
                        onError={(e) => {
                          // Fallback to a placeholder if image fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {player.player.fullName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {logoUrl && (
                      <div className="w-6 h-6 flex-shrink-0">
                        <Image
                          src={logoUrl}
                          alt={teamAbbrev}
                          width={24}
                          height={24}
                          className="w-full h-full object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {teamAbbrev}
                    </span>
                  </div>
                </td>
                {statType === 'points' ? (
                  <>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-gray-100">
                      {player.points}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                      {player.goals}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-gray-100">
                      {player.goals}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                      {player.points}
                    </td>
                  </>
                )}
                <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                  {player.games}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
