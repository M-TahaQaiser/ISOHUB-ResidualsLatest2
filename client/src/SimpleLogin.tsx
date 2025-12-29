import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface LoginProps {
  setUsername: (username: string) => void;
  setAuthToken: (token: string) => void;
  setOrganization: (org: string) => void;
}

export default function SimpleLogin({ setUsername, setAuthToken, setOrganization }: LoginProps) {
  const [localUsername, setLocalUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: ssoStatus } = useQuery<{ google: { configured: boolean }, microsoft: { configured: boolean } }>({
    queryKey: ['/api/sso/status'],
    retry: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const messageParam = params.get('message');
    if (errorParam) {
      setError(`SSO Error: ${messageParam || errorParam}`);
    }
  }, []);

  const handleGoogleSSO = () => {
    window.location.href = '/api/sso/google';
  };

  const handleMicrosoftSSO = () => {
    window.location.href = '/api/sso/microsoft';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Starting login process...');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: localUsername,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store authentication data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', localUsername);
      localStorage.setItem('organizationID', data.organizationID || 'org-86f76df1');
      
      // Update state
      setAuthToken(data.token);
      setUsername(localUsername);
      setOrganization(data.organizationID || 'org-86f76df1');
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(`Login failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showSSO = ssoStatus?.google?.configured || ssoStatus?.microsoft?.configured;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-yellow-400/20 rounded-lg p-6">
        <div className="text-center mb-6">
          {/* Logo */}
          <img 
            src="/isohub-logo.png" 
            alt="ISOHub Logo" 
            className="h-16 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-yellow-400">Login</h2>
        </div>

        {/* SSO Login Options */}
        {showSSO && (
          <div className="mb-6">
            <div className="space-y-3">
              {ssoStatus?.google?.configured && (
                <button
                  type="button"
                  onClick={handleGoogleSSO}
                  className="w-full bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 py-3 px-4 rounded font-medium flex items-center justify-center gap-3 transition duration-200"
                  data-testid="button-google-sso"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
              )}
              {ssoStatus?.microsoft?.configured && (
                <button
                  type="button"
                  onClick={handleMicrosoftSSO}
                  className="w-full bg-[#2F2F2F] hover:bg-[#1F1F1F] text-white py-3 px-4 rounded font-medium flex items-center justify-center gap-3 transition duration-200"
                  data-testid="button-microsoft-sso"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#F25022" d="M1 1h10v10H1z"/>
                    <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                    <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                    <path fill="#FFB900" d="M13 13h10v10H13z"/>
                  </svg>
                  Sign in with Microsoft
                </button>
              )}
            </div>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-zinc-900 text-gray-400">or continue with username</span>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Username:</label>
            <input 
              type="text" 
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter username"
              required
              data-testid="input-username"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">Password:</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter password"
              required
              data-testid="input-password"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded p-3">
              <p className="text-red-400 text-sm" data-testid="text-error">{error}</p>
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded font-medium transition duration-200 disabled:opacity-50"
            data-testid="button-login"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          
          <div className="text-center">
            <a href="/forgot-password" className="text-yellow-400 hover:text-yellow-300 text-sm underline" data-testid="link-forgot-password">
              Forgot your password?
            </a>
          </div>
        </form>

        {/* Development Credentials */}
        <div className="mt-6 p-4 bg-zinc-800 rounded-lg border border-yellow-400/30">
          <h3 className="text-yellow-400 font-semibold mb-3 text-sm">Development Credentials:</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-zinc-700 rounded hover:bg-zinc-600 cursor-pointer transition-colors" 
                 onClick={() => { setLocalUsername('dev'); setPassword('dev123'); }}
                 data-testid="credential-dev">
              <span className="text-gray-300">Dev User</span>
              <span className="text-yellow-400 font-mono">dev / dev123</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-zinc-700 rounded hover:bg-zinc-600 cursor-pointer transition-colors" 
                 onClick={() => { setLocalUsername('admin'); setPassword('admin123'); }}
                 data-testid="credential-admin">
              <span className="text-gray-300">Admin User</span>
              <span className="text-yellow-400 font-mono">admin / admin123</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-zinc-700 rounded hover:bg-zinc-600 cursor-pointer transition-colors" 
                 onClick={() => { setLocalUsername('test'); setPassword('test123'); }}
                 data-testid="credential-test">
              <span className="text-gray-300">Test User</span>
              <span className="text-yellow-400 font-mono">test / test123</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-zinc-700 rounded hover:bg-zinc-600 cursor-pointer transition-colors" 
                 onClick={() => { setLocalUsername('jerkean'); setPassword('test123'); }}
                 data-testid="credential-production">
              <span className="text-gray-300">Production Test</span>
              <span className="text-yellow-400 font-mono">jerkean / test123</span>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-3">
            Click any credential above to auto-fill the login form
          </p>
        </div>
      </div>
    </div>
  );
}
