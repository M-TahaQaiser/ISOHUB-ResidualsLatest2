import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, ExternalLink, Edit, Trash2, Copy, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import AnimatedSelector from "@/components/AnimatedSelector";

interface Vendor {
  id: string;
  name: string;
  category: string;
  description?: string;
  logo?: string;
  loginUrl?: string;
  isActive: boolean;
}

interface VendorCategory {
  name: string;
  count: number;
  processors: Vendor[];  // API returns 'processors' field for all categories
}

export default function LoginPortal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewVendor, setViewVendor] = useState<Vendor | null>(null);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    loginUrl: "",
    logo: "",
    category: "",
    isActive: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Loading fallback
  const loadingCategories: VendorCategory[] = [
    { name: "Processors", count: 0, processors: [] },
    { name: "Gateways", count: 0, processors: [] },
    { name: "Hardware/Equipment", count: 0, processors: [] },
    { name: "Internal", count: 0, processors: [] }
  ];

  const { data: categories = loadingCategories, isLoading, error } = useQuery({
    queryKey: ['/api/login-portal/categories'],
    queryFn: async (): Promise<VendorCategory[]> => {
      console.log('Fetching login portal categories...');
      const response = await fetch('/api/login-portal/categories');
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
      const data = await response.json();
      console.log('Login portal data received:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Filter categories by search query if provided
  const filteredCategories = categories?.map(category => {
    if (searchQuery.trim()) {
      // Filter vendors within each category by search query
      const filteredVendors = category.processors.filter(vendor =>
        vendor?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
        vendor?.description?.toLowerCase()?.includes(searchQuery.toLowerCase())
      );
      return { ...category, processors: filteredVendors };
    }
    return category;
  }).filter(category => {
    // Only show categories that have vendors matching the search
    return !searchQuery.trim() || category.processors.length > 0;
  });

  // Handle vendor actions
  const handleViewVendor = (vendor: Vendor) => {
    setViewVendor(vendor);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditVendor(vendor);
    setEditForm({
      name: vendor.name,
      description: vendor.description || "",
      loginUrl: vendor.loginUrl || "",
      logo: vendor.logo || "",
      category: vendor.category,
      isActive: vendor.isActive
    });
  };

  const handleCopyUrl = (url: string, vendorName: string) => {
    if (url && url !== "#") {
      navigator.clipboard.writeText(url);
      toast({
        title: "URL Copied",
        description: `${vendorName} login URL copied to clipboard`,
      });
    }
  };

  // Update vendor mutation
  const updateVendorMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Vendor> }) => {
      return apiRequest(`/api/vendors/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data.updates),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/login-portal/categories'] });
      setEditVendor(null);
      toast({
        title: "Vendor Updated",
        description: "Vendor information has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update vendor information.",
        variant: "destructive",
      });
    }
  });

  const handleSaveEdit = () => {
    if (!editVendor) return;
    
    updateVendorMutation.mutate({
      id: editVendor.id,
      updates: {
        name: editForm.name,
        description: editForm.description,
        loginUrl: editForm.loginUrl,
        logo: editForm.logo,
        isActive: editForm.isActive
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Mobile Header */}
      <div className="md:hidden bg-zinc-900 border-b border-yellow-400/20 px-4 py-3">
        <h1 className="text-xl font-semibold text-white">Login Portal</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "Login Portal", href: "/login-portal", isActive: true }
          ]} 
        />

        {/* Header Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-yellow-400 to-yellow-500 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-black/10 rounded-lg">
                  <ExternalLink className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">Login Portal</h1>
                  <p className="text-black/80">Access all your processor, gateway, and vendor logins in one place.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search logins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-800 border-yellow-400/30 text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {filteredCategories?.map((category) => (
            <AnimatedSelector
              key={category.name}
              isSelected={selectedCategory === category.name}
              onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
              className="bg-zinc-900/80 border border-yellow-400/20"
            >
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader className="cursor-pointer hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-zinc-800 rounded">
                        <ExternalLink className="h-4 w-4 text-gray-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                        <Badge variant="secondary" className="text-xs bg-zinc-800 text-gray-300">
                          {category.count}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold border-0"
                    >
                      Add {category.name.slice(0, -1)}
                    </Button>
                  </div>
                </CardHeader>
              
              {selectedCategory === category.name && (
                <CardContent className="pt-0">
                  {category.processors && category.processors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {category.processors.map((vendor) => (
                        <Card key={vendor.id} className="bg-zinc-900/80 border border-yellow-400/20 hover:shadow-md hover:border-yellow-400/40 transition-all">
                          <CardContent className="p-4">
                            <div className="text-center">
                              <div className="w-16 h-16 mx-auto mb-3 bg-zinc-800 rounded-lg border border-yellow-400/20 flex items-center justify-center overflow-hidden">
                                {vendor.logo && vendor.logo !== "#" && !vendor.logo.includes("/images/") ? (
                                  <img 
                                    src={vendor.logo} 
                                    alt={vendor.name}
                                    className="w-12 h-12 object-contain"
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      const parent = target.parentElement!;
                                      
                                      const span = document.createElement('span');
                                      span.className = 'text-2xl font-bold text-gray-400';
                                      span.textContent = vendor.name.charAt(0);
                                      
                                      parent.removeChild(target);
                                      parent.appendChild(span);
                                    }}
                                  />
                                ) : vendor.logo && vendor.logo.includes("/images/") ? (
                                  <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                                    <span className="text-lg font-bold text-black">
                                      {vendor.name.charAt(0)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-2xl font-bold text-gray-400">
                                    {vendor.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-semibold text-white mb-1">
                                {vendor.name}
                              </h4>
                              <p className="text-xs text-gray-400 mb-3 h-8 overflow-hidden">
                                {vendor.description || `${vendor.category} services`}
                              </p>
                              <div className="flex items-center justify-center space-x-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewVendor(vendor);
                                  }}
                                  title="View Details"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditVendor(vendor);
                                  }}
                                  title="Edit Vendor"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                {vendor.loginUrl && vendor.loginUrl !== "#" && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(vendor.loginUrl, '_blank');
                                    }}
                                    title="Open Login"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyUrl(vendor.loginUrl || "", vendor.name);
                                  }}
                                  title="Copy URL"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No {category.name.toLowerCase()} configured yet.
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
            </AnimatedSelector>
          ))}
        </div>
        
        {/* View Vendor Modal */}
        <Dialog open={!!viewVendor} onOpenChange={() => setViewVendor(null)}>
          <DialogContent className="max-w-md bg-zinc-900 border border-yellow-400/20">
            <DialogHeader>
              <DialogTitle className="text-white">Vendor Details</DialogTitle>
            </DialogHeader>
            {viewVendor && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-zinc-800 rounded-lg border border-yellow-400/20 flex items-center justify-center overflow-hidden">
                    {viewVendor.logo && viewVendor.logo !== "#" && !viewVendor.logo.includes("/images/") ? (
                      <img 
                        src={viewVendor.logo} 
                        alt={viewVendor.name}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          const parent = target.parentElement!;
                          parent.innerHTML = '';
                          const span = document.createElement('span');
                          span.className = 'text-2xl font-bold text-gray-400';
                          span.textContent = viewVendor.name.charAt(0);
                          parent.appendChild(span);
                        }}
                      />
                    ) : viewVendor.logo && viewVendor.logo.includes("/images/") ? (
                      <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-black">
                          {viewVendor.name.charAt(0)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-gray-400">
                        {viewVendor.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{viewVendor.name}</h3>
                    <Badge variant="secondary" className="bg-zinc-800 text-gray-300">{viewVendor.category}</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Description</Label>
                    <p className="text-sm text-gray-400 mt-1">
                      {viewVendor.description || "No description available"}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Login URL</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input 
                        value={viewVendor.loginUrl || ""} 
                        readOnly 
                        className="text-sm bg-zinc-800 border-yellow-400/30 text-white"
                      />
                      {viewVendor.loginUrl && viewVendor.loginUrl !== "#" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                          onClick={() => window.open(viewVendor.loginUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Status</Label>
                    <p className="text-sm mt-1">
                      <Badge variant={viewVendor.isActive ? "default" : "secondary"} className={viewVendor.isActive ? "bg-yellow-400 text-black" : "bg-zinc-800 text-gray-300"}>
                        {viewVendor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button 
                    onClick={() => {
                      setViewVendor(null);
                      handleEditVendor(viewVendor);
                    }}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleCopyUrl(viewVendor.loginUrl || "", viewVendor.name)}
                    className="flex-1 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Vendor Modal */}
        <Dialog open={!!editVendor} onOpenChange={() => setEditVendor(null)}>
          <DialogContent className="max-w-md bg-zinc-900 border border-yellow-400/20">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Vendor</DialogTitle>
            </DialogHeader>
            {editVendor && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Vendor Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Enter vendor name"
                    className="bg-zinc-800 border-yellow-400/30 text-white placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-gray-300">Description</Label>
                  <Textarea
                    id="description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Enter vendor description"
                    rows={3}
                    className="bg-zinc-800 border-yellow-400/30 text-white placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="loginUrl" className="text-gray-300">Login URL</Label>
                  <Input
                    id="loginUrl"
                    value={editForm.loginUrl}
                    onChange={(e) => setEditForm({ ...editForm, loginUrl: e.target.value })}
                    placeholder="https://example.com/login"
                    className="bg-zinc-800 border-yellow-400/30 text-white placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="logo" className="text-gray-300">Logo URL</Label>
                  <Input
                    id="logo"
                    value={editForm.logo}
                    onChange={(e) => setEditForm({ ...editForm, logo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="bg-zinc-800 border-yellow-400/30 text-white placeholder:text-gray-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category" className="text-gray-300">Category</Label>
                  <Select 
                    value={editForm.category} 
                    onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-yellow-400/20">
                      <SelectItem value="Processors" className="text-white hover:bg-zinc-800 focus:bg-zinc-800">Processors</SelectItem>
                      <SelectItem value="Gateways" className="text-white hover:bg-zinc-800 focus:bg-zinc-800">Gateways</SelectItem>
                      <SelectItem value="Hardware/Equipment" className="text-white hover:bg-zinc-800 focus:bg-zinc-800">Hardware/Equipment</SelectItem>
                      <SelectItem value="Internal" className="text-white hover:bg-zinc-800 focus:bg-zinc-800">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="rounded border-yellow-400/30 bg-zinc-800 text-yellow-400 focus:ring-yellow-400"
                  />
                  <Label htmlFor="isActive" className="text-gray-300">Active</Label>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button 
                    onClick={handleSaveEdit}
                    disabled={updateVendorMutation.isPending}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                  >
                    {updateVendorMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditVendor(null)}
                    className="flex-1 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}