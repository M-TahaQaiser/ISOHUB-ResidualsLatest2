import { useParams } from "wouter";
import { useEffect, useState } from "react";
import PreApplicationForm from "./PreApplicationForm";

interface FormPageProps {
  // This component handles the dynamic routing for personalized forms
}

export default function FormPage() {
  const params = useParams<{ agencyCode?: string; fullname?: string }>();
  const [agencyCode, setAgencyCode] = useState<string>("");
  const [fullname, setFullname] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🚀 FormPage loaded!");
    console.log("Current URL:", window.location.href);
    console.log("Current pathname:", window.location.pathname);
    console.log("Wouter params:", params);
    
    // Use Wouter params if available
    if (params.agencyCode && params.fullname) {
      console.log("✅ Using Wouter params:", params);
      setAgencyCode(params.agencyCode);
      setFullname(params.fullname);
      setLoading(false);
      return;
    }
    
    // Fallback to manual URL parsing
    const pathParts = window.location.pathname.split('/');
    console.log("Path parts:", pathParts);
    
    // Handle root domain "/" - show default pre-application form
    if (pathParts.length === 2 && pathParts[1] === '') {
      console.log("✅ Root domain detected - showing default pre-application form");
      setLoading(false);
      return;
    }
    
    // Handle both /form/test and /form-test formats
    if (pathParts[1] === 'form' || pathParts[1] === 'form-test') {
      console.log("✅ Form route detected!");
      
      // Handle /form/test or /form-test route
      if (pathParts[2] === 'test' || pathParts[1] === 'form-test') {
        console.log("✅ Test route confirmed!");
        setLoading(false);
        return;
      }
      
      // Handle /form/:agencyCode/:fullname route
      if (pathParts[2] && pathParts[3]) {
        setAgencyCode(pathParts[2]);
        setFullname(pathParts[3]);
        console.log(`Form route matched! Agency: ${pathParts[2]}, Name: ${pathParts[3]}`);
      }
    } else {
      console.log("❌ Not a form route, path parts:", pathParts);
    }
    
    setLoading(false);
  }, [params]);

  // Add debugging output right when component renders
  console.log("🔍 FormPage render - Current path:", window.location.pathname);
  console.log("🔍 Loading state:", loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading form...</div>
      </div>
    );
  }

  // Root domain should not be handled here anymore
  if (window.location.pathname === '/') {
    // This shouldn't happen anymore since we use LandingPage
    return null;
  }

  // Test route - handle both /form/test and /form-test
  if (window.location.pathname === '/form/test' || window.location.pathname === '/form-test') {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-yellow-400 max-w-md text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-4">✅ FORM ROUTING WORKS!</h1>
          <div className="text-left space-y-2 bg-gray-100 p-4 rounded">
            <p><strong>URL:</strong> {window.location.href}</p>
            <p><strong>Path:</strong> {window.location.pathname}</p>
            <p><strong>Component:</strong> FormPage.tsx</p>
          </div>
          <p className="text-green-700 font-semibold mt-4">Form routing is functioning correctly!</p>
        </div>
      </div>
    );
  }

  // Personalized form route
  if (agencyCode && fullname) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Pre-Application Form
            </h1>
            <p className="text-gray-600">
              Agent: <span className="font-semibold">{agencyCode}</span> | 
              Contact: <span className="font-semibold">{fullname.replace('-', ' ')}</span>
            </p>
          </div>
          <PreApplicationForm />
        </div>
      </div>
    );
  }

  // Fallback for invalid routes
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Form Not Found</h1>
        <p className="text-gray-600">The requested form could not be found.</p>
      </div>
    </div>
  );
}