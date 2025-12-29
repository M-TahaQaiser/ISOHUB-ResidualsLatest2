import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface Report {
  id: string;
  name: string;
  status: 'needs_upload' | 'needs_audit' | 'needs_approval' | 'completed';
  amount?: number;
  processor?: string;
  date?: string;
  auditIssues?: string[];
}

interface NeedsApprovalProps {
  reports: Report[];
  authToken?: string;
  organizationID?: string;
}

const NeedsApproval: React.FC<NeedsApprovalProps> = ({ reports, authToken, organizationID }) => {
  const needsApprovalReports = reports.filter(r => r.status === 'needs_approval');

  const handleApproveAll = () => {
    console.log('Approving all reports for organization:', organizationID);
    // TODO: Implement actual approval logic
  };

  const handleEditReport = (reportId: string) => {
    console.log('Editing report:', reportId);
    // TODO: Navigate to report edit page
  };

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="bg-blue-50 border-b">
        <CardTitle className="flex items-center gap-3 text-blue-700">
          <CheckCircle className="h-6 w-6" />
          Needs Approval
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {needsApprovalReports.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {needsApprovalReports.length > 0 ? (
          <div className="space-y-3">
            {needsApprovalReports.map((report) => (
              <div key={report.id} className="p-3 bg-gray-50 rounded-md border">
                <div className="font-medium text-sm text-gray-900">{report.name}</div>
                <div className="text-xs text-gray-500 mt-1">{report.processor}</div>
                {report.amount && (
                  <div className="text-sm font-medium text-green-600 mt-1">
                    ${report.amount.toLocaleString()}
                  </div>
                )}
                <div className="mt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEditReport(report.id)}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
            <Button 
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleApproveAll}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve All
            </Button>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No approvals needed</p>
        )}
      </CardContent>
    </Card>
  );
};

export default NeedsApproval;