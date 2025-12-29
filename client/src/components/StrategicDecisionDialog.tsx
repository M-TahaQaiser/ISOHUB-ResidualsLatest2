import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  BarChart3, 
  FileText, 
  Shield, 
  Newspaper,
  Users,
  CheckCircle,
  ArrowRight,
  Zap,
  Target
} from "lucide-react";

interface StrategicDecisionDialogProps {
  open: boolean;
  onClose: () => void;
  onDecision: (decision: 'unified' | 'separate') => void;
}

export default function StrategicDecisionDialog({ 
  open, 
  onClose, 
  onDecision 
}: StrategicDecisionDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'unified' | 'separate' | null>(null);

  const handleConfirm = () => {
    if (selectedOption) {
      onDecision(selectedOption);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Strategic Dashboard Architecture Decision</DialogTitle>
          <p className="text-gray-600">
            Choose the best approach for organizing your ISO Hub platform functionality
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Unified Dashboard Option */}
          <Card 
            className={`cursor-pointer transition-all duration-300 ${
              selectedOption === 'unified' 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedOption('unified')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Unified ISO Hub Dashboard
                {selectedOption === 'unified' && (
                  <Badge className="ml-2 bg-primary text-white">Selected</Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600">
                Single comprehensive dashboard with all platform features
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Single navigation experience</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Integrated data across all modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Unified user experience</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Cross-platform analytics</span>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Includes:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    <span>Residual Reports</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>Pre-Applications</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>Secured Docs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Newspaper className="h-3 w-3" />
                    <span>Company News</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>Agent Management</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>ISO-AI Features</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-800 mb-1">Best For:</h4>
                <p className="text-sm text-green-700">
                  Organizations wanting streamlined operations with everything in one place
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Separate Dashboard Option */}
          <Card 
            className={`cursor-pointer transition-all duration-300 ${
              selectedOption === 'separate' 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedOption('separate')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Separate Specialized Dashboards
                {selectedOption === 'separate' && (
                  <Badge className="ml-2 bg-primary text-white">Selected</Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600">
                Dedicated dashboards for different business functions
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Focused user experiences</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Role-based access control</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Specialized workflows</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Modular architecture</span>
                </div>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">Dashboard Structure:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Main ISO Hub Dashboard</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                  <div className="ml-4 space-y-1">
                    <div>• Residuals Dashboard</div>
                    <div>• Pre-Applications Portal</div>
                    <div>• Secured Documents</div>
                    <div>• ISO-AI Management</div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-1">Best For:</h4>
                <p className="text-sm text-orange-700">
                  Large organizations with distinct teams handling different functions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Table */}
        <div className="mt-6">
          <h3 className="font-medium mb-3">Quick Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-3 text-left">Feature</th>
                  <th className="border border-gray-200 p-3 text-center">Unified</th>
                  <th className="border border-gray-200 p-3 text-center">Separate</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 p-3">User Experience</td>
                  <td className="border border-gray-200 p-3 text-center">
                    <Badge className="bg-green-100 text-green-800">Simple</Badge>
                  </td>
                  <td className="border border-gray-200 p-3 text-center">
                    <Badge className="bg-blue-100 text-blue-800">Focused</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3">Data Integration</td>
                  <td className="border border-gray-200 p-3 text-center">
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  </td>
                  <td className="border border-gray-200 p-3 text-center">
                    <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3">Role-Based Access</td>
                  <td className="border border-gray-200 p-3 text-center">
                    <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
                  </td>
                  <td className="border border-gray-200 p-3 text-center">
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3">Scalability</td>
                  <td className="border border-gray-200 p-3 text-center">
                    <Badge className="bg-blue-100 text-blue-800">Moderate</Badge>
                  </td>
                  <td className="border border-gray-200 p-3 text-center">
                    <Badge className="bg-green-100 text-green-800">High</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedOption}
            className="bg-black hover:bg-gray-800 text-white"
          >
            Confirm Decision
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}