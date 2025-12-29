import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Package, CheckCircle, ExternalLink } from 'lucide-react';

interface VendorSelectionStepProps {
  organizationId: string;
  organization: any;
  progress: any;
  onComplete: (data: any) => void;
  isLoading: boolean;
}

export default function VendorSelectionStep({
  organizationId,
  organization,
  progress,
  onComplete,
  isLoading,
}: VendorSelectionStepProps) {
  const [selectedVendors, setSelectedVendors] = useState<{[key: string]: number[]}>({
    'Processors': [],
    'Gateways': [],
    'Hardware/Equipment': [],
    'Internal': [],
  });

  // Fetch available vendors
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['/api/vendors'],
  });

  // Fetch current selections
  const { data: currentSelections } = useQuery({
    queryKey: ['/api/onboarding/vendors', organizationId],
  });

  // Update selections when data loads
  useEffect(() => {
    if (currentSelections?.vendors) {
      const selections: {[key: string]: number[]} = {
        'Processors': [],
        'Gateways': [],
        'Hardware/Equipment': [],
        'Internal': [],
      };
      
      currentSelections.vendors.forEach((selection: any) => {
        if (selections[selection.category]) {
          selections[selection.category].push(selection.vendorId);
        }
      });
      
      setSelectedVendors(selections);
    }
  }, [currentSelections]);

  const saveSelectionsMutation = useMutation({
    mutationFn: async (selections: {[key: string]: number[]}) => {
      const vendorSelections = Object.entries(selections).flatMap(([category, vendorIds]) =>
        vendorIds.map(vendorId => ({ vendorId, category }))
      );
      
      return await apiRequest(`/api/onboarding/vendors/${organizationId}`, {
        method: 'POST',
        body: { vendorSelections },
      });
    },
  });

  const handleVendorToggle = (category: string, vendorId: number) => {
    setSelectedVendors(prev => {
      const categorySelections = prev[category] || [];
      const isSelected = categorySelections.includes(vendorId);
      
      return {
        ...prev,
        [category]: isSelected
          ? categorySelections.filter(id => id !== vendorId)
          : [...categorySelections, vendorId],
      };
    });
  };

  const handleComplete = async () => {
    try {
      await saveSelectionsMutation.mutateAsync(selectedVendors);
      
      const vendorData = {
        selectedVendors,
        totalSelected: Object.values(selectedVendors).flat().length,
        selectionDate: new Date().toISOString(),
      };
      
      onComplete(vendorData);
    } catch (error) {
      console.error('Failed to save vendor selections:', error);
    }
  };

  if (vendorsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-gray-600">Loading vendors...</div>
      </div>
    );
  }

  const vendorsByCategory = vendors?.reduce((acc: any, vendor: any) => {
    if (!acc[vendor.category]) {
      acc[vendor.category] = [];
    }
    acc[vendor.category].push(vendor);
    return acc;
  }, {});

  const categories = [
    { key: 'Processors', name: 'Payment Processors', description: 'Core payment processing platforms' },
    { key: 'Gateways', name: 'Payment Gateways', description: 'Gateway services and APIs' },
    { key: 'Hardware/Equipment', name: 'Hardware & Equipment', description: 'Physical payment devices' },
    { key: 'Internal', name: 'Internal Tools', description: 'Management and operational tools' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Vendor Selection</CardTitle>
              <CardDescription>
                Choose your processors, gateways, and hardware partners
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="Processors" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {categories.map((category) => (
                <TabsTrigger key={category.key} value={category.key} className="text-xs">
                  {category.name}
                  {selectedVendors[category.key]?.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedVendors[category.key].length}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.key} value={category.key} className="mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vendorsByCategory?.[category.key]?.map((vendor: any) => (
                      <Card key={vendor.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                {vendor.logoUrl && (
                                  <img
                                    src={vendor.logoUrl}
                                    alt={vendor.name}
                                    className="w-8 h-8 object-contain"
                                  />
                                )}
                                <div>
                                  <h4 className="font-medium">{vendor.name}</h4>
                                  {vendor.description && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      {vendor.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {vendor.loginUrl && (
                                <a
                                  href={vendor.loginUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-xs text-blue-600 hover:underline mt-2"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Portal Access
                                </a>
                              )}
                            </div>
                            
                            <Checkbox
                              checked={selectedVendors[category.key]?.includes(vendor.id) || false}
                              onCheckedChange={() => handleVendorToggle(category.key, vendor.id)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Selection Summary */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Selection Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((category) => (
                  <div key={category.key} className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {selectedVendors[category.key]?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">{category.name}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-lg font-medium">
                  Total Selected: {Object.values(selectedVendors).flat().length} vendors
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleComplete}
              disabled={isLoading || saveSelectionsMutation.isPending}
              className="bg-black hover:bg-gray-800 text-white font-medium"
            >
              {isLoading || saveSelectionsMutation.isPending ? (
                <>
                  <span className="mr-2">Processing...</span>
                  Saving Selections...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Save Vendors & Continue
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}