import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Plus, Trash2 } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface OrgChartStepProps {
  organizationId: string;
  organization: any;
  progress: any;
  onComplete: (data: any) => void;
  isLoading: boolean;
}

export default function OrgChartStep({
  organizationId,
  organization,
  progress,
  onComplete,
  isLoading,
}: OrgChartStepProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: organization?.adminContactName || '',
      email: organization?.adminContactEmail || '',
      role: 'Admin',
      department: 'Executive',
    },
  ]);

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
  });

  const addTeamMember = () => {
    if (newMember.name && newMember.email && newMember.role) {
      const member: TeamMember = {
        id: Date.now().toString(),
        ...newMember,
      };
      setTeamMembers([...teamMembers, member]);
      setNewMember({ name: '', email: '', role: '', department: '' });
    }
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
  };

  const handleComplete = () => {
    const orgChartData = {
      teamMembers,
      totalUsers: teamMembers.length,
      departments: [...new Set(teamMembers.map(m => m.department).filter(Boolean))],
      roles: [...new Set(teamMembers.map(m => m.role))],
      setupDate: new Date().toISOString(),
    };

    onComplete(orgChartData);
  };

  const roleOptions = [
    'Admin',
    'Manager',
    'Team Leader',
    'User/Rep',
    'Team Member',
    'Partner',
  ];

  const departmentOptions = [
    'Executive',
    'Sales',
    'Operations',
    'Support',
    'Marketing',
    'Finance',
    'Technical',
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Organization Chart</CardTitle>
              <CardDescription>
                Set up your team structure with roles and permissions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Team Members */}
          <div>
            <h3 className="text-lg font-medium mb-4">Team Members</h3>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                      <Badge variant="secondary">{member.role}</Badge>
                      {member.department && (
                        <Badge variant="outline">{member.department}</Badge>
                      )}
                    </div>
                  </div>
                  {member.role !== 'Admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTeamMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add New Team Member */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Team Member</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="memberName">Name</Label>
                  <Input
                    id="memberName"
                    placeholder="John Smith"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memberEmail">Email</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    placeholder="john@company.com"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memberRole">Role</Label>
                  <Select
                    value={newMember.role}
                    onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memberDepartment">Department</Label>
                  <Select
                    value={newMember.department}
                    onValueChange={(value) => setNewMember({ ...newMember, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={addTeamMember}
                className="mt-4"
                disabled={!newMember.name || !newMember.email || !newMember.role}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Organization Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Total Members</p>
                <p className="text-xl font-semibold text-blue-900">{teamMembers.length}</p>
              </div>
              <div>
                <p className="text-blue-700">Departments</p>
                <p className="text-xl font-semibold text-blue-900">
                  {new Set(teamMembers.map(m => m.department).filter(Boolean)).size}
                </p>
              </div>
              <div>
                <p className="text-blue-700">Roles</p>
                <p className="text-xl font-semibold text-blue-900">
                  {new Set(teamMembers.map(m => m.role)).size}
                </p>
              </div>
              <div>
                <p className="text-blue-700">Admin Users</p>
                <p className="text-xl font-semibold text-blue-900">
                  {teamMembers.filter(m => m.role === 'Admin').length}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleComplete}
              disabled={isLoading || teamMembers.length === 0}
              className="bg-black hover:bg-gray-800 text-white font-medium"
            >
              {isLoading ? (
                <>
                  <span className="mr-2">Processing...</span>
                  Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}