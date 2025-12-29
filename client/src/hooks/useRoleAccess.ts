import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export interface UserRole {
  id: string;
  role: string;
  organizationId: string;
  permissions: string[];
}

export interface NavigationItem {
  name: string;
  path: string;
  icon: string;
  permission: string;
}

export function useRoleAccess() {
  const { user } = useAuth();

  // Fetch user role and permissions
  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ['/api/user/role/' + user?.id],
    enabled: !!user?.id,
  });

  // Fetch navigation items based on role
  const { data: navigation, isLoading: navLoading } = useQuery({
    queryKey: ['/api/user/navigation/' + userRole?.role],
    enabled: !!userRole?.role,
  });

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!userRole?.permissions) return false;
    return userRole.permissions.includes(permission);
  };

  /**
   * Check if user is in specific role
   */
  const hasRole = (role: string): boolean => {
    return userRole?.role === role;
  };

  /**
   * Check if user is admin or higher
   */
  const isAdmin = (): boolean => {
    return ['SuperAdmin', 'Admin'].includes(userRole?.role || '');
  };

  /**
   * Check if user is super admin (ISO Hub dev and ops admin logins only)
   */
  const isSuperAdmin = (): boolean => {
    return userRole?.role === 'SuperAdmin';
  };

  /**
   * Check if user is rep
   */
  const isRep = (): boolean => {
    return userRole?.role === 'Users/Reps';
  };

  /**
   * Check if user can view residuals
   */
  const canViewResiduals = (): boolean => {
    return hasPermission('view_residuals') || hasPermission('view_assigned_residuals');
  };

  /**
   * Check if user can manage users
   */
  const canManageUsers = (): boolean => {
    return hasPermission('manage_users') || hasPermission('manage_organization_users');
  };

  /**
   * Check if user can upload data
   */
  const canUploadData = (): boolean => {
    return hasPermission('upload_data');
  };

  /**
   * Check if user can manage assignments
   */
  const canManageAssignments = (): boolean => {
    return hasPermission('manage_assignments') || hasPermission('manage_team_assignments');
  };

  /**
   * Get filtered navigation items
   */
  const getNavigation = (): NavigationItem[] => {
    return navigation || [];
  };

  return {
    userRole,
    navigation,
    isLoading: roleLoading || navLoading,
    hasPermission,
    hasRole,
    isAdmin,
    isSuperAdmin,
    isRep,
    canViewResiduals,
    canManageUsers,
    canUploadData,
    canManageAssignments,
    getNavigation
  };
}