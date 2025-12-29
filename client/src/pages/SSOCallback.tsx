import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface SSOCallbackProps {
  setUsername: (username: string) => void;
  setAuthToken: (token: string) => void;
  setOrganization: (org: string) => void;
}

export default function SSOCallback({ setUsername, setAuthToken, setOrganization }: SSOCallbackProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const username = params.get('username');
    const organizationId = params.get('organizationId');
    const returnUrl = params.get('returnUrl') || '/dashboard';

    if (token && username) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('username', username);
      localStorage.setItem('organizationID', organizationId || 'org-default');

      setAuthToken(token);
      setUsername(username);
      setOrganization(organizationId || 'org-default');

      setLocation(returnUrl);
    } else {
      setLocation('/login?error=sso_failed');
    }
  }, [setAuthToken, setUsername, setOrganization, setLocation]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <p className="text-yellow-400 text-lg">Completing sign in...</p>
      </div>
    </div>
  );
}
