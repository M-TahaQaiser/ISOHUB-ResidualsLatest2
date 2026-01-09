import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { CheckCircle, Clock, ArrowRight, Building2, Users, Settings, Database, FileText, DollarSign, TrendingUp, Upload, Palette, Save, User, FolderOpen, Sparkles, LayoutDashboard, Shield, BookOpen, Image } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface OnboardingStep {
  id: number;
  stepName: string;
  stepOrder: number;
  isCompleted: boolean;
  completedAt: string | null;
  stepData: any;
}

interface AgencyData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  isWhitelabel: boolean;
  domainType: 'standard' | 'custom_domain' | 'subdomain';
  customDomain: string;
  subdomainPrefix: string;
  dnsProvider: string;
  emailProvider: 'isohub_smtp' | 'agency_smtp' | 'sendgrid' | 'mailgun';
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmailAddress: string;
  fromDisplayName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoFile: File | null;
  description: string;
}

interface OnboardingStatus {
  steps: OnboardingStep[];
  progress: number;
  nextStep: OnboardingStep | null;
  isCompleted: boolean;
}

const stepIcons = {
  'Company Information': Building2,
  'Domain & Email Setup': Settings,
  'Business Profile': TrendingUp,
  'User Setup': Users,
  'Vendor Selection': Database,
  'Processor Setup': Upload,
  'Document Center': FolderOpen,
  'ISO-AI Preferences': Sparkles,
  'Upload lead sheet and Mapping': Upload,
  'Dashboard Tour': LayoutDashboard,
};

const stepDescriptions = {
  'Company Information': 'Complete your company profile and contact details',
  'Domain & Email Setup': 'Configure whitelabel domain and email settings',
  'Business Profile': 'AI-powered business understanding and analysis',
  'User Setup': 'Add team members and configure user roles',
  'Vendor Selection': 'Select processors, gateways, and hardware/POS vendors',
  'Processor Setup': 'Upload processor data files with automatic column detection and mapping',
  'Document Center': 'Upload essential documents and resources',
  'ISO-AI Preferences': 'Configure your AI assistant settings',
  'Upload lead sheet and Mapping': 'Upload lead sheet with automatic column detection and mapping',
  'Dashboard Tour': 'Quick tour of your new dashboard',
};

function CompanyInfoStep({ onComplete, isCompleted, initialData }: any) {
  const { toast } = useToast();
  
  // Fetch prospect data to pre-fill form
  const { data: prospectData } = useQuery({
    queryKey: ['/api/preapplications'],
    queryFn: async () => {
      const response = await fetch('/api/preapplications', { credentials: 'include' });
      if (!response.ok) return [];
      const data = await response.json();
      return data.length > 0 ? data[0] : null; // Get first prospect
    }
  });
  
  const [formData, setFormData] = useState<AgencyData>({
    companyName: initialData?.companyName || prospectData?.dba || prospectData?.businessName || '',
    contactName: initialData?.contactName || prospectData?.businessContactName || '',
    email: initialData?.email || prospectData?.email || '',
    phone: initialData?.phone || prospectData?.phone || '',
    website: initialData?.website || prospectData?.website || '',
    industry: initialData?.industry || '',
    isWhitelabel: initialData?.isWhitelabel || false,
    domainType: initialData?.domainType || 'standard',
    customDomain: initialData?.customDomain || '',
    subdomainPrefix: initialData?.subdomainPrefix || '',
    dnsProvider: initialData?.dnsProvider || '',
    emailProvider: initialData?.emailProvider || 'isohub_smtp',
    smtpHost: initialData?.smtpHost || '',
    smtpPort: initialData?.smtpPort || 587,
    smtpUsername: initialData?.smtpUsername || '',
    smtpPassword: initialData?.smtpPassword || '',
    fromEmailAddress: initialData?.fromEmailAddress || '',
    fromDisplayName: initialData?.fromDisplayName || '',
    primaryColor: initialData?.primaryColor || '#FFD700',
    secondaryColor: initialData?.secondaryColor || '#000000',
    accentColor: initialData?.accentColor || '#FFFFFF',
    logoFile: null,
    description: initialData?.description || ''
  });
  
  const [agencyCode, setAgencyCode] = useState(initialData?.agencyCode || '');
  
  const generateCodeMutation = useMutation({
    mutationFn: async (agencyName: string) => {
      const response = await fetch('/api/agencies/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyName })
      });
      if (!response.ok) throw new Error('Failed to generate code');
      return response.json();
    },
    onSuccess: (data) => {
      setAgencyCode(data.agencyCode);
    }
  });
  
  const handleGenerateAgencyCode = (agencyName: string) => {
    if (agencyName.length >= 3) {
      generateCodeMutation.mutate(agencyName);
    }
  };

  const createAgencyMutation = useMutation({
    mutationFn: async (agencyData: any) => {
      const response = await fetch('/api/agencies/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agencyData)
      });
      if (!response.ok) throw new Error('Failed to create agency');
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Agency created successfully:', data);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.companyName || !formData.contactName || !formData.email) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in Company Name, Contact Name, and Email Address",
        variant: "destructive"
      });
      return;
    }
    
    const agencyData = {
      ...formData,
      agencyCode,
      location: `${formData.companyName} Location`
    };
    
    // Call onComplete to move to next step
    onComplete(agencyData);
  };

  const handleColorChange = (colorType: 'primaryColor' | 'secondaryColor' | 'accentColor', value: string) => {
    setFormData(prev => ({ ...prev, [colorType]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, logoFile: file }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Information Section */}
      <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-yellow-400" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyName" className="text-gray-300">Company Name *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, companyName: e.target.value }));
                handleGenerateAgencyCode(e.target.value);
              }}
              placeholder="Enter company name"
              className="bg-zinc-800 border-yellow-400/30 text-white"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="contactName" className="text-gray-300">Contact Name *</Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
              placeholder="Primary contact person"
              className="bg-zinc-800 border-yellow-400/30 text-white"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email" className="text-gray-300">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="contact@company.com"
              className="bg-zinc-800 border-yellow-400/30 text-white"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
              className="bg-zinc-800 border-yellow-400/30 text-white"
            />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="website" className="text-gray-300">Company Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://www.company.com"
              className="bg-zinc-800 border-yellow-400/30 text-white"
            />
          </div>
        </div>
      </div>

      {/* Branding Section */}
      <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-yellow-400" />
          Company Branding
        </h3>
        <div>
          <Label htmlFor="logo" className="text-gray-300">Upload Company Logo</Label>
          <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-yellow-400/30 border-dashed rounded-md hover:border-yellow-400/50 transition-colors bg-zinc-900/50">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-yellow-400" />
              <div className="flex text-sm text-gray-400">
                <label
                  htmlFor="logo-upload"
                  className="relative cursor-pointer rounded-md font-medium text-yellow-400 hover:text-yellow-300 focus-within:outline-none"
                >
                  <span>Upload a file</span>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, SVG up to 2MB</p>
              {formData.logoFile && (
                <p className="text-sm text-green-400 mt-2">✓ Selected: {formData.logoFile.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
          disabled={!formData.companyName || !formData.contactName || !formData.email}
        >
          {isCompleted ? 'Update & Continue' : 'Continue to Next Step'}
        </Button>
      </div>
    </form>
  );
}

function DomainEmailStep({ onComplete, isCompleted, initialData }: any) {
  const [setupData, setSetupData] = useState({
    domainType: initialData?.domainType || 'standard',
    customDomain: initialData?.customDomain || '',
    subdomainPrefix: initialData?.subdomainPrefix || '',
    dnsProvider: initialData?.dnsProvider || '',
    emailProvider: initialData?.emailProvider || 'isohub_smtp',
    smtpHost: initialData?.smtpHost || '',
    smtpPort: initialData?.smtpPort || 587,
    smtpUsername: initialData?.smtpUsername || '',
    smtpPassword: initialData?.smtpPassword || '',
    fromEmailAddress: initialData?.fromEmailAddress || '',
    fromDisplayName: initialData?.fromDisplayName || '',
  });

  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-white">Domain & Email Setup Complete</p>
        <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <p className="text-sm text-gray-300"><strong className="text-white">Domain:</strong> {setupData.domainType === 'standard' ? 'Using ISOHub Standard' : setupData.customDomain || setupData.subdomainPrefix}</p>
          <p className="text-sm text-gray-300"><strong className="text-white">Email:</strong> {setupData.emailProvider === 'isohub_smtp' ? 'ISOHub SMTP' : 'Custom SMTP'}</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(setupData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-zinc-900/80 p-6 rounded-lg border border-yellow-400/20">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
          <Settings className="h-5 w-5 text-yellow-400" />
          Domain Configuration
        </h3>
        
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium text-gray-300">Choose Your Domain Setup</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <Card className={`cursor-pointer border-2 ${setupData.domainType === 'standard' ? 'border-yellow-400 bg-yellow-400/10' : 'border-yellow-400/20 bg-zinc-800'}`} 
                    onClick={() => setSetupData(prev => ({ ...prev, domainType: 'standard' }))}>
                <CardContent className="p-4 text-center">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                  <h4 className="font-medium text-white">Standard</h4>
                  <p className="text-sm text-gray-400">Use ISOHub.io subdomain</p>
                  <Badge variant="secondary" className="mt-2 bg-zinc-700 text-gray-300">Free</Badge>
                </CardContent>
              </Card>
              
              <Card className={`cursor-pointer border-2 ${setupData.domainType === 'custom_domain' ? 'border-yellow-400 bg-yellow-400/10' : 'border-yellow-400/20 bg-zinc-800'}`} 
                    onClick={() => setSetupData(prev => ({ ...prev, domainType: 'custom_domain' }))}>
                <CardContent className="p-4 text-center">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                  <h4 className="font-medium text-white">Custom Domain</h4>
                  <p className="text-sm text-gray-400">yourcompany.com</p>
                  <Badge variant="outline" className="mt-2 border-yellow-400/30 text-yellow-400">Premium</Badge>
                </CardContent>
              </Card>
              
              <Card className={`cursor-pointer border-2 ${setupData.domainType === 'subdomain' ? 'border-yellow-400 bg-yellow-400/10' : 'border-yellow-400/20 bg-zinc-800'}`} 
                    onClick={() => setSetupData(prev => ({ ...prev, domainType: 'subdomain' }))}>
                <CardContent className="p-4 text-center">
                  <Database className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                  <h4 className="font-medium text-white">Subdomain</h4>
                  <p className="text-sm text-gray-400">company.isohub.io</p>
                  <Badge variant="secondary" className="mt-2 bg-zinc-700 text-gray-300">Standard</Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          {setupData.domainType === 'custom_domain' && (
            <div className="bg-blue-500/10 p-6 rounded-lg space-y-4 border border-blue-500/20">
              <h4 className="font-medium text-blue-400">Custom Domain Setup</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customDomain" className="text-gray-300">Your Domain *</Label>
                  <Input
                    id="customDomain"
                    value={setupData.customDomain}
                    onChange={(e) => setSetupData(prev => ({ ...prev, customDomain: e.target.value }))}
                    placeholder="yourcompany.com"
                    className="bg-zinc-800 border-yellow-400/30 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dnsProvider" className="text-gray-300">DNS Provider</Label>
                  <Select value={setupData.dnsProvider} onValueChange={(value) => setSetupData(prev => ({ ...prev, dnsProvider: value }))}>
                    <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                      <SelectValue placeholder="Select DNS provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-yellow-400/30">
                      <SelectItem value="cloudflare">Cloudflare</SelectItem>
                      <SelectItem value="godaddy">GoDaddy</SelectItem>
                      <SelectItem value="namecheap">Namecheap</SelectItem>
                      <SelectItem value="route53">AWS Route 53</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-3 bg-blue-500/20 rounded text-sm text-blue-300 border border-blue-500/30">
                <strong className="text-blue-200">Setup Requirements:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Domain ownership verification</li>
                  <li>DNS record configuration (A records, CNAME)</li>
                  <li>SSL certificate installation</li>
                  <li>Email routing setup</li>
                </ul>
              </div>
            </div>
          )}

          {setupData.domainType === 'subdomain' && (
            <div className="bg-green-500/10 p-6 rounded-lg space-y-4 border border-green-500/20">
              <h4 className="font-medium text-green-400">Subdomain Setup</h4>
              <div>
                <Label htmlFor="subdomainPrefix" className="text-gray-300">Subdomain Prefix *</Label>
                <div className="flex items-center mt-1">
                  <Input
                    id="subdomainPrefix"
                    value={setupData.subdomainPrefix}
                    onChange={(e) => setSetupData(prev => ({ ...prev, subdomainPrefix: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="yourcompany"
                    className="rounded-r-none bg-zinc-800 border-yellow-400/30 text-white"
                    required
                  />
                  <span className="bg-zinc-700 border border-l-0 border-yellow-400/30 px-3 py-2 rounded-r text-sm text-gray-400">.isohub.io</span>
                </div>
                <p className="text-sm text-green-400 mt-1">Your site will be: {setupData.subdomainPrefix || 'yourcompany'}.isohub.io</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900/80 p-6 rounded-lg border border-yellow-400/20">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
          📧 Email Service Configuration
        </h3>
        
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium text-gray-300">Email Service Provider</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <Card className={`cursor-pointer border-2 ${setupData.emailProvider === 'isohub_smtp' ? 'border-yellow-400 bg-yellow-400/10' : 'border-yellow-400/20 bg-zinc-800'}`} 
                    onClick={() => setSetupData(prev => ({ ...prev, emailProvider: 'isohub_smtp' }))}>
                <CardContent className="p-4">
                  <h4 className="font-medium text-white">ISOHub SMTP</h4>
                  <p className="text-sm text-gray-400">Use our reliable email service</p>
                  <Badge variant="secondary" className="mt-2 bg-zinc-700 text-gray-300">Recommended</Badge>
                </CardContent>
              </Card>
              
              <Card className={`cursor-pointer border-2 ${setupData.emailProvider === 'agency_smtp' ? 'border-yellow-400 bg-yellow-400/10' : 'border-yellow-400/20 bg-zinc-800'}`} 
                    onClick={() => setSetupData(prev => ({ ...prev, emailProvider: 'agency_smtp' }))}>
                <CardContent className="p-4">
                  <h4 className="font-medium text-white">Your SMTP</h4>
                  <p className="text-sm text-gray-400">Use your own email server</p>
                  <Badge variant="outline" className="mt-2 border-yellow-400/30 text-yellow-400">Advanced</Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          {setupData.emailProvider === 'agency_smtp' && (
            <div className="bg-orange-500/10 p-6 rounded-lg space-y-4 border border-orange-500/20">
              <h4 className="font-medium text-orange-400">Custom SMTP Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost" className="text-gray-300">SMTP Host *</Label>
                  <Input
                    id="smtpHost"
                    value={setupData.smtpHost}
                    onChange={(e) => setSetupData(prev => ({ ...prev, smtpHost: e.target.value }))}
                    placeholder="smtp.gmail.com"
                    className="bg-zinc-800 border-yellow-400/30 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort" className="text-gray-300">SMTP Port *</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={setupData.smtpPort}
                    onChange={(e) => setSetupData(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                    placeholder="587"
                    className="bg-zinc-800 border-yellow-400/30 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="smtpUsername" className="text-gray-300">Username *</Label>
                  <Input
                    id="smtpUsername"
                    value={setupData.smtpUsername}
                    onChange={(e) => setSetupData(prev => ({ ...prev, smtpUsername: e.target.value }))}
                    placeholder="your-email@company.com"
                    className="bg-zinc-800 border-yellow-400/30 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPassword" className="text-gray-300">Password/App Password *</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={setupData.smtpPassword}
                    onChange={(e) => setSetupData(prev => ({ ...prev, smtpPassword: e.target.value }))}
                    placeholder="••••••••••••"
                    className="bg-zinc-800 border-yellow-400/30 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fromEmail" className="text-gray-300">From Email Address *</Label>
                  <Input
                    id="fromEmail"
                    value={setupData.fromEmailAddress}
                    onChange={(e) => setSetupData(prev => ({ ...prev, fromEmailAddress: e.target.value }))}
                    placeholder="noreply@yourcompany.com"
                    className="bg-zinc-800 border-yellow-400/30 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fromName" className="text-gray-300">From Display Name</Label>
                  <Input
                    id="fromName"
                    value={setupData.fromDisplayName}
                    onChange={(e) => setSetupData(prev => ({ ...prev, fromDisplayName: e.target.value }))}
                    placeholder="Your Company Name"
                    className="bg-zinc-800 border-yellow-400/30 text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
          {isCompleted ? 'Update & Continue' : 'Continue to Next Step'}
        </Button>
      </div>
    </form>
  );
}

function BusinessProfileStep({ onComplete, isCompleted, initialData }: any) {
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    businessDescription: initialData?.businessDescription || '',
    targetMarket: initialData?.targetMarket || '',
    averageTicket: initialData?.averageTicket || '',
    monthlyVolume: initialData?.monthlyVolume || '',
    businessModel: initialData?.businessModel || '',
    painPoints: initialData?.painPoints || ''
  });
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      const analysis = `Based on your business profile:\n\n✓ Industry Focus: Payment processing with ${profileData.targetMarket || 'various'} target market\n✓ Volume Analysis: Estimated ${profileData.monthlyVolume || 'N/A'} monthly transactions\n✓ Business Model: ${profileData.businessModel || 'Standard ISO model'}\n\nRecommendations:\n• Optimize for high-volume merchant acquisition\n• Focus on ${profileData.targetMarket || 'target'} vertical\n• Implement automated onboarding workflows`;
      setAiAnalysis(analysis);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.businessDescription) {
      toast({
        title: "Required Field Missing",
        description: "Please provide a business description",
        variant: "destructive"
      });
      return;
    }
    onComplete(profileData);
  };

  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-white">Business profile analyzed</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-yellow-400" />
          Business Understanding
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="businessDescription" className="text-gray-300">Business Description *</Label>
            <Textarea
              id="businessDescription"
              value={profileData.businessDescription}
              onChange={(e) => setProfileData(prev => ({ ...prev, businessDescription: e.target.value }))}
              placeholder="Describe your business, what you do, and who you serve..."
              rows={4}
              className="bg-zinc-800 border-yellow-400/30 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetMarket" className="text-gray-300">Target Market</Label>
              <Input
                id="targetMarket"
                value={profileData.targetMarket}
                onChange={(e) => setProfileData(prev => ({ ...prev, targetMarket: e.target.value }))}
                placeholder="e.g., Restaurants, Retail, E-commerce"
                className="bg-zinc-800 border-yellow-400/30 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="businessModel" className="text-gray-300">Business Model</Label>
              <Select value={profileData.businessModel} onValueChange={(value) => setProfileData(prev => ({ ...prev, businessModel: value }))}>
                <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-yellow-400/30">
                  <SelectItem value="iso">ISO/Agent</SelectItem>
                  <SelectItem value="direct">Direct Sales</SelectItem>
                  <SelectItem value="referral">Referral Partner</SelectItem>
                  <SelectItem value="hybrid">Hybrid Model</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="averageTicket" className="text-gray-300">Average Ticket Size</Label>
              <Input
                id="averageTicket"
                value={profileData.averageTicket}
                onChange={(e) => setProfileData(prev => ({ ...prev, averageTicket: e.target.value }))}
                placeholder="$50 - $500"
                className="bg-zinc-800 border-yellow-400/30 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="monthlyVolume" className="text-gray-300">Est. Monthly Volume</Label>
              <Input
                id="monthlyVolume"
                value={profileData.monthlyVolume}
                onChange={(e) => setProfileData(prev => ({ ...prev, monthlyVolume: e.target.value }))}
                placeholder="$100K - $1M"
                className="bg-zinc-800 border-yellow-400/30 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="painPoints" className="text-gray-300">Current Pain Points</Label>
            <Textarea
              id="painPoints"
              value={profileData.painPoints}
              onChange={(e) => setProfileData(prev => ({ ...prev, painPoints: e.target.value }))}
              placeholder="What challenges are you facing? What are you looking to improve?"
              rows={3}
              className="bg-zinc-800 border-yellow-400/30 text-white"
            />
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 p-6 rounded-lg border border-yellow-400/30">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-yellow-400" />
          AI-Powered Business Analysis
        </h3>
        
        {!aiAnalysis ? (
          <div className="text-center py-4">
            <p className="text-gray-400 mb-4">Get instant AI insights about your business profile</p>
            <Button
              type="button"
              onClick={handleAIAnalysis}
              disabled={!profileData.businessDescription || isAnalyzing}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            >
              {isAnalyzing ? (
                <><Clock className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
              ) : (
                <>Analyze My Business</>
              )}
            </Button>
          </div>
        ) : (
          <div className="bg-zinc-900/50 p-4 rounded-lg">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">{aiAnalysis}</pre>
            <Button
              type="button"
              onClick={handleAIAnalysis}
              variant="outline"
              className="mt-4 border-yellow-400/30 text-yellow-400"
            >
              Re-analyze
            </Button>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
          disabled={!profileData.businessDescription}
        >
          {isCompleted ? 'Update & Continue' : 'Continue to Next Step'}
        </Button>
      </div>
    </form>
  );
}

function UserSetupStep({ onComplete, isCompleted, initialData }: any) {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>(initialData?.users || []);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    department: ''
  });

  const roles = [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'manager', label: 'Manager', description: 'Team management and reporting' },
    { value: 'agent', label: 'Sales Agent', description: 'Merchant management and sales' },
    { value: 'support', label: 'Support Staff', description: 'Customer support access' },
    { value: 'analyst', label: 'Data Analyst', description: 'Reporting and analytics' }
  ];

  const departments = ['Sales', 'Operations', 'Support', 'Finance', 'Management'];

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in Name, Email, and Role",
        variant: "destructive"
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setUsers([...users, { ...newUser, id: Date.now() }]);
    setNewUser({ name: '', email: '', role: '', department: '' });
    toast({
      title: "User Added",
      description: `${newUser.name} has been added to the team`,
    });
  };

  const handleRemoveUser = (userId: number) => {
    setUsers(users.filter(u => u.id !== userId));
    toast({
      title: "User Removed",
      description: "User has been removed from the list",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.length === 0) {
      toast({
        title: "No Users Added",
        description: "Please add at least one user to continue",
        variant: "destructive"
      });
      return;
    }
    onComplete({ users });
  };

  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-white">User setup complete</p>
        <p className="text-gray-400 text-sm mt-2">{users.length} user(s) configured</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Add New User Section */}
      <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-yellow-400" />
          Add Team Members
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="userName" className="text-gray-300">Full Name *</Label>
            <Input
              id="userName"
              value={newUser.name}
              onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              placeholder="John Doe"
              className="bg-zinc-800 border-yellow-400/30 text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="userEmail" className="text-gray-300">Email Address *</Label>
            <Input
              id="userEmail"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              placeholder="john@company.com"
              className="bg-zinc-800 border-yellow-400/30 text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="userRole" className="text-gray-300">Role *</Label>
            <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
              <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-yellow-400/30">
                {roles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{role.label}</span>
                      <span className="text-xs text-gray-400">{role.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="userDepartment" className="text-gray-300">Department</Label>
            <Select value={newUser.department} onValueChange={(value) => setNewUser(prev => ({ ...prev, department: value }))}>
              <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-yellow-400/30">
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button
          type="button"
          onClick={handleAddUser}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
        >
          <Users className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Users List */}
      {users.length > 0 && (
        <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
          <h3 className="text-lg font-semibold text-white mb-4">Team Members ({users.length})</h3>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700 hover:border-yellow-400/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30">
                      {roles.find(r => r.value === user.role)?.label || user.role}
                    </Badge>
                    {user.department && (
                      <p className="text-xs text-gray-400 mt-1">{user.department}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveUser(user.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button 
          type="submit" 
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
          disabled={users.length === 0}
        >
          Continue to Next Step
        </Button>
      </div>
    </form>
  );
}

function VendorSelectionStep({ onComplete, isCompleted, initialData }: any) {
  const { toast } = useToast();
  const [currentMicroStep, setCurrentMicroStep] = useState(0);
  const [selectedProcessors, setSelectedProcessors] = useState<number[]>(initialData?.processors || []);
  const [selectedGateways, setSelectedGateways] = useState<number[]>(initialData?.gateways || []);
  const [selectedHardware, setSelectedHardware] = useState<number[]>(initialData?.hardware || []);

  // Fetch vendors from API
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['/api/vendors'],
    queryFn: async () => {
      const response = await fetch('/api/vendors', { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    }
  });

  const processors = vendors?.filter((v: any) => v.category === 'Processors') || [];
  const gateways = vendors?.filter((v: any) => v.category === 'Gateways') || [];
  const hardware = vendors?.filter((v: any) => v.category === 'Hardware/Equipment') || [];

  const microSteps = [
    { title: 'Processors', data: processors, selected: selectedProcessors, setSelected: setSelectedProcessors },
    { title: 'Gateways', data: gateways, selected: selectedGateways, setSelected: setSelectedGateways },
    { title: 'Hardware/POS', data: hardware, selected: selectedHardware, setSelected: setSelectedHardware }
  ];

  const currentStep = microSteps[currentMicroStep];

  const toggleVendor = (vendorId: number) => {
    const isSelected = currentStep.selected.includes(vendorId);
    if (isSelected) {
      currentStep.setSelected(currentStep.selected.filter((id: number) => id !== vendorId));
    } else {
      currentStep.setSelected([...currentStep.selected, vendorId]);
    }
  };

  const handleNext = () => {
    if (currentStep.selected.length === 0) {
      toast({
        title: "No Selection",
        description: `Please select at least one ${currentStep.title.toLowerCase()} option`,
        variant: "destructive"
      });
      return;
    }

    if (currentMicroStep < microSteps.length - 1) {
      setCurrentMicroStep(currentMicroStep + 1);
      toast({
        title: "Selection Saved",
        description: `${currentStep.selected.length} ${currentStep.title.toLowerCase()} selected`,
      });
    } else {
      // Final step - complete
      onComplete({
        selectedProcessors: selectedProcessors,
        selectedGateways: selectedGateways,
        selectedHardware: selectedHardware
      });
    }
  };

  const handleBack = () => {
    if (currentMicroStep > 0) {
      setCurrentMicroStep(currentMicroStep - 1);
    }
  };

  if (isCompleted) {
    const totalSelected = selectedProcessors.length + selectedGateways.length + selectedHardware.length;
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-white">Vendor selection complete</p>
        <p className="text-gray-400 text-sm mt-2">{totalSelected} vendor(s) selected</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading vendors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Micro-step Progress */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {microSteps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              index === currentMicroStep
                ? 'bg-yellow-400/20 border-2 border-yellow-400'
                : index < currentMicroStep
                ? 'bg-green-500/20 border-2 border-green-500'
                : 'bg-zinc-800 border-2 border-zinc-600'
            }`}>
              {index < currentMicroStep ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === currentMicroStep ? 'bg-yellow-400 text-black' : 'bg-zinc-700 text-gray-400'
                }`}>
                  {index + 1}
                </div>
              )}
              <span className={`text-sm font-medium ${
                index === currentMicroStep ? 'text-yellow-400' : index < currentMicroStep ? 'text-green-400' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
            </div>
            {index < microSteps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-gray-600 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">
            Select {currentStep.title}
          </h3>
          <p className="text-gray-400 text-sm">
            Choose all {currentStep.title.toLowerCase()} you work with (multi-select)
          </p>
          <p className="text-yellow-400 text-sm mt-1">
            {currentStep.selected.length} selected
          </p>
        </div>

        {/* Vendor Grid - Circular Logos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {currentStep.data.map((vendor: any) => {
            const isSelected = currentStep.selected.includes(vendor.id);
            return (
              <button
                key={vendor.id}
                type="button"
                onClick={() => toggleVendor(vendor.id)}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                  isSelected
                    ? 'bg-yellow-400/20 border-yellow-400 shadow-lg shadow-yellow-400/20'
                    : 'bg-zinc-900/50 border-zinc-700 hover:border-yellow-400/50'
                }`}
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 transition-all ${
                  isSelected
                    ? 'bg-yellow-400/30 ring-4 ring-yellow-400/50'
                    : 'bg-zinc-800'
                }`}>
                  {/* Placeholder for logo - using first letter */}
                  <span className={`text-2xl font-bold ${
                    isSelected ? 'text-yellow-400' : 'text-gray-500'
                  }`}>
                    {vendor.name.charAt(0)}
                  </span>
                </div>
                <span className={`text-sm font-medium text-center line-clamp-2 ${
                  isSelected ? 'text-white' : 'text-gray-400'
                }`}>
                  {vendor.name}
                </span>
                {isSelected && (
                  <CheckCircle className="h-5 w-5 text-yellow-400 mt-2" />
                )}
              </button>
            );
          })}
        </div>

        {currentStep.data.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No {currentStep.title.toLowerCase()} available
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          onClick={handleBack}
          disabled={currentMicroStep === 0}
          variant="outline"
          className="border-yellow-400/30 text-yellow-400"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
          disabled={currentStep.selected.length === 0}
        >
          {currentMicroStep === microSteps.length - 1 ? 'Complete Selection' : 'Next'}
        </Button>
      </div>
    </div>
  );
}

function ProcessorDataSetupStep({ onComplete, isCompleted, initialData }: any) {
  const { toast } = useToast();
  const [vendorUploads, setVendorUploads] = useState<any[]>(initialData?.vendorUploads || []);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedColumns, setParsedColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<any>({});
  const [showMapping, setShowMapping] = useState(false);

  // Get ALL selected vendors from previous step (Processors, Gateways, Hardware)
  const selectedProcessorIds = initialData?.selectedProcessors || [];
  const selectedGatewayIds = initialData?.selectedGateways || [];
  const selectedHardwareIds = initialData?.selectedHardware || [];
  const allSelectedIds = [...selectedProcessorIds, ...selectedGatewayIds, ...selectedHardwareIds];
  
  const { data: vendors } = useQuery({
    queryKey: ['/api/vendors'],
    queryFn: async () => {
      const response = await fetch('/api/vendors', { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Filter to get all selected vendors across all categories
  const selectedVendors = vendors?.filter((v: any) => 
    allSelectedIds.includes(v.id) && ['Processors', 'Gateways', 'Hardware/Equipment'].includes(v.category)
  ) || [];

  // Parse CSV/Excel columns from uploaded file
  const parseFileColumns = async (file: File) => {
    return new Promise<string[]>((resolve) => {
      const reader = new FileReader();
      
      if (file.name.endsWith('.csv')) {
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const firstLine = text.split('\n')[0];
          const columns = firstLine.split(',').map(col => col.trim().replace(/"/g, ''));
          resolve(columns.filter(col => col.length > 0));
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Parse Excel file using xlsx library
        reader.onload = async (e) => {
          try {
            const data = e.target?.result;
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            if (jsonData.length > 0) {
              const headers = jsonData[0].map((h: any) => String(h || '').trim()).filter(h => h.length > 0);
              resolve(headers);
            } else {
              resolve([]);
            }
          } catch (error) {
            console.error('Error parsing Excel file:', error);
            resolve([]);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        resolve([]);
      }
    });
  };

  const handleFileUpload = async (vendor: any, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedVendor(vendor);
      setUploadedFile(file);
      
      toast({
        title: "Processing File",
        description: "Parsing columns from uploaded file...",
      });

      // Parse columns from file
      const columns = await parseFileColumns(file);
      setParsedColumns(columns);
      // Initialize all columns as 'ignore' by default
      const initialMappings: any = {};
      columns.forEach(col => {
        initialMappings[col] = { action: 'ignore', targetField: '' };
      });
      setColumnMappings(initialMappings);
      setShowMapping(true);

      toast({
        title: "File Uploaded",
        description: `${columns.length} columns detected. Ready for mapping.`,
      });
    }
  };

  const targetFields = ['merchant_id', 'business_name', 'legal_name', 'volume', 'transactions', 'fees', 'statement_date', 'status', 'processor_name', 'gateway_name', 'hardware_name', 'branch_id', 'account_number', 'routing_number', 'terminal_id', 'batch_number'];

  const handleSaveMapping = async () => {
    if (!selectedVendor || !uploadedFile || parsedColumns.length === 0) {
      toast({
        title: "Incomplete Mapping",
        description: "Please upload a file and map columns",
        variant: "destructive"
      });
      return;
    }

    // Save mapping to database
    try {
      const response = await fetch('/api/vendor-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          vendorId: selectedVendor.id,
          vendorName: selectedVendor.name,
          vendorCategory: selectedVendor.category,
          fileName: uploadedFile.name,
          columnMappings: columnMappings,
          agencyId: parseInt(localStorage.getItem('onboarding_agency_id') || '1')
        })
      });

      if (!response.ok) throw new Error('Failed to save mapping');

      const newUpload = {
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.name,
        vendorCategory: selectedVendor.category,
        file: uploadedFile,
        columns: parsedColumns,
        mappings: columnMappings,
        completed: true
      };

      setVendorUploads([...vendorUploads, newUpload]);
      setSelectedVendor(null);
      setUploadedFile(null);
      setParsedColumns([]);
      setColumnMappings({});
      setShowMapping(false);
      
      toast({
        title: "Vendor Configured",
        description: `${selectedVendor.name} uploaded and mapped successfully`,
      });
    } catch (error) {
      toast({
        title: "Error Saving Mapping",
        description: "Failed to save vendor mapping to database",
        variant: "destructive"
      });
    }
  };

  const allVendorsConfigured = selectedVendors.length > 0 && 
    vendorUploads.length === selectedVendors.length;



  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-white">Vendor data setup complete</p>
        <p className="text-gray-400 text-sm mt-2">
          {vendorUploads.length} vendor(s) configured across all categories
        </p>
      </div>
    );
  }

  // Show message if no vendors selected in Step 4
  if (selectedVendors.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-yellow-400" />
            Vendor Data Upload & Mapping
          </h3>
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-yellow-400 font-medium mb-2">No Vendors Selected</p>
            <p className="text-gray-400 text-sm">
              Please complete Step 4 (Vendor Selection) first to select processors, gateways, and hardware/POS vendors.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-yellow-400" />
          Vendor Data Upload & Mapping
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Upload a data file for each selected vendor (Processors, Gateways, Hardware/POS). The system will automatically detect columns for mapping.
        </p>

        {/* Vendor List - Grouped by Category */}
        <div className="space-y-6">
          {['Processors', 'Gateways', 'Hardware/Equipment'].map(category => {
            const categoryVendors = selectedVendors.filter((v: any) => v.category === category);
            if (categoryVendors.length === 0) return null;

            return (
              <div key={category} className="space-y-3">
                <h4 className="text-md font-medium text-yellow-400 flex items-center gap-2">
                  {category === 'Processors' && <Database className="h-4 w-4" />}
                  {category === 'Gateways' && <Settings className="h-4 w-4" />}
                  {category === 'Hardware/Equipment' && <Upload className="h-4 w-4" />}
                  {category}
                </h4>
                <div className="space-y-3">
                  {categoryVendors.map((vendor: any) => {
                    const isConfigured = vendorUploads.some((u: any) => u.vendorId === vendor.id);
                    const isCurrentlySelected = selectedVendor?.id === vendor.id;
                    const upload = vendorUploads.find((u: any) => u.vendorId === vendor.id);
            
                    return (
                      <div
                        key={vendor.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isConfigured
                            ? 'bg-green-500/10 border-green-500'
                            : isCurrentlySelected
                            ? 'bg-yellow-400/20 border-yellow-400'
                            : 'bg-zinc-900/50 border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isConfigured ? 'bg-green-500/20' : 'bg-yellow-400/20'
                            }`}>
                              {isConfigured ? (
                                <CheckCircle className="h-5 w-5 text-green-400" />
                              ) : (
                                <Upload className="h-5 w-5 text-yellow-400" />
                              )}
                            </div>
                            <div>
                              <p className={`font-medium ${
                                isConfigured ? 'text-green-400' : 'text-white'
                              }`}>
                                {vendor.name}
                              </p>
                              <p className="text-xs text-gray-500">{vendor.category}</p>
                              {isConfigured && upload && (
                                <p className="text-xs text-green-400">
                                  {Object.values(upload.mappings).filter((m: any) => m.action === 'map').length} columns mapped
                                </p>
                              )}
                            </div>
                          </div>
                          {!isConfigured && !isCurrentlySelected && (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={(e) => handleFileUpload(vendor, e)}
                                className="sr-only"
                              />
                              <Button
                                type="button"
                                size="sm"
                                className="bg-yellow-400 hover:bg-yellow-500 text-black"
                                onClick={(e) => {
                                  e.preventDefault();
                                  (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                                }}
                              >
                                Upload File
                              </Button>
                            </label>
                          )}
                        </div>

                        {/* Column Mapping Interface */}
                        {isCurrentlySelected && showMapping && parsedColumns.length > 0 && (
                          <div className="mt-4 p-4 bg-zinc-800/50 rounded-lg border border-yellow-400/30">
                            <div className="mb-4">
                              <p className="text-sm text-green-400 mb-2">✓ File uploaded: {uploadedFile?.name}</p>
                              <p className="text-sm text-gray-400 mb-4">
                                {parsedColumns.length} columns detected. Choose to map or ignore each column:
                              </p>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {parsedColumns.map((col, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                  <div className="w-32 p-2 bg-zinc-900 rounded border border-zinc-700">
                                    <span className="text-sm text-gray-300 truncate block">{col}</span>
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                                  <div className="flex-1 flex gap-2">
                                    <Select
                                      value={columnMappings[col]?.action || 'ignore'}
                                      onValueChange={(value) => {
                                        setColumnMappings({
                                          ...columnMappings,
                                          [col]: {
                                            action: value,
                                            targetField: value === 'ignore' ? '' : columnMappings[col]?.targetField || ''
                                          }
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="w-28 bg-zinc-900 border-yellow-400/30 text-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-zinc-800 border-yellow-400/30">
                                        <SelectItem value="map">Map</SelectItem>
                                        <SelectItem value="ignore">Ignore</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {columnMappings[col]?.action === 'map' && (
                                      <Select
                                        value={columnMappings[col]?.targetField || ''}
                                        onValueChange={(value) => {
                                          setColumnMappings({
                                            ...columnMappings,
                                            [col]: { action: 'map', targetField: value }
                                          });
                                        }}
                                      >
                                        <SelectTrigger className="flex-1 bg-zinc-900 border-yellow-400/30 text-white">
                                          <SelectValue placeholder="Select field" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-yellow-400/30">
                                          {targetFields.map(field => (
                                            <SelectItem key={field} value={field}>{field}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                    {columnMappings[col]?.action === 'ignore' && (
                                      <div className="flex-1 p-2 bg-zinc-900/50 rounded border border-zinc-700 flex items-center">
                                        <span className="text-sm text-gray-500 italic">Column will be ignored</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-3 mt-4">
                              <Button
                                onClick={() => {
                                  setSelectedVendor(null);
                                  setUploadedFile(null);
                                  setParsedColumns([]);
                                  setColumnMappings({});
                                  setShowMapping(false);
                                }}
                                variant="outline"
                                className="flex-1 border-yellow-400/30 text-yellow-400"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleSaveMapping}
                                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                              >
                                Save Mapping
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (!allVendorsConfigured) {
              toast({
                title: "Incomplete Setup",
                description: "Please upload and map all selected vendors",
                variant: "destructive"
              });
              return;
            }
            onComplete({ vendorUploads });
          }}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
          disabled={!allVendorsConfigured}
        >
          Complete Vendor Setup
        </Button>
      </div>
    </div>
  );
}

// Task 3.6: FAQ Upload
function FAQUploadStep({ onComplete, isCompleted, initialData }: any) {
  const { toast } = useToast();
  const [faqFile, setFaqFile] = useState<File | null>(initialData?.faqFile || null);
  const [faqCount, setFaqCount] = useState(initialData?.faqCount || 0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaqFile(file);
      toast({
        title: "FAQ File Selected",
        description: `${file.name} ready for processing`,
      });
    }
  };

  const handleProcessFAQ = () => {
    if (!faqFile) return;

    setIsProcessing(true);
    toast({
      title: "Processing FAQ",
      description: "Parsing and indexing FAQ entries...",
    });

    setTimeout(() => {
      const count = Math.floor(Math.random() * 50) + 20;
      setFaqCount(count);
      setIsProcessing(false);
      toast({
        title: "FAQ Processed Successfully",
        description: `${count} FAQ entries indexed for ISO-AI`,
      });
    }, 2000);
  };

  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-white">FAQ uploaded and indexed</p>
        <p className="text-gray-400 text-sm mt-2">{faqCount} FAQ entries available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-yellow-400" />
          Upload FAQ Document
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Upload your company FAQ document. ISO-AI will index these entries to provide accurate answers to your team and clients.
        </p>

        <div className="mt-4 flex justify-center px-6 pt-5 pb-6 border-2 border-yellow-400/30 border-dashed rounded-md hover:border-yellow-400/50 transition-colors bg-zinc-900/50">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-yellow-400" />
            <div className="flex text-sm text-gray-400">
              <label
                htmlFor="faq-upload"
                className="relative cursor-pointer rounded-md font-medium text-yellow-400 hover:text-yellow-300"
              >
                <span>Upload FAQ file</span>
                <input
                  id="faq-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PDF, DOC, DOCX, or TXT</p>
            {faqFile && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400 flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {faqFile.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {faqFile && faqCount === 0 && (
          <Button
            onClick={handleProcessFAQ}
            className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Process & Index FAQ'}
          </Button>
        )}

        {faqCount > 0 && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400 font-medium text-center">
              ✓ {faqCount} FAQ entries indexed successfully
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => onComplete({ faqFile, faqCount })}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
          disabled={faqCount === 0}
        >
          Continue to Next Step
        </Button>
      </div>
    </div>
  );
}

// Task 3.7: Document Center Setup
function DocumentCenterStep({ onComplete, isCompleted, initialData }: any) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<any[]>(initialData?.documents || []);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);

  const categories = [
    { name: 'Contracts & Agreements', icon: FileText, description: 'Service agreements, merchant contracts' },
    { name: 'Compliance Documents', icon: Shield, description: 'PCI compliance, regulatory docs' },
    { name: 'Training Materials', icon: BookOpen, description: 'Onboarding guides, training videos' },
    { name: 'Marketing Assets', icon: Image, description: 'Brochures, presentations, logos' }
  ];

  const handleFileUpload = (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newDocs = files.map(file => ({
        id: Date.now() + Math.random(),
        category,
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        uploadedAt: new Date().toISOString()
      }));
      setDocuments([...documents, ...newDocs]);
      setUploadingCategory(null);
      toast({
        title: "Documents Uploaded",
        description: `${files.length} file(s) added to ${category}`,
      });
    }
  };

  const removeDocument = (docId: number) => {
    setDocuments(documents.filter(d => d.id !== docId));
    toast({
      title: "Document Removed",
      description: "Document deleted from center",
    });
  };

  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-white">Document center configured</p>
        <p className="text-gray-400 text-sm mt-2">{documents.length} document(s) uploaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-yellow-400" />
          Document Center Setup
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Upload essential documents for your team. These will be accessible in the Document Center.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const categoryDocs = documents.filter(d => d.category === category.name);
            const isUploading = uploadingCategory === category.name;

            return (
              <div key={category.name} className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm">{category.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                  </div>
                </div>

                {categoryDocs.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {categoryDocs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-zinc-800 rounded text-xs">
                        <span className="text-gray-300 truncate flex-1">{doc.name}</span>
                        <button
                          onClick={() => removeDocument(doc.id)}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="block">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(category.name, e)}
                    className="sr-only"
                  />
                  <div className="cursor-pointer text-center py-2 px-3 border border-yellow-400/30 rounded text-xs text-yellow-400 hover:bg-yellow-400/10 transition-colors">
                    + Add Files ({categoryDocs.length})
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => onComplete({ documents })}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
        >
          Continue to Next Step
        </Button>
      </div>
    </div>
  );
}

// Task 3.8: ISO-AI Preferences
function ISOAIPreferencesStep({ onComplete, isCompleted, initialData }: any) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({
    enableAI: initialData?.enableAI ?? true,
    autoRespond: initialData?.autoRespond ?? false,
    tone: initialData?.tone || 'professional',
    language: initialData?.language || 'en',
    knowledgeBase: initialData?.knowledgeBase ?? true,
    learningMode: initialData?.learningMode ?? true
  });

  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-white">ISO-AI preferences configured</p>
        <p className="text-gray-400 text-sm mt-2">AI assistant ready</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-400" />
          ISO-AI Assistant Preferences
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Configure your AI assistant to match your company's needs and communication style.
        </p>

        <div className="space-y-6">
          {/* Enable AI */}
          <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg">
            <div>
              <p className="text-white font-medium">Enable ISO-AI Assistant</p>
              <p className="text-xs text-gray-400 mt-1">Activate AI-powered support and automation</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.enableAI}
                onChange={(e) => setPreferences({ ...preferences, enableAI: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
            </label>
          </div>

          {/* Auto Respond */}
          <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg">
            <div>
              <p className="text-white font-medium">Auto-Respond to Inquiries</p>
              <p className="text-xs text-gray-400 mt-1">Let AI handle routine questions automatically</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.autoRespond}
                onChange={(e) => setPreferences({ ...preferences, autoRespond: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
            </label>
          </div>

          {/* Communication Tone */}
          <div className="p-4 bg-zinc-900/50 rounded-lg">
            <Label className="text-white font-medium mb-3 block">Communication Tone</Label>
            <Select value={preferences.tone} onValueChange={(value) => setPreferences({ ...preferences, tone: value })}>
              <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-yellow-400/30">
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Knowledge Base */}
          <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg">
            <div>
              <p className="text-white font-medium">Use Company Knowledge Base</p>
              <p className="text-xs text-gray-400 mt-1">Reference uploaded FAQs and documents</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.knowledgeBase}
                onChange={(e) => setPreferences({ ...preferences, knowledgeBase: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
            </label>
          </div>

          {/* Learning Mode */}
          <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg">
            <div>
              <p className="text-white font-medium">Continuous Learning Mode</p>
              <p className="text-xs text-gray-400 mt-1">AI learns from interactions to improve responses</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.learningMode}
                onChange={(e) => setPreferences({ ...preferences, learningMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            toast({
              title: "Preferences Saved",
              description: "ISO-AI configured successfully",
            });
            onComplete(preferences);
          }}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
        >
          Continue to Next Step
        </Button>
      </div>
    </div>
  );
}

// Task 3.9: Lead Sheet Upload and Mapping
function LeadSheetUploadStep({ onComplete, isCompleted, initialData }: any) {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(initialData?.leadSheetFile || null);
  const [parsedColumns, setParsedColumns] = useState<string[]>(initialData?.columns || []);
  const [columnMappings, setColumnMappings] = useState<any>(initialData?.columnMappings || {});
  const [showMapping, setShowMapping] = useState(false);
  const [isMappingSaved, setIsMappingSaved] = useState(initialData?.isMappingSaved || false);

  // Parse CSV/Excel columns from uploaded file
  const parseFileColumns = async (file: File) => {
    return new Promise<string[]>((resolve) => {
      const reader = new FileReader();
      
      if (file.name.endsWith('.csv')) {
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const firstLine = text.split('\n')[0];
          const columns = firstLine.split(',').map(col => col.trim().replace(/"/g, ''));
          resolve(columns.filter(col => col.length > 0));
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.onload = async (e) => {
          try {
            const data = e.target?.result;
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            if (jsonData.length > 0) {
              const headers = jsonData[0].map((h: any) => String(h || '').trim()).filter(h => h.length > 0);
              resolve(headers);
            } else {
              resolve([]);
            }
          } catch (error) {
            console.error('Error parsing Excel file:', error);
            resolve([]);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        resolve([]);
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      toast({
        title: "Processing File",
        description: "Parsing columns from uploaded file...",
      });

      const columns = await parseFileColumns(file);
      setParsedColumns(columns);
      const initialMappings: any = {};
      columns.forEach(col => {
        initialMappings[col] = { action: 'ignore', targetField: '' };
      });
      setColumnMappings(initialMappings);
      setShowMapping(true);
      setIsMappingSaved(false);

      toast({
        title: "File Uploaded",
        description: `${columns.length} columns detected. Ready for mapping.`,
      });
    }
  };

  const targetFields = [
    'merchant_id', 'business_name', 'legal_name', 'dba_name',
    'monthly_volume', 'transaction_count', 'fees', 'statement_date',
    'status', 'processor_name', 'gateway_name', 'hardware_name',
    'branch_id', 'account_number', 'routing_number', 'terminal_id',
    'batch_number', 'contact_name', 'phone', 'email', 'address',
    'city', 'state', 'zip', 'mcc_code', 'setup_date'
  ];

  const handleSaveMapping = async () => {
    if (!uploadedFile || parsedColumns.length === 0) {
      toast({
        title: "Incomplete Mapping",
        description: "Please upload a file and map columns",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/lead-sheet-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fileName: uploadedFile.name,
          columnMappings: columnMappings,
          agencyId: parseInt(localStorage.getItem('onboarding_agency_id') || '1')
        })
      });

      if (!response.ok) throw new Error('Failed to save mapping');

      setIsMappingSaved(true);
      setShowMapping(false);
      
      toast({
        title: "Mapping Saved",
        description: "Lead sheet column mapping saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error Saving Mapping",
        description: "Failed to save lead sheet mapping to database",
        variant: "destructive"
      });
    }
  };

  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-white">Lead sheet uploaded and mapped</p>
        <p className="text-gray-400 text-sm mt-2">
          {Object.values(columnMappings).filter((m: any) => m.action === 'map').length} columns mapped
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-yellow-400" />
          Lead Sheet Upload & Mapping
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Upload your lead sheet (.csv or .xlsx). The system will automatically detect columns for mapping.
        </p>

        <div className="mt-4 flex justify-center px-6 pt-5 pb-6 border-2 border-yellow-400/30 border-dashed rounded-md hover:border-yellow-400/50 transition-colors bg-zinc-900/50">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-yellow-400" />
            <div className="flex text-sm text-gray-400">
              <label
                htmlFor="leadsheet-upload"
                className="relative cursor-pointer rounded-md font-medium text-yellow-400 hover:text-yellow-300"
              >
                <span>Upload lead sheet</span>
                <input
                  id="leadsheet-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">CSV or Excel files</p>
            {uploadedFile && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400 flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {uploadedFile.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {showMapping && parsedColumns.length > 0 && (
          <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg border border-yellow-400/30">
            <div className="mb-4">
              <p className="text-sm text-green-400 mb-2">✓ File uploaded: {uploadedFile?.name}</p>
              <p className="text-sm text-gray-400 mb-4">
                {parsedColumns.length} columns detected. Choose to map or ignore each column:
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {parsedColumns.map((col, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-40 p-2 bg-zinc-900 rounded border border-zinc-700">
                    <span className="text-sm text-gray-300 truncate block">{col}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 flex gap-2">
                    <Select
                      value={columnMappings[col]?.action || 'ignore'}
                      onValueChange={(value) => {
                        setColumnMappings({
                          ...columnMappings,
                          [col]: {
                            action: value,
                            targetField: value === 'ignore' ? '' : columnMappings[col]?.targetField || ''
                          }
                        });
                      }}
                    >
                      <SelectTrigger className="w-28 bg-zinc-900 border-yellow-400/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-yellow-400/30">
                        <SelectItem value="map">Map</SelectItem>
                        <SelectItem value="ignore">Ignore</SelectItem>
                      </SelectContent>
                    </Select>
                    {columnMappings[col]?.action === 'map' && (
                      <Select
                        value={columnMappings[col]?.targetField || ''}
                        onValueChange={(value) => {
                          setColumnMappings({
                            ...columnMappings,
                            [col]: { action: 'map', targetField: value }
                          });
                        }}
                      >
                        <SelectTrigger className="flex-1 bg-zinc-900 border-yellow-400/30 text-white">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-yellow-400/30">
                          {targetFields.map(field => (
                            <SelectItem key={field} value={field}>{field}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {columnMappings[col]?.action === 'ignore' && (
                      <div className="flex-1 p-2 bg-zinc-900/50 rounded border border-zinc-700 flex items-center">
                        <span className="text-sm text-gray-500 italic">Column will be ignored</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => {
                  setShowMapping(false);
                  setUploadedFile(null);
                  setParsedColumns([]);
                  setColumnMappings({});
                }}
                variant="outline"
                className="flex-1 border-yellow-400/30 text-yellow-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveMapping}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
              >
                Save Mapping
              </Button>
            </div>
          </div>
        )}

        {isMappingSaved && !showMapping && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400 font-medium flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Lead sheet mapping saved successfully
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {Object.values(columnMappings).filter((m: any) => m.action === 'map').length} columns mapped from {uploadedFile?.name}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => onComplete({ leadSheetFile: uploadedFile, columns: parsedColumns, columnMappings, isMappingSaved })}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
          disabled={!isMappingSaved}
        >
          Complete Lead Sheet Setup
        </Button>
      </div>
    </div>
  );
}

// Task 3.10: Dashboard Tour
function DashboardTourStep({ onComplete, isCompleted }: any) {
  const { toast } = useToast();
  const [currentTourStep, setCurrentTourStep] = useState(0);

  const tourSteps = [
    {
      title: 'Welcome to Your Dashboard',
      description: 'Your central hub for managing merchants, residuals, and team performance.',
      icon: LayoutDashboard
    },
    {
      title: 'Analytics & Insights',
      description: 'Track revenue, merchant growth, and key performance metrics in real-time.',
      icon: TrendingUp
    },
    {
      title: 'Merchant Management',
      description: 'View and manage all your merchants, applications, and onboarding status.',
      icon: Users
    },
    {
      title: 'Residual Reports',
      description: 'Access monthly residual reports, splits, and payment tracking.',
      icon: DollarSign
    },
    {
      title: 'ISO-AI Assistant',
      description: 'Get instant answers and automate routine tasks with your AI assistant.',
      icon: Sparkles
    },
    {
      title: 'Document Center',
      description: 'Access contracts, compliance docs, and marketing materials anytime.',
      icon: FolderOpen
    }
  ];

  const currentStep = tourSteps[currentTourStep];
  const Icon = currentStep.icon;

  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-white text-xl font-semibold">Setup Complete!</p>
        <p className="text-gray-400 text-sm mt-2">Your agency is ready to go</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800/50 p-8 rounded-lg border border-yellow-400/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-yellow-400/20 flex items-center justify-center mx-auto mb-4">
            <Icon className="h-10 w-10 text-yellow-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">{currentStep.title}</h3>
          <p className="text-gray-400 max-w-md mx-auto">{currentStep.description}</p>
        </div>

        {/* Tour Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentTourStep
                  ? 'w-8 bg-yellow-400'
                  : index < currentTourStep
                  ? 'w-2 bg-green-400'
                  : 'w-2 bg-zinc-700'
              }`}
            />
          ))}
        </div>

        <div className="text-center text-sm text-gray-500">
          Step {currentTourStep + 1} of {tourSteps.length}
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          onClick={() => setCurrentTourStep(Math.max(0, currentTourStep - 1))}
          disabled={currentTourStep === 0}
          variant="outline"
          className="border-yellow-400/30 text-yellow-400"
        >
          Previous
        </Button>
        <Button
          onClick={() => {
            if (currentTourStep < tourSteps.length - 1) {
              setCurrentTourStep(currentTourStep + 1);
            } else {
              toast({
                title: "Onboarding Complete!",
                description: "Welcome to ISOHub - let's get started!",
              });
              onComplete({});
            }
          }}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
        >
          {currentTourStep === tourSteps.length - 1 ? 'Complete Setup' : 'Next'}
        </Button>
      </div>
    </div>
  );
}

export default function AgencyOnboarding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // Local state to track step data for passing between steps
  const [localStepData, setLocalStepData] = useState<Record<string, any>>({});

  // Get agency ID from localStorage (set when clicking "Onboard" button) or default to 1
  const agencyId = parseInt(localStorage.getItem('onboarding_agency_id') || '1');
  const agencyName = localStorage.getItem('onboarding_agency_name') || 'Your Agency';

  const { data: onboardingStatus, isLoading } = useQuery({
    queryKey: [`/api/agencies/${agencyId}/onboarding`],
    queryFn: () => apiRequest(`/api/agencies/${agencyId}/onboarding`)
  });

  const completeStepMutation = useMutation({
    mutationFn: async ({ stepName, data }: { stepName: string, data: any }) => {
      const response = await fetch(`/api/agencies/${agencyId}/onboarding/${encodeURIComponent(stepName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: 1, stepData: data })
      });
      if (!response.ok) throw new Error('Failed to complete step');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/agencies/${agencyId}/onboarding`] });
      toast({
        title: "Step Completed",
        description: `${variables.stepName} completed successfully`,
      });
      // Move to next step after a short delay to allow UI to update
      setTimeout(() => {
        setCurrentStepIndex(prev => prev < 8 ? prev + 1 : prev);
      }, 300);
    }
  });

  const status: OnboardingStatus = onboardingStatus || {
    steps: [],
    progress: 0,
    nextStep: null,
    isCompleted: false
  };

  const handleCompleteStep = (stepName: string, data: any) => {
    // Save step data to local state for cross-step access
    setLocalStepData(prev => ({ ...prev, [stepName]: data }));
    completeStepMutation.mutate({ stepName, data });
    
    // If completing the final step (Dashboard Tour), redirect to dashboard
    if (stepName === 'Dashboard Tour') {
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1500); // Small delay to show success toast
    }
  };

  const renderStepContent = (step: OnboardingStep) => {
    // Get vendor selection data from local state for use in Step 5
    const vendorSelectionData = localStepData['Vendor Selection'] || {};
    switch (step.stepName) {
      case 'Company Information':
        return (
          <CompanyInfoStep 
            onComplete={(data: any) => handleCompleteStep(step.stepName, data)} 
            isCompleted={step.isCompleted}
            initialData={step.stepData}
          />
        );
      case 'Domain & Email Setup':
        return (
          <DomainEmailStep 
            onComplete={(data: any) => handleCompleteStep(step.stepName, data)}
            isCompleted={step.isCompleted}
            initialData={step.stepData}
          />
        );
      case 'Business Profile':
        return (
          <BusinessProfileStep 
            onComplete={(data: any) => handleCompleteStep(step.stepName, data)}
            isCompleted={step.isCompleted}
            initialData={step.stepData}
          />
        );
      case 'User Setup':
        return (
          <UserSetupStep 
            onComplete={(data: any) => handleCompleteStep(step.stepName, data)}
            isCompleted={step.isCompleted}
            initialData={step.stepData}
          />
        );
      case 'Vendor Selection':
        return (
          <VendorSelectionStep 
            onComplete={(data: any) => handleCompleteStep(step.stepName, data)}
            isCompleted={step.isCompleted}
            initialData={step.stepData}
          />
        );
      case 'Processor Setup':
        return (
          <ProcessorDataSetupStep 
            onComplete={(data: any) => handleCompleteStep(step.stepName, data)}
            isCompleted={step.isCompleted}
            initialData={{
              ...step.stepData,
              ...vendorSelectionData
            }}
          />
        );
      case 'Document Center':
        return (
          <DocumentCenterStep 
            onComplete={(data: any) => handleCompleteStep(step.stepName, data)}
            isCompleted={step.isCompleted}
            initialData={step.stepData}
          />
        );
      case 'ISO-AI Preferences':
        return (
          <ISOAIPreferencesStep 
            onComplete={(data: any) => handleCompleteStep(step.stepName, data)}
            isCompleted={step.isCompleted}
            initialData={step.stepData}
          />
        );
      case 'Upload lead sheet and Mapping':
        return (
          <LeadSheetUploadStep 
            onComplete={(data: any) => handleCompleteStep(step.stepName, data)}
            isCompleted={step.isCompleted}
            initialData={step.stepData}
          />
        );
      case 'Dashboard Tour':
        return (
          <DashboardTourStep 
            onComplete={(data: any) => handleCompleteStep(step.stepName, data)}
            isCompleted={step.isCompleted}
          />
        );
      default:
        return <div className="text-gray-400">Step content not implemented</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  const defaultSteps = [
    { id: 1, stepName: 'Company Information', stepOrder: 1, isCompleted: false, completedAt: null, stepData: {} },
    { id: 2, stepName: 'Business Profile', stepOrder: 2, isCompleted: false, completedAt: null, stepData: {} },
    { id: 3, stepName: 'User Setup', stepOrder: 3, isCompleted: false, completedAt: null, stepData: {} },
    { id: 4, stepName: 'Vendor Selection', stepOrder: 4, isCompleted: false, completedAt: null, stepData: {} },
    { id: 5, stepName: 'Processor Setup', stepOrder: 5, isCompleted: false, completedAt: null, stepData: {} },
    { id: 6, stepName: 'Document Center', stepOrder: 6, isCompleted: false, completedAt: null, stepData: {} },
    { id: 7, stepName: 'ISO-AI Preferences', stepOrder: 7, isCompleted: false, completedAt: null, stepData: {} },
    { id: 8, stepName: 'Upload lead sheet and Mapping', stepOrder: 8, isCompleted: false, completedAt: null, stepData: {} },
    { id: 9, stepName: 'Dashboard Tour', stepOrder: 9, isCompleted: false, completedAt: null, stepData: {} },
  ];

  const displaySteps = status.steps.length > 0 ? status.steps : defaultSteps;
  const currentStep = displaySteps[currentStepIndex];
  const completedSteps = displaySteps.filter(s => s.isCompleted).length;
  const progressPercentage = (completedSteps / displaySteps.length) * 100;

  if (status.isCompleted || completedSteps === displaySteps.length) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardContent className="pt-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-green-400 mb-4">Agency Setup Complete!</h1>
              <p className="text-gray-400 mb-6">
                Your agency has been successfully configured in the ISO Hub system. You can now start managing agents and processing transactions.
              </p>
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Compact Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white mb-1">
            Agency Setup & Onboarding
          </h1>
        <p className="text-gray-400 text-sm">
          Complete the step-by-step setup process to configure your agency in the ISO Hub system
        </p>
      </div>

      {/* Horizontal Step Icons - Circles Only */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Setup Progress</h2>
            <p className="text-xs text-gray-400">
              {completedSteps} of {displaySteps.length} steps completed
            </p>
          </div>
          <Badge variant={progressPercentage === 100 ? "default" : "secondary"} className={`text-xs ${progressPercentage === 100 ? 'bg-green-500 text-white' : 'bg-zinc-700 text-gray-300'}`}>
            {progressPercentage === 100 ? "Completed" : "In Progress"}
          </Badge>
        </div>
        
        {/* Single horizontal line of circular icons */}
        <div className="flex items-center justify-center gap-4 py-4">
          {displaySteps.map((step, index) => {
            const IconComponent = stepIcons[step.stepName as keyof typeof stepIcons] || Settings;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(index)}
                className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all ${
                  step.isCompleted 
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : index === currentStepIndex
                    ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400 scale-110'
                    : 'bg-zinc-800 border-zinc-600 text-gray-500'
                }`}
                title={`Step ${index + 1}: ${step.stepName}`}
              >
                {step.isCompleted ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <IconComponent className="h-6 w-6" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {currentStep && (
        <Card className="bg-zinc-900/80 border-yellow-400/20">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-400/20 rounded-lg">
                <ArrowRight className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-white">Step {currentStepIndex + 1}: {currentStep.stepName}</CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  {stepDescriptions[currentStep.stepName as keyof typeof stepDescriptions]}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderStepContent(currentStep)}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}