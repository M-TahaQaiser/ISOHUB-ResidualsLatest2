import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle, Upload, AlertCircle } from "lucide-react";

interface FileUploadCardProps {
  title: string;
  type: "processor" | "lead_sheet";
  month: string;
  processorId: number | null;
  isUploaded: boolean;
  recordCount?: number;
}

export default function FileUploadCard({ 
  title, 
  type, 
  month, 
  processorId, 
  isUploaded, 
  recordCount 
}: FileUploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      if (processorId) {
        formData.append("processorId", processorId.toString());
      }

      const response = await fetch(`/api/upload/${month}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: `Processed ${data.result.matched + data.result.created + data.result.updated} records`,
      });
      // Invalidate all relevant queries for immediate UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/file-uploads", month] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data", month] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-stats", month] });
      queryClient.invalidateQueries({ queryKey: ["/api/real-data/status", month] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/residuals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/residuals-workflow/progress", month] });
      
      // Force refetch of critical queries for immediate update
      queryClient.refetchQueries({ queryKey: ["/api/real-data/status", month] });
      
      setSelectedFile(null);
      setIsUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      setIsUploading(true);
      uploadMutation.mutate(selectedFile);
    }
  };

  if (isUploaded) {
    return (
      <Card className="border-2 border-green-500/30 bg-green-500/10">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="mb-3">
              <CheckCircle className="mx-auto h-8 w-8 text-green-400" />
            </div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-xs text-green-400 mt-1">
              {recordCount ? `${recordCount} records processed` : "Processing complete"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-yellow-400/30 bg-zinc-800/50 hover:border-yellow-400/60 hover:bg-zinc-800 transition-colors">
      <CardContent className="p-4">
        <div className="text-center">
          <div className="mb-3">
            {isUploading ? (
              <div className="mx-auto text-center text-gray-400">Processing...</div>
            ) : (
              <Upload className="mx-auto h-8 w-8 text-gray-500" />
            )}
          </div>
          <h3 className="font-semibold text-white mb-2">{title}</h3>
          
          {selectedFile ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <FileText className="h-4 w-4" />
                <span className="truncate">{selectedFile.name}</span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                  className="border-gray-600 text-gray-300 hover:bg-zinc-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Click to upload CSV file</p>
              <div>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id={`file-${title.replace(/\s+/g, '-')}`}
                />
                <Label htmlFor={`file-${title.replace(/\s+/g, '-')}`}>
                  <Button size="sm" className="cursor-pointer bg-yellow-400 text-black hover:bg-yellow-500" asChild>
                    <span>Select File</span>
                  </Button>
                </Label>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
