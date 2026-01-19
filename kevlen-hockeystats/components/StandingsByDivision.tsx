import { StandingsRecord } from '@/lib/types';
import StandingsTable from './StandingsTable';

interface StandingsByDivisionProps {
  records: StandingsRecord[];
}

export default function StandingsByDivision({ records }: StandingsByDivisionProps) {
  return (
    <div className="space-y-8">
      {records.map((record, index) => {
        // Use division name or abbreviation as key since division.id might not be unique
        const divisionKey = record.division.name || record.division.abbreviation || record.division.nameShort || `division-${index}`;
        return (
          <div key={divisionKey}>
            <StandingsTable
              teams={record.teamRecords}
              showRank={true}
              title={record.division.name}
            />
          </div>
        );
      })}
    </div>
  );
}
