import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Play, ArrowRight, Loader2, Compass } from 'lucide-react';

interface DashboardTourStepProps {
  organizationId: string;
  organization: any;
  progress: any;
  onComplete: (data: any) => void;
  isLoading: boolean;
}

export default function DashboardTourStep({
  organizationId,
  organization,
  progress,
  onComplete,
  isLoading,
}: DashboardTourStepProps) {
  const [tourStarted, setTourStarted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const tourSteps = [
    {
      id: 'dashboard-overview',
      title: 'Dashboard Overview',
      description: 'Get familiar with your main workspace and key metrics',
      duration: '2 min',
      features: ['Revenue tracking', 'Merchant status', 'Quick actions', 'Recent activity'],
    },
    {
      id: 'merchant-management',
      title: 'Merchant Management',
      description: 'Learn to manage your merchant portfolio',
      duration: '3 min',
      features: ['Add merchants', 'View details', 'Track payments', 'Assignment management'],
    },
    {
      id: 'reports-analytics',
      title: 'Reports & Analytics',
      description: 'Discover powerful reporting and AI insights',
      duration: '4 min',
      features: ['AI report builder', 'Custom queries', 'Scheduled reports', 'Export options'],
    },
    {
      id: 'document-portal',
      title: 'Document Portal',
      description: 'Secure document sharing and management',
      duration: '2 min',
      features: ['Upload documents', 'Client sharing', 'Access controls', 'Version history'],
    },
    {
      id: 'pre-applications',
      title: 'Pre-Applications',
      description: 'Streamlined merchant application process',
      duration: '3 min',
      features: ['Generate links', 'Track submissions', 'Email automation', 'Status management'],
    },
    {
      id: 'team-collaboration',
      title: 'Team & Collaboration',
      description: 'Work effectively with your team',
      duration: '2 min',
      features: ['User roles', 'Permissions', 'Team workspaces', 'Communication'],
    },
  ];

  const handleStartTour = () => {
    setTourStarted(true);
    // Simulate tour progression
    const interval = setInterval(() => {
      setCompletedSteps(prev => {
        if (prev.length < tourSteps.length) {
          return [...prev, tourSteps[prev.length].id];
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1500);
  };

  const handleComplete = () => {
    const tourData = {
      tourCompleted: true,
      completedSteps: completedSteps,
      tourDuration: tourSteps.length * 2.5, // Approximate minutes
      completedAt: new Date().toISOString(),
      redirectToDashboard: true,
    };

    onComplete(tourData);
  };

  const handleSkipTour = () => {
    const tourData = {
      tourCompleted: false,
      skipped: true,
      skippedAt: new Date().toISOString(),
      redirectToDashboard: true,
    };

    onComplete(tourData);
  };

  const allStepsCompleted = completedSteps.length === tourSteps.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Interactive Dashboard Tour</CardTitle>
              <CardDescription>
                Learn your new workspace with a guided tour of key features
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!tourStarted ? (
            <>
              {/* Pre-Tour Information */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
                  <Play className="h-10 w-10 text-purple-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold">Welcome to Your Payment Hub!</h3>
                  <p className="text-gray-600 mt-2">
                    Take a 15-minute guided tour to discover all the powerful features at your fingertips.
                  </p>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={handleStartTour}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Interactive Tour
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleSkipTour}
                  >
                    Skip Tour for Now
                  </Button>
                </div>
              </div>

              {/* Tour Steps Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tourSteps.map((step, index) => (
                  <Card key={step.id} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">
                            {index + 1}
                          </div>
                          <h4 className="font-medium">{step.title}</h4>
                        </div>
                        <Badge variant="outline">{step.duration}</Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                      
                      <ul className="text-xs text-gray-500 space-y-1">
                        {step.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Tour Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Tour in Progress</h3>
                  <Badge className="bg-purple-100 text-purple-800">
                    {completedSteps.length} of {tourSteps.length} completed
                  </Badge>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(completedSteps.length / tourSteps.length) * 100}%` }}
                  />
                </div>

                {/* Tour Steps with Progress */}
                <div className="space-y-3">
                  {tourSteps.map((step, index) => {
                    const isCompleted = completedSteps.includes(step.id);
                    const isCurrent = completedSteps.length === index;
                    
                    return (
                      <div
                        key={step.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border ${
                          isCompleted
                            ? 'bg-green-50 border-green-200'
                            : isCurrent
                            ? 'bg-purple-50 border-purple-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <span className="text-sm font-bold">{index + 1}</span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium">{step.title}</h4>
                          <p className="text-sm text-gray-600">{step.description}</p>
                        </div>
                        
                        {isCurrent && (
                          <span className="text-sm text-purple-500">Loading...</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {allStepsCompleted && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-green-800">Tour Completed!</h3>
                      <p className="text-green-700 mb-4">
                        Congratulations! You're now ready to make the most of your ISOHub workspace.
                      </p>
                      
                      <Button
                        onClick={handleComplete}
                        disabled={isLoading}
                        className="bg-black hover:bg-gray-800 text-white font-medium"
                      >
                        {isLoading ? (
                          <>
                            <span className="mr-2">Processing...</span>
                            Completing Setup...
                          </>
                        ) : (
                          <>
                            Go to Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}