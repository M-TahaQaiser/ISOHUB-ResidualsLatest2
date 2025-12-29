import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useAutoRefresh(monthKey: string, intervalMs: number = 3000) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up auto-refresh for upload status
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/real-data/status', monthKey] 
      });
    }, intervalMs);

    // Listen for upload completion events
    const handleUploadComplete = () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/real-data/status', monthKey] 
      });
    };

    window.addEventListener('uploadComplete', handleUploadComplete);

    return () => {
      clearInterval(interval);
      window.removeEventListener('uploadComplete', handleUploadComplete);
    };
  }, [monthKey, queryClient, intervalMs]);
}