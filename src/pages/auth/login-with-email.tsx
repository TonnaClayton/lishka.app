import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/auth-context";
import { log } from "@/lib/logging";
import { ROUTES } from "@/lib/routing";

// Zod schema for form validation
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .transform((email) => email.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginWithEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, resendConfirmation } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Get the intended destination from location state
  const from = location.state?.from?.pathname || "/";

  // Initialize React Hook Form
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    // Clear any existing errors
    setError(null);
    setShowEmailVerification(false);

    setLoading(true);

    try {
      log("[LoginPage] Starting login for:", data.email);

      const result = await signIn(data.email, data.password);

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
    const email = form.getValues("email");
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setResendingEmail(true);
    setError(null);

    try {
      const { error } = await resendConfirmation(email);

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
    <div className="bg-white dark:bg-gray-900 h-full flex flex-col p-6">
      <div className="w-full max-w-sm h-full mx-auto flex-1 flex flex-col">
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
          <h1 className="font-bold text-gray-900 dark:text-white mb-2 text-3xl">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Sign in to your Lishka account
          </p>
        </div>

        <div className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <div className="text-red-600 dark:text-red-400">
                      {error}
                    </div>
                    {showEmailVerification && (
                      <div className="mt-3">
                        <Button
                          onClick={handleResendVerification}
                          disabled={resendingEmail}
                          size="sm"
                          className="bg-lishka-blue hover:bg-lishka-blue text-white"
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

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#191B1FCC] font-bold leading-snug text-xs">
                      Email
                    </FormLabel>
                    <FormControl className="px-3 rounded-[12px] py-4 h-[48px]">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="text-sm text-[#191B1F] font-semibold placeholder:font-normal placeholder:text-[#191B1F80] border-gray-200 rounded-[12px] bg-gray-50 focus:bg-white"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#191B1FCC] font-bold leading-snug text-xs">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="px-3 h-[48px] py-4 text-sm text-[#191B1F] font-semibold placeholder:font-normal placeholder:text-[#191B1F80] border-gray-200 rounded-[12px] bg-gray-50 focus:bg-white"
                          disabled={loading}
                          {...field}
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end">
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-sm text-lishka-blue hover:text-lishka-blue "
                >
                  Forgot password?
                </Link>
              </div>

              <div className="space-y-3 mt-0">
                <Button
                  type="submit"
                  className="w-full h-[46px] bg-lishka-blue hover:bg-lishka-blue text-white text-base font-medium rounded-[24px] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="mt-auto pb-8 text-center">
          <p className="text-base text-gray-600 dark:text-gray-300">
            Don't have an account?{" "}
            <Link
              to={ROUTES.SIGNUP}
              state={{ from: location.state?.from }}
              className="text-lishka-blue hover:text-lishka-blue  font-medium"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginWithEmailPage;
