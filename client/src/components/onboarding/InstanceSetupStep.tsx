import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Settings } from 'lucide-react';

const instanceSetupSchema = z.object({
  instanceName: z.string().min(1, "Instance name is required"),
  terminology: z.string().min(1, "Terminology preference is required"),
  timeZone: z.string().min(1, "Time zone is required"),
  currency: z.string().min(1, "Currency is required"),
  dateFormat: z.string().min(1, "Date format is required"),
  language: z.string().min(1, "Language is required"),
  welcomeMessage: z.string().optional(),
});

type InstanceSetupForm = z.infer<typeof instanceSetupSchema>;

interface InstanceSetupStepProps {
  organizationId: string;
  organization: any;
  progress: any;
  onComplete: (data: any) => void;
  isLoading: boolean;
}

export default function InstanceSetupStep({
  organizationId,
  organization,
  progress,
  onComplete,
  isLoading,
}: InstanceSetupStepProps) {
  const form = useForm<InstanceSetupForm>({
    resolver: zodResolver(instanceSetupSchema),
    defaultValues: {
      instanceName: organization?.name || '',
      terminology: 'organization',
      timeZone: 'America/New_York',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      language: 'en',
      welcomeMessage: `Welcome to ${organization?.name || 'your organization'}! Your payment processing workspace is ready.`,
    },
  });

  const handleSubmit = (data: InstanceSetupForm) => {
    const instanceData = {
      ...data,
      setupCompletedAt: new Date().toISOString(),
      aiConfiguration: {
        enabled: true,
        primaryPrompts: [
          "You are a payment processing expert assistant for {{ORGANIZATION_NAME}}",
          "Always provide accurate, compliant financial advice",
          "Focus on merchant services and payment processing solutions",
          "Maintain professional tone and ISOHub branding"
        ],
        systemInstructions: [
          "Use {{TERMINOLOGY}} instead of generic terms throughout the interface",
          "Apply {{CURRENCY}} and {{DATE_FORMAT}} formatting consistently",
          "Provide time-zone aware scheduling for {{TIME_ZONE}}",
          "Generate reports and insights specific to payment processing industry"
        ],
        businessLogic: {
          residualCalculations: "automated",
          merchantOnboarding: "guided",
          reportGeneration: "ai-assisted",
          complianceChecks: "enabled"
        }
      }
    };

    onComplete(instanceData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Instance Configuration</CardTitle>
              <CardDescription>
                Configure your workspace terminology and regional preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="instanceName">Instance Name</Label>
                <Input
                  id="instanceName"
                  placeholder="My Payment Hub"
                  {...form.register('instanceName')}
                />
                {form.formState.errors.instanceName && (
                  <p className="text-sm text-red-600">{form.formState.errors.instanceName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="terminology">Preferred Terminology</Label>
                <Select
                  value={form.watch('terminology')}
                  onValueChange={(value) => form.setValue('terminology', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select terminology" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organization">Organization</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.terminology && (
                  <p className="text-sm text-red-600">{form.formState.errors.terminology.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeZone">Time Zone</Label>
                <Select
                  value={form.watch('timeZone')}
                  onValueChange={(value) => form.setValue('timeZone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.timeZone && (
                  <p className="text-sm text-red-600">{form.formState.errors.timeZone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={form.watch('currency')}
                  onValueChange={(value) => form.setValue('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.currency && (
                  <p className="text-sm text-red-600">{form.formState.errors.currency.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select
                  value={form.watch('dateFormat')}
                  onValueChange={(value) => form.setValue('dateFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (UK)</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.dateFormat && (
                  <p className="text-sm text-red-600">{form.formState.errors.dateFormat.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={form.watch('language')}
                  onValueChange={(value) => form.setValue('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.language && (
                  <p className="text-sm text-red-600">{form.formState.errors.language.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Welcome Message</Label>
              <Textarea
                id="welcomeMessage"
                placeholder="Customize the welcome message for your team..."
                rows={3}
                {...form.register('welcomeMessage')}
              />
              <p className="text-sm text-gray-600">
                This message will appear on your dashboard and in welcome emails
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🤖 AI System Configuration</h4>
              <p className="text-sm text-blue-800 mb-3">
                Your AI assistant will be configured with these preferences and specialized for payment processing.
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Terminology will be consistent throughout the interface</li>
                <li>• Regional formatting for dates, currency, and time zones</li>
                <li>• Industry-specific prompts and business logic</li>
                <li>• Automated residual calculations and reporting</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-black hover:bg-gray-800 text-white font-medium"
              >
                {isLoading ? (
                  <>
                    <span className="mr-2">Processing...</span>
                    Saving Configuration...
                  </>
                ) : (
                  'Save & Continue'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}