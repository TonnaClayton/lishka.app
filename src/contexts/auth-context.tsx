import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase, authService, profileService } from "@/lib/supabase";
import {
  uploadAvatar as uploadAvatarToBlob,
  getBlobStorageStatus,
} from "@/lib/blob-storage";

type AuthUser = {
  id: string;
  email: string;
  full_name?: string;
  email_verified?: boolean;
  needs_email_confirmation?: boolean;
};

import { ImageMetadata } from "@/lib/image-metadata";
import { log } from "@/lib/logging";
import { useProfile } from "@/hooks/queries";

type Profile = {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  location?: string;
  location_coordinates?: any;
  preferred_units?: string;
  preferred_language?: string;
  fishing_experience?: string;
  favorite_fish_species?: string[];
  bio?: string;
  gallery_photos?: ImageMetadata[]; // Standardize to always be ImageMetadata objects
  gear_items?: any[]; // Add gear_items field
  created_at: string;
  updated_at: string;
};

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: any; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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
  undefined
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const {} = useProfile(user?.id);

  // Convert Supabase User to AuthUser
  const convertUser = (supabaseUser: User | null): AuthUser | null => {
    if (!supabaseUser) return null;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      full_name: supabaseUser.user_metadata?.full_name || null,
      email_verified: !!supabaseUser.email_confirmed_at,
      needs_email_confirmation: !supabaseUser.email_confirmed_at,
    };
  };

  // Load user profile
  const loadProfile = async (userId: string, userFullName?: string) => {
    try {
      log(
        "[AuthContext] Loading profile for user:",
        userId,
        "with full name:",
        userFullName
      );

      const { data, error } = await profileService.getProfile(userId);

      log("[AuthContext] Profile fetch result:", {
        hasData: !!data,
        error: error?.message || error,
        userId,
        galleryPhotosCount: data?.gallery_photos?.length || 0,
      });

      if (data && !error) {
        log("[AuthContext] Profile loaded successfully:", {
          id: data.id,
          full_name: data.full_name,
          hasAvatar: !!data.avatar_url,
          avatarLength: data.avatar_url?.length || 0,
          galleryPhotosCount: data.gallery_photos?.length || 0,
          galleryPhotosPreview: data.gallery_photos?.slice(0, 2) || [],
        });
        setProfile(data);
      } else if (
        error &&
        (error.message?.includes("No rows") ||
          error.message?.includes("PGRST116") ||
          error.code === "PGRST116")
      ) {
        // Profile doesn't exist, create one
        log(
          "[AuthContext] Creating new profile for user:",
          userId,
          "with full name:",
          userFullName
        );
        const profileData = {
          full_name:
            userFullName && userFullName.trim() ? userFullName.trim() : null,
          preferred_units: "metric",
          preferred_language: "en",
          favorite_fish_species: [],
        };
        log("[AuthContext] Profile data to create:", profileData);
        const { data: newProfile, error: createError } =
          await profileService.createProfile(userId, profileData);
        if (newProfile && !createError) {
          setProfile(newProfile);
          log("[AuthContext] Profile created successfully:", newProfile);
        } else {
          console.error("[AuthContext] Error creating profile:", createError);
          // Set a minimal profile to prevent loading state from getting stuck
          const fallbackProfile = {
            id: userId,
            full_name: userFullName || null,
            preferred_units: "metric",
            preferred_language: "en",
            favorite_fish_species: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Profile;
          log("[AuthContext] Setting fallback profile:", fallbackProfile);
          setProfile(fallbackProfile);
        }
      } else {
        console.error("[AuthContext] Error loading profile:", error);
        // Set a minimal profile to prevent loading state from getting stuck
        const fallbackProfile = {
          id: userId,
          full_name: userFullName || null,
          preferred_units: "metric",
          preferred_language: "en",
          favorite_fish_species: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Profile;
        log(
          "[AuthContext] Setting fallback profile due to error:",
          fallbackProfile
        );
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.error("[AuthContext] Exception in loadProfile:", err);
      // Set a minimal profile to prevent loading state from getting stuck
      const fallbackProfile = {
        id: userId,
        full_name: userFullName || null,
        preferred_units: "metric",
        preferred_language: "en",
        favorite_fish_species: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Profile;
      log(
        "[AuthContext] Setting fallback profile due to exception:",
        fallbackProfile
      );
      setProfile(fallbackProfile);
    }
  };

  // Listen for profile update events from other components
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      log("[AuthContext] Received profileUpdated event:", event.detail);
      if (event.detail?.updatedProfile) {
        log("[AuthContext] Updating profile state from event");
        setProfile(event.detail.updatedProfile);
      }
    };

    window.addEventListener(
      "profileUpdated",
      handleProfileUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "profileUpdated",
        handleProfileUpdate as EventListener
      );
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn(
          "[AuthContext] Auth initialization timeout, forcing loading to false"
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

            // Load profile in background - non-blocking
            if (authUser) {
              loadProfile(
                authUser.id,
                session.user.user_metadata?.full_name
              ).catch((err) => {
                console.warn(
                  "[AuthContext] Background profile load failed:",
                  err
                );
              });
            }
          } else {
            log("[AuthContext] No initial session found");
            setLoading(false);
          }

          // Clear timeout since we completed successfully
          if (timeoutId) clearTimeout(timeoutId);
        }
      } catch (err) {
        console.error("[AuthContext] Error initializing auth:", err);
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

      log("[AuthContext] Auth state changed:", {
        event,
        userEmail: session?.user?.email,
        hasSession: !!session,
        hasUser: !!session?.user,
        isMobile:
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          ),
      });

      if (session?.user) {
        const authUser = convertUser(session.user);
        log("[AuthContext] Setting user from session:", authUser);
        setUser(authUser);
        setSession(session);

        // Load profile in background for faster auth state resolution
        if (authUser) {
          loadProfile(authUser.id, session.user.user_metadata?.full_name).catch(
            (err) => {
              console.warn(
                "[AuthContext] Background profile load failed:",
                err
              );
            }
          );
        }
      } else {
        log("[AuthContext] Clearing user session");
        setUser(null);
        setSession(null);
        setProfile(null);

        // Handle logout events - redirect to login if user was previously authenticated
        if (event === "SIGNED_OUT") {
          log("[AuthContext] User signed out, redirecting to login");
          // Small delay to ensure state is cleared
          setTimeout(() => {
            navigate("/onboarding", { replace: true });
          }, 100);
        }
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
      setLoading(true);
      const { data, error } = await authService.signUp(
        email,
        password,
        fullName
      );

      if (error) {
        return { error };
      }

      // If user is created but needs email confirmation
      if (data?.user && !data.session) {
        // Set user data for email verification banner
        const authUser = convertUser(data.user);
        setUser(authUser);

        // Create profile even for unconfirmed users so the full name is stored
        if (authUser) {
          await loadProfile(authUser.id, fullName);
        }

        return { error: null, needsConfirmation: true };
      }

      // User will be automatically set via onAuthStateChange if session exists
      return { error: null };
    } catch (err) {
      console.error("SignUp error:", err);
      return {
        error: { message: "An unexpected error occurred during signup" },
      };
    } finally {
      setLoading(false);
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
        return { error };
      }

      // Success - user will be set via onAuthStateChange
      log("[AuthContext] SignIn successful");
      return { error: null };
    } catch (err) {
      console.error("[AuthContext] SignIn exception:", err);
      return {
        error: { message: "An unexpected error occurred during signin" },
      };
    }
  };

  const signOut = async () => {
    try {
      log("[AuthContext] Starting signOut process");

      // Clear local state first to ensure immediate UI update
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);

      // Call the auth service to sign out from Supabase
      const { error } = await authService.signOut();

      if (error) {
        console.warn(
          "[AuthContext] SignOut API error (but continuing):",
          error
        );
      }

      // Force redirect to login page after logout
      log("[AuthContext] Redirecting to login after signOut");

      // Use window.location for more reliable redirect
      window.location.href = "/onboarding";

      return { error };
    } catch (err) {
      console.error("[AuthContext] SignOut error:", err);

      // Still clear local state even if there's an error
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);

      // Force redirect to login page even on error
      log("[AuthContext] Redirecting to login after signOut error");
      window.location.href = "/onboarding";

      return {
        error: { message: "An unexpected error occurred during signout" },
      };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const { data, error } = await authService.forgotPassword(email);
      return { error };
    } catch (err) {
      console.error("ForgotPassword error:", err);
      return { error: { message: "An unexpected error occurred" } };
    }
  };

  const resetPassword = async (password: string) => {
    try {
      const { data, error } = await authService.resetPassword(password);
      return { error };
    } catch (err) {
      console.error("ResetPassword error:", err);
      return { error: { message: "An unexpected error occurred" } };
    }
  };

  const confirmEmail = async (token: string) => {
    try {
      const { data, error } = await authService.confirmEmail(token);

      if (!error && data?.user) {
        const authUser = convertUser(data.user);
        setUser(authUser);
        if (authUser) {
          await loadProfile(authUser.id, data.user.user_metadata?.full_name);
        }
      }

      return { error };
    } catch (err) {
      console.error("ConfirmEmail error:", err);
      return { error: { message: "An unexpected error occurred" } };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { data, error } = await authService.resendConfirmation(email);
      return { error };
    } catch (err) {
      console.error("ResendConfirmation error:", err);
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
          ? `${updates.gear_items.length} gear items`
          : "not updating",
        timestamp: new Date().toISOString(),
      });

      // Validate gear_items structure if present
      if (updates.gear_items) {
        log("[AuthContext] 🔍 Validating gear_items structure:", {
          isArray: Array.isArray(updates.gear_items),
          count: updates.gear_items.length,
          sampleItem: updates.gear_items[0]
            ? {
                id: updates.gear_items[0].id,
                name: updates.gear_items[0].name,
                category: updates.gear_items[0].category,
                hasImageUrl: !!updates.gear_items[0].imageUrl,
              }
            : null,
        });

        // Ensure all gear items have required fields and clean up data
        const validGearItems = updates.gear_items
          .filter(
            (item) =>
              item &&
              typeof item === "object" &&
              item.id &&
              item.name &&
              item.category &&
              item.imageUrl
          )
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

        if (validGearItems.length !== updates.gear_items.length) {
          console.warn(
            "[AuthContext] ⚠️ Some gear items were invalid and filtered out:",
            {
              original: updates.gear_items.length,
              valid: validGearItems.length,
              filtered: updates.gear_items.length - validGearItems.length,
            }
          );
        }

        updates.gear_items = validGearItems;
      }

      // Check if gear_items column exists before attempting update
      if (updates.gear_items && !profile?.hasOwnProperty("gear_items")) {
        console.warn(
          "[AuthContext] ⚠️ gear_items column may not exist in database schema"
        );
        // Try to save without gear_items to avoid schema errors
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

      // Add timeout wrapper for database operations with better error tracking
      const startTime = Date.now();
      log("[AuthContext] 🚀 Starting database update operation:", {
        userId: user.id,
        updateKeys: Object.keys(updates),
        gearItemsCount: updates.gear_items?.length || 0,
        timestamp: new Date().toISOString(),
      });

      const updatePromise = profileService.updateProfile(user.id, updates);
      const timeoutPromise = new Promise<{ data: any; error: any }>(
        (_, reject) => {
          setTimeout(() => {
            const elapsedTime = Date.now() - startTime;
            console.error("[AuthContext] ⏰ Database timeout after:", {
              elapsedTime: `${elapsedTime}ms`,
              userId: user.id,
              updateKeys: Object.keys(updates),
              gearItemsCount: updates.gear_items?.length || 0,
            });
            reject(
              new Error(
                `Database timeout after ${elapsedTime}ms - operation took too long. This suggests a database connection or performance issue.`
              )
            );
          }, 20000); // Increased to 20 seconds to better differentiate from network timeouts
        }
      );

      const { data, error } = await Promise.race([
        updatePromise,
        timeoutPromise,
      ]);

      const totalTime = Date.now() - startTime;
      log("[AuthContext] ⏱️ Database operation completed:", {
        totalTime: `${totalTime}ms`,
        success: !!data && !error,
        userId: user.id,
      });

      log("[AuthContext] 📋 updateProfile result:", {
        success: !!data && !error,
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        errorHint: error?.hint,
        galleryPhotosCount: data?.gallery_photos?.length || 0,
        gearItemsCount: data?.gear_items?.length || 0,
        dataKeys: data ? Object.keys(data) : [],
        userId: user.id,
      });

      if (data && !error) {
        log("[AuthContext] ✅ Updating profile state with new data");
        setProfile(data);

        // Additional verification for gear_items
        if (updates.gear_items) {
          const expectedCount = updates.gear_items.length;
          const actualCount = data.gear_items?.length || 0;
          log("[AuthContext] 🔍 Gear items verification:", {
            expected: expectedCount,
            actual: actualCount,
            match: expectedCount === actualCount,
            gearWithAI:
              data.gear_items?.filter(
                (item: any) => item.gearType && item.gearType !== "unknown"
              ).length || 0,
          });
        }

        // Additional verification for gallery_photos
        if (updates.gallery_photos) {
          const expectedCount = updates.gallery_photos.length;
          const actualCount = data.gallery_photos?.length || 0;
          log("[AuthContext] 🔍 Gallery photos verification:", {
            expected: expectedCount,
            actual: actualCount,
            match: expectedCount === actualCount,
            photosWithFishInfo:
              data.gallery_photos?.filter((photo: any) => {
                // All photos should now be ImageMetadata objects
                return (
                  photo && photo.fishInfo && photo.fishInfo.name !== "Unknown"
                );
              }).length || 0,
            samplePhotoStructure: data.gallery_photos?.[0]
              ? {
                  hasUrl: !!data.gallery_photos[0].url,
                  hasFishInfo: !!data.gallery_photos[0].fishInfo,
                  fishName: data.gallery_photos[0].fishInfo?.name,
                  hasLocation: !!data.gallery_photos[0].location,
                  timestamp: data.gallery_photos[0].timestamp,
                }
              : null,
          });
        }

        return { error: null };
      } else if (error) {
        console.error("[AuthContext] ❌ Profile update failed:", {
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          userId: user.id,
          updateKeys: Object.keys(updates),
          isGearUpdate: !!updates.gear_items,
          gearCount: updates.gear_items?.length || 0,
          totalTime: `${Date.now() - startTime}ms`,
        });

        // Provide more specific error messages with database context
        let userFriendlyError = error.message;
        let errorCategory = "UNKNOWN";

        if (error.code === "PGRST204") {
          userFriendlyError =
            "Database schema needs to be updated. Please run: npm run types:supabase";
          errorCategory = "SCHEMA_ERROR";
        } else if (error.code === "23505") {
          userFriendlyError = "Duplicate entry detected. Please try again.";
          errorCategory = "CONSTRAINT_ERROR";
        } else if (error.code === "42703") {
          userFriendlyError =
            "Database column missing. Please contact support.";
          errorCategory = "SCHEMA_ERROR";
        } else if (error.code === "PGRST116") {
          userFriendlyError =
            "Database query failed. The table or column may not exist.";
          errorCategory = "SCHEMA_ERROR";
        } else if (error.code === "PGRST301") {
          userFriendlyError = "Database connection error. Please try again.";
          errorCategory = "CONNECTION_ERROR";
        } else if (error.message?.includes("gear_items")) {
          userFriendlyError =
            "Database schema error with gear_items. Please regenerate types or contact support.";
          errorCategory = "SCHEMA_ERROR";
        } else if (
          error.message?.includes("timeout") ||
          error.message?.includes("took too long")
        ) {
          userFriendlyError =
            "Database operation timed out. This may indicate a database performance issue. Please try again.";
          errorCategory = "TIMEOUT_ERROR";
        } else if (
          error.message?.includes("connection") ||
          error.message?.includes("network")
        ) {
          userFriendlyError =
            "Database connection failed. Please check your internet connection and try again.";
          errorCategory = "CONNECTION_ERROR";
        } else if (
          error.message?.includes("payload") ||
          error.message?.includes("too large")
        ) {
          userFriendlyError =
            "Data payload too large for database. Try reducing the amount of data being saved.";
          errorCategory = "PAYLOAD_ERROR";
        }

        console.error("[AuthContext] 🏷️ Error categorized as:", {
          category: errorCategory,
          originalError: error.message,
          userFriendlyError,
          code: error.code,
        });

        return {
          error: {
            ...error,
            message: userFriendlyError,
            category: errorCategory,
          },
        };
      }

      console.error("[AuthContext] ❓ Unknown profile update state:", {
        hasData: !!data,
        hasError: !!error,
        userId: user.id,
      });
      return {
        error: { message: "Unknown error occurred during profile update" },
      };
    } catch (err) {
      console.error("[AuthContext] 💥 UpdateProfile exception:", {
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
        console.error(
          "[AuthContext] Blob storage not configured:",
          errorMessage
        );
        return { error: { message: errorMessage } };
      }

      // Upload to Vercel Blob
      log("[AuthContext] Starting blob upload...");
      const avatarUrl = await uploadAvatarToBlob(file, user.id);
      log("[AuthContext] File uploaded successfully:", avatarUrl);

      // Update profile with the new avatar URL
      log("[AuthContext] Updating profile with new avatar URL...");
      const { data, error } = await profileService.updateProfile(user.id, {
        avatar_url: avatarUrl,
      });

      log("[AuthContext] Profile update result:", {
        hasData: !!data,
        error: error?.message || error,
      });

      if (error) {
        console.error("[AuthContext] Profile update failed:", error);
        return { error };
      }

      if (data) {
        log("[AuthContext] Avatar upload successful, updating profile state");
        setProfile(data);
        return { error: null };
      }

      return { error: { message: "No data returned from profile update" } };
    } catch (err) {
      console.error("[AuthContext] Avatar upload error:", err);

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
    if (user) {
      await loadProfile(user.id);
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
        console.warn("[AuthContext] Profile deletion warning:", profileError);
        // Continue with auth deletion even if profile deletion fails
      }

      // Delete the user's auth account
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.id
      );

      if (authError) {
        console.error("[AuthContext] Auth deletion failed:", authError);
        return { error: authError };
      }

      // Clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);

      log("[AuthContext] Account deleted successfully");

      // Redirect to login page
      window.location.href = "/onboarding";

      return { error: null };
    } catch (err) {
      console.error("[AuthContext] Account deletion error:", err);
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
    profile,
    session,
    loading,
    signUp,
    signIn,
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
