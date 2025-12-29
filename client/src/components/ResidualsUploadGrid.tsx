import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, CheckCircle, AlertTriangle, Clock, FileText, Calendar, Building2, FolderOpen } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface UploadProgressItem {
  id: number;
  month: string;
  year: string;
  processorId: number;
  processorName: string;
  uploadStatus: 'needs_upload' | 'uploaded' | 'validated' | 'error';
  leadSheetStatus: 'needs_upload' | 'uploaded' | 'validated' | 'error';
  compilationStatus: 'pending' | 'compiled' | 'error';
  assignmentStatus: 'pending' | 'assigned' | 'validated';
  auditStatus: 'pending' | 'passed' | 'failed';
  fileName?: string;
  fileSize?: number;
  recordCount: number;
  lastUpdated: string;
}

interface ResidualsUploadGridProps {
  month: string;
}

interface Processor {
  id: number;
  name: string;
  isActive: boolean;
}

// Generate current year months dynamically
const currentYear = new Date().getFullYear();
const AVAILABLE_MONTHS = [
  { value: `${currentYear}-01`, label: `January ${currentYear}`, short: `Jan ${String(currentYear).slice(-2)}` },
  { value: `${currentYear}-02`, label: `February ${currentYear}`, short: `Feb ${String(currentYear).slice(-2)}` },
  { value: `${currentYear}-03`, label: `March ${currentYear}`, short: `Mar ${String(currentYear).slice(-2)}` },
  { value: `${currentYear}-04`, label: `April ${currentYear}`, short: `Apr ${String(currentYear).slice(-2)}` },
  { value: `${currentYear}-05`, label: `May ${currentYear}`, short: `May ${String(currentYear).slice(-2)}` },
  { value: `${currentYear}-06`, label: `June ${currentYear}`, short: `Jun ${String(currentYear).slice(-2)}` },
  { value: `${currentYear}-07`, label: `July ${currentYear}`, short: `Jul ${String(currentYear).slice(-2)}` },
  { value: `${currentYear}-08`, label: `August ${currentYear}`, short: `Aug ${String(currentYear).slice(-2)}` },
  { value: `${currentYear}-09`, label: `September ${currentYear}`, short: `Sep ${String(currentYear).slice(-2)}` },
  { value: `${currentYear}-10`, label: `October ${currentYear}`, short: `Oct ${String(currentYear).slice(-2)}` },
  { value: `${currentYear}-11`, label: `November ${currentYear}`, short: `Nov ${String(currentYear).slice(-2)}` },
  { value: `${currentYear}-12`, label: `December ${currentYear}`, short: `Dec ${String(currentYear).slice(-2)}` },
];

const QUICK_SELECT_PROCESSORS = [
  { name: 'Payment Advisors', short: 'PA', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
  { name: 'Clearent', short: 'CL', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
  { name: 'Global Payments TSYS', short: 'GP', color: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
  { name: 'Merchant Lynx', short: 'ML', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
  { name: 'Micamp Solutions', short: 'MS', color: 'bg-red-100 text-red-800 hover:bg-red-200' },
  { name: 'First Data', short: 'FD', color: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' },
  { name: 'Shift4', short: 'S4', color: 'bg-pink-100 text-pink-800 hover:bg-pink-200' },
];

export default function ResidualsUploadGrid({ month }: ResidualsUploadGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedProcessor, setSelectedProcessor] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [quickSelectMode, setQuickSelectMode] = useState(true);

  // Fetch available processors
  const { data: processorsData } = useQuery({
    queryKey: ['/api/processors'],
    queryFn: async () => {
      const response = await fetch('/api/processors');
      return response.json();
    }
  });

  const processors: Processor[] = processorsData?.processors || [
    { id: 1, name: 'Payment Advisors', isActive: true },
    { id: 2, name: 'Clearent', isActive: true },
    { id: 3, name: 'Global Payments TSYS', isActive: true },
    { id: 4, name: 'Merchant Lynx', isActive: true },
    { id: 5, name: 'Micamp Solutions', isActive: true },
    { id: 6, name: 'First Data', isActive: true },
    { id: 7, name: 'Shift4', isActive: true },
  ];

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, processor }: { file: File, processor: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('month', selectedMonth);
      formData.append('year', selectedYear);
      formData.append('processor', processor);
      
      const response = await fetch('/api/residuals-workflow/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `${uploadingFile?.name} uploaded successfully for ${selectedProcessor}`,
      });
      setUploadingFile(null);
      setSelectedProcessor('');
      setShowUploadForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/residuals-workflow/progress', selectedMonth] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Fetch real upload progress data from API
  const { data: progressResponse, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/residuals-workflow/progress', selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/residuals-workflow/progress/${selectedMonth}`);
      if (!response.ok) {
        throw new Error('Failed to fetch upload progress');
      }
      return response.json();
    }
  });

  // Use real progress data or fall back to mock data
  const progressData: UploadProgressItem[] = progressResponse?.progress || processors.map((processor, index) => ({
    id: index + 1,
    month: selectedMonth,
    year: selectedYear,
    processorId: processor.id,
    processorName: processor.name,
    uploadStatus: 'needs_upload' as const,
    leadSheetStatus: 'needs_upload' as const,
    compilationStatus: 'pending' as const,
    assignmentStatus: 'pending' as const,
    auditStatus: 'pending' as const,
    recordCount: 0,
    lastUpdated: new Date().toISOString(),
  }));

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingFile(file);
    }
  };

  const handleUpload = () => {
    if (!uploadingFile || !selectedProcessor) {
      toast({
        title: "Missing Information",
        description: "Please select both a file and processor",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate({ 
      file: uploadingFile, 
      processor: selectedProcessor 
    });
  };

  const handleQuickSelect = (processor: string, month: string) => {
    setSelectedProcessor(processor);
    setSelectedMonth(month);
    toast({
      title: "Quick Selection",
      description: `Selected ${processor} for ${AVAILABLE_MONTHS.find(m => m.value === month)?.label}`,
    });
  };

  const getCurrentMonthIndex = () => {
    return AVAILABLE_MONTHS.findIndex(m => m.value === selectedMonth);
  };

  const getRecentMonths = () => {
    const currentIndex = getCurrentMonthIndex();
    return AVAILABLE_MONTHS.slice(Math.max(0, currentIndex - 2), currentIndex + 3);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'needs_upload': return 'text-gray-700 bg-gray-100';
      case 'uploaded': return 'text-blue-700 bg-blue-100';
      case 'validated': return 'text-green-700 bg-green-100';
      case 'error': return 'text-red-700 bg-red-100';
      case 'compiled': return 'text-purple-700 bg-purple-100';
      case 'assigned': return 'text-yellow-700 bg-yellow-100';
      case 'passed': return 'text-green-700 bg-green-100';
      case 'failed': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'needs_upload': return Clock;
      case 'uploaded': return Upload;
      case 'validated': return CheckCircle;
      case 'error': return AlertTriangle;
      case 'compiled': return FileText;
      case 'assigned': return CheckCircle;
      case 'passed': return CheckCircle;
      case 'failed': return AlertTriangle;
      default: return Clock;
    }
  };

  const getStepProgress = () => {
    const total = progressData.length;
    const uploaded = progressData.filter(p => p.uploadStatus !== 'needs_upload').length;
    return Math.round((uploaded / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Upload Form - Similar to Documents Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-yellow-600" />
            Step 1-2: Upload Processor Spreadsheets & Lead Sheets
          </CardTitle>
          <CardDescription>
            Select month/year and processor, then upload spreadsheet files for validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Quick Select Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={quickSelectMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickSelectMode(true)}
                  className={quickSelectMode ? "bg-yellow-400 text-black" : ""}
                >
                  Quick Select
                </Button>
                <Button
                  variant={!quickSelectMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickSelectMode(false)}
                  className={!quickSelectMode ? "bg-yellow-400 text-black" : ""}
                >
                  Manual Select
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                {selectedProcessor && selectedMonth && (
                  <span className="font-medium">
                    {selectedProcessor} • {AVAILABLE_MONTHS.find(m => m.value === selectedMonth)?.short}
                  </span>
                )}
              </div>
            </div>

            {quickSelectMode ? (
              /* Quick Select Interface */
              <div className="space-y-4">
                {/* Recent Months Quick Select */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Recent Months</Label>
                  <div className="flex flex-wrap gap-2">
                    {getRecentMonths().map((month) => (
                      <Button
                        key={month.value}
                        variant={selectedMonth === month.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedMonth(month.value)}
                        className={selectedMonth === month.value ? "bg-yellow-400 text-black" : ""}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        {month.short}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Processor Quick Select Grid */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Select Processor</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {QUICK_SELECT_PROCESSORS.map((processor) => (
                      <Button
                        key={processor.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSelect(processor.name, selectedMonth)}
                        className={`${processor.color} transition-all duration-200 flex flex-col items-center py-3 h-auto ${
                          selectedProcessor === processor.name ? 'ring-2 ring-yellow-400 shadow-md' : ''
                        }`}
                      >
                        <Building2 className="h-4 w-4 mb-1" />
                        <span className="text-xs font-medium">{processor.short}</span>
                        <span className="text-xs opacity-75">{processor.name.split(' ')[0]}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* One-Click Combinations */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Popular Combinations</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickSelect('Clearent', '2025-05')}
                      className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                    >
                      Clearent • May 25
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickSelect('Payment Advisors', '2025-05')}
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                    >
                      Payment Advisors • May 25
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickSelect('Global Payments TSYS', '2025-05')}
                      className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                    >
                      Global Payments • May 25
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Manual Selection Interface */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="month-select" className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Month & Year
                </Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="month-select">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="processor-select" className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4" />
                  Processor
                </Label>
                <Select value={selectedProcessor} onValueChange={setSelectedProcessor}>
                  <SelectTrigger id="processor-select">
                    <SelectValue placeholder="Select processor" />
                  </SelectTrigger>
                  <SelectContent>
                    {processors.map((processor) => (
                      <SelectItem key={processor.id} value={processor.name}>
                        {processor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            )}

            {/* File Upload Section */}
            <div className="border-t pt-4">
              <Label htmlFor="file-input" className="flex items-center gap-2 mb-2">
                <Upload className="h-4 w-4" />
                File Upload
              </Label>
              <Input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
            </div>

            {/* Upload Button and Status */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {uploadingFile && selectedProcessor && (
                  <span>Ready to upload {uploadingFile.name} to {selectedProcessor} for {selectedMonth}</span>
                )}
              </div>
              <Button
                onClick={handleUpload}
                disabled={!uploadingFile || !selectedProcessor || uploadMutation.isPending}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Progress - {selectedMonth}</CardTitle>
          <CardDescription>
            Track validation status for each processor and lead sheet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">{getStepProgress()}% Complete</span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Processor Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {progressData.map((item) => {
          const StatusIcon = getStatusIcon(item.uploadStatus);
          
          return (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="truncate">{item.processorName}</span>
                  <Badge className={getStatusColor(item.uploadStatus)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {item.uploadStatus.replace('_', ' ')}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {selectedMonth} • {item.recordCount} records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Processor Spreadsheet Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Processor Sheet</span>
                    <Badge variant="outline" className={getStatusColor(item.uploadStatus)}>
                      {item.uploadStatus === 'needs_upload' ? 'Needs Upload' : 'Uploaded'}
                    </Badge>
                  </div>
                  
                  {/* Lead Sheet Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Lead Sheet</span>
                    <Badge variant="outline" className={getStatusColor(item.leadSheetStatus)}>
                      {item.leadSheetStatus === 'needs_upload' ? 'Needs Upload' : 'Uploaded'}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t">
                    {item.uploadStatus === 'needs_upload' ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        onClick={() => {
                          setSelectedProcessor(item.processorName);
                          setShowUploadForm(true);
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <FileText className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Audit
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-gray-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Needs Upload</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progressData.filter(p => p.uploadStatus === 'needs_upload').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Upload className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Uploaded</p>
                <p className="text-2xl font-bold text-blue-600">
                  {progressData.filter(p => p.uploadStatus === 'uploaded').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Validated</p>
                <p className="text-2xl font-bold text-green-600">
                  {progressData.filter(p => p.uploadStatus === 'validated').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">
                  {progressData.filter(p => p.uploadStatus === 'error').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}