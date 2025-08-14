import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/routing";

const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Full name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setError(null);
    setLoading(true);

    try {
      const { error, needsConfirmation } = await signUp(
        data.email.trim().toLowerCase(),
        data.password,
        data.fullName.trim(),
      );

      if (error) {
        // Handle specific error types
        if (error.message?.includes("User already registered")) {
          setError(
            "An account with this email already exists. Try logging in instead.",
          );
        } else if (error.message?.includes("Invalid email")) {
          setError("Please enter a valid email address.");
        } else if (error.message?.includes("Password")) {
          setError("Password must be at least 6 characters long.");
        } else {
          setError(
            error.message || "Failed to create account. Please try again.",
          );
        }
      } else {
        setSubmittedEmail(data.email);
        if (needsConfirmation) {
          setSuccess(true);
          // Redirect to homepage with email verification banner
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 2000);
        } else {
          // User is already logged in, redirect immediately
          navigate("/", { replace: true });
        }
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-full bg-white dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="w-full max-w-sm mx-auto h-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Lishka!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Your account has been created successfully.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Check Your Email
              </span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              We've sent a verification link to{" "}
              <strong>{submittedEmail}</strong>. Please check your email and
              click the link to verify your account.
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting you to the app...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex overflow-y-auto md:overflow-visible flex-col p-6">
      <div className="w-full max-w-sm mx-auto h-full  flex-1 flex flex-col">
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
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Join Lishka to fish smarter, connect deeper, and feel the adventure.
          </p>
        </div>

        <div className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                  {error.includes("already exists") && (
                    <div className="mt-3">
                      <Link
                        to={ROUTES.LOGIN}
                        state={{ from: location.state?.from }}
                        className="inline-flex items-center text-sm font-medium text-red-700 hover:text-red-600 dark:text-red-300 dark:hover:text-red-200"
                      >
                        Try logging in instead →
                      </Link>
                    </div>
                  )}
                </Alert>
              )}

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-gray-700 leading-snug text-lg">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        className="text-base border-gray-200 bg-gray-50 focus:bg-white px-3 rounded-lg py-4 h-[56px]"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-gray-700 leading-snug text-lg">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="text-base border-gray-200  bg-gray-50 focus:bg-white px-3 rounded-lg py-4 h-[56px]"
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
                    <FormLabel className="font-medium text-gray-700 leading-snug text-lg">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password (min. 6 characters)"
                          className="text-base border-gray-200 bg-gray-50 focus:bg-white px-3 rounded-lg py-4 h-[56px]"
                          disabled={loading}
                          minLength={6}
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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-gray-700 leading-snug text-lg">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="text-base border-gray-200 bg-gray-50 focus:bg-white px-3 rounded-lg py-4 h-[56px]"
                          disabled={loading}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={loading}
                        >
                          {showConfirmPassword ? (
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

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-[56px] bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded-[24px] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="mt-auto pb-8 pt-8 text-center">
          <p className="text-base text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <Link
              to={ROUTES.LOGIN}
              state={{ from: location.state?.from }}
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
