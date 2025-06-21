import React, { useState, useRef, useContext } from "react";
import { Mail, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthContext } from "@/contexts/AuthContext";

const EmailVerificationBanner: React.FC = () => {
  // Check if we're within an AuthProvider context
  const authContext = useContext(AuthContext);

  // If no auth context is available, don't render the banner
  if (!authContext) {
    return null;
  }

  const { user, resendConfirmation } = authContext;
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasRendered, setHasRendered] = useState(false);

  // Define bannerId immediately after getting user from context
  const bannerId = `email-verification-${user?.id || "unknown"}`;

  // Show banner if user exists, is not verified, and banner is not dismissed
  const shouldShowBanner =
    user &&
    (!user.email_verified || user.needs_email_confirmation) &&
    !dismissed;

  // Reset dismissed state when user changes or verification status changes
  React.useEffect(() => {
    // Reset dismissed state when a new user logs in or when verification status changes
    if (user?.id) {
      setDismissed(false);
      setMessage(null);
      setHasRendered(false);
    }
  }, [user?.id]);

  // Prevent multiple renders of the same banner
  React.useEffect(() => {
    if (shouldShowBanner && !hasRendered) {
      setHasRendered(true);
    }
  }, [shouldShowBanner, hasRendered]);

  if (!shouldShowBanner) {
    return null;
  }

  // Prevent duplicate rendering by checking if this specific user's banner has already been shown
  if (typeof window !== "undefined") {
    const existingBanner = document.querySelector(
      `[data-banner-id="${bannerId}"]`,
    );
    if (existingBanner && !dismissed) {
      return null;
    }
  }

  const handleResendConfirmation = async () => {
    if (!user.email) return;

    setResending(true);
    setMessage(null);

    try {
      const { error } = await resendConfirmation(user.email);

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage("Confirmation email sent! Please check your inbox.");
      }
    } catch (err) {
      setMessage("Failed to resend confirmation email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800"
      data-banner-id={bannerId}
      key={bannerId}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Please verify your email address
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                We sent a verification link to <strong>{user.email}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResendConfirmation}
              disabled={resending}
              className="text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 text-xs"
            >
              {resending ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend Email"
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {message && (
          <div className="mt-2">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
