import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface Report {
  id: string;
  name: string;
  status: 'needs_upload' | 'needs_audit' | 'needs_approval' | 'completed';
  amount?: number;
  processor?: string;
  date?: string;
  auditIssues?: string[];
}

interface NeedsUploadProps {
  reports: Report[];
}

const NeedsUpload: React.FC<NeedsUploadProps> = ({ reports }) => {
  const [processorsThatNeedUpload, setProcessorsThatNeedUpload] = useState<Array<{processor: string, reportType: string}>>([]);

  useEffect(() => {
    const processorReports = {
      'accept.blue': 'billing report',
      'PAAY': 'billing report',
      'Clearent': 'process report',
      'Fiserv Bin & ICA': 'process report',
      'Fiserv Omaha': 'process report',
      'Global Payments TSYS': 'process report',
      'Merchant Lynx': 'process report',
      'Micamp Solutions': 'process report',
      'Payment Advisors': 'process report',
      'Shift4': 'process report',
      'First Data': 'process report',
    };

    // Gather processors from reports that have been uploaded
    const uploadedProcessors = reports
      .filter(report => report.status !== 'needs_upload')
      .map(report => report.processor)
      .filter(Boolean);

    // Remove duplicates
    const uniqueUploadedProcessors = Array.from(new Set(uploadedProcessors));

    // Check for processors that haven't uploaded reports
    const processorsThatNeedUpload = Object.keys(processorReports).filter(
      (processor) => !uniqueUploadedProcessors.includes(processor)
    );

    setProcessorsThatNeedUpload(
      processorsThatNeedUpload.map((processor) => ({
        processor,
        reportType: processorReports[processor as keyof typeof processorReports],
      }))
    );
  }, [reports]);

  const needsUploadReports = reports.filter(r => r.status === 'needs_upload');

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="bg-red-50 border-b">
        <CardTitle className="flex items-center gap-3 text-red-700">
          <Upload className="h-6 w-6" />
          Needs Upload
          <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {needsUploadReports.length + processorsThatNeedUpload.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {(needsUploadReports.length > 0 || processorsThatNeedUpload.length > 0) ? (
          <div className="space-y-3">
            {needsUploadReports.map((report) => (
              <div key={report.id} className="p-3 bg-gray-50 rounded-md border">
                <div className="font-medium text-sm text-gray-900">{report.name}</div>
                <div className="text-xs text-gray-500 mt-1">{report.processor}</div>
              </div>
            ))}
            {processorsThatNeedUpload.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-md border">
                <div className="font-medium text-sm text-gray-900">{item.processor}</div>
                <div className="text-xs text-gray-500 mt-1">{item.reportType}</div>
              </div>
            ))}
            <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white">
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No uploads needed</p>
        )}
      </CardContent>
    </Card>
  );
};

export default NeedsUpload;