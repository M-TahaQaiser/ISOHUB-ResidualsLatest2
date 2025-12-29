import { useState, useEffect, useCallback } from 'react';
import { queryClient } from '@/lib/queryClient';

const STORAGE_KEY = 'organizationID';
const STORAGE_DATA_KEY = 'selectedOrganization';

interface Organization {
  id: number;
  organizationId: string;
  name: string;
  industry?: string;
}

export function useOrganization() {
  const [organizationId, setOrganizationId] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== 'null' && stored !== '') return stored;
    return null;
  });

  const [organization, setOrganization] = useState<Organization | null>(() => {
    const stored = localStorage.getItem(STORAGE_DATA_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const newValue = e.newValue;
        if (newValue && newValue !== 'null' && newValue !== '') {
          setOrganizationId(newValue);
        } else {
          setOrganizationId(null);
        }
      }
      if (e.key === STORAGE_DATA_KEY) {
        if (e.newValue) {
          try {
            setOrganization(JSON.parse(e.newValue));
          } catch {
            setOrganization(null);
          }
        } else {
          setOrganization(null);
        }
      }
    };

    const handleCustomEvent = () => {
      const storedId = localStorage.getItem(STORAGE_KEY);
      const storedData = localStorage.getItem(STORAGE_DATA_KEY);
      
      if (storedId && storedId !== 'null' && storedId !== '') {
        setOrganizationId(storedId);
      } else {
        setOrganizationId(null);
      }
      
      if (storedData) {
        try {
          setOrganization(JSON.parse(storedData));
        } catch {
          setOrganization(null);
        }
      } else {
        setOrganization(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('organizationChanged', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('organizationChanged', handleCustomEvent);
    };
  }, []);

  const selectOrganization = useCallback((org: Organization | null) => {
    if (org) {
      localStorage.setItem(STORAGE_KEY, org.organizationId);
      localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(org));
      setOrganizationId(org.organizationId);
      setOrganization(org);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_DATA_KEY);
      setOrganizationId(null);
      setOrganization(null);
    }
    
    window.dispatchEvent(new CustomEvent('organizationChanged'));
    queryClient.invalidateQueries();
  }, []);

  const hasSelectedOrganization = organizationId !== null;

  return {
    organizationId,
    organization,
    hasSelectedOrganization,
    selectOrganization,
  };
}
