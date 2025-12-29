import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2, Clock, HardDrive } from 'lucide-react';
import { SiDropbox, SiGoogledrive } from 'react-icons/si';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface OAuthStatus {
  dropbox: {
    configured: boolean;
    connected: boolean;
    expiresAt: string | null;
  };
  onedrive: {
    configured: boolean;
    connected: boolean;
    expiresAt: string | null;
  };
  google_drive: {
    configured: boolean;
    connected: boolean;
    expiresAt: string | null;
  };
}

interface ProviderConfig {
  key: keyof OAuthStatus;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    key: 'dropbox',
    name: 'Dropbox',
    icon: SiDropbox,
    color: 'text-blue-600',
    description: 'Sync and backup your residual data to Dropbox',
  },
  {
    key: 'onedrive',
    name: 'OneDrive',
    icon: HardDrive,
    color: 'text-blue-500',
    description: 'Microsoft OneDrive cloud storage integration',
  },
  {
    key: 'google_drive',
    name: 'Google Drive',
    icon: SiGoogledrive,
    color: 'text-green-600',
    description: 'Store and share files with Google Drive',
  },
];

export default function OAuthIntegrations() {
  const { toast } = useToast();
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  // Fetch OAuth connection status
  const { data: oauthStatus, isLoading, error: statusError } = useQuery<OAuthStatus>({
    queryKey: ['/api/oauth/status'],
    retry: 2, // Retry failed requests
  });

  // Show toast when status fetch fails
  useEffect(() => {
    if (statusError) {
      toast({
        title: 'Failed to Load OAuth Status',
        description: (statusError as any)?.message || 'Unable to fetch connection status. Please check your connection and try again.',
        variant: 'destructive',
      });
    }
  }, [statusError, toast]);

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async (provider: string) => {
      return apiRequest(`/api/oauth/${provider}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, provider) => {
      queryClient.invalidateQueries({ queryKey: ['/api/oauth/status'] });
      toast({
        title: 'Disconnected',
        description: `Successfully disconnected from ${PROVIDERS.find(p => p.key === provider)?.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Disconnect Failed',
        description: error.message || 'Failed to disconnect provider',
        variant: 'destructive',
      });
    },
  });

  const handleConnect = (provider: string) => {
    setConnectingProvider(provider);
    // Redirect to OAuth authorization URL
    window.location.href = `/api/oauth/${provider}/authorize`;
  };

  const handleDisconnect = (provider: string) => {
    disconnectMutation.mutate(provider);
  };

  const formatExpiryDate = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-yellow-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading OAuth connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-yellow-400 to-yellow-500 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-black/10 rounded-lg">
                <Cloud className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black" data-testid="heading-oauth-integrations">
                  Cloud Storage Integrations
                </h1>
                <p className="text-black/80">
                  Connect your agency to cloud storage providers for automated backups
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-300">
          Connect your agency to cloud storage providers to enable automatic backup and sync of residual data.
          Each connection is secured with AES-256 encryption.
        </AlertDescription>
      </Alert>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PROVIDERS.map((provider) => {
          // If there's a status error, assume providers could be configured (allow connection attempts)
          const status = oauthStatus?.[provider.key];
          const isConnected = status?.connected || false;
          const isConfigured = statusError ? true : (status?.configured || false);
          const expiryInfo = formatExpiryDate(status?.expiresAt || null);
          const IconComponent = provider.icon;

          return (
            <Card
              key={provider.key}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              data-testid={`card-provider-${provider.key}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-gray-100 dark:bg-gray-700 rounded-lg ${provider.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-black dark:text-white">
                      {provider.name}
                    </CardTitle>
                  </div>
                  {isConnected ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" data-testid={`badge-connected-${provider.key}`}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600 dark:text-gray-400" data-testid={`badge-disconnected-${provider.key}`}>
                      <CloudOff className="h-3 w-3 mr-1" />
                      Not Connected
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {provider.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {statusError ? (
                  <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="text-red-800 dark:text-red-300 text-sm">
                      Unable to load connection status. Please refresh the page or contact support if the issue persists.
                    </AlertDescription>
                  </Alert>
                ) : !isConfigured ? (
                  <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-300 text-sm">
                      Provider not configured. Contact your administrator to set up {provider.name} integration.
                    </AlertDescription>
                  </Alert>
                ) : isConnected ? (
                  <div className="space-y-3">
                    {expiryInfo && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>{expiryInfo}</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      onClick={() => handleDisconnect(provider.key)}
                      disabled={disconnectMutation.isPending}
                      data-testid={`button-disconnect-${provider.key}`}
                    >
                      {disconnectMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <CloudOff className="h-4 w-4 mr-2" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                    onClick={() => handleConnect(provider.key)}
                    disabled={connectingProvider === provider.key}
                    data-testid={`button-connect-${provider.key}`}
                  >
                    {connectingProvider === provider.key ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Cloud className="h-4 w-4 mr-2" />
                        Connect {provider.name}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Security Notice */}
      <Alert className="mt-8 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        <AlertDescription className="text-gray-700 dark:text-gray-300">
          <strong>Security:</strong> All OAuth credentials are encrypted with AES-256-GCM before storage.
          Tokens are automatically refreshed before expiration to maintain uninterrupted access.
        </AlertDescription>
      </Alert>
    </div>
  );
}
