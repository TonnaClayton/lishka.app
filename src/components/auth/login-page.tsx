import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { log } from "@/lib/logging";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Get the intended destination from location state
  const from = location.state?.from?.pathname || "/";
  const { resendConfirmation } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear any existing errors
    setError(null);
    setShowEmailVerification(false);

    // Basic validation
    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      log("[LoginPage] Starting login for:", email.trim().toLowerCase());

      const result = await signIn(email.trim().toLowerCase(), password);

      log("[LoginPage] Login result:", {
        hasError: !!result.error,
        errorMessage: result.error?.message,
      });

      if (result.error) {
        // Handle specific error types
        const errorMsg = result.error.message || "Login failed";

        if (errorMsg.includes("Email not confirmed")) {
          setError(
            "Your email address hasn't been verified yet. Please check your inbox for a verification email.",
          );
          setShowEmailVerification(true);
        } else if (errorMsg.includes("Invalid login credentials")) {
          setError(
            "Invalid email or password. Please check your credentials and try again.",
          );
        } else if (errorMsg.includes("Too many requests")) {
          setError(
            "Too many login attempts. Please wait a few minutes before trying again.",
          );
        } else if (errorMsg.includes("Network") || errorMsg.includes("fetch")) {
          setError(
            "Network connection error. Please check your internet connection and try again.",
          );
        } else {
          setError(errorMsg);
        }
      } else {
        // Success - navigate to intended destination
        log("[LoginPage] Login successful, navigating to:", from);
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error("[LoginPage] Login exception:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError("Please enter your email address first.");
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
        setShowEmailVerification(false);
      }
    } catch (err) {
      console.error("Resend verification error:", err);
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col p-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 mt-4">
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

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to your Lishka account
          </p>
        </div>

        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert
                variant="destructive"
                className="mb-4 border-red-500 dark:border-red-400"
              >
                <AlertDescription className="text-sm leading-relaxed">
                  <div className="font-medium mb-1 text-red-600 dark:text-red-400">
                    {showEmailVerification
                      ? "Email Verification Required"
                      : "Login Error"}
                  </div>
                  <div className="text-red-600 dark:text-red-400">{error}</div>
                  {showEmailVerification && (
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
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-base font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Don't clear error immediately to allow user to see it
                }}
                className="h-14 text-base border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-base font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Don't clear error immediately to allow user to see it
                  }}
                  className="h-14 text-base border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 pr-12"
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Forgot password?
              </Link>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                type="submit"
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-auto pb-8 text-center">
          <p className="text-base text-gray-600 dark:text-gray-300">
            Don't have an account?{" "}
            <Link
              to="/signup"
              state={{ from: location.state?.from }}
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
