import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import MonthlySection from "@/components/MonthlySection";
import AuditSection from "@/components/AuditSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ClickableCard from "@/components/ClickableCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RevenueChart from "@/components/RevenueChart";
import TransactionChart from "@/components/TransactionChart";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import { useOrganization } from "@/hooks/use-organization";

import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  DollarSign,
  CreditCard,
  Building,
  Target,
  Calendar,
  Zap,
  Award,
  FileText,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  CalendarDays
} from "lucide-react";

export default function Dashboard() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth();
  
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState('6m');
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentMonthNum));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const getYears = () => {
    const years = [];
    for (let year = 2020; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  };
  
  const selectedMonthName = months[parseInt(selectedMonth)];
  const selectedMonthFormatted = `${selectedYear}-${String(parseInt(selectedMonth) + 1).padStart(2, '0')}`;
  const displayDateLabel = `${selectedMonthName} ${selectedYear}`;
  
  // Use reactive organization hook for proper data sync
  const { organizationId, hasSelectedOrganization } = useOrganization();

  // Fetch ISO-AI dashboard metrics - only when organization is selected
  // Use organization-scoped API URLs for proper data isolation
  const { data: isoMetrics, isLoading: isoMetricsLoading } = useQuery({
    queryKey: [`/api/dashboard/${organizationId}/metrics`],
    select: (data: any) => data?.metrics || {},
    enabled: hasSelectedOrganization
  });

  // Fetch top performing agents - only when organization is selected
  const { data: topAgentsData, isLoading: agentsLoading } = useQuery({
    queryKey: [`/api/dashboard/${organizationId}/metrics`],
    select: (data: any) => data?.topAgents || [],
    enabled: hasSelectedOrganization
  });

  // Fetch residual system stats - only when organization is selected
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/monthly-stats/${selectedMonthFormatted}`, organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/monthly-stats/${selectedMonthFormatted}?organizationId=${organizationId}`);
      return response.json();
    },
    enabled: hasSelectedOrganization
  });

  const { data: processors } = useQuery({
    queryKey: ["/api/processors"],
    enabled: hasSelectedOrganization
  });

  // Fetch needs approval data - only when organization is selected
  const { data: needsApproval, isLoading: approvalsLoading } = useQuery({
    queryKey: [`/api/dashboard/${organizationId}/needs-approval`],
    select: (data: any) => data?.needsApproval || [],
    enabled: hasSelectedOrganization
  });

  // Fetch recent activity - only when organization is selected
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: [`/api/dashboard/${organizationId}/recent-activity`],
    select: (data: any) => data?.activity || [],
    enabled: hasSelectedOrganization
  });

  // Fetch analytics trends data - now supports organization filtering
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/analytics/trends', timeRange, organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/trends?timeRange=${timeRange}&organizationId=${organizationId}`);
      return response.json();
    },
    select: (data: any) => data?.trends || [],
    enabled: hasSelectedOrganization
  });

  // Fetch onboarding metrics (from uploaded vendor/lead sheet data)
  const { data: onboardingMetrics } = useQuery({
    queryKey: ['/api/onboarding-metrics/1'],
    queryFn: async () => {
      const response = await fetch('/api/onboarding-metrics/1');
      return response.json();
    },
    select: (data: any) => data?.metrics || {}
  });

  // Strategic decision dialog is now handled in the initialization useEffect above

  // Initialize default data on first load
  useQuery({
    queryKey: ["/api/initialize"],
    queryFn: async () => {
      const response = await fetch("/api/initialize", { method: "POST" });
      return response.json();
    },
    staleTime: Infinity,
  });

  // Removed loading animations as requested

  // Calculate performance metrics - combine ISO metrics with onboarding data
  const totalAgents = hasSelectedOrganization 
    ? (isoMetrics?.totalAgents || onboardingMetrics?.totalAgents || 0) 
    : (onboardingMetrics?.totalAgents || 0);
  const totalMerchants = hasSelectedOrganization 
    ? (isoMetrics?.totalMerchants || onboardingMetrics?.totalMerchants || 0) 
    : (onboardingMetrics?.totalMerchants || 0);
  const totalReports = hasSelectedOrganization 
    ? (isoMetrics?.totalReports || onboardingMetrics?.reportsGenerated || 0) 
    : (onboardingMetrics?.reportsGenerated || 0);
  const approvedReports = hasSelectedOrganization 
    ? (isoMetrics?.approvedReports || totalReports) 
    : totalReports;
  const pendingApprovals = hasSelectedOrganization 
    ? (isoMetrics?.pendingApprovals || onboardingMetrics?.pendingApprovals || 0) 
    : (onboardingMetrics?.pendingApprovals || 0);
  const approvalRate = onboardingMetrics?.approvalRate || (totalReports > 0 ? Math.round((approvedReports / totalReports) * 100) : 0);

  // Calculate revenue metrics from residual system + onboarding data
  const totalRevenue = hasSelectedOrganization 
    ? ((stats as any)?.totalRevenue || onboardingMetrics?.monthlyRevenue || 0) 
    : (onboardingMetrics?.monthlyRevenue || 0);
  const totalMids = hasSelectedOrganization 
    ? ((stats as any)?.totalMids || onboardingMetrics?.activeAccounts || 0) 
    : (onboardingMetrics?.activeAccounts || 0);
  const avgRevenuePerMid = totalMids > 0 ? (totalRevenue / totalMids) : 0;

  // Additional onboarding-derived metrics
  const activeProcessors = onboardingMetrics?.activeProcessors || 0;
  const performanceScore = onboardingMetrics?.performanceScore || 'N/A';

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#0a0a0f] border-b border-yellow-400/20 px-4 py-3">
        <h1 className="text-xl font-semibold text-white">ISO Hub Dashboard</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "Overview", href: "/dashboard", isActive: true }
          ]} 
        />

        {/* Desktop Header with Date Filter */}
        <div className="hidden md:flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">ISO Hub Dashboard</h1>
            <p className="text-base sm:text-lg text-gray-400 mt-1">
              Comprehensive merchant services and agent management
            </p>
          </div>
          
          {/* Date Filter - Top of Page */}
          <div className="flex items-center gap-3 bg-zinc-900/80 border border-yellow-400/20 rounded-lg px-4 py-2">
            <CalendarDays className="h-5 w-5 text-yellow-400" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[130px] bg-zinc-800 border-zinc-700 text-white" data-testid="select-month">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {months.map((month, index) => (
                  <SelectItem key={month} value={String(index)} className="text-white hover:bg-zinc-700" data-testid={`option-month-${month.toLowerCase()}`}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px] bg-zinc-800 border-zinc-700 text-white" data-testid="select-year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {getYears().map((year) => (
                  <SelectItem key={year} value={String(year)} className="text-white hover:bg-zinc-700" data-testid={`option-year-${year}`}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Mobile Date Filter */}
        <div className="md:hidden flex items-center gap-2 bg-zinc-900/80 border border-yellow-400/20 rounded-lg px-3 py-2">
          <CalendarDays className="h-4 w-4 text-yellow-400" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="flex-1 bg-zinc-800 border-zinc-700 text-white h-9" data-testid="select-month-mobile">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {months.map((month, index) => (
                <SelectItem key={month} value={String(index)} className="text-white hover:bg-zinc-700">
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[90px] bg-zinc-800 border-zinc-700 text-white h-9" data-testid="select-year-mobile">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {getYears().map((year) => (
                <SelectItem key={year} value={String(year)} className="text-white hover:bg-zinc-700">
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Empty State - No Organization Selected */}
        {!hasSelectedOrganization && (
          <Card className="bg-zinc-900/80 border-yellow-400/30 border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 px-8">
              <div className="w-20 h-20 bg-yellow-400/10 rounded-full flex items-center justify-center mb-6">
                <Building className="h-10 w-10 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3">Select an Organization</h2>
              <p className="text-gray-400 text-center max-w-md mb-6">
                Choose an organization from the dropdown above to view dashboard metrics, agent performance, and revenue analytics.
              </p>
              <div className="flex items-center gap-2 text-yellow-400">
                <Users className="h-5 w-5" />
                <span className="text-sm">Use the "Organization" selector in the header to get started</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics and Dashboard Content - Only show when organization is selected */}
        {hasSelectedOrganization && (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {/* Total Agents - Clickable */}
          <Dialog>
            <DialogTrigger asChild>
              <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Agents</CardTitle>
                  <Users className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400">{totalAgents}</div>
                  <p className="text-xs text-gray-500">
                    Active payment processing agents
                  </p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Agent Overview</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800">Active Agents</h3>
                    <p className="text-2xl font-bold text-blue-600">{totalAgents}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-800">Total Merchants</h3>
                    <p className="text-2xl font-bold text-green-600">{totalMerchants}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-medium text-yellow-800">Avg Per Agent</h3>
                    <p className="text-2xl font-bold text-yellow-600">
                      {totalAgents > 0 ? Math.round(totalMerchants / totalAgents) : 0}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Agent Performance</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Merchants</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topAgentsData?.slice(0, 5).map((agent: any, index: number) => (
                        <TableRow key={agent.agentId}>
                          <TableCell>{agent.firstName} {agent.lastName}</TableCell>
                          <TableCell>{agent.merchantCount}</TableCell>
                          <TableCell>${(agent.merchantCount * 165).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Total Merchants */}
          <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Merchants</CardTitle>
              <Building className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{totalMerchants}</div>
              <p className="text-xs text-gray-500">
                MIDs being processed: {totalMids}
              </p>
            </CardContent>
          </Card>

          {/* Monthly Revenue - Clickable */}
          <Dialog>
            <DialogTrigger asChild>
              <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400">
                    ${totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500">
                    Avg per MID: ${avgRevenuePerMid.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Revenue Breakdown</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-medium text-yellow-800">Total Revenue</h3>
                    <p className="text-2xl font-bold text-yellow-600">${totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-800">Total MIDs</h3>
                    <p className="text-2xl font-bold text-green-600">{totalMids}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800">Avg per MID</h3>
                    <p className="text-2xl font-bold text-blue-600">${avgRevenuePerMid.toFixed(2)}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-800">Growth Rate</h3>
                    <p className="text-2xl font-bold text-purple-600">+12.5%</p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Top Revenue Generators</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Processor</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>MIDs</TableHead>
                        <TableHead>Avg per MID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Clearent</TableCell>
                        <TableCell>${(totalRevenue * 0.35).toLocaleString()}</TableCell>
                        <TableCell>{Math.round(totalMids * 0.4)}</TableCell>
                        <TableCell>${((totalRevenue * 0.35) / (totalMids * 0.4)).toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Global Payments TSYS</TableCell>
                        <TableCell>${(totalRevenue * 0.25).toLocaleString()}</TableCell>
                        <TableCell>{Math.round(totalMids * 0.3)}</TableCell>
                        <TableCell>${((totalRevenue * 0.25) / (totalMids * 0.3)).toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Payment Advisors</TableCell>
                        <TableCell>${(totalRevenue * 0.2).toLocaleString()}</TableCell>
                        <TableCell>{Math.round(totalMids * 0.15)}</TableCell>
                        <TableCell>${((totalRevenue * 0.2) / (totalMids * 0.15)).toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Approval Rate */}
          <Dialog>
            <DialogTrigger asChild>
              <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Approval Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-400">{approvalRate}%</div>
                  <p className="text-xs text-gray-500">
                    {approvedReports} of {totalReports} approved
                  </p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Approval Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-800">Approved</h3>
                    <p className="text-2xl font-bold text-green-600">{approvedReports}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-medium text-orange-800">Pending</h3>
                    <p className="text-2xl font-bold text-orange-600">{pendingApprovals}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Recent Approvals</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Agent Report - Q3</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">Approved</Badge>
                        </TableCell>
                        <TableCell>Today</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Processor Integration</TableCell>
                        <TableCell>
                          <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
                        </TableCell>
                        <TableCell>Yesterday</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {/* Pending Approvals */}
          <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{pendingApprovals}</div>
              <p className="text-xs text-gray-500">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          {/* Active Processors */}
          <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Active Processors</CardTitle>
              <CreditCard className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-400">{activeProcessors || (processors as any)?.length || 0}</div>
              <p className="text-xs text-gray-500">
                Payment processors connected
              </p>
            </CardContent>
          </Card>

          {/* Report Generation */}
          <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Reports Generated</CardTitle>
              <FileText className="h-4 w-4 text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-400">{totalReports}</div>
              <p className="text-xs text-gray-500">
                This month
              </p>
            </CardContent>
          </Card>

          {/* Performance Score */}
          <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Performance Score</CardTitle>
              <Award className="h-4 w-4 text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-400">{performanceScore}</div>
              <p className="text-xs text-gray-500">
                System health: {performanceScore === 'A+' ? 'Excellent' : performanceScore === 'A' ? 'Very Good' : 'Good'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Visual Separator */}
        <div className="border-t border-yellow-400/20 my-8" />

        {/* Analytics Charts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Revenue Analytics</h2>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {trendsLoading ? (
              <>
                <Card className="bg-zinc-900/80 border-yellow-400/20">
                  <CardHeader>
                    <CardTitle className="text-gray-300">Loading...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      Loading revenue trends...
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/80 border-yellow-400/20">
                  <CardHeader>
                    <CardTitle className="text-gray-300">Loading...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      Loading transaction data...
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : trendsData && trendsData.length > 0 ? (
              <>
                <RevenueChart data={trendsData} timeRange={timeRange} />
                <TransactionChart data={trendsData} />
              </>
            ) : (
              <Card className="col-span-2 bg-zinc-900/80 border-yellow-400/20">
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No analytics data available for the selected time range.</p>
                    <p className="text-sm mt-2">Try selecting a different time period or upload data to view trends.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Agents */}
          <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Top Performing Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!agentsLoading && topAgentsData && topAgentsData.length > 0 ? (
                  topAgentsData.slice(0, 5).map((agent: any, index: number) => (
                    <div key={agent.agentId} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-yellow-400/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-yellow-400">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{agent.firstName} {agent.lastName}</p>
                          <p className="text-sm text-gray-400">{agent.merchantCount} merchants</p>
                        </div>
                      </div>
                      <Badge className={index === 0 ? "bg-yellow-400 text-black" : "bg-zinc-700 text-gray-300"}>
                        {index === 0 && <Award className="w-3 h-3 mr-1" />}
                        {agent.merchantCount} MIDs
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Loading agent performance data...
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                onClick={() => setLocation('/agent-management')}
              >
                View All Agents
              </Button>
            </CardContent>
          </Card>

          {/* Needs Approval Queue */}
          <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                Needs Approval ({pendingApprovals})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!approvalsLoading && needsApproval && needsApproval.length > 0 ? (
                  needsApproval.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-yellow-400/10 bg-zinc-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-white">{item.processor}</p>
                        <p className="text-xs text-gray-400">{item.monthYear} - {item.type}</p>
                      </div>
                      <Badge className={item.type === 'agent' ? 'bg-yellow-400 text-black' : 'bg-zinc-700 text-gray-300'}>
                        {item.type}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                    All caught up! No items pending approval.
                  </div>
                )}
              </div>
              {needsApproval && needsApproval.length > 5 && (
                <Button variant="outline" className="w-full mt-4 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black">
                  View All Pending ({needsApproval.length})
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Recent Activity Feed */}
          <Card className="bg-zinc-900/80 border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/10 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-blue-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!activityLoading && recentActivity && recentActivity.length > 0 ? (
                  recentActivity.slice(0, 6).map((activity: any, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No recent activity to display
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legacy Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <MonthlySection 
            data={(stats as any)?.monthlyData || []} 
            processors={(processors as any) || []}
            month={selectedMonthFormatted}
          />
          
          <AuditSection
            month={selectedMonthFormatted}
          />
        </div>
        </>
        )}

      </div>
    </div>
  );
}