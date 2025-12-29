import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Settings,
  Users,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BillingRecord {
  id: string;
  agencyId: string;
  agencyName: string;
  planType: 'starter' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  amount: number;
  status: 'active' | 'past_due' | 'cancelled' | 'trial';
  nextBillingDate: string;
  lastPaymentDate?: string;
  paymentMethod?: string;
  transactionId?: string;
}

interface AcceptBlueTransaction {
  id: string;
  amount: number;
  status: 'approved' | 'declined' | 'pending';
  transactionType: 'sale' | 'refund' | 'void';
  cardType?: string;
  lastFour?: string;
  timestamp: string;
}

// TODO: PRODUCTION DEPLOYMENT - Replace with real Accept Blue API integration
const ACCEPT_BLUE_CONFIG = {
  // Accept Blue API requires:
  // - API Key (sandbox: provided by Accept Blue)
  // - Source ID (merchant account identifier)  
  // - Application ID (your application's ID)
  // - Base URL: https://api.acceptblue.com (production) or https://sandbox-api.acceptblue.com (testing)
  
  // Required Headers:
  // - Authorization: Bearer {API_KEY}
  // - Content-Type: application/json
  // - Accept: application/json
  
  // Key Endpoints:
  // - POST /transactions - Process payments
  // - GET /transactions/{id} - Get transaction details
  // - POST /customers - Create customer profiles
  // - GET /customers/{id} - Get customer details
  // - POST /payment-methods - Store payment methods
  // - GET /payment-methods - List stored payment methods
  
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.acceptblue.com'
    : 'https://sandbox-api.acceptblue.com',
  apiKey: 'ACCEPT_BLUE_API_KEY', // TODO: Add to environment variables
  sourceId: 'ACCEPT_BLUE_SOURCE_ID', // TODO: Add to environment variables
  appId: 'ACCEPT_BLUE_APP_ID' // TODO: Add to environment variables
};

export default function BillingModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);

  // TODO: PRODUCTION DEPLOYMENT - Replace mock data with real API calls
  const { data: billingRecords = [], isLoading } = useQuery({
    queryKey: ['/api/billing/records'],
    queryFn: async () => {
      // Mock data - replace with real API call
      return [
        {
          id: 'bill-1',
          agencyId: 'agency-1',
          agencyName: 'T Rex Motors',
          planType: 'professional',
          billingCycle: 'monthly',
          amount: 299.00,
          status: 'active',
          nextBillingDate: '2025-08-21',
          lastPaymentDate: '2025-07-21',
          paymentMethod: 'Visa **** 1234',
          transactionId: 'txn_abc123'
        },
        {
          id: 'bill-2',
          agencyId: 'agency-2',
          agencyName: 'Kailey Kean Tutoring',
          planType: 'starter',
          billingCycle: 'monthly',
          amount: 99.00,
          status: 'past_due',
          nextBillingDate: '2025-07-15',
          lastPaymentDate: '2025-06-15',
          paymentMethod: 'MasterCard **** 5678',
          transactionId: 'txn_def456'
        },
        {
          id: 'bill-3',
          agencyId: 'agency-3',
          agencyName: '100 Cups Academy',
          planType: 'enterprise',
          billingCycle: 'annual',
          amount: 2999.00,
          status: 'active',
          nextBillingDate: '2026-01-15',
          lastPaymentDate: '2025-01-15',
          paymentMethod: 'Visa **** 9012',
          transactionId: 'txn_ghi789'
        }
      ] as BillingRecord[];
    }
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/billing/transactions'],
    queryFn: async () => {
      // Mock Accept Blue transaction data
      return [
        {
          id: 'txn_abc123',
          amount: 299.00,
          status: 'approved',
          transactionType: 'sale',
          cardType: 'Visa',
          lastFour: '1234',
          timestamp: '2025-07-21T10:30:00Z'
        },
        {
          id: 'txn_def456',
          amount: 99.00,
          status: 'declined',
          transactionType: 'sale',
          cardType: 'MasterCard',
          lastFour: '5678',
          timestamp: '2025-07-15T14:22:00Z'
        }
      ] as AcceptBlueTransaction[];
    }
  });

  // Accept Blue payment processing mutation
  const processPaymentMutation = useMutation({
    mutationFn: async ({ agencyId, amount, paymentMethodId }: { 
      agencyId: string; 
      amount: number; 
      paymentMethodId: string; 
    }) => {
      // TODO: PRODUCTION DEPLOYMENT - Implement real Accept Blue API call
      // const response = await fetch(`${ACCEPT_BLUE_CONFIG.baseUrl}/transactions`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${ACCEPT_BLUE_CONFIG.apiKey}`,
      //     'Content-Type': 'application/json',
      //     'Accept': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     source_id: ACCEPT_BLUE_CONFIG.sourceId,
      //     amount: Math.round(amount * 100), // Convert to cents
      //     payment_method_id: paymentMethodId,
      //     transaction_type: 'sale',
      //     description: `ISOHub subscription payment for agency ${agencyId}`
      //   })
      // });
      
      // Mock successful response
      return {
        id: `txn_${Date.now()}`,
        status: 'approved',
        amount,
        transactionType: 'sale'
      };
    },
    onSuccess: () => {
      toast({
        title: "Payment Processed",
        description: "Payment has been successfully processed via Accept Blue",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/records'] });
    },
    onError: () => {
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleProcessPayment = (agencyId: string, amount: number) => {
    processPaymentMutation.mutate({
      agencyId,
      amount,
      paymentMethodId: 'pm_mock_123' // TODO: Use real payment method ID
    });
  };

  const getStatusBadge = (status: BillingRecord['status']) => {
    const statusConfig = {
      active: { color: "bg-green-500/20 text-green-400 border-green-500/30", text: "Active" },
      past_due: { color: "bg-red-500/20 text-red-400 border-red-500/30", text: "Past Due" },
      cancelled: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", text: "Cancelled" },
      trial: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", text: "Trial" }
    };
    
    const config = statusConfig[status];
    return (
      <Badge className={`${config.color}`}>
        {config.text}
      </Badge>
    );
  };

  const getPlanBadge = (planType: BillingRecord['planType']) => {
    const planConfig = {
      starter: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", text: "Starter" },
      professional: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", text: "Professional" },
      enterprise: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", text: "Enterprise" }
    };
    
    const config = planConfig[planType];
    return (
      <Badge className={`${config.color}`}>
        {config.text}
      </Badge>
    );
  };

  const totalRevenue = billingRecords.reduce((sum, record) => sum + record.amount, 0);
  const activeAgencies = billingRecords.filter(record => record.status === 'active').length;
  const pastDueAgencies = billingRecords.filter(record => record.status === 'past_due').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Billing Management</h1>
          <p className="text-gray-400 mt-2">Manage subscription billing via Accept Blue integration</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Agencies</p>
                  <p className="text-2xl font-bold text-white">{activeAgencies}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Past Due</p>
                  <p className="text-2xl font-bold text-white">{pastDueAgencies}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Agencies</p>
                  <p className="text-2xl font-bold text-white">{billingRecords.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="billing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
            <TabsTrigger value="billing" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">Billing Records</TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">Transactions</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black">Accept Blue Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="billing">
            <Card className="bg-zinc-900/80 border-yellow-400/20">
              <CardHeader>
                <CardTitle className="text-white">Agency Billing Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {billingRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border border-yellow-400/20 rounded-lg bg-zinc-800/50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-medium text-white">{record.agencyName}</h4>
                            <p className="text-sm text-gray-400">Next billing: {record.nextBillingDate}</p>
                          </div>
                          {getPlanBadge(record.planType)}
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-white">${record.amount}</p>
                          <p className="text-sm text-gray-400">{record.billingCycle}</p>
                        </div>
                        
                        {record.status === 'past_due' && (
                          <Button
                            onClick={() => handleProcessPayment(record.agencyId, record.amount)}
                            disabled={processPaymentMutation.isPending}
                            className="bg-yellow-400 hover:bg-yellow-500 text-black"
                          >
                            Process Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="bg-zinc-900/80 border-yellow-400/20">
              <CardHeader>
                <CardTitle className="text-white">Accept Blue Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-yellow-400/20 rounded-lg bg-zinc-800/50">
                      <div className="flex items-center space-x-4">
                        <Receipt className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-white">{transaction.id}</p>
                          <p className="text-sm text-gray-400">
                            {transaction.cardType} **** {transaction.lastFour}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge className={
                          transaction.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          transaction.status === 'declined' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }>
                          {transaction.status}
                        </Badge>
                        <p className="font-semibold text-white">${transaction.amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-zinc-900/80 border-yellow-400/20">
              <CardHeader>
                <CardTitle className="text-white">Accept Blue Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Settings className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-400">Production Deployment Required</h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Configure Accept Blue API credentials in environment variables before deployment.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="apiKey" className="text-gray-300">API Key</Label>
                    <Input
                      id="apiKey"
                      placeholder="Accept Blue API Key"
                      type="password"
                      className="mt-1 bg-zinc-800 border-yellow-400/30 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sourceId" className="text-gray-300">Source ID</Label>
                    <Input
                      id="sourceId"
                      placeholder="Accept Blue Source ID"
                      className="mt-1 bg-zinc-800 border-yellow-400/30 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="appId" className="text-gray-300">Application ID</Label>
                    <Input
                      id="appId"
                      placeholder="Accept Blue Application ID"
                      className="mt-1 bg-zinc-800 border-yellow-400/30 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="environment" className="text-gray-300">Environment</Label>
                    <Input
                      id="environment"
                      value={process.env.NODE_ENV === 'production' ? 'Production' : 'Sandbox'}
                      readOnly
                      className="mt-1 bg-zinc-800 border-yellow-400/30 text-gray-400"
                    />
                  </div>
                </div>
                
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
                  Save Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}