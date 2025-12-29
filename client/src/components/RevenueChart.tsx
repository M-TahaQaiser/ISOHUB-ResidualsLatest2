import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign } from "lucide-react";

interface RevenueChartProps {
  data: Array<{
    month: string;
    totalRevenue: number;
    totalNet: number;
    totalTransactions: number;
    merchantCount: number;
  }>;
  timeRange: string;
}

export default function RevenueChart({ data, timeRange }: RevenueChartProps) {
  // Format month for display (YYYY-MM to MMM YY)
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Format currency for tooltips
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartData = data.map(item => ({
    month: formatMonth(item.month),
    revenue: Number(item.totalRevenue),
    net: Number(item.totalNet),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800 border border-yellow-400/30 p-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-2 text-white">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-300">
              <span className="text-yellow-400">● Revenue: </span>
              <span className="font-medium text-white">{formatCurrency(payload[0].value)}</span>
            </p>
            <p className="text-sm text-gray-300">
              <span className="text-green-500">● Net: </span>
              <span className="font-medium text-white">{formatCurrency(payload[1].value)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card data-testid="card-revenue-chart" className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5 text-yellow-400" />
          Revenue Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: '#9ca3af' }}
                stroke="#374151"
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: '#9ca3af' }}
                stroke="#374151"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', color: '#d1d5db' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#facc15" 
                strokeWidth={2}
                dot={{ fill: '#facc15', r: 4 }}
                activeDot={{ r: 6 }}
                name="Total Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="net" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
                name="Net Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
