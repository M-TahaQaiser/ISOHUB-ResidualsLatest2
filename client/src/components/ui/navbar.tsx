import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, User, BarChart3, Menu, X, HelpCircle, Bell } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications] = useState([
    { id: 1, title: "New pre-application submitted", time: "2 min ago", unread: true },
    { id: 2, title: "Data upload completed for Clearent", time: "1 hour ago", unread: true },
    { id: 3, title: "Monthly report ready for review", time: "3 hours ago", unread: false },
    { id: 4, title: "User account activated", time: "1 day ago", unread: false }
  ]);
  
  const unreadCount = notifications.filter(n => n.unread).length;

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 bg-primary rounded-md">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                </div>
                <h1 className="text-lg sm:text-xl font-semibold text-black hidden xs:block">ISO Hub Residuals</h1>
                <h1 className="text-lg font-semibold text-black xs:hidden">ISO Hub</h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex lg:space-x-8">
            <Link href="/">
              <span className={`text-sm font-medium transition-colors duration-200 ${
                isActive("/") 
                  ? "text-primary border-b-2 border-primary pb-4" 
                  : "text-black hover:text-gray-700"
              }`}>
                Dashboard
              </span>
            </Link>
            <Link href="/uploads">
              <span className={`text-sm font-medium transition-colors duration-200 ${
                isActive("/uploads") 
                  ? "text-primary border-b-2 border-primary pb-4" 
                  : "text-black hover:text-gray-700"
              }`}>
                Data Uploads
              </span>
            </Link>
            <Link href="/reports">
              <span className={`text-sm font-medium transition-colors duration-200 ${
                isActive("/reports") 
                  ? "text-primary border-b-2 border-primary pb-4" 
                  : "text-black hover:text-gray-700"
              }`}>
                Reports
              </span>
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            <Link href="/uploads">
              <Button className="bg-primary hover:bg-primary/90 text-black px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-colors">
                <Plus className="mr-1 lg:mr-2 h-4 w-4" />
                <span className="hidden lg:inline">New Upload</span>
                <span className="lg:hidden">Upload</span>
              </Button>
            </Link>
            <div className="flex items-center space-x-2 lg:space-x-3">
              {/* Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
                    <Bell className="h-4 w-4 text-gray-600 hover:text-primary" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500 hover:bg-red-500">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="px-3 py-2 border-b">
                    <h4 className="font-medium">Notifications</h4>
                    <p className="text-sm text-gray-500">{unreadCount} unread</p>
                  </div>
                  {notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="px-3 py-3 cursor-pointer">
                      <div className="flex flex-col space-y-1 w-full">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm ${notification.unread ? 'font-medium' : 'font-normal'}`}>
                            {notification.title}
                          </p>
                          {notification.unread && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{notification.time}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <div className="px-3 py-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-sm">
                      View all notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Help Icon */}
              <Link href="/help">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <HelpCircle className="h-4 w-4 text-gray-600 hover:text-primary" />
                </Button>
              </Link>
              
              {/* User Profile */}
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-black hidden lg:block">Admin User</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            <Link href="/uploads">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-black p-2">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/">
                <div 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/") 
                      ? "text-primary bg-primary/10" 
                      : "text-black hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </div>
              </Link>
              <Link href="/uploads">
                <div 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/uploads") 
                      ? "text-primary bg-primary/10" 
                      : "text-black hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Data Uploads
                </div>
              </Link>
              <Link href="/reports">
                <div 
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive("/reports") 
                      ? "text-primary bg-primary/10" 
                      : "text-black hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Reports
                </div>
              </Link>
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="flex items-center px-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <span className="ml-3 text-sm font-medium text-black">Admin User</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
