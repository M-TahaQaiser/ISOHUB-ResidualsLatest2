import { db } from "../db";
import { users, assignments, monthlyData } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export interface UserRole {
  id: string;
  role: string;
  organizationId: string;
  permissions: string[];
}

export class RoleBasedAccessService {
  
  /**
   * Get user role and permissions
   */
  static async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) return null;

      const permissions = this.getPermissionsByRole(user.role || 'user');

      return {
        id: user.id,
        role: user.role || 'user',
        organizationId: user.organizationId || '',
        permissions
      };
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  }

  /**
   * Get permissions by role type
   */
  static getPermissionsByRole(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      'SuperAdmin': [
        'view_all_data',
        'manage_organizations',
        'manage_users',
        'view_residuals',
        'view_reports',
        'manage_assignments',
        'upload_data',
        'view_dashboard',
        'manage_settings',
        'view_billing'
      ],
      'Admin': [
        'view_organization_data',
        'manage_organization_users',
        'view_residuals',
        'view_reports',
        'manage_assignments',
        'upload_data',
        'view_dashboard',
        'manage_settings'
      ],
      'Manager': [
        'view_team_data',
        'view_residuals',
        'view_reports',
        'view_dashboard',
        'manage_team_assignments'
      ],
      'TeamLeader': [
        'view_team_data',
        'view_reports',
        'view_dashboard',
        'view_assigned_residuals'
      ],
      'Agent': [
        'view_own_reports',
        'view_own_leads',
        'view_own_dashboard'
      ],
      'Partner': [
        'view_partner_reports',
        'view_partner_residuals',
        'view_dashboard'
      ],
      'user': [
        'view_own_reports'
      ]
    };

    return rolePermissions[role] || rolePermissions['user'];
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    const userRole = await this.getUserRole(userId);
    if (!userRole) return false;
    
    return userRole.permissions.includes(permission);
  }

  /**
   * Get agent's assigned merchant IDs
   */
  static async getAgentMerchantIds(userId: string): Promise<string[]> {
    try {
      const agentAssignments = await db
        .select({ merchantId: assignments.merchantId })
        .from(assignments)
        .where(eq(assignments.agentId, userId));

      return agentAssignments.map(a => a.merchantId);
    } catch (error) {
      console.error('Error fetching agent merchant IDs:', error);
      return [];
    }
  }

  /**
   * Filter reports data based on user role
   */
  static async filterReportsForUser(userId: string, reportsData: any[]): Promise<any[]> {
    const userRole = await this.getUserRole(userId);
    if (!userRole) return [];

    // SuperAdmin and Admin see all data
    if (['SuperAdmin', 'Admin'].includes(userRole.role)) {
      return reportsData;
    }

    // Agents only see their assigned data
    if (userRole.role === 'Agent') {
      const merchantIds = await this.getAgentMerchantIds(userId);
      
      return reportsData.filter(report => {
        // Filter based on merchant assignments
        if (report.merchantId && merchantIds.includes(report.merchantId)) {
          return true;
        }
        
        // Filter based on agent assignment in the data
        if (report.agentId === userId) {
          return true;
        }

        return false;
      });
    }

    // Managers see team data
    if (['Manager', 'TeamLeader'].includes(userRole.role)) {
      // TODO: Implement team-based filtering
      return reportsData;
    }

    return [];
  }

  /**
   * Filter monthly data based on user role
   */
  static async filterMonthlyDataForUser(userId: string, monthlyDataRecords: any[]): Promise<any[]> {
    const userRole = await this.getUserRole(userId);
    if (!userRole) return [];

    // SuperAdmin and Admin see all data
    if (['SuperAdmin', 'Admin'].includes(userRole.role)) {
      return monthlyDataRecords;
    }

    // Agents only see their assigned merchants
    if (userRole.role === 'Agent') {
      const merchantIds = await this.getAgentMerchantIds(userId);
      
      return monthlyDataRecords.filter(record => 
        merchantIds.includes(record.merchantId)
      );
    }

    return monthlyDataRecords;
  }

  /**
   * Get navigation items based on user role
   */
  static getNavigationForRole(role: string): Array<{
    name: string;
    path: string;
    icon: string;
    permission: string;
  }> {
    const allNavItems = [
      { name: 'Dashboard', path: '/dashboard', icon: 'BarChart3', permission: 'view_dashboard' },
      { name: 'Residuals', path: '/residuals', icon: 'DollarSign', permission: 'view_residuals' },
      { name: 'Reports', path: '/reports', icon: 'FileText', permission: 'view_reports' },
      { name: 'User Management', path: '/user-management', icon: 'Users', permission: 'manage_users' },
      { name: 'Billing', path: '/billing', icon: 'CreditCard', permission: 'view_billing' },
      { name: 'Data Upload', path: '/uploads', icon: 'Upload', permission: 'upload_data' },
      { name: 'Assignments', path: '/assignments', icon: 'UserCheck', permission: 'manage_assignments' },
      { name: 'Pre-Applications', path: '/pre-applications', icon: 'FileText', permission: 'view_reports' },
      { name: 'Secured Documents', path: '/secured-docs', icon: 'Shield', permission: 'view_reports' },
      { name: 'ISO-AI', path: '/iso-ai', icon: 'Brain', permission: 'view_reports' },
      { name: 'Settings', path: '/settings', icon: 'Settings', permission: 'manage_settings' }
    ];

    const permissions = this.getPermissionsByRole(role);

    return allNavItems.filter(item => 
      permissions.includes(item.permission)
    );
  }

  /**
   * Create roster upload template
   */
  static getRosterUploadTemplate(): string {
    return `Agent ID,First Name,Last Name,Email,Phone,Department,Start Date,Commission Rate
AGENT001,John,Smith,john.smith@company.com,555-0101,Sales,2024-01-15,0.05
AGENT002,Jane,Doe,jane.doe@company.com,555-0102,Sales,2024-02-01,0.055
AGENT003,Mike,Johnson,mike.johnson@company.com,555-0103,Operations,2024-01-20,0.045`;
  }

  /**
   * Process roster upload and create user accounts
   */
  static async processRosterUpload(csvData: string, organizationId: string): Promise<{
    success: boolean;
    created: number;
    errors: string[];
  }> {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    let created = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      
      try {
        const userData = {
          id: values[0],
          firstName: values[1],
          lastName: values[2],
          email: values[3],
          role: 'Agent',
          organizationId: organizationId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Check if user already exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, userData.email));

        if (existingUser.length === 0) {
          await db.insert(users).values(userData);
          created++;
        } else {
          errors.push(`User ${userData.email} already exists`);
        }
      } catch (error) {
        errors.push(`Error processing line ${i + 1}: ${error}`);
      }
    }

    return {
      success: created > 0,
      created,
      errors
    };
  }
}