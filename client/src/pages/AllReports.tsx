import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  Building2, 
  CreditCard, 
  DollarSign,
  Eye,
  Upload,
  Calendar,
  BarChart3
} from "lucide-react";

interface Report {
  id: string;
  month: string;
  processor: string;
  type: string;
  status: 'uploaded' | 'processing' | 'completed' | 'needs_review';
  actions: string[];
  revenue?: number;
  agentCount?: number;
}

export default function AllReports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedReportType, setSelectedReportType] = useState("all");

  // Mock reports data matching the image
  const reportsData: Report[] = [
    { id: "1", month: "March 2025", processor: "Clearent", type: "processor", status: "completed", actions: ["view", "download"], revenue: 12450.75 },
    { id: "2", month: "March 2025", processor: "Global", type: "processor", status: "completed", actions: ["view", "download"], revenue: 8932.25 },
    { id: "3", month: "March 2025", processor: "Merchant Lynx", type: "processor", status: "completed", actions: ["view", "download"], revenue: 15623.80 },
    { id: "4", month: "March 2025", processor: "Micamp", type: "processor", status: "completed", actions: ["view", "download"], revenue: 6789.50 },
    { id: "5", month: "March 2025", processor: "Shift4", type: "processor", status: "completed", actions: ["view", "download"], revenue: 9876.30 },
    { id: "6", month: "March 2025", processor: "TSX", type: "processor", status: "completed", actions: ["view", "download"], revenue: 4321.90 },
    { id: "7", month: "April 2025", processor: "Shift4", type: "processor", status: "completed", actions: ["view", "download"], revenue: 11234.75 },
    { id: "8", month: "April 2025", processor: "Global", type: "processor", status: "completed", actions: ["view", "download"], revenue: 9543.25 },
    { id: "9", month: "April 2025", processor: "Micamp", type: "processor", status: "completed", actions: ["view", "download"], revenue: 7890.60 },
    { id: "10", month: "April 2025", processor: "Clearent", type: "processor", status: "completed", actions: ["view", "download"], revenue: 13567.40 },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "needs_review":
        return <Badge variant="destructive">Needs Review</Badge>;
      case "uploaded":
        return <Badge variant="outline">Uploaded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const reportTypes = [
    { 
      id: "agent", 
      label: "Agent Reports", 
      icon: Users, 
      description: "Individual agent performance and commissions",
      count: 24,
      totalRevenue: 45230.75
    },
    { 
      id: "agent-summary", 
      label: "Agent Summary Reports", 
      icon: BarChart3, 
      description: "Consolidated agent performance metrics",
      count: 12,
      totalRevenue: 78945.50
    },
    { 
      id: "ap", 
      label: "AP Reports", 
      icon: FileText, 
      description: "Accounts payable and commission reports",
      count: 18,
      totalRevenue: 23456.90
    },
    { 
      id: "partner", 
      label: "Partner Summary Reports", 
      icon: Building2, 
      description: "Partner performance and revenue sharing",
      count: 8,
      totalRevenue: 34567.80
    },
    { 
      id: "billing", 
      label: "Billing Reports", 
      icon: DollarSign, 
      description: "Monthly billing and invoice reports",
      count: 15,
      totalRevenue: 56789.25
    },
    { 
      id: "processor", 
      label: "Processor Reports", 
      icon: CreditCard, 
      description: "Individual processor performance",
      count: 42,
      totalRevenue: 123456.75
    },
    { 
      id: "processor-summary", 
      label: "Processor Summary Reports", 
      icon: TrendingUp, 
      description: "Consolidated processor metrics",
      count: 6,
      totalRevenue: 89012.40
    },
  ];

  const filteredReports = reportsData.filter(report => {
    const matchesSearch = report.processor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.month.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMonth = selectedMonth === "all" || report.month.includes(selectedMonth);
    const matchesYear = selectedYear === "all" || report.month.includes(selectedYear);
    const matchesType = selectedReportType === "all" || report.type === selectedReportType;
    
    return matchesSearch && matchesMonth && matchesYear && matchesType;
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">All Reports</h1>
          <p className="text-gray-600 mt-2">Generate and manage your residual reports across all processors and agents</p>
        </div>
        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
          <Upload className="h-4 w-4 mr-2" />
          Go to Report Upload
        </Button>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {reportTypes.map((type) => (
          <Card key={type.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <type.icon className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-sm font-medium">{type.label}</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">{type.count}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-2">{type.description}</p>
              <div className="text-sm font-semibold text-green-600">
                ${type.totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              <SelectItem value="January">January</SelectItem>
              <SelectItem value="February">February</SelectItem>
              <SelectItem value="March">March</SelectItem>
              <SelectItem value="April">April</SelectItem>
              <SelectItem value="May">May</SelectItem>
              <SelectItem value="June">June</SelectItem>
              <SelectItem value="July">July</SelectItem>
              <SelectItem value="August">August</SelectItem>
              <SelectItem value="September">September</SelectItem>
              <SelectItem value="October">October</SelectItem>
              <SelectItem value="November">November</SelectItem>
              <SelectItem value="December">December</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedReportType} onValueChange={setSelectedReportType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Reports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="agent">Agent Reports</SelectItem>
              <SelectItem value="processor">Processor Reports</SelectItem>
              <SelectItem value="ap">AP Reports</SelectItem>
              <SelectItem value="partner">Partner Reports</SelectItem>
              <SelectItem value="billing">Billing Reports</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Search reports..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{filteredReports.length}</div>
            <p className="text-xs text-gray-600">Filtered results</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${filteredReports.reduce((sum, report) => sum + (report.revenue || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">From filtered reports</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Processors</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(filteredReports.map(r => r.processor)).size}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Unique processors</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${filteredReports.length > 0 ? 
                (filteredReports.reduce((sum, report) => sum + (report.revenue || 0), 0) / filteredReports.length).toLocaleString() : 
                '0'}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Per report</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Monthly processor reports and summaries ({filteredReports.length} results)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MONTH</TableHead>
                <TableHead>PROCESSOR</TableHead>
                <TableHead>REVENUE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.month}</TableCell>
                  <TableCell>{report.processor}</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    ${report.revenue?.toLocaleString() || '0'}
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4 text-yellow-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="h-4 w-4 text-yellow-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredReports.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No reports found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your filters or search criteria</p>
              <Button variant="outline" className="border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => {
                setSearchQuery("");
                setSelectedMonth("all");
                setSelectedYear("all");
                setSelectedReportType("all");
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}