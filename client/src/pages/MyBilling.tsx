import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Receipt, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Download,
  Plus,
  Edit,
  Trash2,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  paidDate?: string;
  description: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  brand?: string;
  lastFour: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface BillingInfo {
  planName: string;
  planType: 'starter' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  nextBillingDate: string;
  amount: number;
  status: 'active' | 'past_due' | 'cancelled';
}

export default function MyBilling() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  const mockBillingInfo: BillingInfo = {
    planName: 'Professional Plan',
    planType: 'professional',
    billingCycle: 'monthly',
    nextBillingDate: '2025-12-21',
    amount: 299.00,
    status: 'active'
  };

  const mockInvoices: Invoice[] = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2025-001',
      amount: 299.00,
      status: 'paid',
      dueDate: '2025-11-21',
      paidDate: '2025-11-20',
      description: 'Professional Plan - November 2025'
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2025-002',
      amount: 299.00,
      status: 'pending',
      dueDate: '2025-12-21',
      description: 'Professional Plan - December 2025'
    },
    {
      id: 'inv-3',
      invoiceNumber: 'INV-2024-012',
      amount: 299.00,
      status: 'paid',
      dueDate: '2024-10-21',
      paidDate: '2024-10-19',
      description: 'Professional Plan - October 2024'
    },
    {
      id: 'inv-4',
      invoiceNumber: 'INV-2024-011',
      amount: 299.00,
      status: 'paid',
      dueDate: '2024-09-21',
      paidDate: '2024-09-21',
      description: 'Professional Plan - September 2024'
    }
  ];

  const mockPaymentMethods: PaymentMethod[] = [
    {
      id: 'pm-1',
      type: 'card',
      brand: 'Visa',
      lastFour: '4242',
      expiryMonth: 12,
      expiryYear: 2026,
      isDefault: true
    },
    {
      id: 'pm-2',
      type: 'card',
      brand: 'Mastercard',
      lastFour: '8888',
      expiryMonth: 6,
      expiryYear: 2025,
      isDefault: false
    }
  ];

  const { data: billingInfo, isLoading: billingLoading } = useQuery({
    queryKey: ['/api/my-billing/info'],
    queryFn: () => Promise.resolve(mockBillingInfo),
    initialData: mockBillingInfo
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['/api/my-billing/invoices'],
    queryFn: () => Promise.resolve(mockInvoices),
    initialData: mockInvoices
  });

  const { data: paymentMethods, isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ['/api/my-billing/payment-methods'],
    queryFn: () => Promise.resolve(mockPaymentMethods),
    initialData: mockPaymentMethods
  });

  const getStatusBadge = (status: Invoice['status']) => {
    const config = {
      paid: { className: 'bg-green-500/20 text-green-400 border-green-500/30', text: 'Paid' },
      pending: { className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', text: 'Pending' },
      overdue: { className: 'bg-red-500/20 text-red-400 border-red-500/30', text: 'Overdue' }
    };
    return <Badge className={config[status].className}>{config[status].text}</Badge>;
  };

  const getPlanBadge = (planType: BillingInfo['planType']) => {
    const config = {
      starter: { className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', text: 'Starter' },
      professional: { className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', text: 'Professional' },
      enterprise: { className: 'bg-purple-500/20 text-purple-400 border-purple-500/30', text: 'Enterprise' }
    };
    return <Badge className={config[planType].className}>{config[planType].text}</Badge>;
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: "Invoice Download",
      description: "Invoice PDF is being generated...",
    });
  };

  const handleAddPaymentMethod = () => {
    toast({
      title: "Add Payment Method",
      description: "This feature will be available soon.",
    });
  };

  const handleSetDefaultPaymentMethod = (id: string) => {
    toast({
      title: "Default Payment Method Updated",
      description: "Your default payment method has been changed.",
    });
  };

  if (billingLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs 
          items={[
            { label: "Billing & Invoices", href: "/my-billing", isActive: true }
          ]} 
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Billing & Invoices</h1>
          <p className="text-gray-400 mt-2">Manage your subscription, view invoices, and update payment methods</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-800 border border-yellow-400/20">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="invoices" 
              className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
            >
              Invoice History
            </TabsTrigger>
            <TabsTrigger 
              value="payment-methods" 
              className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
            >
              Payment Methods
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-zinc-900/80 border-yellow-400/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Current Plan</p>
                      <p className="text-xl font-bold text-white mt-1">{billingInfo?.planName}</p>
                      <div className="mt-2">{getPlanBadge(billingInfo?.planType || 'professional')}</div>
                    </div>
                    <DollarSign className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/80 border-yellow-400/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Next Billing Date</p>
                      <p className="text-xl font-bold text-white mt-1">
                        {new Date(billingInfo?.nextBillingDate || '').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">${billingInfo?.amount?.toFixed(2)}/month</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/80 border-yellow-400/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Account Status</p>
                      <p className="text-xl font-bold text-white mt-1">
                        {billingInfo?.status === 'active' ? 'Active' : 
                         billingInfo?.status === 'past_due' ? 'Past Due' : 'Cancelled'}
                      </p>
                      <Badge className={
                        billingInfo?.status === 'active' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30 mt-2'
                          : 'bg-red-500/20 text-red-400 border-red-500/30 mt-2'
                      }>
                        {billingInfo?.status === 'active' ? 'Active' : 
                         billingInfo?.status === 'past_due' ? 'Action Required' : 'Inactive'}
                      </Badge>
                    </div>
                    {billingInfo?.status === 'active' ? (
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-zinc-900/80 border-yellow-400/20">
              <CardHeader>
                <CardTitle className="text-white">Subscription Details</CardTitle>
                <CardDescription className="text-gray-400">
                  Your current subscription plan and billing cycle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Plan</span>
                      <span className="text-white font-medium">{billingInfo?.planName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Billing Cycle</span>
                      <span className="text-white font-medium capitalize">{billingInfo?.billingCycle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly Cost</span>
                      <span className="text-white font-medium">${billingInfo?.amount?.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Next Invoice</span>
                      <span className="text-white font-medium">
                        {new Date(billingInfo?.nextBillingDate || '').toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment Method</span>
                      <span className="text-white font-medium">
                        {paymentMethods?.find(pm => pm.isDefault)?.brand} ****{paymentMethods?.find(pm => pm.isDefault)?.lastFour}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-yellow-400/20">
                  <Button variant="outline" className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10">
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <Card className="bg-zinc-900/80 border-yellow-400/20">
              <CardHeader>
                <CardTitle className="text-white">Invoice History</CardTitle>
                <CardDescription className="text-gray-400">
                  View and download your past invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoices?.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border border-yellow-400/20 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-zinc-700 rounded-lg">
                          <Receipt className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-400">{invoice.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-semibold text-white">${invoice.amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-400">
                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(invoice.status)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          className="text-gray-400 hover:text-yellow-400"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment-methods" className="space-y-6">
            <Card className="bg-zinc-900/80 border-yellow-400/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Payment Methods</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your saved payment methods
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleAddPaymentMethod}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethods?.map((method) => (
                    <div 
                      key={method.id}
                      className="flex items-center justify-between p-4 border border-yellow-400/20 rounded-lg bg-zinc-800/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-zinc-700 rounded-lg">
                          <CreditCard className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">
                              {method.brand} ****{method.lastFour}
                            </p>
                            {method.isDefault && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                            className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-yellow-400"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-400"
                          disabled={method.isDefault}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
