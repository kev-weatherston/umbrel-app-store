import { TeamRecord } from '@/lib/types';
import TeamRow from './TeamRow';

interface StandingsTableProps {
  teams: TeamRecord[];
  showRank?: boolean;
  title?: string;
  favoriteTeams?: string[];
}

export default function StandingsTable({ teams, showRank = true, title, favoriteTeams = [] }: StandingsTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      {title && (
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {title}
        </h2>
      )}
      <table className="w-full border-collapse bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            {showRank && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Rank
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Team
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Pts
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              GP
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              W
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              L
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              OT
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {teams.map((team, index) => {
            // Use teamId from API or fallback to team.id for legacy structure
            // Ensure key is always a primitive (string or number) and unique
            let teamId: string | number;
            if (typeof team.teamId === 'number') {
              teamId = team.teamId;
            } else if (typeof team.team?.id === 'number') {
              teamId = team.team.id;
            } else if (typeof team.teamAbbrev === 'string' && team.teamAbbrev) {
              teamId = team.teamAbbrev;
            } else {
              // Fallback to index-based key if no valid ID found
              teamId = `team-${index}`;
            }
            // Ensure uniqueness by combining with index if needed
            const uniqueKey = typeof teamId === 'number' ? teamId : `${teamId}-${index}`;
            // Check if team is a favorite
            let teamAbbrev: string = '';
            if (team.teamAbbrev && typeof team.teamAbbrev === 'object' && 'default' in team.teamAbbrev) {
              teamAbbrev = (team.teamAbbrev as { default: string }).default;
            } else if (typeof team.teamAbbrev === 'string') {
              teamAbbrev = team.teamAbbrev;
            } else if (typeof team.team?.abbreviation === 'string') {
              teamAbbrev = team.team.abbreviation;
            }
            const isFavorite = favoriteTeams.includes(teamAbbrev);
            
            return (
              <TeamRow
                key={uniqueKey}
                team={team}
                showRank={showRank}
                rank={index + 1}
                isFavorite={isFavorite}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
