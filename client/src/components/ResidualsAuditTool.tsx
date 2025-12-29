import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Search, Filter, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AuditIssue {
  id: number;
  merchantId: number | null;
  month: string;
  issueType: 'split_error' | 'missing_assignment' | 'unmatched_mid';
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'resolved' | 'ignored';
  createdAt: string;
}

interface AuditResults {
  status: 'passed' | 'failed';
  issuesFound: number;
  issues: AuditIssue[];
}

interface ResidualsAuditToolProps {
  month: string;
}

export default function ResidualsAuditTool({ month }: ResidualsAuditToolProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIssueType, setSelectedIssueType] = useState<string>('all');

  // Run audit validation
  const auditMutation = useMutation({
    mutationFn: async (): Promise<AuditResults> => {
      const response = await fetch(`/api/residuals-workflow/audit/${month}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Audit validation failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.status === 'passed' ? "Audit Passed!" : "Audit Issues Found",
        description: data.status === 'passed' 
          ? "All validations passed successfully" 
          : `Found ${data.issuesFound} issues that need attention`,
        variant: data.status === 'passed' ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ['audit-results', month] });
    },
    onError: (error: Error) => {
      toast({
        title: "Audit Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Get existing audit results
  const { data: auditResults, isLoading } = useQuery({
    queryKey: ['audit-results', month],
    queryFn: async (): Promise<AuditResults | null> => {
      const response = await fetch(`/api/residuals-workflow/progress/${month}`);
      if (!response.ok) return null;
      
      const result = await response.json();
      const progress = result.progress || [];
      
      // Check if audit has been run
      const auditStatus = progress[0]?.auditStatus;
      
      if (auditStatus === 'passed' || auditStatus === 'failed') {
        // Fetch actual audit issues
        const issuesResponse = await fetch(`/api/audit-issues/${month}`);
        if (issuesResponse.ok) {
          const issues = await issuesResponse.json();
          return {
            status: auditStatus,
            issuesFound: issues.length,
            issues
          };
        }
      }
      
      return null;
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case 'split_error': return 'Percentage Split Error';
      case 'missing_assignment': return 'Missing Assignment';
      case 'unmatched_mid': return 'Unmatched MID';
      default: return type;
    }
  };

  const filteredIssues = auditResults?.issues.filter(issue => 
    selectedIssueType === 'all' || issue.issueType === selectedIssueType
  ) || [];

  if (isLoading) {
    return <div className="p-4">Loading audit information...</div>;
  }

  const auditProgress = auditResults ? 100 : 0;
  const hasIssues = auditResults && auditResults.issuesFound > 0;

  return (
    <div className="space-y-6">
      {/* Audit Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-yellow-600" />
            Data Audit & Validation - {month}
          </CardTitle>
          <CardDescription>
            Step 6: Automated validation to flag inconsistencies and errors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => auditMutation.mutate()}
                  disabled={auditMutation.isPending}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {auditMutation.isPending ? 'Running Audit...' : 'Run Full Audit'}
                </Button>
                
                {auditResults && (
                  <Badge className={auditResults.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {auditResults.status === 'passed' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {auditResults.status === 'passed' ? 'Audit Passed' : `${auditResults.issuesFound} Issues Found`}
                  </Badge>
                )}
              </div>
            </div>

            {auditResults && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${auditResults.status === 'passed' ? 'text-green-600' : 'text-red-600'}`}>
                    {auditResults.status === 'passed' ? '✓' : auditResults.issuesFound}
                  </div>
                  <div className="text-sm text-gray-600">
                    {auditResults.status === 'passed' ? 'All Checks Passed' : 'Issues Found'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {auditResults.issues.filter(i => i.issueType === 'split_error').length}
                  </div>
                  <div className="text-sm text-gray-600">Split Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {auditResults.issues.filter(i => i.issueType === 'missing_assignment').length}
                  </div>
                  <div className="text-sm text-gray-600">Missing Assignments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {auditResults.issues.filter(i => i.issueType === 'unmatched_mid').length}
                  </div>
                  <div className="text-sm text-gray-600">Unmatched MIDs</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Validation Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Validation Rules</CardTitle>
          <CardDescription>
            Automated checks performed during audit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700">✓ Percentage Validation</h4>
              <p className="text-sm text-gray-600">
                Ensures role assignments total exactly 100% for each MID
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700">✓ Assignment Coverage</h4>
              <p className="text-sm text-gray-600">
                Verifies all MIDs have complete role assignments
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700">✓ Data Consistency</h4>
              <p className="text-sm text-gray-600">
                Cross-references processor data with lead sheet entries
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700">✓ Revenue Reconciliation</h4>
              <p className="text-sm text-gray-600">
                Validates revenue amounts match across data sources
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      {hasIssues && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Audit Issues ({filteredIssues.length})
                </CardTitle>
                <CardDescription>
                  Issues that require admin attention and resolution
                </CardDescription>
              </div>
              
              <select
                value={selectedIssueType}
                onChange={(e) => setSelectedIssueType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Issues</option>
                <option value="split_error">Split Errors</option>
                <option value="missing_assignment">Missing Assignments</option>
                <option value="unmatched_mid">Unmatched MIDs</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {getIssueTypeLabel(issue.issueType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-md">
                      {issue.description}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(issue.priority || 'medium')}>
                        {(issue.priority || 'medium').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={issue.status === 'open' ? 'destructive' : 'default'}>
                        {issue.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                        <Button variant="outline" size="sm">
                          Resolve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Audit Success State */}
      {auditResults && auditResults.status === 'passed' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Step 6 Complete: Audit Passed!
            </CardTitle>
            <CardDescription className="text-green-600">
              All validations passed successfully. Data is ready for report generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-green-700">✓ All percentage splits verified (100%)</p>
                <p className="text-sm text-green-700">✓ All MIDs have complete assignments</p>
                <p className="text-sm text-green-700">✓ Data consistency validated</p>
                <p className="text-sm text-green-700">✓ Revenue reconciliation complete</p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Proceed to Step 7: Generate Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Audit Run Yet */}
      {!auditResults && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Audit Not Run</CardTitle>
            <CardDescription className="text-yellow-600">
              Click "Run Full Audit" to validate data integrity and check for issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              The audit will check for percentage split errors, missing assignments, 
              and data inconsistencies that need to be resolved before generating reports.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}