import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, DollarSign, Users, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Assignment {
  mid: string;
  merchant_name: string;
  monthly_revenue: number;
  processor: string;
  assignment_status: 'new_unassigned' | 'previously_assigned';
  rep?: string;
  rep_percentage?: number;
  partner?: string;
  partner_percentage?: number;
  sales_manager?: string;
  sales_manager_percentage?: number;
  company?: string;
  company_percentage?: number;
  association?: string;
  association_percentage?: number;
  first_assigned_month?: string;
}

interface MasterDataResponse {
  success: boolean;
  month: string;
  newUnassigned: Assignment[];
  previouslyAssigned: Assignment[];
  summary: {
    totalMIDs: number;
    newUnassigned: number;
    previouslyAssigned: number;
  };
}

interface MasterDataQCTableProps {
  selectedMonth: string;
}

export function MasterDataQCTable({ selectedMonth }: MasterDataQCTableProps) {
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all MID assignments for QC review
  const { data, isLoading, error } = useQuery({
    queryKey: ['master-data-qc', selectedMonth],
    queryFn: async (): Promise<MasterDataResponse> => {
      const response = await fetch(`/api/residuals-workflow/role-assignment/unassigned/${selectedMonth}`);
      if (!response.ok) {
        throw new Error('Failed to fetch master data');
      }
      return response.json();
    }
  });

  // QC Approval mutation
  const approveMutation = useMutation({
    mutationFn: async (action: 'approve' | 'reject') => {
      const response = await fetch(`/api/residuals-workflow/master-data-qc/${selectedMonth}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, approvedBy: 'admin' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} master data`);
      }
      return response.json();
    },
    onSuccess: (_, action) => {
      setApprovalStatus(action === 'approve' ? 'approved' : 'rejected');
      toast({
        title: `Master Data ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `All assignments for ${selectedMonth} have been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
        variant: action === 'approve' ? 'default' : 'destructive',
      });
      queryClient.invalidateQueries({ queryKey: ['master-data-qc'] });
    },
    onError: (error) => {
      toast({
        title: "QC Action Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    return status === 'new_unassigned' ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">New</Badge>
    ) : (
      <Badge variant="outline" className="bg-green-100 text-green-800">Previously Assigned</Badge>
    );
  };

  const renderAssignmentCells = (assignment: Assignment) => {
    const roles = ['rep', 'partner', 'sales_manager', 'company', 'association'];
    return roles.map(role => {
      const user = assignment[role as keyof Assignment];
      const percentage = assignment[`${role}_percentage` as keyof Assignment];
      
      return (
        <TableCell key={role} className="text-sm">
          {user && percentage ? (
            <div>
              <div className="font-medium">{user}</div>
              <div className="text-gray-500">{percentage}%</div>
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </TableCell>
      );
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Master Data Quality Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading master data for QC review...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Master Data QC Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">Failed to load master data: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.summary.totalMIDs === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Master Data Quality Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500">No data available for {selectedMonth}</div>
            <p className="text-sm text-gray-400 mt-2">Please complete steps 1-2 first</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allAssignments = [...data.newUnassigned, ...data.previouslyAssigned];

  return (
    <div className="space-y-6">
      {/* QC Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Step 3: Master Data Quality Control
          </CardTitle>
          <CardDescription>
            Review all MID assignments for {selectedMonth} before final approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.summary.totalMIDs}</div>
              <div className="text-sm text-gray-600">Total MIDs</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.summary.previouslyAssigned}</div>
              <div className="text-sm text-gray-600">Previously Assigned</div>
            </div>
            <div className="text-2xl text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{data.summary.newUnassigned}</div>
              <div className="text-sm text-gray-600">New Assignments</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(allAssignments.reduce((sum, a) => sum + a.monthly_revenue, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
          </div>

          {/* QC Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => approveMutation.mutate('approve')}
              disabled={approveMutation.isPending || approvalStatus === 'approved'}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {approvalStatus === 'approved' ? 'Approved' : 'Approve All Assignments'}
            </Button>
            <Button
              onClick={() => approveMutation.mutate('reject')}
              disabled={approveMutation.isPending || approvalStatus === 'rejected'}
              variant="destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {approvalStatus === 'rejected' ? 'Rejected' : 'Reject & Request Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Master Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-600" />
            Complete Assignment Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MID</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Processor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rep</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Sales Mgr</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Association</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allAssignments.map((assignment) => (
                  <TableRow key={assignment.mid}>
                    <TableCell className="font-mono text-sm">{assignment.mid}</TableCell>
                    <TableCell className="font-medium">{assignment.merchant_name}</TableCell>
                    <TableCell>{formatCurrency(assignment.monthly_revenue)}</TableCell>
                    <TableCell>{assignment.processor}</TableCell>
                    <TableCell>{getStatusBadge(assignment.assignment_status)}</TableCell>
                    {renderAssignmentCells(assignment)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}