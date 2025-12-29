import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Download, Users, CheckCircle, AlertCircle, FileText } from "lucide-react";

export default function RosterUpload() {
  const [csvData, setCsvData] = useState("");
  const [uploadResults, setUploadResults] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get organization ID from localStorage
  const organizationId = localStorage.getItem('organizationID') || 'org-86f76df1';

  // Download template mutation
  const downloadTemplate = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/roster-template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agent_roster_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Template Downloaded",
        description: "Agent roster template has been downloaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download template",
        variant: "destructive",
      });
    }
  });

  // Upload roster mutation
  const uploadRoster = useMutation({
    mutationFn: async (data: { csvData: string; organizationId: string }) => {
      return await apiRequest({
        method: "POST",
        endpoint: "/api/admin/roster-upload",
        body: data
      });
    },
    onSuccess: (data) => {
      setUploadResults(data);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: "Roster Uploaded",
        description: `Successfully created ${data.created} agent accounts.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload roster",
        variant: "destructive",
      });
    }
  });

  const handleUpload = () => {
    if (!csvData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste CSV data before uploading.",
        variant: "destructive",
      });
      return;
    }

    uploadRoster.mutate({ csvData, organizationId });
  };

  const sampleData = `Agent ID,First Name,Last Name,Email,Phone,Department,Start Date,Commission Rate
AGENT001,John,Smith,john.smith@company.com,555-0101,Sales,2024-01-15,0.05
AGENT002,Jane,Doe,jane.doe@company.com,555-0102,Sales,2024-02-01,0.055
AGENT003,Mike,Johnson,mike.johnson@company.com,555-0103,Operations,2024-01-20,0.045`;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Agent Roster Upload
        </h1>
        <p className="text-gray-600 mt-2">
          Upload your agent roster to automatically create agent accounts and set up role-based permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Roster
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate.mutate()}
                  disabled={downloadTemplate.isPending}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCsvData(sampleData)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Use Sample Data
                </Button>
              </div>
              
              <Textarea
                placeholder="Paste your CSV data here..."
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploadRoster.isPending || !csvData.trim()}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {uploadRoster.isPending ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Roster
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions & Results */}
        <div className="space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p><strong>1.</strong> Download the template CSV file</p>
                <p><strong>2.</strong> Fill in your agent information</p>
                <p><strong>3.</strong> Paste the CSV data in the text area</p>
                <p><strong>4.</strong> Click upload to create agent accounts</p>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Each agent will be assigned the "Agent" role with appropriate permissions for viewing their own reports and leads.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Upload Results */}
          {uploadResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Upload Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-green-800">Created</div>
                    <div className="text-2xl font-bold text-green-600">
                      {uploadResults.created}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-orange-800">Errors</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {uploadResults.errors?.length || 0}
                    </div>
                  </div>
                </div>

                {uploadResults.errors && uploadResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-800">Errors:</h4>
                    <div className="space-y-1">
                      {uploadResults.errors.map((error: string, index: number) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Badge className="bg-green-100 text-green-800">
                  {uploadResults.success ? 'Upload Successful' : 'Upload Failed'}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}