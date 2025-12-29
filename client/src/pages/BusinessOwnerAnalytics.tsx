import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  Lock,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface AuthStatus {
  authenticated: boolean;
  loginTime?: number;
  expired?: boolean;
}

interface AnalyticsData {
  metrics: {
    totalRevenue: number;
    totalMerchants: number;
    activeAccounts: number;
    totalUsers: number;
    totalAssignments: number;
  };
  trends: Array<{ month: string; revenue: number }>;
  processorShare: Array<{ processor: string; revenue: number; percentage: number }>;
  topMerchants: Array<{ merchantName: string; revenue: number }>;
}

export default function BusinessOwnerAnalytics() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Check authentication status
  const { data: authStatus, isLoading: authLoading, refetch: refetchAuth } = useQuery<AuthStatus>({
    queryKey: ['/api/business-owner/auth/status'],
  });

  // Fetch analytics dashboard data
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/business-owner/analytics/dashboard'],
    enabled: authStatus?.authenticated === true,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      return apiRequest('/api/business-owner/auth/login', {
        method: 'POST',
        body: { password },
      });
    },
    onSuccess: async () => {
      setLoginError('');
      setPassword('');
      // Explicitly refetch auth status to update dialog visibility
      await refetchAuth();
      queryClient.invalidateQueries({ queryKey: ['/api/business-owner/analytics/dashboard'] });
    },
    onError: (error: any) => {
      setLoginError(error.message || 'Invalid password');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/business-owner/auth/logout', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-owner/auth/status'] });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      loginMutation.mutate(password);
    }
  };

  // Determine if dialog should be shown
  const showLoginDialog = !authLoading && !authStatus?.authenticated;
  
  // Debug logging
  console.log('[BusinessOwnerAnalytics] Auth State:', {
    authLoading,
    authenticated: authStatus?.authenticated,
    showLoginDialog,
  });

  const metrics = analytics?.metrics || {};
  const trends = analytics?.trends || [];
  const processorShare = analytics?.processorShare || [];
  const topMerchants = analytics?.topMerchants || [];

  const COLORS = ['#FFD700', '#000000', '#4B5563', '#9CA3AF', '#D1D5DB'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-yellow-600" />
              Business Owner Authentication
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter business owner password"
                  className="pr-10"
                  data-testid="input-business-owner-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            {loginError && (
              <Alert variant="destructive">
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? 'Authenticating...' : 'Access Analytics'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Analytics Dashboard */}
      {authStatus?.authenticated && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">Business Owner Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                High-level business intelligence and performance metrics
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              className="gap-2"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                <Card data-testid="card-total-revenue">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      ${(metrics.totalRevenue || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">All-time revenue</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-total-merchants">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {(metrics.totalMerchants || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Active & inactive</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-active-accounts">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
                    <Activity className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {(metrics.activeAccounts || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Last 3 months</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-total-users">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {(metrics.totalUsers || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">System users</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-assignments">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {(metrics.totalAssignments || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Role assignments</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Revenue Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={2} name="Revenue" />
                        <Line type="monotone" dataKey="merchantCount" stroke="#000000" strokeWidth={2} name="Merchants" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Processor Market Share */}
                <Card>
                  <CardHeader>
                    <CardTitle>Market Share by Processor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={processorShare}
                          dataKey="percentOfTotal"
                          nameKey="processor"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => `${entry.processor}: ${entry.percentOfTotal.toFixed(1)}%`}
                        >
                          {processorShare.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top Merchants */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Merchants by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topMerchants} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="merchantName" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="totalRevenue" fill="#FFD700" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
