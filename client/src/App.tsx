import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ISOHubSidebar from "@/components/ISOHubSidebar";
import RoleBasedSidebar from "@/components/RoleBasedSidebar";
import ISOHubHeader from "@/components/ISOHubHeader";
import MobileNavigation from "@/components/MobileNavigation";
import InstallPrompt from "@/components/InstallPrompt";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import Dashboard from "@/pages/Dashboard";
import DataUpload from "@/pages/DataUpload";
import Reports from "@/pages/Reports";
import AuditIssues from "@/pages/AuditIssues";
import LoginPortal from "@/pages/LoginPortal";
import Documents from "@/pages/Documents";
import SecuredDocs from "@/pages/SecuredDocs";
import Marketing from "@/pages/Marketing";
import PreApplications from "@/pages/PreApplications";
import Residuals from "@/pages/Residuals";
import ResidualsWorkflow from "@/pages/ResidualsWorkflow";
import DataManagement from "@/pages/DataManagement";

import SuperAdmin from "@/pages/SuperAdmin";
import AgencyOnboarding from "@/pages/AgencyOnboarding";

import BulkAssignments from "@/pages/BulkAssignments";
import RepManagement from "@/pages/RepManagement";
import VendorManagement from "@/pages/VendorManagement";
import AllReports from "@/pages/AllReports";
import BillingModule from "@/pages/BillingModule";
import MyBilling from "@/pages/MyBilling";
import PreApplicationForm from "@/pages/PreApplicationForm";
import FormPage from "@/pages/FormPage";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import SimpleLogin from "./SimpleLogin";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import NotFound from "@/pages/not-found";
import Homepage from "@/pages/Homepage";
import SecurityDemo from "@/pages/SecurityDemo";
import ActivateAccount from "@/pages/ActivateAccount";
import SSOCallback from "@/pages/SSOCallback";
import OnboardingWizard from "@/pages/OnboardingWizard";
import AdminOrganizationManagement from "@/pages/AdminOrganizationManagement";
import OrganizationDashboard from "@/pages/OrganizationDashboard";
import OrganizationSettings from "@/pages/OrganizationSettings";
import Help from "@/pages/Help";
import RosterUpload from "@/pages/RosterUpload";
import AdminRoleSettings from "@/pages/AdminRoleSettings";
import RoleTestingPanel from "@/components/RoleTestingPanel";
import MonthlyAudit from "@/pages/MonthlyAudit";
import AIChatWidget from "@/components/AIChatWidget";
import ISOAIChatWidget from "@/components/ISOAIChatWidget";
import SupportTickets from "@/pages/SupportTickets";
import ComingSoon from "@/pages/ComingSoon";
import ISOAI from "@/pages/ISOAI";
import ISOSign from "@/pages/ISOSign";
import BusinessOwnerAnalytics from "@/pages/BusinessOwnerAnalytics";
import { useState } from "react";
import { GlobalShortcutsProvider } from "@/providers/GlobalShortcutsProvider";

function Router() {
  const [username, setUsername] = useState("demo-user"); // TODO: Replace with actual auth
  const [isAdmin] = useState(true); // TODO: Replace with actual auth
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [organizationID, setOrganizationID] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Check for impersonation context
  const impersonatingOrganization = sessionStorage.getItem('impersonatingOrganization');
  const isImpersonating = !!impersonatingOrganization;
  const impersonationData = isImpersonating ? JSON.parse(impersonatingOrganization) : null;

  const handleLogout = () => {
    // Clear authentication state
    setUsername("");
    setAuthToken(null);
    setOrganizationID(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('organizationID');
    sessionStorage.removeItem('impersonatingOrganization');
    console.log("Logging out...");
    // Redirect to login page
    setLocation('/login');
  };

  return (
    <Switch>
      {/* ISOHub Homepage - Company Landing Page */}
      <Route path="/">
        <Homepage />
      </Route>
      
      {/* Form Routes - Handle all /form/* paths */}
      <Route path="/form/:organizationCode/:fullname">
        {() => <FormPage />}
      </Route>
      <Route path="/form/test">
        {() => <FormPage />}
      </Route>
      <Route path="/form-test">
        {() => <FormPage />}
      </Route>
      
      {/* Coming Soon page - no sidebar/header */}
      <Route path="/coming-soon">
        <ComingSoon />
      </Route>

      {/* Login and Signup pages - no sidebar/header */}
      <Route path="/login">
        {() => <SimpleLogin setUsername={setUsername} setAuthToken={setAuthToken} setOrganization={setOrganizationID} />}
      </Route>
      <Route path="/sso-callback">
        {() => <SSOCallback setUsername={setUsername} setAuthToken={setAuthToken} setOrganization={setOrganizationID} />}
      </Route>
      <Route path="/signup">
        {() => <Signup setUsername={setUsername} setAuthToken={setAuthToken} setOrganization={setOrganizationID} />}
      </Route>
      <Route path="/forgot-password" component={ForgotPassword} />

      {/* Onboarding Routes - No sidebar/header layout */}
      <Route path="/activate">
        <ActivateAccount />
      </Route>
      
      <Route path="/onboarding-wizard">
        <OnboardingWizard />
      </Route>
      
      <Route path="/organizations">
        <AdminOrganizationManagement />
      </Route>
      
      {/* Organization-specific routes */}
      <Route path="/org/dashboard">
        <OrganizationDashboard />
      </Route>
      
      <Route path="/org/:orgId/settings">
        {(params) => <OrganizationSettings />}
      </Route>

      {/* All other routes with layout */}
      <Route>
        {() => (
          <div className="min-h-screen bg-white">
            {/* Impersonation Banner - Shows when super admin is impersonating organization */}
            {isImpersonating && (
              <ImpersonationBanner
                organizationName={impersonationData.organizationName}
                adminUsername={impersonationData.adminUsername}
                onExitImpersonation={() => {
                  // This will be handled by the banner component
                }}
              />
            )}
            
            {/* Mobile Navigation */}
            <MobileNavigation 
              username={username}
              onLogout={handleLogout}
            />
            
            {/* Desktop Layout */}
            <div className="hidden md:flex min-h-screen">
              {/* ISOHub Sidebar - Desktop Only */}
              <ISOHubSidebar 
                username={username}
                isAdmin={isAdmin}
                onLogout={handleLogout}
              />
              
              {/* Main Content Area */}
              <div className="flex-1">
                {/* Top Header Navigation - Desktop */}
                <ISOHubHeader 
                  username={username}
                  onLogout={handleLogout}
                />
                
                {/* Desktop Page Content */}
                <div className="min-h-screen bg-white">
                  <Switch>
                    <Route path="/dashboard" component={Dashboard} />
                    <Route path="/business-owner-analytics" component={BusinessOwnerAnalytics} />
                    <Route path="/data-management" component={DataManagement} />
                    <Route path="/residuals-workflow" component={ResidualsWorkflow} />
                    <Route path="/residuals">
                      {() => {
                        window.location.href = '/residuals-workflow';
                        return null;
                      }}
                    </Route>

                    <Route path="/super-admin" component={SuperAdmin} />
                    <Route path="/onboarding" component={AgencyOnboarding} />
                    <Route path="/organizations" component={AdminOrganizationManagement} />
                    <Route path="/bulk-assignments" component={BulkAssignments} />
                    <Route path="/reps" component={RepManagement} />
                    <Route path="/vendor-management" component={VendorManagement} />
                    <Route path="/billing" component={BillingModule} />
                    <Route path="/my-billing" component={MyBilling} />
                    <Route path="/login-portal" component={LoginPortal} />
                    <Route path="/documents" component={Documents} />
                    <Route path="/pre-applications">
                      {() => (
                        <PreApplications 
                          currentUser={{
                            firstName: "John",
                            lastName: "Smith", 
                            username: username,
                            organizationId: organizationID || 'org-1'
                          }}
                        />
                      )}
                    </Route>
                    <Route path="/secured-docs" component={SecuredDocs} />
                    <Route path="/marketing" component={Marketing} />
                    <Route path="/uploads" component={DataUpload} />
                    <Route path="/monthly-audit" component={MonthlyAudit} />
                    <Route path="/reports" component={Reports} />
                    <Route path="/audit-issues" component={AuditIssues} />
                    <Route path="/security" component={SecurityDemo} />
                    <Route path="/help" component={Help} />
                    <Route path="/admin/roster-upload" component={RosterUpload} />
                    <Route path="/admin/role-settings" component={AdminRoleSettings} />
                    <Route path="/admin/role-testing">
                      {() => <RoleTestingPanel />}
                    </Route>
                    <Route path="/iso-ai" component={ISOAI} />
                    <Route path="/iso-sign" component={ISOSign} />
                    <Route component={NotFound} />
                  </Switch>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden min-h-screen bg-white pb-16">
              <Switch>
                <Route path="/form*">
                  {() => <FormPage />}
                </Route>
                <Route path="/form-test">
                  {() => <FormPage />}
                </Route>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/data-management" component={DataManagement} />
                <Route path="/residuals-workflow" component={ResidualsWorkflow} />
                <Route path="/residuals">
                  {() => {
                    window.location.href = '/residuals-workflow';
                    return null;
                  }}
                </Route>

                <Route path="/super-admin" component={SuperAdmin} />
                <Route path="/onboarding" component={AgencyOnboarding} />
                <Route path="/organizations" component={AdminOrganizationManagement} />
                <Route path="/bulk-assignments" component={BulkAssignments} />
                <Route path="/reps" component={RepManagement} />
                <Route path="/vendor-management" component={VendorManagement} />
                <Route path="/billing" component={BillingModule} />
                <Route path="/my-billing" component={MyBilling} />
                <Route path="/login-portal" component={LoginPortal} />
                <Route path="/documents" component={Documents} />
                <Route path="/pre-applications">
                  {() => (
                    <PreApplications 
                      currentUser={{
                        firstName: "John",
                        lastName: "Smith", 
                        username: username,
                        organizationId: organizationID || 'org-1'
                      }}
                    />
                  )}
                </Route>
                <Route path="/secured-docs" component={SecuredDocs} />
                <Route path="/marketing" component={Marketing} />
                <Route path="/uploads" component={DataUpload} />
                <Route path="/monthly-audit" component={MonthlyAudit} />
                <Route path="/support-tickets" component={SupportTickets} />
                <Route path="/reports" component={Reports} />
                <Route path="/audit-issues" component={AuditIssues} />
                <Route path="/security" component={SecurityDemo} />
                <Route path="/iso-ai" component={ISOAI} />
                <Route path="/iso-sign" component={ISOSign} />
                <Route component={NotFound} />
              </Switch>
            </div>
            
            {/* PWA Install Prompt */}
            <InstallPrompt />
            
            {/* ISO-AI Chat Widget - AI Assistant */}
            <ISOAIChatWidget />
          </div>
        )}
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GlobalShortcutsProvider>
          <Router />
          <Toaster />
        </GlobalShortcutsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
