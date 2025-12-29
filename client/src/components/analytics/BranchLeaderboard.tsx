import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';

interface BranchData {
  rank: number;
  branchId: string;
  branchName?: string;
  revenue: number;
  accounts: number;
  avgPerAccount: number;
  retentionRate: number;
}

interface BranchLeaderboardProps {
  data: BranchData[];
  title?: string;
  subtitle?: string;
}

const formatCurrency = (value: number) => {
  // Round to 2 decimal places to fix floating point precision issues
  const rounded = Math.round(value * 100) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-4 w-4 text-yellow-400" />;
    case 2:
      return <Medal className="h-4 w-4 text-gray-300" />;
    case 3:
      return <Award className="h-4 w-4 text-amber-600" />;
    default:
      return null;
  }
};

const getRetentionColor = (rate: number) => {
  if (rate >= 90) return 'bg-green-500';
  if (rate >= 75) return 'bg-yellow-500';
  if (rate >= 50) return 'bg-orange-500';
  return 'bg-red-500';
};

export function BranchLeaderboard({ 
  data, 
  title = "Branch Performance Leaderboard",
  subtitle
}: BranchLeaderboardProps) {
  return (
    <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 transition-colors">
      <CardHeader className="pb-3">
        <div>
          <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-zinc-400 text-sm mt-1">{subtitle}</p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-700/50">
                <th className="text-left text-zinc-400 text-sm font-medium py-3 px-2">Rank</th>
                <th className="text-left text-zinc-400 text-sm font-medium py-3 px-2">Branch ID</th>
                <th className="text-right text-zinc-400 text-sm font-medium py-3 px-2">Revenue</th>
                <th className="text-right text-zinc-400 text-sm font-medium py-3 px-2">Accounts</th>
                <th className="text-right text-zinc-400 text-sm font-medium py-3 px-2">Avg/Account</th>
                <th className="text-right text-zinc-400 text-sm font-medium py-3 px-2">Retention</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-zinc-500 py-8">
                    No branch data available
                  </td>
                </tr>
              ) : (
                data.map((branch, index) => (
                  <tr 
                    key={branch.branchId}
                    className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                      index < 3 ? 'bg-zinc-800/20' : ''
                    }`}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {getRankIcon(branch.rank)}
                        <span className={`text-sm font-medium ${
                          branch.rank <= 3 ? 'text-yellow-400' : 'text-zinc-300'
                        }`}>
                          #{branch.rank}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-white font-medium">
                        {branch.branchName || `Branch ${branch.branchId}`}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-white tabular-nums">
                        {formatCurrency(branch.revenue)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-zinc-300 tabular-nums">
                        {branch.accounts}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-zinc-300 tabular-nums">
                        {formatCurrency(branch.avgPerAccount)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium text-white ${getRetentionColor(branch.retentionRate)}`}>
                        {branch.retentionRate.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default BranchLeaderboard;
