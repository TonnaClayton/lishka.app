import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
  Globe,
  Key,
  Database,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface TestResult {
  name: string;
  status: "success" | "error" | "warning" | "loading";
  message: string;
  details?: string;
  timestamp: Date;
}

const NetworkDebugger: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  // Get network information
  useEffect(() => {
    const getNetworkInfo = () => {
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;
      setNetworkInfo({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType || "unknown",
        downlink: connection?.downlink || "unknown",
        rtt: connection?.rtt || "unknown",
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    };

    getNetworkInfo();
    window.addEventListener("online", getNetworkInfo);
    window.addEventListener("offline", getNetworkInfo);

    return () => {
      window.removeEventListener("online", getNetworkInfo);
      window.removeEventListener("offline", getNetworkInfo);
    };
  }, []);

  const addTest = (test: Omit<TestResult, "timestamp">) => {
    setTests((prev) => [...prev, { ...test, timestamp: new Date() }]);
  };

  const updateTest = (name: string, updates: Partial<TestResult>) => {
    setTests((prev) =>
      prev.map((test) =>
        test.name === name
          ? { ...test, ...updates, timestamp: new Date() }
          : test,
      ),
    );
  };

  const testBasicConnectivity = async () => {
    addTest({
      name: "Basic Connectivity",
      status: "loading",
      message: "Testing basic internet connectivity...",
    });

    try {
      const response = await fetch("https://httpbin.org/get", {
        method: "GET",
        mode: "cors",
      });

      if (response.ok) {
        updateTest("Basic Connectivity", {
          status: "success",
          message: "Internet connectivity is working",
          details: `Status: ${response.status}, Response time: ${Date.now()}ms`,
        });
      } else {
        updateTest("Basic Connectivity", {
          status: "error",
          message: `HTTP error: ${response.status}`,
          details: response.statusText,
        });
      }
    } catch (error) {
      updateTest("Basic Connectivity", {
        status: "error",
        message: "Failed to connect to internet",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const testSupabaseConnection = async () => {
    addTest({
      name: "Supabase Connection",
      status: "loading",
      message: "Testing Supabase connection...",
    });

    try {
      const supabaseUrl = "https://evevdtciewzvqspsnupc.supabase.co";
      const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

      if (!supabaseKey) {
        updateTest("Supabase Connection", {
          status: "error",
          message: "Supabase API key is missing",
          details: "VITE_SUPABASE_KEY environment variable is not set",
        });
        return;
      }

      // First test DNS resolution
      try {
        const dnsTest = await fetch(supabaseUrl + "/rest/v1/", {
          method: "HEAD",
          mode: "no-cors",
        });
        // If we get here, DNS resolved successfully
      } catch (dnsError) {
        if (
          dnsError instanceof Error &&
          dnsError.message.includes("ERR_NAME_NOT_RESOLVED")
        ) {
          updateTest("Supabase Connection", {
            status: "error",
            message: "DNS resolution failed for Supabase URL",
            details:
              "Cannot resolve evevdtciewzvqspsnupc.supabase.co - check your internet connection or DNS settings",
          });
          return;
        }
      }

      // Test basic Supabase connectivity
      const { data, error } = await supabase
        .from("profiles")
        .select("count")
        .limit(1);

      if (error) {
        updateTest("Supabase Connection", {
          status: "error",
          message: "Supabase query failed",
          details: error.message,
        });
      } else {
        updateTest("Supabase Connection", {
          status: "success",
          message: "Supabase connection successful",
          details: "Database query executed successfully",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      let details = errorMessage;

      if (errorMessage.includes("Failed to fetch")) {
        details =
          "Network request failed - this could be due to DNS issues, firewall blocking, or network connectivity problems";
      } else if (errorMessage.includes("ERR_NAME_NOT_RESOLVED")) {
        details =
          "DNS resolution failed - cannot resolve the Supabase domain name";
      }

      updateTest("Supabase Connection", {
        status: "error",
        message: "Supabase connection failed",
        details: details,
      });
    }
  };

  const testOpenAIConnection = async () => {
    addTest({
      name: "OpenAI Connection",
      status: "loading",
      message: "Testing OpenAI API connection...",
    });

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      if (!apiKey) {
        updateTest("OpenAI Connection", {
          status: "warning",
          message: "OpenAI API key is missing",
          details: "VITE_OPENAI_API_KEY environment variable is not set",
        });
        return;
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Test" }],
            max_tokens: 5,
          }),
        },
      );

      if (response.ok) {
        updateTest("OpenAI Connection", {
          status: "success",
          message: "OpenAI API connection successful",
          details: `Status: ${response.status}`,
        });
      } else {
        const errorText = await response.text();
        updateTest("OpenAI Connection", {
          status: "error",
          message: `OpenAI API error: ${response.status}`,
          details: errorText,
        });
      }
    } catch (error) {
      updateTest("OpenAI Connection", {
        status: "error",
        message: "OpenAI API connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const testCORSIssues = async () => {
    addTest({
      name: "CORS Check",
      status: "loading",
      message: "Testing for CORS issues...",
    });

    try {
      // Test a known CORS-enabled endpoint
      const response = await fetch("https://api.github.com", {
        method: "GET",
        mode: "cors",
      });

      if (response.ok) {
        updateTest("CORS Check", {
          status: "success",
          message: "CORS is working correctly",
          details: "Cross-origin requests are allowed",
        });
      } else {
        updateTest("CORS Check", {
          status: "warning",
          message: "CORS test endpoint returned error",
          details: `Status: ${response.status}`,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (
        errorMessage.includes("CORS") ||
        errorMessage.includes("cross-origin")
      ) {
        updateTest("CORS Check", {
          status: "error",
          message: "CORS error detected",
          details: errorMessage,
        });
      } else {
        updateTest("CORS Check", {
          status: "warning",
          message: "Network error (may be CORS related)",
          details: errorMessage,
        });
      }
    }
  };

  const testBlobStorage = async () => {
    addTest({
      name: "Blob Storage",
      status: "loading",
      message: "Testing Vercel Blob storage...",
    });

    try {
      const blobToken = import.meta.env.BLOB_READ_WRITE_TOKEN;

      if (!blobToken) {
        updateTest("Blob Storage", {
          status: "warning",
          message: "Blob storage token is missing",
          details: "BLOB_READ_WRITE_TOKEN environment variable is not set",
        });
        return;
      }

      // Test blob storage by trying to list files
      const response = await fetch("https://blob.vercel-storage.com", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${blobToken}`,
        },
      });

      if (response.ok || response.status === 404) {
        updateTest("Blob Storage", {
          status: "success",
          message: "Blob storage connection successful",
          details: "Vercel Blob API is accessible",
        });
      } else {
        updateTest("Blob Storage", {
          status: "error",
          message: `Blob storage error: ${response.status}`,
          details: response.statusText,
        });
      }
    } catch (error) {
      updateTest("Blob Storage", {
        status: "error",
        message: "Blob storage connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const testDNSResolution = async () => {
    addTest({
      name: "DNS Resolution",
      status: "loading",
      message: "Testing DNS resolution for key domains...",
    });

    const domains = [
      "evevdtciewzvqspsnupc.supabase.co",
      "api.openai.com",
      "blob.vercel-storage.com",
      "google.com",
    ];

    const results = [];

    for (const domain of domains) {
      try {
        const response = await fetch(`https://${domain}`, {
          method: "HEAD",
          mode: "no-cors",
          signal: AbortSignal.timeout(5000),
        });
        results.push(`${domain}: ✓ Resolved`);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        if (errorMsg.includes("ERR_NAME_NOT_RESOLVED")) {
          results.push(`${domain}: ✗ DNS Failed`);
        } else {
          results.push(`${domain}: ✓ Resolved (${errorMsg})`);
        }
      }
    }

    const failedDomains = results.filter((r) => r.includes("✗"));

    updateTest("DNS Resolution", {
      status: failedDomains.length > 0 ? "error" : "success",
      message:
        failedDomains.length > 0
          ? "Some domains failed DNS resolution"
          : "All domains resolved successfully",
      details: results.join("\n"),
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);

    try {
      await testDNSResolution();
      await new Promise((resolve) => setTimeout(resolve, 500));

      await testBasicConnectivity();
      await new Promise((resolve) => setTimeout(resolve, 500));

      await testSupabaseConnection();
      await new Promise((resolve) => setTimeout(resolve, 500));

      await testOpenAIConnection();
      await new Promise((resolve) => setTimeout(resolve, 500));

      await testCORSIssues();
      await new Promise((resolve) => setTimeout(resolve, 500));

      await testBlobStorage();
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
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
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
    <div className="w-full max-w-4xl mx-auto p-4 bg-white dark:bg-gray-900">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Network & API Debugger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tests" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tests">Run Tests</TabsTrigger>
              <TabsTrigger value="info">System Info</TabsTrigger>
            </TabsList>

            <TabsContent value="tests" className="space-y-4">
              <Button
                onClick={runAllTests}
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  "Run All Network Tests"
                )}
              </Button>

              {tests.length > 0 && (
                <div className="space-y-3">
                  {tests.map((test, index) => (
                    <Alert
                      key={index}
                      variant={
                        test.status === "error" ? "destructive" : "default"
                      }
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
                        <div className="text-xs text-gray-500">
                          {test.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              {networkInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        {networkInfo.online ? (
                          <Wifi className="h-4 w-4" />
                        ) : (
                          <WifiOff className="h-4 w-4" />
                        )}
                        Network Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        Status:{" "}
                        <Badge
                          variant={
                            networkInfo.online ? "default" : "destructive"
                          }
                        >
                          {networkInfo.online ? "Online" : "Offline"}
                        </Badge>
                      </div>
                      <div>Connection: {networkInfo.effectiveType}</div>
                      <div>Downlink: {networkInfo.downlink} Mbps</div>
                      <div>RTT: {networkInfo.rtt} ms</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4" />
                        Environment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        URL: <code className="text-xs">{networkInfo.url}</code>
                      </div>
                      <div>
                        User Agent:{" "}
                        <code className="text-xs break-all">
                          {networkInfo.userAgent}
                        </code>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Key className="h-4 w-4" />
                        API Keys Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        Supabase Key:{" "}
                        <Badge
                          variant={
                            import.meta.env.VITE_SUPABASE_KEY
                              ? "default"
                              : "destructive"
                          }
                        >
                          {import.meta.env.VITE_SUPABASE_KEY
                            ? "Present"
                            : "Missing"}
                        </Badge>
                      </div>
                      <div>
                        OpenAI Key:{" "}
                        <Badge
                          variant={
                            import.meta.env.VITE_OPENAI_API_KEY
                              ? "default"
                              : "secondary"
                          }
                        >
                          {import.meta.env.VITE_OPENAI_API_KEY
                            ? "Present"
                            : "Missing"}
                        </Badge>
                      </div>
                      <div>
                        Blob Token:{" "}
                        <Badge
                          variant={
                            import.meta.env.BLOB_READ_WRITE_TOKEN
                              ? "default"
                              : "secondary"
                          }
                        >
                          {import.meta.env.BLOB_READ_WRITE_TOKEN
                            ? "Present"
                            : "Missing"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Database className="h-4 w-4" />
                        Browser Support
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        Fetch API: <Badge variant={"default"}>Supported</Badge>
                      </div>
                      <div>
                        WebSockets:{" "}
                        <Badge
                          variant={
                            typeof WebSocket !== "undefined"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {typeof WebSocket !== "undefined"
                            ? "Supported"
                            : "Not Supported"}
                        </Badge>
                      </div>
                      <div>
                        Local Storage:{" "}
                        <Badge
                          variant={
                            typeof localStorage !== "undefined"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {typeof localStorage !== "undefined"
                            ? "Supported"
                            : "Not Supported"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkDebugger;
