import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Breadcrumbs from '@/components/Breadcrumbs';
import ClickableCard from '@/components/ClickableCard';
import AnimatedSelector from '@/components/AnimatedSelector';
import ValidationResults from '@/components/ValidationResults';
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Building2,
  Users,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface UploadSpace {
  id: string;
  name: string;
  category: 'leads' | 'processors';
  icon: any;
  description: string;
  acceptedFormats: string[];
  maxFileSize: string;
  uploadCount: number;
  lastUpload?: string;
  status: 'active' | 'maintenance' | 'inactive';
}

const uploadSpaces: UploadSpace[] = [
  // Payment Processors for Real Data Upload
  {
    id: 'payment_advisors',
    name: 'Payment Advisors',
    category: 'processors',
    icon: Building2,
    description: 'Upload merchant residual reports from Payment Advisors',
    acceptedFormats: ['CSV', 'XLSX'],
    maxFileSize: '50MB',
    uploadCount: 0,
    lastUpload: undefined,
    status: 'active'
  },
  {
    id: 'clearent',
    name: 'Clearent',
    category: 'processors',
    icon: Building2,
    description: 'Upload merchant residual reports from Clearent',
    acceptedFormats: ['CSV', 'XLS', 'XLSX'],
    maxFileSize: '25MB',
    uploadCount: 0,
    lastUpload: undefined,
    status: 'active'
  },
  {
    id: 'global_payments_tsys',
    name: 'Global Payments TSYS',
    category: 'processors',
    icon: Building2,
    description: 'Upload merchant residual reports from Global Payments TSYS',
    acceptedFormats: ['CSV', 'XLSX'],
    maxFileSize: '25MB',
    uploadCount: 0,
    lastUpload: undefined,
    status: 'active'
  },
  {
    id: 'micamp_solutions',
    name: 'Micamp Solutions',
    category: 'processors',
    icon: Building2,
    description: 'Upload merchant residual reports from Micamp Solutions',
    acceptedFormats: ['CSV', 'XLSX'],
    maxFileSize: '25MB',
    uploadCount: 0,
    lastUpload: undefined,
    status: 'active'
  },
  {
    id: 'merchant_lynx',
    name: 'Merchant Lynx',
    category: 'processors',
    icon: Building2,
    description: 'Upload merchant residual reports from Merchant Lynx',
    acceptedFormats: ['CSV', 'XLSX'],
    maxFileSize: '25MB',
    uploadCount: 0,
    lastUpload: undefined,
    status: 'active'
  },
  {
    id: 'first_data',
    name: 'First Data',
    category: 'processors',
    icon: Building2,
    description: 'Upload merchant residual reports from First Data',
    acceptedFormats: ['CSV', 'XLSX'],
    maxFileSize: '25MB',
    uploadCount: 0,
    lastUpload: undefined,
    status: 'active'
  },
  {
    id: 'shift4',
    name: 'Shift4',
    category: 'processors',
    icon: Building2,
    description: 'Upload merchant residual reports from Shift4',
    acceptedFormats: ['CSV', 'XLSX'],
    maxFileSize: '25MB',
    uploadCount: 0,
    lastUpload: undefined,
    status: 'active'
  }
];

interface UploadHistory {
  id: string;
  filename: string;
  processorSpace: string;
  uploadDate: string;
  status: 'processing' | 'completed' | 'failed';
  fileSize: string;
  recordCount?: number;
}

export default function DataUpload() {
  const [selectedUploadSpace, setSelectedUploadSpace] = useState<UploadSpace | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState("2025-04");
  const [showValidationResults, setShowValidationResults] = useState(false);
  const [validationData, setValidationData] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  // Real upload history will be fetched from database
  const { data: uploadHistory = [] } = useQuery({
    queryKey: ['/api/uploads/history'],
    queryFn: () => fetch('/api/uploads/history').then(res => res.json())
  });

  // Fetch monthly upload status for all processors
  const { data: monthlyStatus = [] } = useQuery({
    queryKey: ['/api/uploads/monthly-status', selectedMonth],
    queryFn: () => fetch(`/api/uploads/monthly-status?month=${selectedMonth}`).then(res => res.json()),
    enabled: !!selectedMonth
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  // Validation mutation
  const validateMutation = useMutation({
    mutationFn: async ({ file, processor }: { file: File, processor: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('processor', processor);

      const response = await fetch('/api/validation/validate-upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setValidationData(data);
      setShowValidationResults(true);
      setIsValidating(false);
    },
    onError: (error) => {
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsValidating(false);
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, processor, month }: { file: File, processor: string, month: string }) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('processor', processor);
      formData.append('month', month);

      const response = await fetch('/api/upload-processor', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${data.recordsProcessed} records for ${data.processor} - ${data.month}`,
      });
      setSelectedFiles([]);
      setUploadProgress(0);
      setShowValidationResults(false);
      setValidationData(null);
      queryClient.invalidateQueries({ queryKey: ['/api/uploads/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/uploads/monthly-status', selectedMonth] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
      setUploadProgress(0);
    }
  });

  const queryClient = useQueryClient();

  const handleValidateAndUpload = async () => {
    if (!selectedUploadSpace || selectedFiles.length === 0) return;

    const file = selectedFiles[0]; // One file at a time
    const processor = selectedUploadSpace.name;

    // Start validation
    setIsValidating(true);
    validateMutation.mutate({ file, processor });
  };

  const handleProceedWithUpload = () => {
    if (!selectedUploadSpace || selectedFiles.length === 0) return;

    const file = selectedFiles[0];
    const processor = selectedUploadSpace.name;

    // Show progress
    setUploadProgress(50);
    
    uploadMutation.mutate({ file, processor, month: selectedMonth });
  };

  const handleCloseValidation = () => {
    setShowValidationResults(false);
    setValidationData(null);
    setSelectedFiles([]);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'leads': return Users;
      case 'processors': return Building2;
      default: return FileText;
    }
  };

  const months = [
    { value: "2025-07", label: "July 2025" },
    { value: "2025-06", label: "June 2025" }, 
    { value: "2025-05", label: "May 2025" },
    { value: "2025-04", label: "April 2025" },
    { value: "2025-03", label: "March 2025" }
  ];

  const getProcessorUploadStatus = (processorName: string) => {
    const status = monthlyStatus.find((s: any) => s.processor === processorName);
    return status?.status || 'not_uploaded';
  };

  const getProcessorUploadData = (processorName: string) => {
    return monthlyStatus.find((s: any) => s.processor === processorName);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "Data Upload", href: "/data-upload", isActive: true }
          ]} 
        />

        <div className="mb-8">
          <Card className="bg-gradient-to-r from-yellow-400 to-yellow-500 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-black/10 rounded-lg">
                    <Upload className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-black">Data Upload Management</h1>
                    <p className="text-black/80">Upload and manage lead sheets and processor reports.</p>
                  </div>
                </div>
                <ClickableCard
                  title="Monthly Audit"
                  description="Verify uploaded data"
                  href="/monthly-audit"
                  icon={<CheckCircle className="h-5 w-5" />}
                  className="bg-white/90 border-black/20 min-w-[200px]"
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-primary focus:ring-primary">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

      <Tabs defaultValue="upload-spaces" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload-spaces">Upload Areas</TabsTrigger>
          <TabsTrigger value="upload-center">Upload Center</TabsTrigger>
          <TabsTrigger value="upload-history">Upload History</TabsTrigger>
        </TabsList>

        {/* Upload Spaces */}
        <TabsContent value="upload-spaces">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {['leads', 'processors'].map(category => (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {React.createElement(getCategoryIcon(category), { className: "h-5 w-5" })}
                  {category === 'leads' ? 'Lead Reports' : 'Processor Spreadsheets'}
                </h3>
                
                {uploadSpaces.filter(space => space.category === category).map(space => {
                  const IconComponent = space.icon;
                  const uploadStatus = getProcessorUploadStatus(space.name);
                  const uploadData = getProcessorUploadData(space.name);
                  
                  return (
                    <AnimatedSelector
                      key={space.id}
                      isSelected={selectedUploadSpace?.id === space.id}
                      onClick={() => setSelectedUploadSpace(space)}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <Card className="border-0 shadow-none">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                <IconComponent className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                              </div>
                              <div>
                                <CardTitle className="text-sm text-black dark:text-white">{space.name}</CardTitle>
                                <Badge 
                                  variant={space.status === 'active' ? 'default' : 'secondary'}
                                  className="text-xs mt-1"
                                >
                                  {space.status}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Monthly Upload Status Indicator */}
                            <div className="flex items-center gap-2">
                              {uploadStatus === 'uploaded' ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-5 w-5" />
                                  <span className="text-xs font-medium">Uploaded</span>
                                </div>
                              ) : uploadStatus === 'failed' ? (
                                <div className="flex items-center gap-1 text-red-600">
                                  <AlertCircle className="h-5 w-5" />
                                  <span className="text-xs font-medium">Failed</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-gray-400">
                                  <Clock className="h-5 w-5" />
                                  <span className="text-xs font-medium">Pending</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                            {space.description}
                          </p>
                          
                          {/* Monthly Status Details */}
                          {uploadData && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg mb-3">
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Status for {months.find(m => m.value === selectedMonth)?.label}:</span>
                                  <Badge className={uploadStatus === 'uploaded' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                    {uploadStatus}
                                  </Badge>
                                </div>
                                {uploadData.recordCount && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Records:</span>
                                    <span className="font-medium">{uploadData.recordCount.toLocaleString()}</span>
                                  </div>
                                )}
                                {uploadData.uploadDate && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Upload Date:</span>
                                    <span className="font-medium">{uploadData.uploadDate}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Max Size:</span>
                              <span className="font-medium">{space.maxFileSize}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Accepted Formats:</span>
                              <div className="flex gap-1">
                                {space.acceptedFormats.map(format => (
                                  <Badge key={format} variant="outline" className="text-xs">
                                    {format}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        
                          <div className="mt-3 pt-3 border-t">
                            <Button 
                              size="sm" 
                              className={`w-full ${uploadStatus === 'uploaded' 
                                ? 'bg-green-500 hover:bg-green-600 text-white' 
                                : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                              }`}
                              onClick={() => setSelectedUploadSpace(space)}
                            >
                              {uploadStatus === 'uploaded' ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Re-upload
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3 w-3 mr-1" />
                                  Upload
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </AnimatedSelector>
                  );
                })}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Upload Center */}
        <TabsContent value="upload-center">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">File Upload Center</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Select a processor space and upload your data files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedUploadSpace ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-3 mb-2">
                    {React.createElement(selectedUploadSpace.icon, { className: "h-5 w-5 text-yellow-600 dark:text-yellow-400" })}
                    <h3 className="font-medium text-black dark:text-white">{selectedUploadSpace.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{selectedUploadSpace.description}</p>
                  <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Formats: {selectedUploadSpace.acceptedFormats.join(', ')}</span>
                    <span>Max Size: {selectedUploadSpace.maxFileSize}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select an Upload Area</h3>
                  <p className="text-gray-600 dark:text-gray-400">Choose from the upload areas above to start uploading files</p>
                </div>
              )}

              {selectedUploadSpace && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Select Files</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      accept=".csv,.xlsx,.xls,.xml,.json,.txt,.pdf"
                      onChange={handleFileSelect}
                      className="mt-1"
                    />
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-black dark:text-white">Selected Files ({selectedFiles.length})</h4>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-black dark:text-white">{file.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleValidateAndUpload}
                      disabled={selectedFiles.length === 0 || uploadProgress > 0 || isValidating}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black"
                    >
                      {isValidating ? (
                        <>
                          <Shield className="h-4 w-4 mr-2 animate-pulse" />
                          Validating...
                        </>
                      ) : uploadMutation.isPending ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Validate & Upload
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedUploadSpace(null);
                        setSelectedFiles([]);
                        setUploadProgress(0);
                        setShowValidationResults(false);
                        setValidationData(null);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload History */}
        <TabsContent value="upload-history">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Recent Uploads</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                View and manage your recent file uploads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upload history found</p>
                    <p className="text-sm">Files you upload will appear here</p>
                  </div>
                ) : (
                  uploadHistory.map((upload: any) => (
                    <div key={upload.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        <div>
                          <h4 className="font-medium text-black dark:text-white">{upload.filename}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {upload.processorSpace} • {upload.uploadDate} • {upload.fileSize}
                          </p>
                          {upload.recordCount && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {upload.recordCount.toLocaleString()} records processed
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(upload.status)}>
                          {upload.status === 'processing' && <Clock className="h-3 w-3 mr-1" />}
                          {upload.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {upload.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {upload.status}
                        </Badge>
                        
                        {upload.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download Report
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>

        {/* Validation Results Modal */}
        {showValidationResults && validationData && (
          <ValidationResults
            validationResult={validationData.validation}
            report={validationData.report}
            preview={validationData.preview}
            processorName={selectedUploadSpace?.name || 'Unknown'}
            onClose={handleCloseValidation}
            onProceedWithUpload={handleProceedWithUpload}
          />
        )}
      </div>
    </div>
  );
}