// Replit Database Service for ISO-AI Integration
class ReplitDBService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    // For development/testing, we'll use in-memory storage that simulates your ISO-AI data
    // In production, this would connect to your actual Replit database
    this.baseUrl = process.env.REPLIT_DB_URL || 'https://kv.replit.com/v0';
    this.headers = {
      'Authorization': `Bearer ${process.env.REPLIT_TOKEN || ''}`,
      'Content-Type': 'application/json'
    };
    
    // Initialize with sample data that matches your ISO-AI structure
    this.initializeSampleData();
  }

  private mockData: any = {
    agents: {},
    reports: {},
    organizations: {}
  };

  private async initializeSampleData() {
    // Sample organization (matches your Tracer organization)
    this.mockData.organizations['org-86f76df1'] = {
      organizationID: 'org-86f76df1',
      name: 'Tracer',
      settings: {},
      createdAt: '2024-01-01T00:00:00Z'
    };

    // DEMO Organization
    this.mockData.organizations['org-demo-isohub-2025'] = {
      organizationID: 'org-demo-isohub-2025',
      name: 'DEMO ISO Agency',
      settings: { isDemo: true },
      createdAt: '2025-01-01T00:00:00Z'
    };

    // Sample agents (matches your ISO-AI structure)
    this.mockData.agents['agents:org-86f76df1:agent1'] = {
      organizationID: 'org-86f76df1',
      agentID: 'agent1',
      fName: 'Cody',
      lName: 'Burnell',
      company: 'CoCard Solutions',
      manager: 'Christy Milton',
      user_id: 'cburnell24',
      additional_splits: [],
      clients: [
        {
          merchantId: 'M001',
          merchantName: 'Sample Restaurant',
          processor: 'Payment Advisors',
          bankSplit: '0.15'
        },
        {
          merchantId: 'M002', 
          merchantName: 'Retail Store',
          processor: 'Clearent',
          bankSplit: '0.12'
        }
      ],
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-07-20T15:45:00Z'
    };

    this.mockData.agents['agents:org-86f76df1:agent2'] = {
      organizationID: 'org-86f76df1',
      agentID: 'agent2',
      fName: 'James',
      lName: 'Kean',
      company: 'Payment Solutions Inc',
      manager: 'Mark Pierce',
      user_id: 'jkeanffd',
      additional_splits: [],
      clients: [
        {
          merchantId: 'M003',
          merchantName: 'Coffee Shop',
          processor: 'Global Payments TSYS',
          bankSplit: '0.10'
        }
      ],
      createdAt: '2024-02-01T09:15:00Z',
      updatedAt: '2024-07-18T11:30:00Z'
    };

    // DEMO Organization Agents
    this.mockData.agents['agents:org-demo-isohub-2025:sarah-mitchell'] = {
      organizationID: 'org-demo-isohub-2025',
      agentID: 'sarah-mitchell',
      fName: 'Sarah',
      lName: 'Mitchell',
      company: 'Demo Agency',
      manager: 'Robert Garcia',
      user_id: 'smitchell',
      additional_splits: [],
      clients: [
        { merchantId: 'DEMO001', merchantName: 'Bella Italia Ristorante', processor: 'Payment Advisors', bankSplit: '0.50' },
        { merchantId: 'DEMO011', merchantName: 'Total Wellness Center', processor: 'Payment Advisors', bankSplit: '0.50' },
        { merchantId: 'DEMO021', merchantName: 'Glamour Salon & Spa', processor: 'Payment Advisors', bankSplit: '0.50' },
        { merchantId: 'DEMO031', merchantName: 'Premier Accounting', processor: 'Clearent', bankSplit: '0.50' },
        { merchantId: 'DEMO041', merchantName: 'Burger Barn Grill', processor: 'Clearent', bankSplit: '0.50' }
      ],
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-10-20T15:45:00Z'
    };

    this.mockData.agents['agents:org-demo-isohub-2025:michael-rodriguez'] = {
      organizationID: 'org-demo-isohub-2025',
      agentID: 'michael-rodriguez',
      fName: 'Michael',
      lName: 'Rodriguez',
      company: 'Demo Agency',
      manager: 'Robert Garcia',
      user_id: 'mrodriguez',
      additional_splits: [],
      clients: [
        { merchantId: 'DEMO002', merchantName: 'Tokyo Express Sushi', processor: 'Clearent', bankSplit: '0.55' },
        { merchantId: 'DEMO012', merchantName: 'Smile Bright Dental', processor: 'First Data', bankSplit: '0.55' },
        { merchantId: 'DEMO022', merchantName: 'Serenity Day Spa', processor: 'Clearent', bankSplit: '0.55' },
        { merchantId: 'DEMO032', merchantName: 'Pixel Perfect Design', processor: 'Global Payments TSYS', bankSplit: '0.55' },
        { merchantId: 'DEMO042', merchantName: 'Taco Fiesta Express', processor: 'Payment Advisors', bankSplit: '0.55' }
      ],
      createdAt: '2025-02-01T09:15:00Z',
      updatedAt: '2025-10-18T11:30:00Z'
    };

    this.mockData.agents['agents:org-demo-isohub-2025:jennifer-thompson'] = {
      organizationID: 'org-demo-isohub-2025',
      agentID: 'jennifer-thompson',
      fName: 'Jennifer',
      lName: 'Thompson',
      company: 'Demo Agency',
      manager: 'Robert Garcia',
      user_id: 'jthompson',
      additional_splits: [],
      clients: [
        { merchantId: 'DEMO003', merchantName: 'Golden Dragon', processor: 'Payment Advisors', bankSplit: '0.60' },
        { merchantId: 'DEMO013', merchantName: 'Clear View Optometry', processor: 'Clearent', bankSplit: '0.60' },
        { merchantId: 'DEMO023', merchantName: 'Perfect Nails Studio', processor: 'First Data', bankSplit: '0.60' },
        { merchantId: 'DEMO033', merchantName: 'Comfort Stay Inn', processor: 'Payment Advisors', bankSplit: '0.60' },
        { merchantId: 'DEMO043', merchantName: 'Pizza Palace', processor: 'First Data', bankSplit: '0.60' }
      ],
      createdAt: '2025-03-10T14:20:00Z',
      updatedAt: '2025-10-15T09:45:00Z'
    };

    this.mockData.agents['agents:org-demo-isohub-2025:david-chen'] = {
      organizationID: 'org-demo-isohub-2025',
      agentID: 'david-chen',
      fName: 'David',
      lName: 'Chen',
      company: 'Demo Agency',
      manager: 'Christopher Martinez',
      user_id: 'dchen',
      additional_splits: [],
      clients: [
        { merchantId: 'DEMO004', merchantName: 'The Med Kitchen', processor: 'Global Payments TSYS', bankSplit: '0.45' },
        { merchantId: 'DEMO014', merchantName: 'Quick Lube Express', processor: 'Merchant Lynx', bankSplit: '0.45' },
        { merchantId: 'DEMO024', merchantName: 'The Daily Grind Coffee', processor: 'Payment Advisors', bankSplit: '0.45' },
        { merchantId: 'DEMO034', merchantName: 'Mountain View Lodge', processor: 'First Data', bankSplit: '0.45' },
        { merchantId: 'DEMO044', merchantName: 'Captain Jacks Seafood', processor: 'Clearent', bankSplit: '0.45' }
      ],
      createdAt: '2025-04-05T11:00:00Z',
      updatedAt: '2025-10-22T16:30:00Z'
    };

    this.mockData.agents['agents:org-demo-isohub-2025:amanda-williams'] = {
      organizationID: 'org-demo-isohub-2025',
      agentID: 'amanda-williams',
      fName: 'Amanda',
      lName: 'Williams',
      company: 'Demo Agency',
      manager: 'Christopher Martinez',
      user_id: 'awilliams',
      additional_splits: [],
      clients: [
        { merchantId: 'DEMO005', merchantName: 'Sunrise Family Diner', processor: 'Clearent', bankSplit: '0.52' },
        { merchantId: 'DEMO015', merchantName: 'Shine Auto Spa', processor: 'Payment Advisors', bankSplit: '0.52' },
        { merchantId: 'DEMO025', merchantName: 'Sweet Delights Bakery', processor: 'Clearent', bankSplit: '0.52' },
        { merchantId: 'DEMO035', merchantName: 'Build Right Contractors', processor: 'Clearent', bankSplit: '0.52' },
        { merchantId: 'DEMO045', merchantName: 'Smoky BBQ Pit', processor: 'Global Payments TSYS', bankSplit: '0.52' }
      ],
      createdAt: '2025-05-12T08:45:00Z',
      updatedAt: '2025-10-25T14:15:00Z'
    };

    // Sample reports
    this.mockData.reports['reports:org-86f76df1:report1'] = {
      organizationID: 'org-86f76df1',
      reportID: 'report1',
      type: 'agent',
      title: 'Agent Performance - July 2025',
      monthYear: 'July 2025',
      agentId: 'agent1',
      reportData: [
        {
          merchantId: 'M001',
          salesAmount: 45000,
          income: 1200,
          expenses: 200,
          net: 1000,
          approved: true
        }
      ],
      approved: false,
      createdAt: '2024-07-20T14:00:00Z'
    };

    // DEMO Organization Reports
    this.mockData.reports['reports:org-demo-isohub-2025:report-oct-2025'] = {
      organizationID: 'org-demo-isohub-2025',
      reportID: 'report-oct-2025',
      type: 'monthly',
      title: 'Monthly Residuals Summary - October 2025',
      monthYear: 'October 2025',
      reportData: {
        totalMerchants: 48,
        totalVolume: 2847532.45,
        totalResiduals: 127432.67,
        totalAgents: 10,
        topPerformer: 'Jennifer Thompson',
        processorBreakdown: [
          { processor: 'Payment Advisors', volume: 987234.12, residuals: 45632.18 },
          { processor: 'Clearent', volume: 756432.89, residuals: 34521.76 },
          { processor: 'Global Payments TSYS', volume: 543210.34, residuals: 24876.43 },
          { processor: 'First Data', volume: 432876.21, residuals: 18234.87 },
          { processor: 'Micamp Solutions', volume: 127778.89, residuals: 4167.43 }
        ]
      },
      approved: true,
      createdAt: '2025-10-31T14:00:00Z'
    };

    this.mockData.reports['reports:org-demo-isohub-2025:report-sarah-oct'] = {
      organizationID: 'org-demo-isohub-2025',
      reportID: 'report-sarah-oct',
      type: 'agent',
      title: 'Sarah Mitchell - October 2025 Commission',
      monthYear: 'October 2025',
      agentId: 'sarah-mitchell',
      reportData: {
        merchantCount: 5,
        totalVolume: 234567.89,
        totalResiduals: 12345.67,
        commission: 6172.84,
        split: 0.50,
        merchants: [
          { mid: 'DEMO001', name: 'Bella Italia Ristorante', volume: 67890.12, residual: 3456.78 },
          { mid: 'DEMO011', name: 'Total Wellness Center', volume: 45678.90, residual: 2345.67 },
          { mid: 'DEMO021', name: 'Glamour Salon & Spa', volume: 34567.89, residual: 1890.45 },
          { mid: 'DEMO031', name: 'Premier Accounting', volume: 56789.01, residual: 2987.65 },
          { mid: 'DEMO041', name: 'Burger Barn Grill', volume: 29641.97, residual: 1665.12 }
        ]
      },
      approved: true,
      createdAt: '2025-10-31T15:30:00Z'
    };

    this.mockData.reports['reports:org-demo-isohub-2025:report-michael-oct'] = {
      organizationID: 'org-demo-isohub-2025',
      reportID: 'report-michael-oct',
      type: 'agent',
      title: 'Michael Rodriguez - October 2025 Commission',
      monthYear: 'October 2025',
      agentId: 'michael-rodriguez',
      reportData: {
        merchantCount: 5,
        totalVolume: 287654.32,
        totalResiduals: 14876.54,
        commission: 8182.10,
        split: 0.55,
        merchants: [
          { mid: 'DEMO002', name: 'Tokyo Express Sushi', volume: 78901.23, residual: 4123.45 },
          { mid: 'DEMO012', name: 'Smile Bright Dental', volume: 56789.01, residual: 2987.65 },
          { mid: 'DEMO022', name: 'Serenity Day Spa', volume: 43210.98, residual: 2234.56 },
          { mid: 'DEMO032', name: 'Pixel Perfect Design', volume: 67890.12, residual: 3456.78 },
          { mid: 'DEMO042', name: 'Taco Fiesta Express', volume: 40862.98, residual: 2074.10 }
        ]
      },
      approved: true,
      createdAt: '2025-10-31T15:45:00Z'
    };

    console.log('ISO-AI sample data initialized');
  }

  private async fetchFromDB(key: string): Promise<any> {
    // Always check mock data first (for demo organizations)
    const mockResult = this.mockData.agents[key] || this.mockData.reports[key] || this.mockData.organizations[key];
    if (mockResult) {
      return mockResult;
    }

    // For production with real Replit DB, try to fetch
    if (process.env.REPLIT_DB_URL && process.env.NODE_ENV !== 'development') {
      try {
        const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
          headers: this.headers
        });
        
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(`Database error: ${response.status}`);
        }
        
        const data = await response.text();
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Error fetching from Replit DB:', error);
        return null;
      }
    }

    return null;
  }

  private async storeInDB(key: string, value: any): Promise<boolean> {
    // For development, use mock data
    if (process.env.NODE_ENV === 'development') {
      if (key.startsWith('agents:')) {
        this.mockData.agents[key] = value;
      } else if (key.startsWith('reports:')) {
        this.mockData.reports[key] = value;
      } else if (key.startsWith('organizations:')) {
        this.mockData.organizations[key] = value;
      }
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(value)
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error storing in Replit DB:', error);
      return false;
    }
  }

  private async deleteFromDB(key: string): Promise<boolean> {
    // For development, use mock data
    if (process.env.NODE_ENV === 'development') {
      if (key.startsWith('agents:') && this.mockData.agents[key]) {
        delete this.mockData.agents[key];
        return true;
      } else if (key.startsWith('reports:') && this.mockData.reports[key]) {
        delete this.mockData.reports[key];
        return true;
      } else if (key.startsWith('organizations:') && this.mockData.organizations[key]) {
        delete this.mockData.organizations[key];
        return true;
      }
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: this.headers
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error deleting from Replit DB:', error);
      return false;
    }
  }

  private async listKeys(prefix: string): Promise<string[]> {
    // Always include mock data keys first (for demo organizations)
    let mockKeys: string[] = [];
    if (prefix.startsWith('agents:')) {
      mockKeys = Object.keys(this.mockData.agents).filter(key => key.startsWith(prefix));
    } else if (prefix.startsWith('reports:')) {
      mockKeys = Object.keys(this.mockData.reports).filter(key => key.startsWith(prefix));
    } else if (prefix.startsWith('organizations:')) {
      mockKeys = Object.keys(this.mockData.organizations).filter(key => key.startsWith(prefix));
    }

    // For production with real Replit DB, also fetch external keys
    if (process.env.REPLIT_DB_URL && process.env.NODE_ENV !== 'development') {
      try {
        const response = await fetch(`${this.baseUrl}?prefix=${encodeURIComponent(prefix)}`, {
          headers: this.headers
        });
        
        if (response.ok) {
          const keys = await response.text();
          const externalKeys = keys.split('\n').filter(key => key.trim());
          // Merge mock keys with external keys (deduped)
          return [...new Set([...mockKeys, ...externalKeys])];
        }
      } catch (error) {
        console.error('Error listing keys from Replit DB:', error);
      }
    }

    return mockKeys;
  }

  // Agent-related methods
  async getAgents(organizationID: string) {
    const keys = await this.listKeys(`agents:${organizationID}:`);
    const agents = [];
    
    for (const key of keys) {
      const agent = await this.fetchFromDB(key);
      if (agent) agents.push(agent);
    }
    
    return agents;
  }

  async getAgentById(organizationID: string, agentID: string) {
    return await this.fetchFromDB(`agents:${organizationID}:${agentID}`);
  }

  async getAgentByUserId(organizationID: string, user_id: string) {
    const agents = await this.getAgents(organizationID);
    return agents.find(agent => agent.user_id === user_id) || null;
  }

  async createAgent(agent: any) {
    const key = `agents:${agent.organizationID}:${agent.agentID}`;
    const success = await this.storeInDB(key, {
      ...agent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return {
      acknowledged: success,
      agentID: agent.agentID
    };
  }

  async updateAgent(organizationID: string, agentData: any) {
    const { agentID, ...updateData } = agentData;
    const key = `agents:${organizationID}:${agentID}`;
    
    // Get existing agent
    const existingAgent = await this.fetchFromDB(key);
    if (!existingAgent) {
      return { acknowledged: false, modifiedCount: 0 };
    }
    
    // Update agent
    const updatedAgent = {
      ...existingAgent,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    const success = await this.storeInDB(key, updatedAgent);
    return {
      acknowledged: success,
      modifiedCount: success ? 1 : 0
    };
  }

  async deleteAgent(organizationID: string, agentID: string) {
    const key = `agents:${organizationID}:${agentID}`;
    const success = await this.deleteFromDB(key);
    
    return {
      acknowledged: success,
      deletedCount: success ? 1 : 0
    };
  }

  // Report-related methods
  async getReports(organizationID: string, type?: string) {
    const keys = await this.listKeys(`reports:${organizationID}:`);
    const reports = [];
    
    for (const key of keys) {
      const report = await this.fetchFromDB(key);
      if (report && (!type || report.type === type)) {
        reports.push(report);
      }
    }
    
    return { reports };
  }

  async getReport(reportID: string) {
    // Search across organizations for this report ID
    const allReportKeys = await this.listKeys('reports:');
    for (const key of allReportKeys) {
      const report = await this.fetchFromDB(key);
      if (report && report.reportID === reportID) {
        return report;
      }
    }
    return null;
  }

  async createReport(reportData: any) {
    const key = `reports:${reportData.organizationID}:${reportData.reportID}`;
    const success = await this.storeInDB(key, {
      ...reportData,
      createdAt: new Date().toISOString()
    });
    
    return {
      acknowledged: success,
      reportID: reportData.reportID
    };
  }

  async updateReport(reportID: string, updateData: any) {
    // Find the report first
    const existingReport = await this.getReport(reportID);
    if (!existingReport) {
      return { acknowledged: false, modifiedCount: 0 };
    }
    
    const key = `reports:${existingReport.organizationID}:${reportID}`;
    const updatedReport = {
      ...existingReport,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    const success = await this.storeInDB(key, updatedReport);
    return {
      acknowledged: success,
      modifiedCount: success ? 1 : 0
    };
  }

  async deleteReport(reportID: string) {
    const existingReport = await this.getReport(reportID);
    if (!existingReport) {
      return { acknowledged: false, deletedCount: 0 };
    }
    
    const key = `reports:${existingReport.organizationID}:${reportID}`;
    const success = await this.deleteFromDB(key);
    
    return {
      acknowledged: success,
      deletedCount: success ? 1 : 0
    };
  }

  async updateMerchantData(reportID: string, merchantId: string, merchantData: any) {
    const report = await this.getReport(reportID);
    if (!report) {
      return { acknowledged: false, modifiedCount: 0 };
    }
    
    // Update the merchant data in the report
    if (Array.isArray(report.reportData)) {
      const merchantIndex = report.reportData.findIndex((item: any) => item.merchantId === merchantId);
      if (merchantIndex >= 0) {
        report.reportData[merchantIndex] = { ...report.reportData[merchantIndex], ...merchantData };
        const success = await this.updateReport(reportID, { reportData: report.reportData });
        return success;
      }
    }
    
    return { acknowledged: false, modifiedCount: 0 };
  }

  // Dashboard-related methods
  async getDashboardMetrics(organizationID: string) {
    const [agents, reports] = await Promise.all([
      this.getAgents(organizationID),
      this.getReports(organizationID)
    ]);
    
    const totalAgents = agents.length;
    const totalReports = reports.reports.length;
    const approvedReports = reports.reports.filter(r => r.approved).length;

    return {
      totalAgents,
      totalReports,
      approvedReports,
      pendingApprovals: totalReports - approvedReports
    };
  }

  // File upload tracking
  async createFileUpload(uploadData: any) {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const key = `uploads:${uploadData.organizationID}:${uploadId}`;
    
    const success = await this.storeInDB(key, {
      ...uploadData,
      uploadId,
      uploadDate: new Date().toISOString()
    });
    
    return {
      acknowledged: success,
      insertedId: uploadId
    };
  }

  async updateFileUpload(uploadId: string, updateData: any) {
    // Find the upload across organizations
    const uploadKeys = await this.listKeys('uploads:');
    for (const key of uploadKeys) {
      const upload = await this.fetchFromDB(key);
      if (upload && upload.uploadId === uploadId) {
        const updatedUpload = {
          ...upload,
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        
        const success = await this.storeInDB(key, updatedUpload);
        return {
          acknowledged: success,
          modifiedCount: success ? 1 : 0
        };
      }
    }
    
    return { acknowledged: false, modifiedCount: 0 };
  }

  // Organization methods
  async getOrganization(organizationID: string) {
    return await this.fetchFromDB(`organizations:${organizationID}`);
  }

  async createOrganization(orgData: any) {
    const key = `organizations:${orgData.organizationID}`;
    const success = await this.storeInDB(key, {
      ...orgData,
      createdAt: new Date().toISOString()
    });
    
    return {
      acknowledged: success,
      organizationID: orgData.organizationID
    };
  }
}

// Create singleton instance
export const replitDBService = new ReplitDBService();

export default replitDBService;