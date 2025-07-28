import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { list } from "@vercel/blob";

const BlobConnectionTest = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test connection by trying to list blobs
        const blobs = await list({
          storeId: "store_gHeP9tKUZzpsMcZW",
        });

        // Check if we have any blobs
        if (blobs.blobs.length > 0) {
          // Get the first image URL
          const firstImageUrl = blobs.blobs[0].url;
          setImageUrl(firstImageUrl);
          setStatus("success");
          setMessage(
            `Connected to Vercel Blob. Found ${blobs.blobs.length} images.`,
          );
        } else {
          setStatus("success");
          setMessage("Connected to Vercel Blob. No images found.");
        }
      } catch (error) {
        console.error("Vercel Blob connection test failed:", error);
        setStatus("error");
        setMessage(
          `Connection error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    testConnection();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto bg-white">
      <CardHeader>
        <CardTitle>Vercel Blob Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        {status === "loading" && <p>Testing connection to Vercel Blob...</p>}

        {status === "success" && (
          <>
            <Alert variant="success" className="mb-4">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertTitle>Connection Successful</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>

            {imageUrl && (
              <div className="mt-4">
                <p className="mb-2 font-medium">Sample Image:</p>
                <img
                  src={imageUrl}
                  alt="Vercel Blob test image"
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

export default BlobConnectionTest;
