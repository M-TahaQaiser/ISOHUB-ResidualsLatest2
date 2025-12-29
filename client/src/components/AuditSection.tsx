import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  HelpCircle, 
  Link as LinkIcon, 
  CheckCircle, 
  Search,
  XCircle,
  AlertTriangle
} from "lucide-react";

interface AuditSectionProps {
  month: string;
}

export default function AuditSection({ month }: AuditSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: auditIssues, isLoading } = useQuery({
    queryKey: ["/api/audit-issues", month],
  });

  const runAuditMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/audit/run/${month}`, { method: "POST" });
      if (!response.ok) throw new Error("Audit failed");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Audit completed",
        description: `Found ${data.splitErrors + data.missingAssignments + data.unmatchedMids} issues`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-issues", month] });
    },
    onError: (error: Error) => {
      toast({
        title: "Audit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resolveIssueMutation = useMutation({
    mutationFn: async (issueId: number) => {
      const response = await fetch(`/api/audit-issues/${issueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      if (!response.ok) throw new Error("Failed to resolve issue");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Issue resolved" });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-issues", month] });
    },
  });

  const getIssueIcon = (type: string) => {
    switch (type) {
      case "split_error":
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case "missing_assignment":
        return <HelpCircle className="h-6 w-6 text-yellow-500" />;
      case "unmatched_mid":
        return <LinkIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">Low</Badge>;
      default:
        return <Badge className="bg-zinc-700 text-gray-300">Unknown</Badge>;
    }
  };

  const issueStats = auditIssues?.reduce(
    (acc, item) => {
      const issueType = item?.audit_issues?.issueType || 'unknown';
      acc[issueType] = (acc[issueType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  const splitErrors = issueStats.split_error || 0;
  const missingAssignments = issueStats.missing_assignment || 0;
  const unmatchedMids = issueStats.unmatched_mid || 0;
  const validRecords = 0; // Would need to calculate from total - issues

  return (
    <Card className="mt-12 bg-zinc-900/80 border-yellow-400/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Data Audit & Validation</CardTitle>
          <Button 
            onClick={() => runAuditMutation.mutate()}
            disabled={runAuditMutation.isPending}
            className="bg-yellow-400 text-black hover:bg-yellow-500"
          >
            <Search className="mr-2 h-4 w-4" />
            {runAuditMutation.isPending ? "Running..." : "Run Full Audit"}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Audit Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-red-400 mr-3" />
              <div>
                <p className="text-lg font-semibold text-red-400">{splitErrors}</p>
                <p className="text-sm text-red-300">Split Errors</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <HelpCircle className="h-6 w-6 text-yellow-400 mr-3" />
              <div>
                <p className="text-lg font-semibold text-yellow-400">{missingAssignments}</p>
                <p className="text-sm text-yellow-300">Missing Assignments</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <LinkIcon className="h-6 w-6 text-blue-400 mr-3" />
              <div>
                <p className="text-lg font-semibold text-blue-400">{unmatchedMids}</p>
                <p className="text-sm text-blue-300">Unmatched MIDs</p>
              </div>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
              <div>
                <p className="text-lg font-semibold text-green-400">{validRecords}</p>
                <p className="text-sm text-green-300">Valid Records</p>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Issues Table */}
        {auditIssues && auditIssues.length > 0 && (
          <Card className="bg-zinc-800/50 border-yellow-400/10">
            <CardHeader>
              <CardTitle className="text-white">Issues Requiring Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-yellow-400/20">
                  <thead className="bg-zinc-800/80">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        MID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Issue Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-zinc-900/50 divide-y divide-yellow-400/10">
                    {auditIssues.map((item) => {
                      const issue = item?.audit_issues;
                      const merchant = item?.merchants;
                      return (
                        <tr key={issue?.id || Math.random()} className="hover:bg-zinc-800/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getPriorityBadge(issue?.priority || 'unknown')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white">
                            {merchant?.mid || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div className="flex items-center">
                              {getIssueIcon(issue?.issueType || 'unknown')}
                              <span className="ml-2 capitalize">
                                {issue?.issueType?.replace("_", " ") || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {issue?.description || 'No description'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                              onClick={() => resolveIssueMutation.mutate(issue?.id)}
                              disabled={resolveIssueMutation.isPending}
                            >
                              {issue?.issueType === "split_error" ? "Fix Split" : "Resolve"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {(!auditIssues || auditIssues.length === 0) && !isLoading && (
          <Card className="bg-zinc-800/50 border-yellow-400/10">
            <CardContent className="p-12 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
              <p className="text-gray-400">No audit issues found. All data appears to be valid.</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
