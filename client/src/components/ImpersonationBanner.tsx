import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, X, RotateCcw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ImpersonationBannerProps {
  organizationName: string;
  adminUsername: string;
  onExitImpersonation: () => void;
}

export default function ImpersonationBanner({ 
  organizationName, 
  adminUsername, 
  onExitImpersonation 
}: ImpersonationBannerProps) {
  const { toast } = useToast();

  const handleExitImpersonation = async () => {
    try {
      // Call API to properly end impersonation session
      await apiRequest('/api/organizations/exit-impersonation', {
        method: 'POST'
      });

      // Restore super admin context from sessionStorage
      const superAdminContext = sessionStorage.getItem('superAdminContext');
      if (superAdminContext) {
        const adminAuth = JSON.parse(superAdminContext);
        
        // Restore original admin credentials
        localStorage.setItem('username', adminAuth.username);
        localStorage.setItem('authToken', adminAuth.token);
        localStorage.setItem('organization', adminAuth.organization);
        
        // Clear impersonation data
        sessionStorage.removeItem('superAdminContext');
        sessionStorage.removeItem('impersonatingOrganization');
        
        toast({
          title: "Impersonation Ended",
          description: "Restored to super admin account. Redirecting to organization management...",
        });

        // Navigate back to organization management
        setTimeout(() => {
          window.location.href = '/organizations';
        }, 1000);
      } else {
        // No stored context found - clear impersonation flags and redirect anyway
        sessionStorage.removeItem('impersonatingOrganization');
        
        toast({
          title: "Session Ended",
          description: "Returning to organization management. You may need to log in again.",
        });

        // Navigate back to organization management
        setTimeout(() => {
          window.location.href = '/organizations';
        }, 1000);
      }
    } catch (error: any) {
      toast({
        title: "Exit Failed",
        description: error.message || "Failed to exit impersonation mode",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 shadow-lg border-b">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <UserCheck className="h-5 w-5" />
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              IMPERSONATING
            </Badge>
            <span className="font-medium">
              Logged in as <strong>{adminUsername}</strong> for <strong>{organizationName}</strong>
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-90">
            Super Admin troubleshooting mode
          </span>
          <Button
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            onClick={handleExitImpersonation}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Exit & Return to Admin
          </Button>
        </div>
      </div>
    </div>
  );
}