import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { X, Zap, Users, Calculator } from "lucide-react";

interface BulkAssignmentModalProps {
  merchants: any[];
  month: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BulkAssignment {
  roleId: number;
  percentage: number;
  role?: any;
}

const BULK_TEMPLATES = [
  {
    name: "Standard Company Split",
    assignments: [
      { roleName: "Company", percentage: 60 },
      { roleName: "Agent", percentage: 40 }
    ]
  },
  {
    name: "Agent Heavy",
    assignments: [
      { roleName: "Company", percentage: 50 },
      { roleName: "Agent", percentage: 50 }
    ]
  },
  {
    name: "Three-Way Split",
    assignments: [
      { roleName: "Company", percentage: 50 },
      { roleName: "Agent", percentage: 30 },
      { roleName: "Sales Manager", percentage: 20 }
    ]
  }
];

export default function BulkAssignmentModal({
  merchants,
  month,
  isOpen,
  onClose,
  onSuccess,
}: BulkAssignmentModalProps) {
  const [selectedMerchants, setSelectedMerchants] = useState<number[]>([]);
  const [assignments, setAssignments] = useState<BulkAssignment[]>([
    { roleId: 0, percentage: 0 }
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles } = useQuery({
    queryKey: ["/api/roles"],
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async () => {
      const requests = selectedMerchants.map(merchantId => {
        return fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignments: assignments.map((assignment) => ({
              merchantId,
              roleId: assignment.roleId,
              percentage: assignment.percentage.toString(),
              month,
            })),
          }),
        });
      });

      const results = await Promise.all(requests);
      const failed = results.filter(r => !r.ok);
      
      if (failed.length > 0) {
        throw new Error(`Failed to assign roles to ${failed.length} merchants`);
      }
      
      return { success: true, count: selectedMerchants.length };
    },
    onSuccess: (data) => {
      toast({ 
        title: "Bulk assignment completed", 
        description: `Applied role splits to ${data.count} merchants` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk assignment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const applyTemplate = (template: typeof BULK_TEMPLATES[0]) => {
    const newAssignments = template.assignments.map(templateAssignment => {
      const role = roles?.find((r: any) => r.name.toLowerCase().includes(templateAssignment.roleName.toLowerCase()));
      return {
        roleId: role?.id || 0,
        percentage: templateAssignment.percentage,
        role: role
      };
    });
    setAssignments(newAssignments);
    toast({ title: `Applied ${template.name} template` });
  };

  const toggleMerchant = (merchantId: number) => {
    setSelectedMerchants(prev => 
      prev.includes(merchantId) 
        ? prev.filter(id => id !== merchantId)
        : [...prev, merchantId]
    );
  };

  const selectAll = () => {
    const allIds = merchants.map(m => m.merchants?.id || m.merchant?.id || m.id);
    setSelectedMerchants(allIds);
  };

  const selectNone = () => {
    setSelectedMerchants([]);
  };

  const addAssignment = () => {
    setAssignments([...assignments, { roleId: 0, percentage: 0 }]);
  };

  const updateAssignment = (index: number, field: keyof BulkAssignment, value: any) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], [field]: value };
    setAssignments(updated);
  };

  const getTotalPercentage = () => {
    return assignments.reduce((sum, assignment) => sum + (assignment.percentage || 0), 0);
  };

  const canApply = () => {
    const total = getTotalPercentage();
    const hasValidAssignments = assignments.every(a => a.roleId > 0 && a.percentage > 0);
    const hasSelectedMerchants = selectedMerchants.length > 0;
    
    return Math.abs(total - 100) < 0.01 && hasValidAssignments && hasSelectedMerchants;
  };

  const handleApply = () => {
    if (canApply()) {
      bulkAssignMutation.mutate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-zinc-900 border-yellow-400/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center text-white">
              <Users className="mr-2 h-5 w-5" />
              Bulk Role Assignment
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-zinc-800">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Templates */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-purple-400 mb-3">Quick Bulk Templates</h3>
            <div className="grid grid-cols-3 gap-2">
              {BULK_TEMPLATES.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template)}
                  className="justify-start h-auto p-3 bg-zinc-800 hover:bg-zinc-700 border-purple-500/30 text-white"
                >
                  <div className="text-left">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {template.assignments.map(a => `${a.percentage}%`).join(' / ')}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Role Assignments Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Configure Role Split</h3>
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
                        {["company", "sales_manager", "agent", "partner", "association"].map(type => (
                          <optgroup key={type} label={type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}>
                            {roles?.filter((role: any) => role.type === type).map((role: any) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </optgroup>
                        ))}
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
                            onClick={() => updateAssignment(index, "percentage", preset)}
                            className="text-xs h-6 px-2 bg-zinc-700 hover:bg-zinc-600 text-gray-300"
                          >
                            {preset}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {assignments.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssignments(assignments.filter((_, i) => i !== index))}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button onClick={addAssignment} variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-zinc-700">
                Add Role
              </Button>
            </div>

            {/* Split Validation */}
            <div className={`border rounded-lg p-3 ${
              Math.abs(getTotalPercentage() - 100) < 0.01 ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calculator className={`mr-2 h-4 w-4 ${
                    Math.abs(getTotalPercentage() - 100) < 0.01 ? "text-green-400" : "text-yellow-400"
                  }`} />
                  <span className="text-sm font-medium text-white">Total Split:</span>
                </div>
                <div className={`text-lg font-bold ${
                  Math.abs(getTotalPercentage() - 100) < 0.01 ? "text-green-400" : "text-yellow-400"
                }`}>
                  {getTotalPercentage().toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* Merchant Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Select Merchants ({selectedMerchants.length} selected)</h3>
              <div className="space-x-2">
                <Button onClick={selectAll} variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-zinc-700">Select All</Button>
                <Button onClick={selectNone} variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-zinc-700">Clear All</Button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto border border-yellow-400/20 rounded-lg bg-zinc-800/50">
              <div className="grid gap-2 p-4">
                {merchants.slice(0, 50).map((merchantData) => {
                  const merchant = merchantData.merchants || merchantData.merchant;
                  const monthlyData = merchantData.monthly_data || merchantData;
                  const merchantId = merchant?.id;
                  
                  return (
                    <div
                      key={merchantId}
                      className="flex items-center space-x-3 p-2 hover:bg-zinc-700 rounded cursor-pointer"
                      onClick={() => merchantId && toggleMerchant(merchantId)}
                    >
                      <Checkbox
                        checked={selectedMerchants.includes(merchantId)}
                        onCheckedChange={() => merchantId && toggleMerchant(merchantId)}
                        className="border-yellow-400/50"
                      />
                      <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                        <span className="font-mono text-white">{merchant?.mid}</span>
                        <span className="text-gray-300">{merchant?.dba || merchant?.legalName || "Unknown"}</span>
                        <span className="text-right text-white">${parseFloat(monthlyData?.net || "0").toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {merchants.length > 50 && (
                <div className="p-4 border-t border-yellow-400/20 bg-zinc-800 text-sm text-gray-400 text-center">
                  Showing first 50 merchants. Use filters to narrow down the list.
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-yellow-400/20">
            <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-zinc-700">
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              disabled={!canApply() || bulkAssignMutation.isPending}
              className="bg-yellow-400 text-black hover:bg-yellow-500"
            >
              {bulkAssignMutation.isPending 
                ? "Applying..." 
                : `Apply to ${selectedMerchants.length} Merchants`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}