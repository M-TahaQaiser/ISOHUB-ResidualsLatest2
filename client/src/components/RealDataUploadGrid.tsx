import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Upload, FileSpreadsheet, Download, MinusCircle, Info, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

interface ProcessorStatus {
  processorId: number;
  processorName: string;
  month: string;
  uploadStatus: 'validated' | 'needs_upload';
  leadSheetStatus: 'validated' | 'needs_upload';
  compilationStatus: 'compiled' | 'pending';
  assignmentStatus: 'pending';
  auditStatus: 'passed' | 'pending';
  recordCount: number;
  totalRevenue: number;
  totalVolume: number;
  totalTransactions: number;
  fileName: string | null;
  fileSize: number | null;
  validationMessage: string;
  hasNoMidDeclaration?: boolean;
  noMidDeclaration?: {
    reason: string;
    declaredBy: string;
    declaredAt: string;
  };
}

interface DataSummary {
  totalRecords: number;
  totalRevenue: number;
  totalVolume: number;
  totalTransactions: number;
  uploadedProcessors: number;
  totalProcessors: number;
}

interface RealDataResponse {
  success: boolean;
  month: string;
  processors: ProcessorStatus[];
  summary: DataSummary;
  leadSheetData?: {
    recordCount: number;
  };
}

interface RealDataUploadGridProps {
  selectedMonth: string;
  selectedYear: string;
}

export function RealDataUploadGrid({ selectedMonth, selectedYear }: RealDataUploadGridProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedProcessor, setExpandedProcessor] = useState<number | null>(null);

  const monthKey = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
  const currentUser = localStorage.getItem('username') || 'admin';
  
  // Auto-refresh to ensure UI updates after uploads (reduced frequency to avoid rate limiting)
  useAutoRefresh(monthKey, 10000); // Refresh every 10 seconds

  // Fetch real data status with rate limiting awareness
  const { data, isLoading, error, isFetching } = useQuery<RealDataResponse>({
    queryKey: ['/api/real-data/status', monthKey],
    queryFn: async () => {
      const response = await fetch(`/api/real-data/status/${monthKey}`, {
        cache: 'no-cache', // Disable browser cache
        headers: {
          'Cache-Control': 'no-cache', // Disable server cache
        },
      });
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - return cached data if available or wait
          throw new Error(`Rate limited - please wait before refreshing`);
        }
        throw new Error(`Failed to fetch data status: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!selectedMonth && !!selectedYear,
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Reduce refetch frequency
    staleTime: 5000, // Allow 5 seconds of stale data to reduce requests
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors
      if (error.message.includes('Rate limited')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Mutation to declare "No MIDs" for a processor
  const declareNoMidsMutation = useMutation({
    mutationFn: async ({ processorId, month, reason }: { processorId: number, month: string, reason?: string }) => {
      const response = await fetch('/api/real-data/declare-no-mids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processorId,
          month,
          declaredBy: currentUser,
          reason: reason || 'No new MIDs this month'
        })
      });
      if (!response.ok) throw new Error(`Failed to declare no MIDs: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/real-data/status', monthKey] });
      toast({
        title: "Success",
        description: "No MID declaration recorded successfully",
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

  // Mutation to remove "No MIDs" declaration
  const removeNoMidsMutation = useMutation({
    mutationFn: async ({ processorId, month }: { processorId: number, month: string }) => {
      const response = await fetch(`/api/real-data/remove-no-mids/${processorId}/${month}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`Failed to remove no MID declaration: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/real-data/status', monthKey] });
      toast({
        title: "Success", 
        description: "No MID declaration removed successfully",
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

  const getStatusIcon = (status: string, recordCount: number) => {
    if (recordCount > 0) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    switch (status) {
      case 'validated':
      case 'compiled':
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'needs_upload':
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string, recordCount: number) => {
    if (recordCount > 0) {
      return <Badge variant="default" className="bg-green-100 text-green-800">✅ Uploaded</Badge>;
    }
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading data status...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-600">Failed to load data status</p>
        <p className="text-sm text-gray-500 mt-2">Error: {error?.message || 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-2 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-yellow-600" />
            {data.month} Data Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatNumber(data.summary.totalRecords)}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalRevenue)}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.summary.uploadedProcessors}/{data.summary.totalProcessors}</div>
              <div className="text-sm text-gray-600">Processors Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatNumber(data.summary.totalTransactions)}</div>
              <div className="text-sm text-gray-600">Transactions</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {error && (error as Error).message?.includes('Rate limited') && "⚠️ Rate limited - please wait"}
              {error && !(error as Error).message?.includes('Rate limited') && "❌ Error loading data"}
              {isFetching && !error && "🔄 Refreshing data..."}
              {!isFetching && !error && "✅ Data current"}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (!isFetching) {
                  queryClient.invalidateQueries({ queryKey: ['/api/real-data/status', monthKey] });
                }
              }}
              disabled={isFetching || Boolean(error && (error as Error).message?.includes('Rate limited'))}
            >
              🔄 Refresh Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Master Lead Data Upload Card */}
      <Card className="border-2 border-blue-400 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            Master Lead Data (Step 1)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Upload the Master Lead Data spreadsheet containing MIDs and branch numbers to cross-reference with processor reports.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Status: {data.processors.some(p => p.leadSheetStatus === 'validated') ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Uploaded
                    </span>
                  ) : (
                    <span className="text-orange-600">Not uploaded</span>
                  )}
                </div>
              </div>
              
              {data.processors.some(p => p.leadSheetStatus === 'validated') && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-700">{data.leadSheetData?.recordCount || 0}</div>
                    <div className="text-green-600">Lead Records</div>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.csv,.xlsx,.xls';
                    input.onchange = async (e: any) => {
                      const file = e.target?.files[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('file', file);
                        
                        try {
                          const response = await fetch(`/api/residuals-workflow/upload-lead-sheet/${monthKey}`, {
                            method: 'POST',
                            body: formData
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            toast({
                              title: "Upload Successful",
                              description: `Master Lead Data uploaded successfully. ${result.results?.recordCount || 0} records processed.`,
                            });
                            // Clear cache and force refetch
                            queryClient.removeQueries({ queryKey: ['/api/real-data/status'] });
                            queryClient.invalidateQueries({ queryKey: ['/api/real-data/status', monthKey] });
                            // Force immediate refetch
                            setTimeout(() => {
                              queryClient.refetchQueries({ queryKey: ['/api/real-data/status', monthKey] });
                            }, 500);
                          } else {
                            throw new Error('Upload failed');
                          }
                        } catch (error) {
                          toast({
                            title: "Upload Failed",
                            description: "Failed to upload Master Lead Data. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4" />
                  {data.processors.some(p => p.leadSheetStatus === 'validated') ? 'Re-upload' : 'Upload'} Master Lead Data
                </Button>
                
                {data.processors.some(p => p.leadSheetStatus === 'validated') && (
                  <Button
                    variant="outline"
                    className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/residuals-workflow/delete-lead-sheet/${monthKey}`, {
                          method: 'DELETE'
                        });
                        
                        if (response.ok) {
                          toast({
                            title: "Lead Data Deleted",
                            description: "Master Lead Data has been deleted successfully.",
                          });
                          // Clear cache and force refetch
                          queryClient.removeQueries({ queryKey: ['/api/real-data/status'] });
                          queryClient.invalidateQueries({ queryKey: ['/api/real-data/status', monthKey] });
                          // Force immediate refetch
                          setTimeout(() => {
                            queryClient.refetchQueries({ queryKey: ['/api/real-data/status', monthKey] });
                          }, 500);
                        } else {
                          throw new Error('Delete failed');
                        }
                      } catch (error) {
                        toast({
                          title: "Delete Failed",
                          description: "Failed to delete Master Lead Data. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                    Delete Lead Data
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processor Grid */}
      <div className="grid gap-4">
        {data.processors.map((processor) => (
          <Card key={processor.processorId} className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{processor.processorName}</CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(processor.uploadStatus, processor.recordCount)}
                  {getStatusIcon(processor.uploadStatus, processor.recordCount)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Status Message */}
                <div className="text-sm font-medium text-gray-700">
                  {processor.validationMessage}
                </div>

                {/* Data Metrics (only show if data exists) */}
                {processor.recordCount > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-md">
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{formatNumber(processor.recordCount)}</div>
                      <div className="text-xs text-gray-600">Records</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{formatCurrency(processor.totalRevenue)}</div>
                      <div className="text-xs text-gray-600">Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{formatCurrency(processor.totalVolume)}</div>
                      <div className="text-xs text-gray-600">Volume</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-purple-600">{formatNumber(processor.totalTransactions)}</div>
                      <div className="text-xs text-gray-600">Transactions</div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {processor.recordCount > 0 ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedProcessor(expandedProcessor === processor.processorId ? null : processor.processorId)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.csv,.xlsx';
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement)?.files?.[0];
                            if (file) {
                              const formData = new FormData();
                              formData.append('file', file);
                              
                              try {
                                const response = await fetch(`/api/residuals-workflow/upload/${monthKey}/${processor.processorId}`, {
                                  method: 'POST',
                                  body: formData
                                });
                                
                                if (response.ok) {
                                  const result = await response.json();
                                  toast({
                                    title: "Re-upload Successful",
                                    description: `${processor.processorName} data re-uploaded successfully. ${result.results?.recordCount || 0} records processed.`,
                                  });
                                  // Clear cache and force refetch
                                  queryClient.removeQueries({ queryKey: ['/api/real-data/status'] });
                                  queryClient.invalidateQueries({ queryKey: ['/api/real-data/status', monthKey] });
                                  // Force immediate refetch
                                  setTimeout(() => {
                                    queryClient.refetchQueries({ queryKey: ['/api/real-data/status', monthKey] });
                                  }, 500);
                                } else {
                                  throw new Error('Re-upload failed');
                                }
                              } catch (error) {
                                toast({
                                  title: "Re-upload Failed",
                                  description: `Failed to re-upload ${processor.processorName} data. Please try again.`,
                                  variant: "destructive",
                                });
                              }
                            }
                          };
                          input.click();
                        }}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Re-upload
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/residuals-workflow/delete/${monthKey}/${processor.processorId}`, {
                              method: 'DELETE'
                            });
                            
                            if (response.ok) {
                              toast({
                                title: "Data Deleted",
                                description: `${processor.processorName} data has been deleted successfully.`,
                              });
                              // Clear cache and force refetch
                              queryClient.removeQueries({ queryKey: ['/api/real-data/status'] });
                              queryClient.invalidateQueries({ queryKey: ['/api/real-data/status', monthKey] });
                              // Force immediate refetch
                              setTimeout(() => {
                                queryClient.refetchQueries({ queryKey: ['/api/real-data/status', monthKey] });
                              }, 500);
                            } else {
                              throw new Error('Delete failed');
                            }
                          } catch (error) {
                            toast({
                              title: "Delete Failed",
                              description: `Failed to delete ${processor.processorName} data. Please try again.`,
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                        Delete Data
                      </Button>
                    </>
                  ) : processor.hasNoMidDeclaration ? (
                    <div className="flex gap-2 items-center">
                      <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle className="h-4 w-4" />
                        No new MIDs declared
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeNoMidsMutation.mutate({
                          processorId: processor.processorId,
                          month: monthKey
                        })}
                        disabled={removeNoMidsMutation.isPending}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <MinusCircle className="h-4 w-4 mr-1" />
                        Remove Declaration
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.csv,.xlsx';
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement)?.files?.[0];
                            if (file) {
                              const formData = new FormData();
                              formData.append('file', file);
                              
                              try {
                                const response = await fetch(`/api/residuals-workflow/upload/${monthKey}/${processor.processorId}`, {
                                  method: 'POST',
                                  body: formData
                                });
                                
                                if (response.ok) {
                                  const result = await response.json();
                                  toast({
                                    title: "Upload Successful",
                                    description: `${processor.processorName} data uploaded successfully. ${result.results?.recordCount || 0} records processed.`,
                                  });
                                  // Clear cache and force refetch
                                  queryClient.removeQueries({ queryKey: ['/api/real-data/status'] });
                                  queryClient.invalidateQueries({ queryKey: ['/api/real-data/status', monthKey] });
                                  // Force immediate refetch
                                  setTimeout(() => {
                                    queryClient.refetchQueries({ queryKey: ['/api/real-data/status', monthKey] });
                                  }, 500);
                                } else {
                                  throw new Error('Upload failed');
                                }
                              } catch (error) {
                                toast({
                                  title: "Upload Failed",
                                  description: `Failed to upload ${processor.processorName} data. Please try again.`,
                                  variant: "destructive",
                                });
                              }
                            }
                          };
                          input.click();
                        }}
                      >
                        <Upload className="h-4 w-4" />
                        Upload {processor.processorName} Data
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => declareNoMidsMutation.mutate({
                          processorId: processor.processorId,
                          month: monthKey
                        })}
                        disabled={declareNoMidsMutation.isPending}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <MinusCircle className="h-4 w-4 mr-1" />
                        No New MIDs
                      </Button>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedProcessor === processor.processorId && processor.recordCount > 0 && (
                  <div className="mt-3 p-3 border rounded-md bg-white">
                    <h4 className="font-medium mb-2">Processing Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>Upload Status:</span>
                        <span className="font-medium text-green-600">✅ Validated</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lead Sheet:</span>
                        <span className="font-medium text-green-600">✅ Validated</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Compilation:</span>
                        <span className="font-medium text-green-600">✅ Compiled</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Audit Status:</span>
                        <span className="font-medium text-green-600">✅ Passed</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      File: {processor.fileName} • Size: {processor.fileSize ? Math.round(processor.fileSize / 1024) : 0}KB
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}