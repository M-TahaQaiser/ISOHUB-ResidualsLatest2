// Pre-Applications API integration with Laravel backend
import { apiRequest } from "@/lib/queryClient";

export interface PreApplication {
  id: string;
  dba: string;
  businessContactName: string;
  email: string;
  phone: string;
  status: "New" | "Pending" | "Approved" | "Rejected";
  submittedAt: string;
  organizationId?: string;
  agentId?: string;
  businessType?: string;
  monthlyVolume?: number;
  averageTicket?: number;
  notes?: string;
}

export interface PreApplicationFormLink {
  id: string;
  url: string;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
}

// Get all pre-applications for current organization
export const getPreApplications = async (organizationId: string): Promise<PreApplication[]> => {
  try {
    // Try to connect to Laravel backend first
    const response = await fetch(`/laravel-api/preapplications?organizationId=${organizationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.applications || [];
    }
  } catch (error) {
    console.warn('Laravel backend not available, using local data');
  }

  // Fallback to local API if Laravel is not available
  return apiRequest('/api/pre-applications');
};

// Get pre-application form link for organization
export const getFormLink = async (organizationId: string): Promise<PreApplicationFormLink> => {
  try {
    // Try Laravel backend first
    const response = await fetch(`/laravel-api/preapplications/form-link?organizationId=${organizationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.formLink;
    }
  } catch (error) {
    console.warn('Laravel backend not available, using default form link');
  }

  // Fallback to default
  return {
    id: 'default',
    url: 'https://isohub.io/pre-form/admin-admin2',
    organizationId,
    isActive: true,
    createdAt: new Date().toISOString()
  };
};

// Update pre-application status
export const updatePreApplicationStatus = async (
  applicationId: string, 
  status: PreApplication['status'],
  notes?: string
): Promise<PreApplication> => {
  try {
    // Try Laravel backend first
    const response = await fetch(`/laravel-api/preapplications/${applicationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({ status, notes }),
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Laravel backend not available for updates');
  }

  // Fallback to local API
  return apiRequest(`/api/pre-applications/${applicationId}`, {
    method: 'PUT',
    body: JSON.stringify({ status, notes }),
  });
};

// Create new pre-application (from form submission)
export const createPreApplication = async (applicationData: Omit<PreApplication, 'id' | 'submittedAt'>): Promise<PreApplication> => {
  try {
    // Try Laravel backend first
    const response = await fetch('/laravel-api/preapplications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(applicationData),
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Laravel backend not available for creation');
  }

  // Fallback to local API
  return apiRequest('/api/pre-applications', {
    method: 'POST',
    body: JSON.stringify(applicationData),
  });
};

// Delete pre-application
export const deletePreApplication = async (applicationId: string): Promise<void> => {
  try {
    // Try Laravel backend first
    const response = await fetch(`/laravel-api/preapplications/${applicationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    
    if (response.ok) {
      return;
    }
  } catch (error) {
    console.warn('Laravel backend not available for deletion');
  }

  // Fallback to local API
  return apiRequest(`/api/pre-applications/${applicationId}`, {
    method: 'DELETE',
  });
};

// Generate and email pre-application form link
export const emailFormLink = async (
  email: string, 
  organizationId: string,
  customMessage?: string
): Promise<void> => {
  try {
    // Try Laravel backend first
    const response = await fetch('/laravel-api/preapplications/email-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({ 
        email, 
        organizationId, 
        customMessage 
      }),
    });
    
    if (response.ok) {
      return;
    }
  } catch (error) {
    console.warn('Laravel backend not available for emailing');
  }

  // Fallback to local email handling
  const formLink = await getFormLink(organizationId);
  const subject = encodeURIComponent("ISOHub Pre-Application Form");
  const body = encodeURIComponent(
    customMessage || `Please complete the pre-application form at: ${formLink.url}`
  );
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
};