import { StandingsRecord } from '@/lib/types';
import StandingsTable from './StandingsTable';

interface StandingsByDivisionProps {
  records: StandingsRecord[];
}

export default function StandingsByDivision({ records }: StandingsByDivisionProps) {
  return (
    <div className="space-y-8">
      {records.map((record) => (
        <div key={record.division.id}>
          <StandingsTable
            teams={record.teamRecords}
            showRank={true}
            title={record.division.name}
          />
        </div>
      ))}
    </div>
  );
}
