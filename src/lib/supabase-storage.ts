import { supabase } from "./supabase";

/**
 * Supabase Storage Service
 *
 * Alternative to Vercel Blob that avoids CSP issues
 * Uses the already configured Supabase instance
 */

/**
 * Upload image to Supabase Storage
 */
export async function uploadImageToSupabase(
  file: File,
  bucket: string = "gear-images",
): Promise<string> {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  try {
    console.log("[SupabaseStorage] 🚀 Starting upload:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      bucket,
      isMobile,
    });

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File size must be less than 10MB");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed");
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const fileName = `${cleanName}-${timestamp}.${fileExt}`;

    console.log("[SupabaseStorage] 📝 Generated filename:", fileName);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("[SupabaseStorage] ❌ Upload failed:", error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    if (!data?.path) {
      throw new Error("No file path returned from upload");
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL");
    }

    console.log("[SupabaseStorage] ✅ Upload successful:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("[SupabaseStorage] 💥 Upload failed:", {
      error: error instanceof Error ? error.message : String(error),
      fileName: file.name,
      fileSize: file.size,
      isMobile,
    });

    throw error;
  }
}

/**
 * Upload avatar to Supabase Storage
 */
export async function uploadAvatarToSupabase(
  file: File,
  userId: string,
): Promise<string> {
  try {
    console.log("[SupabaseStorage] Starting avatar upload:", {
      userId,
      fileName: file.name,
      fileSize: file.size,
    });

    // Validate user ID
    if (!userId || userId.trim() === "") {
      throw new Error("User ID is required for avatar upload");
    }

    // Generate avatar filename
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${userId}-${timestamp}.${fileExt}`;

    return await uploadImageToSupabase(file, "avatars");
  } catch (error) {
    console.error("[SupabaseStorage] Avatar upload failed:", error);
    throw error;
  }
}

/**
 * Check if Supabase storage is configured
 */
export function isSupabaseStorageConfigured(): boolean {
  try {
    return (
      !!supabase &&
      !!import.meta.env.VITE_SUPABASE_URL &&
      !!import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  } catch {
    return false;
  }
}

/**
 * Get Supabase storage status
 */
export function getSupabaseStorageStatus() {
  return {
    configured: isSupabaseStorageConfigured(),
    hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    supabaseConnected: !!supabase,
  };
}
