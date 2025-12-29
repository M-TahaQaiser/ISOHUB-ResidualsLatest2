import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, ExternalLink, Info } from 'lucide-react';
import ProcessorColumnMapper from '@/components/ProcessorColumnMapper';

interface ProcessorMappingStepProps {
  organizationId: string;
  organization: any;
  progress: any;
  onComplete: (data: any) => void;
  isLoading: boolean;
}

interface Processor {
  id: number;
  name: string;
  isActive: boolean;
}

const GOOGLE_SHEET_TEMPLATE_URL = "https://docs.google.com/spreadsheets/d/1example-template-id/template/preview";

export default function ProcessorMappingStep({
  organizationId,
  onComplete,
  isLoading,
}: ProcessorMappingStepProps) {
  const [selectedProcessorId, setSelectedProcessorId] = useState<number | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [completedMappings, setCompletedMappings] = useState<number[]>([]);

  const { data: processors = [], isLoading: processorsLoading } = useQuery<Processor[]>({
    queryKey: ['/api/processors'],
  });

  const { data: existingMappings = [] } = useQuery<any[]>({
    queryKey: ['/api/processor-mappings', organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/processor-mappings?organizationId=${organizationId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!organizationId,
  });

  const selectedProcessor = processors.find(p => p.id === selectedProcessorId);

  const parseFileHeaders = useCallback(async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      if (lines.length === 0) {
        throw new Error('File appears to be empty');
      }

      const firstLine = lines[0].trim();
      let headers: string[] = [];

      if (firstLine.includes('\t')) {
        headers = firstLine.split('\t').map(h => h.trim()).filter(h => h);
      } else if (firstLine.includes(',')) {
        const regex = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
        let match;
        while ((match = regex.exec(firstLine)) !== null) {
          let value = match[1].trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1).replace(/""/g, '"');
          }
          if (value) headers.push(value);
        }
      } else {
        headers = firstLine.split(/\s{2,}/).map(h => h.trim()).filter(h => h);
      }

      if (headers.length === 0) {
        throw new Error('Could not parse headers from file');
      }

      setFileHeaders(headers);
    } catch (error) {
      setParseError((error as Error).message);
      setFileHeaders([]);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        parseFileHeaders(acceptedFiles[0]);
      }
    },
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: !selectedProcessorId,
  });

  const handleMappingComplete = (mappingId: number) => {
    if (selectedProcessorId) {
      setCompletedMappings(prev => [...prev, selectedProcessorId]);
    }
    setFileHeaders([]);
    setFileName('');
    setSelectedProcessorId(null);
  };

  const handleComplete = () => {
    onComplete({
      completedMappings,
      skippedMapping: completedMappings.length === 0,
    });
  };

  const handleSkipAll = () => {
    onComplete({
      completedMappings: [],
      skippedMapping: true,
    });
  };

  const getProcessorMappingStatus = (processorId: number) => {
    const existing = existingMappings.find((m: any) => m.processorId === processorId);
    if (existing) return 'configured';
    if (completedMappings.includes(processorId)) return 'completed';
    return 'pending';
  };

  if (processorsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        <span className="ml-3">Loading processors...</span>
      </div>
    );
  }

  const activeProcessors = processors.filter(p => p.isActive);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Configure Processor Report Formats</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Each processor sends reports with different column formats. Let us know how your processor reports are organized so we can automatically import your data.
        </p>
      </div>

      <Alert className="bg-blue-500/10 border-blue-500/20">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle>One-Time Setup</AlertTitle>
        <AlertDescription>
          You only need to do this once per processor. We'll remember your column mappings for future uploads. 
          You can also skip this step and use our Google Sheets template instead.
        </AlertDescription>
      </Alert>

      {!selectedProcessorId && fileHeaders.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-yellow-500" />
              Select a Processor
            </CardTitle>
            <CardDescription>
              Choose a processor to configure its report format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeProcessors.map((processor) => {
                const status = getProcessorMappingStatus(processor.id);
                
                return (
                  <Card
                    key={processor.id}
                    className={`cursor-pointer transition-all hover:border-yellow-500/50 ${
                      status === 'configured' || status === 'completed'
                        ? 'border-green-500/50 bg-green-500/5'
                        : ''
                    }`}
                    onClick={() => status !== 'configured' && setSelectedProcessorId(processor.id)}
                    data-testid={`processor-card-${processor.id}`}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{processor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {status === 'configured' ? 'Already configured' : 
                           status === 'completed' ? 'Just configured' : 'Click to configure'}
                        </p>
                      </div>
                      {(status === 'configured' || status === 'completed') && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Prefer a pre-formatted template?
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.open(GOOGLE_SHEET_TEMPLATE_URL, '_blank')}
                  data-testid="btn-google-template-main"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Get Google Sheets Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedProcessorId && fileHeaders.length === 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-yellow-500" />
                  Upload Sample {selectedProcessor?.name} Report
                </CardTitle>
                <CardDescription>
                  Upload a sample report file so we can learn the column structure
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProcessorId(null)}
                data-testid="btn-change-processor"
              >
                Change Processor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-yellow-500 bg-yellow-500/10' 
                  : 'border-muted-foreground/25 hover:border-yellow-500/50'
              }`}
              data-testid="dropzone"
            >
              <input {...getInputProps()} data-testid="file-input" />
              {isParsing ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mb-4" />
                  <p>Analyzing file...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {isDragActive ? 'Drop the file here' : 'Drag and drop a report file'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse (CSV, XLSX, XLS, TXT)
                  </p>
                  <Badge variant="secondary">
                    We only read the headers, no data is stored
                  </Badge>
                </div>
              )}
            </div>

            {parseError && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {selectedProcessorId && fileHeaders.length > 0 && selectedProcessor && (
        <ProcessorColumnMapper
          organizationId={organizationId}
          processorId={selectedProcessorId}
          processorName={selectedProcessor.name}
          fileHeaders={fileHeaders}
          onComplete={handleMappingComplete}
          onSkip={() => {
            setFileHeaders([]);
            setFileName('');
            setSelectedProcessorId(null);
          }}
        />
      )}

      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={handleSkipAll}
          disabled={isLoading}
          data-testid="btn-skip-step"
        >
          Skip This Step
        </Button>
        <Button
          onClick={handleComplete}
          disabled={isLoading}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
          data-testid="btn-complete-step"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : completedMappings.length > 0 ? (
            `Continue (${completedMappings.length} configured)`
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  );
}
