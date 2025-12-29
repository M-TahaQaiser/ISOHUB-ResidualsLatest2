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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface UnassignedSummary {
  totalUnassigned: number;
  unassignedRevenue: number;
  byProcessor: {
    processorName: string;
    count: number;
    revenue: number;
  }[];
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
  ],
  'Team Leader Split': [
    { roleType: 'agent', percentage: 50 },
    { roleType: 'sales_manager', percentage: 30 },
    { roleType: 'partner', percentage: 15 },
    { roleType: 'association', percentage: 5 }
  ]
};

export default function BulkAssignments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMerchants, setSelectedMerchants] = useState<number[]>([]);
  const [currentRule, setCurrentRule] = useState<BulkAssignmentRule>({
    name: '',
    description: '',
    type: 'manual',
    merchantIds: [],
    assignments: [],
    month: '2025-05'
  });

  // Fetch merchants with revenue data
  const { data: merchantsData } = useQuery({
    queryKey: ['/api/assignments/merchants'],
    queryFn: () => apiRequest('/api/assignments/merchants')
  });

  // Fetch available roles
  const { data: rolesData } = useQuery({
    queryKey: ['/api/roles'],
    queryFn: () => apiRequest('/api/roles')
  });

  // Fetch unassigned merchants summary
  const { data: unassignedData } = useQuery({
    queryKey: ['/api/bulk-assignments/unassigned', currentRule.month],
    queryFn: () => apiRequest(`/api/bulk-assignments/unassigned?month=${currentRule.month}`)
  });

  // Fetch processors
  const { data: processorsData } = useQuery({
    queryKey: ['/api/processors'],
    queryFn: () => apiRequest('/api/processors')
  });

  const merchants = merchantsData || [];
  const roles = rolesData || [];
  const processors = processorsData || [];
  const unassigned: UnassignedSummary = unassignedData || {
    totalUnassigned: 0,
    unassignedRevenue: 0,
    byProcessor: []
  };

  // Bulk assignment mutation
  const bulkAssignMutation = useMutation({
    mutationFn: (rules: BulkAssignmentRule[]) => 
      apiRequest('/api/bulk-assignments/execute', 'POST', { rules }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bulk-assignments/unassigned'] });
      
      toast({
        title: "Bulk Assignment Complete",
        description: `Successfully assigned ${data.assignedCount} merchants`,
      });
      
      // Reset form
      setCurrentRule({
        name: '',
        description: '',
        type: 'manual',
        merchantIds: [],
        assignments: [],
        month: '2025-05'
      });
      setSelectedMerchants([]);
    },
    onError: (error: any) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to execute bulk assignment",
        variant: "destructive",
      });
    }
  });

  // Smart assignment mutation
  const smartAssignMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('/api/bulk-assignments/smart', 'POST', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bulk-assignments/unassigned'] });
      
      toast({
        title: "Smart Assignment Complete",
        description: `Processed ${data.merchantsProcessed} merchants, assigned ${data.assignedCount}`,
      });
    }
  });

  const handleMerchantSelect = (merchantId: number, checked: boolean) => {
    if (checked) {
      setSelectedMerchants([...selectedMerchants, merchantId]);
    } else {
      setSelectedMerchants(selectedMerchants.filter(id => id !== merchantId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMerchants(merchants.map((m: any) => m.id));
    } else {
      setSelectedMerchants([]);
    }
  };

  const addAssignmentRole = () => {
    setCurrentRule({
      ...currentRule,
      assignments: [
        ...currentRule.assignments,
        { roleId: 0, roleName: '', percentage: 0 }
      ]
    });
  };

  const updateAssignment = (index: number, field: string, value: any) => {
    const updated = [...currentRule.assignments];
    if (field === 'roleId') {
      const role = roles.find((r: any) => r.id === parseInt(value));
      updated[index] = { ...updated[index], roleId: parseInt(value), roleName: role?.name || '' };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setCurrentRule({ ...currentRule, assignments: updated });
  };

  const removeAssignment = (index: number) => {
    setCurrentRule({
      ...currentRule,
      assignments: currentRule.assignments.filter((_, i) => i !== index)
    });
  };

  const applyTemplate = (templateName: string) => {
    const template = ASSIGNMENT_TEMPLATES[templateName as keyof typeof ASSIGNMENT_TEMPLATES];
    const assignments = template.map(t => {
      const role = roles.find((r: any) => r.type === t.roleType);
      return {
        roleId: role?.id || 0,
        roleName: role?.name || '',
        percentage: t.percentage
      };
    }).filter(a => a.roleId > 0);
    
    setCurrentRule({ ...currentRule, assignments });
  };

  const getTotalPercentage = () => {
    return currentRule.assignments.reduce((sum, a) => sum + a.percentage, 0);
  };

  const isValidAssignment = () => {
    const totalPercentage = getTotalPercentage();
    return totalPercentage === 100 && 
           currentRule.assignments.length > 0 && 
           currentRule.assignments.every(a => a.roleId > 0 && a.percentage > 0);
  };

  const executeAssignment = () => {
    const rule: BulkAssignmentRule = {
      ...currentRule,
      merchantIds: currentRule.type === 'manual' ? selectedMerchants : []
    };

    bulkAssignMutation.mutate([rule]);
  };

  const executeSmartAssignment = (processorId: number, revenueRange?: { min: number; max: number }) => {
    const defaultAssignments = currentRule.assignments.map(a => ({
      roleId: a.roleId,
      percentage: a.percentage
    }));

    smartAssignMutation.mutate({
      rules: [{
        processorId,
        revenueRange,
        defaultAssignments,
        month: currentRule.month
      }]
    });
  };

  const filteredMerchants = merchants.filter((merchant: any) => {
    // Add filtering logic based on current rule conditions
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Bulk Assignment Tools</h1>
        <p className="text-gray-600">Efficiently assign commission splits to multiple merchants</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold">{unassigned.totalUnassigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Lost Revenue</p>
                <p className="text-2xl font-bold">${unassigned.unassignedRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Selected</p>
                <p className="text-2xl font-bold">{selectedMerchants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Merchants</p>
                <p className="text-2xl font-bold">{merchants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assignment Builder */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="manual">Manual Select</TabsTrigger>
              <TabsTrigger value="smart">Smart Rules</TabsTrigger>
              <TabsTrigger value="processor">By Processor</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Manual Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedMerchants.length === merchants.length}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label>Select All Merchants ({merchants.length})</Label>
                      
                      <div className="ml-auto">
                        <Input
                          placeholder="Search merchants..."
                          className="w-64"
                        />
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Merchant</TableHead>
                            <TableHead>Processor</TableHead>
                            <TableHead>Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMerchants.slice(0, 50).map((merchant: any) => (
                            <TableRow key={merchant.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedMerchants.includes(merchant.id)}
                                  onCheckedChange={(checked) => 
                                    handleMerchantSelect(merchant.id, checked as boolean)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{merchant.legalName}</div>
                                  <div className="text-sm text-gray-600">{merchant.mid}</div>
                                </div>
                              </TableCell>
                              <TableCell>{merchant.currentProcessor}</TableCell>
                              <TableCell>${parseFloat(merchant.totalRevenue || '0').toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="smart" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Smart Assignment Rules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Revenue Range (Optional)</Label>
                        <div className="flex gap-2">
                          <Input placeholder="Min $" type="number" />
                          <Input placeholder="Max $" type="number" />
                        </div>
                      </div>
                      <div>
                        <Label>Processor Filter</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="All processors" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Processors</SelectItem>
                            {processors.map((proc: any) => (
                              <SelectItem key={proc.id} value={proc.id.toString()}>
                                {proc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      Smart rules will automatically assign commission splits based on your criteria. 
                      Merchants matching the conditions will be processed automatically.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="processor" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Assign by Processor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Processor</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose processor" />
                        </SelectTrigger>
                        <SelectContent>
                          {processors.map((proc: any) => (
                            <SelectItem key={proc.id} value={proc.id.toString()}>
                              {proc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Show unassigned count per processor */}
                    <div className="space-y-2">
                      <Label>Unassigned by Processor</Label>
                      {unassigned.byProcessor.map((proc) => (
                        <div key={proc.processorName} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">{proc.processorName}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium">{proc.count} merchants</div>
                            <div className="text-xs text-gray-600">${proc.revenue.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Assignment Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(ASSIGNMENT_TEMPLATES).map(([name, template]) => (
                      <div key={name} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{name}</h3>
                            <div className="text-sm text-gray-600 mt-1">
                              {template.map(t => `${t.roleType}: ${t.percentage}%`).join(' • ')}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => applyTemplate(name)}
                            variant="outline"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Assignment Configuration */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Commission Structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="month">Assignment Month</Label>
                <Select value={currentRule.month} onValueChange={(value) => 
                  setCurrentRule({ ...currentRule, month: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-05">May 2025</SelectItem>
                    <SelectItem value="2025-04">April 2025</SelectItem>
                    <SelectItem value="2025-03">March 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Role Assignments</Label>
                  <Button size="sm" onClick={addAssignmentRole} variant="outline">
                    Add Role
                  </Button>
                </div>

                {currentRule.assignments.map((assignment, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <Select 
                      value={assignment.roleId.toString()} 
                      onValueChange={(value) => updateAssignment(index, 'roleId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role: any) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name} ({role.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Percentage"
                        value={assignment.percentage}
                        onChange={(e) => updateAssignment(index, 'percentage', parseFloat(e.target.value) || 0)}
                        className="flex-1"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => removeAssignment(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                <div className={`text-center p-2 rounded ${
                  getTotalPercentage() === 100 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  Total: {getTotalPercentage()}% {getTotalPercentage() === 100 ? '✓' : '✗'}
                </div>
              </div>

              <Button
                onClick={executeAssignment}
                disabled={!isValidAssignment() || bulkAssignMutation.isPending}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {bulkAssignMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute Assignment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}