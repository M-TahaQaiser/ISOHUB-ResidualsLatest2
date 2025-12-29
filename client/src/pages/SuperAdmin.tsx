import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Plus, 
  Users, 
  DollarSign, 
  Settings, 
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Database,
  Shield,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Agency {
  id: number;
  name: string;
  domain?: string;
  companyName?: string;
  contactEmail: string;
  subscriptionPlan: string;
  isActive: boolean;
  onboardingStatus: string;
  userCount: number;
  merchantCount: number;
  subscriptionStatus: string;
  onboardingProgress: number;
  createdAt: string;
}

interface NewAgencyForm {
  name: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  domain: string;
  industry: string;
  subscriptionPlan: string;
  maxUsers: number;
  maxMerchants: number;
}

interface AdminUserForm {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export default function SuperAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [newAgency, setNewAgency] = useState<NewAgencyForm>({
    name: '',
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    domain: '',
    industry: '',
    subscriptionPlan: 'basic',
    maxUsers: 5,
    maxMerchants: 1000
  });

  const [adminUser, setAdminUser] = useState<AdminUserForm>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  // Fetch all agencies
  const { data: agenciesData, isLoading } = useQuery({
    queryKey: ['/api/agencies'],
    queryFn: () => apiRequest('/api/agencies')
  });

  // Create agency mutation
  const createAgencyMutation = useMutation({
    mutationFn: (data: { agency: NewAgencyForm; adminUser: AdminUserForm }) => 
      apiRequest('/api/agencies', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies'] });
      setIsCreateDialogOpen(false);
      resetForms();
      toast({
        title: "Agency Created",
        description: "New agency and admin user created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create agency",
        variant: "destructive",
      });
    },
  });

  const resetForms = () => {
    setNewAgency({
      name: '', companyName: '', contactEmail: '', contactPhone: '',
      domain: '', industry: '', subscriptionPlan: 'basic', maxUsers: 5, maxMerchants: 1000
    });
    setAdminUser({
      username: '', email: '', password: '', firstName: '', lastName: ''
    });
  };

  const handleCreateAgency = () => {
    createAgencyMutation.mutate({ agency: newAgency, adminUser });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      trial: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      suspended: "bg-red-500/20 text-red-400 border-red-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      completed: "bg-green-500/20 text-green-400 border-green-500/30",
      in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30"
    };
    return variants[status as keyof typeof variants] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'enterprise': return <Building2 className="h-4 w-4" />;
      case 'pro': return <TrendingUp className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const agencies = agenciesData?.agencies || [];
  const totalUsers = agencies.reduce((sum: number, a: Agency) => sum + a.userCount, 0);
  const totalMerchants = agencies.reduce((sum: number, a: Agency) => sum + a.merchantCount, 0);
  const activeAgencies = agencies.filter((a: Agency) => a.isActive).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Super Admin Dashboard</h1>
              <p className="text-gray-400">Manage all agencies, users, and system-wide settings</p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Agency
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-zinc-900 border-yellow-400/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Agency</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Set up a new client agency with admin user and subscription
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="agency" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
                    <TabsTrigger value="agency" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">Agency Info</TabsTrigger>
                    <TabsTrigger value="admin" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">Admin User</TabsTrigger>
                    <TabsTrigger value="subscription" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">Subscription</TabsTrigger>
                  </TabsList>

                  <TabsContent value="agency" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-gray-300">Agency Name*</Label>
                        <Input
                          id="name"
                          value={newAgency.name}
                          onChange={(e) => setNewAgency({ ...newAgency, name: e.target.value })}
                          placeholder="ABC Payment Solutions"
                          className="bg-zinc-800 border-yellow-400/30 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="domain" className="text-gray-300">Subdomain</Label>
                        <Input
                          id="domain"
                          value={newAgency.domain}
                          onChange={(e) => setNewAgency({ ...newAgency, domain: e.target.value })}
                          placeholder="abc-payments"
                          className="bg-zinc-800 border-yellow-400/30 text-white"
                        />
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName" className="text-gray-300">Company Name</Label>
                      <Input
                        id="companyName"
                        value={newAgency.companyName}
                        onChange={(e) => setNewAgency({ ...newAgency, companyName: e.target.value })}
                        placeholder="ABC Payment Solutions LLC"
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="industry" className="text-gray-300">Industry</Label>
                      <Select 
                        value={newAgency.industry} 
                        onValueChange={(value) => setNewAgency({ ...newAgency, industry: value })}
                      >
                        <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-yellow-400/30">
                          <SelectItem value="payment_processing">Payment Processing</SelectItem>
                          <SelectItem value="merchant_services">Merchant Services</SelectItem>
                          <SelectItem value="fintech">FinTech</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactEmail" className="text-gray-300">Contact Email*</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={newAgency.contactEmail}
                        onChange={(e) => setNewAgency({ ...newAgency, contactEmail: e.target.value })}
                        placeholder="admin@abcpayments.com"
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone" className="text-gray-300">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        value={newAgency.contactPhone}
                        onChange={(e) => setNewAgency({ ...newAgency, contactPhone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="admin" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-gray-300">First Name*</Label>
                      <Input
                        id="firstName"
                        value={adminUser.firstName}
                        onChange={(e) => setAdminUser({ ...adminUser, firstName: e.target.value })}
                        placeholder="John"
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-gray-300">Last Name*</Label>
                      <Input
                        id="lastName"
                        value={adminUser.lastName}
                        onChange={(e) => setAdminUser({ ...adminUser, lastName: e.target.value })}
                        placeholder="Smith"
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username" className="text-gray-300">Username*</Label>
                      <Input
                        id="username"
                        value={adminUser.username}
                        onChange={(e) => setAdminUser({ ...adminUser, username: e.target.value })}
                        placeholder="johnsmith"
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-gray-300">Email*</Label>
                      <Input
                        id="email"
                        type="email"
                        value={adminUser.email}
                        onChange={(e) => setAdminUser({ ...adminUser, email: e.target.value })}
                        placeholder="john@abcpayments.com"
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-gray-300">Password* (Min 12 characters)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={adminUser.password}
                      onChange={(e) => setAdminUser({ ...adminUser, password: e.target.value })}
                      placeholder="Secure password (12+ characters)"
                      className="bg-zinc-800 border-yellow-400/30 text-white"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="subscription" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="subscriptionPlan" className="text-gray-300">Plan</Label>
                      <Select 
                        value={newAgency.subscriptionPlan} 
                        onValueChange={(value) => setNewAgency({ ...newAgency, subscriptionPlan: value })}
                      >
                        <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-yellow-400/30">
                          <SelectItem value="trial">14-Day Trial (Free)</SelectItem>
                          <SelectItem value="basic">Basic ($49/month)</SelectItem>
                          <SelectItem value="pro">Pro ($99/month)</SelectItem>
                          <SelectItem value="enterprise">Enterprise ($199/month)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="maxUsers" className="text-gray-300">Max Users</Label>
                      <Input
                        id="maxUsers"
                        type="number"
                        value={newAgency.maxUsers}
                        onChange={(e) => setNewAgency({ ...newAgency, maxUsers: parseInt(e.target.value) })}
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxMerchants" className="text-gray-300">Max Merchants</Label>
                      <Input
                        id="maxMerchants"
                        type="number"
                        value={newAgency.maxMerchants}
                        onChange={(e) => setNewAgency({ ...newAgency, maxMerchants: parseInt(e.target.value) })}
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="pt-4 border-t border-yellow-400/20">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-gray-600 text-gray-300 hover:bg-zinc-700">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAgency}
                  disabled={createAgencyMutation.isPending}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  {createAgencyMutation.isPending ? "Creating..." : "Create Agency"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-zinc-900/80 border-yellow-400/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Total Agencies</p>
                <p className="text-2xl font-bold text-white">{agencies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-yellow-400/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Active Agencies</p>
                <p className="text-2xl font-bold text-white">{activeAgencies}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-yellow-400/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-yellow-400/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-sm text-gray-400">Total Merchants</p>
                <p className="text-2xl font-bold text-white">{totalMerchants}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agencies Table */}
      <Card className="bg-zinc-900/80 border-yellow-400/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Building2 className="h-5 w-5 text-yellow-400" />
            Agency Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-yellow-400/20 hover:bg-zinc-800/50">
                  <TableHead className="text-gray-300">Agency</TableHead>
                  <TableHead className="text-gray-300">Contact</TableHead>
                  <TableHead className="text-gray-300">Plan</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Onboarding</TableHead>
                  <TableHead className="text-gray-300">Users</TableHead>
                  <TableHead className="text-gray-300">Merchants</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agencies.map((agency: Agency) => (
                  <TableRow key={agency.id} className="border-yellow-400/20 hover:bg-zinc-800/50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-white">{agency.name}</div>
                        <div className="text-sm text-gray-400">{agency.companyName}</div>
                        {agency.domain && (
                          <div className="text-xs text-yellow-400">{agency.domain}.isohub.com</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-300">{agency.contactEmail}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getPlanIcon(agency.subscriptionPlan)}
                        <Badge className={`${getStatusBadge(agency.subscriptionPlan)} capitalize`}>
                          {agency.subscriptionPlan}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusBadge(agency.subscriptionStatus)}`}>
                        {agency.subscriptionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress value={agency.onboardingProgress} className="h-2" />
                        <div className="text-xs text-gray-400 mt-1">
                          {agency.onboardingProgress}% complete
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">{agency.userCount}</TableCell>
                    <TableCell className="text-gray-300">{agency.merchantCount}</TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-300">
                        {new Date(agency.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-zinc-700">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-zinc-700">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-600 text-red-400 hover:bg-zinc-700 hover:text-red-300">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}