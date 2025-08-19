import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { config } from "@/lib/config";
import { log } from "./logging";

// Initialize Supabase client with proper configuration
const supabaseUrl = config.VITE_SUPABASE_URL;
const supabaseKey = config.VITE_SUPABASE_ANON_KEY || config.VITE_SUPABASE_KEY;

if (!supabaseUrl) {
  console.error(
    "Missing Supabase URL. Please check your environment variables.",
  );
  console.error("Available env vars:", {
    VITE_SUPABASE_URL: config.VITE_SUPABASE_URL,
    SUPABASE_URL: config.SUPABASE_URL,
  });
}

if (!supabaseKey) {
  console.error(
    "Missing Supabase key. Please check your environment variables.",
  );
  console.error("Available env vars:", {
    VITE_SUPABASE_ANON_KEY: config.VITE_SUPABASE_ANON_KEY,
    VITE_SUPABASE_KEY: config.VITE_SUPABASE_KEY,
    SUPABASE_ANON_KEY: config.SUPABASE_ANON_KEY,
  });
}

// Create Supabase client with simplified configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

// Simple auth functions - direct Supabase calls without complex wrappers
export const authService = {
  // Sign up new user
  async signUp(email: string, password: string, fullName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      log("SignUp response:", { data, error });
      return { data, error };
    } catch (err) {
      console.error("SignUp error:", err);
      return {
        data: null,
        error: {
          message:
            err instanceof Error ? err.message : "Unknown error occurred",
        },
      };
    }
  },

  // Sign in existing user with timeout protection
  async signIn(email: string, password: string) {
    try {
      log("Attempting signIn with:", {
        email,
        supabaseUrl,
        hasKey: !!supabaseKey,
      });

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Login timeout - please try again")),
          8000,
        );
      });

      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const { data, error } = (await Promise.race([
        signInPromise,
        timeoutPromise,
      ])) as any;

      log("SignIn response:", {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message,
      });

      return { data, error };
    } catch (err) {
      console.error("SignIn error:", err);
      return {
        data: null,
        error: {
          message:
            err instanceof Error ? err.message : "Unknown error occurred",
        },
      };
    }
  },

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      console.error("SignOut error:", err);
      return {
        error: {
          message:
            err instanceof Error ? err.message : "Unknown error occurred",
        },
      };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      return { user, error };
    } catch (err) {
      console.error("GetCurrentUser error:", err);
      return {
        user: null,
        error: {
          message:
            err instanceof Error ? err.message : "Unknown error occurred",
        },
      };
    }
  },

  // Forgot password
  async forgotPassword(email: string) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { data, error };
    } catch (err) {
      console.error("ResetPassword error:", err);
      return {
        data: null,
        error: {
          message:
            err instanceof Error ? err.message : "Unknown error occurred",
        },
      };
    }
  },

  // Reset password
  async resetPassword(password: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });
      return { data, error };
    } catch (err) {
      console.error("ResetPassword error:", err);
      return {
        data: null,
        error: {
          message:
            err instanceof Error ? err.message : "Unknown error occurred",
        },
      };
    }
  },

  // Resend confirmation email
  async resendConfirmation(email: string) {
    try {
      const { data, error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      log("Resend confirmation response:", { data, error });
      return { data, error };
    } catch (err) {
      console.error("ResendConfirmation error:", err);
      return {
        data: null,
        error: {
          message:
            err instanceof Error ? err.message : "Unknown error occurred",
        },
      };
    }
  },

  // Confirm email with token
  async confirmEmail(token: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "email",
      });
      return { data, error };
    } catch (err) {
      console.error("ConfirmEmail error:", err);
      return {
        data: null,
        error: {
          message:
            err instanceof Error ? err.message : "Unknown error occurred",
        },
      };
    }
  },
};

// Export auth service for compatibility
export const auth = authService;

// Export db for compatibility with components that expect it
export const db = supabase;

// Profile management
export const profileService = {
  async getProfile(userId: string) {
    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Profile fetch timeout")), 3000);
      });

      const profilePromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const { data, error } = (await Promise.race([
        profilePromise,
        timeoutPromise,
      ])) as any;

      return { data, error };
    } catch (err) {
      console.error("GetProfile error:", err);
      return {
        data: null,
        error: {
          message:
            err instanceof Error ? err.message : "Unknown error occurred",
        },
      };
    }
  },

  async updateProfile(userId: string, updates: any) {
    const startTime = Date.now();
    try {
      log("[ProfileService] 🚀 Starting profile update:", {
        userId,
        updateKeys: Object.keys(updates),
        gearItemsCount: updates.gear_items?.length || 0,
        galleryPhotosCount: updates.gallery_photos?.length || 0,
        timestamp: new Date().toISOString(),
      });

      // Special handling for gallery_photos to ensure proper array handling
      if (updates.gallery_photos) {
        log("[ProfileService] Gallery photos update detected:", {
          type: typeof updates.gallery_photos,
          isArray: Array.isArray(updates.gallery_photos),
          length: updates.gallery_photos?.length,
          sample: updates.gallery_photos?.slice(0, 2),
        });
      }

      // Special handling for gear_items to ensure proper array handling
      if (updates.gear_items) {
        log("[ProfileService] Gear items update detected:", {
          type: typeof updates.gear_items,
          isArray: Array.isArray(updates.gear_items),
          length: updates.gear_items?.length,
          sample: updates.gear_items?.slice(0, 2).map((item) => ({
            id: item?.id,
            name: item?.name,
            category: item?.category,
            hasImageUrl: !!item?.imageUrl,
          })),
        });
      }

      // First check if profile exists with timeout
      log("[ProfileService] 🔍 Checking if profile exists...");
      const checkStartTime = Date.now();

      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id, gallery_photos, gear_items")
        .eq("id", userId)
        .single();

      const checkTime = Date.now() - checkStartTime;
      log("[ProfileService] ⏱️ Profile existence check completed:", {
        checkTime: `${checkTime}ms`,
        exists: !!existingProfile,
        hasError: !!checkError,
        errorCode: checkError?.code,
      });

      log("[ProfileService] Profile existence check:", {
        exists: !!existingProfile,
        error: checkError?.message,
        errorCode: checkError?.code,
        currentGalleryPhotos: existingProfile?.gallery_photos?.length || 0,
        currentGearItems: Array.isArray(existingProfile?.gear_items)
          ? existingProfile.gear_items.length
          : 0,
      });

      if (!existingProfile || checkError) {
        log("[ProfileService] Profile doesn't exist, creating it first");
        // Create profile with minimal required data for faster creation
        const profileData = {
          id: userId,
          preferred_units: "metric",
          preferred_language: "en",
          favorite_fish_species: [],
          gallery_photos: [],
          gear_items: [], // Initialize gear_items as empty array
          // Only include essential updates to reduce payload
          ...(updates.full_name && { full_name: updates.full_name }),
          ...(updates.avatar_url && { avatar_url: updates.avatar_url }),
          ...(updates.gear_items && { gear_items: updates.gear_items }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        log("[ProfileService] Creating profile with data:", {
          ...profileData,
          gallery_photos: profileData.gallery_photos?.length || 0,
          gear_items: profileData.gear_items?.length || 0,
        });

        log("[ProfileService] 📝 Creating new profile...");
        const createStartTime = Date.now();

        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert(profileData)
          .select()
          .single();

        const createTime = Date.now() - createStartTime;
        log("[ProfileService] ⏱️ Profile creation completed:", {
          createTime: `${createTime}ms`,
          success: !!newProfile && !createError,
        });

        log("[ProfileService] Profile creation result:", {
          success: !!newProfile && !createError,
          error: createError?.message,
          errorCode: createError?.code,
          errorDetails: createError?.details,
          galleryPhotosCount: newProfile?.gallery_photos?.length || 0,
          gearItemsCount: Array.isArray(newProfile?.gear_items)
            ? newProfile.gear_items.length
            : 0,
        });
        return { data: newProfile, error: createError };
      }

      // Profile exists, update it
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      log("[ProfileService] Updating existing profile with:", {
        ...updateData,
        gallery_photos: updateData.gallery_photos?.length || "not updating",
        gear_items: updateData.gear_items?.length || "not updating",
      });

      log("[ProfileService] 💾 Updating existing profile...");
      const updateStartTime = Date.now();

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      const updateTime = Date.now() - updateStartTime;
      log("[ProfileService] ⏱️ Profile update completed:", {
        updateTime: `${updateTime}ms`,
        success: !!data && !error,
        totalOperationTime: `${Date.now() - startTime}ms`,
      });

      log("[ProfileService] Profile update result:", {
        success: !!data && !error,
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        galleryPhotosCount: data?.gallery_photos?.length || 0,
        gearItemsCount: Array.isArray(data?.gear_items)
          ? data.gear_items.length
          : 0,
        galleryPhotosChanged:
          JSON.stringify(existingProfile.gallery_photos) !==
          JSON.stringify(data?.gallery_photos),
        gearItemsChanged:
          JSON.stringify(existingProfile.gear_items) !==
          JSON.stringify(data?.gear_items),
      });

      // Additional verification for gallery_photos updates
      if (updates.gallery_photos && data) {
        const expectedCount = updates.gallery_photos.length;
        const actualCount = data.gallery_photos?.length || 0;
        if (expectedCount !== actualCount) {
          console.warn("[ProfileService] Gallery photos count mismatch!", {
            expected: expectedCount,
            actual: actualCount,
          });
        }
      }

      // Additional verification for gear_items updates
      if (updates.gear_items && data) {
        const expectedCount = updates.gear_items.length;
        const actualCount = Array.isArray(data.gear_items)
          ? data.gear_items.length
          : 0;
        if (expectedCount !== actualCount) {
          console.warn("[ProfileService] Gear items count mismatch!", {
            expected: expectedCount,
            actual: actualCount,
            expectedItems: updates.gear_items.map((item) => ({
              id: item.id,
              name: item.name,
            })),
            actualItems: Array.isArray(data.gear_items)
              ? data.gear_items.map((item: any) => ({
                  id: item.id,
                  name: item.name,
                }))
              : [],
          });
        }
      }

      return { data, error };
    } catch (err) {
      const totalTime = Date.now() - startTime;
      console.error("[ProfileService] 💥 UpdateProfile exception:", {
        error: err instanceof Error ? err.message : String(err),
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        totalTime: `${totalTime}ms`,
        userId,
        updateKeys: Object.keys(updates),
        stack: err instanceof Error ? err.stack : undefined,
      });

      // Categorize the error for better debugging
      let errorCategory = "UNKNOWN";
      let userMessage = "Unknown error occurred";

      if (err instanceof Error) {
        if (
          err.message.includes("timeout") ||
          err.message.includes("took too long")
        ) {
          errorCategory = "TIMEOUT";
          userMessage = `Database timeout after ${totalTime}ms - operation took too long`;
        } else if (
          err.message.includes("fetch") ||
          err.message.includes("network")
        ) {
          errorCategory = "NETWORK";
          userMessage = "Network error during database operation";
        } else if (err.message.includes("connection")) {
          errorCategory = "CONNECTION";
          userMessage = "Database connection error";
        } else {
          userMessage = err.message;
        }
      }

      return {
        data: null,
        error: {
          message: userMessage,
          code: (err as any)?.code,
          details: (err as any)?.details,
          hint: (err as any)?.hint,
          category: errorCategory,
          totalTime: `${totalTime}ms`,
        },
      };
    }
  },

  async createProfile(userId: string, profileData: any) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          ...profileData,
        })
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error("CreateProfile error:", err);
      return {
        data: null,
        error: {
          message:
            err instanceof Error ? err.message : "Unknown error occurred",
        },
      };
    }
  },
};
