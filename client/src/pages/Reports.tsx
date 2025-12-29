import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RevenueTrendChart, 
  AccountActivityChart, 
  RetentionRateChart, 
  TopGainersLosers, 
  BranchLeaderboard,
  AnalyticsMetricCard 
} from "@/components/analytics";
import AdvancedReportBuilder from "@/components/AdvancedReportBuilder";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/use-organization";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Download,
  Calendar,
  BarChart3,
  Settings,
  ChevronDown,
  Check,
  FileText,
  GitCompare
} from "lucide-react";

interface MetricsData {
  metrics: Array<{
    month: string;
    totalRevenue: number;
    totalAccounts: number;
    retentionRate: number;
    revenuePerAccount: number;
    newAccounts: number;
    lostAccounts: number;
    retainedAccounts: number;
    momRevenueChangePercent: number | null;
  }>;
  aggregated: {
    totalRevenue: number;
    netAccountGrowth: number;
  };
}

interface ComparisonData {
  momChange: number;
}

interface ConcentrationData {
  concentration: number;
  riskLevel: string;
}

interface GainersLosersData {
  gainers: Array<{
    id: number;
    name: string;
    previousRevenue: number;
    currentRevenue: number;
    changePercent: number;
  }>;
  losers: Array<{
    id: number;
    name: string;
    previousRevenue: number;
    currentRevenue: number;
    changePercent: number;
  }>;
}

interface LeaderboardData {
  subtitle?: string;
  branches: Array<{
    rank: number;
    branchId: string;
    branchName: string;
    revenue: number;
    accounts: number;
    avgPerAccount: number;
    retentionRate: number;
  }>;
}

interface TrendsData {
  trends: Array<{
    month: string;
    totalNet: number;
  }>;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${Math.round(value).toLocaleString()}`;
  }
  return `$${value.toFixed(2)}`;
};

const VIEW_OPTIONS = [
  { value: "overview", label: "Overview", icon: BarChart3 },
  { type: "separator", label: "Processors" },
  { value: "global", label: "Global Payments" },
  { value: "trx", label: "TRX" },
  { value: "micamp", label: "MiCamp" },
  { value: "shift4", label: "Shift4" },
  { value: "merchant-lynx", label: "Merchant Lynx" },
  { value: "fiserv-omaha", label: "Fiserv Omaha" },
  { value: "payment-advisors", label: "Payment Advisors" },
  { value: "rectangle-health", label: "Rectangle Health" },
  { value: "clearent", label: "Clearent" },
  { type: "separator", label: "Tools" },
  { value: "data-validation", label: "Data Validation", icon: AlertTriangle },
  { value: "compare", label: "Compare", icon: GitCompare },
  { value: "reports", label: "Reports", icon: FileText },
];

const BRANCH_OPTIONS = [
  { value: "all", label: "All Branches" },
  { value: "global", label: "Global Payments" },
  { value: "trx", label: "TRX" },
  { value: "micamp", label: "MiCamp" },
  { value: "shift4", label: "Shift4" },
  { value: "merchant-lynx", label: "Merchant Lynx" },
  { value: "fiserv-omaha", label: "Fiserv Omaha" },
  { value: "payment-advisors", label: "Payment Advisors" },
  { value: "rectangle-health", label: "Rectangle Health" },
  { value: "clearent", label: "Clearent" },
];

export default function Reports() {
  const [, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState("overview");
  const [branchFilter, setBranchFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const { organizationId, hasSelectedOrganization } = useOrganization();

  const getNextMonth = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}/${nextMonth.getFullYear().toString().slice(-2)}`;
  };

  // Fetch comprehensive metrics - with organization filtering
  const { data: metricsData, isLoading: metricsLoading } = useQuery<MetricsData>({
    queryKey: ['/api/analytics/metrics', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/metrics?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    enabled: hasSelectedOrganization,
  });

  // Fetch revenue trends - with organization filtering
  const { data: trendsData, isLoading: trendsLoading } = useQuery<TrendsData>({
    queryKey: ['/api/analytics/trends', '1y', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/trends?timeRange=1y&organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch trends');
      return response.json();
    },
    enabled: hasSelectedOrganization,
  });

  // Fetch comparison data for MoM changes - with organization filtering
  const { data: comparisonData } = useQuery<ComparisonData>({
    queryKey: ['/api/analytics/comparison', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/comparison?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch comparison');
      return response.json();
    },
    enabled: hasSelectedOrganization,
  });

  // Fetch concentration data - with organization filtering
  const { data: concentrationData } = useQuery<ConcentrationData>({
    queryKey: ['/api/analytics/concentration', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/concentration?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch concentration');
      return response.json();
    },
    enabled: hasSelectedOrganization,
  });

  // Fetch gainers and losers - with organization filtering
  const { data: gainersLosersData } = useQuery<GainersLosersData>({
    queryKey: ['/api/analytics/gainers-losers', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/gainers-losers?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch gainers/losers');
      return response.json();
    },
    enabled: hasSelectedOrganization,
  });

  // Fetch branch leaderboard - with organization filtering
  const { data: leaderboardData } = useQuery<LeaderboardData>({
    queryKey: ['/api/analytics/branch-leaderboard', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/branch-leaderboard?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json();
    },
    enabled: hasSelectedOrganization,
  });

  // Fetch data validation - with organization filtering
  const { data: validationData, isLoading: validationLoading } = useQuery<any>({
    queryKey: ['/api/analytics/data-validation', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/data-validation?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Failed to fetch validation');
      return response.json();
    },
    enabled: hasSelectedOrganization && currentView === 'data-validation',
  });

  // Fetch processors for name mapping
  const { data: processorsData } = useQuery<any[]>({
    queryKey: ['/api/processors'],
    enabled: currentView === 'data-validation',
  });

  const getProcessorName = (id: number) => {
    const processor = processorsData?.find((p: any) => p.id === id);
    return processor?.name || `Processor ${id}`;
  };

  // Transform metrics for charts
  const revenueTrendData = useMemo(() => {
    if (!trendsData?.trends) return [];
    return trendsData.trends.map((t: any) => ({
      month: t.month,
      revenue: Number(t.totalNet || 0),
    }));
  }, [trendsData]);

  const accountActivityData = useMemo(() => {
    if (!metricsData?.metrics) return [];
    return metricsData.metrics.map((m: any) => ({
      month: m.month,
      retained: m.retainedAccounts || 0,
      new: m.newAccounts || 0,
      lost: m.lostAccounts || 0,
    }));
  }, [metricsData]);

  const retentionData = useMemo(() => {
    if (!metricsData?.metrics) return [];
    return metricsData.metrics.map((m: any) => ({
      month: m.month,
      rate: m.retentionRate || 0,
    }));
  }, [metricsData]);

  // Calculate key metrics
  const latestMetric = metricsData?.metrics?.[metricsData.metrics.length - 1];
  const aggregated = metricsData?.aggregated;
  
  const totalRevenue = aggregated?.totalRevenue || 0;
  const activeAccounts = latestMetric?.totalAccounts || 0;
  const retentionRate = latestMetric?.retentionRate || 0;
  const revenuePerAccount = latestMetric?.revenuePerAccount || 0;
  const momChange = comparisonData?.momChange || 0;
  const concentration = concentrationData?.concentration || 0;
  const riskLevel = concentrationData?.riskLevel || 'LOW';

  // Transform gainers/losers for component
  const gainers = (gainersLosersData?.gainers || []).map((g: any) => ({
    id: g.id,
    name: g.name,
    previousRevenue: g.previousRevenue,
    currentRevenue: g.currentRevenue,
    changePercent: g.changePercent,
  }));

  const losers = (gainersLosersData?.losers || []).map((l: any) => ({
    id: l.id,
    name: l.name,
    previousRevenue: l.previousRevenue,
    currentRevenue: l.currentRevenue,
    changePercent: l.changePercent,
  }));

  // Transform branch data
  const branchData = (leaderboardData?.branches || []).map((b: any) => ({
    rank: b.rank,
    branchId: b.branchId,
    branchName: b.branchName,
    revenue: b.revenue,
    accounts: b.accounts,
    avgPerAccount: b.avgPerAccount,
    retentionRate: b.retentionRate,
  }));

  const exportToCSV = () => {
    try {
      if (!metricsData?.metrics || metricsData.metrics.length === 0) {
        toast({
          variant: "destructive",
          title: "No data to export",
          description: "Please wait for data to load before exporting."
        });
        return;
      }

      const headers = ['Month', 'Revenue', 'Accounts', 'Retention Rate', 'New Accounts', 'Lost Accounts'];
      const rows = metricsData.metrics.map((m: any) => [
        m.month,
        m.totalRevenue,
        m.totalAccounts,
        `${m.retentionRate}%`,
        m.newAccounts,
        m.lostAccounts
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `analytics_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: "Analytics data exported to CSV."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting the data."
      });
    }
  };

  const getCurrentViewLabel = () => {
    const option = VIEW_OPTIONS.find(o => o.value === currentView);
    return option?.label || "Overview";
  };

  const getCurrentBranchLabel = () => {
    const option = BRANCH_OPTIONS.find(o => o.value === branchFilter);
    return option?.label || "All Branches";
  };

  const handleViewChange = (value: string) => {
    setCurrentView(value);
    if (value === "reports") {
      setActiveTab("ai-builder");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20 md:pb-0">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#0d1117] border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">Reports</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-[#161b22] border-zinc-700 text-white hover:bg-zinc-800"
              onClick={exportToCSV}
              data-testid="mobile-export"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Filters - Horizontal Scroll */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <Select value={currentView} onValueChange={handleViewChange}>
            <SelectTrigger 
              className="w-[120px] flex-shrink-0 bg-[#161b22] border-zinc-700 text-white text-sm"
              data-testid="mobile-select-view"
            >
              <SelectValue placeholder="Overview" />
            </SelectTrigger>
            <SelectContent className="bg-[#161b22] border-zinc-700">
              {VIEW_OPTIONS.filter(o => !o.type).map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value!}
                  className="text-white hover:bg-zinc-800"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger 
              className="w-[110px] flex-shrink-0 bg-[#161b22] border-zinc-700 text-white text-sm"
              data-testid="mobile-select-time"
            >
              <Calendar className="h-3 w-3 mr-1.5 text-zinc-400" />
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent className="bg-[#161b22] border-zinc-700">
              <SelectItem value="all" className="text-white hover:bg-zinc-800">All Time</SelectItem>
              <SelectItem value="1y" className="text-white hover:bg-zinc-800">12 Months</SelectItem>
              <SelectItem value="6m" className="text-white hover:bg-zinc-800">6 Months</SelectItem>
              <SelectItem value="3m" className="text-white hover:bg-zinc-800">3 Months</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger 
              className="w-[120px] flex-shrink-0 bg-[#161b22] border-zinc-700 text-white text-sm"
              data-testid="mobile-select-branch"
            >
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-[#161b22] border-zinc-700">
              {BRANCH_OPTIONS.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="text-white hover:bg-zinc-800"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Header Toolbar */}
      <div className="hidden md:block bg-[#0d1117] border-b border-zinc-800 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* View Selector Dropdown */}
          <Select value={currentView} onValueChange={handleViewChange}>
            <SelectTrigger 
              className="w-[160px] bg-[#161b22] border-zinc-700 text-white hover:bg-zinc-800"
              data-testid="select-view"
            >
              <SelectValue placeholder="Overview" />
              <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
            </SelectTrigger>
            <SelectContent className="bg-[#161b22] border-zinc-700 max-h-[400px]">
              {VIEW_OPTIONS.map((option, idx) => {
                if (option.type === "separator") {
                  return (
                    <div key={idx} className="px-2 py-1.5">
                      <Separator className="bg-zinc-700 my-1" />
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">{option.label}</span>
                    </div>
                  );
                }
                const Icon = option.icon;
                return (
                  <SelectItem 
                    key={option.value} 
                    value={option.value!}
                    className="text-white hover:bg-zinc-800 focus:bg-zinc-800"
                  >
                    <div className="flex items-center gap-2">
                      {currentView === option.value && (
                        <Check className="h-4 w-4 text-yellow-400" />
                      )}
                      {Icon && <Icon className="h-4 w-4 text-zinc-400" />}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Branch Filter Dropdown */}
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger 
              className="w-[160px] bg-[#161b22] border-zinc-700 text-white hover:bg-zinc-800"
              data-testid="select-branch"
            >
              <SelectValue placeholder="All Branches" />
              <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
            </SelectTrigger>
            <SelectContent className="bg-[#161b22] border-zinc-700">
              {BRANCH_OPTIONS.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="text-white hover:bg-zinc-800 focus:bg-zinc-800"
                >
                  <div className="flex items-center gap-2">
                    {branchFilter === option.value && (
                      <Check className="h-4 w-4 text-yellow-400" />
                    )}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Time Range Dropdown */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger 
              className="w-[140px] bg-[#161b22] border-zinc-700 text-white hover:bg-zinc-800"
              data-testid="select-time-range"
            >
              <Calendar className="h-4 w-4 mr-2 text-zinc-400" />
              <SelectValue placeholder="All Time" />
              <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
            </SelectTrigger>
            <SelectContent className="bg-[#161b22] border-zinc-700">
              <SelectItem value="all" className="text-white hover:bg-zinc-800 focus:bg-zinc-800">All Time</SelectItem>
              <SelectItem value="1y" className="text-white hover:bg-zinc-800 focus:bg-zinc-800">Last 12 Months</SelectItem>
              <SelectItem value="6m" className="text-white hover:bg-zinc-800 focus:bg-zinc-800">Last 6 Months</SelectItem>
              <SelectItem value="3m" className="text-white hover:bg-zinc-800 focus:bg-zinc-800">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>

          {/* Next Month Button */}
          <Button
            variant="outline"
            className="bg-[#161b22] border-zinc-700 text-white hover:bg-zinc-800"
            data-testid="button-next-month"
          >
            <Calendar className="h-4 w-4 mr-2 text-zinc-400" />
            Next: {getNextMonth()}
          </Button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Export Button */}
          <Button 
            variant="outline" 
            className="bg-[#161b22] border-zinc-700 text-white hover:bg-zinc-800"
            onClick={exportToCSV}
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Settings Button */}
          <Button 
            variant="outline" 
            size="icon"
            className="bg-[#161b22] border-zinc-700 text-white hover:bg-zinc-800"
            data-testid="button-settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">

      {/* Data Validation View */}
      {currentView === 'data-validation' ? (
        <Card className="bg-zinc-900/80 border-yellow-400/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Data Validation - Missing Upload Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validationLoading ? (
              <div className="text-zinc-400 text-center py-8">Loading validation data...</div>
            ) : !validationData?.validation?.length ? (
              <div className="text-zinc-400 text-center py-8">No processor data found for validation</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="text-zinc-400 text-sm">Total Processors</div>
                    <div className="text-2xl font-bold text-white">{validationData.summary?.totalProcessors || 0}</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="text-zinc-400 text-sm">Processors with Gaps</div>
                    <div className="text-2xl font-bold text-yellow-400">{validationData.summary?.processorsWithGaps || 0}</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="text-zinc-400 text-sm">Average Coverage</div>
                    <div className="text-2xl font-bold text-green-400">{Math.round(validationData.summary?.avgCoverage || 0)}%</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="text-left py-3 px-4 text-zinc-400 font-medium text-sm">Processor</th>
                        <th className="text-center py-3 px-4 text-zinc-400 font-medium text-sm">Coverage</th>
                        <th className="text-left py-3 px-4 text-zinc-400 font-medium text-sm">Missing Months</th>
                        <th className="text-center py-3 px-4 text-zinc-400 font-medium text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationData.validation.map((v: any) => (
                        <tr key={v.processorId} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                          <td className="py-3 px-4 text-white font-medium">{getProcessorName(v.processorId)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              v.coverage >= 100 ? 'bg-green-500/20 text-green-400' :
                              v.coverage >= 75 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {Math.round(v.coverage)}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {v.missingMonths.length === 0 ? (
                              <span className="text-green-400 text-sm">None</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {v.missingMonths.slice(0, 6).map((m: string) => (
                                  <span key={m} className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">{m}</span>
                                ))}
                                {v.missingMonths.length > 6 && (
                                  <span className="text-zinc-400 text-xs">+{v.missingMonths.length - 6} more</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {v.hasGaps ? (
                              <span className="text-yellow-400 text-sm">Needs Upload</span>
                            ) : (
                              <span className="text-green-400 text-sm">Complete</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
      <>
      {/* Key Metrics Cards - Mobile: Horizontal Scroll */}
      <div className="md:hidden">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
          <div className="flex-shrink-0 w-[160px] snap-start">
            <AnalyticsMetricCard
              title="Total Revenue"
              value={formatCurrency(totalRevenue)}
              change={momChange}
              icon={<DollarSign className="h-4 w-4" />}
            />
          </div>
          <div className="flex-shrink-0 w-[160px] snap-start">
            <AnalyticsMetricCard
              title="Accounts"
              value={activeAccounts.toLocaleString()}
              subtitle="Growth"
              subtitleValue={`+${aggregated?.netAccountGrowth || 0}`}
              icon={<Users className="h-4 w-4" />}
            />
          </div>
          <div className="flex-shrink-0 w-[160px] snap-start">
            <AnalyticsMetricCard
              title="Retention"
              value={`${retentionRate}%`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>
          <div className="flex-shrink-0 w-[160px] snap-start">
            <AnalyticsMetricCard
              title="Concentration"
              value={`${concentration}%`}
              riskLevel={riskLevel as 'LOW' | 'MEDIUM' | 'HIGH'}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
          </div>
          <div className="flex-shrink-0 w-[160px] snap-start">
            <AnalyticsMetricCard
              title="Avg/Account"
              value={formatCurrency(revenuePerAccount)}
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>
        </div>
        <div className="flex justify-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          ))}
        </div>
      </div>

      {/* Desktop Metrics Grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-4">
        <AnalyticsMetricCard
          title="Total Net Revenue"
          value={formatCurrency(totalRevenue)}
          change={momChange}
          changeLabel="vs last month"
          icon={<DollarSign className="h-5 w-5" />}
          tooltip="Total net revenue across all merchants"
        />
        
        <AnalyticsMetricCard
          title="Active Accounts"
          value={activeAccounts.toLocaleString()}
          subtitle="Net Growth"
          subtitleValue={`+${aggregated?.netAccountGrowth || 0}`}
          icon={<Users className="h-5 w-5" />}
          tooltip="Number of active merchant accounts"
        />
        
        <AnalyticsMetricCard
          title="Retention Rate"
          value={`${retentionRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          tooltip="Percentage of merchants retained from previous month"
        />
        
        <AnalyticsMetricCard
          title="Top 10 Concentration"
          value={`${concentration}%`}
          riskLevel={riskLevel as 'LOW' | 'MEDIUM' | 'HIGH'}
          icon={<AlertTriangle className="h-5 w-5" />}
          tooltip="Percentage of total revenue from top 10 merchants. High concentration (>80%) indicates risk."
        />
        
        <AnalyticsMetricCard
          title="Avg Per Account"
          value={formatCurrency(revenuePerAccount)}
          icon={<BarChart3 className="h-5 w-5" />}
          tooltip="Average revenue per merchant account"
        />
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
        <TabsList className="bg-zinc-900/80 border border-yellow-400/20 p-1 w-full md:w-auto justify-start overflow-x-auto scrollbar-hide">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-zinc-400 text-xs md:text-sm px-3 md:px-4 flex-shrink-0"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="performance" 
            className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-zinc-400 text-xs md:text-sm px-3 md:px-4 flex-shrink-0"
          >
            Performance
          </TabsTrigger>
          <TabsTrigger 
            value="ai-builder" 
            className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-zinc-400 text-xs md:text-sm px-3 md:px-4 flex-shrink-0"
          >
            AI Builder
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="min-h-[250px] md:min-h-[300px]">
              <RevenueTrendChart 
                data={revenueTrendData}
                title="Revenue Trend"
                showTrend={true}
                trendPercent={momChange}
              />
            </div>
            <div className="min-h-[250px] md:min-h-[300px]">
              <AccountActivityChart 
                data={accountActivityData}
                title="Account Activity"
              />
            </div>
          </div>

          {/* Retention Chart */}
          <div className="min-h-[200px] md:min-h-[250px]">
            <RetentionRateChart 
              data={retentionData}
              title="Retention Rate"
              benchmarkRate={95}
            />
          </div>

          {/* Top Gainers/Losers */}
          <TopGainersLosers 
            gainers={gainers}
            losers={losers}
            limit={3}
          />

          {/* Branch Leaderboard */}
          <BranchLeaderboard 
            data={branchData}
            title="Processor Leaderboard"
            subtitle={leaderboardData?.subtitle}
          />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {/* Monthly Performance Table */}
            <Card className="bg-zinc-900/80 border-yellow-400/20">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-white text-base md:text-lg font-medium">
                  Monthly Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 md:p-6 md:pt-0">
                <div className="overflow-x-auto -mx-0 md:mx-0">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-zinc-700/50">
                        <th className="text-left text-zinc-400 text-xs md:text-sm font-medium py-2 md:py-3 px-3">Month</th>
                        <th className="text-right text-zinc-400 text-xs md:text-sm font-medium py-2 md:py-3 px-3">Revenue</th>
                        <th className="text-right text-zinc-400 text-xs md:text-sm font-medium py-2 md:py-3 px-3 hidden sm:table-cell">Accounts</th>
                        <th className="text-right text-zinc-400 text-xs md:text-sm font-medium py-2 md:py-3 px-3 hidden md:table-cell">Avg/Acct</th>
                        <th className="text-right text-zinc-400 text-xs md:text-sm font-medium py-2 md:py-3 px-3 hidden sm:table-cell">New</th>
                        <th className="text-right text-zinc-400 text-xs md:text-sm font-medium py-2 md:py-3 px-3 hidden sm:table-cell">Lost</th>
                        <th className="text-right text-zinc-400 text-xs md:text-sm font-medium py-2 md:py-3 px-3">Retention</th>
                        <th className="text-right text-zinc-400 text-xs md:text-sm font-medium py-2 md:py-3 px-3">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricsLoading ? (
                        <tr>
                          <td colSpan={8} className="text-center text-zinc-500 py-8">
                            Loading...
                          </td>
                        </tr>
                      ) : !metricsData?.metrics || metricsData.metrics.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center text-zinc-500 py-8">
                            No data available
                          </td>
                        </tr>
                      ) : (
                        [...(metricsData.metrics || [])].reverse().slice(0, 12).map((metric: any, index: number) => (
                          <tr 
                            key={metric.month}
                            className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                          >
                            <td className="py-2 md:py-3 px-3">
                              <span className="text-white font-medium text-xs md:text-sm">{metric.month}</span>
                            </td>
                            <td className="py-2 md:py-3 px-3 text-right">
                              <span className="text-white tabular-nums text-xs md:text-sm">
                                {formatCurrency(metric.totalRevenue)}
                              </span>
                            </td>
                            <td className="py-2 md:py-3 px-3 text-right hidden sm:table-cell">
                              <span className="text-zinc-300 tabular-nums text-xs md:text-sm">{metric.totalAccounts}</span>
                            </td>
                            <td className="py-2 md:py-3 px-3 text-right hidden md:table-cell">
                              <span className="text-zinc-300 tabular-nums text-xs md:text-sm">
                                {formatCurrency(metric.revenuePerAccount)}
                              </span>
                            </td>
                            <td className="py-2 md:py-3 px-3 text-right hidden sm:table-cell">
                              <span className="text-green-400 tabular-nums text-xs md:text-sm">+{metric.newAccounts}</span>
                            </td>
                            <td className="py-2 md:py-3 px-3 text-right hidden sm:table-cell">
                              <span className="text-red-400 tabular-nums text-xs md:text-sm">-{metric.lostAccounts}</span>
                            </td>
                            <td className="py-2 md:py-3 px-3 text-right">
                              <span className={`inline-flex items-center justify-center px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium text-white ${
                                metric.retentionRate >= 90 ? 'bg-green-500' :
                                metric.retentionRate >= 75 ? 'bg-yellow-500' :
                                metric.retentionRate >= 50 ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}>
                                {metric.retentionRate}%
                              </span>
                            </td>
                            <td className="py-2 md:py-3 px-3 text-right">
                              {metric.momRevenueChangePercent !== null ? (
                                <span className={`tabular-nums text-xs md:text-sm ${
                                  metric.momRevenueChangePercent > 0 ? 'text-green-400' :
                                  metric.momRevenueChangePercent < 0 ? 'text-red-400' :
                                  'text-zinc-400'
                                }`}>
                                  {metric.momRevenueChangePercent > 0 ? '+' : ''}
                                  {metric.momRevenueChangePercent}%
                                </span>
                              ) : (
                                <span className="text-zinc-500 text-xs md:text-sm">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Report Builder Tab */}
        <TabsContent value="ai-builder" className="space-y-6">
          <AdvancedReportBuilder />
        </TabsContent>
      </Tabs>
      </>
      )}
      </div>
    </div>
  );
}
