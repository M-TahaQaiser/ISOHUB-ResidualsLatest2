import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, AlertCircle, ArrowRight, FileSpreadsheet, ExternalLink, Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TemplateField {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

interface ParsedHeadersResponse {
  headers: string[];
  suggestions: Record<string, string>;
  templateFields: TemplateField[];
  existingMapping: {
    id: number;
    processorName: string;
    version: number;
  } | null;
}

interface ProcessorColumnMapperProps {
  organizationId: string;
  processorId: number;
  processorName: string;
  fileHeaders: string[];
  onComplete: (mappingId: number) => void;
  onSkip?: () => void;
}

const GOOGLE_SHEET_TEMPLATE_URL = "https://docs.google.com/spreadsheets/d/1example-template-id/template/preview";

export function ProcessorColumnMapper({
  organizationId,
  processorId,
  processorName,
  fileHeaders,
  onComplete,
  onSkip,
}: ProcessorColumnMapperProps) {
  const { toast } = useToast();
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [mappingName, setMappingName] = useState(`${processorName} Standard Format`);

  const { data: templateFields = [] } = useQuery<TemplateField[]>({
    queryKey: ["/api/processor-mappings/template-fields"],
  });

  const { data: parsedData, isLoading: isParsing } = useQuery<ParsedHeadersResponse>({
    queryKey: ["/api/processor-mappings/parse-headers", organizationId, processorId, fileHeaders],
    queryFn: async () => {
      const response = await apiRequest("/api/processor-mappings/parse-headers", {
        method: "POST",
        body: {
          headers: fileHeaders,
          organizationId,
          processorId,
        },
      });
      return response.json();
    },
    enabled: fileHeaders.length > 0,
  });

  useEffect(() => {
    if (parsedData?.suggestions) {
      setColumnMappings(parsedData.suggestions);
    }
  }, [parsedData]);

  const saveMappingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/processor-mappings", {
        method: "POST",
        body: {
          organizationId,
          processorId,
          processorName,
          mappingName,
          columnMappings,
          sampleHeaders: fileHeaders,
          isDefault: true,
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Mapping Saved",
        description: `Column mapping for ${processorName} has been saved successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/processor-mappings"] });
      onComplete(data.id);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save column mapping",
        variant: "destructive",
      });
    },
  });

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setColumnMappings((prev) => {
      const newMappings = { ...prev };
      if (targetField === "none") {
        delete newMappings[sourceColumn];
      } else {
        newMappings[sourceColumn] = targetField;
      }
      return newMappings;
    });
  };

  const autoMapColumns = () => {
    if (parsedData?.suggestions) {
      setColumnMappings(parsedData.suggestions);
      toast({
        title: "Auto-mapped",
        description: "Columns have been automatically mapped based on header names.",
      });
    }
  };

  const requiredFields = templateFields.filter((f) => f.required);
  const mappedFields = Object.values(columnMappings);
  const missingRequired = requiredFields.filter((f) => !mappedFields.includes(f.key));
  const isValid = missingRequired.length === 0;

  const getMappedColumn = (fieldKey: string): string | undefined => {
    return Object.entries(columnMappings).find(([_, v]) => v === fieldKey)?.[0];
  };

  if (isParsing) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
          <span className="ml-3 text-lg">Analyzing file headers...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-yellow-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-yellow-500" />
                Map {processorName} Columns
              </CardTitle>
              <CardDescription>
                Tell us which columns in your processor report match our template fields
              </CardDescription>
            </div>
            {parsedData?.existingMapping && (
              <Badge variant="secondary">
                Version {parsedData.existingMapping.version} exists
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertTitle>Prefer a pre-formatted template?</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Download our Google Sheets template and skip this mapping step.</span>
              <Button
                variant="outline"
                size="sm"
                className="ml-4"
                onClick={() => window.open(GOOGLE_SHEET_TEMPLATE_URL, "_blank")}
                data-testid="btn-google-template"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Get Template
              </Button>
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Column Mappings</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={autoMapColumns}
              data-testid="btn-auto-map"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Auto-Map
            </Button>
          </div>

          <div className="grid gap-4">
            {fileHeaders.map((header, index) => (
              <div
                key={header}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                data-testid={`mapping-row-${index}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{header}</p>
                  <p className="text-xs text-muted-foreground">Column {index + 1}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="w-64">
                  <Select
                    value={columnMappings[header] || "none"}
                    onValueChange={(value) => handleMappingChange(header, value)}
                    data-testid={`select-mapping-${index}`}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Do not import --</SelectItem>
                      {templateFields.map((field) => {
                        const alreadyMapped = getMappedColumn(field.key);
                        const isMappedToThis = alreadyMapped === header;
                        const isMappedToOther = Boolean(alreadyMapped && !isMappedToThis);
                        
                        return (
                          <SelectItem
                            key={field.key}
                            value={field.key}
                            disabled={isMappedToOther}
                          >
                            <span className="flex items-center gap-2">
                              {field.label}
                              {field.required && (
                                <Badge variant="destructive" className="text-xs px-1">
                                  Required
                                </Badge>
                              )}
                              {isMappedToThis && (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              )}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Mapping Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {templateFields.map((field) => {
                const mappedColumn = getMappedColumn(field.key);
                const isMapped = !!mappedColumn;
                
                return (
                  <div
                    key={field.key}
                    className={`p-2 rounded-md text-sm ${
                      isMapped
                        ? "bg-green-500/10 text-green-700 dark:text-green-400"
                        : field.required
                        ? "bg-red-500/10 text-red-700 dark:text-red-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                    data-testid={`summary-${field.key}`}
                  >
                    <div className="flex items-center gap-1">
                      {isMapped ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : field.required ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : null}
                      <span className="truncate">{field.label}</span>
                    </div>
                    {isMapped && (
                      <p className="text-xs opacity-75 truncate">← {mappedColumn}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!isValid && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Missing Required Fields</AlertTitle>
              <AlertDescription>
                Please map the following required fields: {missingRequired.map((f) => f.label).join(", ")}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {onSkip && (
          <Button
            variant="outline"
            onClick={onSkip}
            data-testid="btn-skip-mapping"
          >
            Skip for Now
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button
            onClick={() => saveMappingMutation.mutate()}
            disabled={!isValid || saveMappingMutation.isPending}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
            data-testid="btn-save-mapping"
          >
            {saveMappingMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Mapping & Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProcessorColumnMapper;
