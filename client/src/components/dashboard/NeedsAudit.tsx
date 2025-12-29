import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Report {
  id: string;
  name: string;
  status: 'needs_upload' | 'needs_audit' | 'needs_approval' | 'completed';
  amount?: number;
  processor?: string;
  date?: string;
  auditIssues?: string[];
}

interface NeedsAuditProps {
  reports: Report[];
}

const NeedsAudit: React.FC<NeedsAuditProps> = ({ reports }) => {
  const needsAuditReports = reports.filter(r => r.status === 'needs_audit');

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="bg-orange-50 border-b">
        <CardTitle className="flex items-center gap-3 text-orange-700">
          <AlertTriangle className="h-6 w-6" />
          Needs Audit
          <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {needsAuditReports.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {needsAuditReports.length > 0 ? (
          <div className="space-y-3">
            {needsAuditReports.map((report) => (
              <div key={report.id} className="p-3 bg-gray-50 rounded-md border">
                <div className="font-medium text-sm text-gray-900">{report.name}</div>
                <div className="text-xs text-gray-500 mt-1">{report.processor}</div>
                {report.amount && (
                  <div className="text-sm font-medium text-green-600 mt-1">
                    ${report.amount.toLocaleString()}
                  </div>
                )}
                {report.auditIssues && report.auditIssues.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-red-600 font-medium">Issues found:</div>
                    <ul className="text-xs text-red-500 mt-1 space-y-1">
                      {report.auditIssues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Review Audits
            </Button>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No audits needed</p>
        )}
      </CardContent>
    </Card>
  );
};

export default NeedsAudit;