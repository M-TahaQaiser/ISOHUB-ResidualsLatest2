import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Flame, Snowflake } from 'lucide-react';

interface MerchantChange {
  id: number | string;
  name: string;
  previousRevenue: number;
  currentRevenue: number;
  changePercent: number;
}

interface TopGainersLosersProps {
  gainers: MerchantChange[];
  losers: MerchantChange[];
  limit?: number;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value.toLocaleString()}`;
};

const formatPercent = (value: number) => {
  if (Math.abs(value) >= 10000) {
    return `${value >= 0 ? '+' : ''}${(value / 1000).toFixed(0)}k%`;
  }
  return `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`;
};

export function TopGainersLosers({ 
  gainers, 
  losers, 
  limit = 5 
}: TopGainersLosersProps) {
  const topGainers = gainers.slice(0, limit);
  const topLosers = losers.slice(0, limit);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            Top Gainers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topGainers.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4 text-center">No gainers this period</p>
          ) : (
            topGainers.map((merchant, index) => (
              <div 
                key={merchant.id}
                className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-green-500/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{merchant.name}</p>
                  <p className="text-zinc-400 text-sm">
                    {formatCurrency(merchant.previousRevenue)} → {formatCurrency(merchant.currentRevenue)}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-sm font-medium ml-3">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {formatPercent(merchant.changePercent)}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 transition-colors">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-blue-400" />
            Top Decliners
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topLosers.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4 text-center">No decliners this period</p>
          ) : (
            topLosers.map((merchant, index) => (
              <div 
                key={merchant.id}
                className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-red-500/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{merchant.name}</p>
                  <p className="text-zinc-400 text-sm">
                    {formatCurrency(merchant.previousRevenue)} → {formatCurrency(merchant.currentRevenue)}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full text-sm font-medium ml-3">
                  <TrendingDown className="h-3.5 w-3.5" />
                  {formatPercent(merchant.changePercent)}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TopGainersLosers;
