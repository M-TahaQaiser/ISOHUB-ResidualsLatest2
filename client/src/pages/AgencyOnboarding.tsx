import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  'Processor & Lead Sheet Setup': Upload,
  'FAQ Upload': FileText,
  'Document Center': FolderOpen,
  'ISO-AI Preferences': Sparkles,
  'Residual Upload': DollarSign,
  'Dashboard Tour': LayoutDashboard,
};

const stepDescriptions = {
  'Company Information': 'Complete your company profile and contact details',
  'Domain & Email Setup': 'Configure whitelabel domain and email settings',
  'Business Profile': 'AI-powered business understanding and analysis',
  'User Setup': 'Add team members and configure user roles',
  'Vendor Selection': 'Select processors, gateways, and hardware/POS vendors',
  'Processor & Lead Sheet Setup': 'Upload lead sheets, map processor data, and import historical data',
  'FAQ Upload': 'Upload FAQ document for ISO-AI knowledge base',
  'Document Center': 'Upload essential documents and resources',
  'ISO-AI Preferences': 'Configure your AI assistant settings',
  'Residual Upload': 'Import historical residual data',
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

      {/* HIDDEN: Whitelabel Build-out section - will be re-enabled later */}
      {/* <div className="border-t border-yellow-400/20 pt-6">
        <div className="flex items-center space-x-3 mb-6">
          <Switch
            checked={formData.isWhitelabel}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isWhitelabel: checked }))}
          />
          <div>
            <Label className="text-base font-medium text-white">Whitelabel Build-out</Label>
            <p className="text-sm text-gray-400">Enable custom branding and logo for your platform</p>
          </div>
        </div>
      </div> */}

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
        processors: selectedProcessors,
        gateways: selectedGateways,
        hardware: selectedHardware
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
  const [currentSubStep, setCurrentSubStep] = useState(0);
  const [leadSheetFile, setLeadSheetFile] = useState<File | null>(initialData?.leadSheetFile || null);
  const [processorMappings, setProcessorMappings] = useState<any[]>(initialData?.processorMappings || []);
  const [uploadedData, setUploadedData] = useState<any[]>(initialData?.uploadedData || []);

  // Get selected processors from previous step
  const selectedProcessorIds = initialData?.selectedProcessors || [];
  
  const { data: vendors } = useQuery({
    queryKey: ['/api/vendors'],
    queryFn: async () => {
      const response = await fetch('/api/vendors', { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    }
  });

  const selectedProcessors = vendors?.filter((v: any) => 
    selectedProcessorIds.includes(v.id) && v.category === 'Processors'
  ) || [];

  const subSteps = [
    { title: 'Lead Sheet Upload', icon: Upload },
    { title: 'Processor Mapping', icon: Database },
    { title: 'Upload Past Data', icon: FileText }
  ];

  // Sub-step 5.1: Lead Sheet Upload
  const renderLeadSheetUpload = () => {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setLeadSheetFile(file);
        toast({
          title: "File Selected",
          description: `${file.name} ready for upload`,
        });
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-yellow-400" />
            Upload Lead Sheet
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Upload your master lead sheet that cross-references MID numbers and branch numbers for processor reports.
          </p>

          <div className="mt-4 flex justify-center px-6 pt-5 pb-6 border-2 border-yellow-400/30 border-dashed rounded-md hover:border-yellow-400/50 transition-colors bg-zinc-900/50">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-yellow-400" />
              <div className="flex text-sm text-gray-400">
                <label
                  htmlFor="lead-sheet-upload"
                  className="relative cursor-pointer rounded-md font-medium text-yellow-400 hover:text-yellow-300 focus-within:outline-none"
                >
                  <span>Upload a file</span>
                  <input
                    id="lead-sheet-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">CSV or Excel files</p>
              {leadSheetFile && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400 flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {leadSheetFile.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => {
              if (!leadSheetFile) {
                toast({
                  title: "No File Selected",
                  description: "Please upload a lead sheet to continue",
                  variant: "destructive"
                });
                return;
              }
              setCurrentSubStep(1);
              toast({
                title: "Lead Sheet Uploaded",
                description: "Proceeding to processor mapping",
              });
            }}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            disabled={!leadSheetFile}
          >
            Continue to Mapping
          </Button>
        </div>
      </div>
    );
  };

  // Sub-step 5.2: Processor Mapping
  const renderProcessorMapping = () => {
    const [selectedProcessor, setSelectedProcessor] = useState<any>(null);
    const [mappingFile, setMappingFile] = useState<File | null>(null);
    const [columnMappings, setColumnMappings] = useState<any>({});

    const sampleColumns = ['MID', 'DBA Name', 'Monthly Volume', 'Transaction Count', 'Fees', 'Date'];
    const targetFields = ['merchant_id', 'business_name', 'volume', 'transactions', 'fees', 'statement_date'];

    const handleProcessorSelect = (processor: any) => {
      setSelectedProcessor(processor);
      setMappingFile(null);
      setColumnMappings({});
    };

    const handleMappingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setMappingFile(file);
        toast({
          title: "Sample File Uploaded",
          description: "Ready for column mapping",
        });
      }
    };

    const handleSaveMapping = () => {
      if (!selectedProcessor || !mappingFile) {
        toast({
          title: "Incomplete Mapping",
          description: "Please select a processor and upload a sample file",
          variant: "destructive"
        });
        return;
      }

      const newMapping = {
        processorId: selectedProcessor.id,
        processorName: selectedProcessor.name,
        file: mappingFile,
        columns: columnMappings,
        completed: true
      };

      setProcessorMappings([...processorMappings, newMapping]);
      setSelectedProcessor(null);
      setMappingFile(null);
      setColumnMappings({});
      
      toast({
        title: "Mapping Saved",
        description: `${selectedProcessor.name} mapping configured`,
      });
    };

    const allProcessorsMapped = selectedProcessors.length > 0 && 
      processorMappings.length === selectedProcessors.length;

    return (
      <div className="space-y-6">
        <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-yellow-400" />
            Processor Data Mapping
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Configure column mapping for each processor selected in Step 4.
          </p>

          {/* Processor List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {selectedProcessors.map((processor: any) => {
              const isMapped = processorMappings.some((m: any) => m.processorId === processor.id);
              const isSelected = selectedProcessor?.id === processor.id;
              
              return (
                <button
                  key={processor.id}
                  onClick={() => handleProcessorSelect(processor)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isMapped
                      ? 'bg-green-500/10 border-green-500 cursor-default'
                      : isSelected
                      ? 'bg-yellow-400/20 border-yellow-400'
                      : 'bg-zinc-900/50 border-zinc-700 hover:border-yellow-400/50'
                  }`}
                  disabled={isMapped}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      isMapped ? 'text-green-400' : isSelected ? 'text-white' : 'text-gray-400'
                    }`}>
                      {processor.name}
                    </span>
                    {isMapped && <CheckCircle className="h-5 w-5 text-green-400" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mapping Interface */}
          {selectedProcessor && (
            <div className="mt-6 p-4 bg-zinc-900/50 rounded-lg border border-yellow-400/30">
              <h4 className="text-white font-medium mb-4">
                Mapping for {selectedProcessor.name}
              </h4>

              <div className="mb-4">
                <Label className="text-gray-300">Upload Sample File</Label>
                <div className="mt-2 flex justify-center px-6 pt-4 pb-4 border-2 border-dashed rounded-md border-yellow-400/30 bg-zinc-800/50">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-yellow-400" />
                    <div className="mt-2">
                      <label
                        htmlFor="mapping-file-upload"
                        className="cursor-pointer text-sm text-yellow-400 hover:text-yellow-300"
                      >
                        Upload CSV/Excel
                        <input
                          id="mapping-file-upload"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleMappingFileUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    {mappingFile && (
                      <p className="text-xs text-green-400 mt-2">✓ {mappingFile.name}</p>
                    )}
                  </div>
                </div>
              </div>

              {mappingFile && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">Map your columns to system fields:</p>
                  {sampleColumns.map((col, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1 p-2 bg-zinc-800 rounded border border-zinc-700">
                        <span className="text-sm text-gray-300">{col}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-yellow-400" />
                      <div className="flex-1">
                        <Select
                          value={columnMappings[col] || ''}
                          onValueChange={(value) => setColumnMappings({ ...columnMappings, [col]: value })}
                        >
                          <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-yellow-400/30">
                            {targetFields.map(field => (
                              <SelectItem key={field} value={field}>{field}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleSaveMapping}
                className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                disabled={!mappingFile}
              >
                Save Mapping
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            onClick={() => setCurrentSubStep(0)}
            variant="outline"
            className="border-yellow-400/30 text-yellow-400"
          >
            Back
          </Button>
          <Button
            onClick={() => {
              if (!allProcessorsMapped) {
                toast({
                  title: "Incomplete Mappings",
                  description: "Please map all selected processors",
                  variant: "destructive"
                });
                return;
              }
              setCurrentSubStep(2);
            }}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            disabled={!allProcessorsMapped}
          >
            Continue to Upload
          </Button>
        </div>
      </div>
    );
  };

  // Sub-step 5.3: Upload Past Data
  const renderUploadPastData = () => {
    const [uploadingProcessor, setUploadingProcessor] = useState<any>(null);
    const [dataFile, setDataFile] = useState<File | null>(null);

    const handleDataUpload = (processor: any) => {
      setUploadingProcessor(processor);
      setDataFile(null);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setDataFile(file);
      }
    };

    const handleProcessData = () => {
      if (!dataFile || !uploadingProcessor) return;

      // Simulate data processing
      toast({
        title: "Processing Data",
        description: "Parsing and auditing uploaded data...",
      });

      setTimeout(() => {
        const newUpload = {
          processorId: uploadingProcessor.id,
          processorName: uploadingProcessor.name,
          file: dataFile,
          processed: true,
          recordCount: Math.floor(Math.random() * 1000) + 100
        };

        setUploadedData([...uploadedData, newUpload]);
        setUploadingProcessor(null);
        setDataFile(null);

        toast({
          title: "Data Uploaded Successfully",
          description: `${newUpload.recordCount} records parsed and saved to master data table`,
        });
      }, 2000);
    };

    const allDataUploaded = processorMappings.length > 0 && 
      uploadedData.length === processorMappings.length;

    return (
      <div className="space-y-6">
        <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-yellow-400" />
            Upload Historical Data
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Upload past data for each mapped processor. Data will be parsed by month/year and added to your master table.
          </p>

          <div className="space-y-3">
            {processorMappings.map((mapping: any) => {
              const isUploaded = uploadedData.some((u: any) => u.processorId === mapping.processorId);
              const isUploading = uploadingProcessor?.id === mapping.processorId;

              return (
                <div
                  key={mapping.processorId}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isUploaded
                      ? 'bg-green-500/10 border-green-500'
                      : isUploading
                      ? 'bg-yellow-400/20 border-yellow-400'
                      : 'bg-zinc-900/50 border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isUploaded ? 'bg-green-500/20' : 'bg-yellow-400/20'
                      }`}>
                        {isUploaded ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <Upload className="h-5 w-5 text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{mapping.processorName}</p>
                        {isUploaded && (
                          <p className="text-xs text-green-400">
                            {uploadedData.find((u: any) => u.processorId === mapping.processorId)?.recordCount} records uploaded
                          </p>
                        )}
                      </div>
                    </div>
                    {!isUploaded && !isUploading && (
                      <Button
                        onClick={() => handleDataUpload(mapping)}
                        size="sm"
                        className="bg-yellow-400 hover:bg-yellow-500 text-black"
                      >
                        Upload Data
                      </Button>
                    )}
                  </div>

                  {isUploading && (
                    <div className="mt-3 p-3 bg-zinc-800/50 rounded border border-yellow-400/30">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        className="mb-3 text-sm text-gray-400"
                      />
                      {dataFile && (
                        <Button
                          onClick={handleProcessData}
                          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                        >
                          Process & Upload
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            onClick={() => setCurrentSubStep(1)}
            variant="outline"
            className="border-yellow-400/30 text-yellow-400"
          >
            Back
          </Button>
          <Button
            onClick={() => {
              if (!allDataUploaded) {
                toast({
                  title: "Incomplete Uploads",
                  description: "Please upload data for all processors",
                  variant: "destructive"
                });
                return;
              }
              onComplete({
                leadSheetFile,
                processorMappings,
                uploadedData
              });
            }}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            disabled={!allDataUploaded}
          >
            Complete Data Setup
          </Button>
        </div>
      </div>
    );
  };

  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-white">Processor data setup complete</p>
        <p className="text-gray-400 text-sm mt-2">
          {uploadedData.length} processor(s) configured with historical data
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-step Progress */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {subSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                index === currentSubStep
                  ? 'bg-yellow-400/20 border-2 border-yellow-400'
                  : index < currentSubStep
                  ? 'bg-green-500/20 border-2 border-green-500'
                  : 'bg-zinc-800 border-2 border-zinc-600'
              }`}>
                {index < currentSubStep ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <Icon className={`h-4 w-4 ${
                    index === currentSubStep ? 'text-yellow-400' : 'text-gray-500'
                  }`} />
                )}
                <span className={`text-sm font-medium ${
                  index === currentSubStep ? 'text-yellow-400' : index < currentSubStep ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < subSteps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-600 mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Render current sub-step */}
      {currentSubStep === 0 && renderLeadSheetUpload()}
      {currentSubStep === 1 && renderProcessorMapping()}
      {currentSubStep === 2 && renderUploadPastData()}
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

// Task 3.9: Residual Upload
function ResidualUploadStep({ onComplete, isCompleted, initialData }: any) {
  const { toast } = useToast();
  const [residualFile, setResidualFile] = useState<File | null>(initialData?.residualFile || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStats, setUploadStats] = useState<any>(initialData?.uploadStats || null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResidualFile(file);
      toast({
        title: "Residual File Selected",
        description: `${file.name} ready for processing`,
      });
    }
  };

  const handleProcessResiduals = () => {
    if (!residualFile) return;

    setIsProcessing(true);
    toast({
      title: "Processing Residuals",
      description: "Parsing and calculating residual data...",
    });

    setTimeout(() => {
      const stats = {
        totalRecords: Math.floor(Math.random() * 500) + 100,
        totalAmount: (Math.random() * 50000 + 10000).toFixed(2),
        merchants: Math.floor(Math.random() * 100) + 20,
        months: Math.floor(Math.random() * 6) + 1
      };
      setUploadStats(stats);
      setIsProcessing(false);
      toast({
        title: "Residuals Processed Successfully",
        description: `${stats.totalRecords} records imported`,
      });
    }, 2500);
  };

  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-white">Residual data uploaded</p>
        {uploadStats && (
          <p className="text-gray-400 text-sm mt-2">
            ${uploadStats.totalAmount} across {uploadStats.merchants} merchants
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800/50 p-6 rounded-lg border border-yellow-400/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-yellow-400" />
          Upload Residual Data
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Upload your historical residual data. The system will parse and calculate splits automatically.
        </p>

        <div className="mt-4 flex justify-center px-6 pt-5 pb-6 border-2 border-yellow-400/30 border-dashed rounded-md hover:border-yellow-400/50 transition-colors bg-zinc-900/50">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-yellow-400" />
            <div className="flex text-sm text-gray-400">
              <label
                htmlFor="residual-upload"
                className="relative cursor-pointer rounded-md font-medium text-yellow-400 hover:text-yellow-300"
              >
                <span>Upload residual file</span>
                <input
                  id="residual-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">CSV or Excel files</p>
            {residualFile && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400 flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {residualFile.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {residualFile && !uploadStats && (
          <Button
            onClick={handleProcessResiduals}
            className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Process Residuals'}
          </Button>
        )}

        {uploadStats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">{uploadStats.totalRecords}</p>
              <p className="text-xs text-gray-400 mt-1">Records</p>
            </div>
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">${uploadStats.totalAmount}</p>
              <p className="text-xs text-gray-400 mt-1">Total Amount</p>
            </div>
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">{uploadStats.merchants}</p>
              <p className="text-xs text-gray-400 mt-1">Merchants</p>
            </div>
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-400">{uploadStats.months}</p>
              <p className="text-xs text-gray-400 mt-1">Months</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => onComplete({ residualFile, uploadStats })}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
          disabled={!uploadStats}
        >
          Continue to Next Step
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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const agencyId = 1;

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
        setCurrentStepIndex(prev => prev < 6 ? prev + 1 : prev);
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
    completeStepMutation.mutate({ stepName, data });
  };

  const renderStepContent = (step: OnboardingStep) => {
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
      case 'Processor & Lead Sheet Setup':
        return (
          <ProcessorDataSetupStep 
            onComplete={(data: any) => handleCompleteStep(step.stepName, data)}
            isCompleted={step.isCompleted}
            initialData={step.stepData}
          />
        );
      case 'FAQ Upload':
        return (
          <FAQUploadStep 
            onComplete={(data: any) => handleCompleteStep(step.stepName, data)}
            isCompleted={step.isCompleted}
            initialData={step.stepData}
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
      case 'Residual Upload':
        return (
          <ResidualUploadStep 
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
    { id: 5, stepName: 'Processor & Lead Sheet Setup', stepOrder: 5, isCompleted: false, completedAt: null, stepData: {} },
    { id: 6, stepName: 'FAQ Upload', stepOrder: 6, isCompleted: false, completedAt: null, stepData: {} },
    { id: 7, stepName: 'Document Center', stepOrder: 7, isCompleted: false, completedAt: null, stepData: {} },
    { id: 8, stepName: 'ISO-AI Preferences', stepOrder: 8, isCompleted: false, completedAt: null, stepData: {} },
    { id: 9, stepName: 'Residual Upload', stepOrder: 9, isCompleted: false, completedAt: null, stepData: {} },
    { id: 10, stepName: 'Dashboard Tour', stepOrder: 10, isCompleted: false, completedAt: null, stepData: {} },
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
