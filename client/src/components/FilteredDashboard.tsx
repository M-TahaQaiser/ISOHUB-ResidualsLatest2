import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useQuery } from "@tanstack/react-query";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  FileText,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface FilteredDashboardProps {
  userId: string;
}

export default function FilteredDashboard({ userId }: FilteredDashboardProps) {
  const { userRole, isRep, isAdmin, isLoading: roleLoading } = useRoleAccess();
  
  // Fetch filtered dashboard data based on role
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/filtered', userId, userRole?.role],
    enabled: !!userId && !!userRole,
  });

  // Fetch rep-specific metrics
  const { data: repMetrics, isLoading: repLoading } = useQuery({
    queryKey: ['/api/rep/' + userId + '/metrics'],
    enabled: isRep() && !!userId,
  });

  if (roleLoading || isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Rep Dashboard - Only their data
  if (isRep()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Dashboard</h2>
          <Badge variant="secondary">Rep View</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* My Revenue */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${repMetrics?.totalRevenue?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {repMetrics?.revenueChange > 0 ? '+' : ''}{repMetrics?.revenueChange || 0}% from last month
              </p>
            </CardContent>
          </Card>

          {/* My Active Leads */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {repMetrics?.activeLeads || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {repMetrics?.newLeads || 0} new this month
              </p>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {repMetrics?.conversionRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {repMetrics?.conversions || 0} approved this month
              </p>
            </CardContent>
          </Card>

          {/* Pending Applications */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Apps</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {repMetrics?.pendingApps || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rep Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Recent Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {repMetrics?.recentReports?.slice(0, 3).map((report: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{report.name}</span>
                    <Badge variant="outline">${report.amount}</Badge>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">No recent reports</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Lead Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Approved</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {repMetrics?.approvedLeads || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Pending</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {repMetrics?.pendingLeads || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Needs Attention</span>
                  </div>
                  <Badge className="bg-red-100 text-red-800">
                    {agentMetrics?.attentionNeeded || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Admin Dashboard - Full organization data
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Organization Dashboard</h2>
        <Badge>Admin View</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Organization metrics cards would go here */}
        {/* This would show the full dashboard we already built */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboardData?.totalRevenue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Organization-wide revenue
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.totalAgents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active sales agents
            </p>
          </CardContent>
        </Card>

        {/* Add more admin-specific metrics */}
      </div>
    </div>
  );
}