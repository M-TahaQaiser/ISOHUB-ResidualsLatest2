import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RevenueTrendData {
  month: string;
  revenue: number;
  label?: string;
}

interface RevenueTrendChartProps {
  data: RevenueTrendData[];
  title?: string;
  showTrend?: boolean;
  trendPercent?: number;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value.toFixed(0)}`;
};

const formatMonth = (month: string) => {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', '/');
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 border border-yellow-400/30 rounded-lg p-3 shadow-xl">
        <p className="text-zinc-400 text-xs mb-1">{formatMonth(label)}</p>
        <p className="text-white font-semibold">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueTrendChart({ 
  data, 
  title = "Revenue Trend",
  showTrend = false,
  trendPercent = 0
}: RevenueTrendChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    formattedMonth: formatMonth(item.month)
  }));

  return (
    <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
            {title}
          </CardTitle>
          {showTrend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
              trendPercent >= 0 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {trendPercent >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {trendPercent >= 0 ? '+' : ''}{trendPercent.toFixed(1)}% trend
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#374151" 
                vertical={false}
              />
              <XAxis 
                dataKey="formattedMonth" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickFormatter={formatCurrency}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#FACC15"
                strokeWidth={2}
                dot={{ fill: '#FACC15', strokeWidth: 2, r: 4 }}
                activeDot={{ fill: '#FACC15', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 pt-2 border-t border-zinc-700/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-yellow-400 rounded" />
            <span className="text-zinc-400 text-sm">Revenue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RevenueTrendChart;
