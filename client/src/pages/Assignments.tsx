import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import RoleAssignmentModal from "@/components/RoleAssignmentModal";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMerchant, setModalMerchant] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const month = '2025-05';

  // Fetch overview stats (fallback handled)
  const { data: assignmentData } = useQuery({
    queryKey: ['/api/assignments/overview', month],
    queryFn: () => apiRequest(`/api/assignments?month=${month}`),
    // We only want overview fields so the page can use them safely
    select: (data: any) => ({
      totalMerchants: data ? new Set(data.map((a: any) => a.merchantId)).size : 0,
      assignedMerchants: data ? new Set(data.filter((a: any) => a.percentage && parseFloat(a.percentage) > 0).map((a: any) => a.merchantId)).size : 0,
      unassignedMerchants: 0,
      totalRevenue: 0,
      assignedRevenue: 0,
      availableAgents: 0,
      availablePartners: 0,
      raw: data
    })
  });

  // Fetch merchants with revenue
  const { data: merchantsData } = useQuery({
    queryKey: ['/api/assignments/merchants', month],
    queryFn: () => apiRequest(`/api/assignments/merchants?month=${month}`)
  });

  const assignments = assignmentData?.raw || [];
  const merchants = merchantsData || [];

  // Monthly data for the month
  const { data: monthlyData } = useQuery({
    queryKey: ['/api/monthly-data', month],
    queryFn: () => apiRequest(`/api/monthly-data/${month}`)
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
                  {(merchants || []).map((m: any) => {
                    const mAssignments = assignments.filter((a: any) => a.merchantId === m.id);
                    const status = mAssignments.length > 0 ? 'assigned' : 'unassigned';
                    const display = {
                      merchantId: m.mid || m.id,
                      businessName: m.dba || m.legalName || m.mid,
                      revenue: m.revenue || m.net || 0,
                      processor: m.processor?.name || m.processor || '',
                      status,
                      id: m.id,
                      assignments: mAssignments.map((a: any) => ({ role: a.role?.name, percentage: parseFloat(a.percentage || '0') }))
                    };

                    return (
                      <TableRow key={display.merchantId} className={selectedMerchant === display.merchantId ? "bg-yellow-50" : ""}>
                        <TableCell>
                          <div className="font-medium">{display.businessName}</div>
                          <div className="text-sm text-gray-500">{display.merchantId}</div>
                        </TableCell>
                        <TableCell className="font-medium">${display.revenue.toLocaleString()}</TableCell>
                        <TableCell>{display.processor}</TableCell>
                        <TableCell>
                          <Badge variant={display.status === 'assigned' ? 'default' : 'secondary'} className={display.status === 'assigned' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {display.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedMerchant(display.merchantId);
                            setModalMerchant(display);
                            setModalOpen(true);
                          }}>{display.status === 'assigned' ? 'Edit' : 'Assign'}</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                    const displayMerchant = (merchants || []).map((m: any) => {
                      const mAssignments = assignments.filter((a: any) => a.merchantId === m.id);
                      return {
                        merchantId: m.mid || m.id,
                        id: m.id,
                        businessName: m.dba || m.legalName || m.mid,
                        revenue: m.revenue || m.net || 0,
                        assignments: mAssignments.map((a: any) => ({ name: a.role?.name || '', role: a.role?.name || '', percentage: parseFloat(a.percentage || '0') }))
                      };
                    }).find((d: any) => d.merchantId === selectedMerchant);

                    if (!displayMerchant) return null;

                    return (
                      <>
                        <div>
                          <h4 className="font-medium">{displayMerchant.businessName}</h4>
                          <p className="text-sm text-gray-500">
                            Revenue: ${displayMerchant.revenue.toLocaleString()}
                          </p>
                        </div>

                        {displayMerchant.assignments.length > 0 ? (
                          <div className="space-y-3">
                            <h5 className="font-medium text-sm">Current Assignments:</h5>
                            {displayMerchant.assignments.map((assignment: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <div className="font-medium text-sm">{assignment.name || assignment.role}</div>
                                  <div className="text-xs text-gray-500">{assignment.role}</div>
                                </div>
                                <Badge variant="outline">{assignment.percentage}%</Badge>
                              </div>
                            ))}
                            <div className="pt-2">
                              <Button className="w-full" variant="outline" size="sm" onClick={() => { setModalMerchant(displayMerchant); setModalOpen(true); }}>
                                Edit Assignment
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">No assignments yet</p>
                            <Button className="mt-2 bg-black hover:bg-gray-800 text-white" size="sm" onClick={() => { setModalMerchant(displayMerchant); setModalOpen(true); }}>
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

      {/* Role Assignment Modal */}
      {modalMerchant && (
        <RoleAssignmentModal
          merchant={{ id: modalMerchant.id, mid: modalMerchant.merchantId, dba: modalMerchant.businessName }}
          monthlyData={(monthlyData || []).find((d: any) => d.merchantId === modalMerchant.id || (d.merchant && d.merchant.id === modalMerchant.id))}
          month={month}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={async () => {
            await queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
            await queryClient.invalidateQueries({ queryKey: ['/api/assignments/merchants'] });
            await queryClient.invalidateQueries({ queryKey: ['/api/monthly-data', month] });
            setModalOpen(false);
            setModalMerchant(null);
          }}
        />
      )}

    </div>
  );
}