import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Zap, 
  Upload, 
  Users, 
  TrendingUp, 
  Settings, 
  Download,
  Filter,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface BulkAssignmentRule {
  id?: string;
  name: string;
  description: string;
  type: 'manual' | 'smart_revenue' | 'processor' | 'template';
  merchantIds: number[];
  assignments: {
    roleId: number;
    roleName: string;
    percentage: number;
  }[];
  month: string;
  conditions?: {
    processorId?: number;
    revenueMin?: number;
    revenueMax?: number;
  };
}

const ASSIGNMENT_TEMPLATES = {
  'Standard Sales Split': [
    { roleType: 'agent', percentage: 60 },
    { roleType: 'sales_manager', percentage: 25 },
    { roleType: 'partner', percentage: 15 }
  ],
  'High Performer Split': [
    { roleType: 'agent', percentage: 70 },
    { roleType: 'sales_manager', percentage: 20 },
    { roleType: 'company', percentage: 10 }
  ]
};

export default function BulkAssignmentsTab() {
  const [selectedRule, setSelectedRule] = useState<BulkAssignmentRule | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('2025-05');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch unassigned merchants summary
  const { data: unassignedSummary, isLoading: loadingUnassigned } = useQuery({
    queryKey: ['/api/bulk-assignments/unassigned', selectedMonth],
    enabled: !!selectedMonth,
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Unassigned Merchants
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {unassignedSummary?.totalUnassigned || 0}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Ready for bulk assignment
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Unassigned Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              ${(unassignedSummary?.unassignedRevenue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              Potential commission value
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Assignment Rules
            </CardTitle>
            <Settings className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              3
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Active bulk rules
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Bulk Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Apply Standard Split
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Revenue-Based Assignment
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Processor-Based Rules
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              CSV Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(ASSIGNMENT_TEMPLATES).map(([name, template]) => (
              <div key={name} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <h4 className="font-semibold mb-2">{name}</h4>
                <div className="space-y-1">
                  {template.map((assignment, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="capitalize">{assignment.roleType.replace('_', ' ')}</span>
                      <Badge variant="outline">{assignment.percentage}%</Badge>
                    </div>
                  ))}
                </div>
                <Button size="sm" className="w-full mt-3" variant="outline">
                  Apply Template
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unassigned Merchants by Processor */}
      <Card>
        <CardHeader>
          <CardTitle>Unassigned by Processor</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processor</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unassignedSummary?.byProcessor?.map((processor, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{processor.processorName}</TableCell>
                  <TableCell>{processor.count}</TableCell>
                  <TableCell>${processor.revenue.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">Bulk Assign</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}