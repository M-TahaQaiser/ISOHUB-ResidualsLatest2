import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Phone, Mail, DollarSign, CreditCard, MapPin, FileText } from "lucide-react";

interface FormData {
  // Business Information
  businessName: string;
  dba: string;
  businessType: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  businessPhone: string;
  businessEmail: string;
  businessWebsite: string;
  
  // Contact Information
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  
  // Business Details
  yearsInBusiness: string;
  monthlyVolume: string;
  averageTicket: string;
  highTicket: string;
  
  // Processing Information
  currentProcessor: string;
  reasonForChange: string;
  processingNeeds: string[];
  
  // Additional Information
  notes: string;
  agreeToTerms: boolean;
}

export default function PreApplicationForm() {
  const params = useParams();
  const { toast } = useToast();
  const agencyCode = params.agencyCode;
  const fullname = params.fullname;
  
  console.log("PreApplicationForm rendered with params:", { agencyCode, fullname });
  
  const [loading, setLoading] = useState(false);
  const [agentInfo, setAgentInfo] = useState({ name: "", company: "" });
  const [formData, setFormData] = useState<FormData>({
    businessName: "",
    dba: "",
    businessType: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessZip: "",
    businessPhone: "",
    businessEmail: "",
    businessWebsite: "",
    contactName: "",
    contactTitle: "",
    contactPhone: "",
    contactEmail: "",
    yearsInBusiness: "",
    monthlyVolume: "",
    averageTicket: "",
    highTicket: "",
    currentProcessor: "",
    reasonForChange: "",
    processingNeeds: [],
    notes: "",
    agreeToTerms: false,
  });

  useEffect(() => {
    // Extract agent information from the URL parameters
    if (fullname) {
      const name = fullname.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      setAgentInfo({ 
        name, 
        company: agencyCode?.split('-')[0] || "ISOHub" 
      });
    }
  }, [agencyCode, fullname]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (need: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      processingNeeds: checked 
        ? [...prev.processingNeeds, need]
        : prev.processingNeeds.filter(n => n !== need)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`/api/preapplications/form-submit/${agencyCode}/${fullname}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          agencyCode,
          agentName: agentInfo.name,
          submittedFrom: `${agencyCode}/${fullname}`
        }),
      });

      if (response.ok) {
        toast({
          title: "Application Submitted",
          description: "Thank you! Your pre-application has been submitted successfully. We'll review it and get back to you within 24 hours.",
        });
        
        // Reset form
        setFormData({
          businessName: "",
          dba: "",
          businessType: "",
          businessAddress: "",
          businessCity: "",
          businessState: "",
          businessZip: "",
          businessPhone: "",
          businessEmail: "",
          businessWebsite: "",
          contactName: "",
          contactTitle: "",
          contactPhone: "",
          contactEmail: "",
          yearsInBusiness: "",
          monthlyVolume: "",
          averageTicket: "",
          highTicket: "",
          currentProcessor: "",
          reasonForChange: "",
          processingNeeds: [],
          notes: "",
          agreeToTerms: false,
        });
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const businessTypes = [
    "Restaurant", "Retail", "Professional Services", "E-commerce", "Healthcare", 
    "Automotive", "Beauty/Salon", "Fitness/Gym", "Non-Profit", "Manufacturing", "Other"
  ];

  const processingNeeds = [
    "Credit Card Processing", "Debit Card Processing", "ACH/Bank Transfers", 
    "Online/E-commerce", "Mobile Processing", "Recurring Billing", 
    "Invoicing", "POS System", "Gift Cards", "Loyalty Programs"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black py-6 px-8 rounded-lg shadow-lg mb-6">
            <h1 className="text-3xl font-bold mb-2">ISOHub Pre-Application</h1>
            <p className="text-lg">Payment Processing Solutions</p>
          </div>
          
          {agentInfo.name && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-600">
                Your dedicated representative: <span className="font-semibold text-black">{agentInfo.name}</span>
                {agentInfo.company && ` from ${agentInfo.company}`}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-yellow-600" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Legal Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dba">DBA (Doing Business As)</Label>
                  <Input
                    id="dba"
                    value={formData.dba}
                    onChange={(e) => handleInputChange('dba', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select onValueChange={(value) => handleInputChange('businessType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="yearsInBusiness">Years in Business *</Label>
                  <Input
                    id="yearsInBusiness"
                    value={formData.yearsInBusiness}
                    onChange={(e) => handleInputChange('yearsInBusiness', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="businessAddress">Business Address *</Label>
                <Input
                  id="businessAddress"
                  value={formData.businessAddress}
                  onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="businessCity">City *</Label>
                  <Input
                    id="businessCity"
                    value={formData.businessCity}
                    onChange={(e) => handleInputChange('businessCity', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="businessState">State *</Label>
                  <Input
                    id="businessState"
                    value={formData.businessState}
                    onChange={(e) => handleInputChange('businessState', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="businessZip">ZIP Code *</Label>
                  <Input
                    id="businessZip"
                    value={formData.businessZip}
                    onChange={(e) => handleInputChange('businessZip', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessPhone">Business Phone *</Label>
                  <Input
                    id="businessPhone"
                    type="tel"
                    value={formData.businessPhone}
                    onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="businessEmail">Business Email *</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="businessWebsite">Website</Label>
                <Input
                  id="businessWebsite"
                  type="url"
                  value={formData.businessWebsite}
                  onChange={(e) => handleInputChange('businessWebsite', e.target.value)}
                  placeholder="https://"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-yellow-600" />
                Primary Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactTitle">Title/Position</Label>
                  <Input
                    id="contactTitle"
                    value={formData.contactTitle}
                    onChange={(e) => handleInputChange('contactTitle', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPhone">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-yellow-600" />
                Processing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="monthlyVolume">Monthly Volume *</Label>
                  <Input
                    id="monthlyVolume"
                    value={formData.monthlyVolume}
                    onChange={(e) => handleInputChange('monthlyVolume', e.target.value)}
                    placeholder="$10,000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="averageTicket">Average Ticket *</Label>
                  <Input
                    id="averageTicket"
                    value={formData.averageTicket}
                    onChange={(e) => handleInputChange('averageTicket', e.target.value)}
                    placeholder="$50"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="highTicket">Highest Ticket</Label>
                  <Input
                    id="highTicket"
                    value={formData.highTicket}
                    onChange={(e) => handleInputChange('highTicket', e.target.value)}
                    placeholder="$500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currentProcessor">Current Processor</Label>
                <Input
                  id="currentProcessor"
                  value={formData.currentProcessor}
                  onChange={(e) => handleInputChange('currentProcessor', e.target.value)}
                  placeholder="Square, Stripe, etc."
                />
              </div>

              <div>
                <Label htmlFor="reasonForChange">Reason for Change</Label>
                <Textarea
                  id="reasonForChange"
                  value={formData.reasonForChange}
                  onChange={(e) => handleInputChange('reasonForChange', e.target.value)}
                  placeholder="High fees, poor service, need better features, etc."
                />
              </div>

              <div>
                <Label>Processing Needs (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {processingNeeds.map((need) => (
                    <div key={need} className="flex items-center space-x-2">
                      <Checkbox
                        id={need}
                        checked={formData.processingNeeds.includes(need)}
                        onCheckedChange={(checked) => handleCheckboxChange(need, checked as boolean)}
                      />
                      <Label htmlFor={need} className="text-sm">{need}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-yellow-600" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional information about your business or processing needs..."
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))}
                />
                <Label htmlFor="agreeToTerms" className="text-sm">
                  I agree to the terms and conditions and authorize ISOHub to process this application and contact me regarding payment processing services.
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-3 text-lg font-semibold"
            >
              {loading ? "Submitting..." : "Submit Pre-Application"}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600">
          <p className="mb-2">
            Questions? Contact {agentInfo.name || "your representative"} at support@isohub.io
          </p>
          <p className="text-sm">
            Your information is secure and will only be used to process your application.
          </p>
        </div>
      </div>
    </div>
  );
}