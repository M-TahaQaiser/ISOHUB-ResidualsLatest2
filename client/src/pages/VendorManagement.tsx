import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Building2, 
  Database, 
  HardDrive, 
  Settings,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Vendor {
  id: string;
  name: string;
  category: 'Processors' | 'Gateways' | 'Hardware/Equipment' | 'Internal';
  description: string;
  logoUrl?: string;
  loginUrl?: string;
  status: 'active' | 'inactive' | 'pending';
  contactEmail?: string;
  integrationNotes?: string;
  lastUpdated: string;
}

export default function VendorManagement() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Vendor>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendors data
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['/api/vendors'],
    queryFn: () => apiRequest('/api/vendors'),
  });

  // Create/Update vendor mutation
  const vendorMutation = useMutation({
    mutationFn: async (vendor: Partial<Vendor>) => {
      if (vendor.id) {
        return apiRequest(`/api/vendors/${vendor.id}`, {
          method: 'PUT',
          body: JSON.stringify(vendor),
        });
      } else {
        return apiRequest('/api/vendors', {
          method: 'POST',
          body: JSON.stringify(vendor),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      setIsEditDialogOpen(false);
      setFormData({});
      toast({
        title: "Success",
        description: selectedVendor ? "Vendor updated successfully" : "Vendor created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save vendor",
        variant: "destructive",
      });
    },
  });

  // Delete vendor mutation
  const deleteMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      return apiRequest(`/api/vendors/${vendorId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      });
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Processors': return Building2;
      case 'Gateways': return Database;
      case 'Hardware/Equipment': return HardDrive;
      case 'Internal': return Settings;
      default: return Building2;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredVendors = vendors.filter((vendor: Vendor) => {
    const matchesCategory = selectedCategory === 'all' || vendor.category === selectedCategory;
    const matchesSearch = vendor?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
                         vendor?.description?.toLowerCase()?.includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData(vendor);
    setIsEditDialogOpen(true);
  };

  const handleCreateVendor = () => {
    setSelectedVendor(null);
    setFormData({
      category: 'Processors',
      status: 'active'
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveVendor = () => {
    vendorMutation.mutate(formData);
  };

  const handleDeleteVendor = (vendorId: string) => {
    if (confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      deleteMutation.mutate(vendorId);
    }
  };

  const categories = ['all', 'Processors', 'Gateways', 'Hardware/Equipment', 'Internal'];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Vendor Management
              </h1>
              <p className="text-gray-400">
                Manage payment processors, gateways, hardware vendors, and internal systems
              </p>
            </div>
            <Button 
              onClick={handleCreateVendor}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-800 border-yellow-400/30 text-white"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 bg-zinc-800 border-yellow-400/30 text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-yellow-400/30">
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse bg-zinc-900/80 border-yellow-400/20">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                  <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-zinc-700 rounded mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-zinc-700 rounded"></div>
                    <div className="h-3 bg-zinc-700 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredVendors.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Database className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No vendors found</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first vendor"
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && (
                <Button onClick={handleCreateVendor} className="bg-yellow-400 hover:bg-yellow-500 text-black">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Vendor
                </Button>
              )}
            </div>
          ) : (
            filteredVendors.map((vendor: Vendor) => {
              const IconComponent = getCategoryIcon(vendor.category);
              return (
                <Card key={vendor.id} className="bg-zinc-900/80 border border-yellow-400/20 hover:border-yellow-400/40 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-800 rounded-lg border border-yellow-400/30">
                          {vendor.logoUrl ? (
                            <img 
                              src={vendor.logoUrl} 
                              alt={`${vendor.name} logo`}
                              className="h-8 w-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <IconComponent className={`h-5 w-5 text-yellow-400 ${vendor.logoUrl ? 'hidden' : ''}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm text-white truncate">
                            {vendor.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${getStatusColor(vendor.status)}`}>
                              {vendor.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                      {vendor.description}
                    </p>
                    
                    <div className="space-y-2 text-xs mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span className="font-medium text-white">{vendor.category}</span>
                      </div>
                      {vendor.contactEmail && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Contact:</span>
                          <span className="font-medium text-white truncate">{vendor.contactEmail}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Updated:</span>
                        <span className="font-medium text-white">{vendor.lastUpdated}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {vendor.loginUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(vendor.loginUrl, '_blank')}
                          className="flex-1 border-gray-600 text-gray-300 hover:bg-zinc-700"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Login
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditVendor(vendor)}
                        className="border-gray-600 text-gray-300 hover:bg-zinc-700"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteVendor(vendor.id)}
                        className="border-gray-600 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Edit/Create Vendor Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-yellow-400/20">
            <DialogHeader>
              <DialogTitle className="text-white">
                {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedVendor 
                  ? 'Update vendor information and settings'
                  : 'Add a new vendor to the system'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Vendor Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter vendor name"
                    className="bg-zinc-800 border-yellow-400/30 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-gray-300">Category</Label>
                  <Select 
                    value={formData.category || 'Processors'} 
                    onValueChange={(value) => setFormData({ ...formData, category: value as any })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-yellow-400/30">
                      <SelectItem value="Processors">Processors</SelectItem>
                      <SelectItem value="Gateways">Gateways</SelectItem>
                      <SelectItem value="Hardware/Equipment">Hardware/Equipment</SelectItem>
                      <SelectItem value="Internal">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the vendor"
                  className="bg-zinc-800 border-yellow-400/30 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="loginUrl" className="text-gray-300">Login URL</Label>
                  <Input
                    id="loginUrl"
                    value={formData.loginUrl || ''}
                    onChange={(e) => setFormData({ ...formData, loginUrl: e.target.value })}
                    placeholder="https://..."
                    className="bg-zinc-800 border-yellow-400/30 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="status" className="text-gray-300">Status</Label>
                  <Select 
                    value={formData.status || 'active'} 
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-yellow-400/30">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="contactEmail" className="text-gray-300">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@vendor.com"
                  className="bg-zinc-800 border-yellow-400/30 text-white"
                />
              </div>

              <div>
                <Label htmlFor="integrationNotes" className="text-gray-300">Integration Notes</Label>
                <Input
                  id="integrationNotes"
                  value={formData.integrationNotes || ''}
                  onChange={(e) => setFormData({ ...formData, integrationNotes: e.target.value })}
                  placeholder="Special integration requirements or notes"
                  className="bg-zinc-800 border-yellow-400/30 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-yellow-400/20">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-zinc-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveVendor}
                disabled={vendorMutation.isPending || !formData.name}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                {vendorMutation.isPending ? 'Saving...' : selectedVendor ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}