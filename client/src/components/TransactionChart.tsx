import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface TransactionChartProps {
  data: Array<{
    month: string;
    totalRevenue: number;
    totalNet: number;
    totalTransactions: number;
    merchantCount: number;
  }>;
}

export default function TransactionChart({ data }: TransactionChartProps) {
  // Format month for display (YYYY-MM to MMM YY)
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Format number with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const chartData = data.map(item => ({
    month: formatMonth(item.month),
    transactions: Number(item.totalTransactions),
    merchants: Number(item.merchantCount),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-800 border border-yellow-400/30 p-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-2 text-white">{label}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-300">
              <span className="text-yellow-400">● Transactions: </span>
              <span className="font-medium text-white">{formatNumber(payload[0].value)}</span>
            </p>
            <p className="text-sm text-gray-300">
              <span className="text-blue-400">● Merchants: </span>
              <span className="font-medium text-white">{formatNumber(payload[1].value)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card data-testid="card-transaction-chart" className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <BarChart3 className="h-5 w-5 text-yellow-400" />
          Transaction Volume
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', color: '#d1d5db' }}
              />
              <Bar 
                dataKey="transactions" 
                fill="#facc15" 
                radius={[8, 8, 0, 0]}
                name="Transactions"
              />
              <Bar 
                dataKey="merchants" 
                fill="#3b82f6" 
                radius={[8, 8, 0, 0]}
                name="Active Merchants"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
