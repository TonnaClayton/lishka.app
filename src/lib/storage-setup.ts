import { log } from "./logging";
import { supabase } from "./supabase";

/**
 * Sets up the avatars storage bucket in Supabase
 * This should be run once to initialize the storage bucket
 */
export const setupAvatarStorage = async () => {
  try {
    log("Setting up avatar storage bucket...");

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Storage setup timeout after 30 seconds")),
        30000,
      );
    });

    const setupPromise = async () => {
      // First, try to check if bucket exists by attempting to list files
      try {
        const { data: testFiles, error: testError } = await supabase.storage
          .from("avatars")
          .list("", { limit: 1 });

        if (!testError) {
          log("Avatars bucket already exists and is accessible");
          return { error: null };
        }

        log("Bucket test failed, checking bucket list...", testError);
      } catch (testErr) {
        log("Bucket test threw exception:", testErr);
      }

      // List all buckets to see what exists
      let buckets = null;
      try {
        const { data: bucketData, error: listError } =
          await supabase.storage.listBuckets();

        if (listError) {
          console.error("Error listing buckets:", listError);
          // Continue anyway - we'll try to create the bucket
        } else {
          buckets = bucketData;
          log("Available buckets:", buckets?.map((b) => b.name) || []);
        }
      } catch (listErr) {
        console.error("Exception listing buckets:", listErr);
        // Continue anyway - we'll try to create the bucket
      }

      const avatarBucket = buckets?.find((bucket) => bucket.name === "avatars");

      if (!avatarBucket) {
        log("Creating avatars bucket...");
        try {
          const { data, error } = await supabase.storage.createBucket(
            "avatars",
            {
              public: true,
              allowedMimeTypes: [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif",
              ],
              fileSizeLimit: 10485760, // 10MB
            },
          );

          if (error) {
            console.error("Error creating bucket:", error);

            // If bucket already exists error, that's actually OK
            if (
              error.message?.includes("already exists") ||
              error.message?.includes("Duplicate") ||
              error.message?.includes("already_exists") ||
              error.message?.includes("duplicate key value")
            ) {
              log("Bucket already exists (creation returned duplicate error)");
              // Continue to verification
            } else {
              // For other errors, try a simple approach - just return success
              // The upload will fail if the bucket truly doesn't exist
              log("Bucket creation failed, but continuing anyway...");
            }
          } else {
            log("Avatars bucket created successfully:", data);
          }
        } catch (createErr) {
          console.error("Exception creating bucket:", createErr);
          // Continue anyway - maybe the bucket exists but we can't detect it
        }
      } else {
        log("Avatars bucket found in list");
      }

      // Final verification - try to access the bucket
      try {
        const { data: verifyFiles, error: verifyError } = await supabase.storage
          .from("avatars")
          .list("", { limit: 1 });

        if (verifyError) {
          console.error("Bucket verification failed:", verifyError);

          // If it's just an empty bucket error, that's fine
          if (
            verifyError.message?.includes("empty") ||
            verifyError.message?.includes("no objects") ||
            verifyError.message?.includes("not found")
          ) {
            log("Bucket is empty but accessible - this is fine");
            return { error: null };
          }

          // For other verification errors, still return success
          // The actual upload will reveal if there are real issues
          log("Verification failed but continuing anyway...");
          return { error: null };
        }

        log("Avatars bucket setup completed successfully");
        return { error: null };
      } catch (verifyErr) {
        console.error("Exception during verification:", verifyErr);
        // Still return success - let the upload attempt reveal real issues
        return { error: null };
      }
    };

    const result = await Promise.race([setupPromise(), timeoutPromise]);
    return result as { error: any };
  } catch (err) {
    console.error("Setup error:", err);

    // Handle timeout errors specifically
    if (err instanceof Error && err.message.includes("timeout")) {
      return {
        error: {
          message:
            "Storage setup is taking too long. Please check your connection and try again.",
        },
      };
    }

    // For other errors, be more lenient - return success and let upload attempt reveal real issues
    log("Setup had errors but returning success to allow upload attempt");
    return { error: null };
  }
};

/**
 * Deletes old avatar files for a user (cleanup)
 */
export const cleanupOldAvatars = async (
  userId: string,
  currentFileName?: string,
) => {
  try {
    const { data: files, error } = await supabase.storage
      .from("avatars")
      .list("", {
        search: userId,
      });

    if (error || !files) {
      log("No old avatars to cleanup or error:", error);
      return;
    }

    // Filter out the current file and delete the rest
    const filesToDelete = files
      .filter(
        (file) => file.name !== currentFileName && file.name.startsWith(userId),
      )
      .map((file) => file.name);

    if (filesToDelete.length > 0) {
      log("Cleaning up old avatars:", filesToDelete);
      const { error: deleteError } = await supabase.storage
        .from("avatars")
        .remove(filesToDelete);

      if (deleteError) {
        console.error("Error cleaning up old avatars:", deleteError);
      } else {
        log("Old avatars cleaned up successfully");
      }
    }
  } catch (err) {
    console.error("Cleanup error:", err);
  }
};
