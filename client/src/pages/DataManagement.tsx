import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import Breadcrumbs from '@/components/Breadcrumbs';
import AssignmentInterface from '@/components/AssignmentInterface';
import { MetricCard, MetricGrid } from '@/components/dashboard/MetricCard';
import { formatCurrency, formatPercent, formatMonthLabel } from '@/lib/reportAnalytics';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Users,
  FileCheck,
  ChevronRight,
  Calendar,
  CheckCheck,
  Loader2,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  UserCheck,
  Activity,
  BarChart3,
  FileSpreadsheet,
  ClipboardCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type WorkflowStep = 'month-selection' | 'lead-sheet' | 'processors' | 'assignments' | 'audit';

type MainTab = 'workflow' | 'upload-tracking' | 'data-validation';

export default function DataManagement() {
  const [mainTab, setMainTab] = useState<MainTab>('workflow');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('month-selection');
  const [selectedProcessor, setSelectedProcessor] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [addMonthDialogOpen, setAddMonthDialogOpen] = useState(false);
  const [newMonthYear, setNewMonthYear] = useState<string>(new Date().getFullYear().toString());
  const [newMonthMonth, setNewMonthMonth] = useState<string>('01');
  const [overrideReason, setOverrideReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getAgencyId = () => {
    const stored = localStorage.getItem('selectedAgencyId') || localStorage.getItem('organizationID');
    if (stored && stored !== 'null') return stored;
    const defaultAgencyId = "1";
    localStorage.setItem('selectedAgencyId', defaultAgencyId);
    localStorage.setItem('organizationID', defaultAgencyId);
    return defaultAgencyId;
  };
  
  const organizationId = getAgencyId();

  // Generate available months dynamically - will include user-added months
  const { data: availableMonths = [], refetch: refetchMonths } = useQuery<{ value: string; label: string }[]>({
    queryKey: ['/api/available-months', organizationId],
    queryFn: async () => {
      console.log('[DataManagement] Fetching available months for organizationId:', organizationId);
      const response = await fetch(`/api/available-months?organizationId=${organizationId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error('[DataManagement] Failed to fetch available months:', response.status, response.statusText);
        // Fallback to default months if API fails
        return [
          { value: "2025-11", label: "November 2025" },
          { value: "2025-10", label: "October 2025" },
          { value: "2025-09", label: "September 2025" },
          { value: "2025-08", label: "August 2025" },
          { value: "2025-07", label: "July 2025" }
        ];
      }
      const data = await response.json();
      console.log('[DataManagement] Available months fetched:', data);
      return data;
    }
  });

  // Fallback default months in case query hasn't loaded
  const months = availableMonths.length > 0 ? availableMonths : [
    { value: "2025-11", label: "November 2025" },
    { value: "2025-10", label: "October 2025" },
    { value: "2025-09", label: "September 2025" },
    { value: "2025-08", label: "August 2025" },
    { value: "2025-07", label: "July 2025" }
  ];

  // Month names for the Add Month dialog
  const monthNames = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ];

  // Generate year options (2024 to current year + 1)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2023 + 2 }, (_, i) => ({
    value: String(2024 + i),
    label: String(2024 + i)
  }));

  // Add month mutation
  const addMonthMutation = useMutation({
    mutationFn: async ({ month, year }: { month: string; year: string }) => {
      const monthValue = `${year}-${month}`;
      console.log('[DataManagement] Adding month:', monthValue, 'for organizationId:', organizationId);
      const response = await apiRequest('/api/available-months', {
        method: 'POST',
        body: { 
          month: monthValue,
          organizationId
        }
      });
      console.log('[DataManagement] Month add response:', response);
      return response;
    },
    onSuccess: async (_, variables) => {
      const monthLabel = `${monthNames.find(m => m.value === variables.month)?.label} ${variables.year}`;
      toast({
        title: "Month Added",
        description: `${monthLabel} has been added to your available months`,
      });
      setAddMonthDialogOpen(false);
      // Invalidate and refetch the months query
      await queryClient.invalidateQueries({ queryKey: ['/api/available-months', organizationId] });
      await refetchMonths();
      console.log('[DataManagement] Months refetched after adding');
    },
    onError: (error: Error) => {
      console.error('[DataManagement] Failed to add month:', error);
      toast({
        title: "Failed to Add Month",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Fetch upload progress for the selected month
  const { data: uploadProgressData, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/residuals-workflow/progress', selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/residuals-workflow/progress/${selectedMonth}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch upload progress');
      const data = await response.json();
      return data.progress || [];
    },
    enabled: !!selectedMonth
  });

  // Fetch month approval status
  const { data: monthApprovalData = {}, isLoading: approvalLoading, error: approvalError } = useQuery<any>({
    queryKey: [`/api/month-approval/${selectedMonth}/${organizationId}`],
    enabled: !!selectedMonth && !!organizationId
  });

  // Fetch merchant lifecycle data (new/retained/lost)
  const { data: lifecycleData, isLoading: lifecycleLoading, error: lifecycleError } = useQuery<any>({
    queryKey: [`/api/month-approval/${selectedMonth}/${organizationId}/merchant-lifecycle`],
    enabled: !!selectedMonth && !!organizationId
  });

  // Fetch monthly analytics metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery<{
    totalRevenue: number;
    totalAccounts: number;
    retentionRate: number;
    attritionRate: number;
    newAccounts: number;
    lostAccounts: number;
    retainedAccounts: number;
    momRevenueChangePercent: number | null;
    netAccountGrowth: number;
  }>({
    queryKey: ['/api/analytics/metrics', selectedMonth, organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/metrics/${selectedMonth}?organizationId=${organizationId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const fallback = {
          totalRevenue: 0,
          totalAccounts: 0,
          retentionRate: 0,
          attritionRate: 0,
          newAccounts: 0,
          lostAccounts: 0,
          retainedAccounts: 0,
          momRevenueChangePercent: null,
          netAccountGrowth: 0
        };
        return fallback;
      }
      const data = await response.json();
      return data.metrics || data;
    },
    enabled: !!selectedMonth
  });

  // Handle errors via useEffect to avoid render loops
  useEffect(() => {
    if (approvalError) {
      toast({
        title: "Approval Data Error",
        description: (approvalError as Error).message,
        variant: "destructive"
      });
    }
  }, [approvalError, toast]);

  useEffect(() => {
    if (lifecycleError) {
      toast({
        title: "Lifecycle Data Error",
        description: (lifecycleError as Error).message,
        variant: "destructive"
      });
    }
  }, [lifecycleError, toast]);

  // Build processor list
  const processors = uploadProgressData
    ?.filter((p: any) => p.processorId)
    ?.map((p: any) => ({
      id: p.processorId,
      name: p.processorName || `Processor ${p.processorId}`,
      uploadStatus: p.uploadStatus || 'needs_upload',
      recordCount: p.recordCount || 0,
      lastUpdated: p.lastUpdated
    })) || [];

  // Check if lead sheet is uploaded by checking if any processor has validated lead sheet status
  const hasValidatedLeadSheet = uploadProgressData?.some((p: any) => p.leadSheetStatus === 'validated') || false;
  const leadSheetStatus = hasValidatedLeadSheet ? 'validated' : 'needs_upload';

  // Calculate step completions (guard against loading state)
  const leadSheetComplete = progressLoading ? false : hasValidatedLeadSheet;
  const processorsComplete = progressLoading ? false : (processors.length > 0 && processors.every((p: any) => p.uploadStatus === 'validated'));
  const assignmentsComplete = approvalLoading ? false : (monthApprovalData?.assignmentsComplete || false);
  const auditComplete = approvalLoading ? false : (monthApprovalData?.auditComplete || false);

  // All steps must be green for month approval
  const allStepsComplete = leadSheetComplete && processorsComplete && assignmentsComplete && auditComplete;

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, processor, month }: { file: File, processor: string, month: string }) => {
      const formData = new FormData();
      formData.append('file', file);

      const processorId = processors.find((p: any) => p.name === processor)?.id;
      const endpoint = processor === 'Lead Sheet' 
        ? `/api/residuals-workflow/upload-lead-sheet/${month}`
        : `/api/residuals-workflow/upload/${month}/${processorId}`;

      // Get CSRF token from cookie
      const getCsrfToken = () => {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'csrf-token') {
            return decodeURIComponent(value);
          }
        }
        return null;
      };

      const csrfToken = getCsrfToken();
      const headers: HeadersInit = {};
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      const recordCount = data.stats?.monthlyDataCreated || data.results?.recordCount || 0;
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${recordCount} records`,
      });
      setSelectedFile(null);
      setUploadDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/residuals-workflow/progress', selectedMonth] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateMonthApprovalMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      return await apiRequest('/api/month-approval', {
        method: 'POST',
        body: JSON.stringify({
          month: selectedMonth,
          agencyId: parseInt(organizationId),
          ...updates
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Month Approved",
        description: "Month approval has been updated successfully",
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/month-approval/${selectedMonth}/${organizationId}`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/residuals-workflow/progress', selectedMonth] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleUploadClick = (processorName: string) => {
    setSelectedProcessor(processorName);
    setUploadDialogOpen(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = () => {
    if (!selectedFile || !selectedProcessor || !selectedMonth) return;
    uploadMutation.mutate({ file: selectedFile, processor: selectedProcessor, month: selectedMonth });
  };

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setCurrentStep('lead-sheet');
  };

  // Compact horizontal status tile component
  const StatusTile = ({ 
    title, 
    icon: Icon, 
    isComplete, 
    onClick,
    badge,
    testId
  }: { 
    title: string; 
    icon: any; 
    isComplete: boolean; 
    onClick: () => void;
    badge?: string;
    testId?: string;
  }) => (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`
        flex flex-col items-center justify-center p-4 rounded-lg border-2 
        transition-all hover:shadow-lg min-w-[180px]
        ${isComplete 
          ? 'border-green-500 bg-green-500/10 hover:bg-green-500/20 hover:shadow-green-500/20' 
          : 'border-red-500/60 bg-red-500/10 hover:bg-red-500/20 hover:shadow-red-500/20'
        }
      `}
    >
      <div className={`
        flex items-center justify-center w-10 h-10 rounded-full mb-2
        ${isComplete ? 'bg-green-500' : 'bg-red-500'}
      `}>
        {isComplete ? (
          <CheckCircle2 className="h-5 w-5 text-white" />
        ) : (
          <XCircle className="h-5 w-5 text-white" />
        )}
      </div>
      <h3 className="text-sm font-semibold text-white text-center mb-1">{title}</h3>
      {badge && (
        <Badge variant="outline" className="text-xs text-gray-300 border-gray-600">{badge}</Badge>
      )}
    </button>
  );

  // Handler for Add Month
  const handleAddMonth = () => {
    addMonthMutation.mutate({ month: newMonthMonth, year: newMonthYear });
  };

  // Tab Navigation Component (reusable across views)
  const TabNavigation = () => (
    <div className="inline-flex bg-zinc-900/80 border border-zinc-800 rounded-lg p-1">
      <div className="flex gap-1">
        <Button
          variant={mainTab === 'workflow' ? 'default' : 'ghost'}
          className={mainTab === 'workflow' 
            ? 'bg-yellow-400 text-black hover:bg-yellow-500' 
            : 'text-gray-400 hover:text-white hover:bg-zinc-800'}
          onClick={() => setMainTab('workflow')}
          data-testid="tab-workflow"
        >
          <Upload className="h-4 w-4 mr-2" />
          Residuals Workflow
        </Button>
        <Button
          variant={mainTab === 'upload-tracking' ? 'default' : 'ghost'}
          className={mainTab === 'upload-tracking' 
            ? 'bg-yellow-400 text-black hover:bg-yellow-500' 
            : 'text-gray-400 hover:text-white hover:bg-zinc-800'}
          onClick={() => setMainTab('upload-tracking')}
          data-testid="tab-upload-tracking"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Upload Tracking
        </Button>
        <Button
          variant={mainTab === 'data-validation' ? 'default' : 'ghost'}
          className={mainTab === 'data-validation' 
            ? 'bg-yellow-400 text-black hover:bg-yellow-500' 
            : 'text-gray-400 hover:text-white hover:bg-zinc-800'}
          onClick={() => setMainTab('data-validation')}
          data-testid="tab-data-validation"
        >
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Data Validation
        </Button>
      </div>
    </div>
  );

  // Upload Tracking Content Component
  const UploadTrackingContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Upload Tracking</h2>
          <p className="text-gray-400 mt-1">Monitor and track all data uploads across processors</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search uploads..."
              className="pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              data-testid="input-search-uploads"
            />
          </div>
        </div>
      </div>

      {/* Upload Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-white">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-white">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Failed</p>
                <p className="text-2xl font-bold text-white">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Records</p>
                <p className="text-2xl font-bold text-white">4,532</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload History Table */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader className="border-b border-zinc-800">
          <CardTitle className="text-white text-lg">Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Date</TableHead>
                <TableHead className="text-gray-400">Processor</TableHead>
                <TableHead className="text-gray-400">Month</TableHead>
                <TableHead className="text-gray-400">Records</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Uploaded By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-zinc-800">
                <TableCell className="text-gray-300">Nov 15, 2025</TableCell>
                <TableCell className="text-white font-medium">Clearent</TableCell>
                <TableCell className="text-gray-300">October 2025</TableCell>
                <TableCell className="text-gray-300">1,245</TableCell>
                <TableCell><Badge className="bg-green-500/20 text-green-400 border-green-500/30">Validated</Badge></TableCell>
                <TableCell className="text-gray-300">Admin</TableCell>
              </TableRow>
              <TableRow className="border-zinc-800">
                <TableCell className="text-gray-300">Nov 14, 2025</TableCell>
                <TableCell className="text-white font-medium">TSYS</TableCell>
                <TableCell className="text-gray-300">October 2025</TableCell>
                <TableCell className="text-gray-300">892</TableCell>
                <TableCell><Badge className="bg-green-500/20 text-green-400 border-green-500/30">Validated</Badge></TableCell>
                <TableCell className="text-gray-300">Admin</TableCell>
              </TableRow>
              <TableRow className="border-zinc-800">
                <TableCell className="text-gray-300">Nov 13, 2025</TableCell>
                <TableCell className="text-white font-medium">Shift4</TableCell>
                <TableCell className="text-gray-300">October 2025</TableCell>
                <TableCell className="text-gray-300">567</TableCell>
                <TableCell><Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Processing</Badge></TableCell>
                <TableCell className="text-gray-300">Admin</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // Data Validation Content Component
  const DataValidationContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Data Validation</h2>
          <p className="text-gray-400 mt-1">Review and resolve data quality issues</p>
        </div>
        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black" data-testid="button-run-validation">
          <ClipboardCheck className="h-4 w-4 mr-2" />
          Run Validation
        </Button>
      </div>

      {/* Validation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Valid Records</p>
                <p className="text-2xl font-bold text-white">4,412</p>
                <p className="text-xs text-green-400">97.4%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Warnings</p>
                <p className="text-2xl font-bold text-white">89</p>
                <p className="text-xs text-yellow-400">2.0%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Errors</p>
                <p className="text-2xl font-bold text-white">31</p>
                <p className="text-xs text-red-400">0.7%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Issues Table */}
      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardHeader className="border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">Validation Issues</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="border-yellow-400/30 text-yellow-400 cursor-pointer hover:bg-yellow-400/10">Warnings (89)</Badge>
              <Badge variant="outline" className="border-red-400/30 text-red-400 cursor-pointer hover:bg-red-400/10">Errors (31)</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Severity</TableHead>
                <TableHead className="text-gray-400">Issue Type</TableHead>
                <TableHead className="text-gray-400">Description</TableHead>
                <TableHead className="text-gray-400">Affected Records</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-zinc-800">
                <TableCell><Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge></TableCell>
                <TableCell className="text-white font-medium">Missing MID</TableCell>
                <TableCell className="text-gray-300">Merchant ID is required but not provided</TableCell>
                <TableCell className="text-gray-300">15</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" className="border-zinc-700 text-gray-300 hover:text-white hover:border-yellow-400">
                    Review
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow className="border-zinc-800">
                <TableCell><Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge></TableCell>
                <TableCell className="text-white font-medium">Invalid Amount</TableCell>
                <TableCell className="text-gray-300">Revenue amount contains invalid characters</TableCell>
                <TableCell className="text-gray-300">16</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" className="border-zinc-700 text-gray-300 hover:text-white hover:border-yellow-400">
                    Review
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow className="border-zinc-800">
                <TableCell><Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge></TableCell>
                <TableCell className="text-white font-medium">Duplicate Entry</TableCell>
                <TableCell className="text-gray-300">Potential duplicate merchant records detected</TableCell>
                <TableCell className="text-gray-300">45</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" className="border-zinc-700 text-gray-300 hover:text-white hover:border-yellow-400">
                    Review
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow className="border-zinc-800">
                <TableCell><Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge></TableCell>
                <TableCell className="text-white font-medium">MID Mismatch</TableCell>
                <TableCell className="text-gray-300">MID does not match existing merchant record</TableCell>
                <TableCell className="text-gray-300">44</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" className="border-zinc-700 text-gray-300 hover:text-white hover:border-yellow-400">
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // Upload Tracking Tab View
  if (mainTab === 'upload-tracking') {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <Breadcrumbs items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Data Management", href: "/data-management" },
            { label: "Upload Tracking", href: "#", isActive: true }
          ]} />
          <TabNavigation />
          <UploadTrackingContent />
        </div>
      </div>
    );
  }

  // Data Validation Tab View
  if (mainTab === 'data-validation') {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <Breadcrumbs items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Data Management", href: "/data-management" },
            { label: "Data Validation", href: "#", isActive: true }
          ]} />
          <TabNavigation />
          <DataValidationContent />
        </div>
      </div>
    );
  }

  // Month Selection View (workflow tab)
  if (!selectedMonth || currentStep === 'month-selection') {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <Breadcrumbs items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Data Management", href: "/data-management" }
          ]} />

          {/* Top Navigation Tabs */}
          <TabNavigation />

          <div className="max-w-2xl mx-auto mt-8">
            <div className="text-center mb-8">
              <Calendar className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">Select Working Month</h1>
              <p className="text-gray-400">Choose the month to manage data uploads, assignments, and approvals</p>
            </div>

            <Card className="bg-zinc-900/80 border-yellow-400/20">
              <CardHeader className="border-b border-yellow-400/10 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">Available Months</CardTitle>
                  <Button 
                    onClick={() => setAddMonthDialogOpen(true)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                    data-testid="button-add-month"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Month
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {months.map((month) => (
                    <Button
                      key={month.value}
                      variant="outline"
                      className="w-full h-14 text-lg justify-between border-yellow-400/30 text-gray-200 hover:border-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-400"
                      onClick={() => handleMonthSelect(month.value)}
                      data-testid={`button-select-month-${month.value}`}
                    >
                      <span>{month.label}</span>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Month Dialog */}
          <Dialog open={addMonthDialogOpen} onOpenChange={setAddMonthDialogOpen}>
            <DialogContent className="bg-zinc-900 border-yellow-400/20">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Month</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Select the month and year you want to add data for. This will create a new period for residuals tracking.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Month</Label>
                    <Select value={newMonthMonth} onValueChange={setNewMonthMonth}>
                      <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-yellow-400/30">
                        {monthNames.map((m) => (
                          <SelectItem 
                            key={m.value} 
                            value={m.value}
                            className="text-gray-200 focus:bg-yellow-400/20 focus:text-yellow-400"
                          >
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300">Year</Label>
                    <Select value={newMonthYear} onValueChange={setNewMonthYear}>
                      <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-yellow-400/30">
                        {yearOptions.map((y) => (
                          <SelectItem 
                            key={y.value} 
                            value={y.value}
                            className="text-gray-200 focus:bg-yellow-400/20 focus:text-yellow-400"
                          >
                            {y.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-zinc-800/50 border border-yellow-400/20 rounded-lg p-4">
                  <p className="text-sm text-gray-400">
                    <strong className="text-yellow-400">Note:</strong> Adding a month creates a new period for your organization. 
                    Data uploaded to this month will be isolated to your organization and will aggregate with other months for reporting.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setAddMonthDialogOpen(false)}
                  className="border-gray-600 text-gray-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddMonth}
                  disabled={addMonthMutation.isPending}
                  className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
                  data-testid="button-confirm-add-month"
                >
                  {addMonthMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Month
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Main 4-Step Workflow View
  const uploadedProcessors = processors.filter((p: any) => p.uploadStatus === 'validated').length;
  const totalProcessors = processors.length;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Breadcrumbs items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Data Management", href: "/data-management" },
          { label: months.find(m => m.value === selectedMonth)?.label || selectedMonth || 'Workflow', href: "#", isActive: true }
        ]} />

        {/* Top Navigation Tabs */}
        <TabNavigation />

        {/* Month Header with Change Button */}
        <div className="bg-zinc-900/80 border border-yellow-400/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Data Management Workflow</h1>
              <p className="text-sm text-gray-400 mt-1">
                {months.find(m => m.value === selectedMonth)?.label}
              </p>
            </div>
            <Button 
              variant="outline" 
              className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black"
              onClick={() => { setSelectedMonth(null); setCurrentStep('month-selection'); }}
              data-testid="button-change-month"
            >
              Change Month
            </Button>
          </div>
        </div>

        {/* 4-Step Status Tiles - Horizontal Row */}
        {progressLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
              <p className="text-sm text-gray-400">Loading workflow status...</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2">
            <StatusTile
              title="1. Lead Sheet"
              icon={FileText}
              isComplete={leadSheetComplete}
              onClick={() => setCurrentStep('lead-sheet')}
              badge={leadSheetComplete ? "1/1" : "0/1"}
              testId="tile-lead-sheet"
            />
            
            <ChevronRight className="h-6 w-6 text-yellow-400/50 flex-shrink-0" />

            <StatusTile
              title="2. Processors"
              icon={Upload}
              isComplete={processorsComplete}
              onClick={() => setCurrentStep('processors')}
              badge={`${uploadedProcessors}/${totalProcessors}`}
              testId="tile-processors"
            />
            
            <ChevronRight className="h-6 w-6 text-yellow-400/50 flex-shrink-0" />

            <StatusTile
              title="3. Assignments"
              icon={Users}
              isComplete={assignmentsComplete}
              onClick={() => setCurrentStep('assignments')}
              testId="tile-assignments"
            />
            
            <ChevronRight className="h-6 w-6 text-yellow-400/50 flex-shrink-0" />

            <StatusTile
              title="4. Audit"
              icon={FileCheck}
              isComplete={auditComplete}
              onClick={() => setCurrentStep('audit')}
              testId="tile-audit"
            />
          </div>
        )}

        {/* Month Approval Section */}
        <Card className={`border-2 ${allStepsComplete ? 'border-green-500 bg-green-500/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              {allStepsComplete ? (
                <CheckCheck className="h-6 w-6 text-green-400" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-400" />
              )}
              <span>Month Approval Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allStepsComplete ? (
              <div className="space-y-4">
                <p className="text-green-300">
                  All workflow steps are complete! This month is ready for approval.
                </p>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setApprovalDialogOpen(true)}
                  data-testid="button-approve-month"
                >
                  Approve Month
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-yellow-300">
                  Complete all 4 steps before approving this month. Admins can override if needed.
                </p>
                <Button 
                  variant="outline"
                  className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                  onClick={() => setApprovalDialogOpen(true)}
                  data-testid="button-override-approval"
                >
                  Admin Override
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Analytics Dashboard */}
        <Card className="bg-zinc-900/80 border-yellow-400/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <BarChart3 className="h-5 w-5 text-yellow-400" />
              <span>Monthly Analytics</span>
              <span className="text-sm font-normal text-gray-400 ml-2">
                {months.find(m => m.value === selectedMonth)?.label}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-yellow-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Loading metrics...</p>
                </div>
              </div>
            ) : (
              <MetricGrid>
                <MetricCard
                  title="Total Revenue"
                  value={formatCurrency(metricsData?.totalRevenue || 0)}
                  change={metricsData?.momRevenueChangePercent ?? undefined}
                  changeLabel="vs last month"
                  icon={<DollarSign className="h-5 w-5" />}
                  variant="revenue"
                />
                <MetricCard
                  title="Active Accounts"
                  value={(metricsData?.totalAccounts || 0).toLocaleString()}
                  subtitle="Net Change"
                  subtitleValue={`${metricsData?.netAccountGrowth && metricsData.netAccountGrowth > 0 ? '+' : ''}${metricsData?.netAccountGrowth || 0}`}
                  icon={<Users className="h-5 w-5" />}
                  variant="accounts"
                />
                <MetricCard
                  title="Retention Rate"
                  value={formatPercent(metricsData?.retentionRate || 0)}
                  icon={<UserCheck className="h-5 w-5" />}
                  variant="retention"
                />
                <MetricCard
                  title="Attrition Rate"
                  value={formatPercent(metricsData?.attritionRate || 0)}
                  icon={<Activity className="h-5 w-5" />}
                  variant="attrition"
                />
              </MetricGrid>
            )}
            
            {/* Account Flow Summary */}
            {!metricsLoading && metricsData && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-zinc-800/50 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-sm text-gray-400">New Accounts</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400" data-testid="text-new-accounts">
                    +{(metricsData.newAccounts || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-zinc-800/50 border border-yellow-400/30 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <UserCheck className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="text-sm text-gray-400">Retained</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400" data-testid="text-retained-accounts">
                    {(metricsData.retainedAccounts || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-zinc-800/50 border border-red-500/30 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingDown className="h-5 w-5 text-red-400 mr-2" />
                    <span className="text-sm text-gray-400">Lost Accounts</span>
                  </div>
                  <p className="text-2xl font-bold text-red-400" data-testid="text-lost-accounts">
                    -{(metricsData.lostAccounts || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step Detail Views */}
        {currentStep === 'lead-sheet' && (
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader>
              <CardTitle className="text-white">Lead Sheet Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-yellow-400/20 rounded bg-zinc-800/50">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-yellow-400" />
                    <div>
                      <p className="font-medium text-white">Master Lead Sheet</p>
                      <p className="text-sm text-gray-400">
                        {leadSheetComplete 
                          ? 'Uploaded successfully' 
                          : 'Not uploaded'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleUploadClick('Lead Sheet')}
                    className={leadSheetComplete ? "border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black" : "bg-yellow-400 text-black hover:bg-yellow-500"}
                    variant={leadSheetComplete ? "outline" : "default"}
                    data-testid="button-upload-lead-sheet"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {leadSheetComplete ? 'Re-upload' : 'Upload'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'processors' && (
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader>
              <CardTitle className="text-white">Processor Reports ({uploadedProcessors}/{totalProcessors})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-yellow-400/20">
                    <TableHead className="text-gray-300">Processor</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Records</TableHead>
                    <TableHead className="text-right text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processors.map((processor: any) => {
                    const isComplete = processor.uploadStatus === 'validated';
                    return (
                      <TableRow key={processor.id} data-testid={`row-processor-${processor.id}`} className="border-yellow-400/10">
                        <TableCell className="font-medium text-white">{processor.name}</TableCell>
                        <TableCell>
                          {isComplete ? (
                            <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10">
                              <XCircle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">{processor.recordCount?.toLocaleString() || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm"
                            onClick={() => handleUploadClick(processor.name)}
                            className={isComplete ? "border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black" : "bg-yellow-400 text-black hover:bg-yellow-500"}
                            variant={isComplete ? "outline" : "default"}
                            data-testid={`button-upload-${processor.id}`}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {isComplete ? 'Re-upload' : 'Upload'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {currentStep === 'assignments' && (
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-yellow-400" />
                  Agent Assignments
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                  onClick={() => {
                    updateMonthApprovalMutation.mutate({ assignmentsComplete: true });
                  }}
                  data-testid="button-mark-assignments-complete"
                >
                  Mark Complete
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AssignmentInterface selectedMonth={selectedMonth} organizationId={organizationId} />
            </CardContent>
          </Card>
        )}

        {currentStep === 'audit' && (
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader>
              <CardTitle className="text-white">Audit & Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileCheck className="h-16 w-16 text-yellow-400/50 mx-auto mb-4" />
                <p className="text-gray-300 mb-4">Audit validation interface will be integrated here</p>
                <p className="text-sm text-gray-500">Review and validate all data before month approval</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Merchant Lifecycle Tables */}
        {selectedMonth && lifecycleLoading && (
          <Card className="mt-6 bg-zinc-900/80 border-yellow-400/20">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-400 mr-3" />
              <p className="text-gray-300">Calculating merchant lifecycle data...</p>
            </CardContent>
          </Card>
        )}

        {selectedMonth && lifecycleData && !lifecycleLoading && (
          <div className="space-y-6 mt-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-500/10 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-400">New Merchants</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-300" data-testid="count-new-merchants">
                    {lifecycleData.counts?.new || 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-blue-400">Retained Merchants</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-300" data-testid="count-retained-merchants">
                    {lifecycleData.counts?.retained || 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-red-500/10 border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-red-400">Lost Merchants</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-300" data-testid="count-lost-merchants">
                    {lifecycleData.counts?.lost || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* New Merchants Table */}
            {lifecycleData.newMerchants && lifecycleData.newMerchants.length > 0 && (
              <Card className="bg-zinc-900/80 border-yellow-400/20">
                <CardHeader>
                  <CardTitle className="text-green-400">New Merchants ({lifecycleData.newMerchants.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-yellow-400/20">
                        <TableHead className="text-gray-300">MID</TableHead>
                        <TableHead className="text-gray-300">DBA</TableHead>
                        <TableHead className="text-gray-300">Legal Name</TableHead>
                        <TableHead className="text-gray-300">Processor</TableHead>
                        <TableHead className="text-right text-gray-300">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lifecycleData.newMerchants.map((merchant: any) => (
                        <TableRow key={merchant.merchantId} data-testid={`row-new-merchant-${merchant.merchantId}`} className="border-yellow-400/10">
                          <TableCell className="font-medium text-white">{merchant.mid}</TableCell>
                          <TableCell className="text-gray-300">{merchant.dba || '—'}</TableCell>
                          <TableCell className="text-gray-300">{merchant.legalName || '—'}</TableCell>
                          <TableCell className="text-gray-300">{merchant.processor}</TableCell>
                          <TableCell className="text-right text-gray-300">
                            ${parseFloat(merchant.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Retained Merchants Table */}
            {lifecycleData.retainedMerchants && lifecycleData.retainedMerchants.length > 0 && (
              <Card className="bg-zinc-900/80 border-yellow-400/20">
                <CardHeader>
                  <CardTitle className="text-blue-400">Retained Merchants ({lifecycleData.retainedMerchants.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-yellow-400/20">
                        <TableHead className="text-gray-300">MID</TableHead>
                        <TableHead className="text-gray-300">DBA</TableHead>
                        <TableHead className="text-gray-300">Legal Name</TableHead>
                        <TableHead className="text-gray-300">Processor</TableHead>
                        <TableHead className="text-right text-gray-300">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lifecycleData.retainedMerchants.slice(0, 10).map((merchant: any) => (
                        <TableRow key={merchant.merchantId} data-testid={`row-retained-merchant-${merchant.merchantId}`} className="border-yellow-400/10">
                          <TableCell className="font-medium text-white">{merchant.mid}</TableCell>
                          <TableCell className="text-gray-300">{merchant.dba || '—'}</TableCell>
                          <TableCell className="text-gray-300">{merchant.legalName || '—'}</TableCell>
                          <TableCell className="text-gray-300">{merchant.processor}</TableCell>
                          <TableCell className="text-right text-gray-300">
                            ${parseFloat(merchant.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {lifecycleData.retainedMerchants.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2">Showing 10 of {lifecycleData.retainedMerchants.length} merchants</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Lost Merchants Table */}
            {lifecycleData.lostMerchants && lifecycleData.lostMerchants.length > 0 && (
              <Card className="bg-zinc-900/80 border-yellow-400/20">
                <CardHeader>
                  <CardTitle className="text-red-400">Lost Merchants ({lifecycleData.lostMerchants.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-yellow-400/20">
                        <TableHead className="text-gray-300">MID</TableHead>
                        <TableHead className="text-gray-300">DBA</TableHead>
                        <TableHead className="text-gray-300">Legal Name</TableHead>
                        <TableHead className="text-gray-300">Processor</TableHead>
                        <TableHead className="text-right text-gray-300">Last Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lifecycleData.lostMerchants.map((merchant: any) => (
                        <TableRow key={merchant.merchantId} data-testid={`row-lost-merchant-${merchant.merchantId}`} className="border-yellow-400/10">
                          <TableCell className="font-medium text-white">{merchant.mid}</TableCell>
                          <TableCell className="text-gray-300">{merchant.dba || '—'}</TableCell>
                          <TableCell className="text-gray-300">{merchant.legalName || '—'}</TableCell>
                          <TableCell className="text-gray-300">{merchant.processor}</TableCell>
                          <TableCell className="text-right text-gray-300">
                            ${parseFloat(merchant.lastRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="bg-zinc-900 border-yellow-400/20">
            <DialogHeader>
              <DialogTitle className="text-white">Upload {selectedProcessor}</DialogTitle>
              <DialogDescription className="text-gray-400">
                Upload file for {months.find(m => m.value === selectedMonth)?.label}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed border-yellow-400/30 rounded-lg p-8 text-center hover:border-yellow-400/50 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  data-testid="input-file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-yellow-400/50 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-300">
                    {selectedFile ? selectedFile.name : 'Click to select file'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CSV, XLS, or XLSX files accepted</p>
                </label>
              </div>

              <Button 
                onClick={handleUploadSubmit} 
                disabled={!selectedFile || uploadMutation.isPending}
                className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                data-testid="button-submit-upload"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload File'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Approval Dialog */}
        <AlertDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
          <AlertDialogContent className="bg-zinc-900 border-yellow-400/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                {allStepsComplete ? 'Approve Month' : 'Admin Override Required'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {allStepsComplete ? (
                  'Are you sure you want to approve this month? This action will finalize all data.'
                ) : (
                  'Not all steps are complete. As an admin, you can override and approve anyway. Please provide a reason.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {!allStepsComplete && (
              <div className="my-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Override Reason
                </label>
                <textarea
                  className="w-full border border-yellow-400/30 bg-zinc-800 text-gray-200 rounded-md p-2 focus:border-yellow-400 focus:outline-none"
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why you're overriding the normal approval process..."
                  data-testid="input-override-reason"
                />
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-zinc-800" data-testid="button-cancel-approval">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-yellow-400 text-black hover:bg-yellow-500"
                onClick={() => {
                  toast({
                    title: "Month Approved",
                    description: "This month has been approved successfully",
                  });
                  setApprovalDialogOpen(false);
                  setOverrideReason('');
                }}
                data-testid="button-confirm-approval"
                disabled={!allStepsComplete && !overrideReason}
              >
                {allStepsComplete ? 'Approve' : 'Override & Approve'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
