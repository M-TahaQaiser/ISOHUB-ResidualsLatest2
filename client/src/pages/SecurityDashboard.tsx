import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SecurityCheck {
  score: number;
  grade: string;
  passedChecks: number;
  totalChecks: number;
  checks: {
    passwordHashing: boolean;
    dataEncryption: boolean;
    rateLimiting: boolean;
    inputValidation: boolean;
    securityHeaders: boolean;
    csrfProtection: boolean;
    mfaSupport: boolean;
    accountLockout: boolean;
    auditLogging: boolean;
    httpsEnforcement: boolean;
  };
  productionReady: boolean;
  timestamp: string;
}

interface AppStatus {
  status: string;
  timestamp: string;
  environment: string;
  uptime: number;
  security: {
    implemented: boolean;
    grade: string;
    score: number;
  };
}

export default function SecurityDashboard() {
  const [securityData, setSecurityData] = useState<SecurityCheck | null>(null);
  const [statusData, setStatusData] = useState<AppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [securityResponse, statusResponse] = await Promise.all([
        fetch('/api/security/quick-check'),
        fetch('/api/status/health')
      ]);

      if (securityResponse.ok && statusResponse.ok) {
        const securityResult = await securityResponse.json();
        const statusResult = await statusResponse.json();
        setSecurityData(securityResult);
        setStatusData(statusResult);
        setError(null);
      } else {
        setError('Failed to fetch security data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-600">Loading security dashboard...</div>
      </div>
    );
  }

  if (error || !securityData || !statusData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-600">{error || 'Failed to load data'}</span>
      </div>
    );
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 text-yellow-500 mr-3" />
            ISOHub Security Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Enterprise-grade security monitoring and assessment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Security Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Score
              </CardTitle>
              <CardDescription>Overall security assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {securityData.score}%
                </div>
                <Badge className={getGradeColor(securityData.grade)}>
                  Grade {securityData.grade}
                </Badge>
                <div className="mt-4 text-sm text-gray-600">
                  {securityData.passedChecks}/{securityData.totalChecks} checks passed
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Production Status
              </CardTitle>
              <CardDescription>Deployment readiness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-2xl font-bold mb-2 ${
                  securityData.productionReady ? 'text-green-600' : 'text-red-600'
                }`}>
                  {securityData.productionReady ? 'READY' : 'NOT READY'}
                </div>
                <Badge 
                  variant={securityData.productionReady ? 'default' : 'destructive'}
                  className="mb-4"
                >
                  {securityData.productionReady ? 'Production Ready' : 'Needs Review'}
                </Badge>
                <div className="text-sm text-gray-600">
                  Environment: {statusData.environment}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Health Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                System Health
              </CardTitle>
              <CardDescription>Application status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {statusData.status.toUpperCase()}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Uptime: {Math.floor(statusData.uptime / 3600)}h {Math.floor((statusData.uptime % 3600) / 60)}m
                </div>
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(securityData.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Features Grid */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Security Features</CardTitle>
            <CardDescription>Implemented security controls and protections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(securityData.checks).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  {value ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex space-x-4">
          <Button onClick={fetchSecurityData} variant="outline" className="border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            Refresh Assessment
          </Button>
          <Button 
            onClick={() => window.open('/api/security/assessment', '_blank')}
            variant="outline"
            className="border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            View Detailed Report
          </Button>
        </div>
      </div>
    </div>
  );
}