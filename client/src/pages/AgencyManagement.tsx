import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Users, Upload, Check, Clock, AlertTriangle, Edit, ExternalLink, UserCheck } from 'lucide-react';
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

interface Agency {
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

interface NewAgencyForm {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  description: string;
}

const defaultFormValues: NewAgencyForm = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  website: '',
  industry: '',
  primaryColor: '#FFD700',
  secondaryColor: '#000000',
  accentColor: '#FFFFFF',
  description: '',
};

export default function AgencyManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<NewAgencyForm>(defaultFormValues);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agencies = [], isLoading } = useQuery({
    queryKey: ['/api/agencies'],
    retry: false,
  });

  const createAgencyMutation = useMutation({
    mutationFn: async (agencyData: NewAgencyForm) => {
      const submitData = new FormData();
      Object.keys(agencyData).forEach(key => {
        const value = agencyData[key as keyof NewAgencyForm];
        if (value !== null && value !== undefined && value !== '') {
          submitData.append(key, value);
        }
      });
      if (logoFile) {
        submitData.append('logo', logoFile);
      }
      submitData.append('isWhitelabel', 'true');

      return await apiRequest('/api/agencies', {
        method: 'POST',
        body: submitData,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies'] });
      setShowCreateDialog(false);
      setFormData(defaultFormValues);
      setLogoFile(null);
      toast({
        title: "Agency Created Successfully",
        description: `${data.companyName || 'Agency'} has been created with admin account.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Agency",
        description: error.message || 'Failed to create agency',
        variant: "destructive",
      });
    },
  });

  const handleOpenCreateDialog = () => {
    setFormData(defaultFormValues);
    setLogoFile(null);
    setShowCreateDialog(true);
  };

  const handleCreateAgency = () => {
    if (!formData.companyName || !formData.contactName || !formData.email) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Company Name, Contact Name, and Email",
        variant: "destructive",
      });
      return;
    }

    createAgencyMutation.mutate(formData);
  };

  const handleFormChange = (field: keyof NewAgencyForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImpersonateAgency = async (agency: Agency) => {
    try {
      // Call impersonation API to get temporary access token for the agency
      const response = await apiRequest(`/api/agencies/${agency.id}/impersonate`, {
        method: 'POST',
      });
      
      // Store original admin context in sessionStorage for restoration
      const currentAuth = {
        username: localStorage.getItem('username'),
        token: localStorage.getItem('authToken'),
        organization: localStorage.getItem('organization'),
        isSuperAdmin: true
      };
      
      sessionStorage.setItem('superAdminContext', JSON.stringify(currentAuth));
      sessionStorage.setItem('impersonatingAgency', JSON.stringify({
        agencyId: agency.id,
        agencyName: agency.companyName,
        adminUsername: agency.adminUsername
      }));
      
      // Update localStorage with agency admin credentials
      localStorage.setItem('username', agency.adminUsername);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('organization', `agency-${agency.id}`);
      
      toast({
        title: "Impersonation Started",
        description: `Now logged in as ${agency.adminUsername} for ${agency.companyName}. You can troubleshoot as the agency admin.`,
      });
      
      // Reload the page to refresh the UI with agency context
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      toast({
        title: "Impersonation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Logo file must be under 5MB",
          variant: "destructive",
        });
        return;
      }
      setLogoFile(file);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'setup': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmailStatus = (agency: Agency) => {
    if (agency.welcomeEmailSent && agency.passwordEmailSent) {
      return { icon: Check, color: 'text-green-600', text: 'Sent' };
    } else if (agency.welcomeEmailSent) {
      return { icon: Clock, color: 'text-yellow-600', text: 'Partial' };
    } else {
      return { icon: AlertTriangle, color: 'text-red-600', text: 'Pending' };
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Agency Management</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create and manage agency instances with automated onboarding
              </p>
            </div>
            <Button
              onClick={handleOpenCreateDialog}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Agency
            </Button>
          </div>
        </div>

        {/* Existing Agencies Table */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black dark:text-white">
              <Users className="h-5 w-5" />
              Existing Agencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : agencies.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No agencies yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first agency using one of the templates above
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-black dark:text-white">Company</TableHead>
                      <TableHead className="text-black dark:text-white">Contact</TableHead>
                      <TableHead className="text-black dark:text-white">Status</TableHead>
                      <TableHead className="text-black dark:text-white">Admin Account</TableHead>
                      <TableHead className="text-black dark:text-white">Email Status</TableHead>
                      <TableHead className="text-black dark:text-white">Brand Colors</TableHead>
                      <TableHead className="text-black dark:text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agencies.map((agency: Agency) => {
                      const emailStatus = getEmailStatus(agency);
                      const EmailIcon = emailStatus.icon;
                      
                      return (
                        <TableRow key={agency.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {agency.logoUrl && (
                                <img 
                                  src={agency.logoUrl} 
                                  alt={`${agency.companyName} logo`}
                                  className="h-8 w-8 object-contain rounded"
                                />
                              )}
                              <div>
                                <div className="font-medium text-black dark:text-white">
                                  {agency.companyName}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {agency.industry}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-black dark:text-white">
                                {agency.contactName}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {agency.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(agency.status)}>
                              {agency.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="text-black dark:text-white font-mono">
                                {agency.adminUsername}
                              </div>
                              {agency.tempPassword && (
                                <div className="text-gray-600 dark:text-gray-400">
                                  Temp password set
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <EmailIcon className={`h-4 w-4 ${emailStatus.color}`} />
                              <span className="text-sm text-black dark:text-white">
                                {emailStatus.text}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <div 
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: agency.primaryColor }}
                                title="Primary"
                              />
                              <div 
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: agency.secondaryColor }}
                                title="Secondary"
                              />
                              <div 
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: agency.accentColor }}
                                title="Accent"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200"
                                onClick={() => handleImpersonateAgency(agency)}
                                title="Login as agency admin for troubleshooting"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Impersonate
                              </Button>
                              {agency.website && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => window.open(agency.website, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Agency Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-black dark:text-white">
                Create New Agency
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-black dark:text-white">Company Name *</Label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => handleFormChange('companyName', e.target.value)}
                    placeholder="Enter company name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-black dark:text-white">Contact Name *</Label>
                  <Input
                    value={formData.contactName}
                    onChange={(e) => handleFormChange('contactName', e.target.value)}
                    placeholder="Primary contact"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-black dark:text-white">Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="contact@company.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-black dark:text-white">Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-black dark:text-white">Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => handleFormChange('website', e.target.value)}
                    placeholder="https://company.com"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-black dark:text-white">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleFormChange('industry', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Financial Technology">Financial Technology</SelectItem>
                      <SelectItem value="Payment Processing">Payment Processing</SelectItem>
                      <SelectItem value="Retail Technology">Retail Technology</SelectItem>
                      <SelectItem value="E-Commerce">E-Commerce</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Brand Colors */}
              <div>
                <Label className="text-black dark:text-white mb-2 block">Brand Colors</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600 dark:text-gray-400">Primary</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => handleFormChange('primaryColor', e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => handleFormChange('primaryColor', e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 dark:text-gray-400">Secondary</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => handleFormChange('secondaryColor', e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={formData.secondaryColor}
                        onChange={(e) => handleFormChange('secondaryColor', e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 dark:text-gray-400">Accent</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={formData.accentColor}
                        onChange={(e) => handleFormChange('accentColor', e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={formData.accentColor}
                        onChange={(e) => handleFormChange('accentColor', e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <Label className="text-black dark:text-white">Logo (Optional)</Label>
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
                    className="w-full h-16 border-2 border-dashed border-gray-300 dark:border-gray-600"
                  >
                    <div className="text-center">
                      <Upload className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {logoFile ? logoFile.name : 'Click to upload logo'}
                      </span>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-black dark:text-white">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Brief description of the agency..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* What happens */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-black dark:text-white mb-2">
                  What happens when you create an agency:
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>✓ Admin user account will be created automatically</li>
                  <li>✓ Temporary password will be generated</li>
                  <li>✓ Agency instance configured with brand colors</li>
                  <li>✓ Multi-tenant isolation enabled</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateAgency}
                disabled={createAgencyMutation.isPending}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {createAgencyMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Create Agency
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}