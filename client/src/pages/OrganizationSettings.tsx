import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Save, 
  Building2, 
  Globe, 
  Mail, 
  Palette, 
  Users,
  Shield,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Upload,
  Loader2,
  Link,
  Eye,
  EyeOff
} from 'lucide-react';

const generalSettingsSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  industry: z.string().optional(),
  description: z.string().optional(),
  primaryContact: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  supportEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  billingEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
});

const brandingSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Please enter a valid hex color"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Please enter a valid hex color"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Please enter a valid hex color"),
  logoUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

const domainSettingsSchema = z.object({
  domainType: z.enum(['standard', 'subdomain', 'custom']),
  customDomain: z.string().optional(),
  subdomainPrefix: z.string().optional(),
});

type GeneralSettingsForm = z.infer<typeof generalSettingsSchema>;
type BrandingSettingsForm = z.infer<typeof brandingSettingsSchema>;
type DomainSettingsForm = z.infer<typeof domainSettingsSchema>;

interface OrganizationData {
  id?: number;
  organizationId: string;
  name: string;
  website?: string;
  industry?: string;
  adminContactEmail?: string;
  supportEmail?: string;
  billingEmail?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  domainType?: string;
  customDomain?: string;
  subdomainPrefix?: string;
  status?: string;
  businessProfile?: string;
  description?: string;
  apiKey?: string;
  webhookUrl?: string;
}

interface UpdateOrganizationData {
  name?: string;
  website?: string;
  industry?: string;
  description?: string;
  primaryContactEmail?: string;
  supportEmail?: string;
  billingEmail?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  domainType?: string;
  customDomain?: string;
  subdomainPrefix?: string;
}

export default function OrganizationSettings() {
  const params = useParams() as { orgId: string };
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [showApiKey, setShowApiKey] = useState(false);

  const impersonationData = sessionStorage.getItem('impersonatingOrganization');
  const isImpersonating = !!impersonationData;

  // Fetch real organization data from API with cache busting
  const { data: organizationData, isLoading, error } = useQuery<OrganizationData>({
    queryKey: ['/api/onboarding/organizations', params.orgId],
    queryFn: async () => {
      // Add cache-busting timestamp to ensure fresh data on every request
      const timestamp = Date.now();
      const response = await fetch(`/api/onboarding/organizations/${params.orgId}?_=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch organization');
      return response.json();
    },
    enabled: !!params.orgId,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    gcTime: 0, // Don't cache data
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Mutation for updating organization
  const updateOrgMutation = useMutation({
    mutationFn: async (data: UpdateOrganizationData) => {
      return apiRequest(`/api/onboarding/organizations/${params.orgId}`, {
        method: 'PUT',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/organizations', params.orgId] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/organizations'] });
    },
  });

  const generalForm = useForm<GeneralSettingsForm>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      name: '',
      website: '',
      industry: '',
      description: '',
      primaryContact: '',
      supportEmail: '',
      billingEmail: '',
    },
  });

  const brandingForm = useForm<BrandingSettingsForm>({
    resolver: zodResolver(brandingSettingsSchema),
    defaultValues: {
      primaryColor: '#FFD700',
      secondaryColor: '#000000',
      accentColor: '#FFFFFF',
      logoUrl: '',
    },
  });

  const domainForm = useForm<DomainSettingsForm>({
    resolver: zodResolver(domainSettingsSchema),
    defaultValues: {
      domainType: 'standard',
      customDomain: '',
      subdomainPrefix: '',
    },
  });

  // Reset forms when organization data loads
  useEffect(() => {
    if (organizationData) {
      // Extract description from businessProfile directly
      let description = '';
      if (organizationData.businessProfile) {
        const profile = typeof organizationData.businessProfile === 'string' 
          ? JSON.parse(organizationData.businessProfile) 
          : organizationData.businessProfile;
        description = profile?.description || '';
      }
      
      generalForm.reset({
        name: organizationData.name || '',
        website: organizationData.website || '',
        industry: organizationData.industry || '',
        description: description,
        primaryContact: organizationData.adminContactEmail || '',
        supportEmail: organizationData.supportEmail || '',
        billingEmail: organizationData.billingEmail || '',
      });
      brandingForm.reset({
        primaryColor: organizationData.primaryColor || '#FFD700',
        secondaryColor: organizationData.secondaryColor || '#000000',
        accentColor: organizationData.accentColor || '#FFFFFF',
        logoUrl: organizationData.logoUrl || '',
      });
      domainForm.reset({
        domainType: (organizationData.domainType as 'standard' | 'subdomain' | 'custom') || 'standard',
        customDomain: organizationData.customDomain || '',
        subdomainPrefix: organizationData.subdomainPrefix || '',
      });
    }
  }, [organizationData]);

  const handleGeneralSubmit = async (data: GeneralSettingsForm) => {
    try {
      await updateOrgMutation.mutateAsync({
        name: data.name,
        website: data.website,
        industry: data.industry,
        description: data.description,
        primaryContactEmail: data.primaryContact,
        supportEmail: data.supportEmail,
        billingEmail: data.billingEmail,
      });
      toast({
        title: "Settings Updated",
        description: "General settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBrandingSubmit = async (data: BrandingSettingsForm) => {
    try {
      await updateOrgMutation.mutateAsync({
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        logoUrl: data.logoUrl,
      });
      toast({
        title: "Branding Updated",
        description: "Branding settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save branding settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDomainSubmit = async (data: DomainSettingsForm) => {
    try {
      await updateOrgMutation.mutateAsync({
        domainType: data.domainType,
        customDomain: data.customDomain,
        subdomainPrefix: data.subdomainPrefix,
      });
      toast({
        title: "Domain Settings Updated",
        description: "Domain configuration has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save domain settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const regenerateApiKey = () => {
    toast({
      title: "API Key Regenerated",
      description: "A new API key has been generated. Please update your integrations.",
      variant: "default",
    });
  };

  const handleBack = () => {
    if (isImpersonating) {
      navigate('/org/dashboard');
    } else {
      navigate('/organizations');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  // Error state
  if (error || !organizationData) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white">Failed to load organization settings</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/organizations')}
          >
            Back to Organizations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-yellow-400 hover:bg-yellow-400/10"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Organization Settings</h1>
                <p className="text-gray-400">
                  Manage settings for {organizationData.name}
                </p>
              </div>
            </div>
          </div>
          
          <Badge className={organizationData.status === 'active' 
            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
            {organizationData.status}
          </Badge>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-zinc-900 border border-yellow-400/20">
            <TabsTrigger value="general" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-400">General</TabsTrigger>
            <TabsTrigger value="branding" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-400">Branding</TabsTrigger>
            <TabsTrigger value="domain" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-400">Domain</TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-400">API & Webhooks</TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black text-gray-400">Billing</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card className="bg-zinc-900/80 border-yellow-400/20">
              <CardHeader>
                <CardTitle className="text-white">General Information</CardTitle>
                <CardDescription className="text-gray-400">
                  Basic information about the organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={generalForm.handleSubmit(handleGeneralSubmit)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-300">Organization Name</Label>
                      <Input
                        id="name"
                        {...generalForm.register('name')}
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                        data-testid="input-org-name"
                      />
                      {generalForm.formState.errors.name && (
                        <p className="text-sm text-red-400">{generalForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-gray-300">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        {...generalForm.register('website')}
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                        data-testid="input-website"
                      />
                      {generalForm.formState.errors.website && (
                        <p className="text-sm text-red-400">{generalForm.formState.errors.website.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-gray-300">Industry</Label>
                      <Input
                        id="industry"
                        {...generalForm.register('industry')}
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                        data-testid="input-industry"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="primaryContact" className="text-gray-300">Primary Contact Email</Label>
                      <Input
                        id="primaryContact"
                        type="email"
                        {...generalForm.register('primaryContact')}
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                        data-testid="input-primary-contact"
                      />
                      {generalForm.formState.errors.primaryContact && (
                        <p className="text-sm text-red-400">{generalForm.formState.errors.primaryContact.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="supportEmail" className="text-gray-300">Support Email</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        {...generalForm.register('supportEmail')}
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                        data-testid="input-support-email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="billingEmail" className="text-gray-300">Billing Email</Label>
                      <Input
                        id="billingEmail"
                        type="email"
                        {...generalForm.register('billingEmail')}
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                        data-testid="input-billing-email"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300">Description</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      {...generalForm.register('description')}
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                      data-testid="textarea-description"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Settings */}
          <TabsContent value="branding" className="space-y-4">
            <Card className="bg-zinc-900/80 border-yellow-400/20">
              <CardHeader>
                <CardTitle className="text-white">Branding & Appearance</CardTitle>
                <CardDescription className="text-gray-400">
                  Customize the look and feel of your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={brandingForm.handleSubmit(handleBrandingSubmit)} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logoUrl" className="text-gray-300">Logo URL</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="logoUrl"
                          type="url"
                          placeholder="https://example.com/logo.png"
                          {...brandingForm.register('logoUrl')}
                          className="bg-zinc-800 border-yellow-400/30 text-white"
                          data-testid="input-logo-url"
                        />
                        <Button type="button" variant="outline" className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor" className="text-gray-300">Primary Color</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="primaryColor"
                            type="text"
                            {...brandingForm.register('primaryColor')}
                            className="bg-zinc-800 border-yellow-400/30 text-white"
                            data-testid="input-primary-color"
                          />
                          <div 
                            className="w-10 h-10 rounded border border-yellow-400/30"
                            style={{ backgroundColor: brandingForm.watch('primaryColor') }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor" className="text-gray-300">Secondary Color</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="secondaryColor"
                            type="text"
                            {...brandingForm.register('secondaryColor')}
                            className="bg-zinc-800 border-yellow-400/30 text-white"
                            data-testid="input-secondary-color"
                          />
                          <div 
                            className="w-10 h-10 rounded border border-yellow-400/30"
                            style={{ backgroundColor: brandingForm.watch('secondaryColor') }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accentColor" className="text-gray-300">Accent Color</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="accentColor"
                            type="text"
                            {...brandingForm.register('accentColor')}
                            className="bg-zinc-800 border-yellow-400/30 text-white"
                            data-testid="input-accent-color"
                          />
                          <div 
                            className="w-10 h-10 rounded border border-yellow-400/30"
                            style={{ backgroundColor: brandingForm.watch('accentColor') }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Alert className="bg-yellow-400/10 border-yellow-400/30">
                    <Palette className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-gray-300">
                      These colors will be used throughout the organization's interface and branded materials.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-end">
                    <Button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                      <Save className="h-4 w-4 mr-2" />
                      Save Branding
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Domain Settings */}
          <TabsContent value="domain" className="space-y-4">
            <Card className="bg-zinc-900/80 border-yellow-400/20">
              <CardHeader>
                <CardTitle className="text-white">Domain Configuration</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure how users access your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={domainForm.handleSubmit(handleDomainSubmit)} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="domainType" className="text-gray-300">Domain Type</Label>
                      <Select
                        value={domainForm.watch('domainType')}
                        onValueChange={(value) => domainForm.setValue('domainType', value as any)}
                      >
                        <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white" data-testid="select-domain-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-yellow-400/20">
                          <SelectItem value="standard" className="text-white hover:bg-zinc-700">Standard (isohub.com)</SelectItem>
                          <SelectItem value="subdomain" className="text-white hover:bg-zinc-700">Subdomain (yourname.isohub.com)</SelectItem>
                          <SelectItem value="custom" className="text-white hover:bg-zinc-700">Custom Domain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {domainForm.watch('domainType') === 'subdomain' && (
                      <div className="space-y-2">
                        <Label htmlFor="subdomainPrefix" className="text-gray-300">Subdomain Prefix</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="subdomainPrefix"
                            placeholder="yourcompany"
                            {...domainForm.register('subdomainPrefix')}
                            className="bg-zinc-800 border-yellow-400/30 text-white"
                            data-testid="input-subdomain"
                          />
                          <span className="text-gray-400">.isohub.com</span>
                        </div>
                      </div>
                    )}
                    
                    {domainForm.watch('domainType') === 'custom' && (
                      <div className="space-y-2">
                        <Label htmlFor="customDomain" className="text-gray-300">Custom Domain</Label>
                        <Input
                          id="customDomain"
                          placeholder="app.yourdomain.com"
                          {...domainForm.register('customDomain')}
                          className="bg-zinc-800 border-yellow-400/30 text-white"
                          data-testid="input-custom-domain"
                        />
                        <Alert className="bg-blue-500/10 border-blue-500/30">
                          <AlertCircle className="h-4 w-4 text-blue-400" />
                          <AlertDescription className="text-gray-300">
                            Please add a CNAME record pointing to <code className="text-yellow-400">custom.isohub.com</code> in your DNS settings.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                      <Save className="h-4 w-4 mr-2" />
                      Save Domain Settings
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API & Webhooks */}
          <TabsContent value="api" className="space-y-4">
            <Card className="bg-zinc-900/80 border-yellow-400/20">
              <CardHeader>
                <CardTitle className="text-white">API Configuration</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage API keys and webhook endpoints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">API Key</Label>
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={organizationData.apiKey}
                        readOnly
                        className="pr-10 bg-zinc-800 border-yellow-400/30 text-white"
                        data-testid="input-api-key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-yellow-400"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={regenerateApiKey}
                      className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                      data-testid="button-regenerate-api"
                    >
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400">
                    Use this key to authenticate API requests
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl" className="text-gray-300">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    defaultValue={organizationData.webhookUrl}
                    placeholder="https://your-domain.com/webhooks"
                    className="bg-zinc-800 border-yellow-400/30 text-white"
                    data-testid="input-webhook-url"
                  />
                  <p className="text-sm text-gray-400">
                    We'll send event notifications to this URL
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">Webhook Events</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="webhook-payment" defaultChecked className="data-[state=checked]:bg-yellow-400" />
                      <Label htmlFor="webhook-payment" className="font-normal text-gray-300">
                        Payment events
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="webhook-merchant" defaultChecked className="data-[state=checked]:bg-yellow-400" />
                      <Label htmlFor="webhook-merchant" className="font-normal text-gray-300">
                        Merchant events
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="webhook-user" className="data-[state=checked]:bg-yellow-400" />
                      <Label htmlFor="webhook-user" className="font-normal text-gray-300">
                        User events
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                    <Save className="h-4 w-4 mr-2" />
                    Save API Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing" className="space-y-4">
            <Card className="bg-zinc-900/80 border-yellow-400/20">
              <CardHeader>
                <CardTitle className="text-white">Billing Information</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your subscription and billing details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg border border-yellow-400/20 bg-zinc-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Current Plan</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Professional</Badge>
                    </div>
                    <div className="text-2xl font-bold text-white">$299/month</div>
                    <p className="text-sm text-gray-400 mt-1">Billed monthly</p>
                  </div>
                  
                  <div className="p-4 rounded-lg border border-yellow-400/20 bg-zinc-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Next Billing Date</span>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Upcoming</Badge>
                    </div>
                    <div className="text-2xl font-bold text-white">March 15, 2024</div>
                    <p className="text-sm text-gray-400 mt-1">Auto-renewal enabled</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Payment Method</Label>
                  <div className="flex items-center space-x-4 p-4 rounded-lg border border-yellow-400/20 bg-zinc-800/50">
                    <CreditCard className="h-8 w-8 text-yellow-400" />
                    <div>
                      <p className="font-medium text-white">Visa ending in 4242</p>
                      <p className="text-sm text-gray-400">Expires 12/2026</p>
                    </div>
                    <Button variant="outline" className="ml-auto border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10">
                      Update
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-yellow-400/20">
                  <div>
                    <p className="font-medium text-white">Need to change plans?</p>
                    <p className="text-sm text-gray-400">Contact our sales team for custom pricing</p>
                  </div>
                  <Button variant="outline" className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10">
                    Contact Sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
