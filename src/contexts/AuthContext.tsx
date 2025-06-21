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
  gallery_photos?: (string | ImageMetadata)[];
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
    fullName: string,
  ) => Promise<{ error: any; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  confirmEmail: (token: string) => Promise<{ error: any }>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  uploadAvatar: (file: File) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      console.log(
        "[AuthContext] Loading profile for user:",
        userId,
        "with full name:",
        userFullName,
      );

      const { data, error } = await profileService.getProfile(userId);

      console.log("[AuthContext] Profile fetch result:", {
        hasData: !!data,
        error: error?.message || error,
        userId,
        galleryPhotosCount: data?.gallery_photos?.length || 0,
      });

      if (data && !error) {
        console.log("[AuthContext] Profile loaded successfully:", {
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
        console.log(
          "[AuthContext] Creating new profile for user:",
          userId,
          "with full name:",
          userFullName,
        );
        const profileData = {
          full_name:
            userFullName && userFullName.trim() ? userFullName.trim() : null,
          preferred_units: "metric",
          preferred_language: "en",
          favorite_fish_species: [],
        };
        console.log("[AuthContext] Profile data to create:", profileData);
        const { data: newProfile, error: createError } =
          await profileService.createProfile(userId, profileData);
        if (newProfile && !createError) {
          setProfile(newProfile);
          console.log(
            "[AuthContext] Profile created successfully:",
            newProfile,
          );
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
          console.log(
            "[AuthContext] Setting fallback profile:",
            fallbackProfile,
          );
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
        console.log(
          "[AuthContext] Setting fallback profile due to error:",
          fallbackProfile,
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
      console.log(
        "[AuthContext] Setting fallback profile due to exception:",
        fallbackProfile,
      );
      setProfile(fallbackProfile);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn(
          "[AuthContext] Auth initialization timeout, forcing loading to false",
        );
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log("[AuthContext] Initializing auth...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        console.log("[AuthContext] Initial session result:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          error: error?.message,
        });

        if (mounted) {
          if (session?.user && !error) {
            const authUser = convertUser(session.user);
            console.log("[AuthContext] Setting initial user:", authUser);
            setUser(authUser);
            setSession(session);
            if (authUser) {
              await loadProfile(
                authUser.id,
                session.user.user_metadata?.full_name,
              );
            }
          } else {
            console.log("[AuthContext] No initial session found");
          }

          // Clear timeout since we completed successfully
          if (timeoutId) clearTimeout(timeoutId);
          setLoading(false);
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

      console.log("[AuthContext] Auth state changed:", {
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
        console.log("[AuthContext] Setting user from session:", authUser);
        setUser(authUser);
        setSession(session);
        if (authUser) {
          // Pass the full name from user metadata to profile creation
          await loadProfile(authUser.id, session.user.user_metadata?.full_name);
        }
      } else {
        console.log("[AuthContext] Clearing user session");
        setUser(null);
        setSession(null);
        setProfile(null);

        // Handle logout events - redirect to login if user was previously authenticated
        if (event === "SIGNED_OUT") {
          console.log("[AuthContext] User signed out, redirecting to login");
          // Small delay to ensure state is cleared
          setTimeout(() => {
            navigate("/login", { replace: true });
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
        fullName,
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
    try {
      setLoading(true);
      console.log("[AuthContext] Starting signIn process for:", email);

      const { data, error } = await authService.signIn(email, password);

      console.log("[AuthContext] SignIn result:", {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error?.message,
        userEmailConfirmed: data?.user?.email_confirmed_at,
        isMobile:
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          ),
      });

      if (error) {
        console.log("[AuthContext] SignIn error:", error);
        // Return the error to be handled by the login page
        return { error };
      }

      // Normal successful login - user will be set via onAuthStateChange
      console.log(
        "[AuthContext] SignIn successful, waiting for onAuthStateChange",
      );
      return { error: null };
    } catch (err) {
      console.error("[AuthContext] SignIn error:", err);
      return {
        error: { message: "An unexpected error occurred during signin" },
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("[AuthContext] Starting signOut process");

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
          error,
        );
      }

      // Force redirect to login page after logout
      console.log("[AuthContext] Redirecting to login after signOut");

      // Use window.location for more reliable redirect
      window.location.href = "/login";

      return { error };
    } catch (err) {
      console.error("[AuthContext] SignOut error:", err);

      // Still clear local state even if there's an error
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);

      // Force redirect to login page even on error
      console.log("[AuthContext] Redirecting to login after signOut error");
      window.location.href = "/login";

      return {
        error: { message: "An unexpected error occurred during signout" },
      };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await authService.resetPassword(email);
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
      console.log("[AuthContext] updateProfile called with:", {
        ...updates,
        gallery_photos: updates.gallery_photos
          ? `${updates.gallery_photos.length} photos`
          : "not updating",
      });

      const { data, error } = await profileService.updateProfile(
        user.id,
        updates,
      );

      console.log("[AuthContext] updateProfile result:", {
        success: !!data && !error,
        error: error?.message,
        galleryPhotosCount: data?.gallery_photos?.length || 0,
      });

      if (data && !error) {
        console.log("[AuthContext] Updating profile state with new data");
        setProfile(data);

        // Additional verification for gallery_photos
        if (updates.gallery_photos) {
          const expectedCount = updates.gallery_photos.length;
          const actualCount = data.gallery_photos?.length || 0;
          console.log("[AuthContext] Gallery photos verification:", {
            expected: expectedCount,
            actual: actualCount,
            match: expectedCount === actualCount,
          });
        }

        return { error: null };
      } else if (error) {
        console.error("[AuthContext] Profile update failed:", error);
        return { error };
      }

      return { error: { message: "Unknown error occurred" } };
    } catch (err) {
      console.error("[AuthContext] UpdateProfile error:", err);
      return { error: { message: "An unexpected error occurred" } };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) {
      return { error: { message: "No user logged in" } };
    }

    try {
      console.log("[AuthContext] Starting avatar upload for user:", user.id);
      console.log("[AuthContext] File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Check blob storage configuration first
      const storageStatus = getBlobStorageStatus();
      console.log("[AuthContext] Blob storage status:", storageStatus);

      if (!storageStatus.configured) {
        const errorMessage =
          storageStatus.error || "Blob storage is not properly configured";
        console.error(
          "[AuthContext] Blob storage not configured:",
          errorMessage,
        );
        return { error: { message: errorMessage } };
      }

      // Upload to Vercel Blob
      console.log("[AuthContext] Starting blob upload...");
      const avatarUrl = await uploadAvatarToBlob(file, user.id);
      console.log("[AuthContext] File uploaded successfully:", avatarUrl);

      // Update profile with the new avatar URL
      console.log("[AuthContext] Updating profile with new avatar URL...");
      const { data, error } = await profileService.updateProfile(user.id, {
        avatar_url: avatarUrl,
      });

      console.log("[AuthContext] Profile update result:", {
        hasData: !!data,
        error: error?.message || error,
      });

      if (error) {
        console.error("[AuthContext] Profile update failed:", error);
        return { error };
      }

      if (data) {
        console.log(
          "[AuthContext] Avatar upload successful, updating profile state",
        );
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

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    confirmEmail,
    resendConfirmation,
    updateProfile,
    uploadAvatar,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
