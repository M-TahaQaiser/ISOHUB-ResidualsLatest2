import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  subtitle?: string;
  subtitleValue?: string;
  tooltip?: string;
  variant?: 'default' | 'revenue' | 'accounts' | 'retention' | 'attrition';
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  className, 
  subtitle, 
  subtitleValue, 
  tooltip,
  variant = 'default'
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === null) return null;
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === null) return 'text-zinc-400';
    if (variant === 'attrition') {
      if (change > 0) return 'text-red-400';
      if (change < 0) return 'text-green-400';
    } else {
      if (change > 0) return 'text-green-400';
      if (change < 0) return 'text-red-400';
    }
    return 'text-zinc-400';
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'revenue':
        return 'border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 to-transparent';
      case 'accounts':
        return 'border-blue-400/30 bg-gradient-to-br from-blue-400/10 to-transparent';
      case 'retention':
        return 'border-green-400/30 bg-gradient-to-br from-green-400/10 to-transparent';
      case 'attrition':
        return 'border-red-400/30 bg-gradient-to-br from-red-400/10 to-transparent';
      default:
        return 'border-yellow-400/20 bg-zinc-900/80';
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case 'revenue':
        return 'bg-yellow-400/20 text-yellow-400';
      case 'accounts':
        return 'bg-blue-400/20 text-blue-400';
      case 'retention':
        return 'bg-green-400/20 text-green-400';
      case 'attrition':
        return 'bg-red-400/20 text-red-400';
      default:
        return 'bg-yellow-400/20 text-yellow-400';
    }
  };

  return (
    <Card 
      className={cn(
        'p-6 border backdrop-blur-sm transition-all duration-200 hover:border-yellow-400/40',
        getVariantStyles(),
        className
      )}
      data-testid={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-zinc-400">{title}</p>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex"
                    data-testid={`help-${title.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-label={`Help: ${title}`}
                  >
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
          <div className={cn('p-2 rounded-lg', getIconStyles())}>
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p 
          className="text-3xl font-bold text-white tabular-nums" 
          data-testid={`metric-value-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {value}
        </p>

        {(change !== undefined && change !== null) && (
          <div className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}>
            {getTrendIcon()}
            <span>
              {change > 0 && '+'}
              {change.toFixed(1)}%
            </span>
            {changeLabel && <span className="text-zinc-400 ml-1">{changeLabel}</span>}
          </div>
        )}

        {subtitle && subtitleValue && (
          <div className="text-sm text-zinc-400 pt-2 border-t border-zinc-700/50">
            <span className="font-medium">{subtitle}:</span>{' '}
            <span className="tabular-nums text-zinc-300">{subtitleValue}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

interface MetricGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetricGrid({ children, columns = 4, className }: MetricGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div 
      className={cn('grid gap-4', gridCols[columns], className)}
      data-testid="metric-grid"
    >
      {children}
    </div>
  );
}

export default MetricCard;
