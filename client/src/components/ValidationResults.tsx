import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ValidationError {
  row: number;
  column: string;
  value: any;
  error: string;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
}

interface ValidationResultsProps {
  validationResult: ValidationResult;
  report: string;
  preview: any[];
  onClose: () => void;
  onProceedWithUpload: () => void;
  processorName: string;
}

export default function ValidationResults({
  validationResult,
  report,
  preview,
  onClose,
  onProceedWithUpload,
  processorName
}: ValidationResultsProps) {
  const { summary, errors, warnings, isValid } = validationResult;
  
  const validationPercentage = Math.round((summary.validRows / summary.totalRows) * 100);
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';  
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Validation Results - {processorName}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Data validation completed for uploaded file
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Validation Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rows</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalRows}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valid Rows</p>
                    <p className="text-2xl font-bold text-green-600">{summary.validRows}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Errors</p>
                    <p className="text-2xl font-bold text-red-600">{errors.length}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-600">{warnings.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validation Progress */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                Validation Status: {isValid ? 'PASSED' : 'FAILED'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Data Quality</span>
                  <span>{validationPercentage}%</span>
                </div>
                <Progress value={validationPercentage} className="w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Errors and Warnings */}
          {(errors.length > 0 || warnings.length > 0) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Issues Found</CardTitle>
                <CardDescription>
                  Review the following issues before proceeding with the upload
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {[...errors, ...warnings].map((issue, index) => (
                    <Alert key={index} className={`border ${getSeverityColor(issue.severity)}`}>
                      <div className="flex items-start gap-2">
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1">
                          <AlertDescription>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                Row {issue.row}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {issue.column}
                              </Badge>
                              <Badge className={`text-xs ${getSeverityColor(issue.severity)}`}>
                                {issue.severity.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm">{issue.error}</p>
                            <p className="text-xs text-gray-500 mt-1">Value: {issue.value}</p>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Preview */}
          {preview.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Data Preview</CardTitle>
                <CardDescription>
                  First 5 rows of your uploaded data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(preview[0] || {}).map((key) => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value: any, valueIndex) => (
                            <TableCell key={valueIndex} className="text-sm">
                              {String(value)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isValid ? (
              <span className="text-green-600">✓ All validations passed. Ready to upload.</span>
            ) : (
              <span className="text-red-600">⚠ Validation failed. Please review errors above.</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={onProceedWithUpload}
              className={isValid ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}
            >
              {isValid ? 'Proceed with Upload' : 'Upload Anyway'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}