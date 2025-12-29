import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Breadcrumbs from "@/components/Breadcrumbs";
import ClickableCard from "@/components/ClickableCard";
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

export default function Assignments() {
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
    <div className="p-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        items={[
          { label: "Assignments", href: "/assignments", isActive: true }
        ]} 
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Assignments</h1>
          <p className="text-muted-foreground">
            Manage agent and partner commission splits for merchants
          </p>
        </div>
        <Button className="bg-black hover:bg-gray-800 text-white flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Bulk Assignment
        </Button>
      </div>

      {/* Assignment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ClickableCard
          title="Total Merchants"
          value={assignmentData?.totalMerchants}
          description="Available for assignment"
          href="/assignments?view=all"
          icon={<Users className="h-4 w-4" />}
        />
        
        <ClickableCard
          title="Assigned Merchants"
          value={assignmentData?.assignedMerchants}
          description="With commission splits"
          href="/assignments?filter=assigned"
          icon={<UserCheck className="h-4 w-4" />}
          badge={<Badge className="bg-green-100 text-green-800">Complete</Badge>}
        />
        
        <ClickableCard
          title="Unassigned Merchants"
          value={assignmentData?.unassignedMerchants}
          description="Pending assignment"
          href="/assignments?filter=unassigned"
          icon={<AlertCircle className="h-4 w-4" />}
          badge={<Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>}
        />
        
        <ClickableCard
          title="Assigned Revenue"
          value={`$${assignmentData?.assignedRevenue?.toLocaleString()}`}
          description="Revenue with assignments"
          href="/assignments?view=revenue"
          icon={<DollarSign className="h-4 w-4" />}
        />
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
                                <Badge variant="outline">{assignment.percentage}%</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">No assignments yet</p>
                            <Button className="mt-2 bg-black hover:bg-gray-800 text-white" size="sm">
                              Create Assignment
                            </Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">
                    Select a merchant to view assignment details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Assignment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Available Agents:</span>
                <span className="font-medium">{assignmentData?.availableAgents}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Available Partners:</span>
                <span className="font-medium">{assignmentData?.availablePartners}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Assignment Rate:</span>
                <span className="font-medium">
                  {assignmentData?.totalMerchants > 0 
                    ? Math.round((assignmentData.assignedMerchants / assignmentData.totalMerchants) * 100)
                    : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}