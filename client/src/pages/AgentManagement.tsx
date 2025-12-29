import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2, Users, UserCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateUSA } from "@/utils/dateFormat";

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "SuperAdmin" | "Admin" | "Manager" | "Team Leaders" | "Users/Reps" | "Team Member" | "Partners";
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  merchantCount?: number;
}

const ORGANIZATION_ID = "org-86f76df1";

export default function UserManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agents
  const { data: agentsData, isLoading } = useQuery({
    queryKey: ["/api/iso-ai/agents"],
    queryFn: async () => {
      const response = await fetch(`/api/iso-ai/agents?organizationId=${ORGANIZATION_ID}`);
      if (!response.ok) throw new Error("Failed to fetch agents");
      return response.json();
    },
  });

  // Create agent mutation
  const createMutation = useMutation({
    mutationFn: async (agentData: Partial<Agent>) => {
      const response = await fetch("/api/iso-ai/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...agentData,
          organizationId: ORGANIZATION_ID,
        }),
      });
      if (!response.ok) throw new Error("Failed to create agent");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-ai/agents"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Agent Created",
        description: "New agent has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update agent mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Agent> & { id: string }) => {
      const response = await fetch(`/api/iso-ai/agents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update agent");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-ai/agents"] });
      setEditingAgent(null);
      toast({
        title: "Agent Updated",
        description: "Agent information has been updated successfully.",
      });
    },
  });

  // Delete agent mutation
  const deleteMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const response = await fetch(`/api/iso-ai/agents/${agentId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete agent");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iso-ai/agents"] });
      toast({
        title: "Agent Deactivated",
        description: "Agent has been deactivated successfully.",
      });
    },
  });

  const agents = agentsData?.agents || [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const agentData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as Agent["role"],
    };

    if (editingAgent) {
      updateMutation.mutate({ id: editingAgent.id, ...agentData });
    } else {
      createMutation.mutate(agentData);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SuperAdmin": return "destructive";
      case "Admin": return "destructive";
      case "Manager": return "default";
      case "Team Leaders": return "secondary";
      case "Users/Reps": return "outline";
      case "Team Member": return "outline";
      case "Partners": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">User Management</h1>
          <p className="text-gray-600 mt-2">Manage your users and their roles</p>
        </div>
        
        <Dialog open={isAddDialogOpen || !!editingAgent} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingAgent(null);
        }}>
          <DialogTrigger asChild>
            <Button 
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAgent ? "Edit User" : "Add New User"}
              </DialogTitle>
              <DialogDescription>
                {editingAgent ? "Update user information" : "Add a new user to your organization"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={editingAgent?.firstName}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={editingAgent?.lastName}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingAgent?.email}
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue={editingAgent?.role || "Users/Reps"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Team Leaders">Team Leaders</SelectItem>
                    <SelectItem value="Users/Reps">Users/Reps</SelectItem>
                    <SelectItem value="Team Member">Team Member</SelectItem>
                    <SelectItem value="Partners">Partners</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingAgent(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingAgent ? "Update" : "Create"} Agent
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{agents.length}</div>
            <p className="text-xs text-gray-600">Active sales agents</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {agents.filter((a: Agent) => a.isActive).length}
            </div>
            <p className="text-xs text-gray-600">Currently active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">7</div>
            <p className="text-xs text-gray-600">Available role types</p>
          </CardContent>
        </Card>
      </div>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage all users in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading agents...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Merchants</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent: Agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">
                      {agent.firstName} {agent.lastName}
                    </TableCell>
                    <TableCell>{agent.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(agent.role)}>
                        {agent.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agent.isActive ? "default" : "secondary"}>
                        {agent.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{agent.merchantCount || 0}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAgent(agent)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(agent.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {!isLoading && agents.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first agent</p>
              <Button
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add First Agent
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}