import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Users, Settings, TestTube, Eye } from "lucide-react";

export default function RoleTestingPanel() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole, navigation } = useRoleAccess();

  // Fetch test user credentials
  const { data: testCredentials, isLoading } = useQuery({
    queryKey: ['/api/test-users/credentials'],
  });

  // Create test users mutation
  const createTestUsers = useMutation({
    mutationFn: async () => {
      return await apiRequest({
        method: "POST",
        endpoint: "/api/test-users/create",
        body: {}
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-users/credentials'] });
      toast({
        title: "Test Users Created",
        description: `Successfully processed test user accounts.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create test users",
        variant: "destructive",
      });
    }
  });

  // Switch user role mutation
  const switchRole = useMutation({
    mutationFn: async (data: { userId: string; newRole: string }) => {
      return await apiRequest({
        method: "POST",
        endpoint: `/api/test-users/${data.userId}/switch-role`,
        body: { newRole: data.newRole }
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-users/credentials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/role'] });
      toast({
        title: "Role Switched",
        description: `User role updated to ${data.user.role}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch user role",
        variant: "destructive",
      });
    }
  });

  const handleRoleSwitch = () => {
    if (!selectedUserId || !selectedRole) {
      toast({
        title: "Missing Selection",
        description: "Please select both a user and a role",
        variant: "destructive",
      });
      return;
    }

    switchRole.mutate({ userId: selectedUserId, newRole: selectedRole });
  };

  const roles = [
    { value: 'SuperAdmin', label: 'Super Admin', description: 'Full system access' },
    { value: 'Admin', label: 'Admin', description: 'Organization management' },
    { value: 'Manager', label: 'Manager', description: 'Team oversight' },
    { value: 'TeamLeader', label: 'Team Leader', description: 'Team leadership' },
    { value: 'Agent', label: 'Agent', description: 'Sales representative' },
    { value: 'Partner', label: 'Partner', description: 'Business partner' }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TestTube className="h-6 w-6" />
          Role-Based Access Testing
        </h2>
        <Badge variant="outline">Development Mode</Badge>
      </div>

      {/* Current User Role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Current Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Role</div>
              <Badge className="mt-1">{userRole?.role || 'Not Set'}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Organization</div>
              <div className="text-sm">{userRole?.organizationId || 'Not Set'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Permissions</div>
              <div className="text-sm">{userRole?.permissions.length || 0} total</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Navigation Items</div>
              <div className="text-sm">{navigation?.length || 0} visible</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test User Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Test Users
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => createTestUsers.mutate()}
              disabled={createTestUsers.isPending}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {createTestUsers.isPending ? "Creating..." : "Create Test Users"}
            </Button>

            {testCredentials?.credentials && (
              <div className="space-y-2">
                <h4 className="font-medium">Available Test Accounts:</h4>
                {testCredentials.credentials.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="text-sm">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-gray-500">{user.email}</div>
                    </div>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Role Switching
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select User:</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose test user" />
                </SelectTrigger>
                <SelectContent>
                  {testCredentials?.credentials?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Role:</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose new role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleRoleSwitch}
              disabled={switchRole.isPending || !selectedUserId || !selectedRole}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {switchRole.isPending ? "Switching..." : "Switch Role"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Preview */}
      {navigation && navigation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Navigation Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {navigation.map((item: any) => (
                <Badge key={item.path} variant="outline" className="justify-start">
                  {item.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertDescription>
          This testing panel allows you to switch between different user roles to demonstrate 
          role-based access control. Agents will only see reports containing their assigned data, 
          while admins have full organization access.
        </AlertDescription>
      </Alert>
    </div>
  );
}