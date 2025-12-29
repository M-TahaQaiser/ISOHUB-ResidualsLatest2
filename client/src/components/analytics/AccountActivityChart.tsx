import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AccountActivityData {
  month: string;
  retained: number;
  new: number;
  lost: number;
}

interface AccountActivityChartProps {
  data: AccountActivityData[];
  title?: string;
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
        <p className="text-zinc-400 text-xs mb-2">{formatMonth(label)}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="text-zinc-300 text-sm capitalize">{entry.name}:</span>
            <span className={`font-semibold ${
              entry.name === 'retained' ? 'text-green-400' :
              entry.name === 'new' ? 'text-blue-400' :
              'text-red-400'
            }`}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLegend = () => (
  <div className="flex items-center justify-center gap-6 mt-4 pt-2 border-t border-zinc-700/50">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 bg-green-500 rounded-sm" />
      <span className="text-zinc-400 text-sm">Retained</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 bg-blue-500 rounded-sm" />
      <span className="text-zinc-400 text-sm">New</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 bg-red-500 rounded-sm" />
      <span className="text-zinc-400 text-sm">Lost</span>
    </div>
  </div>
);

export function AccountActivityChart({ 
  data, 
  title = "Account Activity" 
}: AccountActivityChartProps) {
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
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="retained" stackId="a" fill="#22C55E" radius={[0, 0, 0, 0]} />
              <Bar dataKey="new" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="lost" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <CustomLegend />
      </CardContent>
    </Card>
  );
}

export default AccountActivityChart;
