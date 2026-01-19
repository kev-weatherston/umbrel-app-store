import { TeamRecord } from '@/lib/types';
import { getTeamLogoUrl } from '@/lib/nhl-api';
import Image from 'next/image';

interface TeamRowProps {
  team: TeamRecord;
  showRank?: boolean;
  rank?: number;
  isFavorite?: boolean;
}

export default function TeamRow({ team, showRank = false, rank, isFavorite = false }: TeamRowProps) {
  // Handle both API structures
  // teamAbbrev is an object with a 'default' property: { default: "COL" }
  let teamAbbrev: string;
  if (team.teamAbbrev && typeof team.teamAbbrev === 'object' && 'default' in team.teamAbbrev) {
    teamAbbrev = (team.teamAbbrev as { default: string }).default;
  } else if (typeof team.teamAbbrev === 'string') {
    teamAbbrev = team.teamAbbrev;
  } else if (typeof team.team?.abbreviation === 'string') {
    teamAbbrev = team.team.abbreviation;
  } else {
    teamAbbrev = '';
  }
  
  // teamName is also an object with 'default' property
  const teamName = team.placeName?.default || 
                   (team.teamName && typeof team.teamName === 'object' ? team.teamName.default : team.teamName) || 
                   team.team?.name || 
                   'Unknown';
  const gamesPlayed = team.gamesPlayed || 0;
  const wins = team.wins || team.leagueRecord?.wins || 0;
  const losses = team.losses || team.leagueRecord?.losses || 0;
  const otLosses = team.otLosses || team.leagueRecord?.ot || 0;
  const points = team.points || 0;
  
  const logoUrl = teamAbbrev ? getTeamLogoUrl(teamAbbrev) : '';

  return (
    <tr className={`
      transition-colors
      ${isFavorite 
        ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-l-4 border-blue-500' 
        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }
    `}>
      {showRank && (
        <td className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
          {rank}
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <div className="w-8 h-8 flex-shrink-0">
              <Image
                src={logoUrl}
                alt={teamName}
                width={32}
                height={32}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
          )}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {teamName}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-gray-100">
        {points}
      </td>
      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
        {gamesPlayed}
      </td>
      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
        {wins}
      </td>
      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
        {losses}
      </td>
      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
        {otLosses}
      </td>
    </tr>
  );
}
