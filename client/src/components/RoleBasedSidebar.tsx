import { Link, useLocation } from "wouter";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  DollarSign, 
  FileText, 
  Users, 
  Upload, 
  UserCheck,
  Shield,
  Brain,
  Settings,
  Building2,
  TrendingUp,
  Calendar,
  MapPin
} from "lucide-react";

const iconMap = {
  BarChart3,
  DollarSign,
  FileText,
  Users,
  Upload,
  UserCheck,
  Shield,
  Brain,
  Settings,
  Building2,
  TrendingUp,
  Calendar,
  MapPin
};

interface RoleBasedSidebarProps {
  className?: string;
}

export default function RoleBasedSidebar({ className }: RoleBasedSidebarProps) {
  const [location] = useLocation();
  const { 
    userRole, 
    navigation, 
    isLoading, 
    isAgent, 
    isAdmin,
    isSuperAdmin,
    getNavigation 
  } = useRoleAccess();

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const navItems = getNavigation();

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Role Badge */}
      <div className="px-3 py-2 mb-4">
        <Badge 
          variant={isAdmin() ? "default" : "secondary"}
          className="w-full justify-center"
        >
          {userRole?.role || 'User'}
        </Badge>
      </div>

      {/* Navigation Items */}
      {navItems.map((item) => {
        const IconComponent = iconMap[item.icon as keyof typeof iconMap] || FileText;
        const isActive = location === item.path;
        
        return (
          <Link key={item.path} href={item.path}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-2",
                isActive 
                  ? "bg-black text-white hover:bg-gray-800" 
                  : "hover:bg-gray-100"
              )}
            >
              <IconComponent className="h-4 w-4" />
              {item.name}
            </Button>
          </Link>
        );
      })}

      {/* Agent-Specific Quick Actions */}
      {isAgent() && (
        <div className="pt-4 border-t">
          <h3 className="px-3 py-2 text-sm font-medium text-gray-500">Quick Actions</h3>
          <div className="space-y-1">
            <Link href="/reports?filter=my-leads">
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                <TrendingUp className="h-3 w-3" />
                My Leads
              </Button>
            </Link>
            <Link href="/reports?filter=my-residuals">
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                <DollarSign className="h-3 w-3" />
                My Residuals
              </Button>
            </Link>
            <Link href="/reports?filter=lead-status">
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                <Calendar className="h-3 w-3" />
                Lead Status
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Admin-Specific Management */}
      {isAdmin() && !isSuperAdmin() && (
        <div className="pt-4 border-t">
          <h3 className="px-3 py-2 text-sm font-medium text-gray-500">Admin Tools</h3>
          <div className="space-y-1">
            <Link href="/admin/roster-upload">
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                <Upload className="h-3 w-3" />
                Upload Roster
              </Button>
            </Link>
            <Link href="/admin/role-settings">
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                <Settings className="h-3 w-3" />
                Role Settings
              </Button>
            </Link>
            <Link href="/admin/organization">
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                <Building2 className="h-3 w-3" />
                Organization
              </Button>
            </Link>
            <Link href="/agents">
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                <Users className="h-3 w-3" />
                Agent Management
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Super Admin Tools - ISO Hub Dev and Ops Only */}
      {isSuperAdmin() && (
        <div className="pt-4 border-t">
          <h3 className="px-3 py-2 text-sm font-medium text-red-500">Super Admin Tools</h3>
          <div className="space-y-1">
            <Link href="/admin/roster-upload">
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                <Upload className="h-3 w-3" />
                Upload Roster
              </Button>
            </Link>
            <Link href="/admin/role-settings">
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                <Settings className="h-3 w-3" />
                Role Settings
              </Button>
            </Link>
            <Link href="/admin/organization">
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                <Building2 className="h-3 w-3" />
                Organization Management
              </Button>
            </Link>
            <Link href="/agents">
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                <Users className="h-3 w-3" />
                Agent Management
              </Button>
            </Link>
            <Link href="/super-admin">
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm">
                <Shield className="h-3 w-3" />
                System Control Panel
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Permission Debug (Development Only) */}
      {process.env.NODE_ENV === 'development' && userRole && (
        <div className="pt-4 border-t">
          <h3 className="px-3 py-2 text-sm font-medium text-gray-400">Debug</h3>
          <div className="px-3 py-2 text-xs text-gray-500">
            <div>Role: {(userRole as any)?.role || 'Unknown'}</div>
            <div>Org: {(userRole as any)?.organizationId || 'Unknown'}</div>
            <div>Permissions: {(userRole as any)?.permissions?.length || 0}</div>
          </div>
        </div>
      )}
    </div>
  );
}