import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import LoadingDots from "@/components/loading-dots";
import { error as logError } from "@/lib/logging";

const EmailConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { confirmEmail, resendConfirmation, user } = useAuth();

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "expired"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const token = searchParams.get("token") || searchParams.get("token_hash");
  const type = searchParams.get("type");

  useEffect(() => {
    const handleConfirmation = async () => {
      // Handle direct Supabase confirmation URLs
      if (type === "signup" && token) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: "signup",
          });

          if (error) {
            logError("Email confirmation error:", error);
            if (
              error.message.includes("expired") ||
              error.message.includes("Token has expired")
            ) {
              setStatus("expired");
            } else {
              setStatus("error");
            }
            setError(error.message);
          } else {
            setStatus("success");
            // Redirect to app after successful confirmation
            setTimeout(() => {
              navigate("/", { replace: true });
            }, 1500);
          }
        } catch (err) {
          logError("Email confirmation exception:", err);
          setStatus("error");
          setError("An unexpected error occurred during email confirmation.");
        }
        return;
      }

      // Handle custom confirmation flow
      if (!token) {
        setStatus("error");
        setError("Invalid confirmation link. No token provided.");
        return;
      }

      try {
        const { error } = await confirmEmail(token);

        if (error) {
          logError("Custom confirmation error:", error);
          if (
            error.message.includes("expired") ||
            error.message.includes("Token has expired")
          ) {
            setStatus("expired");
          } else {
            setStatus("error");
          }
          setError(error.message);
        } else {
          setStatus("success");
          // Redirect to app after successful confirmation
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 1500);
        }
      } catch (err) {
        logError("Custom confirmation exception:", err);
        setStatus("error");
        setError("An unexpected error occurred during email confirmation.");
      }
    };

    handleConfirmation();
  }, [token, type, confirmEmail, navigate]);

  const handleResendConfirmation = async () => {
    if (!user?.email) {
      setError("No email address found. Please try signing up again.");
      return;
    }

    setResending(true);
    setError(null);

    try {
      const { error } = await resendConfirmation(user.email);

      if (error) {
        setError(error.message);
      } else {
        setError(null);
        // Show success message
        alert("Confirmation email sent! Please check your inbox.");
      }
    } catch {
      setError("Failed to resend confirmation email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100  rounded-full flex items-center justify-center mx-auto mb-6">
              <LoadingDots />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Confirming Your Email
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we verify your email address...
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Email Confirmed!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your email address has been successfully verified. You can now
              access all features of your account.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Redirecting you to the home page...
            </p>
            <Button
              onClick={() => navigate("/", { replace: true })}
              className="w-full h-14 bg-lishka-blue hover:bg-lishka-blue text-white text-base font-medium rounded-xl"
            >
              Continue to App
            </Button>
          </div>
        );

      case "expired":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Link Expired
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This confirmation link has expired. Don't worry, you can request a
              new one.
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleResendConfirmation}
                disabled={resending}
                className="w-full h-14 bg-lishka-blue hover:bg-lishka-blue text-white text-base font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send New Confirmation Email
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full h-14 text-base font-medium rounded-xl border-gray-200 dark:border-gray-700"
              >
                Continue to App
              </Button>
            </div>
          </div>
        );

      case "error":
      default:
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Confirmation Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error ||
                "We couldn't confirm your email address. The link may be invalid or expired."}
            </p>
            <div className="space-y-3">
              {user?.email && (
                <Button
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="w-full h-14 bg-lishka-blue hover:bg-lishka-blue text-white text-base font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send New Confirmation Email
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full h-14 text-base font-medium rounded-xl border-gray-200 dark:border-gray-700"
              >
                Continue to App
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col p-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-center mb-12 mt-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt="Lishka Logo"
              className="h-8 w-auto dark:hidden"
            />
            <img
              src="/logo-night.svg"
              alt="Lishka Logo"
              className="h-8 w-auto hidden dark:block"
            />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full">
            {error && status !== "expired" && status !== "error" && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationPage;
