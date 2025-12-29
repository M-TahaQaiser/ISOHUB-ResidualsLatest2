import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Settings, Users, Shield, AlertCircle } from "lucide-react";

interface RoleSettingsConfig {
  agentViewResiduals: boolean;
  agentViewFullReports: boolean;
  agentUploadData: boolean;
  managerViewAllAgents: boolean;
  partnerViewCommissions: boolean;
  autoAssignNewMerchants: boolean;
}

export default function AdminRoleSettings() {
  const [settings, setSettings] = useState<RoleSettingsConfig>({
    agentViewResiduals: false,
    agentViewFullReports: false,
    agentUploadData: false,
    managerViewAllAgents: true,
    partnerViewCommissions: true,
    autoAssignNewMerchants: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSettingChange = (key: keyof RoleSettingsConfig, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // TODO: API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Settings Saved",
        description: "Role permissions have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save role settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      agentViewResiduals: false,
      agentViewFullReports: false,
      agentUploadData: false,
      managerViewAllAgents: true,
      partnerViewCommissions: true,
      autoAssignNewMerchants: true,
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Role & Permission Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure role-based access control and permissions for your organization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agent Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">View Residuals Section</div>
                <div className="text-sm text-gray-500">
                  Allow agents to access the full residuals dashboard
                </div>
              </div>
              <Switch
                checked={settings.agentViewResiduals}
                onCheckedChange={(value) => handleSettingChange('agentViewResiduals', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">View Full Reports</div>
                <div className="text-sm text-gray-500">
                  Show all organization reports instead of just assigned data
                </div>
              </div>
              <Switch
                checked={settings.agentViewFullReports}
                onCheckedChange={(value) => handleSettingChange('agentViewFullReports', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Upload Data</div>
                <div className="text-sm text-gray-500">
                  Allow agents to upload processor data and lead sheets
                </div>
              </div>
              <Switch
                checked={settings.agentUploadData}
                onCheckedChange={(value) => handleSettingChange('agentUploadData', value)}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                By default, agents only see reports containing their assigned leads and residuals.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Manager & Partner Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Manager & Partner Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Manager View All Agents</div>
                <div className="text-sm text-gray-500">
                  Team leaders can view data for all agents in organization
                </div>
              </div>
              <Switch
                checked={settings.managerViewAllAgents}
                onCheckedChange={(value) => handleSettingChange('managerViewAllAgents', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Partner Commission Access</div>
                <div className="text-sm text-gray-500">
                  Partners can view their commission breakdowns and payments
                </div>
              </div>
              <Switch
                checked={settings.partnerViewCommissions}
                onCheckedChange={(value) => handleSettingChange('partnerViewCommissions', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto-Assign New Merchants</div>
                <div className="text-sm text-gray-500">
                  Automatically assign new merchants based on upload patterns
                </div>
              </div>
              <Switch
                checked={settings.autoAssignNewMerchants}
                onCheckedChange={(value) => handleSettingChange('autoAssignNewMerchants', value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Role Overview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current Role Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">4</div>
              <div className="text-sm text-gray-500">Super Admins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-sm text-gray-500">Admins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">12</div>
              <div className="text-sm text-gray-500">Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="text-sm text-gray-500">Partners</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <Button
          onClick={saveSettings}
          disabled={isLoading}
          className="bg-black hover:bg-gray-800 text-white"
        >
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
        <Button
          variant="outline"
          onClick={resetToDefaults}
          disabled={isLoading}
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}