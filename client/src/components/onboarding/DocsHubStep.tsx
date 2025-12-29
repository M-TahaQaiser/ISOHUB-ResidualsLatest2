import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, CheckCircle, AlertCircle, Cloud, Settings } from 'lucide-react';

interface DocsHubStepProps {
  organizationId: string;
  organization: any;
  progress: any;
  onComplete: (data: any) => void;
  isLoading: boolean;
}

export default function DocsHubStep({
  organizationId,
  organization,
  progress,
  onComplete,
  isLoading,
}: DocsHubStepProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [integrationStatus, setIntegrationStatus] = useState<{[key: string]: string}>({});

  const providers = [
    {
      id: 'google_drive',
      name: 'Google Drive',
      description: 'Seamless integration with Google Workspace',
      icon: '📂',
      status: 'available',
      features: ['Auto-sync documents', 'Team collaboration', 'Version control', 'Secure sharing'],
    },
    {
      id: 'onedrive',
      name: 'Microsoft OneDrive',
      description: 'Connect with Microsoft 365 ecosystem',
      icon: '☁️',
      status: 'available',
      features: ['Office integration', 'Enterprise security', 'Team sites', 'File versioning'],
    },
    {
      id: 'sharepoint',
      name: 'SharePoint',
      description: 'Enterprise document management',
      icon: '🏢',
      status: 'available',
      features: ['Workflow automation', 'Compliance features', 'Advanced permissions', 'Metadata management'],
    },
    {
      id: 'dropbox',
      name: 'Dropbox Business',
      description: 'Professional file storage and sharing',
      icon: '📦',
      status: 'available',
      features: ['Smart sync', 'Advanced sharing', 'Paper integration', 'Admin controls'],
    },
    {
      id: 'manual',
      name: 'Manual Setup',
      description: 'Configure later with custom solution',
      icon: '⚙️',
      status: 'available',
      features: ['Flexible setup', 'Custom integrations', 'API access', 'Self-managed'],
    },
  ];

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
  };

  const handleOAuthConnect = async (providerId: string) => {
    // Placeholder for OAuth integration
    setIntegrationStatus({ ...integrationStatus, [providerId]: 'connecting' });
    
    // Simulate OAuth flow
    setTimeout(() => {
      setIntegrationStatus({ ...integrationStatus, [providerId]: 'connected' });
    }, 2000);
  };

  const handleComplete = () => {
    const docsHubData = {
      selectedProvider,
      integrationStatus,
      setupType: selectedProvider === 'manual' ? 'manual' : 'oauth',
      configuredAt: new Date().toISOString(),
      reminderScheduled: selectedProvider === 'manual',
    };

    onComplete(docsHubData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-100 text-yellow-800">Connecting...</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Available</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Document Hub Integration</CardTitle>
              <CardDescription>
                Connect your cloud storage for seamless document management
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div>
            <h3 className="text-lg font-medium mb-4">Choose Your Document Storage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((provider) => (
                <Card
                  key={provider.id}
                  className={`cursor-pointer transition-all ${
                    selectedProvider === provider.id
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleProviderSelect(provider.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                          <h4 className="font-medium">{provider.name}</h4>
                          <p className="text-sm text-gray-600">{provider.description}</p>
                        </div>
                      </div>
                      {getStatusBadge(integrationStatus[provider.id] || provider.status)}
                    </div>
                    
                    <ul className="text-xs text-gray-600 space-y-1">
                      {provider.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {selectedProvider === provider.id && provider.id !== 'manual' && (
                      <Button
                        onClick={() => handleOAuthConnect(provider.id)}
                        disabled={integrationStatus[provider.id] === 'connecting'}
                        className="w-full mt-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                      >
                        {integrationStatus[provider.id] === 'connecting' ? (
                          <>
                            <span className="mr-2">Processing...</span>
                            Connecting...
                          </>
                        ) : integrationStatus[provider.id] === 'connected' ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Connected
                          </>
                        ) : (
                          <>
                            <Cloud className="mr-2 h-4 w-4" />
                            Connect with OAuth
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Manual Setup Information */}
          {selectedProvider === 'manual' && (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                <strong>Manual Setup Selected:</strong> You can configure your document storage later. 
                A reminder will be sent to help you complete the integration when you're ready.
              </AlertDescription>
            </Alert>
          )}

          {/* Connected Provider Info */}
          {selectedProvider && integrationStatus[selectedProvider] === 'connected' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Integration Successful:</strong> Your {providers.find(p => p.id === selectedProvider)?.name} account is now connected. 
                Documents will sync automatically with your ISOHub workspace.
              </AlertDescription>
            </Alert>
          )}

          {/* Features Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Hub Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">📄 Document Management</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Secure client document sharing</li>
                    <li>• Automated folder organization</li>
                    <li>• Version control and history</li>
                    <li>• Bulk upload capabilities</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">🔐 Security & Compliance</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• End-to-end encryption</li>
                    <li>• Access control permissions</li>
                    <li>• Audit trail logging</li>
                    <li>• GDPR/CCPA compliance</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">🤝 Team Collaboration</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Real-time collaboration</li>
                    <li>• Comment and review system</li>
                    <li>• Workflow notifications</li>
                    <li>• Team workspace sharing</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">📱 Mobile Access</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Mobile app integration</li>
                    <li>• Offline document access</li>
                    <li>• Push notifications</li>
                    <li>• Cross-device sync</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleComplete}
              disabled={!selectedProvider || isLoading}
              className="bg-black hover:bg-gray-800 text-white font-medium"
            >
              {isLoading ? (
                <>
                  <span className="mr-2">Processing...</span>
                  Setting up...
                </>
              ) : (
                'Complete Setup & Continue'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}