import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  Table, 
  Send, 
  Bot, 
  Palette,
  Calendar,
  Download,
  Mail,
  TrendingUp,
  Users,
  DollarSign,
  Save
} from "lucide-react";

interface ReportBuilderProps {
  month: string;
  previewData?: any;
}

interface ReportSpec {
  title: string;
  description: string;
  type: 'table' | 'chart' | 'summary';
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  metrics: string[];
  groupBy: string[];
  filters: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export default function ReportBuilder({ month, previewData }: ReportBuilderProps) {
  const [, setLocation] = useLocation();
  const [aiQuery, setAiQuery] = useState("");
  const [reportSpec, setReportSpec] = useState<ReportSpec | null>(null);
  const [reportData, setReportData] = useState<{
    spec: any;
    data: any[];
    insights?: string;
    userContext?: any;
  } | null>(null);
  const [selectedProcessors, setSelectedProcessors] = useState<string[]>([]);
  const [reportType, setReportType] = useState("agent");

  // Handle preview data
  useEffect(() => {
    if (previewData) {
      setReportData(previewData);
      setReportSpec(previewData.spec);
    }
  }, [previewData]);
  const [chartType, setChartType] = useState("bar");
  const [selectedFields, setSelectedFields] = useState<string[]>(['mid', 'dba', 'income', 'net', 'transactions']);
  const { toast } = useToast();

  // Get current user context
  const { data: currentUser } = useQuery<{
    id: number;
    username: string;
    role: string;
    agentName?: string;
    partnerName?: string;
  }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: processors } = useQuery({
    queryKey: ["/api/processors"],
  });

  const { data: monthlyData } = useQuery<any[]>({
    queryKey: ["/api/monthly-data", month],
  });

  const { data: suggestions } = useQuery({
    queryKey: ["/api/reports/suggestions"],
  });

  const aiQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch("/api/reports/ai-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process query");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setReportSpec(data);
      // Automatically generate the report after creating the specification
      generateReportMutation.mutate(data);
      toast({ title: "Generating report..." });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to process query",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (spec: ReportSpec) => {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportSpec: spec, month }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate report");
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Report data received:", data);
      setReportData(data);
      toast({ title: "Report generated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const emailReportMutation = useMutation({
    mutationFn: async (recipients: string[]) => {
      const response = await fetch("/api/reports/1/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          recipients,
          reportData,
          branding: {
            companyName: "ResidualTracker Pro",
            brandColor: "#1976D2",
          }
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send email");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Report emailed successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to email report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAIQuery = () => {
    if (aiQuery.trim()) {
      aiQueryMutation.mutate(aiQuery);
    }
  };

  const handleManualGenerate = () => {
    const reportTypeConfig = {
      agent: {
        title: "Agent Performance Report",
        description: "Revenue and performance metrics by agent",
        defaultFields: ['mid', 'dba', 'income', 'net', 'agentNet', 'percentage'],
        groupBy: ['agent']
      },
      company: {
        title: "Company Financial Report", 
        description: "Overall company revenue and financial metrics",
        defaultFields: ['income', 'net', 'salesAmount', 'expenses', 'transactions'],
        groupBy: ['processor', 'month']
      },
      partner: {
        title: "Partner Commission Report",
        description: "Partner revenue splits and commissions",
        defaultFields: ['mid', 'dba', 'partnerName', 'income', 'net', 'percentage'],
        groupBy: ['partnerName']
      },
      processor: {
        title: "Processor Analysis Report",
        description: "Performance breakdown by payment processor",
        defaultFields: ['currentProcessor', 'mid', 'dba', 'income', 'net', 'transactions'],
        groupBy: ['processor']
      },
      merchant: {
        title: "Merchant Portfolio Report",
        description: "Individual merchant performance and status",
        defaultFields: ['mid', 'dba', 'legalName', 'status', 'income', 'net', 'transactions'],
        groupBy: ['merchant']
      },
      financial: {
        title: "Financial Summary Report",
        description: "Comprehensive financial metrics and trends",
        defaultFields: ['income', 'net', 'salesAmount', 'expenses', 'bps', 'transactions'],
        groupBy: ['month', 'processor']
      },
      performance: {
        title: "Performance Analytics Report",
        description: "Key performance indicators and metrics",
        defaultFields: ['mid', 'dba', 'transactions', 'salesAmount', 'income', 'net'],
        groupBy: ['status', 'processor']
      }
    };

    const config = reportTypeConfig[reportType as keyof typeof reportTypeConfig];
    
    const manualSpec: ReportSpec = {
      title: config.title,
      description: `${config.description} - ${selectedFields.length} selected fields`,
      type: 'table' as any,
      chartType: chartType as any,
      metrics: selectedFields.length > 0 ? selectedFields : config.defaultFields,
      groupBy: selectedProcessors.length > 0 ? ["processor"] : config.groupBy,
      filters: {
        month,
        processors: selectedProcessors.length > 0 ? selectedProcessors : undefined,
        reportType: reportType
      },
      sortBy: selectedFields.includes("net") ? "net" : selectedFields.includes("income") ? "income" : selectedFields[0],
      sortOrder: "desc",
    };
    
    setReportSpec(manualSpec);
    generateReportMutation.mutate(manualSpec);
  };

  const handleGenerateFromSpec = () => {
    if (reportSpec) {
      generateReportMutation.mutate(reportSpec);
    }
  };

  // Calculate summary stats from monthly data
  const summaryStats = monthlyData ? {
    totalRevenue: monthlyData.reduce((sum: number, item: any) => 
      sum + parseFloat(item.monthly_data?.net || item.net || "0"), 0
    ).toLocaleString(),
    totalMerchants: new Set(monthlyData
      .filter((item: any) => item.merchant?.id || item.monthly_data?.merchant?.id)
      .map((item: any) => item.merchant?.id || item.monthly_data?.merchant?.id)
    ).size,
    totalTransactions: monthlyData.reduce((sum: number, item: any) => 
      sum + (item.monthly_data?.transactions || item.transactions || 0), 0
    ).toLocaleString(),
  } : null;

  return (
    <div className="space-y-6">
      {/* AI Chat Interface */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="mr-2 h-5 w-5 text-primary" />
            AI-Powered Report Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <label htmlFor="ai-query" className="block text-sm font-medium text-gray-700">
                Ask AI to generate a custom report
              </label>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="flex-1">
                  <Input
                    id="ai-query"
                    className="h-12 text-base px-4 border-2 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., 'Show me revenue by agent for May 2025' or 'Generate a split analysis report for Clearent processor'"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAIQuery()}
                  />
                </div>
                <Button 
                  onClick={handleAIQuery}
                  disabled={aiQueryMutation.isPending || !aiQuery.trim()}
                  className="h-12 px-6 bg-primary hover:bg-primary/90 text-black font-medium"
                >
                  <Send className="mr-2 h-5 w-5" />
                  {aiQueryMutation.isPending ? "Processing..." : "Generate Report"}
                </Button>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-2">
              {Array.isArray(suggestions) ? suggestions.slice(0, 4).map((suggestion: string, index: number) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAiQuery(suggestion);
                    aiQueryMutation.mutate(suggestion);
                  }}
                  disabled={aiQueryMutation.isPending || generateReportMutation.isPending}
                  className="text-xs"
                >
                  {suggestion.length > 50 ? `${suggestion.substring(0, 50)}...` : suggestion}
                </Button>
              )) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manual Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Report Category</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Show different options based on user role */}
                  {(!currentUser || currentUser.role === "admin" || currentUser.role === "manager") && (
                    <>
                      <SelectItem value="agent">Agent Reports</SelectItem>
                      <SelectItem value="company">Company Reports</SelectItem>
                      <SelectItem value="partner">Partner Reports</SelectItem>
                      <SelectItem value="processor">Processor Reports</SelectItem>
                      <SelectItem value="merchant">Merchant Reports</SelectItem>
                      <SelectItem value="financial">Financial Reports</SelectItem>
                      <SelectItem value="performance">Performance Reports</SelectItem>
                    </>
                  )}
                  {currentUser?.role === "agent" && (
                    <>
                      <SelectItem value="agent">My Performance</SelectItem>
                      <SelectItem value="merchant">My Merchants</SelectItem>
                      <SelectItem value="financial">My Revenue</SelectItem>
                    </>
                  )}
                  {currentUser?.role === "partner" && (
                    <>
                      <SelectItem value="partner">Partner Performance</SelectItem>
                      <SelectItem value="merchant">Partner Merchants</SelectItem>
                      <SelectItem value="financial">Partner Revenue</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* User Context Banner */}
            {currentUser && (
              <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-lg text-sm">
                <span className="font-medium">Current User:</span> {currentUser.username} 
                <span className="mx-2">•</span>
                <span className="font-medium">Role:</span> {currentUser.role}
                {currentUser.agentName && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="font-medium">Agent:</span> {currentUser.agentName}
                  </>
                )}
                {currentUser.partnerName && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="font-medium">Partner:</span> {currentUser.partnerName}
                  </>
                )}
              </div>
            )}

            {/* Role Switcher for Demo */}
            <div className="bg-gray-50 border p-3 rounded-lg">
              <Label className="text-sm font-medium mb-2 block">Demo: Switch User Role</Label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    const response = await fetch("/api/auth/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                        username: "demo_agent", 
                        role: "agent", 
                        agentName: "Troy Esentan" 
                      })
                    });
                    window.location.reload();
                  }}
                >
                  Agent: Troy Esentan
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    const response = await fetch("/api/auth/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                        username: "demo_partner", 
                        role: "partner", 
                        partnerName: "HBS Partner 0827" 
                      })
                    });
                    window.location.reload();
                  }}
                >
                  Partner: HBS Partner
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    const response = await fetch("/api/auth/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                        username: "demo_manager", 
                        role: "manager" 
                      })
                    });
                    window.location.reload();
                  }}
                >
                  Manager: View All
                </Button>
              </div>
            </div>

            {/* Report Type Description */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-1">
                {currentUser?.role === "agent" ? (
                  reportType === 'agent' ? `My Performance Report` :
                  reportType === 'merchant' ? `My Assigned Merchants` :
                  reportType === 'financial' ? `My Revenue & Commissions` : 'My Report'
                ) : currentUser?.role === "partner" ? (
                  reportType === 'partner' ? `Partner Performance Report` :
                  reportType === 'merchant' ? `Partner Merchant Portfolio` :
                  reportType === 'financial' ? `Partner Revenue Analysis` : 'Partner Report'
                ) : (
                  reportType === 'agent' ? 'Agent Performance Report' :
                  reportType === 'company' ? 'Company Financial Report' :
                  reportType === 'partner' ? 'Partner Commission Report' :
                  reportType === 'processor' ? 'Processor Analysis Report' :
                  reportType === 'merchant' ? 'Merchant Portfolio Report' :
                  reportType === 'financial' ? 'Financial Summary Report' :
                  reportType === 'performance' ? 'Performance Analytics Report' : 'Custom Report'
                )}
              </h5>
              <p className="text-sm text-blue-700">
                {currentUser?.role === "agent" ? (
                  reportType === 'agent' ? `View your personal performance metrics, commission calculations, and assigned merchant revenue.` :
                  reportType === 'merchant' ? `See all merchants assigned to you with their performance details and your commission splits.` :
                  reportType === 'financial' ? `Track your total earnings, commission percentages, and revenue breakdown by merchant.` : 'Your personalized report data.'
                ) : currentUser?.role === "partner" ? (
                  reportType === 'partner' ? `Monitor partner-level performance and commission structures across your merchant portfolio.` :
                  reportType === 'merchant' ? `Review all merchants under your partnership with detailed performance tracking.` :
                  reportType === 'financial' ? `Analyze partner revenue streams, profit sharing, and financial performance metrics.` : 'Partner-specific report data.'
                ) : (
                  reportType === 'agent' ? 'Track individual agent performance, revenue splits, and commission calculations.' :
                  reportType === 'company' ? 'Overall company financial overview with total revenue, expenses, and profitability metrics.' :
                  reportType === 'partner' ? 'Partner revenue sharing, commission structures, and partnership performance analysis.' :
                  reportType === 'processor' ? 'Payment processor comparison, transaction volumes, and processing performance.' :
                  reportType === 'merchant' ? 'Individual merchant status, transaction history, and account performance tracking.' :
                  reportType === 'financial' ? 'Comprehensive financial analysis with revenue trends, expense breakdowns, and profit margins.' :
                  reportType === 'performance' ? 'Key performance indicators, growth metrics, and operational efficiency analysis.' : 'Comprehensive business report.'
                )}
              </p>
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const defaults = {
                      agent: ['mid', 'dba', 'income', 'net', 'agentNet', 'percentage'],
                      company: ['income', 'net', 'salesAmount', 'expenses', 'transactions'],
                      partner: ['mid', 'dba', 'partnerName', 'income', 'net', 'percentage'],
                      processor: ['currentProcessor', 'mid', 'dba', 'income', 'net', 'transactions'],
                      merchant: ['mid', 'dba', 'legalName', 'status', 'income', 'net', 'transactions'],
                      financial: ['income', 'net', 'salesAmount', 'expenses', 'bps', 'transactions'],
                      performance: ['mid', 'dba', 'transactions', 'salesAmount', 'income', 'net']
                    };
                    setSelectedFields(defaults[reportType as keyof typeof defaults] || []);
                  }}
                  className="text-xs"
                >
                  Use Recommended Fields
                </Button>
              </div>
            </div>

            {reportType === "chart" && (
              <div>
                <Label>Chart Type</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { value: "bar", icon: BarChart, label: "Bar Chart" },
                    { value: "line", icon: LineChart, label: "Line Chart" },
                    { value: "pie", icon: PieChart, label: "Pie Chart" },
                    { value: "table", icon: Table, label: "Data Table" },
                  ].map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      variant={chartType === value ? "default" : "outline"}
                      className="p-3 h-auto flex-col"
                      onClick={() => setChartType(value)}
                    >
                      <Icon className="h-6 w-6 mb-1" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Processors</Label>
              <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedProcessors.length === 0}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedProcessors([]);
                    }}
                  />
                  <span className="text-sm">All Processors</span>
                </label>
                {Array.isArray(processors) ? processors.map((processor: any) => (
                  <label key={processor.id} className="flex items-center space-x-2 ml-4">
                    <Checkbox
                      checked={selectedProcessors.includes(processor.id.toString())}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProcessors([...selectedProcessors, processor.id.toString()]);
                        } else {
                          setSelectedProcessors(
                            selectedProcessors.filter((id) => id !== processor.id.toString())
                          );
                        }
                      }}
                    />
                    <span className="text-sm">{processor.name}</span>
                  </label>
                )) : null}
              </div>
            </div>

            {/* Field Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Data Fields to Include</Label>
              
              {/* Financial Metrics */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Financial Metrics</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'income', label: 'Revenue/Income' },
                    { key: 'net', label: 'Net Income' },
                    { key: 'salesAmount', label: 'Sales Amount' },
                    { key: 'expenses', label: 'Expenses' },
                    { key: 'agentNet', label: 'Agent Net' },
                    { key: 'bps', label: 'Basis Points' },
                    { key: 'percentage', label: 'Percentage' }
                  ].map(field => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`field_${field.key}`}
                        checked={selectedFields.includes(field.key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFields([...selectedFields, field.key]);
                          } else {
                            setSelectedFields(selectedFields.filter(f => f !== field.key));
                          }
                        }}
                      />
                      <Label htmlFor={`field_${field.key}`} className="text-sm">
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Merchant Information */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Merchant Information</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'mid', label: 'Merchant ID' },
                    { key: 'legalName', label: 'Legal Name' },
                    { key: 'dba', label: 'DBA Name' },
                    { key: 'branchNumber', label: 'Branch Number' },
                    { key: 'status', label: 'Status' },
                    { key: 'statusCategory', label: 'Status Category' },
                    { key: 'currentProcessor', label: 'Current Processor' },
                    { key: 'partnerName', label: 'Partner Name' }
                  ].map(field => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`field_${field.key}`}
                        checked={selectedFields.includes(field.key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFields([...selectedFields, field.key]);
                          } else {
                            setSelectedFields(selectedFields.filter(f => f !== field.key));
                          }
                        }}
                      />
                      <Label htmlFor={`field_${field.key}`} className="text-sm">
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Data */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Transaction Data</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'transactions', label: 'Transaction Count' },
                    { key: 'groupCode', label: 'Group Code' },
                    { key: 'approvalDate', label: 'Approval Date' },
                    { key: 'month', label: 'Month' }
                  ].map(field => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`field_${field.key}`}
                        checked={selectedFields.includes(field.key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFields([...selectedFields, field.key]);
                          } else {
                            setSelectedFields(selectedFields.filter(f => f !== field.key));
                          }
                        }}
                      />
                      <Label htmlFor={`field_${field.key}`} className="text-sm">
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Field Selection */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedFields(['mid', 'dba', 'income', 'net', 'transactions'])}
                >
                  Basic Report
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedFields(['mid', 'dba', 'income', 'net', 'salesAmount', 'expenses', 'transactions', 'status'])}
                >
                  Financial Report
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedFields([])}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleManualGenerate} 
              className="w-full"
              disabled={generateReportMutation.isPending || selectedFields.length === 0}
            >
              <BarChart className="mr-2 h-4 w-4" />
              {generateReportMutation.isPending ? "Generating..." : `Generate Report (${selectedFields.length} fields)`}
            </Button>
          </CardContent>
        </Card>

        {/* Report Preview/Results */}
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {reportSpec && !reportData && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">{reportSpec.title}</h4>
                  <p className="text-sm text-blue-700 mt-1">{reportSpec.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">{reportSpec.type}</Badge>
                    {reportSpec.chartType && (
                      <Badge variant="outline">{reportSpec.chartType} chart</Badge>
                    )}
                  </div>
                </div>
                <Button onClick={handleGenerateFromSpec} className="w-full">
                  Generate This Report
                </Button>
              </div>
            )}

            {reportData && reportData.data && Array.isArray(reportData.data) && reportData.data.length > 0 && (
              <div className="space-y-4">
                {/* Report Summary */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Report Summary</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Total Records:</span>
                      <span className="ml-2">{reportData.data.length}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Total Revenue:</span>
                      <span className="ml-2 font-semibold">
                        ${reportData.data.reduce((sum: number, item: any) => 
                          sum + parseFloat(item.monthly_data?.income || '0'), 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Total Net:</span>
                      <span className="ml-2 font-semibold">
                        ${reportData.data.reduce((sum: number, item: any) => 
                          sum + parseFloat(item.monthly_data?.net || '0'), 0
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Report Content */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">{reportData.spec?.title || "Generated Report"}</h4>
                  <p className="text-sm text-gray-600 mb-4">{reportData.spec?.description}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-3 px-4 font-medium">Merchant</th>
                          <th className="text-left py-3 px-4 font-medium">MID</th>
                          <th className="text-left py-3 px-4 font-medium">Processor</th>
                          <th className="text-left py-3 px-4 font-medium">Revenue</th>
                          <th className="text-left py-3 px-4 font-medium">Net Income</th>
                          <th className="text-left py-3 px-4 font-medium">Transactions</th>
                          <th className="text-left py-3 px-4 font-medium">Sales Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.data.slice(0, 15).map((row: any, index: number) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">
                              {row.merchants?.dba || row.merchants?.legalName || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              {row.merchants?.mid || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              {row.processors?.name || 'N/A'}
                            </td>
                            <td className="py-3 px-4 font-semibold text-green-600">
                              ${parseFloat(row.monthly_data?.income || '0').toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-semibold text-blue-600">
                              ${parseFloat(row.monthly_data?.net || '0').toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              {(row.monthly_data?.transactions || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              ${parseFloat(row.monthly_data?.salesAmount || '0').toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reportData.data.length > 15 && (
                      <p className="text-sm text-gray-500 mt-3 text-center">
                        Showing first 15 of {reportData.data.length} records
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Save Report Section */}
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h5 className="font-medium mb-3">Save Report</h5>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={async () => {
                        try {
                          // Save report to database
                          const response = await fetch("/api/reports", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name: reportData.spec?.title || "Custom Report",
                              type: reportData.spec?.type || "table",
                              filters: {
                                month,
                                reportType: reportData.spec?.filters?.reportType || "general",
                                metrics: reportData.spec?.metrics || [],
                                groupBy: reportData.spec?.groupBy || []
                              },
                              schedule: null,
                              isActive: true
                            })
                          });
                          
                          if (response.ok) {
                            toast({ 
                              title: "Report saved successfully!",
                              description: "Navigating to saved reports..."
                            });
                            // Navigate to saved reports tab after short delay
                            setTimeout(() => {
                              setLocation("/reports?tab=saved");
                            }, 1000);
                          } else {
                            const error = await response.json();
                            toast({ 
                              title: "Failed to save report", 
                              description: error.message || "Unknown error",
                              variant: "destructive" 
                            });
                          }
                        } catch (error) {
                          console.error("Save report error:", error);
                          toast({ 
                            title: "Failed to save report", 
                            description: "Network or server error",
                            variant: "destructive" 
                          });
                        }
                      }}
                      className="bg-primary hover:bg-primary/90 text-black"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Report
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const csvContent = [
                          ["Merchant", "MID", "Processor", "Revenue", "Net Income", "Transactions", "Sales Amount"],
                          ...reportData.data.map((row: any) => [
                            row.merchants?.dba || row.merchants?.legalName || 'N/A',
                            row.merchants?.mid || 'N/A',
                            row.processors?.name || 'N/A',
                            parseFloat(row.monthly_data?.income || '0'),
                            parseFloat(row.monthly_data?.net || '0'),
                            row.monthly_data?.transactions || 0,
                            parseFloat(row.monthly_data?.salesAmount || '0')
                          ])
                        ].map(row => row.join(',')).join('\n');
                        
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${reportData.spec?.title || 'report'}.csv`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!reportSpec && !reportData && (
              <div className="text-center py-8 text-gray-500">
                <BarChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>Use AI query or manual configuration to generate a report</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
