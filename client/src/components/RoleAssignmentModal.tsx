import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X, Calculator, Plus, Trash2, Zap, Copy, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface RoleAssignmentModalProps {
  merchant: any;
  monthlyData: any;
  month: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Assignment {
  roleId: number;
  percentage: number;
  role?: any;
}

// Quick templates for common role assignments
const QUICK_TEMPLATES = [
  {
    name: "Standard Split",
    icon: "⚡",
    assignments: [
      { roleName: "Company", percentage: 50 },
      { roleName: "Agent", percentage: 30 },
      { roleName: "Sales Manager", percentage: 20 }
    ]
  },
  {
    name: "Agent Only",
    icon: "👤",
    assignments: [
      { roleName: "Company", percentage: 70 },
      { roleName: "Agent", percentage: 30 }
    ]
  },
  {
    name: "Partnership",
    icon: "🤝",
    assignments: [
      { roleName: "Company", percentage: 40 },
      { roleName: "Partner", percentage: 35 },
      { roleName: "Agent", percentage: 25 }
    ]
  },
  {
    name: "Association",
    icon: "🏢",
    assignments: [
      { roleName: "Company", percentage: 45 },
      { roleName: "Association", percentage: 30 },
      { roleName: "Agent", percentage: 25 }
    ]
  }
];

const PERCENTAGE_PRESETS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];

export default function RoleAssignmentModal({
  merchant,
  monthlyData,
  month,
  isOpen,
  onClose,
  onSuccess,
}: RoleAssignmentModalProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showTemplates, setShowTemplates] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles } = useQuery({
    queryKey: ["/api/roles"],
  });

  const { data: existingAssignments } = useQuery({
    queryKey: ["/api/assignments", merchant?.id, month],
    queryFn: () => apiRequest(`/api/assignments/${merchant?.id}/${month}`),
    enabled: !!merchant?.id && !!month && isOpen,
  });

  const saveAssignmentsMutation = useMutation({
    mutationFn: async (assignmentsData: Assignment[]) => {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignments: assignmentsData.map((assignment) => ({
            merchantId: merchant.id,
            roleId: assignment.roleId,
            percentage: assignment.percentage.toString(),
            month,
          })),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save assignments");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Assignments saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments/merchants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save assignments",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize assignments from existing data
  useEffect(() => {
    if (existingAssignments && existingAssignments.length > 0) {
      setAssignments(
        existingAssignments.map((assignment: any) => ({
          roleId: assignment.roleId,
          percentage: parseFloat(assignment.percentage),
          role: assignment.role,
        }))
      );
    } else {
      // Start with one empty assignment
      setAssignments([{ roleId: 0, percentage: 0 }]);
    }
  }, [existingAssignments]);

  const addAssignment = () => {
    setAssignments([...assignments, { roleId: 0, percentage: 0 }]);
  };

  const removeAssignment = (index: number) => {
    if (assignments.length > 1) {
      setAssignments(assignments.filter((_, i) => i !== index));
    }
  };

  const updateAssignment = (index: number, field: keyof Assignment, value: any) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], [field]: value };
    setAssignments(updated);
  };

  const getTotalPercentage = () => {
    return assignments.reduce((sum, assignment) => sum + (assignment.percentage || 0), 0);
  };

  const getValidationStatus = () => {
    const total = getTotalPercentage();
    if (Math.abs(total - 100) < 0.01) {
      return { isValid: true, message: "Split validation passed - all percentages total 100%" };
    }
    return { 
      isValid: false, 
      message: `Split total is ${total.toFixed(2)}% - must equal 100%` 
    };
  };

  const canSave = () => {
    const validation = getValidationStatus();
    const hasValidAssignments = assignments.every(
      (assignment) => assignment.roleId > 0 && assignment.percentage > 0
    );
    return validation.isValid && hasValidAssignments;
  };

  const handleSave = () => {
    if (canSave()) {
      saveAssignmentsMutation.mutate(assignments);
    }
  };

  const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    const newAssignments = template.assignments.map(templateAssignment => {
      const role = roles?.find((r: any) => r.name.toLowerCase().includes(templateAssignment.roleName.toLowerCase()));
      return {
        roleId: role?.id || 0,
        percentage: templateAssignment.percentage,
        role: role
      };
    });
    setAssignments(newAssignments);
    setShowTemplates(false);
    toast({ title: `Applied ${template.name} template` });
  };

  const autoBalance = () => {
    const filledAssignments = assignments.filter(a => a.roleId > 0);
    if (filledAssignments.length === 0) return;
    
    const totalFilled = filledAssignments.reduce((sum, a) => sum + a.percentage, 0);
    const remaining = 100 - totalFilled;
    const emptySlots = assignments.filter(a => a.roleId > 0 && a.percentage === 0);
    
    if (emptySlots.length > 0) {
      const balancePerSlot = remaining / emptySlots.length;
      const updated = assignments.map(a => {
        if (a.roleId > 0 && a.percentage === 0) {
          return { ...a, percentage: Math.max(0, balancePerSlot) };
        }
        return a;
      });
      setAssignments(updated);
      toast({ title: "Auto-balanced remaining percentage" });
    }
  };

  const setQuickPercentage = (index: number, percentage: number) => {
    updateAssignment(index, "percentage", percentage);
  };

  const getRolesByType = (type: string) => {
    return roles?.filter((role: any) => role.type === type) || [];
  };

  const getUsedRoleIds = () => {
    return assignments.map((assignment) => assignment.roleId);
  };

  const validation = getValidationStatus();

  // Log data to debug
  console.log('RoleAssignmentModal - merchant:', merchant);
  console.log('RoleAssignmentModal - monthlyData:', monthlyData);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-zinc-900 border-yellow-400/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg text-white">Edit Role Assignments - {merchant?.mid}</DialogTitle>
              <p className="text-sm text-gray-400 mt-1">
                Manage commission splits for this MID. Total must equal 100% of monthly revenue.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-zinc-800">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Templates */}
          {showTemplates && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-400">Quick Assignment Templates</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowTemplates(false)}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_TEMPLATES.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                    className="justify-start h-auto p-3 bg-zinc-800 hover:bg-zinc-700 border-blue-500/30 text-white"
                  >
                    <div className="text-left">
                      <div className="flex items-center">
                        <span className="mr-2">{template.icon}</span>
                        <span className="font-medium">{template.name}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {template.assignments.map(a => `${a.roleName}: ${a.percentage}%`).join(', ')}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Merchant Details */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-white">
                    {merchant?.dba || merchant?.legalName || "Unknown Merchant"}
                  </div>
                  <div className="text-sm text-gray-400">
                    MID: <span className="font-mono text-yellow-400">{merchant?.mid}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Processor</div>
                  <div className="font-medium text-white">{monthlyData?.processor?.name || "Unknown"}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-yellow-500/30">
                <div className="bg-zinc-800/50 p-3 rounded border border-yellow-500/20">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Transactions</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {monthlyData?.transactionCount || monthlyData?.txnCount || "0"}
                  </div>
                </div>
                <div className="bg-zinc-800/50 p-3 rounded border border-yellow-500/20">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Net Revenue</div>
                  <div className="text-2xl font-bold text-green-400 mt-1">
                    ${parseFloat(monthlyData?.net || monthlyData?.netRevenue || "0").toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role Assignments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Role Assignments</h3>
              <div className="flex items-center space-x-2">
                <Button onClick={autoBalance} size="sm" variant="outline" title="Auto-balance empty percentages" className="border-gray-600 text-gray-300 hover:bg-zinc-700">
                  <Target className="mr-2 h-4 w-4" />
                  Auto Balance
                </Button>
                {!showTemplates && (
                  <Button onClick={() => setShowTemplates(true)} size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-zinc-700">
                    <Zap className="mr-2 h-4 w-4" />
                    Templates
                  </Button>
                )}
                <Button onClick={addAssignment} size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-zinc-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Role
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {assignments.map((assignment, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-yellow-400/20 rounded-lg bg-zinc-800/50">
                  <div className="flex-1">
                    <Label className="text-sm text-gray-300">Role</Label>
                    <Select
                      value={assignment.roleId.toString()}
                      onValueChange={(value) => {
                        const roleId = parseInt(value);
                        const role = roles?.find((r: any) => r.id === roleId);
                        updateAssignment(index, "roleId", roleId);
                        updateAssignment(index, "role", role);
                      }}
                    >
                      <SelectTrigger className="bg-zinc-800 border-yellow-400/30 text-white">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-yellow-400/30">
                        <optgroup label="Company">
                          {getRolesByType("company").map((role: any) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </optgroup>
                        <optgroup label="Sales Manager">
                          {getRolesByType("sales_manager").map((role: any) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </optgroup>
                        <optgroup label="Agent">
                          {getRolesByType("agent").map((role: any) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </optgroup>
                        <optgroup label="Partner">
                          {getRolesByType("partner").map((role: any) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </optgroup>
                        <optgroup label="Association">
                          {getRolesByType("association").map((role: any) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </optgroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-32">
                    <Label className="text-sm text-gray-300">Percentage</Label>
                    <div className="space-y-1">
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.01"
                        value={assignment.percentage || ""}
                        onChange={(e) =>
                          updateAssignment(index, "percentage", parseFloat(e.target.value) || 0)
                        }
                        className="bg-zinc-800 border-yellow-400/30 text-white"
                      />
                      <div className="flex flex-wrap gap-1">
                        {[10, 20, 25, 30, 50].map(preset => (
                          <Button
                            key={preset}
                            variant="ghost"
                            size="sm"
                            onClick={() => setQuickPercentage(index, preset)}
                            className="text-xs h-6 px-2 bg-zinc-700 hover:bg-zinc-600 text-gray-300"
                          >
                            {preset}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {assignments.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAssignment(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Split Validation */}
          <div className={`border rounded-lg p-4 ${
            validation.isValid ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calculator className={`mr-2 h-5 w-5 ${
                  validation.isValid ? "text-green-400" : "text-yellow-400"
                }`} />
                <span className="text-sm font-medium text-white">Total Split:</span>
              </div>
              <div className={`text-lg font-bold ${
                validation.isValid ? "text-green-400" : "text-yellow-400"
              }`}>
                {getTotalPercentage().toFixed(2)}%
              </div>
            </div>
            <div className={`mt-2 text-xs ${
              validation.isValid ? "text-green-300" : "text-yellow-300"
            }`}>
              {validation.isValid ? "✓ " : "⚠ "}{validation.message}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-yellow-400/20">
            <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-zinc-700">
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!canSave() || saveAssignmentsMutation.isPending}
              className="bg-yellow-400 text-black hover:bg-yellow-500"
            >
              {saveAssignmentsMutation.isPending ? "Saving..." : "Save Assignment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
