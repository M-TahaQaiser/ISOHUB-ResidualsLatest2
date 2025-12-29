import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { formatCurrency, type MerchantTrends } from "@/lib/reportAnalytics";

interface TrendingMerchantsCardProps {
  trends: MerchantTrends;
  className?: string;
}

export default function TrendingMerchantsCard({ trends, className }: TrendingMerchantsCardProps) {
  const { newMerchants, lostMerchants, retainedCount } = trends;

  const totalNewRevenue = newMerchants.reduce((sum, m) => sum + m.revenue, 0);
  const totalLostRevenue = lostMerchants.reduce((sum, m) => sum + m.revenue, 0);
  const netRevenueChange = totalNewRevenue - totalLostRevenue;

  return (
    <Card className={className} data-testid="card-trending-merchants">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Merchant Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-new-count">
                +{newMerchants.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">New</div>
              <div className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(totalNewRevenue)}
              </div>
            </div>
            
            <div className="text-center p-3 bg-blue-500/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-retained-count">
                {retainedCount}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Retained</div>
            </div>
            
            <div className="text-center p-3 bg-red-500/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-lost-count">
                -{lostMerchants.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Lost</div>
              <div className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
                {formatCurrency(totalLostRevenue)}
              </div>
            </div>
          </div>

          {/* Net Change */}
          <div className={`text-center p-4 rounded-lg ${
            netRevenueChange > 0 
              ? 'bg-green-500/10 border border-green-500/20' 
              : netRevenueChange < 0 
              ? 'bg-red-500/10 border border-red-500/20'
              : 'bg-muted/50'
          }`}>
            <div className="flex items-center justify-center gap-2">
              {netRevenueChange > 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : netRevenueChange < 0 ? (
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              )}
              <div className={`text-2xl font-bold ${
                netRevenueChange > 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : netRevenueChange < 0 
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
              }`} data-testid="text-net-change">
                {netRevenueChange > 0 && '+'}{formatCurrency(netRevenueChange)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Net Revenue Change</div>
          </div>

          {/* Top New Merchants */}
          {newMerchants.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                Top New Merchants:
              </div>
              {newMerchants.slice(0, 3).map((merchant, index) => (
                <div 
                  key={merchant.merchantId}
                  className="flex items-center justify-between text-sm bg-green-500/5 p-2 rounded"
                  data-testid={`new-merchant-${index}`}
                >
                  <span className="truncate max-w-[180px]" title={merchant.name}>
                    {merchant.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(merchant.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Top Lost Merchants */}
          {lostMerchants.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                Top Lost Merchants:
              </div>
              {lostMerchants.slice(0, 3).map((merchant, index) => (
                <div 
                  key={merchant.merchantId}
                  className="flex items-center justify-between text-sm bg-red-500/5 p-2 rounded"
                  data-testid={`lost-merchant-${index}`}
                >
                  <span className="truncate max-w-[180px]" title={merchant.name}>
                    {merchant.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {formatCurrency(merchant.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {newMerchants.length === 0 && lostMerchants.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Not enough data to calculate merchant trends.<br/>
              Upload data for multiple months to see trends.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
