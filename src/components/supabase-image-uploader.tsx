import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle2, AlertCircle, Upload, Image } from "lucide-react";
import { config } from "@/lib/config";

interface SupabaseImageUploaderProps {
  bucketName?: string;
}

const SupabaseImageUploader: React.FC<SupabaseImageUploaderProps> = ({
  bucketName = "fish-images",
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [scientificName, setScientificName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus({
        type: "info",
        message: `File selected: ${e.target.files[0].name}`,
      });
    }
  };

  const uploadImage = async () => {
    if (!file || !scientificName) {
      setStatus({
        type: "error",
        message: "Please select a file and enter a scientific name",
      });
      return;
    }

    // Initialize Supabase client
    const supabaseUrl = "https://evevdtciewzvqspsnupc.supabase.co";
    const supabaseKey = config.VITE_SUPABASE_KEY;

    if (!supabaseKey) {
      setStatus({
        type: "error",
        message:
          "Supabase configuration missing. Please add VITE_SUPABASE_KEY to your environment variables.",
      });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      setUploading(true);
      setStatus({ type: "info", message: "Uploading..." });

      // Normalize the scientific name (lowercase, remove spaces)
      const normalizedName = scientificName.toLowerCase().replace(/\s+/g, "");
      const fileExt = file.name.split(".").pop();
      const fileName = `${normalizedName}.${fileExt}`;

      // Upload file to Supabase Storage
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      setUploadedImageUrl(urlData.publicUrl);
      setStatus({
        type: "success",
        message: `Image uploaded successfully! It will be available for fish with scientific name: ${scientificName}`,
      });
    } catch (error) {
      error("Error uploading image:", error);
      setStatus({
        type: "error",
        message: `Upload failed: ${error.message || "Unknown error"}`,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white dark:bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Fish Image Uploader
        </CardTitle>
        <CardDescription>
          Upload high-quality fish images to Supabase storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="scientificName">Scientific Name</Label>
          <Input
            id="scientificName"
            placeholder="e.g. Salmo salar"
            value={scientificName}
            onChange={(e) => setScientificName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            This will be used to generate the filename in Supabase
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fishImage">Fish Image</Label>
          <div className="flex items-center gap-2">
            <Input
              id="fishImage"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="flex-1"
            />
          </div>
        </div>

        {status.type && (
          <Alert
            variant={
              status.type === "error"
                ? "destructive"
                : status.type === "success"
                  ? "default"
                  : "default"
            }
          >
            {status.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : status.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Image className="h-4 w-4" />
            )}
            <AlertTitle>
              {status.type === "success"
                ? "Success"
                : status.type === "error"
                  ? "Error"
                  : "Info"}
            </AlertTitle>
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        {uploadedImageUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Uploaded Image:</p>
            <div className="border rounded-md overflow-hidden">
              <img
                src={uploadedImageUrl}
                alt="Uploaded fish"
                className="w-full h-auto max-h-48 object-cover"
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={uploadImage}
          disabled={uploading || !file || !scientificName}
          className="w-full"
        >
          {uploading ? "Uploading..." : "Upload to Supabase"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SupabaseImageUploader;
