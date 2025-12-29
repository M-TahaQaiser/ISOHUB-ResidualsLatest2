import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Activity, 
  FileText, 
  TrendingUp,
  Calendar,
  Clock,
  ArrowLeft,
  Settings,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  PieChart,
  CreditCard,
  FileBarChart
} from 'lucide-react';
import { useLocation } from 'wouter';

interface OrganizationData {
  id: string;
  name: string;
  startedAt: string;
}

export default function OrganizationDashboard() {
  const [, navigate] = useLocation();
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const impersonationData = sessionStorage.getItem('impersonatingOrganization');
    if (impersonationData) {
      setOrganizationData(JSON.parse(impersonationData));
    } else {
      navigate('/organizations');
    }
    setIsLoading(false);
  }, [navigate]);

  const handleExitImpersonation = () => {
    sessionStorage.removeItem('impersonatingOrganization');
    navigate('/organizations');
  };

  const handleGoToSettings = () => {
    if (organizationData) {
      navigate(`/org/${organizationData.id}/settings`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (!organizationData) {
    return null;
  }

  const metrics = {
    totalMerchants: 156,
    activeAgents: 12,
    monthlyVolume: 1250000,
    totalResiduals: 45600,
    pendingApplications: 8,
    processingVolume: 850000
  };

  const recentActivity = [
    { type: 'application', title: 'New application submitted', time: '2 hours ago', status: 'pending' },
    { type: 'payment', title: 'Residual payment processed', time: '5 hours ago', status: 'completed' },
    { type: 'user', title: 'New agent onboarded', time: '1 day ago', status: 'completed' },
    { type: 'report', title: 'Monthly report generated', time: '2 days ago', status: 'completed' }
  ];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
      case 'Active':
      case 'Complete':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
      case 'Pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Not Started':
      case 'Not Configured':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Impersonation Banner */}
        <Alert className="bg-yellow-400/10 border-yellow-400/30">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-gray-300">
              You are viewing <strong className="text-yellow-400">{organizationData.name}</strong> as a Super Admin
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExitImpersonation}
              className="ml-4 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
              data-testid="button-exit-impersonation"
            >
              <ArrowLeft className="h-3 w-3 mr-2" />
              Exit Organization View
            </Button>
          </AlertDescription>
        </Alert>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-8 w-8 text-black" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{organizationData.name}</h1>
              <p className="text-gray-400">
                Organization Dashboard • ID: {organizationData.id}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleGoToSettings}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            data-testid="button-org-settings"
          >
            <Settings className="h-4 w-4 mr-2" />
            Organization Settings
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Merchants</CardTitle>
              <CreditCard className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.totalMerchants.toLocaleString()}</div>
              <p className="text-xs text-gray-400">
                <span className="text-green-400">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.activeAgents}</div>
              <p className="text-xs text-gray-400">
                <span className="text-green-400">+2</span> new this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Monthly Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${(metrics.monthlyVolume / 1000000).toFixed(2)}M</div>
              <p className="text-xs text-gray-400">
                Processing volume this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Residuals</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${metrics.totalResiduals.toLocaleString()}</div>
              <p className="text-xs text-gray-400">
                <span className="text-green-400">+8.5%</span> from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-400">Common tasks for this organization</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button 
                variant="outline" 
                className="w-full justify-start border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                onClick={() => navigate('/residuals')}
              >
                <FileBarChart className="h-4 w-4 mr-2" />
                View Residuals Report
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                onClick={() => navigate('/reps')}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Manage Agents
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                onClick={() => navigate('/pre-applications')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Review Applications
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                onClick={() => navigate('/reports')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Reports
              </Button>
            </CardContent>
          </Card>

          {/* Organization Status */}
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader>
              <CardTitle className="text-white">Organization Status</CardTitle>
              <CardDescription className="text-gray-400">Current configuration and setup progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-300">Basic Information</span>
                </div>
                <Badge className={getStatusBadgeClass('Complete')}>Complete</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-300">Admin Account</span>
                </div>
                <Badge className={getStatusBadgeClass('Active')}>Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">Branding Setup</span>
                </div>
                <Badge className={getStatusBadgeClass('Pending')}>Pending</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-300">Email Configuration</span>
                </div>
                <Badge className={getStatusBadgeClass('Not Started')}>Not Started</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-300">Custom Domain</span>
                </div>
                <Badge className={getStatusBadgeClass('Not Configured')}>Not Configured</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-zinc-900/80 border-yellow-400/20">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">Latest actions and events for this organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-yellow-400/10 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'application' ? 'bg-blue-500/20' :
                      activity.type === 'payment' ? 'bg-green-500/20' :
                      activity.type === 'user' ? 'bg-purple-500/20' :
                      'bg-zinc-700'
                    }`}>
                      {activity.type === 'application' && <FileText className="h-4 w-4 text-blue-400" />}
                      {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-green-400" />}
                      {activity.type === 'user' && <Users className="h-4 w-4 text-purple-400" />}
                      {activity.type === 'report' && <FileBarChart className="h-4 w-4 text-gray-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{activity.title}</p>
                      <p className="text-xs text-gray-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusBadgeClass(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader>
              <CardTitle className="text-white">Processing Statistics</CardTitle>
              <CardDescription className="text-gray-400">This month's processing overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Total Transactions</span>
                  <span className="font-medium text-white">8,245</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Average Ticket</span>
                  <span className="font-medium text-white">$151.52</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Approval Rate</span>
                  <span className="font-medium text-green-400">94.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Chargeback Rate</span>
                  <span className="font-medium text-yellow-400">0.8%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader>
              <CardTitle className="text-white">Application Pipeline</CardTitle>
              <CardDescription className="text-gray-400">Current application status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Pending Review</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{metrics.pendingApplications}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">In Underwriting</span>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Approved (This Week)</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">12</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Declined (This Week)</span>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">2</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
