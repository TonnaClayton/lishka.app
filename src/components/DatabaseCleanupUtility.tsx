import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { db } from "@/lib/supabase";

const DatabaseCleanupUtility: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info",
  );

  const emailsToClean = ["tonnaclayton@gmail.com", "cla810@hotmail.com"];

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.listAllUsers();
      if (error) {
        setMessage(`Error loading users: ${error.message}`);
        setMessageType("error");
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      setMessage("Failed to load users");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const cleanupSpecificEmails = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } =
        await db.deleteMultipleUsersByEmail(emailsToClean);

      if (error) {
        setMessage(`Cleanup failed: ${error.message}`);
        setMessageType("error");
      } else {
        const results = data || [];
        const successCount = results.filter(
          (r: any) => r.result.data && !r.result.error,
        ).length;
        const failCount = results.length - successCount;

        if (successCount > 0) {
          setMessage(
            `Successfully cleaned ${successCount} email(s). ${failCount > 0 ? `${failCount} email(s) not found.` : ""}`,
          );
          setMessageType("success");
          // Reload users list
          await loadUsers();
        } else {
          setMessage("No matching emails found to clean");
          setMessageType("info");
        }
      }
    } catch (err) {
      setMessage("Cleanup operation failed");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const clearAllAuthData = async () => {
    setLoading(true);
    try {
      // First, sign out from Supabase to invalidate server-side session
      await db.auth.signOut();

      // Clear all Supabase-related localStorage keys
      const supabaseKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
          supabaseKeys.push(key);
        }
      }
      supabaseKeys.forEach((key) => localStorage.removeItem(key));

      // Clear all authentication-related localStorage data
      localStorage.removeItem("users_db");
      localStorage.removeItem("profiles_db");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      localStorage.removeItem("pending_email_confirmation");
      localStorage.removeItem("confirmation_token");
      localStorage.removeItem("userLocation");
      localStorage.removeItem("userLocationFull");

      // Clear sessionStorage as well
      const sessionKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (
          key &&
          (key.startsWith("sb-") ||
            key.includes("supabase") ||
            key.includes("auth"))
        ) {
          sessionKeys.push(key);
        }
      }
      sessionKeys.forEach((key) => sessionStorage.removeItem(key));

      // Reinitialize empty databases
      localStorage.setItem("users_db", JSON.stringify({}));
      localStorage.setItem("profiles_db", JSON.stringify({}));

      setMessage(
        `All authentication data cleared. Cleared ${supabaseKeys.length} localStorage keys and ${sessionKeys.length} sessionStorage keys. Please refresh the page.`,
      );
      setMessageType("success");
      setUsers([]);

      // Force page reload after a short delay to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage(
        `Error clearing auth data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const inspectBrowserStorage = () => {
    const storageInfo = {
      localStorage: [],
      sessionStorage: [],
      supabaseKeys: [],
      authKeys: [],
    };

    // Inspect localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        storageInfo.localStorage.push({
          key,
          value: localStorage.getItem(key)?.substring(0, 100) + "...",
        });

        if (key.startsWith("sb-") || key.includes("supabase")) {
          storageInfo.supabaseKeys.push(key);
        }

        if (
          key.includes("auth") ||
          key.includes("user") ||
          key.includes("token")
        ) {
          storageInfo.authKeys.push(key);
        }
      }
    }

    // Inspect sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        storageInfo.sessionStorage.push({
          key,
          value: sessionStorage.getItem(key)?.substring(0, 100) + "...",
        });
      }
    }

    console.log("Browser Storage Inspection:", storageInfo);
    setMessage(
      `Storage inspection complete. Found ${storageInfo.supabaseKeys.length} Supabase keys, ${storageInfo.authKeys.length} auth-related keys. Check console for details.`,
    );
    setMessageType("info");
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Database Cleanup Utility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <Alert
              variant={
                messageType === "error"
                  ? "destructive"
                  : messageType === "success"
                    ? "default"
                    : "default"
              }
            >
              {messageType === "success" && <CheckCircle className="h-4 w-4" />}
              {messageType === "error" && <AlertTriangle className="h-4 w-4" />}
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {/* Email Verification Issue Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Email Verification Issue:</strong> The current system is a
              browser-only implementation that doesn't actually send emails.
              Email verification tokens are generated but no emails are sent.
              You can either:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Skip email verification (make it optional)</li>
                <li>
                  Integrate with an email service like Resend, SendGrid, or
                  similar
                </li>
                <li>Use the manual verification token from browser console</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Specific Email Cleanup */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Clean Specific Emails</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Emails to be removed:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {emailsToClean.map((email) => (
                  <li key={email} className="text-sm font-mono">
                    {email}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              onClick={cleanupSpecificEmails}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {loading ? "Cleaning..." : "Clean Specific Emails"}
            </Button>
          </div>

          {/* Current Users List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Current Users</h3>
              <Button
                onClick={loadUsers}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                Refresh
              </Button>
            </div>
            {users.length === 0 ? (
              <p className="text-gray-500 text-sm">No users found</p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-gray-600">
                        {user.full_name || "No name"} •{" "}
                        {user.email_verified ? "Verified" : "Unverified"}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Browser Storage Inspection */}
          <div className="border-t pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600">
                Browser Storage Inspection
              </h3>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This will inspect all browser storage (localStorage and
                  sessionStorage) to identify cached authentication data. Check
                  the browser console for detailed output.
                </AlertDescription>
              </Alert>
              <Button
                onClick={inspectBrowserStorage}
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Inspect Browser Storage
              </Button>
            </div>
          </div>

          {/* Nuclear Option */}
          <div className="border-t pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600">
                Complete Authentication Reset
              </h3>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Sign out from Supabase server-side</li>
                    <li>
                      Clear ALL Supabase session data from browser storage
                    </li>
                    <li>Clear all authentication tokens and user data</li>
                    <li>Force page reload for clean state</li>
                  </ul>
                  <strong>
                    Use this if you're experiencing persistent login issues.
                  </strong>
                </AlertDescription>
              </Alert>
              <Button
                onClick={clearAllAuthData}
                disabled={loading}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {loading ? "Clearing..." : "Complete Authentication Reset"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseCleanupUtility;
