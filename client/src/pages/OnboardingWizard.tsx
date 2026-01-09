import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

// Individual step components
import InstanceSetupStep from '@/components/onboarding/InstanceSetupStep';
import CompanyInfoStep from '@/components/onboarding/CompanyInfoStep';
import OrgChartStep from '@/components/onboarding/OrgChartStep';
import BusinessProfileStep from '@/components/onboarding/BusinessProfileStep';
import VendorSelectionStep from '@/components/onboarding/VendorSelectionStep';
import ProcessorMappingStep from '@/components/onboarding/ProcessorMappingStep';
import DocsHubStep from '@/components/onboarding/DocsHubStep';
import DashboardTourStep from '@/components/onboarding/DashboardTourStep';

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: 'Contact Info & Branding',
    description: 'Set up your company details, logo, and contact information',
    component: CompanyInfoStep, // Merged instance setup + company info
  },
  {
    id: 2,
    title: 'Business Profile',
    description: 'Tell us about your business to get personalized insights',
    component: BusinessProfileStep, // Moved up per user request
  },
  {
    id: 3,
    title: 'Organization Chart',
    description: 'Build your team structure with roles and permissions',
    component: OrgChartStep, // Now after Business Profile
  },
  {
    id: 4,
    title: 'Vendor Selection',
    description: 'Choose your processors, gateways, and hardware partners',
    component: VendorSelectionStep,
  },
  {
    id: 5,
    title: 'Processor & Lead Sheet Setup',
    description: 'Configure column mappings for each processor and lead sheet templates',
    component: ProcessorMappingStep,
  },
  {
    id: 6,
    title: 'FAQ Upload',
    description: 'Import your FAQ from Google Sheets or upload manually',
    component: DocsHubStep, // Temporary - will create dedicated component
  },
  {
    id: 7,
    title: 'Document Center',
    description: 'Connect cloud storage (Google Drive, Dropbox, OneDrive)',
    component: DocsHubStep,
  },
  {
    id: 8,
    title: 'ISO-AI Preferences',
    description: 'Configure your AI assistant tone and behavior',
    component: InstanceSetupStep, // Temporary - will create dedicated component
  },
  {
    id: 9,
    title: 'Residuals Upload',
    description: 'Upload processor residual templates and multi-month data',
    component: DocsHubStep, // Temporary - will create dedicated component
  },
  {
    id: 10,
    title: 'Dashboard Tour',
    description: 'Interactive guide with AI confirmation of all uploaded data',
    component: DashboardTourStep,
  },
];

export default function OnboardingWizard() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [organizationId, setOrganizationId] = useState<string>('');
  const queryClient = useQueryClient();

  // Get organization ID from local storage or URL
  useEffect(() => {
    const storedOrgId = localStorage.getItem('organizationId');
    const urlParams = new URLSearchParams(window.location.search);
    const urlOrgId = urlParams.get('orgId');
    
    const orgId = urlOrgId || storedOrgId;
    if (orgId) {
      setOrganizationId(orgId);
    } else {
      // Redirect to login if no organization ID
      setLocation('/login');
    }
  }, [setLocation]);

  // Fetch onboarding progress
  const { data: progressData, isLoading, error } = useQuery({
    queryKey: ['/api/onboarding/progress', organizationId],
    enabled: !!organizationId,
  });

  // Update current step based on progress
  useEffect(() => {
    if (progressData?.progress) {
      setCurrentStep(progressData.progress.currentStep || 1);
    }
  }, [progressData]);

  // Mutation to update step progress
  const updateStepMutation = useMutation({
    mutationFn: async (data: { step: number; stepData: any }) => {
      return await apiRequest(`/api/onboarding/progress/${organizationId}/step`, {
        method: 'PUT',
        body: {
          step: data.step,
          data: data.stepData,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/onboarding/progress', organizationId] 
      });
    },
  });

  const handleStepComplete = async (stepData: any) => {
    try {
      await updateStepMutation.mutateAsync({
        step: currentStep,
        stepData,
      });

      if (currentStep < ONBOARDING_STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        // Onboarding complete, redirect to dashboard
        setLocation('/dashboard');
      }
    } catch (error) {
      console.error('Failed to update step:', error);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipToStep = (stepNumber: number) => {
    // Only allow navigation to completed steps or the next step
    const progress = progressData?.progress;
    if (!progress) return;

    const completedSteps = [
      progress.step1Complete,
      progress.step2Complete,
      progress.step3Complete,
      progress.step4Complete,
      progress.step5Complete,
      progress.step6Complete,
      progress.step7Complete,
      progress.step8Complete,
    ];

    // Allow navigation to any completed step or the current step
    const canNavigate = stepNumber <= currentStep || completedSteps[stepNumber - 1];
    if (canNavigate) {
      setCurrentStep(stepNumber);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-center text-gray-600 mb-4">Loading onboarding...</div>
          <p>Loading your onboarding progress...</p>
        </div>
      </div>
    );
  }

  if (error || !progressData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Onboarding</CardTitle>
            <CardDescription>
              We couldn't load your onboarding progress. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/login')} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = progressData.progress;
  const organization = progressData.organization;
  const completedSteps = [
    progress?.step1Complete || false,
    progress?.step2Complete || false,
    progress?.step3Complete || false,
    progress?.step4Complete || false,
    progress?.step5Complete || false,
    progress?.step6Complete || false,
    progress?.step7Complete || false,
    progress?.step8Complete || false,
  ];

  const progressPercentage = (completedSteps.filter(Boolean).length / ONBOARDING_STEPS.length) * 100;
  const currentStepData = ONBOARDING_STEPS[currentStep - 1];
  const CurrentStepComponent = currentStepData.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome to ISOHub, {organization?.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Let's get your payment processing workspace set up
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Progress</div>
              <div className="text-lg font-semibold text-yellow-600">
                {Math.round(progressPercentage)}%
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </div>

      {/* Horizontal Step Icons */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-4 mb-8">
          {ONBOARDING_STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleSkipToStep(step.id)}
              className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all ${
                currentStep === step.id
                  ? 'bg-yellow-400/20 border-yellow-400 text-yellow-600 scale-110'
                  : completedSteps[index]
                  ? 'bg-green-500/20 border-green-500 text-green-600'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}
              disabled={!completedSteps[index] && step.id !== currentStep}
              title={step.title}
            >
              {completedSteps[index] ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <Circle className="h-6 w-6" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Main Content */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {currentStepData.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {currentStepData.description}
                    </CardDescription>
                  </div>
                  <div className="text-sm text-gray-500">
                    Step {currentStep} of {ONBOARDING_STEPS.length}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {updateStepMutation.error && (
                  <Alert className="mb-6" variant="destructive">
                    <AlertDescription>
                      Failed to save progress. Please try again.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Render Current Step Component */}
                <CurrentStepComponent
                  organizationId={organizationId}
                  organization={organization}
                  progress={progress}
                  onComplete={handleStepComplete}
                  isLoading={updateStepMutation.isPending}
                />

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex space-x-3">
                    {currentStep < ONBOARDING_STEPS.length && (
                      <Button
                        variant="outline"
                        onClick={() => handleStepComplete({})}
                        disabled={updateStepMutation.isPending}
                      >
                        Skip Step
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}