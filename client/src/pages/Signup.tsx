import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

interface SignupProps {
  setUsername: (username: string) => void;
  setAuthToken: (token: string) => void;
  setOrganization: (org: string) => void;
}

export default function Signup({ setUsername, setAuthToken, setOrganization }: SignupProps) {
  const [formData, setFormData] = useState({
    fName: '',
    lName: '',
    email: '',
    organization: '',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Starting signup process...');
      
      // Import signup API dynamically
      const { signup } = await import('../api/auth.api');
      
      // Attempt signup
      const response = await signup(formData);
      
      if (response.isDupe) {
        setError('Username already exists. Please choose a different username.');
        return;
      }
      
      if (response.userID) {
        // Auto-login after successful signup
        const { login, decodeToken, setStoredAuth } = await import('../api/auth.api');
        
        try {
          const loginResponse = await login(formData.username, formData.password);
          
          if (loginResponse.token) {
            const decodedToken = decodeToken(loginResponse.token);
            const organizationID = decodedToken.organization || decodedToken.organizationID || formData.organization;
            
            setStoredAuth(loginResponse.token, formData.username, organizationID);
            setAuthToken(loginResponse.token);
            setUsername(formData.username);
            setOrganization(organizationID);
            
            setLocation('/dashboard');
          }
        } catch (loginError) {
          // If auto-login fails, redirect to login page
          setLocation('/login');
        }
      }
    } catch (error: any) {
      console.error('Signup failed:', error);
      setError(`Signup failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-yellow-400/20">
        <CardHeader className="pb-6 mb-6 border-b border-yellow-400/20">
          <CardTitle className="text-2xl font-bold text-yellow-400 text-center">
            Sign Up
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fName" className="block font-medium text-gray-300">
                  First Name:
                </Label>
                <Input
                  id="fName"
                  name="fName"
                  type="text"
                  value={formData.fName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lName" className="block font-medium text-gray-300">
                  Last Name:
                </Label>
                <Input
                  id="lName"
                  name="lName"
                  type="text"
                  value={formData.lName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="block font-medium text-gray-300">
                Email:
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization" className="block font-medium text-gray-300">
                Organization:
              </Label>
              <Input
                id="organization"
                name="organization"
                type="text"
                value={formData.organization}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="block font-medium text-gray-300">
                Username:
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="block font-medium text-gray-300">
                Password:
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 pr-10 rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded font-medium uppercase transition duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
          
          <p className='mt-4 text-center text-xs text-yellow-400/60'>
            Already have an account?{' '}
            <Button
              variant="link"
              className="text-yellow-400 hover:text-yellow-300 p-0 h-auto font-normal"
              onClick={() => setLocation('/login')}
            >
              Login here
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}