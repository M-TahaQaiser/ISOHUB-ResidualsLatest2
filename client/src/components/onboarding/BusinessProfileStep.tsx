import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Brain, CheckCircle } from 'lucide-react';

const businessProfileSchema = z.object({
  idealClients: z.string().min(10, "Please provide at least 10 characters"),
  targetAudience: z.string().min(10, "Please provide at least 10 characters"),
  offers: z.string().min(10, "Please provide at least 10 characters"),
  strengths: z.string().min(10, "Please provide at least 10 characters"),
  challenges: z.string().min(10, "Please provide at least 10 characters"),
  purchaseMotivations: z.string().min(10, "Please provide at least 10 characters"),
});

type BusinessProfileForm = z.infer<typeof businessProfileSchema>;

interface BusinessProfileStepProps {
  organizationId: string;
  organization: any;
  progress: any;
  onComplete: (data: any) => void;
  isLoading: boolean;
}

export default function BusinessProfileStep({
  organizationId,
  organization,
  progress,
  onComplete,
  isLoading,
}: BusinessProfileStepProps) {
  const [aiProfile, setAiProfile] = useState<any>(null);
  
  const form = useForm<BusinessProfileForm>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      idealClients: '',
      targetAudience: '',
      offers: '',
      strengths: '',
      challenges: '',
      purchaseMotivations: '',
    },
  });

  const generateProfileMutation = useMutation({
    mutationFn: async (data: BusinessProfileForm) => {
      return await apiRequest(`/api/onboarding/business-profile/${organizationId}`, {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: (data) => {
      setAiProfile(data.profile);
    },
  });

  const handleGenerateProfile = (data: BusinessProfileForm) => {
    generateProfileMutation.mutate(data);
  };

  const handleComplete = () => {
    const formData = form.getValues();
    const businessProfileData = {
      ...formData,
      aiGeneratedProfile: aiProfile,
      completedAt: new Date().toISOString(),
    };
    
    onComplete(businessProfileData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                Help us understand your business to provide personalized AI insights
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(handleGenerateProfile)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="idealClients">Ideal Clients</Label>
                <Textarea
                  id="idealClients"
                  placeholder="Describe your ideal client profile..."
                  rows={3}
                  {...form.register('idealClients')}
                />
                {form.formState.errors.idealClients && (
                  <p className="text-sm text-red-600">{form.formState.errors.idealClients.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Textarea
                  id="targetAudience"
                  placeholder="Who are you trying to reach?"
                  rows={3}
                  {...form.register('targetAudience')}
                />
                {form.formState.errors.targetAudience && (
                  <p className="text-sm text-red-600">{form.formState.errors.targetAudience.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="offers">Products & Services</Label>
                <Textarea
                  id="offers"
                  placeholder="What do you offer your clients?"
                  rows={3}
                  {...form.register('offers')}
                />
                {form.formState.errors.offers && (
                  <p className="text-sm text-red-600">{form.formState.errors.offers.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="strengths">Competitive Strengths</Label>
                <Textarea
                  id="strengths"
                  placeholder="What sets you apart from competitors?"
                  rows={3}
                  {...form.register('strengths')}
                />
                {form.formState.errors.strengths && (
                  <p className="text-sm text-red-600">{form.formState.errors.strengths.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="challenges">Business Challenges</Label>
                <Textarea
                  id="challenges"
                  placeholder="What challenges are you facing?"
                  rows={3}
                  {...form.register('challenges')}
                />
                {form.formState.errors.challenges && (
                  <p className="text-sm text-red-600">{form.formState.errors.challenges.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseMotivations">Purchase Motivations</Label>
                <Textarea
                  id="purchaseMotivations"
                  placeholder="Why do clients choose to work with you?"
                  rows={3}
                  {...form.register('purchaseMotivations')}
                />
                {form.formState.errors.purchaseMotivations && (
                  <p className="text-sm text-red-600">{form.formState.errors.purchaseMotivations.message}</p>
                )}
              </div>
            </div>

            {generateProfileMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to generate AI profile. Please try again.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={generateProfileMutation.isPending}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                {generateProfileMutation.isPending ? (
                  <>
                    <span className="mr-2">Processing...</span>
                    Generating AI Profile...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Generate AI Business Profile
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* AI Generated Profile */}
          {aiProfile && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  AI-Generated Business Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Summary</h4>
                  <p className="text-sm text-gray-700">{aiProfile.summary}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Target Market</h4>
                  <p className="text-sm text-gray-700">{aiProfile.targetMarket}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Value Proposition</h4>
                  <p className="text-sm text-gray-700">{aiProfile.valueProposition}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Competitive Advantages</h4>
                  <p className="text-sm text-gray-700">{aiProfile.competitiveAdvantages}</p>
                </div>

                {aiProfile.recommendations && (
                  <div>
                    <h4 className="font-medium text-gray-900">AI Recommendations</h4>
                    <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                      {aiProfile.recommendations.map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleComplete}
                    disabled={isLoading}
                    className="bg-black hover:bg-gray-800 text-white font-medium"
                  >
                    {isLoading ? (
                      <>
                        <span className="mr-2">Processing...</span>
                        Saving...
                      </>
                    ) : (
                      'Save Profile & Continue'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}