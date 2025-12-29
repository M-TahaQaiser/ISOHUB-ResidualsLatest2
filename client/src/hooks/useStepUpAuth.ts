import { useState, useCallback, useRef, useEffect } from "react";

interface UseStepUpAuthOptions {
  tokenValidityMs?: number;
}

interface UseStepUpAuthReturn {
  reauthToken: string | null;
  isVerified: boolean;
  showReauthDialog: boolean;
  setShowReauthDialog: (show: boolean) => void;
  requestReauth: () => Promise<string>;
  handleReauthSuccess: (token: string) => void;
  clearReauth: () => void;
  getAuthHeaders: () => Record<string, string>;
}

export function useStepUpAuth(options: UseStepUpAuthOptions = {}): UseStepUpAuthReturn {
  const { tokenValidityMs = 5 * 60 * 1000 } = options;
  
  const [reauthToken, setReauthToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  
  const pendingReauthResolve = useRef<((token: string) => void) | null>(null);
  const pendingReauthReject = useRef<((error: Error) => void) | null>(null);

  const isVerified = reauthToken !== null && 
    tokenExpiresAt !== null && 
    Date.now() < tokenExpiresAt;

  useEffect(() => {
    if (!tokenExpiresAt) return;

    const timeUntilExpiry = tokenExpiresAt - Date.now();
    if (timeUntilExpiry <= 0) {
      setReauthToken(null);
      setTokenExpiresAt(null);
      return;
    }

    const timer = setTimeout(() => {
      setReauthToken(null);
      setTokenExpiresAt(null);
    }, timeUntilExpiry);

    return () => clearTimeout(timer);
  }, [tokenExpiresAt]);

  const requestReauth = useCallback((): Promise<string> => {
    if (isVerified && reauthToken) {
      return Promise.resolve(reauthToken);
    }

    return new Promise((resolve, reject) => {
      pendingReauthResolve.current = resolve;
      pendingReauthReject.current = reject;
      setShowReauthDialog(true);
    });
  }, [isVerified, reauthToken]);

  const handleReauthSuccess = useCallback((token: string) => {
    setReauthToken(token);
    setTokenExpiresAt(Date.now() + tokenValidityMs);
    setShowReauthDialog(false);

    if (pendingReauthResolve.current) {
      pendingReauthResolve.current(token);
      pendingReauthResolve.current = null;
      pendingReauthReject.current = null;
    }
  }, [tokenValidityMs]);

  const clearReauth = useCallback(() => {
    setReauthToken(null);
    setTokenExpiresAt(null);
    setShowReauthDialog(false);

    if (pendingReauthReject.current) {
      pendingReauthReject.current(new Error('Reauth cancelled'));
      pendingReauthResolve.current = null;
      pendingReauthReject.current = null;
    }
  }, []);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (isVerified && reauthToken) {
      return { 'X-Reauth-Token': reauthToken };
    }
    return {};
  }, [isVerified, reauthToken]);

  return {
    reauthToken,
    isVerified,
    showReauthDialog,
    setShowReauthDialog,
    requestReauth,
    handleReauthSuccess,
    clearReauth,
    getAuthHeaders
  };
}
