import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  Circle, 
  Lock, 
  Upload, 
  Database, 
  Users, 
  Shield,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Calendar,
  FileCheck
} from "lucide-react";
import { RealDataUploadGrid } from "@/components/RealDataUploadGrid";
import IntelligentRoleAssignment from "@/components/IntelligentRoleAssignment";
import { useToast } from "@/hooks/use-toast";
import Breadcrumbs from "@/components/Breadcrumbs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: typeof Upload;
  status: 'completed' | 'in_progress' | 'locked' | 'pending';
  progress?: number;
}

interface ProcessorStatus {
  processorId: number;
  processorName: string;
  uploadStatus: 'validated' | 'needs_upload' | 'error';
  leadSheetStatus: 'validated' | 'needs_upload' | 'error';
  compilationStatus: 'compiled' | 'pending';
  assignmentStatus: 'validated' | 'assigned' | 'pending';
  auditStatus: 'passed' | 'pending' | 'failed';
  recordCount: number;
}

interface WorkflowStatusData {
  processors: ProcessorStatus[];
  summary: {
    totalRecords: number;
    totalRevenue: number;
    uploadedProcessors: number;
    totalProcessors: number;
  };
  leadSheetData?: {
    recordCount: number;
  };
  month: string;
}

export default function ResidualsWorkflow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Month selection
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  // Generate month options
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = 12; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({ value, label });
    }
    
    for (let i = 1; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({ value, label });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  // Fetch workflow status
  const { data: workflowData, isLoading, refetch } = useQuery<WorkflowStatusData>({
    queryKey: ['/api/real-data/status', selectedMonth],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Fetch assignment status
  const { data: assignmentData } = useQuery({
    queryKey: ['/api/residuals-workflow/role-assignment/unassigned', selectedMonth],
    enabled: (workflowData?.summary?.totalRecords || 0) > 0,
  });

  // Calculate workflow state
  const workflowState = useMemo(() => {
    if (!workflowData) {
      return {
        step1Complete: false,
        step2Complete: false,
        step3Complete: false,
        step4Complete: false,
        currentStep: 1,
        overallProgress: 0,
      };
    }

    const { processors, summary, leadSheetData } = workflowData;
    
    // Step 1: All 9 processors + lead sheet uploaded
    const allProcessorsUploaded = processors.every(p => p.uploadStatus === 'validated');
    const leadSheetUploaded = processors.some(p => p.leadSheetStatus === 'validated');
    const step1Complete = allProcessorsUploaded && leadSheetUploaded && (summary?.totalRecords || 0) > 0;

    // Step 2: Master data compiled - compilation happens automatically after upload
    // Since backend auto-compiles on upload, if Step 1 is done and we have records, compilation is done
    const step2Complete = step1Complete && (summary?.totalRecords || 0) > 0;

    // Step 3: All assignments complete - ONLY if data is loaded AND no unassigned
    const assignmentDataLoaded = assignmentData !== undefined;
    const newUnassignedCount = (assignmentData as any)?.summary?.newUnassigned;
    const allAssignmentsComplete = assignmentDataLoaded && newUnassignedCount === 0;
    const step3Complete = step2Complete && allAssignmentsComplete;

    // Step 4: Audit passed
    const allAuditsPassed = processors.every(p => p.auditStatus === 'passed');
    const step4Complete = step3Complete && allAuditsPassed;

    // Determine current step
    let currentStep = 1;
    if (step1Complete && !step2Complete) currentStep = 2;
    else if (step2Complete && !step3Complete) currentStep = 3;
    else if (step3Complete && !step4Complete) currentStep = 4;
    else if (step4Complete) currentStep = 5; // Completed

    // Calculate overall progress
    let progress = 0;
    if (step1Complete) progress += 25;
    if (step2Complete) progress += 25;
    if (step3Complete) progress += 25;
    if (step4Complete) progress += 25;

    return {
      step1Complete,
      step2Complete,
      step3Complete,
      step4Complete,
      currentStep,
      overallProgress: progress,
      uploadedProcessors: summary?.uploadedProcessors || 0,
      totalProcessors: summary?.totalProcessors || 9,
      totalRecords: summary?.totalRecords || 0,
      totalRevenue: summary?.totalRevenue || 0,
      newUnassigned: (assignmentData as any)?.summary?.newUnassigned ?? null,
      previouslyAssigned: (assignmentData as any)?.summary?.previouslyAssigned ?? null,
      assignmentDataLoaded: assignmentData !== undefined,
    };
  }, [workflowData, assignmentData]);

  // Auto-expand current step
  useEffect(() => {
    if (expandedStep === null) {
      setExpandedStep(workflowState.currentStep);
    }
  }, [workflowState.currentStep]);

  const getStepStatus = (stepNumber: number): 'completed' | 'in_progress' | 'locked' | 'pending' => {
    const { step1Complete, step2Complete, step3Complete, step4Complete, currentStep } = workflowState;
    
    if (stepNumber === 1) {
      return step1Complete ? 'completed' : 'in_progress';
    } else if (stepNumber === 2) {
      if (!step1Complete) return 'locked';
      return step2Complete ? 'completed' : 'in_progress';
    } else if (stepNumber === 3) {
      if (!step2Complete) return 'locked';
      return step3Complete ? 'completed' : 'in_progress';
    } else if (stepNumber === 4) {
      if (!step3Complete) return 'locked';
      return step4Complete ? 'completed' : 'in_progress';
    }
    return 'pending';
  };

  const getStepIcon = (status: string) => {
    if (status === 'completed') return CheckCircle2;
    if (status === 'locked') return Lock;
    return Circle;
  };

  const getStepColor = (status: string) => {
    if (status === 'completed') return 'text-green-600 dark:text-green-400';
    if (status === 'in_progress') return 'text-yellow-600 dark:text-yellow-400';
    if (status === 'locked') return 'text-gray-400 dark:text-gray-600';
    return 'text-gray-400';
  };

  const steps: WorkflowStep[] = [
    {
      id: 1,
      title: 'Upload Files',
      description: 'Upload 9 processor files + lead sheet',
      icon: Upload,
      status: getStepStatus(1),
    },
    {
      id: 2,
      title: 'Compile Master Data',
      description: 'Cross-reference and merge into master dataset',
      icon: Database,
      status: getStepStatus(2),
    },
    {
      id: 3,
      title: 'Assign Roles',
      description: 'Auto-populate + manual assignments',
      icon: Users,
      status: getStepStatus(3),
    },
    {
      id: 4,
      title: 'Final Audit',
      description: 'Validate splits and check for issues',
      icon: Shield,
      status: getStepStatus(4),
    },
  ];

  // Run audit mutation
  const runAuditMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/residuals-workflow/audit/${selectedMonth}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Audit failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Audit Complete",
        description: "All validations passed successfully",
      });
      refetch();
    },
  });

  const toggleStep = (stepId: number) => {
    const stepStatus = getStepStatus(stepId);
    if (stepStatus === 'locked') {
      toast({
        title: "Step Locked",
        description: "Complete previous steps first",
        variant: "destructive",
      });
      return;
    }
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const isFullyComplete = workflowState.step4Complete;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Breadcrumbs 
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Residuals Workflow", href: "/residuals-workflow" }
            ]} 
          />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="heading-workflow">
                Residuals Processing Workflow
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Follow the guided steps to process monthly residuals data
              </p>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]" data-testid="select-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overall Progress Card */}
        <Card className="border-2 border-yellow-500 dark:border-yellow-600 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500 dark:bg-yellow-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-black" />
                </div>
                <div>
                  <CardTitle className="text-2xl" data-testid="text-month-title">
                    {monthOptions.find(m => m.value === selectedMonth)?.label} Processing
                  </CardTitle>
                  <CardDescription>
                    {isFullyComplete ? '🎉 Complete and saved to database' : 'In progress'}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400" data-testid="text-progress-percent">
                  {workflowState.overallProgress}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Complete</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={workflowState.overallProgress} className="h-3" data-testid="progress-overall" />
            
            {/* Quick Stats */}
            {(workflowState.totalRecords || 0) > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-records">
                    {(workflowState.totalRecords || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-uploaded-processors">
                    {workflowState.uploadedProcessors}/{workflowState.totalProcessors}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Processors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-revenue">
                    ${workflowState.totalRevenue?.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-unassigned-count">
                    {workflowState.assignmentDataLoaded ? (workflowState.newUnassigned ?? 0) : '...'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Need Assignment</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completion Celebration */}
        {isFullyComplete && (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-500">
            <Sparkles className="h-5 w-5 text-green-600" />
            <AlertDescription className="ml-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100" data-testid="text-completion-message">
                    🎉 {monthOptions.find(m => m.value === selectedMonth)?.label} Processing Complete!
                  </p>
                  <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                    All {workflowState.totalRecords || 0} merchants assigned, validated, and saved to database
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-green-500 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900" data-testid="button-view-report">
                    <FileCheck className="w-4 h-4 mr-2" />
                    View Report
                  </Button>
                  <Button variant="outline" className="border-green-500 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900" data-testid="button-export-data">
                    Export Data
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Workflow Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const StepIcon = getStepIcon(step.status);
            const isExpanded = expandedStep === step.id;
            const isLocked = step.status === 'locked';
            const isComplete = step.status === 'completed';
            const isCurrent = workflowState.currentStep === step.id;

            return (
              <Card 
                key={step.id}
                className={`
                  transition-all duration-200
                  ${isCurrent && !isComplete ? 'border-2 border-yellow-500 shadow-lg' : ''}
                  ${isComplete ? 'border-green-300 dark:border-green-700' : ''}
                  ${isLocked ? 'opacity-60' : ''}
                `}
                data-testid={`card-step-${step.id}`}
              >
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => toggleStep(step.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isComplete ? 'bg-green-100 dark:bg-green-900' :
                        isCurrent ? 'bg-yellow-100 dark:bg-yellow-900' :
                        'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <StepIcon className={`w-6 h-6 ${getStepColor(step.status)}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Step {step.id}: {step.title}
                          </h3>
                          {isComplete && (
                            <Badge className="bg-green-600 text-white">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Complete
                            </Badge>
                          )}
                          {isCurrent && !isComplete && (
                            <Badge className="bg-yellow-600 text-white">
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Current
                            </Badge>
                          )}
                          {isLocked && (
                            <Badge variant="outline" className="text-gray-500">
                              <Lock className="w-3 h-3 mr-1" />
                              Locked
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && !isLocked && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-6">
                      {/* Step 1: Upload */}
                      {step.id === 1 && (
                        <div>
                          <RealDataUploadGrid 
                            selectedMonth={selectedMonth.split('-')[1]} 
                            selectedYear={selectedMonth.split('-')[0]} 
                          />
                          {workflowState.step1Complete && (
                            <Alert className="mt-4 bg-green-50 dark:bg-green-950 border-green-500">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <AlertDescription className="ml-2 text-green-900 dark:text-green-100">
                                <p className="font-semibold">✓ All files uploaded successfully</p>
                                <p className="text-sm mt-1">
                                  → {(workflowState.totalRecords || 0).toLocaleString()} records saved to database
                                </p>
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}

                      {/* Step 2: Compile */}
                      {step.id === 2 && (
                        <div className="space-y-4">
                          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-500">
                            <Database className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="ml-2 text-blue-900 dark:text-blue-100">
                              <p className="font-semibold">Automatic Master Dataset Compilation</p>
                              <p className="text-sm mt-1">
                                This step happens automatically when all files are uploaded. The system cross-references processor data with the lead sheet and creates a unified master dataset.
                              </p>
                            </AlertDescription>
                          </Alert>
                          
                          {workflowState.step2Complete ? (
                            <Alert className="bg-green-50 dark:bg-green-950 border-green-500">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <AlertDescription className="ml-2 text-green-900 dark:text-green-100">
                                <p className="font-semibold">✓ Master dataset compiled and saved</p>
                                <p className="text-sm mt-1">
                                  → {(workflowState.totalRecords || 0).toLocaleString()} merchants cross-referenced and saved to database
                                </p>
                                <p className="text-sm mt-1 text-green-600">
                                  Ready for role assignment →
                                </p>
                              </AlertDescription>
                            </Alert>
                          ) : workflowState.step1Complete ? (
                            <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-500">
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                              <AlertDescription className="ml-2 text-yellow-900 dark:text-yellow-100">
                                <p className="font-semibold">Compiling data...</p>
                                <p className="text-sm mt-1">
                                  Cross-referencing processor files with lead sheet
                                </p>
                              </AlertDescription>
                            </Alert>
                          ) : null}
                        </div>
                      )}

                      {/* Step 3: Assignment */}
                      {step.id === 3 && (
                        <div>
                          {!workflowState.assignmentDataLoaded ? (
                            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-500">
                              <AlertCircle className="h-4 w-4 text-blue-600" />
                              <AlertDescription className="ml-2 text-blue-900 dark:text-blue-100">
                                <p className="font-semibold">Loading assignment data...</p>
                                <p className="text-sm mt-1">
                                  Please wait while we fetch merchant assignment status
                                </p>
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <>
                              <IntelligentRoleAssignment selectedMonth={selectedMonth} />
                              {workflowState.step3Complete && (
                                <Alert className="mt-4 bg-green-50 dark:bg-green-950 border-green-500">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <AlertDescription className="ml-2 text-green-900 dark:text-green-100">
                                    <p className="font-semibold">✓ All assignments complete</p>
                                    <p className="text-sm mt-1">
                                      → All merchants have role assignments saved to database
                                    </p>
                                  </AlertDescription>
                                </Alert>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Step 4: Audit */}
                      {step.id === 4 && (
                        <div className="space-y-4">
                          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-500">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="ml-2 text-blue-900 dark:text-blue-100">
                              <p className="font-semibold">Final Validation</p>
                              <p className="text-sm mt-1">
                                Run audit to verify all splits add to 100% and flag any issues
                              </p>
                            </AlertDescription>
                          </Alert>

                          <Button 
                            onClick={() => runAuditMutation.mutate()}
                            disabled={runAuditMutation.isPending}
                            data-testid="button-run-audit"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            {runAuditMutation.isPending ? 'Running Audit...' : 'Run Final Audit'}
                          </Button>

                          {workflowState.step4Complete && (
                            <Alert className="bg-green-50 dark:bg-green-950 border-green-500">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <AlertDescription className="ml-2 text-green-900 dark:text-green-100">
                                <p className="font-semibold">✓ Audit passed</p>
                                <p className="text-sm mt-1">
                                  → All validations passed with 0 issues
                                </p>
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
