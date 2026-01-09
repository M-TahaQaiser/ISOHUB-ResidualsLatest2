# Agency Setup & Onboarding - Build Instructions

## Overview
This document provides comprehensive instructions for building an Agency Setup & Onboarding wizard with circular step icons, yellow accent borders, and a compact above-the-fold layout.

---

## 1. Design Specifications

### Color Scheme
- **Background**: `#0a0a0f` (dark mode primary)
- **Card Background**: `zinc-900/80` with `border-yellow-400/20`
- **Primary Accent**: Yellow (`#FFD700`, Tailwind: `yellow-400`)
- **Secondary Accent**: Green for completed states (`green-500`)
- **Text Colors**: White for headings, `gray-400` for descriptions

### Step Indicator Design (CIRCULAR ICONS)
Each step should display as a **circular icon** with these characteristics:

```jsx
<div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${
  step.isCompleted 
    ? 'bg-green-500/20 border-green-500 text-green-400'
    : index === currentStepIndex
    ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400'
    : 'bg-zinc-800 border-zinc-600 text-gray-500'
}`}>
  {step.isCompleted ? (
    <CheckCircle className="h-5 w-5" />
  ) : (
    <IconComponent className="h-5 w-5" />
  )}
</div>
```

Key styling points:
- `w-10 h-10` - Fixed 40px circle size
- `rounded-full` - Makes it circular (NOT `rounded-lg`)
- `border-2` - Visible border for all states
- Yellow border for current step: `border-yellow-400`
- Green border for completed: `border-green-500`
- Gray border for pending: `border-zinc-600`

---

## 2. Onboarding Steps Structure

### Step Names & Icons
```typescript
const stepIcons = {
  'Company Information': Building2,
  'Subscription Plan': DollarSign,
  'User Setup': Users,
  'Processor Configuration': Database,
  'Data Import': Upload,
  'Commission Structure': TrendingUp,
  'Reporting Setup': FileText,
};

const stepDescriptions = {
  'Company Information': 'Complete your company profile and contact details',
  'Subscription Plan': 'Choose your billing plan and subscription preferences',
  'User Setup': 'Add team members and configure user roles',
  'Processor Configuration': 'Connect your payment processors and configure settings',
  'Data Import': 'Import existing data and configure integrations',
  'Commission Structure': 'Set up commission splits and role assignments',
  'Reporting Setup': 'Configure automated reports and email schedules',
};
```

### Default Steps Array
```typescript
const defaultSteps = [
  { id: 1, stepName: 'Company Information', stepOrder: 1, isCompleted: false, completedAt: null, stepData: {} },
  { id: 2, stepName: 'Subscription Plan', stepOrder: 2, isCompleted: false, completedAt: null, stepData: {} },
  { id: 3, stepName: 'User Setup', stepOrder: 3, isCompleted: false, completedAt: null, stepData: {} },
  { id: 4, stepName: 'Processor Configuration', stepOrder: 4, isCompleted: false, completedAt: null, stepData: {} },
  { id: 5, stepName: 'Data Import', stepOrder: 5, isCompleted: false, completedAt: null, stepData: {} },
  { id: 6, stepName: 'Commission Structure', stepOrder: 6, isCompleted: false, completedAt: null, stepData: {} },
  { id: 7, stepName: 'Reporting Setup', stepOrder: 7, isCompleted: false, completedAt: null, stepData: {} },
];
```

---

## 3. Required Imports

```typescript
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircle, Clock, ArrowRight, Building2, Users, Settings, 
  Database, FileText, DollarSign, TrendingUp, Upload, Palette, Save 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
```

---

## 4. TypeScript Interfaces

```typescript
interface OnboardingStep {
  id: number;
  stepName: string;
  stepOrder: number;
  isCompleted: boolean;
  completedAt: string | null;
  stepData: any;
}

interface AgencyData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  isWhitelabel: boolean;
  domainType: 'standard' | 'custom_domain' | 'subdomain';
  customDomain: string;
  subdomainPrefix: string;
  dnsProvider: string;
  emailProvider: 'isohub_smtp' | 'agency_smtp' | 'sendgrid' | 'mailgun';
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmailAddress: string;
  fromDisplayName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoFile: File | null;
  description: string;
}

interface OnboardingStatus {
  steps: OnboardingStep[];
  progress: number;
  nextStep: OnboardingStep | null;
  isCompleted: boolean;
}
```

---

## 5. Main Component Layout (Compact, Above-the-Fold)

```jsx
export default function AgencyOnboarding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // ... queries and mutations ...

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Compact Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white mb-1">
            Agency Setup & Onboarding
          </h1>
          <p className="text-gray-400 text-sm">
            Complete the step-by-step setup process to configure your agency in the ISO Hub system
          </p>
        </div>

        {/* Step Indicators Card */}
        <Card className="mb-4 bg-zinc-900/80 border-yellow-400/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-white">Setup Progress</CardTitle>
                <p className="text-xs text-gray-400">
                  {completedSteps} of {displaySteps.length} steps completed
                </p>
              </div>
              <Badge variant={progressPercentage === 100 ? "default" : "secondary"} 
                className={`text-xs ${progressPercentage === 100 ? 'bg-green-500 text-white' : 'bg-zinc-700 text-gray-300'}`}>
                {progressPercentage === 100 ? "Completed" : "In Progress"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {/* Grid of Step Cards with Circular Icons */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {displaySteps.map((step, index) => {
                const IconComponent = stepIcons[step.stepName] || Settings;
                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer hover:shadow-md ${
                      step.isCompleted 
                        ? 'bg-green-500/10 border-green-500/30'
                        : index === currentStepIndex
                        ? 'bg-yellow-400/10 border-yellow-400 ring-2 ring-yellow-400'
                        : 'bg-zinc-800 border-yellow-400/20'
                    }`}
                    onClick={() => setCurrentStepIndex(index)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* CIRCULAR ICON */}
                      <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${
                        step.isCompleted 
                          ? 'bg-green-500/20 border-green-500 text-green-400'
                          : index === currentStepIndex
                          ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400'
                          : 'bg-zinc-800 border-zinc-600 text-gray-500'
                      }`}>
                        {step.isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <IconComponent className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-white truncate">
                          Step {index + 1}: {step.stepName}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {stepDescriptions[step.stepName]}
                        </p>
                        {step.isCompleted && (
                          <p className="text-xs text-green-400 mt-1">✓ Completed</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Step Content Card */}
        {currentStep && (
          <Card className="bg-zinc-900/80 border-yellow-400/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-400/20 rounded-lg">
                    <ArrowRight className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">
                      Step {currentStepIndex + 1}: {currentStep.stepName}
                    </CardTitle>
                    <p className="text-sm text-gray-400 mt-1">
                      {stepDescriptions[currentStep.stepName]}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {currentStepIndex > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
                      className="text-sm border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                    >
                      Previous
                    </Button>
                  )}
                  {currentStepIndex < displaySteps.length - 1 && (
                    <Button
                      variant="outline" 
                      onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                      className="text-sm border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                    >
                      Next Step
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderStepContent(currentStep)}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

---

## 6. Step Content Components

### Company Information Step
This is the most complex step - includes:
- Company name, contact name, email, phone, website
- Industry selection
- Agency code auto-generation
- Whitelabel toggle with domain/email configuration
- Logo upload with preview
- Color picker for branding (primary, secondary, accent)

```jsx
function CompanyInfoStep({ onComplete, isCompleted, initialData }) {
  const [formData, setFormData] = useState<AgencyData>({
    companyName: initialData?.companyName || '',
    contactName: initialData?.contactName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    website: initialData?.website || '',
    industry: initialData?.industry || '',
    isWhitelabel: false,
    domainType: 'standard',
    customDomain: '',
    subdomainPrefix: '',
    dnsProvider: '',
    emailProvider: 'isohub_smtp',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    fromEmailAddress: '',
    fromDisplayName: '',
    primaryColor: '#FFD700',
    secondaryColor: '#000000',
    accentColor: '#FFFFFF',
    logoFile: null,
    description: ''
  });

  // Agency code generation on company name change
  // Logo upload handler
  // Color picker inputs
  // Submit handler calling onComplete(formData)
}
```

### Other Steps (Placeholder Pattern)
```jsx
function StepComponent({ onComplete, isCompleted }) {
  if (isCompleted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-white">Step completed</p>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <p className="text-gray-300">Step content goes here</p>
      <Button 
        onClick={() => onComplete({})} 
        className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
      >
        Continue
      </Button>
    </div>
  );
}
```

---

## 7. Backend API Endpoints

### Required Routes
```
GET  /api/agencies/:id/onboarding          - Get onboarding status
POST /api/agencies/:id/onboarding/:stepName - Complete a step
POST /api/agencies/generate-code           - Generate unique agency code
POST /api/agencies/create                  - Create agency on final step
```

### Onboarding Status Response
```json
{
  "steps": [
    { "id": 1, "stepName": "Company Information", "stepOrder": 1, "isCompleted": true, "completedAt": "2026-01-05", "stepData": {} }
  ],
  "progress": 14,
  "nextStep": { "id": 2, "stepName": "Subscription Plan", ... },
  "isCompleted": false
}
```

---

## 8. Key Implementation Notes

### Compact Layout (Above-the-Fold)
- Use `py-4` instead of `py-6` or `py-8` for tighter spacing
- Use `mb-4` instead of `mb-8` for card margins
- Use `text-2xl` for title instead of `text-3xl`
- Use `text-sm` and `text-xs` for descriptions
- Use `grid-cols-4` on large screens to fit all 7 steps in 2 rows

### Circular Icons (Yellow Borders)
Critical: Use `rounded-full` NOT `rounded-lg`:
```jsx
<div className="w-10 h-10 rounded-full border-2 border-yellow-400">
```

### State Management
```typescript
const [currentStepIndex, setCurrentStepIndex] = useState(0);
const completedSteps = displaySteps.filter(s => s.isCompleted).length;
const progressPercentage = (completedSteps / displaySteps.length) * 100;
```

### Step Navigation
- Click any step card to jump to that step
- Previous/Next buttons in step content header
- Auto-advance to next step on completion

---

## 9. Complete File Reference

The complete AgencyOnboarding.tsx file with circular icons can be found in git commit:
```
bf3d71d - "Restore prospects page and fix agency onboarding step icons"
```

To extract:
```bash
git show bf3d71d:client/src/pages/AgencyOnboarding.tsx > AgencyOnboarding_circular.tsx
```

---

## 10. Testing Checklist

- [ ] All 7 steps display with circular icons
- [ ] Current step has yellow border (`border-yellow-400`)
- [ ] Completed steps have green checkmark icon
- [ ] Step cards are clickable for navigation
- [ ] Company info form saves and advances to next step
- [ ] Progress badge updates correctly
- [ ] Layout fits above fold on 1080p screens
- [ ] Previous/Next navigation works
- [ ] Completion state shows success message

---

*Document created: January 6, 2026*
*Source: ISO Hub Agency Onboarding Implementation*
