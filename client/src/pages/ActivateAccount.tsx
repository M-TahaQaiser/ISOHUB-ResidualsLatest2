import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const activateUserSchema = z.object({
  password: z.string().min(12, "Password must be at least 12 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ActivateUserForm = z.infer<typeof activateUserSchema>;

export default function ActivateAccount() {
  const [, setLocation] = useLocation();
  const [match] = useRoute('/activate');
  const [token, setToken] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const form = useForm<ActivateUserForm>({
    resolver: zodResolver(activateUserSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, []);

  const activateMutation = useMutation({
    mutationFn: async (data: ActivateUserForm & { token: string }) => {
      return await apiRequest('/api/onboarding/activate', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: (data) => {
      setLocation(data.redirectUrl || '/onboarding');
    },
  });

  const handleSubmit = (data: ActivateUserForm) => {
    if (!token) {
      return;
    }
    
    activateMutation.mutate({
      ...data,
      token,
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
        <Card className="w-full max-w-md bg-zinc-900 border-red-500/30">
          <CardHeader>
            <div className="text-center mb-2">
              <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Invalid Activation Link</CardTitle>
              <CardDescription className="text-gray-400 mt-2">
                The activation link is missing or invalid. Please check your email and try again.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation('/login')} 
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
              data-testid="button-return-login"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-yellow-400/20">
        <CardHeader>
          <div className="text-center mb-2">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-400/20">
              <CheckCircle2 className="w-8 h-8 text-black" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Activate Your Account</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              Welcome to ISOHub! Please set your password to complete account activation.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          {activateMutation.isError && (
            <Alert className="mb-4 bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                {activateMutation.error instanceof Error 
                  ? activateMutation.error.message 
                  : 'Failed to activate account. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...form.register('password')}
                  disabled={activateMutation.isPending}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-yellow-400/50 pr-10"
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-400">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  {...form.register('confirmPassword')}
                  disabled={activateMutation.isPending}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 focus:border-yellow-400/50 pr-10"
                  data-testid="input-confirm-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-400 hover:text-white"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  data-testid="button-toggle-confirm-password"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-400">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-yellow-400" />
                <p className="font-medium text-gray-300">Password Requirements (PCI DSS 4.0)</p>
              </div>
              <ul className="space-y-1 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-yellow-400"></span>
                  At least 12 characters long
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-yellow-400"></span>
                  Include uppercase, lowercase, numbers
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-yellow-400"></span>
                  Include special characters
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-yellow-400"></span>
                  Avoid common passwords
                </li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold h-11"
              disabled={activateMutation.isPending}
              data-testid="button-activate-account"
            >
              {activateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating Account...
                </>
              ) : (
                'Activate Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm border-t border-zinc-800 pt-4">
            <p className="text-gray-500">Need help? Contact support at</p>
            <a href="mailto:support@isohub.io" className="font-medium text-yellow-400 hover:text-yellow-300 transition-colors">
              support@isohub.io
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
