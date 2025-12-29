import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Shield } from "lucide-react";
import { formatCurrency, formatPercent, type RevenueConcentration } from "@/lib/reportAnalytics";

interface RevenueConcentrationCardProps {
  concentration: RevenueConcentration;
  className?: string;
}

export default function RevenueConcentrationCard({ concentration, className }: RevenueConcentrationCardProps) {
  const { concentrationPercent, riskLevel, topMerchants } = concentration;

  const getRiskConfig = () => {
    switch (riskLevel) {
      case 'low':
        return {
          color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
          icon: <Shield className="h-4 w-4" />,
          label: 'Low Risk',
          description: 'Healthy revenue distribution',
        };
      case 'medium':
        return {
          color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
          icon: <TrendingUp className="h-4 w-4" />,
          label: 'Medium Risk',
          description: 'Monitor top clients closely',
        };
      case 'high':
        return {
          color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
          icon: <AlertTriangle className="h-4 w-4" />,
          label: 'High Risk',
          description: 'Concentration risk detected',
        };
    }
  };

  const riskConfig = getRiskConfig();

  return (
    <Card className={className} data-testid="card-revenue-concentration">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Revenue Concentration</CardTitle>
          <Badge variant="outline" className={`${riskConfig.color} flex items-center gap-1`}>
            {riskConfig.icon}
            {riskConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Metric */}
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <div className="text-4xl font-bold text-foreground" data-testid="text-concentration-percent">
              {formatPercent(concentrationPercent, 1)}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Top {topMerchants.length} merchants = {formatPercent(concentrationPercent, 1)} of total revenue
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {riskConfig.description}
            </div>
          </div>

          {/* Top Merchants Breakdown */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground">
              Top Revenue Sources:
            </div>
            {topMerchants.slice(0, 5).map((merchant, index) => (
              <div 
                key={merchant.merchantId}
                className="flex items-center justify-between text-sm"
                data-testid={`merchant-${index}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">#{index + 1}</span>
                  <span className="truncate max-w-[200px]" title={merchant.name}>
                    {merchant.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatCurrency(merchant.revenue)}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {formatPercent(merchant.percentOfTotal, 1)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Risk Guidance */}
          <div className="pt-3 border-t text-xs text-muted-foreground">
            <strong>Recommended:</strong> {riskLevel === 'high' 
              ? 'Diversify client base to reduce dependency on top merchants.'
              : riskLevel === 'medium'
              ? 'Maintain current relationships while seeking new opportunities.'
              : 'Continue balanced growth strategy.'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
