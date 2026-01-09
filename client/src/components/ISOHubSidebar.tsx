import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  FileText, 
  Settings, 
  Users, 
  ChevronDown,
  Globe,
  Brain,
  LogOut,
  Menu,
  X,
  Database,
  DollarSign,
  CreditCard,
  Receipt,
  FileSignature,
  UserPlus
} from "lucide-react";

type UserRole = 'SuperAdmin' | 'Admin' | 'Manager' | 'Agent' | 'user';

interface ISOHubSidebarProps {
  username?: string;
  isAdmin?: boolean;
  userRole?: UserRole;
  onLogout: () => void;
}

export default function ISOHubSidebar({ username, isAdmin, userRole = 'user', onLogout }: ISOHubSidebarProps) {
  // If isAdmin is true but no specific role, treat as SuperAdmin for backward compatibility
  const isSuperAdmin = userRole === 'SuperAdmin' || (isAdmin === true && userRole === 'user');
  const isOrgAdmin = userRole === 'Admin';
  const hasAdminAccess = isSuperAdmin || isOrgAdmin || isAdmin;
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleAdminDropdown = () => {
    setIsAdminOpen(!isAdminOpen);
  };

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/reports", icon: FileText, label: "Reports" },
  ];

  // SuperAdmin-only tools (first 3 items)
  const superAdminItems = [
    { path: "/super-admin", icon: Settings, label: "Super Admin" },
    { path: "/prospects", icon: UserPlus, label: "Prospects" },
    { path: "/organizations", icon: Globe, label: "Organizations" },
    { path: "/billing", icon: Settings, label: "Billing" },
  ];

  // Regular admin tools
  const adminNavItems = [
    { path: "/data-management", icon: DollarSign, label: "Data Management" },
    { path: "/reps", icon: Users, label: "Rep Management" },
    { path: "/vendor-management", icon: Database, label: "Vendor Management" },
    { path: "/audit-issues", icon: FileText, label: "Audit Issues" },
  ];

  const isActivePath = (path: string) => location === path || location.startsWith(path + "/");

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-black/80 text-yellow-400 hover:bg-black/90"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-zinc-900 shadow-lg border-r border-yellow-400/20 transform transition-transform duration-200 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:w-64
          ${isHovered ? 'w-72' : ''}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-yellow-400/20">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="flex items-center justify-center">
              <img 
                src="/isohub-logo.png" 
                alt="ISO Hub Logo" 
                className="h-20 w-auto"
              />
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 flex-1">
          <div className="space-y-2">
            {/* Main Navigation Items */}
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div
                  className={`
                    group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors
                    ${isActivePath(item.path)
                      ? 'text-yellow-400 bg-yellow-400/10 border-l-4 border-yellow-400'
                      : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/5 hover:border-l-4 hover:border-yellow-400'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-yellow-400" />
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}

            {/* ISO AI Section */}
            <div className="pt-4 border-t border-yellow-400/20">
              <a
                href="https://jacc-final-version-keanonbiz.replit.app/login"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors
                  text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/5 hover:border-l-4 hover:border-yellow-400
                `}
              >
                <Brain className="h-5 w-5 mr-3 text-yellow-400" />
                <span>ISO-AI</span>
                <span className="ml-auto text-xs bg-yellow-400 text-black px-1.5 py-0.5 rounded">NEW</span>
              </a>
              {/* ISO-Sign temporarily hidden
              <Link href="/iso-sign">
                <div className={`
                  group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors
                  ${isActivePath('/iso-sign')
                    ? 'text-yellow-400 bg-yellow-400/10 border-l-4 border-yellow-400'
                    : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/5 hover:border-l-4 hover:border-yellow-400'
                  }
                `}>
                  <FileSignature className="h-5 w-5 mr-3 text-yellow-400" />
                  <span>ISO-Sign</span>
                  <span className="ml-auto text-xs bg-yellow-400 text-black px-1.5 py-0.5 rounded">NEW</span>
                </div>
              </Link>
              */}
            </div>

            {/* SuperAdmin Tools Section - Only visible to SuperAdmins */}
            {isSuperAdmin && (
              <div className="pt-4 border-t border-yellow-400/20">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  SuperAdmin Tools
                </div>
                <div className="space-y-1">
                  {superAdminItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className={`
                          group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                          ${isActivePath(item.path)
                            ? 'text-yellow-400 bg-yellow-400/10 border-l-4 border-yellow-400'
                            : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/5 hover:border-l-4 hover:border-yellow-400'
                          }
                        `}
                      >
                        <item.icon className="h-4 w-4 mr-3 text-gray-400 group-hover:text-yellow-400" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Organization Admin Billing Section - Only for org admins */}
            {isOrgAdmin && (
              <div className="pt-4 border-t border-yellow-400/20">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Account
                </div>
                <div className="space-y-1">
                  <Link
                    href="/my-billing"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActivePath('/my-billing')
                          ? 'text-yellow-400 bg-yellow-400/10 border-l-4 border-yellow-400'
                          : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/5 hover:border-l-4 hover:border-yellow-400'
                        }
                      `}
                    >
                      <CreditCard className="h-4 w-4 mr-3 text-gray-400 group-hover:text-yellow-400" />
                      <span>Billing & Invoices</span>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* Regular Admin Tools Section */}
            {hasAdminAccess && (
              <div className="pt-4 border-t border-yellow-400/20">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin Tools
                </div>
                <div className="space-y-1">
                  {adminNavItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className={`
                          group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                          ${isActivePath(item.path)
                            ? 'text-yellow-400 bg-yellow-400/10 border-l-4 border-yellow-400'
                            : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/5 hover:border-l-4 hover:border-yellow-400'
                          }
                        `}
                      >
                        <item.icon className="h-4 w-4 mr-3 text-gray-400 group-hover:text-yellow-400" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Footer / User Section */}
        <div className="p-4 border-t border-yellow-400/20">
          {username ? (
            <div className="space-y-3">
              {/* User Settings */}
              <Link href={`/user-settings/${username}`}>
                <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:text-yellow-400 hover:bg-yellow-400/5 transition-colors">
                  <Settings className="h-4 w-4 mr-3 text-gray-400" />
                  <span>{username}</span>
                </div>
              </Link>

              {/* Logout Button */}
              <Button
                onClick={onLogout}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-md flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                LOGOUT
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}
    </>
  );
}