import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, RefreshCw, Database, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DataIntegrityStatus {
  status: 'healthy' | 'degraded' | 'critical';
  organizationCount: number;
  missingRequired: number;
  lastChecked: string;
}

interface FullIntegrityReport {
  timestamp: string;
  environment: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  checks: Array<{
    table: string;
    expectedMinCount: number;
    actualCount: number;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    critical: boolean;
  }>;
  requiredOrganizations: {
    expected: string[];
    missing: string[];
    present: string[];
  };
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export function DataIntegrityWidget() {
  const { data: quickStatus, isLoading, refetch, isRefetching } = useQuery<DataIntegrityStatus>({
    queryKey: ['/api/health/data-integrity/quick'],
    refetchInterval: 60000,
  });

  const statusConfig = {
    healthy: {
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      icon: CheckCircle,
      label: 'Healthy',
    },
    degraded: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: AlertTriangle,
      label: 'Degraded',
    },
    critical: {
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      icon: AlertTriangle,
      label: 'Critical',
    },
  };

  if (isLoading) {
    return (
      <Card data-testid="data-integrity-widget-loading">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Integrity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  const status = quickStatus?.status || 'healthy';
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className={config.bgColor} data-testid="data-integrity-widget">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Integrity
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-6 w-6 p-0"
            data-testid="refresh-data-integrity"
          >
            <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${config.textColor}`} />
          <Badge variant="outline" className={config.textColor} data-testid="data-integrity-status">
            {config.label}
          </Badge>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2" data-testid="org-count">
            <Building2 className="h-3 w-3" />
            <span>{quickStatus?.organizationCount || 0} Organizations</span>
          </div>
          
          {quickStatus?.missingRequired && quickStatus.missingRequired > 0 && (
            <div className="flex items-center gap-2 text-yellow-600" data-testid="missing-orgs-warning">
              <AlertTriangle className="h-3 w-3" />
              <span>{quickStatus.missingRequired} Required Missing</span>
            </div>
          )}
        </div>

        {quickStatus?.lastChecked && (
          <p className="text-xs text-muted-foreground">
            Last checked: {new Date(quickStatus.lastChecked).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function DataIntegrityDetails() {
  const { data: report, isLoading, refetch, isRefetching } = useQuery<FullIntegrityReport>({
    queryKey: ['/api/health/data-integrity'],
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card data-testid="data-integrity-details-loading">
        <CardHeader>
          <CardTitle>Data Integrity Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card data-testid="data-integrity-details-error">
        <CardHeader>
          <CardTitle>Data Integrity Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load report</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="data-integrity-details">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Data Integrity Report</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            data-testid="refresh-full-report"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg" data-testid="total-checks">
            <p className="text-2xl font-bold">{report.summary.totalChecks}</p>
            <p className="text-xs text-muted-foreground">Total Checks</p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg" data-testid="passed-checks">
            <p className="text-2xl font-bold text-green-600">{report.summary.passed}</p>
            <p className="text-xs text-muted-foreground">Passed</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg" data-testid="failed-checks">
            <p className="text-2xl font-bold text-red-600">{report.summary.failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg" data-testid="warning-checks">
            <p className="text-2xl font-bold text-yellow-600">{report.summary.warnings}</p>
            <p className="text-xs text-muted-foreground">Warnings</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">Required Organizations</h4>
          <div className="space-y-1">
            {report.requiredOrganizations.expected.map((orgId) => {
              const isPresent = report.requiredOrganizations.present.includes(orgId);
              return (
                <div 
                  key={orgId} 
                  className="flex items-center gap-2 text-sm"
                  data-testid={`org-status-${orgId}`}
                >
                  {isPresent ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={isPresent ? '' : 'text-red-600'}>{orgId}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">Table Checks</h4>
          <div className="space-y-2">
            {report.checks.map((check, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between text-sm p-2 rounded border"
                data-testid={`check-${check.table}`}
              >
                <div className="flex items-center gap-2">
                  {check.status === 'pass' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {check.status === 'fail' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {check.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  <span>{check.table}</span>
                  {check.critical && (
                    <Badge variant="destructive" className="text-xs">Critical</Badge>
                  )}
                </div>
                <span className="text-muted-foreground">{check.actualCount} records</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Environment: {report.environment} | Last updated: {new Date(report.timestamp).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}
