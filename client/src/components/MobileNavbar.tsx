import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  BarChart3, 
  Upload, 
  AlertTriangle, 
  Menu, 
  Home,
  FileText,
  Settings,
  User
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Audit Issues", href: "/audit-issues", icon: AlertTriangle },
];

export default function MobileNavbar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center">
          <img 
            src="/isohub-logo.png" 
            alt="ISO Hub Logo" 
            className="h-8 w-auto"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="p-2">
            <User className="h-5 w-5" />
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-white">
              <div className="py-6">
                <div className="flex items-center justify-center mb-8">
                  <img 
                    src="/isohub-logo.png" 
                    alt="ISO Hub Logo" 
                    className="h-12 w-auto"
                  />
                </div>
                
                <nav className="space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href || 
                      (item.href !== "/" && location.startsWith(item.href));
                    
                    return (
                      <Link key={item.name} href={item.href}>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className={`w-full justify-start gap-3 h-12 ${
                            isActive 
                              ? "bg-primary text-black hover:bg-primary/90" 
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={() => setOpen(false)}
                        >
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>
                
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-gray-700">
                    <Settings className="h-5 w-5" />
                    Settings
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-40">
        <div className="flex items-center justify-around">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                    isActive ? "text-primary" : "text-gray-600"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.name.split(' ')[0]}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}