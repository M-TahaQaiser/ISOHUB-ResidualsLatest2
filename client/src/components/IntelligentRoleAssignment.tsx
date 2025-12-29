import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertTriangle, Users, Percent, Edit3, Trash2, Plus, Save, User, Check, X, DollarSign, TrendingUp, Calendar, Eye, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RosterSelector from '@/components/RosterSelector';


interface UnassignedMID {
  mid: string;
  merchant_name: string;
  monthly_revenue: string;
  processor: string;
  original_column_i: string;
  needs_assignment: boolean;
}

interface RoleAssignment {
  roleType: 'agent' | 'partner' | 'sales_manager' | 'company' | 'association';
  userName: string;
  percentage: number;
  isCompleted?: boolean;
}

interface IntelligentRoleAssignmentProps {
  selectedMonth: string;
}

// Role Type Selector with ability to add custom roles
const RoleTypeSelector = ({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customRole, setCustomRole] = useState("");

  const standardRoles = [
    { value: "agent", label: "Rep" },
    { value: "partner", label: "Partner" },
    { value: "sales_manager", label: "Sales Manager" },
    { value: "company", label: "Company" },
    { value: "association", label: "Association" }
  ];

  const handleAddCustomRole = () => {
    if (customRole.trim()) {
      onChange(customRole.trim());
      setCustomRole("");
      setIsAddingCustom(false);
    }
  };

  if (isAddingCustom) {
    return (
      <div className="flex gap-2">
        <Input
          value={customRole}
          onChange={(e) => setCustomRole(e.target.value)}
          placeholder="Enter custom role type"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustomRole();
            }
            if (e.key === 'Escape') {
              setIsAddingCustom(false);
              setCustomRole("");
            }
          }}
        />
        <Button
          size="sm"
          onClick={handleAddCustomRole}
          disabled={!customRole.trim()}
          className="bg-yellow-400 hover:bg-yellow-500 text-black"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsAddingCustom(false);
            setCustomRole("");
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select role type" />
        </SelectTrigger>
        <SelectContent className="border shadow-lg z-50">
          {standardRoles.map(role => (
            <SelectItem key={role.value} value={role.value}>
              {role.label}
            </SelectItem>
          ))}
          {/* Show current custom role if it's not in standard list */}
          {value && !standardRoles.find(r => r.value === value) && (
            <SelectItem value={value}>
              {value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsAddingCustom(true)}
        title="Add custom role type"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Custom Username Select Component with roster integration
const UsernameSelect = ({ 
  roleType, 
  value, 
  onChange 
}: { 
  roleType: string, 
  value: string, 
  onChange: (value: string) => void 
}) => {
  // Map role types to roster categories
  const getRosterRole = (roleType: string): 'agents' | 'partners' | 'managers' | 'companies' | 'associations' => {
    switch (roleType.toLowerCase()) {
      case 'agent':
      case 'sales rep':
        return 'agents';
      case 'partner':
        return 'partners';
      case 'sales_manager':
      case 'manager':
        return 'managers';
      case 'company':
        return 'companies';
      case 'association':
        return 'associations';
      default:
        return 'agents';
    }
  };

  const mappedRole = getRosterRole(roleType);
  
  // Log for debugging
  console.log(`UsernameSelect mapping: roleType="${roleType}" → mappedRole="${mappedRole}"`);

  return (
    <RosterSelector
      role={mappedRole}
      value={value}
      onChange={onChange}
      placeholder={`Select ${roleType.toLowerCase()}`}
    />
  );
};

// Chat heads component for displaying role avatars
const ChatHeads = ({ assignments }: { assignments: RoleAssignment[] }) => {
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string): string => {
    const colors = {
      agent: 'bg-blue-500',
      partner: 'bg-green-500', 
      sales_manager: 'bg-purple-500',
      company: 'bg-orange-500',
      association: 'bg-pink-500'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500';
  };

  const getRoleLabel = (role: string): string => {
    if (role === 'agent') return 'Rep';
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <TooltipProvider>
      <div className="flex -space-x-2">
        {assignments.map((assignment, index) => (
          <Tooltip key={index}>
            <TooltipTrigger>
              <Avatar className="h-8 w-8 border-2 border-white cursor-pointer hover:scale-110 transition-transform">
                <AvatarFallback className={`${getRoleColor(assignment.roleType)} text-white text-xs font-semibold`}>
                  {getInitials(assignment.userName)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700">
              <div className="text-center">
                <div className="font-semibold">{assignment.userName}</div>
                <div className="text-sm opacity-90">{getRoleLabel(assignment.roleType)}</div>
                <div className="text-sm font-bold text-green-400">{assignment.percentage}%</div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default function IntelligentRoleAssignment({ selectedMonth }: IntelligentRoleAssignmentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [assignments, setAssignments] = useState<Record<string, RoleAssignment[]>>({});
  const [editingMID, setEditingMID] = useState<string | null>(null);
  const [editingMerchant, setEditingMerchant] = useState<any>(null);
  const [editAssignments, setEditAssignments] = useState<RoleAssignment[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'unassigned' | 'completed'>('unassigned');

  // Fetch unassigned MIDs that need role parsing with client-side deduplication
  const { data: unassignedResponse, isLoading: unassignedLoading } = useQuery({
    queryKey: ['/api/residuals-workflow/role-assignment/unassigned', selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/residuals-workflow/role-assignment/unassigned/${selectedMonth}`);
      if (!response.ok) throw new Error('Failed to fetch unassigned MIDs');
      const data = await response.json();
      
      // Client-side deduplication as additional safety measure
      if (data.unassignedMIDs && Array.isArray(data.unassignedMIDs)) {
        const uniqueMIDs = new Map<string, any>();
        data.unassignedMIDs.forEach((mid: any) => {
          if (!uniqueMIDs.has(mid.mid) || uniqueMIDs.get(mid.mid).monthly_revenue < mid.monthly_revenue) {
            uniqueMIDs.set(mid.mid, mid);
          }
        });
        data.unassignedMIDs = Array.from(uniqueMIDs.values()).sort((a, b) => 
          parseFloat(b.monthly_revenue || '0') - parseFloat(a.monthly_revenue || '0')
        );
      }
      
      return data;
    },
  });

  // Fetch completed assignments for the month
  const { data: completedResponse, isLoading: completedLoading } = useQuery({
    queryKey: ['/api/residuals-workflow/role-assignment/completed', selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/residuals-workflow/role-assignment/completed/${selectedMonth}`);
      if (!response.ok) throw new Error('Failed to fetch completed assignments');
      return response.json();
    },
  });

  // Extract data from the new response format
  const unassignedMIDs = unassignedResponse?.unassignedMIDs || unassignedResponse || [];
  const responseStatus = unassignedResponse?.status;
  const statusMessage = unassignedResponse?.message;

  // Fetch total revenue data for the month (not just unassigned MIDs)
  const { data: monthlyData } = useQuery({
    queryKey: ['/api/real-data/status', selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/real-data/status/${selectedMonth}`);
      if (!response.ok) throw new Error('Failed to fetch monthly data');
      return response.json();
    },
  });

  // Auto-parse Column I data when MIDs load
  useEffect(() => {
    if (unassignedMIDs && unassignedMIDs.length > 0) {
      const newAssignments: Record<string, RoleAssignment[]> = {};
      
      unassignedMIDs.forEach(mid => {
        if (mid.original_column_i && mid.original_column_i.trim()) {
          const parsed = parseColumnI(mid.original_column_i);
          if (parsed.length > 0) {
            newAssignments[mid.mid] = parsed;
          }
        }
      });

      setAssignments(newAssignments);
    }
  }, [unassignedMIDs]);

  // Parse Column I into role assignments
  const parseColumnI = (columnI: string): RoleAssignment[] => {
    const assignments: RoleAssignment[] = [];
    
    if (!columnI || !columnI.trim()) {
      return assignments;
    }

    // Common patterns in Column I:
    // "Johnson & Associates (Partner 60%), Agent: Tom Brown 25%, Company: 15%"
    // "Agent: John Smith 40%, Partner: ABC Corp 30%, Company: 30%"
    // "Smith, John (Agent 45%) | ABC Corp (Partner 25%) | Company (30%)"
    
    const rolePatterns = [
      { 
        type: 'agent', 
        patterns: [
          '(?:agent|agt):\\s*([^,()%]+?)\\s*(\\d+(?:\\.\\d+)?)%',
          '([^,()%]+?)\\s*\\(?(?:agent|agt)\\s*(\\d+(?:\\.\\d+)?)%\\)?'
        ] 
      },
      { 
        type: 'partner', 
        patterns: [
          '(?:partner|prtnr):\\s*([^,()%]+?)\\s*(\\d+(?:\\.\\d+)?)%',
          '([^,()%]+?)\\s*\\(?(?:partner|prtnr)\\s*(\\d+(?:\\.\\d+)?)%\\)?'
        ] 
      },
      { 
        type: 'sales_manager', 
        patterns: [
          '(?:sales\\s*manager|manager|mgr):\\s*([^,()%]+?)\\s*(\\d+(?:\\.\\d+)?)%',
          '([^,()%]+?)\\s*\\(?(?:sales\\s*manager|manager|mgr)\\s*(\\d+(?:\\.\\d+)?)%\\)?'
        ] 
      },
      { 
        type: 'company', 
        patterns: [
          '(?:company|comp):\\s*([^,()%]+?)\\s*(\\d+(?:\\.\\d+)?)%',
          '([^,()%]+?)\\s*\\(?(?:company|comp)\\s*(\\d+(?:\\.\\d+)?)%\\)?',
          'company:\\s*(\\d+(?:\\.\\d+)?)%'
        ] 
      },
      { 
        type: 'association', 
        patterns: [
          '(?:association|assoc):\\s*([^,()%]+?)\\s*(\\d+(?:\\.\\d+)?)%',
          '([^,()%]+?)\\s*\\(?(?:association|assoc)\\s*(\\d+(?:\\.\\d+)?)%\\)?'
        ] 
      }
    ];

    rolePatterns.forEach(({ type, patterns }) => {
      patterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        let match;
        while ((match = regex.exec(columnI)) !== null) {
          let userName = '';
          let percentage = 0;

          if (match[1] && match[2]) {
            userName = match[1].trim();
            percentage = parseFloat(match[2]);
          } else if (match[1] && pattern.includes('company:')) {
            // Handle "company: 15%" pattern
            userName = 'Company';
            percentage = parseFloat(match[1]);
          }

          // Clean up the user name
          userName = userName.replace(/[,:&()]/g, ' ').trim();
          
          if (userName && percentage > 0 && percentage <= 100) {
            // Avoid duplicates
            const exists = assignments.find(a => 
              a.roleType === type && a.userName.toLowerCase() === userName.toLowerCase()
            );
            
            if (!exists) {
              assignments.push({
                roleType: type as any,
                userName,
                percentage
              });
            }
          }
        }
      });
    });

    return assignments;
  };

  // Auto-assign roles mutation
  const autoAssignMutation = useMutation({
    mutationFn: async ({ mid, assignments }: { mid: string, assignments: RoleAssignment[] }) => {
      const response = await fetch('/api/residuals-workflow/role-assignment/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mid,
          month: selectedMonth,
          assignments
        })
      });
      if (!response.ok) throw new Error('Failed to assign roles');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/residuals-workflow/role-assignment/unassigned', selectedMonth] });
      queryClient.invalidateQueries({ queryKey: ['/api/residuals-workflow/role-assignment/completed', selectedMonth] });
      toast({
        title: "Success",
        description: "Role assignments saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAutoAssign = (mid: string, columnI: string) => {
    const parsed = parseColumnI(columnI);
    if (parsed.length === 0) {
      toast({
        title: "No Roles Found",
        description: "Could not parse role assignments from Column I",
        variant: "destructive",
      });
      return;
    }

    const total = parsed.reduce((sum, assignment) => sum + assignment.percentage, 0);
    if (Math.abs(total - 100) > 0.01) {
      toast({
        title: "Percentage Error",
        description: `Role percentages total ${total}%, should equal 100%`,
        variant: "destructive",
      });
      return;
    }

    setAssignments(prev => ({ ...prev, [mid]: parsed }));
  };

  const handleManualAssign = (mid: string) => {
    const midAssignments = assignments[mid] || [];
    autoAssignMutation.mutate({ mid, assignments: midAssignments });
  };

  // Auto-parse all Column I data for the month
  const handleBulkAutoParse = async () => {
    try {
      const response = await fetch('/api/residuals-workflow/role-assignment/auto-parse-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth })
      });
      
      if (!response.ok) throw new Error('Failed to parse bulk assignments');
      
      const data = await response.json();
      
      if (data.success && data.parsedAssignments.length > 0) {
        // Update assignments state with parsed data
        const newAssignments = { ...assignments };
        data.parsedAssignments.forEach((parsed: any) => {
          newAssignments[parsed.mid] = parsed.assignments;
        });
        setAssignments(newAssignments);
        
        toast({
          title: "Bulk Parsing Complete",
          description: `Successfully parsed ${data.totalParsed} assignments from Column I data`,
        });
      } else {
        toast({
          title: "No Data to Parse",
          description: "No Column I data found to auto-parse",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Parsing Failed",
        description: "Could not parse Column I data",
        variant: "destructive"
      });
    }
  };

  // Clean up duplicate MIDs
  const handleCleanupDuplicates = async () => {
    try {
      toast({
        title: "Cleaning Up Duplicates",
        description: "Removing duplicate MID entries...",
      });

      const response = await fetch(`/api/residuals-workflow/cleanup-duplicates/${selectedMonth}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error('Failed to cleanup duplicates');
      
      const data = await response.json();
      
      if (data.success) {
        const { assignmentCleanup, monthlyDataCleanup } = data.results;
        const totalRemoved = assignmentCleanup.removed + monthlyDataCleanup.removed;
        
        // Refresh the data after cleanup
        queryClient.invalidateQueries({
          queryKey: ['/api/residuals-workflow/role-assignment/unassigned', selectedMonth]
        });
        
        toast({
          title: "Cleanup Complete",
          description: `Removed ${totalRemoved} duplicate entries. ${assignmentCleanup.kept + monthlyDataCleanup.kept} unique records kept.`,
        });
      } else {
        toast({
          title: "Cleanup Failed",
          description: data.error || "Could not remove duplicates",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Cleanup Failed", 
        description: "Could not remove duplicate MIDs",
        variant: "destructive"
      });
    }
  };

  // Edit Assignment Functions
  const openEditDialog = async (merchant: any) => {
    const mid = merchant.mid;
    setEditingMID(mid);
    setEditingMerchant(merchant);
    
    try {
      // Try to fetch existing assignments from the database
      const response = await fetch(`/api/residuals-workflow/role-assignment/existing/${mid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.assignments.length > 0) {
          // Use existing assignments from database
          setEditAssignments([...data.assignments.map((a: any) => ({
            roleType: a.roleType,
            userName: a.userName,
            percentage: a.percentage,
            isCompleted: a.isCompleted
          }))]);
        } else {
          // Fall back to current assignments or create empty ones
          const existingAssignments = assignments[mid] || [];
          if (existingAssignments.length === 0) {
            setEditAssignments([{
              roleType: 'agent',
              userName: '',
              percentage: 100
            }]);
          } else {
            setEditAssignments([...existingAssignments]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch existing assignments:', error);
      // Fall back to current assignments or create empty ones
      const existingAssignments = assignments[mid] || [];
      if (existingAssignments.length === 0) {
        setEditAssignments([{
          roleType: 'agent',
          userName: '',
          percentage: 100
        }]);
      } else {
        setEditAssignments([...existingAssignments]);
      }
    }
    
    setIsEditDialogOpen(true);
  };

  const addNewRole = () => {
    setEditAssignments([...editAssignments, {
      roleType: 'agent',
      userName: '',
      percentage: 0
    }]);
  };

  const updateRole = (index: number, field: keyof RoleAssignment, value: any) => {
    const updated = [...editAssignments];
    updated[index] = { ...updated[index], [field]: value };
    setEditAssignments(updated);
  };

  const removeRole = (index: number) => {
    setEditAssignments(editAssignments.filter((_, i) => i !== index));
  };

  const getTotalPercentage = () => {
    return editAssignments.reduce((sum, assignment) => sum + (assignment.percentage || 0), 0);
  };

  const saveEditedAssignments = () => {
    const total = getTotalPercentage();
    if (Math.abs(total - 100) > 0.01) {
      toast({
        title: "Invalid Assignment",
        description: `Total percentage must equal 100%. Current total: ${total.toFixed(2)}%`,
        variant: "destructive"
      });
      return;
    }

    if (editAssignments.some(a => !a.userName.trim())) {
      toast({
        title: "Invalid Assignment",
        description: "All roles must have a user name assigned",
        variant: "destructive"
      });
      return;
    }

    if (editingMID) {
      // Save to database and mark as completed
      autoAssignMutation.mutate({ 
        mid: editingMID, 
        assignments: editAssignments 
      }, {
        onSuccess: () => {
          // Mark assignments as completed in local state
          const completedAssignments = editAssignments.map(a => ({ ...a, isCompleted: true }));
          setAssignments(prev => ({
            ...prev,
            [editingMID]: completedAssignments
          }));
          
          setIsEditDialogOpen(false);
          setEditingMID(null);
          setEditingMerchant(null);
          setEditAssignments([]);
          
          toast({
            title: "Assignment Completed",
            description: `Role assignments saved for MID ${editingMID}`,
          });
        },
        onError: (error: any) => {
          toast({
            title: "Save Failed",
            description: error.message || "Failed to save assignments",
            variant: "destructive"
          });
        }
      });
    }
  };

  const completedAssignments = completedResponse?.completedAssignments || [];
  const completedSummary = completedResponse?.summary || { totalCompleted: 0, totalRevenue: 0 };

  if (unassignedLoading || completedLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading role assignments...</div>
      </div>
    );
  }

  if (!unassignedMIDs || unassignedMIDs.length === 0) {
    // Show different message based on status
    if (responseStatus === 'no_data_uploaded') {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              No Data Uploaded Yet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {statusMessage || `No processor data has been uploaded for ${selectedMonth} yet.`}
            </p>
            <p className="text-sm text-gray-500">
              Please upload the Master Lead Data spreadsheet and processor reports first to see MIDs that need role assignments.
            </p>
          </CardContent>
        </Card>
      );
    } else {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              All MIDs Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              All MIDs for {selectedMonth} have been assigned roles. The system will remember these assignments for future months.
            </p>
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-2 border-yellow-400 bg-white chrome-highlight">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-yellow-600" />
            Role Assignment - {selectedMonth}
          </CardTitle>
          {unassignedMIDs.length > 0 && unassignedMIDs.every(mid => !mid.original_column_i) && (
            <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                <strong>Column I Data Missing:</strong> The uploaded files don't contain Column I assignment data. 
                You'll need to manually set up role assignments for each MID.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white border-2 border-gray-300 rounded">
              <div className="text-2xl font-bold text-gray-700">{unassignedMIDs.length}</div>
              <div className="text-sm text-gray-600">Total MIDs</div>
            </div>
            <div className="text-center p-3 bg-white border-2 border-green-400 rounded chrome-highlight">
              <div className="text-2xl font-bold text-green-700">
                {Object.keys(assignments).filter(mid => assignments[mid].some(a => a.isCompleted)).length}
              </div>
              <div className="text-sm text-green-700">Completed</div>
            </div>
            <div className="text-center p-3 bg-white border-2 border-yellow-400 rounded chrome-highlight">
              <div className="text-2xl font-bold text-yellow-700">
                {unassignedMIDs.length - Object.keys(assignments).filter(mid => assignments[mid].some(a => a.isCompleted)).length}
              </div>
              <div className="text-sm text-yellow-700">Remaining</div>
            </div>
            <div className="text-center p-3 bg-white border-2 border-blue-400 rounded chrome-highlight">
              <div className="text-2xl font-bold text-blue-700">
                {monthlyData?.summary?.totalRevenue ? 
                  monthlyData.summary.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) :
                  unassignedMIDs.reduce((sum, mid) => sum + parseFloat(mid.monthly_revenue || '0'), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                }
              </div>
              <div className="text-sm text-blue-700">Total Revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Unassigned and Completed */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'unassigned' | 'completed')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unassigned" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Needs Assignment ({unassignedMIDs.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedAssignments.length})
          </TabsTrigger>
        </TabsList>

        {/* Unassigned MIDs Tab */}
        <TabsContent value="unassigned">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>MIDs Requiring Role Assignment</CardTitle>
            <div className="flex gap-2">
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                onClick={handleBulkAutoParse}
              >
                <Users className="h-4 w-4" />
                Auto-Parse All
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                onClick={handleCleanupDuplicates}
              >
                <AlertTriangle className="h-4 w-4" />
                Remove Duplicates
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MID</TableHead>
                <TableHead>Merchant Name</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Column I Content</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unassignedMIDs.map((mid, index) => (
                <TableRow key={`${mid.mid}-${index}`}>
                  <TableCell className="font-mono text-sm">{mid.mid}</TableCell>
                  <TableCell>{mid.merchant_name}</TableCell>
                  <TableCell>
                    {parseFloat(mid.monthly_revenue || '0').toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 truncate" title={mid.original_column_i}>
                        {mid.original_column_i || (
                          <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs">
                            No Column I data - Manual assignment required
                          </span>
                        )}
                      </div>
                      {assignments[mid.mid] && assignments[mid.mid].length > 0 && (
                        <ChatHeads assignments={assignments[mid.mid]} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {assignments[mid.mid]?.some(a => a.isCompleted) ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : assignments[mid.mid] ? (
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        <Edit3 className="h-3 w-3 mr-1" />
                        Parsed ({assignments[mid.mid].length} roles)
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Needs Assignment
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(mid)}
                      className={`${
                        assignments[mid.mid]?.some(a => a.isCompleted) 
                          ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-200" 
                          : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      }`}
                      title={
                        assignments[mid.mid]?.some(a => a.isCompleted)
                          ? "Edit completed assignment" 
                          : "Edit assignment"
                      }
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      {assignments[mid.mid]?.some(a => a.isCompleted) ? "Modify" : "Edit"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Assignments Tab */}
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Completed Role Assignments (100%)</CardTitle>
                <div className="text-sm text-gray-600">
                  {completedSummary.totalCompleted} MIDs • Total: ${completedSummary.totalRevenue.toLocaleString()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {completedAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No completed assignments yet for {selectedMonth}. 
                  Assignments will appear here after you save them with 100% commission split.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>MID</TableHead>
                      <TableHead>Merchant Name</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Processor</TableHead>
                      <TableHead>Role Assignments</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedAssignments.map((item: any) => (
                      <TableRow key={item.mid}>
                        <TableCell className="font-mono">{item.mid}</TableCell>
                        <TableCell>{item.merchant_name}</TableCell>
                        <TableCell>${parseFloat(item.monthly_revenue || '0').toLocaleString()}</TableCell>
                        <TableCell>{item.processor}</TableCell>
                        <TableCell>
                          <ChatHeads assignments={item.assignments} />
                        </TableCell>
                        <TableCell>
                          {new Date(item.last_updated).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingMID(item.mid);
                              setEditingMerchant({
                                merchant_name: item.merchant_name,
                                original_column_i: item.original_column_i
                              });
                              setEditAssignments(item.assignments);
                              setIsEditDialogOpen(true);
                            }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border shadow-xl">
          <DialogHeader>
            <DialogTitle className="space-y-1">
              <div>Edit Role Assignments - {editingMID}</div>
              {editingMerchant && (
                <div className="text-base font-normal text-gray-700">
                  <span className="font-semibold">{editingMerchant.merchant_name}</span>
                  {editingMerchant.original_column_i && (
                    <span className="ml-2 text-sm text-gray-600">
                      • Column I: {editingMerchant.original_column_i}
                    </span>
                  )}
                </div>
              )}
            </DialogTitle>
            <DialogDescription>
              Manage commission splits for this MID. Total must equal 100% of monthly revenue.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {editAssignments.map((assignment, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Role {index + 1}</h4>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeRole(index)}
                    disabled={editAssignments.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`role-type-${index}`}>Role Type</Label>
                    <RoleTypeSelector
                      value={assignment.roleType}
                      onChange={(value) => updateRole(index, 'roleType', value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`user-name-${index}`}>User Name</Label>
                    <UsernameSelect
                      roleType={assignment.roleType}
                      value={assignment.userName}
                      onChange={(value) => updateRole(index, 'userName', value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`percentage-${index}`}>Commission %</Label>
                    <Input
                      id={`percentage-${index}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={assignment.percentage || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string or valid numbers
                        if (value === '' || !isNaN(parseFloat(value))) {
                          updateRole(index, 'percentage', value === '' ? 0 : parseFloat(value));
                        }
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={addNewRole}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
              
              <div className="text-lg font-bold">
                Total: {getTotalPercentage()}%
                {getTotalPercentage() !== 100 && (
                  <span className="text-red-600 ml-2">
                    (Must equal 100%)
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={saveEditedAssignments}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
                disabled={getTotalPercentage() !== 100 || editAssignments.some(a => !a.userName.trim())}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Assignments
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}