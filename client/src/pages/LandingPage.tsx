import React from "react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-yellow-400 max-w-md text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">✅ FORM ROUTING WORKS!</h1>
        <div className="text-left space-y-2 bg-gray-100 p-4 rounded">
          <p><strong>URL:</strong> {window.location.href}</p>
          <p><strong>Path:</strong> {window.location.pathname}</p>
          <p><strong>Component:</strong> LandingPage.tsx</p>
        </div>
        <p className="text-green-700 font-semibold mt-4">Form routing is functioning correctly!</p>
        
        <div className="mt-6 space-y-2">
          <p className="text-sm text-gray-600">This is your main landing page.</p>
          <p className="text-sm text-gray-500">
            Visit <a href="/login" className="text-blue-600 underline">/login</a> for admin access
          </p>
        </div>
      </div>
    </div>
  );
}