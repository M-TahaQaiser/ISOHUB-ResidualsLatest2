import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import OrganizationSelector from "./OrganizationSelector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  FileText, 
  Shield, 
  Megaphone, 
  LogIn, 
  Archive,
  Bell,
  User,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  X
} from "lucide-react";

interface ISOHubHeaderProps {
  username?: string;
  onLogout?: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function ISOHubHeader({ username, onLogout }: ISOHubHeaderProps) {
  const [location] = useLocation();
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Data Upload Complete',
      message: 'November 2025 residuals processed successfully',
      time: '2 hours ago',
      read: false
    },
    {
      id: '2',
      type: 'warning',
      title: 'Audit Review Needed',
      message: '3 merchants require attention in October data',
      time: '5 hours ago',
      read: false
    },
    {
      id: '3',
      type: 'info',
      title: 'New Report Available',
      message: 'Monthly summary report is ready for download',
      time: '1 day ago',
      read: false
    }
  ]);

  // Load saved organization on mount
  useEffect(() => {
    const savedOrgId = localStorage.getItem('organizationID');
    const savedOrgData = localStorage.getItem('selectedOrganization');
    if (savedOrgId && savedOrgData) {
      try {
        const org = JSON.parse(savedOrgData);
        setSelectedOrganization(org);
      } catch (e) {
        console.error('Failed to parse saved organization:', e);
      }
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleOrganizationSelect = (organization: any) => {
    setSelectedOrganization(organization);
    
    if (organization) {
      // Save organization ID and full data to localStorage for persistence
      localStorage.setItem('organizationID', organization.organizationId);
      localStorage.setItem('selectedOrganization', JSON.stringify(organization));
      console.log('Organization selected and saved:', organization.organizationId, organization.name);
    } else {
      // Clear organization selection
      localStorage.removeItem('organizationID');
      localStorage.removeItem('selectedOrganization');
      console.log('Organization selection cleared');
    }
    
    // Dispatch custom event to notify all components of organization change
    window.dispatchEvent(new CustomEvent('organizationChanged'));
    
    // Invalidate all queries to refresh data with new organization context
    queryClient.invalidateQueries();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'info': return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const headerNavItems = [
    { 
      label: "Logins", 
      icon: LogIn, 
      href: "/login-portal",
      description: "Access processor logins"
    },
    { 
      label: "Pre-Applications", 
      icon: Archive, 
      href: "/pre-applications",
      description: "Application management"
    },
    { 
      label: "Secured Doc Portal", 
      icon: Shield, 
      href: "/secured-docs",
      description: "Secure document access"
    },
    { 
      label: "Marketing", 
      icon: Megaphone, 
      href: "/marketing",
      description: "Marketing resources"
    }
  ];

  return (
    <header className="bg-[#0a0a0f] border-b border-yellow-400/20 shadow-lg">
      <div className="px-6 py-3">
        {/* Organization Selector - Right under the logo */}
        <div className="mb-4 border-b border-yellow-400/10 pb-3">
          <OrganizationSelector
            selectedOrganization={selectedOrganization}
            onOrganizationSelect={handleOrganizationSelect}
            placeholder="Switch to Organization View..."
          />
        </div>
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          {/* Navigation Items */}
          <nav className="flex items-center space-x-1">
            {headerNavItems.map((item) => {
              const isActive = location === item.href;
              
              return (
                <Link key={item.label} href={item.href}>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive 
                        ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/30' 
                        : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/5'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Right Side - User Info */}
          <div className="flex items-center space-x-4">
            {/* Help */}
            <Link href="/help">
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-5 w-5 text-gray-400 hover:text-yellow-400" />
              </Button>
            </Link>
            
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative"
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5 text-gray-400 hover:text-yellow-400" />
                  {unreadCount > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-yellow-400 text-black"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-80 bg-zinc-900 border-yellow-400/20"
              >
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span className="text-white font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-yellow-400 hover:text-yellow-300 h-auto py-1"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-yellow-400/20" />
                
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex items-start gap-3 p-3 cursor-pointer focus:bg-zinc-800 ${
                          notification.read ? 'opacity-60' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-gray-500 hover:text-red-400"
                          onClick={(e) => dismissNotification(notification.id, e)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
                
                <DropdownMenuSeparator className="bg-yellow-400/20" />
                <Link href="/notifications">
                  <DropdownMenuItem className="justify-center text-yellow-400 hover:text-yellow-300 cursor-pointer focus:bg-zinc-800">
                    View all notifications
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile */}
            {username && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-black" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-white">{username}</div>
                    <div className="text-gray-500">Admin</div>
                  </div>
                </div>
                
                {onLogout && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLogout}
                    className="text-yellow-400 border-yellow-400/50 hover:bg-yellow-400 hover:text-black"
                  >
                    Logout
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}