import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface RetentionData {
  month: string;
  rate: number;
}

interface RetentionRateChartProps {
  data: RetentionData[];
  title?: string;
  benchmarkRate?: number;
}

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
          {payload[0].value.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export function RetentionRateChart({ 
  data, 
  title = "Retention Rate",
  benchmarkRate = 95
}: RetentionRateChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    formattedMonth: formatMonth(item.month)
  }));

  return (
    <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickFormatter={(value) => `${value}%`}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={benchmarkRate} 
                stroke="#FACC15" 
                strokeDasharray="5 5"
                label={{ 
                  value: `${benchmarkRate}% Benchmark`, 
                  position: 'right',
                  fill: '#FACC15',
                  fontSize: 11
                }}
              />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#84CC16"
                strokeWidth={2}
                dot={{ fill: '#84CC16', strokeWidth: 2, r: 4 }}
                activeDot={{ fill: '#84CC16', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 pt-2 border-t border-zinc-700/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-lime-500 rounded" />
            <span className="text-zinc-400 text-sm">Retention Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-yellow-400 rounded border-dashed" style={{ borderStyle: 'dashed' }} />
            <span className="text-zinc-400 text-sm">{benchmarkRate}% Benchmark</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RetentionRateChart;
