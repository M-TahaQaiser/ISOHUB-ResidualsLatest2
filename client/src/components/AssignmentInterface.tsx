import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  UserCheck, 
  Target, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  PlusCircle
} from "lucide-react";

interface AssignmentInterfaceProps {
  selectedMonth: string | null;
  organizationId: string;
}

export default function AssignmentInterface({ selectedMonth, organizationId }: AssignmentInterfaceProps) {
  const [selectedMerchant, setSelectedMerchant] = useState<string | null>(null);

  // Fetch assignment data
  const { data: assignmentData, isLoading } = useQuery({
    queryKey: ['/api/assignments'],
    select: (data: any) => data || {
      totalMerchants: 204,
      assignedMerchants: 156,
      unassignedMerchants: 48,
      totalRevenue: 33649.43,
      assignedRevenue: 28945.12,
      availableAgents: 12,
      availablePartners: 6
    }
  });

  const assignments = [
    {
      merchantId: "MID001",
      businessName: "BLU SUSHI",
      revenue: 2013.75,
      processor: "Clearent",
      assignments: [
        { role: "Agent", name: "Cody Burnell", percentage: 60 },
        { role: "Sales Manager", name: "Christy G Milton", percentage: 25 },
        { role: "Partner", name: "C2FS Partners", percentage: 15 }
      ],
      status: "assigned"
    },
    {
      merchantId: "MID002", 
      businessName: "True Builders Inc.",
      revenue: 966.77,
      processor: "Clearent",
      assignments: [
        { role: "Agent", name: "James Carner", percentage: 70 },
        { role: "Sales Manager", name: "Mark Pierce", percentage: 30 }
      ],
      status: "assigned"
    },
    {
      merchantId: "MID003",
      businessName: "GYROTONIC",
      revenue: 975.13,
      processor: "Global Payments TSYS",
      assignments: [],
      status: "unassigned"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Assignment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-merchants">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-yellow-400" />
                <p className="text-sm font-medium">Total Merchants</p>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2" data-testid="value-total-merchants">{assignmentData?.totalMerchants || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Available for assignment</p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-assigned-merchants">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium">Assigned Merchants</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Complete</Badge>
            </div>
            <p className="text-2xl font-bold mt-2" data-testid="value-assigned-merchants">{assignmentData?.assignedMerchants || 0}</p>
            <p className="text-xs text-gray-500 mt-1">With commission splits</p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-unassigned-merchants">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm font-medium">Unassigned Merchants</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
            </div>
            <p className="text-2xl font-bold mt-2" data-testid="value-unassigned-merchants">{assignmentData?.unassignedMerchants || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Pending assignment</p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-assigned-revenue">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium">Assigned Revenue</p>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2" data-testid="value-assigned-revenue">${assignmentData?.assignedRevenue?.toLocaleString() || '0'}</p>
            <p className="text-xs text-gray-500 mt-1">Revenue with assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Merchant List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Merchant Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Processor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((merchant) => (
                    <TableRow 
                      key={merchant.merchantId}
                      className={selectedMerchant === merchant.merchantId ? "bg-yellow-50" : ""}
                      data-testid={`row-merchant-${merchant.merchantId}`}
                    >
                      <TableCell>
                        <div className="font-medium">{merchant.businessName}</div>
                        <div className="text-sm text-gray-500">{merchant.merchantId}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${merchant.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell>{merchant.processor}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={merchant.status === 'assigned' ? 'default' : 'secondary'}
                          className={merchant.status === 'assigned' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {merchant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedMerchant(merchant.merchantId)}
                          data-testid={`button-assign-${merchant.merchantId}`}
                        >
                          {merchant.status === 'assigned' ? 'Edit' : 'Assign'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Assignment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMerchant ? (
                <div className="space-y-4">
                  {(() => {
                    const merchant = assignments.find(m => m.merchantId === selectedMerchant);
                    if (!merchant) return null;
                    
                    return (
                      <>
                        <div>
                          <h4 className="font-medium">{merchant.businessName}</h4>
                          <p className="text-sm text-gray-500">
                            Revenue: ${merchant.revenue.toLocaleString()}
                          </p>
                        </div>
                        
                        {merchant.assignments.length > 0 ? (
                          <div className="space-y-3">
                            <h5 className="font-medium text-sm">Current Assignments:</h5>
                            {merchant.assignments.map((assignment, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <div className="font-medium text-sm">{assignment.name}</div>
                                  <div className="text-xs text-gray-500">{assignment.role}</div>
                                </div>
                                <Badge className="bg-yellow-400 text-black">{assignment.percentage}%</Badge>
                              </div>
                            ))}
                            <div className="pt-2">
                              <Button variant="outline" size="sm" className="w-full">
                                Edit Assignments
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <AlertCircle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-3">No assignments yet</p>
                            <Button size="sm" className="w-full bg-yellow-400 hover:bg-yellow-500 text-black">
                              <PlusCircle className="h-4 w-4 mr-1" />
                              Assign Agent
                            </Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Select a merchant to view or edit assignments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
