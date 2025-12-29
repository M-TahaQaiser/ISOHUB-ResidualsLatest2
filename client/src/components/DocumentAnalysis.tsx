import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Upload, 
  Loader2, 
  Check, 
  X, 
  FileSearch,
  Brain,
  AlertCircle,
  Download,
  Eye,
  Trash2
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface DocumentAnalysisResult {
  id?: string;
  documentId: string;
  documentName: string;
  documentType: string;
  fileSize: number;
  analysisResult: {
    merchants?: Array<{
      mid: string;
      name: string;
      dba?: string;
      address?: string;
    }>;
    transactions?: Array<{
      date: string;
      amount: number;
      type: string;
      merchant?: string;
    }>;
    financials?: {
      totalRevenue?: number;
      totalExpenses?: number;
      netIncome?: number;
      period?: string;
    };
    commissions?: Array<{
      agentName?: string;
      rate?: number;
      amount?: number;
      period?: string;
    }>;
    processorInfo?: {
      name?: string;
      accountNumber?: string;
      batchInfo?: string;
    };
    extractedText?: string;
    confidence?: number;
  };
  modelUsed: string;
  processingTime: number;
  status: string;
  createdAt?: string;
}

export function DocumentAnalysis() {
  const [selectedDocument, setSelectedDocument] = useState<DocumentAnalysisResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Analyze document mutation
  const analyzeDocument = useMutation({
    mutationFn: async (file: File) => {
      // Read file content
      const content = await file.text();
      
      return apiRequest('/api/ai/document/analyze', {
        method: 'POST',
        body: JSON.stringify({
          documentId: `doc-${Date.now()}`,
          documentName: file.name,
          documentType: file.type || 'unknown',
          content: content,
        }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Document analyzed successfully',
      });
      
      // Invalidate history query
      queryClient.invalidateQueries({ queryKey: ['/api/ai/document/history'] });
      
      // Show analysis result
      setSelectedDocument({
        documentId: `doc-${Date.now()}`,
        documentName: data.documentName || 'Document',
        documentType: data.documentType || 'unknown',
        fileSize: data.fileSize || 0,
        analysisResult: data.analysis,
        modelUsed: 'claude-3-5-sonnet-20241022',
        processingTime: data.processingTime || 0,
        status: 'completed',
        createdAt: new Date().toISOString(),
      });
      setShowDetails(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze document',
        variant: 'destructive',
      });
    },
  });

  // Get analysis history
  const { data: history } = useQuery({
    queryKey: ['/api/ai/document/history'],
    queryFn: async () => {
      const response = await apiRequest('/api/ai/document/history', {
        method: 'GET',
      });
      return response.history as DocumentAnalysisResult[];
    },
  });

  // Dropzone setup
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      // Analyze the document
      analyzeDocument.mutate(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('csv') || type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('image')) return '🖼️';
    return '📁';
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-yellow-600" />
            Document Analysis
          </CardTitle>
          <CardDescription>
            Upload documents for AI-powered analysis and data extraction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' : 'border-gray-300 dark:border-gray-700'}
              ${analyzeDocument.isPending ? 'opacity-50 cursor-not-allowed' : 'hover:border-yellow-400'}
            `}
            data-testid="document-dropzone"
          >
            <input {...getInputProps()} />
            
            {analyzeDocument.isPending ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 mx-auto text-yellow-600 animate-spin" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analyzing document with AI...
                </p>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                )}
              </div>
            ) : isDragActive ? (
              <div className="space-y-2">
                <Upload className="w-12 h-12 mx-auto text-yellow-600" />
                <p className="text-sm font-medium">Drop your document here</p>
              </div>
            ) : (
              <div className="space-y-2">
                <FileSearch className="w-12 h-12 mx-auto text-gray-400" />
                <p className="text-sm font-medium">
                  Drag & drop a document here, or click to select
                </p>
                <p className="text-xs text-gray-500">
                  Supports PDF, CSV, Excel, Text, and Images (Max 10MB)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
          <CardDescription>
            View and manage your document analysis history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history && history.length > 0 ? (
            <div className="space-y-2">
              {history.map((doc, index) => (
                <div
                  key={doc.id || index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => {
                    setSelectedDocument(doc);
                    setShowDetails(true);
                  }}
                  data-testid={`document-history-item-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getDocumentIcon(doc.documentType)}</span>
                    <div>
                      <p className="font-medium text-sm">{doc.documentName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(doc.fileSize)}
                        </Badge>
                        <Badge 
                          variant={doc.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {doc.status}
                        </Badge>
                        {doc.createdAt && (
                          <span className="text-xs text-gray-500">
                            {format(new Date(doc.createdAt), 'MMM d, h:mm a')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDocument(doc);
                        setShowDetails(true);
                      }}
                      data-testid={`button-view-document-${index}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No documents analyzed yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedDocument?.documentName}
            </DialogTitle>
            <DialogDescription>
              AI-extracted data and insights
            </DialogDescription>
          </DialogHeader>
          
          {selectedDocument && (
            <Tabs defaultValue="summary" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="merchants">Merchants</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[400px] mt-4">
                <TabsContent value="summary" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Document Type</p>
                      <p className="text-sm">{selectedDocument.documentType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">File Size</p>
                      <p className="text-sm">{formatFileSize(selectedDocument.fileSize)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">AI Model</p>
                      <p className="text-sm">{selectedDocument.modelUsed}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Processing Time</p>
                      <p className="text-sm">{selectedDocument.processingTime}ms</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Confidence</p>
                      <p className="text-sm">
                        {(selectedDocument.analysisResult?.confidence || 0.85) * 100}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <Badge variant={selectedDocument.status === 'completed' ? 'default' : 'secondary'}>
                        {selectedDocument.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {selectedDocument.analysisResult?.processorInfo && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">Processor Information</h4>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium">Name:</span> {selectedDocument.analysisResult.processorInfo.name}
                        </p>
                        {selectedDocument.analysisResult.processorInfo.accountNumber && (
                          <p className="text-sm">
                            <span className="font-medium">Account:</span> {selectedDocument.analysisResult.processorInfo.accountNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="merchants" className="space-y-2">
                  {selectedDocument.analysisResult?.merchants && selectedDocument.analysisResult.merchants.length > 0 ? (
                    selectedDocument.analysisResult.merchants.map((merchant, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{merchant.name}</p>
                            {merchant.dba && (
                              <p className="text-sm text-gray-500">DBA: {merchant.dba}</p>
                            )}
                            <p className="text-sm text-gray-500">MID: {merchant.mid}</p>
                            {merchant.address && (
                              <p className="text-sm text-gray-500">{merchant.address}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No merchant data extracted
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="financials" className="space-y-4">
                  {selectedDocument.analysisResult?.financials ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-3">Financial Summary</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedDocument.analysisResult.financials.totalRevenue !== undefined && (
                            <div>
                              <p className="text-sm text-gray-500">Total Revenue</p>
                              <p className="text-lg font-semibold">
                                ${selectedDocument.analysisResult.financials.totalRevenue.toLocaleString()}
                              </p>
                            </div>
                          )}
                          {selectedDocument.analysisResult.financials.totalExpenses !== undefined && (
                            <div>
                              <p className="text-sm text-gray-500">Total Expenses</p>
                              <p className="text-lg font-semibold">
                                ${selectedDocument.analysisResult.financials.totalExpenses.toLocaleString()}
                              </p>
                            </div>
                          )}
                          {selectedDocument.analysisResult.financials.netIncome !== undefined && (
                            <div>
                              <p className="text-sm text-gray-500">Net Income</p>
                              <p className="text-lg font-semibold">
                                ${selectedDocument.analysisResult.financials.netIncome.toLocaleString()}
                              </p>
                            </div>
                          )}
                          {selectedDocument.analysisResult.financials.period && (
                            <div>
                              <p className="text-sm text-gray-500">Period</p>
                              <p className="text-lg font-semibold">
                                {selectedDocument.analysisResult.financials.period}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {selectedDocument.analysisResult?.commissions && selectedDocument.analysisResult.commissions.length > 0 && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <h4 className="font-medium mb-3">Commissions</h4>
                          <div className="space-y-2">
                            {selectedDocument.analysisResult.commissions.map((commission, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">{commission.agentName}</p>
                                  {commission.period && (
                                    <p className="text-xs text-gray-500">{commission.period}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  {commission.rate && (
                                    <p className="text-sm">{commission.rate}%</p>
                                  )}
                                  {commission.amount && (
                                    <p className="text-sm font-semibold">
                                      ${commission.amount.toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No financial data extracted
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="raw">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedDocument.analysisResult, null, 2)}
                    </pre>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}