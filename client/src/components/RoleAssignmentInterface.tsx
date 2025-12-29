import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, DollarSign, AlertTriangle, CheckCircle, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MasterDatasetItem {
  id: number;
  mid: string;
  merchantName: string;
  totalRevenue: string;
  processor: string;
  leadSheetUsers: string | null;
  assignmentStatus: 'pending' | 'assigned' | 'validated';
}

interface RoleAssignment {
  masterDatasetId: number;
  userId: string;
  roleType: 'agent' | 'partner' | 'sales_manager' | 'company' | 'association';
  percentage: number;
}

interface RoleAssignmentInterfaceProps {
  month: string;
}

const ROLE_TYPES = [
  { value: 'agent', label: 'Agent', color: 'bg-blue-100 text-blue-800' },
  { value: 'partner', label: 'Partner', color: 'bg-green-100 text-green-800' },
  { value: 'sales_manager', label: 'Sales Manager', color: 'bg-purple-100 text-purple-800' },
  { value: 'company', label: 'Company', color: 'bg-orange-100 text-orange-800' },
  { value: 'association', label: 'Association', color: 'bg-gray-100 text-gray-800' },
];

const AVAILABLE_USERS = [
  { id: 'cody-burnell', name: 'Cody Burnell', type: 'agent' },
  { id: 'james-carner', name: 'James Carner', type: 'agent' },
  { id: 'troy-esentan', name: 'Troy Esentan', type: 'agent' },
  { id: 'christy-milton', name: 'Christy G Milton', type: 'sales_manager' },
  { id: 'mark-pierce', name: 'Mark Pierce', type: 'sales_manager' },
  { id: 'hbs-partner', name: 'HBS Partner 0827', type: 'partner' },
  { id: 'c2fs-partner', name: 'C2FS Partner 0827', type: 'partner' },
  { id: 'cocard', name: 'CoCard 0827', type: 'company' },
  { id: 'tracer-cocard', name: 'Tracer CoCard', type: 'association' },
];

export default function RoleAssignmentInterface({ month }: RoleAssignmentInterfaceProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [assignments, setAssignments] = useState<Record<number, RoleAssignment[]>>({});
  const [selectedMerchant, setSelectedMerchant] = useState<number | null>(null);

  // Get master dataset for assignment
  const { data: masterDataset, isLoading } = useQuery({
    queryKey: ['master-dataset', month],
    queryFn: async (): Promise<MasterDatasetItem[]> => {
      const response = await fetch(`/api/residuals-workflow/master-dataset/${month}`);
      if (!response.ok) throw new Error('Failed to fetch master dataset');
      const result = await response.json();
      return result.dataset || [];
    }
  });

  // Assign roles mutation
  const assignRolesMutation = useMutation({
    mutationFn: async () => {
      const flatAssignments = Object.values(assignments).flat();
      
      const response = await fetch(`/api/residuals-workflow/assign-roles/${month}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignments: flatAssignments,
          assignedBy: 'admin' // TODO: Get from current user
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Role assignment failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Role Assignment Complete",
        description: `Successfully assigned roles for ${data.assignmentsCreated} records`,
      });
      queryClient.invalidateQueries({ queryKey: ['master-dataset', month] });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const addAssignment = (merchantId: number) => {
    const newAssignment: RoleAssignment = {
      masterDatasetId: merchantId,
      userId: '',
      roleType: 'agent',
      percentage: 0
    };

    setAssignments(prev => ({
      ...prev,
      [merchantId]: [...(prev[merchantId] || []), newAssignment]
    }));
  };

  const updateAssignment = (merchantId: number, index: number, field: keyof RoleAssignment, value: any) => {
    setAssignments(prev => ({
      ...prev,
      [merchantId]: prev[merchantId].map((assignment, i) => 
        i === index ? { ...assignment, [field]: value } : assignment
      )
    }));
  };

  const removeAssignment = (merchantId: number, index: number) => {
    setAssignments(prev => ({
      ...prev,
      [merchantId]: prev[merchantId].filter((_, i) => i !== index)
    }));
  };

  const getTotalPercentage = (merchantId: number) => {
    const merchantAssignments = assignments[merchantId] || [];
    return merchantAssignments.reduce((sum, assignment) => sum + assignment.percentage, 0);
  };

  const getPercentageColor = (merchantId: number) => {
    const total = getTotalPercentage(merchantId);
    if (total === 100) return 'text-green-600';
    if (total > 100) return 'text-red-600';
    return 'text-yellow-600';
  };

  const isReadyToSubmit = () => {
    if (!masterDataset) return false;
    
    const pendingMerchants = masterDataset.filter(m => m.assignmentStatus === 'pending');
    return pendingMerchants.every(merchant => {
      const total = getTotalPercentage(merchant.id);
      return Math.abs(total - 100) < 0.01;
    });
  };

  if (isLoading) {
    return <div className="p-4">Loading master dataset...</div>;
  }

  const pendingMerchants = masterDataset?.filter(m => m.assignmentStatus === 'pending') || [];
  const assignedMerchants = masterDataset?.filter(m => m.assignmentStatus !== 'pending') || [];
  
  const overallProgress = masterDataset ? 
    Math.round((assignedMerchants.length / masterDataset.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-yellow-600" />
            Role Assignment Progress - {month}
          </CardTitle>
          <CardDescription>
            Step 4: Assign Column I users to the 5 role types (must total 100% per MID)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Assignment Progress</span>
              <span>{overallProgress}% Complete</span>
            </div>
            <Progress value={overallProgress} className="w-full" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-black">{pendingMerchants.length}</div>
                <div className="text-sm text-gray-600">Pending Assignment</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{assignedMerchants.length}</div>
                <div className="text-sm text-gray-600">Assigned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ${masterDataset?.reduce((sum, m) => sum + parseFloat(m.totalRevenue), 0).toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">5</div>
                <div className="text-sm text-gray-600">Role Types</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Types Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Available Role Types</CardTitle>
          <CardDescription>
            Assign users from Column I to these role categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ROLE_TYPES.map(role => (
              <Badge key={role.value} className={role.color}>
                {role.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Interface */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Merchant Role Assignments</CardTitle>
            <CardDescription>
              Each merchant must have role assignments totaling exactly 100%
            </CardDescription>
          </div>
          <Button 
            onClick={() => assignRolesMutation.mutate()}
            disabled={!isReadyToSubmit() || assignRolesMutation.isPending}
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            <Save className="h-4 w-4 mr-2" />
            {assignRolesMutation.isPending ? 'Saving...' : 'Save All Assignments'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingMerchants.map((merchant) => (
              <Card key={merchant.id} className="border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{merchant.merchantName}</CardTitle>
                      <CardDescription className="text-sm">
                        MID: {merchant.mid} | Revenue: ${parseFloat(merchant.totalRevenue).toLocaleString()} | {merchant.processor}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${getPercentageColor(merchant.id)}`}>
                        {getTotalPercentage(merchant.id)}%
                      </span>
                      {getTotalPercentage(merchant.id) === 100 ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Column I Users Display */}
                  {merchant.leadSheetUsers && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium">Column I Users:</Label>
                      <p className="text-sm text-gray-700">{merchant.leadSheetUsers}</p>
                    </div>
                  )}

                  {/* Role Assignments */}
                  <div className="space-y-3">
                    {(assignments[merchant.id] || []).map((assignment, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Select 
                          value={assignment.userId} 
                          onValueChange={(value) => updateAssignment(merchant.id, index, 'userId', value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select User" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_USERS.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select 
                          value={assignment.roleType} 
                          onValueChange={(value) => updateAssignment(merchant.id, index, 'roleType', value as any)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_TYPES.map(role => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={assignment.percentage}
                            onChange={(e) => updateAssignment(merchant.id, index, 'percentage', parseFloat(e.target.value) || 0)}
                            className="w-20"
                            min="0"
                            max="100"
                            step="0.01"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAssignment(merchant.id, index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      onClick={() => addAssignment(merchant.id)}
                      className="w-full"
                    >
                      Add Role Assignment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {pendingMerchants.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800">All Merchants Assigned!</h3>
                <p className="text-green-600">Ready to proceed to Step 5: Audit Validation</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Summary */}
      {assignedMerchants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Assignments</CardTitle>
            <CardDescription>
              Merchants with validated role assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>MID</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedMerchants.map((merchant) => (
                  <TableRow key={merchant.id}>
                    <TableCell className="font-medium">{merchant.merchantName}</TableCell>
                    <TableCell>{merchant.mid}</TableCell>
                    <TableCell>${parseFloat(merchant.totalRevenue).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {merchant.assignmentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}