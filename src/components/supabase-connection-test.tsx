import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { config } from "@/lib/config";

const SupabaseConnectionTest = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabaseUrl = "https://evevdtciewzvqspsnupc.supabase.co";
        const supabaseKey = config.VITE_SUPABASE_KEY;

        if (!supabaseKey) {
          throw new Error("Missing VITE_SUPABASE_KEY environment variable");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Test connection by trying to get a specific image
        const { data } = supabase.storage
          .from("fish-images")
          .getPublicUrl("sparusaurata.png");

        if (data?.publicUrl) {
          // Verify the image exists
          const response = await fetch(data.publicUrl, { method: "HEAD" });
          if (!response.ok) {
            throw new Error(`Image not found: ${response.status}`);
          }

          setImageUrl(data.publicUrl);
          setStatus("success");
          setMessage(`Connected to Supabase. Image URL: ${data.publicUrl}`);
        } else {
          throw new Error("No public URL returned");
        }
      } catch (error) {
        error("Supabase connection test failed:", error);
        setStatus("error");
        setMessage(
          `Connection error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    testConnection();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        {status === "loading" && <p>Testing connection to Supabase...</p>}

        {status === "success" && (
          <>
            <Alert variant="success" className="mb-4">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertTitle>Connection Successful</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>

            {imageUrl && (
              <div className="mt-4">
                <p className="mb-2 font-medium">Test Image:</p>
                <img
                  src={imageUrl}
                  alt="Supabase test image"
                  className="w-full h-auto rounded-md border"
                  onError={() =>
                    setMessage((prev) => `${prev} (Image failed to load)`)
                  }
                />
              </div>
            )}
          </>
        )}

        {status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Failed</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseConnectionTest;
