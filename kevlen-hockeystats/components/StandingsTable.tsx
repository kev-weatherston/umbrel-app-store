import { TeamRecord } from '@/lib/types';
import TeamRow from './TeamRow';

interface StandingsTableProps {
  teams: TeamRecord[];
  showRank?: boolean;
  title?: string;
}

export default function StandingsTable({ teams, showRank = true, title }: StandingsTableProps) {
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
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Pts
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {teams.map((team, index) => (
            <TeamRow
              key={team.team.id}
              team={team}
              showRank={showRank}
              rank={index + 1}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
