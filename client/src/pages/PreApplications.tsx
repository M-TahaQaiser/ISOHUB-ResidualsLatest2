import { useState, useEffect } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Copy, 
  ExternalLink, 
  Eye, 
  Edit, 
  FileText,
  Phone,
  Building,
  Send,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { laravelApi, convertLaravelToLocal } from "@/api/laravel.api";
import OrganizationSelector from "@/components/OrganizationSelector";

// Props interface to receive current user context
interface PreApplicationsProps {
  currentUser?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    organizationId?: string;
  };
}

interface PreApplication {
  id: string;
  dba: string;
  businessContactName: string;
  email: string;
  phone: string;
  status: "New" | "In Progress" | "Pending Review" | "Approved" | "Declined";
  submittedAt: string;
  businessType?: string;
  monthlyVolume?: number;
  averageTicket?: number;
  notes?: string;
}

export default function PreApplications({ currentUser }: PreApplicationsProps = {}) {
  // Use mock data if no user context provided (fallback for development)
  const userContext = currentUser || {
    firstName: "John",
    lastName: "Smith", 
    username: "jsmith",
    organizationId: "org-1"
  };

  // Organization selection state for multi-tenant management
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [currentOrgId, setCurrentOrgId] = useState(userContext.organizationId);
  
  // Generate personalized form link with organization identifier
  const generatePersonalizedLink = (firstName: string, lastName: string, organizationCode?: string) => {
    const fullName = `${firstName}-${lastName}`.toLowerCase().replace(/\s+/g, '');
    // Use selected organization code or generate from user context
    const code = organizationCode || selectedOrganization?.organizationCode || `${userContext.firstName?.charAt(0) || 'A'}${userContext.lastName?.charAt(0) || 'G'}-${new Date().getFullYear()}-001`;
    // Use current domain for development, isohub.io for production
    const baseUrl = import.meta.env.PROD ? 'https://isohub.io' : window.location.origin;
    return `${baseUrl}/${code}/${fullName}`;
  };

  // Generate branded short URL
  const generateShortUrl = async (firstName: string, lastName: string, organizationCode?: string) => {
    try {
      const fullName = `${firstName}-${lastName}`.toLowerCase().replace(/\s+/g, '');
      const code = organizationCode || selectedOrganization?.organizationCode || `${userContext.firstName?.charAt(0) || 'A'}${userContext.lastName?.charAt(0) || 'G'}-${new Date().getFullYear()}-001`;
      
      const response = await fetch('/s/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationCode: code,
          fullname: fullName,
          agentName: `${userContext.firstName} ${userContext.lastName}`,
          organizationId: currentOrgId,
          expiresInDays: 30, // 30-day expiration
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return result.shortUrl; // Returns: https://isohub.io/s/abc123
      } else {
        console.error('Failed to create short URL:', result.error);
        return generatePersonalizedLink(firstName, lastName, organizationCode); // Fallback to long URL
      }
    } catch (error) {
      console.error('Error creating short URL:', error);
      return generatePersonalizedLink(firstName, lastName, organizationCode); // Fallback to long URL
    }
  };
  
  // Initialize with a branded short URL
  const [formLink, setFormLink] = useState("Loading branded link...");
  
  // Generate the initial branded short URL
  React.useEffect(() => {
    const initializeBrandedLink = async () => {
      const shortUrl = await generateShortUrl(
        userContext.firstName || "Agent", 
        userContext.lastName || "User"
      );
      setFormLink(shortUrl);
    };
    initializeBrandedLink();
  }, []);

  // Handle organization selection change
  const handleOrganizationSelect = (organization: any) => {
    setSelectedOrganization(organization);
    if (organization) {
      setCurrentOrgId(organization.organizationId);
      // Update form link with branded short URL when organization changes
      const updateLink = async () => {
        const shortUrl = await generateShortUrl(
          userContext.firstName || "Agent", 
          userContext.lastName || "User", 
          organization.organizationCode
        );
        setFormLink(shortUrl);
      };
      updateLink();
    } else {
      setCurrentOrgId(userContext.organizationId);
      const updateLink = async () => {
        const shortUrl = await generateShortUrl(
          userContext.firstName || "Agent", 
          userContext.lastName || "User"
        );
        setFormLink(shortUrl);
      };
      updateLink();
    }
  };
  const [emailDialog, setEmailDialog] = useState<{ open: boolean; application: PreApplication | null }>({
    open: false,
    application: null
  });
  const [formLinkEmailDialog, setFormLinkEmailDialog] = useState(false);
  const [viewDetailsDialog, setViewDetailsDialog] = useState<{ open: boolean; application: PreApplication | null }>({
    open: false,
    application: null
  });
  const [emailForm, setEmailForm] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['/api/pre-applications'],
    queryFn: async () => {
      // Use selected agency's organization or current user's organization
      const orgId = currentOrgId || 'org-1';
      const response = await fetch(`/api/preapplications?organizationId=${orgId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PreApplication["status"] }) =>
      fetch(`/api/pre-applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pre-applications'] });
      toast({
        title: "Status updated",
        description: "Pre-application status has been updated successfully"
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ applicationId, recipientEmail, firstName, lastName }: {
      applicationId: string;
      recipientEmail: string;
      firstName: string;
      lastName: string;
    }) => {
      const response = await fetch('/api/pre-applications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          recipientEmail,
          firstName,
          lastName
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      setEmailDialog({ open: false, application: null });
      setEmailForm({ firstName: "", lastName: "", email: "" });
      toast({
        title: "Email sent successfully",
        description: "Pre-application email has been sent to the merchant"
      });
    },
    onError: (error) => {
      toast({
        title: "Email failed to send",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const sendFormLinkMutation = useMutation({
    mutationFn: async ({ recipientEmail, firstName, lastName }: {
      recipientEmail: string;
      firstName: string;
      lastName: string;
    }) => {
      // Generate branded short URL for professional appearance
      const shortUrl = await generateShortUrl(firstName, lastName);
      
      const response = await fetch('/api/pre-applications/send-form-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail,
          firstName,
          lastName,
          formLink: shortUrl, // Use branded short URL instead of long URL
          senderName: `${userContext.firstName} ${userContext.lastName}`,
          organizationId: userContext.organizationId
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      setFormLinkEmailDialog(false);
      setEmailForm({ firstName: "", lastName: "", email: "" });
      toast({
        title: "✓ Email Sent Successfully",
        description: "Pre-application form link delivered to prospect",
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: "Email failed to send",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCopyLink = async () => {
    try {
      // Generate branded short URL for copying
      const shortUrl = await generateShortUrl(userContext.firstName || "Agent", userContext.lastName || "User");
      
      await navigator.clipboard.writeText(shortUrl);
      toast({
        title: "✓ Link Copied",
        description: "Professional short link copied to clipboard",
        duration: 2000,
      });
    } catch (err) {
      // Fallback to original link if short URL generation fails
      try {
        await navigator.clipboard.writeText(formLink);
        toast({
          title: "Link copied",
          description: "Pre-application form link copied to clipboard"
        });
      } catch (fallbackErr) {
        toast({
          title: "Copy failed", 
          description: "Please copy the link manually",
          variant: "destructive"
        });
      }
    }
  };

  const handleEmailClick = (application: PreApplication) => {
    setEmailDialog({ open: true, application });
    setEmailForm({
      firstName: application.businessContactName.split(' ')[0] || "",
      lastName: application.businessContactName.split(' ').slice(1).join(' ') || "",
      email: application.email
    });
  };

  const handleSendEmail = async () => {
    if (!emailDialog.application) return;
    
    try {
      // Generate personalized form link for the email  
      const personalizedUrl = `/form/JS-2025-001/${emailForm.firstName.toLowerCase()}-${emailForm.lastName.toLowerCase().replace(/\s+/g, '-')}`;
      const fullUrl = `${window.location.origin}${personalizedUrl}`;
      
      // Send form link email with personalized URL
      sendFormLinkMutation.mutate({
        recipientEmail: emailForm.email,
        firstName: emailForm.firstName,
        lastName: emailForm.lastName,
        formLink: fullUrl
      });
    } catch (error) {
      console.error('Error sending email with form link:', error);
      toast({
        title: "Error sending email",
        description: "Failed to send email with form link",
        variant: "destructive"
      });
    }
  };

  const handleSendFormLink = async () => {
    try {
      // Generate personalized form link for the email
      const personalizedUrl = `/form/JS-2025-001/${emailForm.firstName.toLowerCase()}-${emailForm.lastName.toLowerCase().replace(/\s+/g, '-')}`;
      const fullUrl = `${window.location.origin}${personalizedUrl}`;
      
      sendFormLinkMutation.mutate({
        recipientEmail: emailForm.email,
        firstName: emailForm.firstName,
        lastName: emailForm.lastName,
        formLink: fullUrl
      });
    } catch (error) {
      console.error('Error generating personalized form link:', error);
      toast({
        title: "Error generating form link",
        description: "Failed to create personalized form link",
        variant: "destructive"
      });
    }
  };

  const handleEmailLink = () => {
    setFormLinkEmailDialog(true);
    setEmailForm({ firstName: "", lastName: "", email: "" });
  };

  const handleStatusChange = (applicationId: string, newStatus: PreApplication["status"]) => {
    updateStatusMutation.mutate({ id: applicationId, status: newStatus });
  };

  const getStatusBadge = (status: PreApplication["status"]) => {
    const statusConfig = {
      "New": { color: "bg-blue-100 text-blue-800", text: "New" },
      "In Progress": { color: "bg-yellow-100 text-yellow-800", text: "In Progress" },
      "Pending Review": { color: "bg-orange-100 text-orange-800", text: "Pending Review" },
      "Approved": { color: "bg-green-100 text-green-800", text: "Approved" },
      "Declined": { color: "bg-red-100 text-red-800", text: "Declined" }
    };
    
    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", text: status };
    return (
      <Badge variant="secondary" className={`${config.color} border-0`}>
        {config.text}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading pre-applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Mobile Header */}
      <div className="md:hidden bg-zinc-900 border-b border-yellow-400/20 px-4 py-3">
        <h1 className="text-xl font-semibold text-white">Pre-Applications</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: "Pre-Applications", href: "/pre-applications", isActive: true }
          ]} 
        />


        {/* Header Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-yellow-400 to-yellow-500 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-black/10 rounded-lg">
                  <FileText className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">Pre-Applications</h1>
                  <p className="text-black/80">Manage and track merchant pre-applications.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pre-Application Form Link Section */}
        <div className="mb-8">
          <Card className="bg-zinc-900/80 border border-yellow-400/20">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Pre-Application Form Link
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                  <Input
                    value={formLink}
                    onChange={(e) => setFormLink(e.target.value)}
                    className="bg-zinc-800 text-white border-yellow-400/30 font-mono text-sm"
                    placeholder="Your personalized form link will appear here"
                    readOnly
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleEmailLink}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black"
                    size="sm"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    onClick={() => window.open(`/form/JS-2025-001/john-smith`, '_blank')}
                    variant="outline"
                    className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Form
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pre-Application List */}
        <div className="mb-8">
          <Card className="bg-zinc-900/80 border border-yellow-400/20">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-6">
                Pre-Application List
              </h2>
              
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-yellow-400/20">
                      <th className="text-left py-3 px-4 font-medium text-gray-400 uppercase text-sm">
                        DBA
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-400 uppercase text-sm">
                        Business Contact Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-400 uppercase text-sm">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-400 uppercase text-sm">
                        Phone
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-400 uppercase text-sm">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-400 uppercase text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications?.map((app: PreApplication) => (
                      <tr key={app.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                        <td className="py-4 px-4 text-white">
                          {app.dba}
                        </td>
                        <td className="py-4 px-4 text-white">
                          {app.businessContactName}
                        </td>
                        <td className="py-4 px-4 text-white">
                          {app.email}
                        </td>
                        <td className="py-4 px-4 text-white">
                          {app.phone}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(app.status)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleEmailClick(app)}
                              title="Email Pre-Application Form"
                            >
                              <Mail className="h-4 w-4 text-yellow-400" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={() => setViewDetailsDialog({ open: true, application: app })}
                            >
                              <Eye className="h-4 w-4 text-yellow-400" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4 text-yellow-400" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={() => window.open(`/form/JS-2025-001/john-smith`, '_blank')}
                              title="View Form"
                            >
                              <FileText className="h-4 w-4 text-yellow-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {applications?.map((app: PreApplication) => (
                  <Card key={app.id} className="bg-zinc-800/50 border-yellow-400/20">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{app.dba}</h3>
                          <p className="text-sm text-gray-400">{app.businessContactName}</p>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-white">{app.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-white">{app.phone}</span>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEmailClick(app)}
                        >
                          <Mail className="h-4 w-4 text-yellow-600" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={() => setViewDetailsDialog({ open: true, application: app })}
                        >
                          <Eye className="h-4 w-4 text-yellow-600" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4 text-yellow-600" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <FileText className="h-4 w-4 text-yellow-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialog.open} onOpenChange={(open) => setEmailDialog({ open, application: null })}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">
              Send Pre-Application Email
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Send a professional email to the merchant with their pre-application details.
            </p>
          </DialogHeader>
          
          {emailDialog.application && (
            <div className="space-y-4 py-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-medium text-black dark:text-white">Business: {emailDialog.application.dba}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Contact: {emailDialog.application.businessContactName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-black dark:text-white">First Name</Label>
                  <Input
                    id="firstName"
                    value={emailForm.firstName}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-black dark:text-white">Last Name</Label>
                  <Input
                    id="lastName"
                    value={emailForm.lastName}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Smith"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black dark:text-white">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@business.com"
                />
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
                <p className="text-sm font-medium text-black dark:text-white mb-2">Email Preview:</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  The email will include the merchant's business details, contact information, 
                  and a personalized message requesting them to complete their pre-application form.
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEmailDialog({ open: false, application: null })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={sendEmailMutation.isPending || !emailForm.firstName || !emailForm.lastName || !emailForm.email}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  {sendEmailMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Link Email Dialog */}
      <Dialog open={formLinkEmailDialog} onOpenChange={setFormLinkEmailDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">
              Send Pre-Application Form Link
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Send the pre-application form link to a prospect via email.
            </p>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/40 p-4 rounded-lg border-2 border-yellow-300 dark:border-yellow-700">
              <p className="text-sm font-semibold text-black dark:text-white mb-2">Form Link:</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 font-mono break-all bg-white dark:bg-gray-700 p-2 rounded border">{formLink}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prospectFirstName" className="text-black dark:text-white">First Name</Label>
                <Input
                  id="prospectFirstName"
                  value={emailForm.firstName}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prospectLastName" className="text-black dark:text-white">Last Name</Label>
                <Input
                  id="prospectLastName"
                  value={emailForm.lastName}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Smith"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prospectEmail" className="text-black dark:text-white">Email Address</Label>
              <Input
                id="prospectEmail"
                type="email"
                value={emailForm.email}
                onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@business.com"
              />
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600">
              <p className="text-sm font-semibold text-black dark:text-white mb-2">Email Preview:</p>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                The prospect will receive a professional email with the pre-application form link 
                and instructions to complete their merchant application.
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setFormLinkEmailDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendFormLink}
                disabled={sendFormLinkMutation.isPending || !emailForm.firstName || !emailForm.lastName || !emailForm.email}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {sendFormLinkMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Form Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsDialog.open} onOpenChange={(open) => setViewDetailsDialog({ open, application: null })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">
              Pre-Application Details: {viewDetailsDialog.application?.dba}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {viewDetailsDialog.application && (
              <>
                {/* Business Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gray-50 dark:bg-gray-800/50">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center">
                        <Building className="h-5 w-5 mr-2 text-yellow-600" />
                        Business Information
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">DBA:</span>
                          <span className="ml-2 text-black dark:text-white">{viewDetailsDialog.application.dba}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">Business Type:</span>
                          <span className="ml-2 text-black dark:text-white">{viewDetailsDialog.application.businessType || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">Monthly Volume:</span>
                          <span className="ml-2 text-black dark:text-white">
                            {viewDetailsDialog.application.monthlyVolume ? `$${viewDetailsDialog.application.monthlyVolume.toLocaleString()}` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">Average Ticket:</span>
                          <span className="ml-2 text-black dark:text-white">
                            {viewDetailsDialog.application.averageTicket ? `$${viewDetailsDialog.application.averageTicket.toLocaleString()}` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-50 dark:bg-gray-800/50">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2 text-yellow-600" />
                        Contact Information
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">Contact Name:</span>
                          <span className="ml-2 text-black dark:text-white">{viewDetailsDialog.application.businessContactName}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">Email:</span>
                          <span className="ml-2 text-black dark:text-white">{viewDetailsDialog.application.email}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">Phone:</span>
                          <span className="ml-2 text-black dark:text-white">{viewDetailsDialog.application.phone}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">Status:</span>
                          <span className="ml-2">{getStatusBadge(viewDetailsDialog.application.status)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Form Submission */}
                {viewDetailsDialog.application.notes && (
                  <Card className="bg-gray-50 dark:bg-gray-800/50">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-yellow-600" />
                        Complete Form Submission Details
                      </h3>
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border">
                        <pre className="text-sm text-black dark:text-white whitespace-pre-wrap font-mono">
                          {viewDetailsDialog.application.notes}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Application Timeline */}
                <Card className="bg-gray-50 dark:bg-gray-800/50">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Application Timeline</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Submitted:</span>
                        <span className="text-black dark:text-white">
                          {new Date(viewDetailsDialog.application.submittedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-300">Current Status:</span>
                        <span>{getStatusBadge(viewDetailsDialog.application.status)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setViewDetailsDialog({ open: false, application: null })}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setViewDetailsDialog({ open: false, application: null });
                      setEmailDialog({ open: true, application: viewDetailsDialog.application });
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}