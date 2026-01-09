import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { 
  Plus, 
  Mail, 
  DollarSign, 
  Power, 
  Copy, 
  Check, 
  ExternalLink,
  Send,
  UserPlus,
  Building2,
  Phone,
  Trash2,
  Edit,
  Clock,
  RefreshCw
} from "lucide-react";

const createProspectSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactFirstName: z.string().min(1, "First name is required"),
  contactLastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  totalPrice: z.string().optional(),
  pricingNotes: z.string().optional(),
  notes: z.string().optional(),
});

type CreateProspectFormData = z.infer<typeof createProspectSchema>;

interface Prospect {
  id: number;
  prospectId: string;
  companyName: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone?: string;
  totalPrice?: string;
  pricingNotes?: string;
  invoiceLink?: string;
  invoiceSentAt?: string;
  isPaid: boolean;
  paidAt?: string;
  isActive: boolean;
  status: string;
  onboardingToken?: string;
  welcomeEmailSent: boolean;
  welcomeEmailSentAt?: string;
  convertedToAgencyId?: number;
  notes?: string;
  createdAt: string;
}

function getStatusBadge(status: string) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className?: string }> = {
    new: { variant: "secondary", label: "New" },
    invoice_sent: { variant: "outline", label: "Invoice Sent" },
    paid: { variant: "default", label: "Paid" },
    pending_activation: { variant: "outline", label: "Pending Activation", className: "border-yellow-500 text-yellow-400" },
    onboarding: { variant: "default", label: "Onboarding In Progress", className: "bg-blue-600" },
    onboarding_complete: { variant: "default", label: "Onboarding Complete", className: "bg-green-600" },
    converted: { variant: "default", label: "Active Agency", className: "bg-green-600" },
    cancelled: { variant: "destructive", label: "Cancelled" },
  };
  const config = variants[status] || variants.new;
  return <Badge variant={config.variant} className={config.className} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
}

export default function ProspectManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [invoiceLinkInput, setInvoiceLinkInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resendingProspectId, setResendingProspectId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ prospects: Prospect[] }>({
    queryKey: ["/api/prospects"],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const form = useForm<CreateProspectFormData>({
    resolver: zodResolver(createProspectSchema),
    defaultValues: {
      companyName: "",
      contactFirstName: "",
      contactLastName: "",
      email: "",
      phone: "",
      totalPrice: "",
      pricingNotes: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateProspectFormData) => {
      return apiRequest("/api/prospects", {
        method: "POST",
        body: {
          ...data,
          totalPrice: data.totalPrice || null,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/prospects"] });
      setIsCreateOpen(false);
      form.reset();
      toast({ title: "Success", description: "Prospect created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create prospect", variant: "destructive" });
    },
  });

  const togglePaymentMutation = useMutation({
    mutationFn: async ({ prospectId, isPaid, isActive }: { prospectId: string; isPaid?: boolean; isActive?: boolean }) => {
      return apiRequest(`/api/prospects/${prospectId}/toggle-payment`, {
        method: "POST",
        body: { isPaid, isActive },
      });
    },
    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({ queryKey: ["/api/prospects"] });
      const action = variables.isPaid !== undefined ? "payment" : "active";
      toast({ title: "Success", description: `Updated ${action} status` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    },
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: async ({ prospectId, invoiceLink }: { prospectId: string; invoiceLink: string }) => {
      return apiRequest(`/api/prospects/${prospectId}/send-invoice`, {
        method: "POST",
        body: { invoiceLink },
      });
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/prospects"] });
      setSelectedProspect(null);
      setInvoiceLinkInput("");
      toast({ title: "Success", description: "Invoice link saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save invoice link", variant: "destructive" });
    },
  });

  const sendWelcomeMutation = useMutation({
    mutationFn: async (prospectId: string) => {
      return apiRequest(`/api/prospects/${prospectId}/send-welcome`, {
        method: "POST",
      });
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/prospects"] });
      toast({ title: "Success", description: "Welcome email sent" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send welcome email", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (prospectId: string) => {
      return apiRequest(`/api/prospects/${prospectId}`, {
        method: "DELETE",
      });
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/prospects"] });
      toast({ title: "Success", description: "Prospect deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete prospect", variant: "destructive" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (prospectId: string) => {
      return apiRequest(`/api/prospects/${prospectId}/activate`, {
        method: "POST",
      });
    },
    onSuccess: async (data: { onboardingLink?: string }) => {
      await queryClient.refetchQueries({ queryKey: ["/api/prospects"] });
      toast({ 
        title: "Prospect Activated", 
        description: "Payment confirmed, onboarding access enabled, and welcome email sent!"
      });
      if (data.onboardingLink) {
        toast({
          title: "Onboarding Link",
          description: data.onboardingLink
        });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to activate prospect", variant: "destructive" });
    },
  });

  const resendEmailMutation = useMutation({
    mutationFn: async (prospectId: string) => {
      setResendingProspectId(prospectId);
      return apiRequest(`/api/prospects/${prospectId}/resend-email`, {
        method: "POST",
      });
    },
    onSuccess: async (data: { onboardingLink?: string }) => {
      setResendingProspectId(null);
      await queryClient.refetchQueries({ queryKey: ["/api/prospects"] });
      toast({ 
        title: "Email Resent", 
        description: "Welcome email has been resent to the prospect"
      });
      if (data.onboardingLink) {
        toast({
          title: "New Onboarding Link",
          description: data.onboardingLink
        });
      }
    },
    onError: () => {
      setResendingProspectId(null);
      toast({ title: "Error", description: "Failed to resend email", variant: "destructive" });
    },
  });

  const onSubmit = (data: CreateProspectFormData) => {
    createMutation.mutate(data);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied", description: "Link copied to clipboard" });
  };

  const prospects = data?.prospects || [];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400" data-testid="text-page-title">
              Prospect Management
            </h1>
            <p className="text-gray-400 mt-1">
              Pre-onboarding client pipeline - create prospects, send invoices, manage access
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-400 text-black hover:bg-yellow-500" data-testid="button-add-prospect">
                <Plus className="w-4 h-4 mr-2" />
                Add Prospect
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-yellow-400">Create New Prospect</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Add a new prospect to your pipeline. They'll receive onboarding access once marked as paid and active.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Company Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="bg-zinc-800 border-zinc-700 text-white"
                            placeholder="Acme Payments"
                            data-testid="input-company-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">First Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-zinc-800 border-zinc-700 text-white"
                              placeholder="John"
                              data-testid="input-first-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Last Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="bg-zinc-800 border-zinc-700 text-white"
                              placeholder="Doe"
                              data-testid="input-last-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Email</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            className="bg-zinc-800 border-zinc-700 text-white"
                            placeholder="john@acme.com"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Phone</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="bg-zinc-800 border-zinc-700 text-white"
                            placeholder="(555) 123-4567"
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="totalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Total Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            step="0.01"
                            className="bg-zinc-800 border-zinc-700 text-white"
                            placeholder="499.00"
                            data-testid="input-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="bg-zinc-800 border-zinc-700 text-white"
                            placeholder="Internal notes about this prospect..."
                            data-testid="input-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-prospect"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Prospect"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Prospects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-total-prospects">
                {prospects.length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Awaiting Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400" data-testid="text-awaiting-payment">
                {prospects.filter(p => !p.isPaid && p.status !== 'cancelled').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Onboarding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400" data-testid="text-active-onboarding">
                {prospects.filter(p => p.isActive && p.status === 'onboarding').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Converted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400" data-testid="text-converted">
                {prospects.filter(p => p.status === 'converted').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Prospect Pipeline</CardTitle>
            <CardDescription className="text-gray-400">
              Manage your pre-onboarding prospects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
              </div>
            ) : prospects.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No prospects yet. Add your first prospect to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-gray-400">Company</TableHead>
                    <TableHead className="text-gray-400">Contact</TableHead>
                    <TableHead className="text-gray-400">Price</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400 text-center">Paid</TableHead>
                    <TableHead className="text-gray-400 text-center">Active</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospects.map((prospect) => (
                    <TableRow key={prospect.id} className="border-zinc-800" data-testid={`row-prospect-${prospect.prospectId}`}>
                      <TableCell>
                        <div className="font-medium text-white">{prospect.companyName}</div>
                        <div className="text-sm text-gray-400">{prospect.prospectId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-white">{prospect.contactFirstName} {prospect.contactLastName}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {prospect.email}
                        </div>
                        {prospect.phone && (
                          <div className="text-sm text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {prospect.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {prospect.totalPrice && (
                          <span className="text-green-400 font-medium">
                            ${parseFloat(prospect.totalPrice).toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(prospect.status)}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={prospect.isPaid}
                          onCheckedChange={(checked) => 
                            togglePaymentMutation.mutate({ 
                              prospectId: prospect.prospectId, 
                              isPaid: checked 
                            })
                          }
                          disabled={togglePaymentMutation.isPending}
                          data-testid={`switch-paid-${prospect.prospectId}`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={prospect.isActive}
                          onCheckedChange={(checked) => 
                            togglePaymentMutation.mutate({ 
                              prospectId: prospect.prospectId, 
                              isActive: checked 
                            })
                          }
                          disabled={!prospect.isPaid || togglePaymentMutation.isPending}
                          className={!prospect.isPaid ? "opacity-50" : ""}
                          data-testid={`switch-active-${prospect.prospectId}`}
                        />
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="border-zinc-700 text-gray-300 hover:bg-zinc-800"
                                    onClick={() => {
                                      setSelectedProspect(prospect);
                                      setInvoiceLinkInput(prospect.invoiceLink || "");
                                    }}
                                    data-testid={`button-invoice-${prospect.prospectId}`}
                                  >
                                    <DollarSign className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Manage Invoice Link</p>
                              </TooltipContent>
                            </Tooltip>
                            <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                              <DialogHeader>
                                <DialogTitle className="text-yellow-400">Invoice Link</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                  Paste your invoice link (from Stripe, PayPal, etc.) to track
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-gray-300">Invoice URL</Label>
                                  <Input
                                    value={invoiceLinkInput}
                                    onChange={(e) => setInvoiceLinkInput(e.target.value)}
                                    placeholder="https://stripe.com/invoice/..."
                                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                                    data-testid="input-invoice-link"
                                  />
                                </div>
                                {prospect.invoiceLink && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-zinc-700"
                                      onClick={() => copyToClipboard(prospect.invoiceLink!, prospect.prospectId)}
                                      data-testid={`button-copy-invoice-${prospect.prospectId}`}
                                    >
                                      {copiedId === prospect.prospectId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                    <a 
                                      href={prospect.invoiceLink} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-yellow-400 hover:underline flex items-center gap-1"
                                    >
                                      Open <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                )}
                                <Button
                                  onClick={() => {
                                    if (selectedProspect && invoiceLinkInput) {
                                      sendInvoiceMutation.mutate({
                                        prospectId: selectedProspect.prospectId,
                                        invoiceLink: invoiceLinkInput
                                      });
                                    }
                                  }}
                                  disabled={!invoiceLinkInput || sendInvoiceMutation.isPending}
                                  className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                                  data-testid="button-save-invoice"
                                >
                                  Save Invoice Link
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {/* Payment/Activation status button */}
                          {!prospect.isPaid ? (
                            <Button
                              size="sm"
                              className="bg-green-600 text-white hover:bg-green-700"
                              onClick={() => activateMutation.mutate(prospect.prospectId)}
                              disabled={activateMutation.isPending}
                              data-testid={`button-mark-paid-${prospect.prospectId}`}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Mark Paid
                            </Button>
                          ) : prospect.status === 'pending_activation' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-yellow-500 text-yellow-400 cursor-not-allowed"
                                disabled
                                data-testid={`button-pending-${prospect.prospectId}`}
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                Awaiting Email
                              </Button>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-500 text-blue-400 hover:bg-blue-950"
                                    onClick={() => resendEmailMutation.mutate(prospect.prospectId)}
                                    disabled={resendingProspectId === prospect.prospectId}
                                    data-testid={`button-resend-email-${prospect.prospectId}`}
                                  >
                                    <RefreshCw className={`w-4 h-4 ${resendingProspectId === prospect.prospectId ? 'animate-spin' : ''}`} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Resend Onboarding Email</p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          ) : prospect.status === 'onboarding' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-500 text-blue-400 cursor-not-allowed"
                                disabled
                                data-testid={`button-onboarding-${prospect.prospectId}`}
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Onboarding...
                              </Button>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-500 text-blue-400 hover:bg-blue-950"
                                    onClick={() => resendEmailMutation.mutate(prospect.prospectId)}
                                    disabled={resendingProspectId === prospect.prospectId}
                                    data-testid={`button-resend-email-${prospect.prospectId}`}
                                  >
                                    <RefreshCw className={`w-4 h-4 ${resendingProspectId === prospect.prospectId ? 'animate-spin' : ''}`} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Resend Onboarding Email</p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          ) : prospect.status === 'converted' || prospect.status === 'onboarding_complete' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500 text-green-400 cursor-not-allowed"
                              disabled
                              data-testid={`button-complete-${prospect.prospectId}`}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                          ) : null}
                          
                          {prospect.isActive && !prospect.welcomeEmailSent && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-zinc-700 text-gray-300 hover:bg-zinc-800"
                                  onClick={() => sendWelcomeMutation.mutate(prospect.prospectId)}
                                  disabled={sendWelcomeMutation.isPending}
                                  data-testid={`button-send-welcome-${prospect.prospectId}`}
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Send Welcome Email</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          {prospect.onboardingToken && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-zinc-700 text-gray-300 hover:bg-zinc-800"
                                  onClick={() => copyToClipboard(
                                    `${window.location.origin}/onboarding?token=${prospect.onboardingToken}`,
                                    `onb-${prospect.prospectId}`
                                  )}
                                  data-testid={`button-copy-onboarding-${prospect.prospectId}`}
                                >
                                  {copiedId === `onb-${prospect.prospectId}` ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy Onboarding Link</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-950"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this prospect?")) {
                                    deleteMutation.mutate(prospect.prospectId);
                                  }
                                }}
                                data-testid={`button-delete-${prospect.prospectId}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Prospect</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
