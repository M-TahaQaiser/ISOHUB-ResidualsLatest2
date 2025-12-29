// Laravel backend API integration
// Based on the Laravel backend structure shown in the screenshots

export interface LaravelApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LaravelPreApplication {
  id: string;
  dba: string;
  business_contact_name: string;
  email: string;
  phone: string;
  status: string;
  organization_id: string;
  agent_id?: string;
  submitted_at: string;
  business_type?: string;
  monthly_volume?: number;
  average_ticket?: number;
  notes?: string;
}

// API base URL - using our existing Express backend
const API_BASE = window.location.origin + '/api';

class LaravelApiClient {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<LaravelApiResponse<T>> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      // Laravel backend not available, this is expected
      // Commenting out error logging to reduce console noise
      // console.error(`Laravel API Error (${endpoint}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Pre-Applications endpoints
  async getPreApplications(organizationId: string): Promise<LaravelApiResponse<LaravelPreApplication[]>> {
    return this.makeRequest<LaravelPreApplication[]>(`/preapplications?organizationId=${organizationId}`);
  }

  async getPreApplication(id: string): Promise<LaravelApiResponse<LaravelPreApplication>> {
    return this.makeRequest<LaravelPreApplication>(`/preapplications/${id}`);
  }

  async createPreApplication(data: Omit<LaravelPreApplication, 'id' | 'submitted_at'>): Promise<LaravelApiResponse<LaravelPreApplication>> {
    return this.makeRequest<LaravelPreApplication>('/preapplications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePreApplication(id: string, data: Partial<LaravelPreApplication>): Promise<LaravelApiResponse<LaravelPreApplication>> {
    return this.makeRequest<LaravelPreApplication>(`/preapplications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePreApplication(id: string): Promise<LaravelApiResponse<void>> {
    return this.makeRequest<void>(`/preapplications/${id}`, {
      method: 'DELETE',
    });
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<LaravelApiResponse<{ token: string; user: any }>> {
    return this.makeRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getCurrentUser(): Promise<LaravelApiResponse<any>> {
    return this.makeRequest<any>('/auth/me');
  }

  // Reports endpoints
  async getReports(params?: any): Promise<LaravelApiResponse<any[]>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest<any[]>(`/reports${queryString}`);
  }

  // Dashboard endpoints
  async getDashboardData(): Promise<LaravelApiResponse<any>> {
    return this.makeRequest<any>('/dashboard');
  }

  // Agents endpoints
  async getAgents(): Promise<LaravelApiResponse<any[]>> {
    return this.makeRequest<any[]>('/agents');
  }

  // Invoices endpoints
  async getInvoices(): Promise<LaravelApiResponse<any[]>> {
    return this.makeRequest<any[]>('/invoices');
  }

  // Users endpoints
  async getUsers(): Promise<LaravelApiResponse<any[]>> {
    return this.makeRequest<any[]>('/users');
  }
}

export const laravelApi = new LaravelApiClient();

// Helper function to convert Laravel format to local format
export const convertLaravelToLocal = (laravelApp: LaravelPreApplication) => ({
  id: laravelApp.id,
  dba: laravelApp.dba,
  businessContactName: laravelApp.business_contact_name,
  email: laravelApp.email,
  phone: laravelApp.phone,
  status: laravelApp.status as "New" | "Pending" | "Approved" | "Rejected",
  submittedAt: laravelApp.submitted_at,
  organizationId: laravelApp.organization_id,
  agentId: laravelApp.agent_id,
  businessType: laravelApp.business_type,
  monthlyVolume: laravelApp.monthly_volume,
  averageTicket: laravelApp.average_ticket,
  notes: laravelApp.notes,
});

// Helper function to convert local format to Laravel format
export const convertLocalToLaravel = (localApp: any): Omit<LaravelPreApplication, 'id' | 'submitted_at'> => ({
  dba: localApp.dba,
  business_contact_name: localApp.businessContactName,
  email: localApp.email,
  phone: localApp.phone,
  status: localApp.status,
  organization_id: localApp.organizationId || 'org-1',
  agent_id: localApp.agentId,
  business_type: localApp.businessType,
  monthly_volume: localApp.monthlyVolume,
  average_ticket: localApp.averageTicket,
  notes: localApp.notes,
});