import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, HelpCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsMetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  subtitleValue?: string;
  tooltip?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  className?: string;
}

export function AnalyticsMetricCard({ 
  title, 
  value, 
  change, 
  changeLabel,
  icon, 
  subtitle, 
  subtitleValue, 
  tooltip,
  riskLevel,
  className
}: AnalyticsMetricCardProps) {
  const getTrendColor = () => {
    if (change === undefined || change === null) return 'text-zinc-400';
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-zinc-400';
  };

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-400 bg-green-400/10';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10';
      case 'HIGH': return 'text-red-400 bg-red-400/10';
      default: return '';
    }
  };

  return (
    <Card 
      className={cn(
        'p-5 bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 transition-colors',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-zinc-400">{title}</p>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex">
                    <HelpCircle className="w-4 h-4 text-zinc-500 hover:text-zinc-300 cursor-help" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-zinc-800 border-zinc-700 text-zinc-100">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-yellow-400/10 text-yellow-400">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-3xl font-bold text-white tabular-nums">
          {value}
        </p>

        {(change !== undefined && change !== null) && (
          <div className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}>
            {change > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : change < 0 ? (
              <TrendingDown className="w-4 h-4" />
            ) : null}
            <span>
              {change > 0 && '+'}
              {change.toFixed(1)}%
            </span>
            {changeLabel && <span className="text-zinc-400 ml-1">{changeLabel}</span>}
          </div>
        )}

        {riskLevel && (
          <div className={cn('flex items-center gap-2 text-sm font-medium px-2 py-1 rounded-md w-fit', getRiskColor())}>
            <AlertTriangle className="w-4 h-4" />
            <span>Risk Level: {riskLevel}</span>
          </div>
        )}

        {subtitle && subtitleValue && (
          <div className="text-sm text-zinc-400 pt-2 border-t border-zinc-700/50">
            <span className="font-medium">{subtitle}:</span>{' '}
            <span className="text-zinc-300 tabular-nums">{subtitleValue}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export default AnalyticsMetricCard;
