import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Mail, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface AccountStatus {
  exists: boolean;
  email_confirmed: boolean;
  created_at?: string;
  last_sign_in_at?: string;
  email?: string;
}

const AccountStatusChecker: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const { resendConfirmation } = useAuth();

  const checkAccountStatus = async () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      // Try to sign in with a dummy password to determine account status
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: "dummy_password_to_check_user_existence_12345",
        });

      let accountStatus: AccountStatus = {
        exists: false,
        email_confirmed: false,
      };

      console.log("Account check result:", { signInData, signInError });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          // User exists but password is wrong - this means account exists and is confirmed
          accountStatus.exists = true;
          accountStatus.email_confirmed = true;
        } else if (signInError.message.includes("Email not confirmed")) {
          // User exists but email is not confirmed
          accountStatus.exists = true;
          accountStatus.email_confirmed = false;
        } else if (signInError.message.includes("User not found")) {
          // User doesn't exist
          accountStatus.exists = false;
          accountStatus.email_confirmed = false;
        } else {
          // Other errors - assume user doesn't exist
          accountStatus.exists = false;
          accountStatus.email_confirmed = false;
        }
      } else if (signInData?.user) {
        // Successful sign in (shouldn't happen with dummy password, but just in case)
        accountStatus.exists = true;
        accountStatus.email_confirmed = !!signInData.user.email_confirmed_at;
        accountStatus.created_at = signInData.user.created_at;
        accountStatus.last_sign_in_at =
          signInData.user.last_sign_in_at || undefined;
        accountStatus.email = signInData.user.email;

        // Sign out immediately since this was just a test
        await supabase.auth.signOut();
      }

      setStatus(accountStatus);
    } catch (err) {
      console.error("Account status check error:", err);
      setError("Failed to check account status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError("Please enter an email address first.");
      return;
    }

    setResendingEmail(true);
    setError(null);

    try {
      const { error } = await resendConfirmation(email.trim().toLowerCase());

      if (error) {
        setError(error.message || "Failed to resend verification email.");
      } else {
        setError(null);
        alert(
          "Verification email sent! Please check your inbox and spam folder.",
        );
      }
    } catch (err) {
      console.error("Resend verification error:", err);
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Account Status Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email to check"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button
            onClick={checkAccountStatus}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Checking..." : "Check Account Status"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {status && (
            <Alert variant={status.exists ? "default" : "destructive"}>
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Account Status for {email}:</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      {status.exists ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      Account exists: {status.exists ? "Yes" : "No"}
                    </div>
                    {status.exists && (
                      <div className="flex items-center gap-2">
                        {status.email_confirmed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        )}
                        Email verified: {status.email_confirmed ? "Yes" : "No"}
                      </div>
                    )}
                    {status.created_at && (
                      <div>
                        Created: {new Date(status.created_at).toLocaleString()}
                      </div>
                    )}
                    {status.last_sign_in_at && (
                      <div>
                        Last sign in:{" "}
                        {new Date(status.last_sign_in_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  {status.exists && !status.email_confirmed && (
                    <div className="mt-3">
                      <Button
                        onClick={handleResendVerification}
                        disabled={resendingEmail}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {resendingEmail ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 mr-2" />
                            Resend Verification Email
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountStatusChecker;
