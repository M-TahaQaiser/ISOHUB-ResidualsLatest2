import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Documents() {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Get current user's JWT token for SSO
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('username');
    
    if (token && user) {
      setAuthToken(token);
    }
  }, []);

  // Handle iframe load events
  const handleIframeLoad = () => {
    setIsLoading(false);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setIframeError(true);
  };

  // Construct the ISO-AI URL with authentication parameters
  const getISOAIUrl = () => {
    // Primary URL (check if available)
    const baseUrl = 'https://isohub-ai--5000.prod1b.defang.dev/documents';
    const currentUser = localStorage.getItem('username') || 'admin';
    
    // Pass authentication parameters via URL
    const params = new URLSearchParams({
      sso_token: authToken || '',
      username: currentUser,
      source: 'isohub'
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Alternative URLs to try
  const alternativeUrls = [
    'https://isohub-ai.replit.app/documents',
    'https://replit.com/@jerkean/ISOHUB-AI#main.py',
    'https://github.com/jerkean/iso-ai-docs'
  ];

  const refreshFrame = () => {
    setIsLoading(true);
    setIframeError(false);
    // Force iframe reload by updating the src
    const iframe = document.getElementById('iso-ai-frame') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-screen flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="mb-6">
        <Card className="bg-gradient-to-r from-yellow-400 to-yellow-500 border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-black" />
                <div>
                  <CardTitle className="text-black text-xl font-semibold">
                    ISO-AI Document Center
                  </CardTitle>
                  <p className="text-black/80 text-sm">
                    AI-powered document management and processing
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshFrame}
                  className="bg-white/20 border-black/20 text-black hover:bg-white/30"
                  data-testid="button-refresh-frame"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="bg-white/20 border-black/20 text-black hover:bg-white/30"
                >
                  <a 
                    href={getISOAIUrl()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                    data-testid="link-open-external"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </a>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="flex-1 flex items-center justify-center border-2 border-yellow-400/30 bg-zinc-900/80">
          <CardContent className="text-center py-12">
            <div className="flex items-center justify-center gap-3 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin text-yellow-400" />
              <span>Loading ISO-AI Document Center...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {iframeError && (
        <Card className="flex-1 flex items-center justify-center border-2 border-red-400/30 bg-zinc-900/80">
          <CardContent className="text-center py-12">
            <div className="space-y-6">
              <div className="text-red-400">
                <FileText className="h-12 w-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white">ISO-AI Document Center Unavailable</h3>
                <p className="text-sm text-gray-400 mt-2">
                  The ISO-AI service is currently offline or under maintenance.
                </p>
              </div>
              
              {/* Alternative Access Options */}
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-yellow-400/20">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Alternative Access Options:</h4>
                <div className="space-y-2">
                  {alternativeUrls.map((url, index) => (
                    <Button 
                      key={index}
                      asChild 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                    >
                      <a 
                        href={url}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                        data-testid={`link-alternative-${index}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                        {url.includes('replit.app') ? 'Try Replit App URL' :
                         url.includes('replit.com') ? 'View Source Code' :
                         url.includes('github.com') ? 'GitHub Repository' : 
                         'Alternative URL'}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={refreshFrame} variant="outline" size="sm" className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10" data-testid="button-retry">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Try Again
                </Button>
              </div>

              {/* Contact Support */}
              <div className="text-xs text-gray-500 mt-4">
                <p>If the issue persists, please contact support or check the ISO-AI service status.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ISO-AI Document Center Iframe */}
      <div className={`flex-1 ${isLoading || iframeError ? 'hidden' : 'block'}`}>
        <Card className="h-full border-2 border-yellow-400/30 overflow-hidden bg-zinc-900/80">
          <CardContent className="p-0 h-full">
            <iframe
              id="iso-ai-frame"
              src={getISOAIUrl()}
              className="w-full h-full border-0"
              title="ISO-AI Document Center"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
              allow="fullscreen"
              data-testid="iframe-iso-ai-docs"
            />
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500" data-testid="text-connection-status">
          Connected to ISO-AI Document Center • 
          User: {localStorage.getItem('username') || 'Guest'} • 
          {authToken ? 'Authenticated' : 'No Auth Token'}
        </p>
      </div>
    </div>
  );
}