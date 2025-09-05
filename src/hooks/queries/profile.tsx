import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { uploadImageToSupabase } from "@/lib/supabase-storage";
import { ImageMetadata } from "@/lib/image-metadata";
import { uploadGearImage } from "@/lib/gear-upload-service";
import { log } from "@/lib/logging";
import { useUserLocation } from "./location";
import { api } from "./api";

export const profileQueryKeys = {
  useProfile: (userId: string) => ["profile", userId] as const,
  useUserPhotos: (userId: string) => ["userPhotos", userId] as const,
  useUserGear: (userId: string) => ["userGear", userId] as const,
};

// Profile data hook
export const useProfile = (userId: string) => {
  return useQuery({
    queryKey: profileQueryKeys.useProfile(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (
          error.message?.includes("No rows") ||
          error.message?.includes("PGRST116") ||
          error.code === "PGRST116"
        ) {
          throw new Error("Profile not found");
        }

        throw error;
      }

      console.log("[PROFILE]", data);

      return data;
    },
    enabled: !!userId,
  });
};

// Username validation hook
export const useUsernameValidation = () => {
  return useMutation({
    mutationFn: async (username: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .limit(1);

      if (error) {
        throw error;
      }

      return {
        isAvailable: data.length === 0,
        exists: data.length > 0,
      };
    },
  });
};

// Profile creation hook
export const useCreateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      profileData,
    }: {
      userId: string;
      profileData: any;
    }) => {
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          ...profileData,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      // Update cache with new profile
      queryClient.setQueryData(profileQueryKeys.useProfile(data.id), data);
    },
  });
};

// Profile update hook
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: any) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user?.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate profile queries
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: profileQueryKeys.useProfile(user.id),
        });
      }
    },
  });
};

// Avatar upload hook
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      // Upload to Supabase storage
      const avatarUrl = await uploadImageToSupabase(file, "avatars");

      // Update profile with new avatar URL
      const { data, error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user?.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate profile queries
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: profileQueryKeys.useProfile(user.id),
        });
      }
    },
  });
};

// Photo upload hook
export const useUploadPhoto = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      log("[useUploadPhoto] Starting photo upload:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      const formData = new FormData();
      formData.append("file", file);

      const data = await api<{
        data: any;
      }>(
        "user/gallery-photos",
        {
          method: "POST",
          body: formData,
        },
        true,
      );

      return data.data;
    },
    onSuccess: async (metadata) => {
      // Update user's photos in profile
      if (user?.id) {
        queryClient.setQueryData(
          profileQueryKeys.useProfile(user.id),
          (oldData: any) => {
            if (!oldData) return oldData;

            return metadata;
          },
        );

        // Invalidate the profile query to ensure fresh data
        queryClient.invalidateQueries({
          queryKey: profileQueryKeys.useProfile(user.id),
        });
      }
    },
  });
};

export const useClassifyPhoto = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      log("[useClassifyPhoto] Starting photo upload:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      const formData = new FormData();
      formData.append("file", file);

      const data = await api<{
        data: {
          type: string;
          confidence?: string | null;
          reasoning?: string | null;
        };
      }>(
        "image/classify",
        {
          method: "POST",
          body: formData,
        },
        true,
      );

      return data.data;
    },
  });
};

// Photo management hooks
export const useDeletePhoto = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (photoIndex: number) => {
      const data = await api<{
        data: any;
      }>(`user/gallery-photos/${photoIndex}`, {
        method: "DELETE",
        body: JSON.stringify({}),
      });

      return data.data;
    },
    onSuccess: ({ updatedData }) => {
      // Update cache
      if (user?.id) {
        queryClient.setQueryData(
          profileQueryKeys.useProfile(user.id),
          (oldData: any) => {
            if (!oldData) return oldData;
            return updatedData;
          },
        );
      }

      queryClient.invalidateQueries({
        queryKey: profileQueryKeys.useProfile(user.id),
      });
    },
  });
};

export const useDeleteGear = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (photoIndex: number) => {
      const data = await api<{
        data: any;
      }>(`user/gear-items/${photoIndex}`, {
        method: "DELETE",
        body: JSON.stringify({}),
      });

      return data.data;
    },
    onSuccess: ({ updatedData }) => {
      // Update cache
      if (user?.id) {
        queryClient.setQueryData(
          profileQueryKeys.useProfile(user.id),
          (oldData: any) => {
            if (!oldData) return oldData;
            return updatedData;
          },
        );
      }

      queryClient.invalidateQueries({
        queryKey: profileQueryKeys.useProfile(user.id),
      });
    },
  });
};

export const useUpdatePhotoMetadata = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      photoIndex,
      metadata,
    }: {
      photoIndex: number;
      metadata: ImageMetadata;
    }) => {
      // Get current photos from cache
      const currentProfile = queryClient.getQueryData(
        profileQueryKeys.useProfile(user?.id || ""),
      ) as any;

      if (!currentProfile?.gallery_photos) {
        throw new Error("No photos found");
      }

      // Update photo metadata
      const updatedPhotos = [...currentProfile.gallery_photos];
      updatedPhotos[photoIndex] = metadata;

      // Update profile in database
      const { error } = await supabase
        .from("profiles")
        .update({ gallery_photos: updatedPhotos })
        .eq("id", user?.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { updatedPhotos, updatedIndex: photoIndex };
    },
    onSuccess: ({ updatedPhotos }) => {
      // Update cache
      if (user?.id) {
        queryClient.setQueryData(
          profileQueryKeys.useProfile(user.id),
          (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              gallery_photos: updatedPhotos,
            };
          },
        );
      }
    },
  });
};

// Gear upload hook
export const useUploadGear = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { location: userLocation } = useUserLocation();
  return useMutation({
    mutationFn: async (file: File) => {
      log("[useUploadGear] Starting gear upload:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Upload and process gear image
      const result = await uploadGearImage(file, userLocation?.name);

      if (!result.success || !result.metadata) {
        throw new Error(result.error || "Failed to upload gear");
      }

      // Create gear item from metadata
      const gearItem = {
        id: `gear_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        name: result.metadata.gearInfo?.name || "Unknown Gear",
        category: mapGearTypeToCategory(
          result.metadata.gearInfo?.type || "other",
        ),
        description: result.metadata.gearInfo?.type || "",
        brand: result.metadata.gearInfo?.brand || "",
        model: result.metadata.gearInfo?.model || "",
        imageUrl: result.metadata.url,
        timestamp: result.metadata.timestamp,
        userConfirmed: false,
        gearType: result.metadata.gearInfo?.type || "unknown",
        aiConfidence: result.metadata.gearInfo?.confidence || 0,
        size: result.metadata.gearInfo?.size || "",
        weight: result.metadata.gearInfo?.weight || "",
        targetFish: result.metadata.gearInfo?.targetFish || "",
        fishingTechnique: result.metadata.gearInfo?.fishingTechnique || "",
        weatherConditions: result.metadata.gearInfo?.weatherConditions || "",
        waterConditions: result.metadata.gearInfo?.waterConditions || "",
        seasonalUsage: result.metadata.gearInfo?.seasonalUsage || "",
        colorPattern: result.metadata.gearInfo?.colorPattern || "",
        actionType: result.metadata.gearInfo?.actionType || "",
        depthRange: result.metadata.gearInfo?.depthRange || "",
        versatility: result.metadata.gearInfo?.versatility || "",
        compatibleGear: result.metadata.gearInfo?.compatibleGear || "",
        rawJsonResponse: result.metadata.gearInfo?.rawJsonResponse || "",
        openaiPrompt: result.metadata.gearInfo?.openaiPrompt || "",
      };

      return { gearItem, metadata: result.metadata };
    },
    onSuccess: ({ gearItem }) => {
      // Update user's gear in profile
      if (user?.id) {
        queryClient.setQueryData(
          profileQueryKeys.useProfile(user.id),
          (oldData: any) => {
            if (!oldData) return oldData;

            const currentGear = oldData.gear_items || [];
            const updatedGear = [gearItem, ...currentGear];

            return {
              ...oldData,
              gear_items: updatedGear,
            };
          },
        );
      }
    },
  });
};

// Helper function to map gear type to category
const mapGearTypeToCategory = (gearType: string): string => {
  const type = gearType.toLowerCase();
  if (type.includes("rod") || type.includes("reel") || type.includes("combo")) {
    return "rods-reels";
  } else if (
    type.includes("lure") ||
    type.includes("jig") ||
    type.includes("spoon")
  ) {
    return "lures-jigs";
  } else if (type.includes("bait") || type.includes("chum")) {
    return "bait-chum";
  } else if (
    type.includes("electronic") ||
    type.includes("finder") ||
    type.includes("gps")
  ) {
    return "electronics";
  } else if (
    type.includes("accessory") ||
    type.includes("hook") ||
    type.includes("sinker") ||
    type.includes("swivel")
  ) {
    return "accessories";
  } else {
    return "other";
  }
};
