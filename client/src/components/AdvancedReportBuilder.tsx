import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Filter,
  Plus,
  Download,
  Save,
  TrendingUp,
  Users,
  Building2,
  X,
  Calendar,
  DollarSign,
  FileText
} from "lucide-react";

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  logic?: 'AND' | 'OR';
}

interface ReportConfig {
  name: string;
  type: 'agent' | 'partner' | 'company' | 'processor' | 'custom';
  filters: FilterCondition[];
  groupBy: string[];
  columns: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

interface FieldDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'select';
  options?: string[];
}

const AVAILABLE_FIELDS: FieldDefinition[] = [
  { key: 'merchant.name', label: 'Merchant Name', type: 'string' },
  { key: 'merchant.mid', label: 'MID', type: 'string' },
  { key: 'processor.name', label: 'Processor', type: 'select', options: ['Clearent', 'Global Payments TSYS', 'Micamp Solutions', 'Merchant Lynx', 'TRX', 'Shift4', 'Payment Advisors', 'PayBright'] },
  { key: 'monthlyData.month', label: 'Month', type: 'date' },
  { key: 'monthlyData.net', label: 'Net Revenue', type: 'number' },
  { key: 'monthlyData.salesAmount', label: 'Sales Volume', type: 'number' },
  { key: 'monthlyData.transactionCount', label: 'Transaction Count', type: 'number' },
  { key: 'assignments.roleType', label: 'Role Type', type: 'select', options: ['agent', 'partner', 'sales_manager', 'team_leader'] },
  { key: 'assignments.percentage', label: 'Commission %', type: 'number' },
  { key: 'roles.name', label: 'Assigned To', type: 'string' },
  { key: 'merchant.status', label: 'Merchant Status', type: 'select', options: ['active', 'inactive', 'pending'] },
  { key: 'merchant.industry', label: 'Industry', type: 'string' }
];

const OPERATORS = {
  string: [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'not_equals', label: 'Not Equals' }
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'greater_equal', label: 'Greater or Equal' },
    { value: 'less_equal', label: 'Less or Equal' },
    { value: 'between', label: 'Between' }
  ],
  date: [
    { value: 'equals', label: 'Equals' },
    { value: 'after', label: 'After' },
    { value: 'before', label: 'Before' },
    { value: 'between', label: 'Between' }
  ],
  select: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'in', label: 'In List' }
  ]
};

const REPORT_TEMPLATES = {
  agent: {
    name: 'Agent Performance Report',
    filters: [{ id: '1', field: 'assignments.roleType', operator: 'equals', value: 'agent' }],
    groupBy: ['roles.name', 'monthlyData.month'],
    columns: ['roles.name', 'monthlyData.month', 'merchant.name', 'processor.name', 'monthlyData.net', 'assignments.percentage']
  },
  partner: {
    name: 'Partner Revenue Report',
    filters: [{ id: '1', field: 'assignments.roleType', operator: 'equals', value: 'partner' }],
    groupBy: ['roles.name', 'processor.name'],
    columns: ['roles.name', 'processor.name', 'monthlyData.month', 'monthlyData.net', 'monthlyData.salesAmount']
  },
  company: {
    name: 'Company Overview Report',
    filters: [],
    groupBy: ['monthlyData.month', 'processor.name'],
    columns: ['monthlyData.month', 'processor.name', 'monthlyData.net', 'monthlyData.salesAmount', 'monthlyData.transactionCount']
  },
  processor: {
    name: 'Processor Performance Report',
    filters: [],
    groupBy: ['processor.name', 'monthlyData.month'],
    columns: ['processor.name', 'monthlyData.month', 'monthlyData.net', 'monthlyData.salesAmount', 'merchant.name']
  }
};

export default function AdvancedReportBuilder() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    type: 'custom',
    filters: [],
    groupBy: [],
    columns: ['merchant.name', 'processor.name', 'monthlyData.net'],
    dateRange: {
      start: `${new Date().getFullYear()}-03-01`,
      end: `${new Date().getFullYear()}-05-31`
    }
  });

  const [reportResults, setReportResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("builder");

  // Generate unique ID for new filters
  const generateFilterId = () => Date.now().toString();

  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: generateFilterId(),
      field: 'merchant.name',
      operator: 'equals',
      value: '',
      logic: reportConfig.filters.length > 0 ? 'AND' : undefined
    };
    
    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
  };

  const removeFilter = (filterId: string) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.id !== filterId)
    }));
  };

  const updateFilter = (filterId: string, updates: Partial<FilterCondition>) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.map(f => 
        f.id === filterId ? { ...f, ...updates } : f
      )
    }));
  };

  const loadTemplate = (templateType: keyof typeof REPORT_TEMPLATES) => {
    const template = REPORT_TEMPLATES[templateType];
    setReportConfig(prev => ({
      ...prev,
      name: template.name,
      type: templateType,
      filters: template.filters.map(f => ({ ...f, id: generateFilterId() })),
      groupBy: template.groupBy,
      columns: template.columns
    }));
  };

  const runReportMutation = useMutation({
    mutationFn: async (config: ReportConfig) => {
      const response = await fetch("/api/reports/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error("Failed to generate report");
      return response.json();
    },
    onSuccess: (data) => {
      setReportResults(data.results || []);
      setActiveTab("results");
    }
  });

  const saveReportMutation = useMutation({
    mutationFn: async (config: ReportConfig) => {
      const response = await fetch("/api/reports/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error("Failed to save report");
      return response.json();
    }
  });

  const handleRunReport = () => {
    if (reportConfig.filters.length === 0 && reportConfig.type === 'custom') {
      // Add a default filter to avoid getting all data
      const defaultFilter: FilterCondition = {
        id: generateFilterId(),
        field: 'monthlyData.month',
        operator: 'between',
        value: '2025-03-01,2025-05-31'
      };
      const configWithFilter = {
        ...reportConfig,
        filters: [defaultFilter]
      };
      runReportMutation.mutate(configWithFilter);
    } else {
      runReportMutation.mutate(reportConfig);
    }
  };

  const exportReport = () => {
    if (reportResults.length === 0) return;
    
    const csv = [
      reportConfig.columns.join(','),
      ...reportResults.map(row => 
        reportConfig.columns.map(col => row[col] || '').join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportConfig.name || 'report'}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Advanced Report Builder</h1>
        <p className="text-gray-600">Create custom reports with advanced filtering like GoHighLevel smart lists</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="results">Results ({reportResults.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          {/* Report Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportName">Report Name</Label>
                  <Input
                    id="reportName"
                    value={reportConfig.name}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter report name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select 
                    value={reportConfig.type} 
                    onValueChange={(value: any) => setReportConfig(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent Report</SelectItem>
                      <SelectItem value="partner">Partner Report</SelectItem>
                      <SelectItem value="company">Company Report</SelectItem>
                      <SelectItem value="processor">Processor Report</SelectItem>
                      <SelectItem value="custom">Custom Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={reportConfig.dateRange.start}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={reportConfig.dateRange.end}
                    onChange={(e) => setReportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters ({reportConfig.filters.length})
              </CardTitle>
              <CardDescription>
                Add filters to narrow down your data like GoHighLevel smart lists
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportConfig.filters.map((filter, index) => (
                <div key={filter.id} className="flex gap-2 items-end p-4 border rounded-lg">
                  {index > 0 && (
                    <div className="space-y-2">
                      <Label>Logic</Label>
                      <Select
                        value={filter.logic || 'AND'}
                        onValueChange={(value: 'AND' | 'OR') => updateFilter(filter.id, { logic: value })}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <Label>Field</Label>
                    <Select
                      value={filter.field}
                      onValueChange={(value) => updateFilter(filter.id, { field: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_FIELDS.map(field => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label>Operator</Label>
                    <Select
                      value={filter.operator}
                      onValueChange={(value) => updateFilter(filter.id, { operator: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS[AVAILABLE_FIELDS.find(f => f.key === filter.field)?.type || 'string'].map(op => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label>Value</Label>
                    <Input
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                      placeholder="Enter value"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFilter(filter.id)}
                    className="mb-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button onClick={addFilter} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Filter
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button 
              onClick={handleRunReport}
              disabled={runReportMutation.isPending}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {runReportMutation.isPending ? 'Running...' : 'Run Report'}
            </Button>
            
            <Button 
              onClick={() => saveReportMutation.mutate(reportConfig)}
              disabled={saveReportMutation.isPending}
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Report
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {reportResults.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Report Results</CardTitle>
                  <Button onClick={exportReport} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {reportConfig.columns.map(col => (
                          <TableHead key={col}>
                            {AVAILABLE_FIELDS.find(f => f.key === col)?.label || col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportResults.slice(0, 100).map((row, index) => (
                        <TableRow key={index}>
                          {reportConfig.columns.map(col => (
                            <TableCell key={col}>
                              {row[col] || '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {reportResults.length > 100 && (
                  <p className="text-sm text-gray-500 mt-4">
                    Showing first 100 of {reportResults.length} results. Export CSV for complete data.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                <p className="text-gray-500">Run a report to see results here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(REPORT_TEMPLATES).map(([key, template]) => (
              <Card key={key} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {key === 'agent' && <Users className="h-5 w-5" />}
                    {key === 'partner' && <Building2 className="h-5 w-5" />}
                    {key === 'company' && <TrendingUp className="h-5 w-5" />}
                    {key === 'processor' && <DollarSign className="h-5 w-5" />}
                    {template.name}
                  </CardTitle>
                  <CardDescription>
                    Pre-configured {key} report template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Filters: </span>
                      <span className="text-sm text-gray-600">
                        {template.filters.length} condition{template.filters.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Columns: </span>
                      <span className="text-sm text-gray-600">
                        {template.columns.length} field{template.columns.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => loadTemplate(key as keyof typeof REPORT_TEMPLATES)}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}