import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Building2, Users, CheckCircle2, AlertCircle, Copy, ExternalLink, Settings, Eye, UserCheck, Mail, MailOpen, MousePointerClick, Clock, Send, CheckCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import Breadcrumbs from '@/components/Breadcrumbs';

const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  adminContactName: z.string().min(1, "Admin contact name is required"),
  adminContactEmail: z.string().email("Please enter a valid email address"),
  adminContactPhone: z.string().optional(),
  industry: z.string().optional(),
});

type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;

interface EmailTrackingStatus {
  sent?: boolean;
  sentAt?: string;
  delivered?: boolean;
  deliveredAt?: string;
  opened?: boolean;
  openedAt?: string;
  clicked?: boolean;
  clickedAt?: string;
}

const safeClipboardWrite = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (err) {
    console.error('Clipboard write failed:', err);
    return false;
  }
};

export default function AdminOrganizationManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      website: '',
      adminContactName: '',
      adminContactEmail: '',
      adminContactPhone: '',
      industry: '',
    },
  });

  // Fetch organizations list
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['/api/onboarding/organizations'],
    queryFn: async () => {
      const response = await fetch('/api/onboarding/organizations');
      if (!response.ok) {
        console.warn('Failed to fetch organizations');
        return [];
      }
      return response.json();
    },
  });

  // Create organization mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateOrganizationForm) => {
      return await apiRequest('/api/onboarding/organizations', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/organizations'] });
      setIsCreateDialogOpen(false);
      form.reset();
      
      if (data.activationLink) {
        const activationLink = data.activationLink.replace('{{FRONTEND_URL}}', '');
        const fullLink = window.location.origin + activationLink;
        
        const copied = await safeClipboardWrite(fullLink);
        
        toast({
          title: "Organization Created Successfully!",
          description: copied 
            ? `Opening onboarding flow for testing. Activation link also copied to clipboard.`
            : `Opening onboarding flow for testing. Use Copy button to get the activation link.`,
          duration: 5000,
        });
        
        setTimeout(() => {
          window.open(activationLink, '_blank');
        }, 1500);
      } else {
        toast({
          title: "Organization Created",
          description: `Welcome email sent to ${form.getValues('adminContactEmail')}`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create organization",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateOrganizationForm) => {
    createMutation.mutate(data);
  };

  const copyActivationLink = async (link: string) => {
    const success = await safeClipboardWrite(link);
    toast({
      title: success ? "Link Copied" : "Copy Failed",
      description: success 
        ? "Activation link copied to clipboard"
        : "Could not copy to clipboard. Please select and copy manually.",
      variant: success ? "default" : "destructive",
    });
  };

  const handleImpersonate = (organizationId: string, organizationName: string) => {
    // Store impersonation data in sessionStorage
    sessionStorage.setItem('impersonatingOrganization', JSON.stringify({
      id: organizationId,
      name: organizationName,
      startedAt: new Date().toISOString()
    }));
    
    toast({
      title: "Entering Organization View",
      description: `Now viewing ${organizationName} dashboard`,
    });
    
    // Navigate to organization dashboard
    navigate('/org/dashboard');
  };

  const handleManageOrganization = (organizationId: string) => {
    // Navigate to organization settings/management page
    navigate(`/org/${organizationId}/settings`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      setup: { label: 'Setup', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      onboarding: { label: 'Onboarding', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      active: { label: 'Active', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      inactive: { label: 'Inactive', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      suspended: { label: 'Suspended', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    };

    const config = statusConfig[status] || statusConfig.setup;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumbs 
          items={[
            { label: 'Admin', href: '/dashboard' },
            { label: 'Organization Management', href: '/admin/organizations', isActive: true }
          ]} 
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Organization Management</h1>
            <p className="text-gray-400 mt-1">
              Create and manage client organizations for the multi-tenant platform
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-zinc-900 border-yellow-400/20">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Organization</DialogTitle>
                <DialogDescription className="text-gray-400">
                  This will create a new client organization and send a welcome email with activation instructions.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Organization Name *</Label>
                    <Input
                      id="name"
                      placeholder="Acme Payment Solutions"
                      {...form.register('name')}
                      disabled={createMutation.isPending}
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-400">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-gray-300">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://acmepayments.com"
                      {...form.register('website')}
                      disabled={createMutation.isPending}
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                    {form.formState.errors.website && (
                      <p className="text-sm text-red-400">{form.formState.errors.website.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminContactName" className="text-gray-300">Admin Contact Name *</Label>
                    <Input
                      id="adminContactName"
                      placeholder="John Smith"
                      {...form.register('adminContactName')}
                      disabled={createMutation.isPending}
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                    {form.formState.errors.adminContactName && (
                      <p className="text-sm text-red-400">{form.formState.errors.adminContactName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminContactEmail" className="text-gray-300">Admin Email *</Label>
                    <Input
                      id="adminContactEmail"
                      type="email"
                      placeholder="john@acmepayments.com"
                      {...form.register('adminContactEmail')}
                      disabled={createMutation.isPending}
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                    {form.formState.errors.adminContactEmail && (
                      <p className="text-sm text-red-400">{form.formState.errors.adminContactEmail.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminContactPhone" className="text-gray-300">Phone Number</Label>
                    <Input
                      id="adminContactPhone"
                      placeholder="+1 (555) 123-4567"
                      {...form.register('adminContactPhone')}
                      disabled={createMutation.isPending}
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-gray-300">Industry</Label>
                    <Input
                      id="industry"
                      placeholder="Payment Processing"
                      {...form.register('industry')}
                      disabled={createMutation.isPending}
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                  </div>
                </div>

                <div className="bg-yellow-400/10 border border-yellow-400/30 p-3 rounded-md text-sm text-gray-300">
                  <p className="font-medium text-yellow-400">What happens next:</p>
                  <ul className="mt-1 space-y-1 text-xs text-gray-400">
                    <li>• Organization workspace is created</li>
                    <li>• Welcome email with activation link is sent</li>
                    <li>• Admin can activate account and begin onboarding</li>
                    <li>• 7-step guided setup process</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-yellow-400/20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={createMutation.isPending}
                    className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Organization'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Organizations List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
          </div>
        ) : (
          <div className="grid gap-6">
            {(organizations as any[])?.length > 0 ? (
              (organizations as any[]).map((org: any) => (
                <Card key={org.id} className="bg-zinc-900/80 border-yellow-400/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-black" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-white">{org.name}</CardTitle>
                          <CardDescription>
                            {org.website && (
                              <a 
                                href={org.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-yellow-400 hover:underline inline-flex items-center"
                              >
                                {org.website}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(org.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium text-sm text-gray-400 mb-2">Admin Contact</h4>
                        <p className="text-sm text-white">{org.adminContactName}</p>
                        <p className="text-sm text-gray-400">{org.adminContactEmail}</p>
                        {org.adminContactPhone && (
                          <p className="text-sm text-gray-400">{org.adminContactPhone}</p>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-gray-400 mb-2">Details</h4>
                        {org.industry && <p className="text-sm text-white">Industry: {org.industry}</p>}
                        <p className="text-sm text-gray-400">ID: {org.organizationId}</p>
                        <p className="text-sm text-gray-400">
                          Created: {new Date(org.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-gray-400 mb-2">Email Status</h4>
                        <TooltipProvider>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const tracking = org.emailDeliveryTracking as EmailTrackingStatus | null;
                              const emailSent = org.welcomeEmailSent || tracking?.sent;
                              
                              return (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                                        emailSent 
                                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                      }`}>
                                        <Send className="h-3 w-3" />
                                        <span>Sent</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-800 border-zinc-700">
                                      <p className="text-white text-xs">
                                        {emailSent 
                                          ? `Email sent ${tracking?.sentAt ? new Date(tracking.sentAt).toLocaleString() : 'successfully'}`
                                          : 'Email not yet sent'}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                                        tracking?.delivered 
                                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                      }`}>
                                        <CheckCheck className="h-3 w-3" />
                                        <span>Delivered</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-800 border-zinc-700">
                                      <p className="text-white text-xs">
                                        {tracking?.delivered 
                                          ? `Delivered ${tracking.deliveredAt ? new Date(tracking.deliveredAt).toLocaleString() : ''}`
                                          : 'Awaiting delivery confirmation'}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                                        tracking?.opened 
                                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                      }`}>
                                        <MailOpen className="h-3 w-3" />
                                        <span>Opened</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-800 border-zinc-700">
                                      <p className="text-white text-xs">
                                        {tracking?.opened 
                                          ? `Opened ${tracking.openedAt ? new Date(tracking.openedAt).toLocaleString() : ''}`
                                          : 'Not yet opened'}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                                        tracking?.clicked 
                                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                      }`}>
                                        <MousePointerClick className="h-3 w-3" />
                                        <span>Clicked</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-800 border-zinc-700">
                                      <p className="text-white text-xs">
                                        {tracking?.clicked 
                                          ? `Link clicked ${tracking.clickedAt ? new Date(tracking.clickedAt).toLocaleString() : ''}`
                                          : 'Link not yet clicked'}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              );
                            })()}
                          </div>
                        </TooltipProvider>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <h4 className="font-medium text-sm text-gray-400 mb-3">Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        {org.activationToken && !org.welcomeEmailSent && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyActivationLink(`/activate?token=${org.activationToken}`)}
                            className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                          >
                            <Copy className="h-3 w-3 mr-2" />
                            Copy Activation Link
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                          onClick={() => handleImpersonate(org.organizationId, org.name)}
                          data-testid={`button-view-dashboard-${org.organizationId}`}
                        >
                          <Eye className="h-3 w-3 mr-2" />
                          View Dashboard
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                          onClick={() => handleManageOrganization(org.organizationId)}
                          data-testid={`button-manage-${org.organizationId}`}
                        >
                          <Settings className="h-3 w-3 mr-2" />
                          Manage Settings
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-zinc-900/80 border-yellow-400/20">
                <CardContent className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Organizations Yet</h3>
                  <p className="text-gray-400 mb-4">
                    Create your first client organization to get started with the multi-tenant platform.
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Organization
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Instructions Card */}
        <Card className="bg-zinc-900/80 border-yellow-400/20">
          <CardHeader>
            <CardTitle className="text-white">Sales to Self-Onboarding Process</CardTitle>
            <CardDescription className="text-gray-400">
              How the end-to-end onboarding flow works
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2 text-center">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-sm font-bold text-black">1</span>
                </div>
                <h4 className="font-medium text-white">Create Organization</h4>
                <p className="text-sm text-gray-400">
                  Admin creates new organization after sales completion
                </p>
              </div>
              
              <div className="space-y-2 text-center">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-sm font-bold text-white">2</span>
                </div>
                <h4 className="font-medium text-white">Welcome Email</h4>
                <p className="text-sm text-gray-400">
                  System sends activation email with secure link
                </p>
              </div>
              
              <div className="space-y-2 text-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-sm font-bold text-white">3</span>
                </div>
                <h4 className="font-medium text-white">Account Activation</h4>
                <p className="text-sm text-gray-400">
                  User activates account and sets password
                </p>
              </div>
              
              <div className="space-y-2 text-center">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-sm font-bold text-white">4</span>
                </div>
                <h4 className="font-medium text-white">Self-Onboarding</h4>
                <p className="text-sm text-gray-400">
                  7-step guided setup with dashboard tour
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}