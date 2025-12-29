import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Lock, Smartphone, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StepUpReauthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (reauthToken: string) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

export default function StepUpReauthDialog({
  open,
  onOpenChange,
  onSuccess,
  onCancel,
  title = "Verify Your Identity",
  description = "For your security, please verify your identity before submitting sensitive information."
}: StepUpReauthDialogProps) {
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("password");

  const { data: reauthStatus } = useQuery<{ hasMFA: boolean; availableMethods: string[] }>({
    queryKey: ['/api/security/reauth/status'],
    enabled: open,
  });

  const reauthMutation = useMutation({
    mutationFn: async (data: { method: 'password' | 'totp'; password?: string; totpCode?: string }) => {
      const response = await apiRequest('/api/security/reauth', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (data: any) => {
      if (data.verified && data.reauthToken) {
        setPassword("");
        setTotpCode("");
        setError("");
        onSuccess(data.reauthToken);
        onOpenChange(false);
      }
    },
    onError: (error: any) => {
      setError(error.message || "Verification failed. Please try again.");
    }
  });

  useEffect(() => {
    if (!open) {
      setPassword("");
      setTotpCode("");
      setError("");
    }
  }, [open]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Please enter your password");
      return;
    }
    reauthMutation.mutate({ method: 'password', password });
  };

  const handleTotpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!totpCode || totpCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }
    reauthMutation.mutate({ method: 'totp', totpCode });
  };

  const handleCancel = () => {
    setPassword("");
    setTotpCode("");
    setError("");
    onOpenChange(false);
    onCancel?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-yellow-400/30" data-testid="dialog-step-up-reauth">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-400/20 rounded-full">
              <Shield className="h-6 w-6 text-yellow-400" />
            </div>
            <DialogTitle className="text-xl text-white">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {reauthStatus?.hasMFA ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                <TabsTrigger 
                  value="password" 
                  className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
                  data-testid="tab-password"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Password
                </TabsTrigger>
                <TabsTrigger 
                  value="totp" 
                  className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black"
                  data-testid="tab-totp"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Authenticator
                </TabsTrigger>
              </TabsList>

              <TabsContent value="password" className="mt-4">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reauth-password" className="text-gray-300">
                      Enter your password
                    </Label>
                    <Input
                      id="reauth-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your account password"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      autoComplete="current-password"
                      data-testid="input-reauth-password"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1 border-zinc-700 text-gray-300 hover:bg-zinc-800"
                      data-testid="button-reauth-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={reauthMutation.isPending}
                      className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black"
                      data-testid="button-reauth-verify-password"
                    >
                      {reauthMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="totp" className="mt-4">
                <form onSubmit={handleTotpSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reauth-totp" className="text-gray-300">
                      Enter code from your authenticator app
                    </Label>
                    <Input
                      id="reauth-totp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit code"
                      className="bg-zinc-800 border-zinc-700 text-white text-center text-2xl tracking-widest"
                      autoComplete="one-time-code"
                      data-testid="input-reauth-totp"
                    />
                    <p className="text-xs text-gray-500">
                      Open your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1 border-zinc-700 text-gray-300 hover:bg-zinc-800"
                      data-testid="button-reauth-cancel-totp"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={reauthMutation.isPending}
                      className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black"
                      data-testid="button-reauth-verify-totp"
                    >
                      {reauthMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reauth-password-only" className="text-gray-300">
                  Enter your password to continue
                </Label>
                <Input
                  id="reauth-password-only"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your account password"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  autoComplete="current-password"
                  data-testid="input-reauth-password-only"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 border-zinc-700 text-gray-300 hover:bg-zinc-800"
                  data-testid="button-reauth-cancel-password-only"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={reauthMutation.isPending}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black"
                  data-testid="button-reauth-verify-password-only"
                >
                  {reauthMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Verify & Continue
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-400">
              This additional security step helps protect sensitive information like SSNs, bank statements, and personal documents. Your verification is valid for 5 minutes.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
