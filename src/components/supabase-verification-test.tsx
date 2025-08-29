import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2, Database } from "lucide-react";
import { supabase, authService as auth } from "@/lib/supabase";
import { config } from "@/lib/config";

interface TestResult {
  name: string;
  status: "success" | "error" | "warning" | "loading";
  message: string;
  details?: string;
}

const SupabaseVerificationTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [envInfo, setEnvInfo] = useState<any>(null);

  useEffect(() => {
    // Get environment info
    setEnvInfo({
      supabaseUrl: "https://evevdtciewzvqspsnupc.supabase.co",
      hasSupabaseKey: !!config.VITE_SUPABASE_KEY,
      hasSupabaseUrl: !!config.VITE_SUPABASE_URL,
      hasSupabaseAnonKey: !!config.VITE_SUPABASE_ANON_KEY,
      supabaseKeyLength: config.VITE_SUPABASE_KEY?.length || 0,
    });
  }, []);

  const addTest = (test: TestResult) => {
    setTests((prev) => [...prev, test]);
  };

  const updateTest = (name: string, updates: Partial<TestResult>) => {
    setTests((prev) =>
      prev.map((test) => (test.name === name ? { ...test, ...updates } : test)),
    );
  };

  const testSupabaseClient = async () => {
    addTest({
      name: "Supabase Client Initialization",
      status: "loading",
      message: "Testing Supabase client initialization...",
    });

    try {
      // Test if client is properly initialized
      if (!supabase) {
        updateTest("Supabase Client Initialization", {
          status: "error",
          message: "Supabase client is not initialized",
          details: "The supabase client object is null or undefined",
        });
        return;
      }

      updateTest("Supabase Client Initialization", {
        status: "success",
        message: "Supabase client initialized successfully",
        details: "Client object exists and is properly configured",
      });
    } catch (error) {
      updateTest("Supabase Client Initialization", {
        status: "error",
        message: "Supabase client initialization failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const testSupabaseConnection = async () => {
    addTest({
      name: "Supabase Database Connection",
      status: "loading",
      message: "Testing database connection...",
    });

    try {
      // Test basic database connectivity
      const { error } = await supabase
        .from("profiles")
        .select("count")
        .limit(1);

      if (error) {
        updateTest("Supabase Database Connection", {
          status: "error",
          message: "Database query failed",
          details: `Error: ${error.message} (Code: ${error.code})`,
        });
      } else {
        updateTest("Supabase Database Connection", {
          status: "success",
          message: "Database connection successful",
          details: "Successfully executed query on profiles table",
        });
      }
    } catch (error) {
      updateTest("Supabase Database Connection", {
        status: "error",
        message: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const testSupabaseAuth = async () => {
    addTest({
      name: "Supabase Auth Service",
      status: "loading",
      message: "Testing authentication service...",
    });

    try {
      // Test auth service availability
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        updateTest("Supabase Auth Service", {
          status: "error",
          message: "Auth service error",
          details: error.message,
        });
      } else {
        updateTest("Supabase Auth Service", {
          status: "success",
          message: "Auth service is accessible",
          details: `Session status: ${data.session ? "Active session" : "No active session"}`,
        });
      }
    } catch (error) {
      updateTest("Supabase Auth Service", {
        status: "error",
        message: "Auth service connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const testAuthHelpers = async () => {
    addTest({
      name: "Auth Helper Functions",
      status: "loading",
      message: "Testing auth helper functions...",
    });

    try {
      // Test getCurrentUser function
      const { user, error } = await auth.getCurrentUser();

      if (error) {
        updateTest("Auth Helper Functions", {
          status: "warning",
          message: "Auth helpers working but no user",
          details: `getCurrentUser returned: ${error.message}`,
        });
      } else {
        updateTest("Auth Helper Functions", {
          status: "success",
          message: "Auth helper functions working",
          details: `getCurrentUser executed successfully. User: ${user ? "Found" : "None"}`,
        });
      }
    } catch (error) {
      updateTest("Auth Helper Functions", {
        status: "error",
        message: "Auth helper functions failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);

    try {
      await testSupabaseClient();
      await new Promise((resolve) => setTimeout(resolve, 500));

      await testSupabaseConnection();
      await new Promise((resolve) => setTimeout(resolve, 500));

      await testSupabaseAuth();
      await new Promise((resolve) => setTimeout(resolve, 500));

      await testAuthHelpers();
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin text-lishka-blue" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    const variants = {
      success: "default",
      error: "destructive",
      warning: "secondary",
      loading: "outline",
    } as const;

    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Supabase Verification Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Environment Info */}
          {envInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Environment Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  Supabase URL:{" "}
                  <code className="text-xs bg-gray-100 px-1 rounded">
                    {envInfo.supabaseUrl}
                  </code>
                </div>
                <div>
                  VITE_SUPABASE_KEY:{" "}
                  <Badge
                    variant={envInfo.hasSupabaseKey ? "default" : "destructive"}
                  >
                    {envInfo.hasSupabaseKey
                      ? `Present (${envInfo.supabaseKeyLength} chars)`
                      : "Missing"}
                  </Badge>
                </div>
                <div>
                  VITE_SUPABASE_URL:{" "}
                  <Badge
                    variant={envInfo.hasSupabaseUrl ? "default" : "secondary"}
                  >
                    {envInfo.hasSupabaseUrl ? "Present" : "Missing"}
                  </Badge>
                </div>
                <div>
                  VITE_SUPABASE_ANON_KEY:{" "}
                  <Badge
                    variant={
                      envInfo.hasSupabaseAnonKey ? "default" : "secondary"
                    }
                  >
                    {envInfo.hasSupabaseAnonKey ? "Present" : "Missing"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Button */}
          <Button onClick={runAllTests} disabled={isRunning} className="w-full">
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Supabase Tests...
              </>
            ) : (
              "Run Supabase Verification Tests"
            )}
          </Button>

          {/* Test Results */}
          {tests.length > 0 && (
            <div className="space-y-3">
              {tests.map((test, index) => (
                <Alert
                  key={index}
                  variant={test.status === "error" ? "destructive" : "default"}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      <div>
                        <AlertTitle className="flex items-center gap-2">
                          {test.name}
                          {getStatusBadge(test.status)}
                        </AlertTitle>
                        <AlertDescription className="mt-1">
                          {test.message}
                          {test.details && (
                            <div className="mt-2 text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                              {test.details}
                            </div>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseVerificationTest;
