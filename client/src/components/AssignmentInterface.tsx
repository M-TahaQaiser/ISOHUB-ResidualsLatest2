import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import RoleAssignmentModal from "@/components/RoleAssignmentModal";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMerchant, setModalMerchant] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const month = selectedMonth || '2025-05';

  // Fetch merchants (with revenue) for the month
  const { data: merchantsData, isLoading: merchantsLoading } = useQuery({
    queryKey: ['/api/assignments/merchants', month],
    queryFn: () => apiRequest(`/api/assignments/merchants?month=${month}`),
    enabled: !!month
  });

  // Fetch assignments (detailed) for the month
  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['/api/assignments', month],
    queryFn: () => apiRequest(`/api/assignments?month=${month}`),
    enabled: !!month
  });

  // Fetch monthly data (to pass into modal for merchant context)
  const { data: monthlyData } = useQuery({
    queryKey: ['/api/monthly-data', month],
    queryFn: () => apiRequest(`/api/monthly-data/${month}`),
    enabled: !!month
  });

  const merchants = merchantsData || [];
  const assignments = assignmentsData || [];

  // Merge merchants with assignment summaries
  const merchantList = merchants.map((m: any) => {
    const mAssignments = assignments.filter((a: any) => a.merchantId === m.id);
    return {
      id: m.id,
      merchantId: m.mid || m.id,
      businessName: m.dba || m.legalName || m.mid || `MID ${m.mid || m.id}`,
      revenue: m.revenue || m.net || 0,
      processor: m.processor?.name || m.processor || '',
      assignments: mAssignments.map((a: any) => ({
        role: a.role?.name || '',
        name: a.role?.name || '',
        percentage: parseFloat(a.percentage || '0')
      })),
      status: mAssignments.length > 0 ? 'assigned' : 'unassigned'
    };
  });

  // Compute overview metrics used by the cards (avoid referencing undefined variables)
  const assignedMerchantIds = new Set(assignments.map((a: any) => a.merchantId));
  const totalMerchants = merchants.length;
  const assignedMerchantsCount = assignedMerchantIds.size;
  const unassignedMerchantsCount = Math.max(0, totalMerchants - assignedMerchantsCount);
  const assignedRevenue = merchants.reduce((sum: number, m: any) => {
    const mAssignments = assignments.filter((a: any) => a.merchantId === m.id);
    if (mAssignments.length === 0) return sum;
    const totalPct = mAssignments.reduce((s: number, a: any) => s + (parseFloat(a.percentage || '0') || 0), 0);
    const net = parseFloat(m.revenue || m.net || '0') || 0;
    return sum + (net * (Math.min(totalPct, 100) / 100));
  }, 0);

  const assignmentData = {
    totalMerchants,
    assignedMerchants: assignedMerchantsCount,
    unassignedMerchants: unassignedMerchantsCount,
    assignedRevenue,
    availableAgents: 0,
    availablePartners: 0
  };

  const openModalForMerchant = (merchant: any) => {
    setModalMerchant(merchant);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMerchant(null);
  };

  const onModalSaveSuccess = async () => {
    // Refresh all relevant data
    await queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/assignments/merchants'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/monthly-data', month] });
    await queryClient.invalidateQueries({ queryKey: ['/api/audit-issues', month] });
    closeModal();
  };

  return (
    <div className="space-y-6">
      {/* Assignment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-merchants">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-yellow-400" />
                <p className="text-sm font-medium text-gray-300">Total Merchants</p>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2 text-white" data-testid="value-total-merchants">{assignmentData?.totalMerchants || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Available for assignment</p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-assigned-merchants">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4 text-green-400" />
                <p className="text-sm font-medium text-gray-300">Assigned Merchants</p>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Complete</Badge>
            </div>
            <p className="text-2xl font-bold mt-2 text-white" data-testid="value-assigned-merchants">{assignmentData?.assignedMerchants || 0}</p>
            <p className="text-xs text-gray-400 mt-1">With commission splits</p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-unassigned-merchants">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <p className="text-sm font-medium text-gray-300">Unassigned Merchants</p>
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
            </div>
            <p className="text-2xl font-bold mt-2 text-white" data-testid="value-unassigned-merchants">{assignmentData?.unassignedMerchants || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Pending assignment</p>
          </CardContent>
        </Card>
        
        <Card data-testid="card-assigned-revenue">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <p className="text-sm font-medium text-gray-300">Assigned Revenue</p>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2 text-white" data-testid="value-assigned-revenue">${assignmentData?.assignedRevenue?.toLocaleString() || '0'}</p>
            <p className="text-xs text-gray-400 mt-1">Revenue with assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Merchant List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="h-5 w-5 text-yellow-400" />
                Merchant Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-yellow-400/20">
                    <TableHead className="text-gray-300">Business Name</TableHead>
                    <TableHead className="text-gray-300">Revenue</TableHead>
                    <TableHead className="text-gray-300">Processor</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchantList.map((merchant) => (
                    <TableRow 
                      key={merchant.merchantId}
                      className={selectedMerchant === merchant.merchantId ? "bg-yellow-400/10 border-yellow-400/20" : "border-yellow-400/10"}
                      data-testid={`row-merchant-${merchant.merchantId}`}
                    >
                      <TableCell>
                        <div className="font-medium text-white">{merchant.businessName}</div>
                        <div className="text-sm text-gray-400">{merchant.merchantId}</div>
                      </TableCell>
                      <TableCell className="font-medium text-white">
                        ${merchant.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-300">{merchant.processor}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={merchant.status === 'assigned' ? 'default' : 'secondary'}
                          className={merchant.status === 'assigned' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {merchant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                          onClick={() => {
                            setSelectedMerchant(merchant.merchantId);
                            openModalForMerchant(merchant);
                          }}
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
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-yellow-400" />
                Assignment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMerchant ? (
                <div className="space-y-4">
                  {(() => {
                    const merchant = merchantList.find((m: any) => m.merchantId === selectedMerchant);
                    if (!merchant) return null;
                    
                    return (
                      <>
                        <div>
                          <h4 className="font-medium text-white">{merchant.businessName}</h4>
                          <p className="text-sm text-gray-400">
                            Revenue: ${merchant.revenue.toLocaleString()}
                          </p>
                        </div>
                        
                        {merchant.assignments.length > 0 ? (
                          <div className="space-y-3">
                            <h5 className="font-medium text-sm text-gray-300">Current Assignments:</h5>
                            {merchant.assignments.map((assignment, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded border border-yellow-400/20">
                                <div>
                                  <div className="font-medium text-sm text-white">{assignment.name || assignment.role}</div>
                                  <div className="text-xs text-gray-400">{assignment.role}</div>
                                </div>
                                <Badge className="bg-yellow-400 text-black">{assignment.percentage}%</Badge>
                              </div>
                            ))}
                            <div className="pt-2">
                              <Button variant="outline" size="sm" className="w-full border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black" onClick={() => openModalForMerchant(merchant)}>
                                Edit Assignments
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <AlertCircle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-400 mb-3">No assignments yet</p>
                            <Button size="sm" className="w-full bg-yellow-400 hover:bg-yellow-500 text-black" onClick={() => openModalForMerchant(merchant)}>
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
                  <Target className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Select a merchant to view or edit assignments</p>
                </div>
              )}
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
          onClose={closeModal}
          onSuccess={onModalSaveSuccess}
        />
      )}

    </div>
  );
}
