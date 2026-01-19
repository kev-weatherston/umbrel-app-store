import { TeamRecord } from '@/lib/types';
import { getTeamLogoUrl } from '@/lib/nhl-api';
import Image from 'next/image';

interface TeamRowProps {
  team: TeamRecord;
  showRank?: boolean;
  rank?: number;
}

export default function TeamRow({ team, showRank = false, rank }: TeamRowProps) {
  const logoUrl = getTeamLogoUrl(team.team.abbreviation);

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      {showRank && (
        <td className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
          {rank}
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex-shrink-0">
            <Image
              src={logoUrl}
              alt={team.team.name}
              width={32}
              height={32}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {team.team.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
        {team.gamesPlayed}
      </td>
      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
        {team.leagueRecord.wins}
      </td>
      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
        {team.leagueRecord.losses}
      </td>
      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
        {team.leagueRecord.ot}
      </td>
      <td className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-gray-100">
        {team.points}
      </td>
    </tr>
  );
}
