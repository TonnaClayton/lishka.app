import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Initialize Supabase client with proper configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl) {
  console.error(
    "Missing Supabase URL. Please check your environment variables.",
  );
  console.error("Available env vars:", {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_URL: import.meta.env.SUPABASE_URL,
  });
}

if (!supabaseKey) {
  console.error(
    "Missing Supabase key. Please check your environment variables.",
  );
  console.error("Available env vars:", {
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_SUPABASE_KEY: import.meta.env.VITE_SUPABASE_KEY,
    SUPABASE_ANON_KEY: import.meta.env.SUPABASE_ANON_KEY,
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

      console.log("SignUp response:", { data, error });
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

  // Sign in existing user
  async signIn(email: string, password: string) {
    try {
      console.log("Attempting signIn with:", {
        email,
        supabaseUrl,
        hasKey: !!supabaseKey,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("SignIn response:", {
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

  // Reset password
  async resetPassword(email: string) {
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
      console.log("Resend confirmation response:", { data, error });
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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

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
    try {
      console.log(
        "[ProfileService] Updating profile for user:",
        userId,
        "with updates:",
        updates,
      );

      // Special handling for gallery_photos to ensure proper array handling
      if (updates.gallery_photos) {
        console.log("[ProfileService] Gallery photos update detected:", {
          type: typeof updates.gallery_photos,
          isArray: Array.isArray(updates.gallery_photos),
          length: updates.gallery_photos?.length,
          sample: updates.gallery_photos?.slice(0, 2),
        });
      }

      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id, gallery_photos")
        .eq("id", userId)
        .single();

      console.log("[ProfileService] Profile existence check:", {
        exists: !!existingProfile,
        error: checkError?.message,
        currentGalleryPhotos: existingProfile?.gallery_photos,
      });

      if (!existingProfile || checkError) {
        console.log(
          "[ProfileService] Profile doesn't exist, creating it first",
        );
        // Create profile with default values and updates
        const profileData = {
          id: userId,
          preferred_units: "metric",
          preferred_language: "en",
          favorite_fish_species: [],
          gallery_photos: [], // Ensure gallery_photos is initialized
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log("[ProfileService] Creating profile with data:", {
          ...profileData,
          gallery_photos: profileData.gallery_photos?.length || 0,
        });

        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert(profileData)
          .select()
          .single();

        console.log("[ProfileService] Profile creation result:", {
          success: !!newProfile && !createError,
          error: createError?.message,
          galleryPhotosCount: newProfile?.gallery_photos?.length || 0,
        });
        return { data: newProfile, error: createError };
      }

      // Profile exists, update it
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      console.log("[ProfileService] Updating existing profile with:", {
        ...updateData,
        gallery_photos: updateData.gallery_photos?.length || "not updating",
      });

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      console.log("[ProfileService] Profile update result:", {
        success: !!data && !error,
        error: error?.message,
        galleryPhotosCount: data?.gallery_photos?.length || 0,
        galleryPhotosChanged:
          JSON.stringify(existingProfile.gallery_photos) !==
          JSON.stringify(data?.gallery_photos),
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

      return { data, error };
    } catch (err) {
      console.error("[ProfileService] UpdateProfile error:", err);
      return {
        data: null,
        error: {
          message:
            err instanceof Error ? err.message : "Unknown error occurred",
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
