import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { User, Session, OAuthResponse } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase, authService } from "@/lib/supabase";
import {
  uploadAvatar as uploadAvatarToBlob,
  getBlobStorageStatus,
} from "@/lib/blob-storage";
import { Database } from "@/types/supabase";
import { warn as warnLog } from "@/lib/logging";

type AuthUser = {
  id: string;
  email: string;
  full_name?: string;
  email_verified?: boolean;
  avatar_url?: string;
  needs_email_confirmation?: boolean;
};

import { log, error as logError } from "@/lib/logging";
import {
  useProfile,
  useCreateProfile,
  profileQueryKeys,
  useUpdateProfile,
} from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/lib/routing";
import { identifyUser, captureEvent, resetUser } from "@/lib/posthog";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface GearItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  timestamp?: string;
  description?: string;
  brand?: string;
  model?: string;
  price?: string | number;
  condition?: string;
  gearType?: string;
  estimatedValue?: string | number;
  aiConfidence?: number;
  userConfirmed?: boolean;
  rawJsonResponse?: string;
  openaiPrompt?: string;
  size?: string;
  weight?: string;
  targetFish?: string;
  fishingTechnique?: string;
  weatherConditions?: string;
  waterConditions?: string;
  seasonalUsage?: string;
  colorPattern?: string;
  actionType?: string;
  depthRange?: string;
  versatility?: string;
  compatibleGear?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: any; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<OAuthResponse>;
  signOut: () => Promise<{ error: any }>;
  forgotPassword: (email: string) => Promise<{ error: any }>;
  resetPassword: (password: string) => Promise<{ error: any }>;
  confirmEmail: (token: string) => Promise<{ error: any }>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  uploadAvatar: (file: File) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<{ error: any }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const {
    data: profileData,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useProfile(user?.id);
  const createProfile = useCreateProfile();
  const queryClient = useQueryClient();
  const updateProfileMutation = useUpdateProfile();

  // Convert Supabase User to AuthUser
  const convertUser = (supabaseUser: User | null): AuthUser | null => {
    if (!supabaseUser) return null;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      avatar_url: supabaseUser.user_metadata?.avatar_url || null,
      full_name: supabaseUser.user_metadata?.full_name || null,
      email_verified: supabaseUser.user_metadata.email_verified,
      needs_email_confirmation: !supabaseUser.email_confirmed_at,
    };
  };

  // Create profile when it doesn't exist
  const handleCreateProfile = useCallback(
    async (userId: string, userFullName?: string, userAvatarUrl?: string) => {
      const profileData = {
        full_name:
          userFullName && userFullName.trim() ? userFullName.trim() : null,
        preferred_units: "metric",
        avatar_url: userAvatarUrl || null,
        preferred_language: "en",
        has_seen_onboarding_flow: false,
        favorite_fish_species: [],
      };

      try {
        await createProfile.mutateAsync({ userId, profileData });
        log("[AuthContext] Profile created successfully");
      } catch (error) {
        logError("[AuthContext] Error creating profile:", error);

        // Create a minimal fallback profile in memory for app stability
        // This prevents components from crashing due to missing profile data
        const fallbackProfile: Profile = {
          id: userId,
          full_name: userFullName || null,
          preferred_units: "metric",
          preferred_language: "en",
          has_seen_onboarding_flow: false,
          favorite_fish_species: [],
          avatar_url: null,
          bio: null,
          fishing_experience: null,
          location: null,
          location_coordinates: null,
          username: null,
          gallery_photos: null,
          gear_items: null,
          use_imperial_units: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Set fallback profile in cache temporarily
        queryClient.setQueryData(
          profileQueryKeys.useProfile(userId),
          fallbackProfile,
        );

        log("[AuthContext] Set fallback profile due to creation failure");
      }
    },
    [createProfile],
  );

  // Handle profile creation and PostHog identification when user exists
  useEffect(() => {
    if (user?.id && profileData === undefined && !profileLoading) {
      // Profile query returned but no data found - create profile
      handleCreateProfile(user.id, user.full_name, user.avatar_url);
    }

    // Identify user in PostHog if user exists and email is available
    if (user?.id && user?.email && profileData !== undefined) {
      identifyUser(user.id, user.email);
    }
  }, [user, profileData, profileLoading, handleCreateProfile]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        warnLog(
          "[AuthContext] Auth initialization timeout, forcing loading to false",
        );
        setLoading(false);
      }
    }, 5000); // 5 second timeout - reduced for faster fallback

    // Get initial session
    const initializeAuth = async () => {
      try {
        log("[AuthContext] Initializing auth...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        log("[AuthContext] Initial session result:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          error: error?.message,
        });

        if (mounted) {
          if (session?.user && !error) {
            const authUser = convertUser(session.user);
            log("[AuthContext] Setting initial user:", authUser);
            setUser(authUser);
            setSession(session);

            // Set loading to false immediately for faster UI response
            setLoading(false);
          } else {
            log("[AuthContext] No initial session found");
            setLoading(false);
          }

          // Clear timeout since we completed successfully
          if (timeoutId) clearTimeout(timeoutId);
        }
      } catch (err) {
        logError("[AuthContext] Error initializing auth:", err);
        if (mounted) {
          // Clear timeout since we completed (with error)
          if (timeoutId) clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        log("[AuthContext] Auth state changed:", {
          event,
          userEmail: session?.user?.email,
          hasSession: !!session,
          hasUser: !!session?.user,
          isMobile:
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent,
            ),
        });

        if (session?.user) {
          const authUser = convertUser(session.user);
          log("[AuthContext] Setting user from session:", authUser);
          setUser(authUser);
          setSession(session);
        } else {
          log("[AuthContext] Clearing user session");
          setUser(null);
          setSession(null);

          // Handle logout events - redirect to login if user was previously authenticated
          if (event === "SIGNED_OUT") {
            log("[AuthContext] User signed out, redirecting to login");
            // Small delay to ensure state is cleared
            setTimeout(() => {
              navigate(ROUTES.LOGIN, { replace: true });
            }, 100);
          }
        }
      } catch (e) {
        logError("[AuthContext] Error in auth state change:", e);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Auth methods
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await authService.signUp(
        email,
        password,
        fullName,
      );

      if (error) {
        captureEvent("signup_failed", { error: error.message });
        return { error, needsConfirmation: false };
      }

      if (data?.user && data.session) {
        // Set user data for email verification banner
        const authUser = convertUser(data.user);
        setUser(authUser);
        // Profile will be created automatically via useEffect when user is set
        captureEvent("signup_success", {
          user_id: data.user.id,
          email: data.user.email,
          needs_confirmation: false,
        });
      }

      // If user is created but needs email confirmation
      if (data?.user && data.session == null) {
        captureEvent("signup_success", {
          user_id: data.user.id,
          email: data.user.email,
          needs_confirmation: true,
        });
        return { error: null, needsConfirmation: true };
      }

      // User will be automatically set via onAuthStateChange if session exists
      return { error: null, needsConfirmation: false };
    } catch (err) {
      captureEvent("signup_error", { error: String(err) });
      return {
        error: { message: "An unexpected error occurred during signup", err },
        needsConfirmation: false,
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    log("[AuthContext] Starting signIn for:", email);

    try {
      const { data, error } = await authService.signIn(email, password);

      log("[AuthContext] SignIn result:", {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        hasError: !!error,
        errorMessage: error?.message,
      });

      if (error) {
        log("[AuthContext] Returning error:", error);
        captureEvent("signin_failed", { error: error.message });
        return { error };
      }

      // Success - user will be set via onAuthStateChange
      log("[AuthContext] SignIn successful");
      captureEvent("signin_success", {
        user_id: data?.user?.id,
        email: data?.user?.email,
      });
      return { error: null };
    } catch (err) {
      console.error("[AuthContext] SignIn exception:", err);
      captureEvent("signin_error", { error: String(err) });
      return {
        error: { message: "An unexpected error occurred during signin" },
      };
    }
  };

  const signInWithGoogle = async () => {
    const result = await authService.signInWithGoogle();
    if (result.error) {
      captureEvent("google_signin_failed", { error: result.error.message });
    } else {
      captureEvent("google_signin_initiated");
    }
    return result;
  };

  const signOut = async () => {
    try {
      log("[AuthContext] Starting signOut process");

      // Store user ID for cache cleanup before clearing state
      const userIdForCleanup = user?.id;

      // Track signout event
      if (userIdForCleanup) {
        captureEvent("signout_success", { user_id: userIdForCleanup });
      }

      // Reset PostHog user
      resetUser();

      // Clear local state first to ensure immediate UI update
      setUser(null);
      setSession(null);
      setLoading(false);

      // Call the auth service to sign out from Supabase
      const { error } = await authService.signOut();

      // Selectively clear user-specific cache data while preserving shared data
      if (userIdForCleanup) {
        // Clear user-specific profile data
        queryClient.removeQueries({
          queryKey: profileQueryKeys.useProfile(userIdForCleanup),
        });
        queryClient.removeQueries({
          queryKey: profileQueryKeys.useUserPhotos(userIdForCleanup),
        });
        queryClient.removeQueries({
          queryKey: profileQueryKeys.useUserGear(userIdForCleanup),
        });

        // Clear any other user-specific queries (add more as needed)
        queryClient.removeQueries({
          queryKey: ["userLocation", userIdForCleanup],
        });

        log(
          "[AuthContext] User-specific cache cleared for user:",
          userIdForCleanup,
        );
      } else {
        // Fallback to clearing all cache if no user ID available
        queryClient.clear();
        log("[AuthContext] All cache cleared as fallback");
      }

      if (error) {
        warnLog("[AuthContext] SignOut API error (but continuing):", error);
      }

      // Force redirect to login page after logout
      log("[AuthContext] Redirecting to login after signOut");

      // Use window.location for more reliable redirect
      window.location.href = ROUTES.LOGIN;

      return { error };
    } catch (err) {
      logError("[AuthContext] SignOut error:", err);

      // Store user ID before clearing state
      const userIdForCleanup = user?.id;

      // Still clear local state even if there's an error
      setUser(null);
      setSession(null);
      setLoading(false);

      // Clear user-specific cache even on error
      if (userIdForCleanup) {
        queryClient.removeQueries({
          queryKey: profileQueryKeys.useProfile(userIdForCleanup),
        });
        queryClient.removeQueries({
          queryKey: profileQueryKeys.useUserPhotos(userIdForCleanup),
        });
        queryClient.removeQueries({
          queryKey: profileQueryKeys.useUserGear(userIdForCleanup),
        });
        queryClient.removeQueries({
          queryKey: ["userLocation", userIdForCleanup],
        });
      } else {
        queryClient.clear();
      }

      // Force redirect to login page even on error
      log("[AuthContext] Redirecting to login after signOut error");
      window.location.href = ROUTES.LOGIN;

      return {
        error: { message: "An unexpected error occurred during signout" },
      };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const { error } = await authService.forgotPassword(email);
      return { error };
    } catch (err) {
      logError("[AuthContext] ResetPassword error:", err);
      return { error: { message: "An unexpected error occurred" } };
    }
  };

  const resetPassword = async (password: string) => {
    try {
      const { error } = await authService.resetPassword(password);
      return { error };
    } catch (err) {
      logError("[AuthContext] ResetPassword error:", err);
      return { error: { message: "An unexpected error occurred" } };
    }
  };

  const confirmEmail = async (token: string) => {
    try {
      const { data, error } = await authService.confirmEmail(token);

      if (!error && data?.user) {
        const authUser = convertUser(data.user);
        setUser(authUser);
        // Profile will be created automatically via useEffect when user is set
      }

      return { error };
    } catch (err) {
      logError("[AuthContext] Confirmation error:", err);
      return { error: { message: "An unexpected error occurred" } };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await authService.resendConfirmation(email);
      return { error };
    } catch (err) {
      logError("[AuthContext] Confirmation error:", err);
      return { error: { message: "An unexpected error occurred" } };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: { message: "No user logged in" } };
    }

    try {
      log("[AuthContext] 🔄 updateProfile called:", {
        userId: user.id,
        updateKeys: Object.keys(updates),
        gallery_photos: updates.gallery_photos
          ? `${updates.gallery_photos.length} photos`
          : "not updating",
        gear_items: updates.gear_items
          ? `${Array.isArray(updates.gear_items) ? updates.gear_items.length : 0} gear items`
          : "not updating",
        timestamp: new Date().toISOString(),
      });

      // Validate gear_items structure if present
      if (updates.gear_items) {
        const gearItems = Array.isArray(updates.gear_items)
          ? (updates.gear_items as unknown[])
          : [];
        log("[AuthContext] 🔍 Validating gear_items structure:", {
          isArray: Array.isArray(gearItems),
          count: gearItems.length,
          sampleItem:
            gearItems[0] && typeof gearItems[0] === "object"
              ? {
                  id: (gearItems[0] as Partial<GearItem>).id,
                  name: (gearItems[0] as Partial<GearItem>).name,
                  category: (gearItems[0] as Partial<GearItem>).category,
                  hasImageUrl: !!(gearItems[0] as Partial<GearItem>).imageUrl,
                }
              : null,
        });

        // Type guard to check if item is a valid gear item
        const isValidGearItem = (item: unknown): item is Partial<GearItem> => {
          return (
            item != null &&
            typeof item === "object" &&
            "id" in item &&
            "name" in item &&
            "category" in item &&
            "imageUrl" in item
          );
        };

        // Ensure all gear items have required fields and clean up data
        const validGearItems = gearItems
          .filter(isValidGearItem)
          .map((item) => ({
            // Core required fields
            id: item.id,
            name: item.name,
            category: item.category,
            imageUrl: item.imageUrl,
            timestamp: item.timestamp || new Date().toISOString(),

            // Optional fields - only include if they have values
            ...(item.description && { description: item.description }),
            ...(item.brand && { brand: item.brand }),
            ...(item.model && { model: item.model }),
            ...(item.price && { price: item.price }),
            ...(item.condition && { condition: item.condition }),
            ...(item.gearType && { gearType: item.gearType }),
            ...(item.estimatedValue && { estimatedValue: item.estimatedValue }),
            ...(typeof item.aiConfidence === "number" && {
              aiConfidence: item.aiConfidence,
            }),
            ...(typeof item.userConfirmed === "boolean" && {
              userConfirmed: item.userConfirmed,
            }),
            // CRITICAL: Always preserve debug information
            ...(item.rawJsonResponse && {
              rawJsonResponse: item.rawJsonResponse,
            }),
            ...(item.openaiPrompt && { openaiPrompt: item.openaiPrompt }),
            // Enhanced fields for lures & jigs - ALWAYS INCLUDE, even if empty
            size: item.size || "",
            weight: item.weight || "",
            targetFish: item.targetFish || "",
            fishingTechnique: item.fishingTechnique || "",
            weatherConditions: item.weatherConditions || "",
            waterConditions: item.waterConditions || "",
            seasonalUsage: item.seasonalUsage || "",
            colorPattern: item.colorPattern || "",
            actionType: item.actionType || "",
            depthRange: item.depthRange || "",
            // CRITICAL: Always include these fields - they were being filtered out!
            versatility: item.versatility || "",
            compatibleGear: item.compatibleGear || "",
          }));

        if (validGearItems.length !== gearItems.length) {
          warnLog(
            "[AuthContext] ⚠️ Some gear items were invalid and filtered out:",
            {
              original: gearItems.length,
              valid: validGearItems.length,
              filtered: gearItems.length - validGearItems.length,
            },
          );
        }

        updates.gear_items = validGearItems;
      }

      // Check if gear_items column exists before attempting update

      if (updates.gear_items && !profileData?.hasOwnProperty("gear_items")) {
        warnLog(
          "[AuthContext] ⚠️ gear_items column may not exist in database schema",
        );
        // Try to save without gear_items to avoid schema errors
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { gear_items, ...otherUpdates } = updates;
        if (Object.keys(otherUpdates).length > 0) {
          updates = otherUpdates;
        } else {
          // If only gear_items was being updated, return early with helpful error
          return {
            error: {
              code: "SCHEMA_ERROR",
              message:
                "Database schema needs to be updated. Please regenerate types with: npm run types:supabase",
            },
          };
        }
      }

      log("[AuthContext] 🚀 Starting database update operation:", {
        userId: user.id,
        updateKeys: Object.keys(updates),
        gearItemsCount: Array.isArray(updates.gear_items)
          ? updates.gear_items.length
          : 0,
        timestamp: new Date().toISOString(),
      });

      await updateProfileMutation.mutateAsync({ userId: user.id, updates });

      // Track profile update event (excluding gear_items updates as they're tracked separately)
      if (!updates.gear_items) {
        captureEvent("profile_updated", {
          updated_fields: Object.keys(updates),
          field_count: Object.keys(updates).length,
        });
      }
    } catch (err) {
      logError("[AuthContext] 💥 UpdateProfile exception:", {
        error: err instanceof Error ? err.message : String(err),
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        stack: err instanceof Error ? err.stack : undefined,
        userId: user.id,
        updateKeys: Object.keys(updates),
        isGearUpdate: !!updates.gear_items,
      });

      // Enhanced error handling for different types of failures
      if (err instanceof Error) {
        if (
          err.message.includes("timeout") ||
          err.message.includes("took too long")
        ) {
          return {
            error: {
              message:
                "Database operation timed out. This suggests a database performance or connection issue. Please try again.",
              category: "TIMEOUT_ERROR",
            },
          };
        } else if (
          err.message.includes("fetch") ||
          err.message.includes("network")
        ) {
          return {
            error: {
              message:
                "Network error during database operation. Please check your connection and try again.",
              category: "NETWORK_ERROR",
            },
          };
        } else if (
          err.message.includes("JSON") ||
          err.message.includes("parse")
        ) {
          return {
            error: {
              message:
                "Data format error. The gear data may be corrupted. Please try uploading again.",
              category: "DATA_ERROR",
            },
          };
        }
      }

      return {
        error: {
          message:
            "An unexpected error occurred during profile update. Please try again or contact support if the issue persists.",
          category: "UNKNOWN_ERROR",
          originalError: err instanceof Error ? err.message : String(err),
        },
      };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) {
      return { error: { message: "No user logged in" } };
    }

    try {
      log("[AuthContext] Starting avatar upload for user:", user.id);
      log("[AuthContext] File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Check blob storage configuration first
      const storageStatus = getBlobStorageStatus();
      log("[AuthContext] Blob storage status:", storageStatus);

      if (!storageStatus.configured) {
        const errorMessage =
          storageStatus.error || "Blob storage is not properly configured";
        logError("[AuthContext] Blob storage not configured:", errorMessage);
        return { error: { message: errorMessage } };
      }

      // Upload to Vercel Blob
      log("[AuthContext] Starting blob upload...");
      const avatarUrl = await uploadAvatarToBlob(file, user.id);
      log("[AuthContext] File uploaded successfully:", avatarUrl);

      // Update profile with the new avatar URL
      log("[AuthContext] Updating profile with new avatar URL...");
      await updateProfileMutation.mutateAsync({
        userId: user.id,
        updates: { avatar_url: avatarUrl },
      });
    } catch (err) {
      logError("[AuthContext] Avatar upload error:", err);

      if (err instanceof Error) {
        return { error: { message: err.message } };
      }

      return {
        error: {
          message: "Failed to upload avatar. Please try again.",
        },
      };
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await refetchProfile();
    }
  };

  const deleteAccount = async () => {
    if (!user) {
      return { error: { message: "No user logged in" } };
    }

    try {
      log("[AuthContext] Starting account deletion for user:", user.id);

      // First delete the user's profile data
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) {
        warnLog("[AuthContext] Profile deletion warning:", profileError);
        // Continue with auth deletion even if profile deletion fails
      }

      // Delete the user's auth account
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.id,
      );

      if (authError) {
        logError("[AuthContext] Auth deletion failed:", authError);
        return { error: authError };
      }

      // Clear local state
      setUser(null);
      setSession(null);
      setLoading(false);

      log("[AuthContext] Account deleted successfully");

      // Redirect to login page
      window.location.href = ROUTES.LOGIN;

      return { error: null };
    } catch (err) {
      logError("[AuthContext] Account deletion error:", err);
      return {
        error: {
          message:
            "Failed to delete account. Please try again or contact support.",
        },
      };
    }
  };

  const value = {
    user,
    profile: profileData,
    session,
    loading: loading || profileLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    forgotPassword,
    confirmEmail,
    resendConfirmation,
    updateProfile,
    uploadAvatar,
    refreshProfile,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
