import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Breadcrumbs from '@/components/Breadcrumbs';
import ClickableCard from '@/components/ClickableCard';
import { 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  XCircle,
  Edit3,
  Eye,
  Calendar,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface MonthlyAuditStatus {
  processor: string;
  status: 'needs_upload' | 'uploaded' | 'verified' | 'error' | 'corrected';
  recordCount: number;
  totalRevenue: string;
  uploadDate?: string;
  verificationDate?: string;
  hasErrors: boolean;
  auditId?: string;
}

interface ValidationError {
  id: string;
  errorType: string;
  severity: 'error' | 'warning' | 'info';
  fieldName?: string;
  expectedValue?: string;
  actualValue?: string;
  rowNumber?: number;
  errorMessage: string;
  isResolved: boolean;
  userCorrection?: string;
}

export default function MonthlyAudit() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedProcessor, setSelectedProcessor] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false);
  const [selectedError, setSelectedError] = useState<ValidationError | null>(null);
  const [correctionValue, setCorrectionValue] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get monthly audit status
  const { data: auditStatus, isLoading } = useQuery({
    queryKey: ['/api/audit/status', selectedMonth],
    queryFn: async () => {
      const [year, month] = selectedMonth.split('-');
      const response = await fetch(`/api/audit/status/${year}/${month}`);
      if (!response.ok) throw new Error('Failed to fetch audit status');
      return response.json();
    }
  });

  // Get validation errors for selected processor
  const { data: validationErrors } = useQuery({
    queryKey: ['/api/audit/errors', selectedProcessor],
    queryFn: async () => {
      if (!selectedProcessor) return null;
      const processorAudit = auditStatus?.data?.find((a: MonthlyAuditStatus) => a.processor === selectedProcessor);
      if (!processorAudit?.auditId) return null;
      
      const response = await fetch(`/api/audit/errors/${processorAudit.auditId}`);
      if (!response.ok) throw new Error('Failed to fetch validation errors');
      return response.json();
    },
    enabled: !!selectedProcessor && !!auditStatus?.data
  });

  // Apply correction mutation
  const applyCorrectionMutation = useMutation({
    mutationFn: (correctionData: any) => apiRequest('/api/audit/correction', 'POST', correctionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/audit/errors'] });
      setShowCorrectionDialog(false);
      setCorrectionValue('');
      setCorrectionReason('');
      toast({
        title: "Correction Applied",
        description: "Data correction has been applied successfully"
      });
    }
  });

  // Verify audit mutation
  const verifyAuditMutation = useMutation({
    mutationFn: ({ auditId, notes }: { auditId: string; notes?: string }) => 
      apiRequest(`/api/audit/verify/${auditId}`, 'POST', { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/audit/status'] });
      toast({
        title: "Audit Verified",
        description: "Monthly audit has been verified and completed"
      });
    }
  });

  const getStatusIcon = (status: MonthlyAuditStatus['status']) => {
    switch (status) {
      case 'needs_upload': return <Upload className="h-4 w-4 text-gray-500" />;
      case 'uploaded': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'corrected': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: MonthlyAuditStatus['status']) => {
    const variants = {
      'needs_upload': 'destructive',
      'uploaded': 'secondary',
      'verified': 'default',
      'error': 'destructive',
      'corrected': 'secondary'
    } as const;

    const labels = {
      'needs_upload': 'Needs Upload',
      'uploaded': 'Needs Review',
      'verified': 'Verified',
      'error': 'Has Errors',
      'corrected': 'Corrected'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleViewErrors = (processor: string) => {
    setSelectedProcessor(processor);
    setShowErrorDialog(true);
  };

  const handleCorrectError = (error: ValidationError) => {
    setSelectedError(error);
    setCorrectionValue(error.actualValue || '');
    setShowCorrectionDialog(true);
  };

  const handleApplyCorrection = () => {
    if (!selectedError) return;
    
    applyCorrectionMutation.mutate({
      sessionId: 'current-session', // This would come from the upload session
      errorId: selectedError.id,
      fieldName: selectedError.fieldName || '',
      originalValue: selectedError.actualValue || '',
      correctedValue: correctionValue,
      correctionReason: correctionReason
    });
  };

  const handleVerifyAudit = (processor: string) => {
    const processorAudit = auditStatus?.data?.find((a: MonthlyAuditStatus) => a.processor === processor);
    if (!processorAudit?.auditId) return;
    
    verifyAuditMutation.mutate({
      auditId: processorAudit.auditId,
      notes: `Verified by user on ${new Date().toISOString()}`
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading audit status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "Data Upload", href: "/data-upload" },
            { label: "Monthly Audit", href: "/monthly-audit", isActive: true }
          ]} 
        />

        {/* Header */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-yellow-400 to-yellow-500 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-black/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-black">Monthly Data Audit</h1>
                    <p className="text-black/80">Verify and validate uploaded processor data</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="month-select" className="text-black font-medium">Month:</Label>
                  <Input
                    id="month-select"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-40 bg-white/90 border-black/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {auditStatus?.data?.map((audit: MonthlyAuditStatus) => (
            <ClickableCard
              key={audit.processor}
              title={audit.processor}
              href={`/data-upload?processor=${audit.processor}&month=${selectedMonth}`}
              icon={<Building2 className="h-5 w-5" />}
              value={`$${parseFloat(audit.totalRevenue).toLocaleString()}`}
              description={`${audit.recordCount} records`}
              badge={getStatusBadge(audit.status)}
              auditStatus={audit.status}
              monthlyData={true}
              className="hover:border-yellow-400"
            />
          ))}
        </div>

        {/* Detailed Status Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detailed Audit Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Processor</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Records</th>
                    <th className="text-left p-4">Revenue</th>
                    <th className="text-left p-4">Upload Date</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auditStatus?.data?.map((audit: MonthlyAuditStatus) => (
                    <tr key={audit.processor} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-4 font-medium">{audit.processor}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(audit.status)}
                          {getStatusBadge(audit.status)}
                        </div>
                      </td>
                      <td className="p-4">{audit.recordCount.toLocaleString()}</td>
                      <td className="p-4">${parseFloat(audit.totalRevenue).toLocaleString()}</td>
                      <td className="p-4">
                        {audit.uploadDate 
                          ? new Date(audit.uploadDate).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {audit.hasErrors && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewErrors(audit.processor)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              View Errors
                            </Button>
                          )}
                          {(audit.status === 'uploaded' || audit.status === 'corrected') && (
                            <Button
                              size="sm"
                              onClick={() => handleVerifyAudit(audit.processor)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Error Details Dialog */}
        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Validation Errors - {selectedProcessor}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {validationErrors?.data?.map((error: ValidationError) => (
                <Card key={error.id} className={`border-l-4 ${
                  error.severity === 'error' ? 'border-l-red-500' : 
                  error.severity === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={error.severity === 'error' ? 'destructive' : 'secondary'}>
                            {error.severity.toUpperCase()}
                          </Badge>
                          {error.rowNumber && (
                            <Badge variant="outline">Row {error.rowNumber}</Badge>
                          )}
                        </div>
                        <p className="font-medium mb-1">{error.errorMessage}</p>
                        {error.fieldName && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">Field: {error.fieldName}</p>
                        )}
                        {error.actualValue && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">Current Value: {error.actualValue}</p>
                        )}
                        {error.expectedValue && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">Expected: {error.expectedValue}</p>
                        )}
                      </div>
                      {!error.isResolved && error.severity === 'error' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCorrectError(error)}
                          className="ml-4 border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Correct
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Correction Dialog */}
        <Dialog open={showCorrectionDialog} onOpenChange={setShowCorrectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Correct Data Error</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Field: {selectedError?.fieldName}</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedError?.errorMessage}</p>
              </div>
              <div>
                <Label htmlFor="correction-value">Corrected Value</Label>
                <Input
                  id="correction-value"
                  value={correctionValue}
                  onChange={(e) => setCorrectionValue(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="correction-reason">Correction Reason (Optional)</Label>
                <Textarea
                  id="correction-reason"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setShowCorrectionDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApplyCorrection} disabled={!correctionValue.trim()}>
                  Apply Correction
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}