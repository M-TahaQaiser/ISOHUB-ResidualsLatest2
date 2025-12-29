import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";
import ClickableCard from "@/components/ClickableCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RealDataUploadGrid } from "@/components/RealDataUploadGrid";
import IntelligentRoleAssignment from "@/components/IntelligentRoleAssignment";
import { MasterDataQCTable } from "@/components/MasterDataQCTable";
import AdvancedReportBuilder from "@/components/AdvancedReportBuilder";
import { 
  FileText, 
  Download, 
  Search, 
  Upload, 
  TrendingUp, 
  Users, 
  Building2, 
  CreditCard, 
  DollarSign,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  CalendarDays,
  Workflow,
  CheckCircle2,
  Circle
} from "lucide-react";

interface Report {
  id: string;
  name: string;
  processor: string;
  status: 'needs_upload' | 'needs_audit' | 'needs_approval' | 'completed';
  amount?: number;
  date?: string;
  auditIssues?: string[];
  month: string;
  revenue?: number;
}

interface ResidualsProps {
  username?: string;
}

export default function Residuals({ username }: ResidualsProps) {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("upload"); // Start with upload step
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProcessor, setSelectedProcessor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("2025-06"); // Default to current month (June 2025)

  // Get auth data from localStorage
  const authToken = localStorage.getItem('authToken');
  const organizationID = localStorage.getItem('organizationID');

  // Generate month options for the dropdown (last 12 months + next 6 months)
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    // Go back 12 months
    for (let i = 12; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7); // YYYY-MM format
      const label = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({ value, label });
    }
    
    // Add next 6 months
    for (let i = 1; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = date.toISOString().slice(0, 7); // YYYY-MM format
      const label = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({ value, label });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  const [fetchedReports, setFetchedReports] = useState<Report[]>([]);
  const [statusData, setStatusData] = useState<any>(null);

  // Helper function to determine appropriate workflow step based on data status
  const determineActiveStep = (statusData: any) => {
    if (!statusData || statusData.totalRecords === 0) {
      return "upload"; // No data uploaded, start with upload
    }
    if (statusData.totalRecords > 0 && statusData.processorsActive < statusData.processorsTotal) {
      return "upload"; // Partial upload, continue uploading
    }
    if (statusData.processorsActive === statusData.processorsTotal) {
      return "assignment"; // All data uploaded, move to assignment
    }
    return "upload"; // Default to upload
  };

  // Fetch data for selected month
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch reports for the selected month
        const reportsResponse = await fetch('/api/reports/residuals');
        const reportsData = await reportsResponse.json();
        if (reportsData.reports) {
          setFetchedReports(reportsData.reports);
        }

        // Fetch real data status for the selected month
        const statusResponse = await fetch(`/api/real-data/status/${selectedMonth}`);
        const statusData = await statusResponse.json();
        setStatusData(statusData);

        // Update active tab based on data status
        const appropriateStep = determineActiveStep(statusData);
        setActiveTab(appropriateStep);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  const filteredReports = fetchedReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.processor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProcessor = selectedProcessor === "all" || report.processor === selectedProcessor;
    const matchesStatus = selectedStatus === "all" || report.status === selectedStatus;
    
    return matchesSearch && matchesProcessor && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'needs_upload': { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'Needs Upload' },
      'needs_audit': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, text: 'Needs Audit' },
      'needs_approval': { color: 'bg-blue-100 text-blue-800', icon: Eye, text: 'Needs Approval' },
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Completed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.needs_upload;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const handleUploadClick = () => {
    setActiveTab("upload");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading residuals data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        items={[
          { label: "Residuals", href: "/residuals", isActive: true }
        ]} 
      />

      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2 sm:mb-4">
              4-Step Residuals Processing Workflow
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Complete residuals processing for {monthOptions.find(opt => opt.value === selectedMonth)?.label || selectedMonth}
            </p>
          </div>
          
          {/* Month/Year Selector */}
          <div className="flex items-center gap-3 justify-center sm:justify-end">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-gray-500" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Progress Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-yellow-600" />
            Workflow Progress - {monthOptions.find(opt => opt.value === selectedMonth)?.label || selectedMonth}
          </CardTitle>
          <CardDescription>
            Streamlined 4-step workflow with intelligent role assignment and persistent memory
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-gray-600">
                {(() => {
                  // Calculate progress based on actual backend workflow status
                  if (!statusData || !statusData.processors || statusData.processors.length === 0) return "0%";
                  
                  const processors = statusData.processors || [];
                  let completedSteps = 0;
                  
                  // Step 1: Upload complete (25%) - All processors have validated uploads
                  const allUploaded = processors.every((p: any) => p.uploadStatus === 'validated');
                  if (allUploaded && processors.length > 0) {
                    completedSteps = 1;
                  }
                  
                  // Step 2: Assignment complete (50%) - All processors have assignments
                  const allAssigned = processors.every((p: any) => 
                    p.assignmentStatus === 'assigned' || p.assignmentStatus === 'validated'
                  );
                  if (completedSteps >= 1 && allAssigned) {
                    completedSteps = 2;
                  }
                  
                  // Step 3: Compilation complete (75%) - All processors compiled
                  const allCompiled = processors.every((p: any) => p.compilationStatus === 'compiled');
                  if (completedSteps >= 2 && allCompiled) {
                    completedSteps = 3;
                  }
                  
                  // Step 4: Audit passed (100%) - All processors audited
                  const allAudited = processors.every((p: any) => p.auditStatus === 'passed');
                  if (completedSteps >= 3 && allAudited) {
                    completedSteps = 4;
                  }
                  
                  return `${completedSteps * 25}%`;
                })()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-yellow-500 h-2.5 rounded-full transition-all duration-500"
                style={{ 
                  width: (() => {
                    // Same calculation for visual width
                    if (!statusData || !statusData.processors || statusData.processors.length === 0) return "0%";
                    
                    const processors = statusData.processors || [];
                    let completedSteps = 0;
                    
                    const allUploaded = processors.every((p: any) => p.uploadStatus === 'validated');
                    if (allUploaded && processors.length > 0) completedSteps = 1;
                    
                    const allAssigned = processors.every((p: any) => 
                      p.assignmentStatus === 'assigned' || p.assignmentStatus === 'validated'
                    );
                    if (completedSteps >= 1 && allAssigned) completedSteps = 2;
                    
                    const allCompiled = processors.every((p: any) => p.compilationStatus === 'compiled');
                    if (completedSteps >= 2 && allCompiled) completedSteps = 3;
                    
                    const allAudited = processors.every((p: any) => p.auditStatus === 'passed');
                    if (completedSteps >= 3 && allAudited) completedSteps = 4;
                    
                    return `${completedSteps * 25}%`;
                  })()
                }}
              />
            </div>
          </div>

          {/* Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1: Upload Files */}
            <div 
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                statusData && statusData.totalRecords > 0 
                  ? "bg-white border-2 border-green-400 chrome-highlight hover:bg-green-50" 
                  : activeTab === "upload" 
                    ? "bg-yellow-400 border-2 border-yellow-400 chrome-glow hover:bg-yellow-500"
                    : "bg-white border-2 border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("upload")}
              data-testid="step-upload"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold text-black">1</div>
                {statusData && statusData.totalRecords > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" data-testid="icon-step1-complete" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" data-testid="icon-step1-pending" />
                )}
              </div>
              <div className="text-sm font-bold text-black">Upload Files</div>
              <div className="text-xs text-gray-600 mt-1">
                {statusData && statusData.totalRecords > 0 
                  ? `${statusData.processorsActive}/${statusData.processorsTotal} processors` 
                  : "No data uploaded"}
              </div>
            </div>

            {/* Step 2: Assign Roles */}
            <div 
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                statusData && statusData.totalRecords > 0 && statusData.processorsActive === statusData.processorsTotal
                  ? activeTab === "assignment" 
                    ? "bg-yellow-400 border-2 border-yellow-400 chrome-glow hover:bg-yellow-500"
                    : "bg-white border-2 border-yellow-400 chrome-highlight hover:bg-yellow-50"
                  : "bg-white border-2 border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("assignment")}
              data-testid="step-assignment"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold text-black">2</div>
                {statusData && statusData.totalRecords > 0 && statusData.processorsActive === statusData.processorsTotal ? (
                  <Circle className="h-5 w-5 text-yellow-500" data-testid="icon-step2-ready" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" data-testid="icon-step2-pending" />
                )}
              </div>
              <div className="text-sm font-bold text-black">Assign Roles</div>
              <div className="text-xs text-gray-600 mt-1">
                {statusData && statusData.totalRecords > 0 && statusData.processorsActive === statusData.processorsTotal
                  ? "Ready to assign"
                  : "Complete upload first"}
              </div>
            </div>

            {/* Step 3: Master Data QC */}
            <div 
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                activeTab === "master-data" 
                  ? "bg-yellow-400 border-2 border-yellow-400 chrome-glow hover:bg-yellow-500"
                  : "bg-white border-2 border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("master-data")}
              data-testid="step-masterdata"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold text-black">3</div>
                <Circle className="h-5 w-5 text-gray-400" data-testid="icon-step3-pending" />
              </div>
              <div className="text-sm font-bold text-black">Master Data QC</div>
              <div className="text-xs text-gray-600 mt-1">Review data quality</div>
            </div>

            {/* Step 4: Smart Reports */}
            <div 
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                activeTab === "reports" 
                  ? "bg-yellow-400 border-2 border-yellow-400 chrome-glow hover:bg-yellow-500"
                  : "bg-white border-2 border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("reports")}
              data-testid="step-reports"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold text-black">4</div>
                <Circle className="h-5 w-5 text-gray-400" data-testid="icon-step4-pending" />
              </div>
              <div className="text-sm font-bold text-black">Smart Reports</div>
              <div className="text-xs text-gray-600 mt-1">Generate insights</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white border-2 border-yellow-400 p-1 rounded-lg chrome-highlight">
          <TabsTrigger 
            value="upload" 
            className="text-xs sm:text-sm font-bold transition-all duration-300 ease-in-out data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:chrome-glow data-[state=inactive]:text-black data-[state=inactive]:hover:text-yellow-600 hover:bg-white rounded-md pure-white"
          >
            Step 1: Upload
          </TabsTrigger>
          <TabsTrigger 
            value="assignment" 
            className="text-xs sm:text-sm font-bold transition-all duration-300 ease-in-out data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:chrome-glow data-[state=inactive]:text-black data-[state=inactive]:hover:text-yellow-600 hover:bg-white rounded-md pure-white"
          >
            Step 2: Assign Roles
          </TabsTrigger>
          <TabsTrigger 
            value="master-data" 
            className="text-xs sm:text-sm font-bold transition-all duration-300 ease-in-out data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:chrome-glow data-[state=inactive]:text-black data-[state=inactive]:hover:text-yellow-600 hover:bg-white rounded-md pure-white"
          >
            Step 3: Master Data QC
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="text-xs sm:text-sm font-bold transition-all duration-300 ease-in-out data-[state=active]:bg-yellow-400 data-[state=active]:text-black data-[state=active]:chrome-glow data-[state=inactive]:text-black data-[state=inactive]:hover:text-yellow-600 hover:bg-white rounded-md pure-white"
          >
            Step 4: Reports
          </TabsTrigger>
        </TabsList>

        {/* Step 1-2: Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <RealDataUploadGrid 
            selectedMonth={selectedMonth.split('-')[1]} 
            selectedYear={selectedMonth.split('-')[0]} 
          />
        </TabsContent>



        {/* Step 2: Intelligent Role Assignment Tab */}
        <TabsContent value="assignment" className="space-y-6">
          <IntelligentRoleAssignment selectedMonth={selectedMonth} />
        </TabsContent>

        {/* Step 3: Master Data QC Tab */}
        <TabsContent value="master-data" className="space-y-6">
          <MasterDataQCTable selectedMonth={selectedMonth} />
        </TabsContent>

        {/* Step 4: Smart Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
                Step 4: Permission-Based Smart Reports
              </CardTitle>
              <CardDescription>
                Generate filtered reports with organization branding and scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">Agents</div>
                    <div className="text-sm text-gray-600">Only see their MIDs</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">Partners</div>
                    <div className="text-sm text-gray-600">Partner summaries</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">Managers</div>
                    <div className="text-sm text-gray-600">Full oversight</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">Scheduled</div>
                    <div className="text-sm text-gray-600">Auto delivery</div>
                  </div>
                </div>

                <div className="text-center py-8">
                  <Button className="bg-yellow-400 hover:bg-yellow-500 text-black mr-4">
                    Generate All Reports
                  </Button>
                  <Button variant="outline" className="border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                    Configure Permissions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Report Builder */}
          <AdvancedReportBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}