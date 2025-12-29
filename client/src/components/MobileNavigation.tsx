import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  FileText, 
  TrendingUp, 
  Settings, 
  Menu,
  X,
  DollarSign,
  Users,
  Shield,
  Archive,
  Megaphone,
  LogIn,
  Brain,
  Upload,
  WifiOff
} from "lucide-react";

interface MobileNavigationProps {
  username?: string;
  onLogout?: () => void;
}

export default function MobileNavigation({ username, onLogout }: MobileNavigationProps) {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const bottomNavItems = [
    { label: "Home", icon: Home, href: "/dashboard" },
    { label: "Reports", icon: FileText, href: "/reports" },
    { label: "ISO-AI", icon: Brain, href: "/iso-ai", highlight: true },
    { label: "Upload", icon: Upload, href: "/residuals-workflow" },
    { label: "More", icon: Menu, href: "#menu", isMenu: true }
  ];

  const sidebarItems = [
    { label: "Dashboard", icon: Home, href: "/dashboard" },
    { label: "Residuals", icon: DollarSign, href: "/residuals-workflow" },
    { label: "Reports", icon: FileText, href: "/reports" },
    { label: "ISO-AI", icon: Brain, href: "/iso-ai" },
    { label: "Admin", icon: Settings, href: "/admin" }
  ];

  const headerItems = [
    { label: "Logins", icon: LogIn, href: "/login-portal" },
    { label: "Documents", icon: FileText, href: "/documents" },
    { label: "Pre-Applications", icon: Archive, href: "/pre-applications" },
    { label: "Secured Docs", icon: Shield, href: "/secured-docs" },
    { label: "Marketing", icon: Megaphone, href: "/marketing" }
  ];

  return (
    <>
      {/* Mobile Top Navigation */}
      <nav className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center">
            <img 
              src="/isohub-logo.png" 
              alt="ISO Hub Logo" 
              className="h-8 w-auto"
            />
          </div>
        </div>
        
        {username && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">{username}</span>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-red-600">
              Logout
            </Button>
          </div>
        )}
      </nav>

      {/* Mobile Slide-out Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                  <span className="text-black font-bold text-sm">ISO</span>
                </div>
                <span className="font-semibold text-black dark:text-white">ISOHub</span>
              </div>
            </div>
            
            {/* Header Navigation */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Quick Access</h3>
              <div className="space-y-1">
                {headerItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <Link key={item.label} href={item.href}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start ${
                          isActive 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* Main Navigation */}
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Main Menu</h3>
              <div className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <Link key={item.label} href={item.href}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start ${
                          isActive 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-14 left-0 right-0 md:hidden bg-yellow-500 text-black px-4 py-2 z-50 flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">You're offline - Some features may be limited</span>
        </div>
      )}

      {/* Mobile Bottom Navigation - Enhanced with safe-area padding */}
      <nav 
        className="fixed bottom-0 left-0 right-0 md:hidden bg-black/95 backdrop-blur-lg border-t border-gray-800 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        data-testid="mobile-bottom-nav"
      >
        <div className="flex justify-around items-center px-1 py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href === '/dashboard' && location === '/');
            
            if (item.isMenu) {
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex flex-col items-center gap-0.5 p-2 min-w-[60px] h-auto text-gray-400 hover:text-white active:scale-95 transition-all"
                  data-testid="nav-more-menu"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Button>
              );
            }

            return (
              <Link key={item.label} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center gap-0.5 p-2 min-w-[60px] h-auto active:scale-95 transition-all ${
                    item.highlight
                      ? isActive
                        ? 'text-yellow-400'
                        : 'text-yellow-500/80 hover:text-yellow-400'
                      : isActive 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-white'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.highlight ? (
                    <div className={`p-1.5 rounded-full ${isActive ? 'bg-yellow-500' : 'bg-yellow-500/20'}`}>
                      <Icon className={`h-5 w-5 ${isActive ? 'text-black' : 'text-yellow-400'}`} />
                    </div>
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding spacer for content */}
      <div 
        className="md:hidden h-20" 
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-hidden="true"
      />
    </>
  );
}