import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Building } from 'lucide-react';

const companyInfoSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().min(1, "Industry is required"),
  companySize: z.string().min(1, "Company size is required"),
  description: z.string().optional(),
  headquarters: z.string().optional(),
  founded: z.string().optional(),
  specialties: z.string().optional(),
});

type CompanyInfoForm = z.infer<typeof companyInfoSchema>;

interface CompanyInfoStepProps {
  organizationId: string;
  organization: any;
  progress: any;
  onComplete: (data: any) => void;
  isLoading: boolean;
}

export default function CompanyInfoStep({
  organizationId,
  organization,
  progress,
  onComplete,
  isLoading,
}: CompanyInfoStepProps) {
  const form = useForm<CompanyInfoForm>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      companyName: organization?.name || '',
      website: organization?.website || '',
      industry: organization?.industry || '',
      companySize: '',
      description: '',
      headquarters: '',
      founded: '',
      specialties: '',
    },
  });

  const handleSubmit = (data: CompanyInfoForm) => {
    onComplete(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Tell us about your company to personalize your experience
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  {...form.register('companyName')}
                />
                {form.formState.errors.companyName && (
                  <p className="text-sm text-red-600">{form.formState.errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourcompany.com"
                  {...form.register('website')}
                />
                {form.formState.errors.website && (
                  <p className="text-sm text-red-600">{form.formState.errors.website.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Input
                  id="industry"
                  placeholder="Payment Processing"
                  {...form.register('industry')}
                />
                {form.formState.errors.industry && (
                  <p className="text-sm text-red-600">{form.formState.errors.industry.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size *</Label>
                <Input
                  id="companySize"
                  placeholder="1-10 employees"
                  {...form.register('companySize')}
                />
                {form.formState.errors.companySize && (
                  <p className="text-sm text-red-600">{form.formState.errors.companySize.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="headquarters">Headquarters</Label>
                <Input
                  id="headquarters"
                  placeholder="New York, NY"
                  {...form.register('headquarters')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="founded">Founded</Label>
                <Input
                  id="founded"
                  placeholder="2020"
                  {...form.register('founded')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Company Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your company..."
                rows={3}
                {...form.register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties</Label>
              <Textarea
                id="specialties"
                placeholder="Key areas of expertise, services offered..."
                rows={2}
                {...form.register('specialties')}
              />
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
                    Saving...
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