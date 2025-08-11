import React, { useState, useRef, useContext } from "react";
import { Mail, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/contexts/auth-context";

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
      `[data-banner-id="${bannerId}"]`
    );
    if (existingBanner && !dismissed) {
      return null;
    }
  }

  const handleResendConfirmation = async () => {
    if (!user?.email) return;

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
      className="border-b"
      style={{ backgroundColor: "#0251FB" }}
      data-banner-id={bannerId}
      key={bannerId}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-white font-semibold">
                Please verify your email address
              </p>
              <p className="text-xs text-white/90">
                We sent a verification link to {user?.email || "your email"}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <Button
              onClick={handleResendConfirmation}
              disabled={resending}
              variant="ghost"
              className="text-white hover:bg-white/10 text-xs px-3 py-1.5 rounded-md border border-white/20"
            >
              {resending ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-3 h-3 mr-1" />
                  Resend Email
                </>
              )}
            </Button>
          </div>
        </div>

        {message && (
          <div className="mt-2">
            <p className="text-xs text-white/90">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
