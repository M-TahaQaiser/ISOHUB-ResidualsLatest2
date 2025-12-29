import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Users, Mail, Key, Eye, EyeOff, Upload, Check, Clock, AlertTriangle, Palette, Settings, Edit, Trash2, ExternalLink, UserCheck, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Organization {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  isWhitelabel: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  description: string;
  status: 'active' | 'inactive' | 'pending' | 'setup';
  adminUsername: string;
  tempPassword: string | null;
  welcomeEmailSent: boolean;
  passwordEmailSent: boolean;
  emailDeliveryTracking: any;
  createdAt: string;
  updatedAt: string;
}

const createOrganizationSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  industry: z.string().optional(),
  description: z.string().optional(),
});

type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;

interface TestOrganizationTemplate {
  name: string;
  description: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const testOrganizationTemplates: TestOrganizationTemplate[] = [
  {
    name: "TechPay Solutions",
    description: "Modern fintech organization specializing in e-commerce payment solutions",
    companyName: "TechPay Solutions LLC",
    contactName: "Sarah Johnson",
    email: "sarah@techpaysolutions.com",
    phone: "(555) 123-4567",
    website: "https://techpaysolutions.com",
    industry: "Financial Technology",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    accentColor: "#F59E0B"
  },
  {
    name: "Merchant Gateway Pro",
    description: "Enterprise payment processing with multi-location support",
    companyName: "Merchant Gateway Pro Inc",
    contactName: "Michael Chen",
    email: "michael@merchantgatewaypro.com", 
    phone: "(555) 234-5678",
    website: "https://merchantgatewaypro.com",
    industry: "Payment Processing",
    primaryColor: "#10B981",
    secondaryColor: "#059669",
    accentColor: "#F97316"
  },
  {
    name: "RetailFlow Payments",
    description: "Retail-focused payment solutions with POS integration",
    companyName: "RetailFlow Payments Corp",
    contactName: "Jennifer Williams",
    email: "jennifer@retailflowpayments.com",
    phone: "(555) 345-6789", 
    website: "https://retailflowpayments.com",
    industry: "Retail Technology",
    primaryColor: "#8B5CF6",
    secondaryColor: "#7C3AED",
    accentColor: "#EF4444"
  }
];

export default function OrganizationManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TestOrganizationTemplate | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      website: '',
      industry: '',
      description: '',
    },
  });

  // Fetch organizations from both endpoints
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: async () => {
      try {
        // Try the agencies endpoint first (existing data)
        const agenciesResponse = await fetch('/api/agencies');
        if (agenciesResponse.ok) {
          const agencies = await agenciesResponse.json();
          return agencies;
        }
        
        // Fallback to admin organizations endpoint
        const orgResponse = await fetch('/api/admin/organizations');
        if (orgResponse.ok) {
          return orgResponse.json();
        }
        
        console.warn('Organizations endpoints not yet implemented, showing empty list');
        return [];
      } catch (error) {
        console.warn('Failed to fetch organizations:', error);
        return [];
      }
    },
  });

  // Create organization mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateOrganizationForm) => {
      // Debug: Log the data being sent
      console.log('Form data being sent:', data);
      
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          formData.append(key, value);
        }
      });
      
      // Debug: Log FormData entries
      console.log('FormData entries:');
      Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(`${key}:`, value);
      });
      
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      
      if (selectedTemplate) {
        formData.append('primaryColor', selectedTemplate.primaryColor);
        formData.append('secondaryColor', selectedTemplate.secondaryColor);
        formData.append('accentColor', selectedTemplate.accentColor);
      }

      return await apiRequest('/api/agencies', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      setShowCreateDialog(false);
      setSelectedTemplate(null);
      setLogoFile(null);
      form.reset();
      
      toast({
        title: "Organization Created Successfully",
        description: `${data.companyName} has been created and welcome emails sent.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create organization",
        variant: "destructive",
      });
    },
  });

  // Impersonation mutation
  const impersonateMutation = useMutation({
    mutationFn: async (organization: Organization) => {
      return await apiRequest(`/api/admin/impersonate/${organization.id}`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      // Store impersonation context
      sessionStorage.setItem('impersonatingOrganization', JSON.stringify({
        organizationName: data.companyName,
        adminUsername: data.adminUsername,
        originalUser: 'super-admin'
      }));
      
      toast({
        title: "Impersonation Started",
        description: `Now viewing as ${data.companyName}`,
      });
      
      // Redirect to dashboard or refresh page
      window.location.href = '/dashboard';
    },
    onError: (error) => {
      toast({
        title: "Impersonation Failed",
        description: error instanceof Error ? error.message : "Failed to start impersonation",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateOrganizationForm) => {
    createMutation.mutate(data);
  };

  const handleTemplateSelect = (template: TestOrganizationTemplate) => {
    setSelectedTemplate(template);
    form.setValue('companyName', template.companyName);
    form.setValue('contactName', template.contactName);
    form.setValue('email', template.email);
    form.setValue('phone', template.phone);
    form.setValue('website', template.website);
    form.setValue('industry', template.industry);
    form.setValue('description', template.description);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Logo must be under 5MB",
          variant: "destructive",
        });
        return;
      }
      setLogoFile(file);
    }
  };

  const copyActivationLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Activation link copied to clipboard",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case 'setup':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Setup</Badge>;
      case 'inactive':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Organization Management</h1>
            <p className="text-gray-400 mt-2">Create and manage client organizations for the multi-tenant platform</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-yellow-400/20">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Organization</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="templates" className="mt-4">
                <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                  <TabsTrigger value="templates" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">Quick Templates</TabsTrigger>
                  <TabsTrigger value="manual" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">Manual Setup</TabsTrigger>
                </TabsList>
                
                <TabsContent value="templates" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {testOrganizationTemplates.map((template, index) => (
                      <Card 
                        key={index} 
                        className={`cursor-pointer transition-all bg-zinc-800 border-yellow-400/20 ${
                          selectedTemplate?.name === template.name 
                            ? 'border-yellow-400 bg-yellow-400/10' 
                            : 'hover:border-yellow-400/40'
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: template.primaryColor }}
                            />
                            <CardTitle className="text-lg text-white">{template.name}</CardTitle>
                          </div>
                          <p className="text-sm text-gray-400">{template.description}</p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="text-xs space-y-1 text-gray-300">
                            <p><strong className="text-gray-400">Contact:</strong> {template.contactName}</p>
                            <p><strong className="text-gray-400">Industry:</strong> {template.industry}</p>
                            <p><strong className="text-gray-400">Email:</strong> {template.email}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-4">
                  <div className="text-sm text-gray-400 mb-4">
                    Create a custom organization configuration from scratch.
                  </div>
                </TabsContent>
              </Tabs>
              
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName" className="text-gray-300">Company Name *</Label>
                    <Input
                      id="companyName"
                      {...form.register('companyName')}
                      placeholder="Enter company name"
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                    {form.formState.errors.companyName && (
                      <p className="text-red-400 text-sm mt-1">{form.formState.errors.companyName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="contactName" className="text-gray-300">Contact Name *</Label>
                    <Input
                      id="contactName"
                      {...form.register('contactName')}
                      placeholder="Primary contact name"
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                    {form.formState.errors.contactName && (
                      <p className="text-red-400 text-sm mt-1">{form.formState.errors.contactName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-gray-300">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register('email')}
                      placeholder="contact@company.com"
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                    {form.formState.errors.email && (
                      <p className="text-red-400 text-sm mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="text-gray-300">Phone</Label>
                    <Input
                      id="phone"
                      {...form.register('phone')}
                      placeholder="(555) 123-4567"
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website" className="text-gray-300">Website</Label>
                    <Input
                      id="website"
                      {...form.register('website')}
                      placeholder="https://company.com"
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                    {form.formState.errors.website && (
                      <p className="text-red-400 text-sm mt-1">{form.formState.errors.website.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="industry" className="text-gray-300">Industry</Label>
                    <Input
                      id="industry"
                      {...form.register('industry')}
                      placeholder="e.g., Financial Technology"
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-gray-300">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Brief description of the organization..."
                    rows={3}
                    className="bg-zinc-800 border-yellow-400/30 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-300">Logo Upload</Label>
                  <div className="mt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-gray-600 text-gray-300 hover:bg-zinc-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {logoFile ? logoFile.name : 'Choose Logo'}
                    </Button>
                    {logoFile && (
                      <p className="text-sm text-green-400 mt-1">
                        Logo selected: {logoFile.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <DialogFooter className="pt-4 border-t border-yellow-400/20">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    className="border-gray-600 text-gray-300 hover:bg-zinc-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Organization'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Organizations List */}
        <Card className="bg-zinc-900/80 border-yellow-400/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Building2 className="h-5 w-5 mr-2 text-yellow-400" />
              Organizations ({organizations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-400">Loading organizations...</div>
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No organizations found</p>
                <p className="text-sm text-gray-500">Create your first organization to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-yellow-400/20 hover:bg-zinc-800/50">
                    <TableHead className="text-gray-300">Organization</TableHead>
                    <TableHead className="text-gray-300">Contact</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Created</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org: Organization) => (
                    <TableRow key={org.id} className="border-yellow-400/20 hover:bg-zinc-800/50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {org.logoUrl ? (
                            <img 
                              src={org.logoUrl} 
                              alt={`${org.companyName} logo`}
                              className="w-8 h-8 rounded"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-zinc-700 rounded flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-yellow-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-white">{org.companyName}</div>
                            {org.website && (
                              <div className="text-sm text-gray-400">{org.website}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">{org.contactName}</div>
                          <div className="text-sm text-gray-400">{org.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(org.status)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => impersonateMutation.mutate(org)}
                            disabled={impersonateMutation.isPending}
                            className="border-gray-600 text-gray-300 hover:bg-zinc-700"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-zinc-700">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Sales to Self-Onboarding Process */}
        <Card className="bg-zinc-900/80 border-yellow-400/20">
          <CardHeader>
            <CardTitle className="text-white">Sales to Self-Onboarding Process</CardTitle>
            <p className="text-gray-400 text-sm">How the end-to-end onboarding flow works</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-yellow-400 text-black font-bold flex items-center justify-center mx-auto mb-3">1</div>
                <h4 className="font-semibold text-white mb-1">Create Organization</h4>
                <p className="text-sm text-gray-400">Admin creates new organization after sales completion</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-green-500 text-white font-bold flex items-center justify-center mx-auto mb-3">2</div>
                <h4 className="font-semibold text-white mb-1">Welcome Email</h4>
                <p className="text-sm text-gray-400">System sends activation email with secure link</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center mx-auto mb-3">3</div>
                <h4 className="font-semibold text-white mb-1">Account Activation</h4>
                <p className="text-sm text-gray-400">User activates account and sets password</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-purple-500 text-white font-bold flex items-center justify-center mx-auto mb-3">4</div>
                <h4 className="font-semibold text-white mb-1">Self-Onboarding</h4>
                <p className="text-sm text-gray-400">7-step guided setup with dashboard tour</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}