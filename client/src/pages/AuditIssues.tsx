import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditIssue {
  id: number;
  merchantId: number;
  type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestedAction: string;
  status: 'open' | 'resolved' | 'investigating';
  createdAt: string;
  merchant: {
    mid: string;
    dba: string;
    legalName: string;
  };
}

export default function AuditIssues() {
  const [selectedMonth] = useState("2025-05");
  
  const { data: auditIssues, isLoading } = useQuery({
    queryKey: ["/api/audit-issues", selectedMonth],
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'investigating':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'open':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64 bg-zinc-800" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full bg-zinc-800" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-zinc-700">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Audit Issues</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Review and resolve data quality issues for {selectedMonth}
          </p>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          {auditIssues && auditIssues.length > 0 ? (
            auditIssues.map((issue: any) => (
              <Card key={issue.audit_issues.id} className="bg-zinc-900/80 rounded-lg border border-yellow-400/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(issue.audit_issues.severity)}
                      <div>
                        <CardTitle className="text-lg text-white">
                          {issue.merchants?.dba || issue.merchants?.legalName || 'Unknown Merchant'}
                        </CardTitle>
                        <p className="text-sm text-gray-400">MID: {issue.merchants?.mid || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getSeverityColor(issue.audit_issues.severity)} border`}>
                        {issue.audit_issues.severity}
                      </Badge>
                      <Badge className={`${getStatusColor(issue.audit_issues.status)} border`}>
                        {issue.audit_issues.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-white mb-1">Issue Type</h4>
                      <p className="text-sm text-gray-300">{issue.audit_issues.type}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-1">Description</h4>
                      <p className="text-sm text-gray-300">{issue.audit_issues.description}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-1">Suggested Action</h4>
                      <p className="text-sm text-gray-300">{issue.audit_issues.suggestedAction}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-yellow-400/20">
                      <p className="text-xs text-gray-500">
                        Created: {new Date(issue.audit_issues.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs border-gray-600 text-gray-300 hover:bg-zinc-700">
                          Mark as Investigating
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-zinc-900/80 rounded-lg border border-yellow-400/20">
              <CardContent className="p-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Audit Issues</h3>
                <p className="text-gray-400">
                  Great! All data quality checks are passing for {selectedMonth}.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}