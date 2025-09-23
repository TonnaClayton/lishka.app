import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { useStream } from "@/hooks/use-stream";
import { useClassifyPhoto } from "@/hooks/queries";
import { log, error as errorLog } from "@/lib/logging";

// Constants for timeout values and configuration
const UPLOAD_TIMEOUTS = {
  CLEANUP: 3000,
  MESSAGE_DELAY: 4000,
  AUTO_HIDE: 5000,
  RETRY_DELAY: 2000,
} as const;

const MAX_RETRY_ATTEMPTS = 3;
const UPLOAD_QUEUE_SIZE = 5;

type UploadType = "fish" | "gear" | "universal";

export enum UploadStepStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export type UploadPhotoStreamData = {
  data: {
    message: string;
    type?: string;
    confidence?: number;
    classifying?: UploadStepStatus;
    analyzing: UploadStepStatus;
    uploading: UploadStepStatus;
    saved: UploadStepStatus;
    errors: string[];
    processedFiles: number;
    totalFiles: number;
    uploadStatus?: UploadStepStatus;
    classificationResult?: {
      type: "fish" | "gear";
      confidence: number;
      reasoning?: string;
    };
  };
};

// Type guard for validating UploadPhotoStreamData
function isValidUploadPhotoStreamData(
  data: any,
): data is UploadPhotoStreamData {
  return (
    data &&
    typeof data === "object" &&
    data.data &&
    typeof data.data === "object" &&
    typeof data.data.message === "string" &&
    Object.values(UploadStepStatus).includes(data.data.analyzing) &&
    Object.values(UploadStepStatus).includes(data.data.uploading) &&
    Object.values(UploadStepStatus).includes(data.data.saved)
  );
}

// Upload queue item type
type UploadQueueItem = {
  id: string;
  files: File[];
  type: UploadType;
  retryCount: number;
  timestamp: number;
};

// Error state type
type UploadError = {
  message: string;
  type: "classification" | "upload" | "network" | "timeout";
  timestamp: number;
  retryable: boolean;
};

interface UploadContextType {
  // Total gear items uploading
  totalGearItemsUploading?: number;

  // Photo upload state
  uploadPhotoStreamData: UploadPhotoStreamData | null;

  // Gear item upload state
  uploadGearItemStreamData: UploadPhotoStreamData | null;
  identifyGearMessage: string | null;

  // Success message state
  showUploadedInfoMsg: boolean;
  uploadedInfoMsg: string | null;

  // Upload status
  classifyingImage: boolean;
  isUploading: boolean;

  // Error state
  uploadError: UploadError | null;
  clearError: () => void;

  // Queue state
  uploadQueue: UploadQueueItem[];
  queueSize: number;

  // Methods
  handlePhotoUpload: (
    file: File[],
    options?: {
      type: "photo" | "gear";
    },
  ) => Promise<void>;
  retryUpload: (itemId: string) => Promise<void>;
  cancelUpload: (itemId: string) => void;
  clearQueue: () => void;
  closeUploadedInfoMsg: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
};

interface UploadProviderProps {
  children: ReactNode;
}

export const UploadProvider: React.FC<UploadProviderProps> = ({ children }) => {
  const { refreshProfile } = useAuth();
  const classifyPhotoMutation = useClassifyPhoto();

  // Core upload state
  const [uploadPhotoStreamData, setUploadPhotoStreamData] =
    useState<UploadPhotoStreamData | null>(null);
  const [uploadGearItemStreamData, setUploadGearItemStreamData] =
    useState<UploadPhotoStreamData | null>(null);
  const [identifyGearMessage, setIdentifyGearMessage] = useState<string | null>(
    null,
  );
  const [showUploadedInfoMsg, setShowUploadedInfoMsg] = useState(false);
  const [uploadedInfoMsg, setUploadedInfoMsg] = useState<string | null>(null);
  const [classifyingImage, setClassifyingImage] = useState(false);
  const [totalGearItemsUploading, setTotalGearItemsUploading] = useState<
    number | undefined
  >(undefined);
  const [totalPhotosUploading, setTotalPhotosUploading] = useState<
    number | undefined
  >(undefined);

  // Error and queue state
  const [uploadError, setUploadError] = useState<UploadError | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploadLocked, setIsUploadLocked] = useState(false);

  // Timeout refs with proper cleanup tracking
  const timeoutRefs = useRef<{
    cleanup: NodeJS.Timeout | null;
    message: NodeJS.Timeout | null;
    autoHide: NodeJS.Timeout | null;
    retry: NodeJS.Timeout | null;
  }>({
    cleanup: null,
    message: null,
    autoHide: null,
    retry: null,
  });

  // Helper function to create FormData
  const createFormData = useCallback((files: File[]): FormData => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("file", file);
    });
    return formData;
  }, []);

  // Comprehensive timeout cleanup
  const clearAllTimeouts = useCallback(() => {
    Object.entries(timeoutRefs.current).forEach(([key, timeoutId]) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutRefs.current[key as keyof typeof timeoutRefs.current] = null;
      }
    });
  }, []);

  // Error handling helpers
  const setError = useCallback(
    (message: string, type: UploadError["type"], retryable: boolean = true) => {
      setUploadError({
        message,
        type,
        timestamp: Date.now(),
        retryable,
      });
    },
    [],
  );

  const clearError = useCallback(() => {
    setUploadError(null);
  }, []);

  // Safe JSON parsing with validation
  const parseUploadData = useCallback(
    (chunk: string): UploadPhotoStreamData | null => {
      try {
        const data = JSON.parse(chunk);
        if (!isValidUploadPhotoStreamData(data)) {
          console.warn("[UPLOAD] Invalid upload data structure:", data);
          return null;
        }
        return data;
      } catch (error) {
        console.error("[UPLOAD] Failed to parse upload data:", error);
        setError("Invalid server response", "upload", false);
        return null;
      }
    },
    [setError],
  );

  const uploadPhotoStream = useStream({
    path: "user/gallery-photos/stream",
    onData: (chunk) => {
      console.log("[STREAM] Received chunk:", chunk);
      const data = parseUploadData(chunk);
      if (!data) return;

      // Improved gear message detection with safer string checking
      if (data.data.message?.includes?.("Gear uploaded! Identified:")) {
        setIdentifyGearMessage(data.data.message);
      }

      setUploadPhotoStreamData(data);
      clearError(); // Clear any previous errors on successful data
    },
    onError: (error) => {
      console.error("[STREAM] Error uploading photo:", error);
      setClassifyingImage(false);
      setIsUploadLocked(false);

      // Handle timeout errors specifically
      let errorMsg =
        error.message?.includes("timeout") ||
        error.message?.includes("timed out")
          ? "Upload timed out. Please check your connection and try again."
          : "Failed to upload photo";

      // check if error is content is too large
      if (error.message?.includes("content is too large")) {
        errorMsg =
          "File is too large. Please reduce the file size and try again.";
      }

      setError(errorMsg, "upload", true);
    },
    onComplete: () => {
      uploadPhotoCompleteCallBack();
    },
  });

  const uploadGearItemStream = useStream({
    path: "user/gear-items/stream",
    onData: (chunk) => {
      console.log("[STREAM] Received chunk:", chunk);
      const data = parseUploadData(chunk);

      if (!data) return;

      // Improved gear message detection with safer string checking
      if (data.data.message?.includes?.("Gear uploaded! Identified:")) {
        setIdentifyGearMessage(data.data.message);
      }
      setUploadGearItemStreamData(data);
      clearError(); // Clear any previous errors on successful data
    },
    onError: (error) => {
      console.error("[STREAM] Error uploading gear item:", error);
      setClassifyingImage(false);
      setIsUploadLocked(false);

      // Handle timeout errors specifically
      let errorMsg =
        error.message?.includes("timeout") ||
        error.message?.includes("timed out")
          ? "Upload timed out. Please check your connection and try again."
          : "Failed to upload gear item";

      // check if error is content is too large
      if (error.message?.includes("content is too large")) {
        errorMsg =
          "File is too large. Please reduce the file size and try again.";
      }

      setError(errorMsg, "upload", true);
    },
    onComplete: () => {
      uploadGearItemCompleteCallBack();
    },
  });

  const uploadPhotoCompleteCallBack = useCallback(() => {
    console.log("[STREAM] Photo uploaded successfully!");
    refreshProfile();
    setIsUploadLocked(false);
    clearError();

    // Clear any existing timeouts
    clearAllTimeouts();

    timeoutRefs.current.cleanup = setTimeout(() => {
      setUploadPhotoStreamData(null);
      timeoutRefs.current.cleanup = null;
    }, UPLOAD_TIMEOUTS.CLEANUP);

    timeoutRefs.current.message = setTimeout(() => {
      setShowUploadedInfoMsg(true);
      // Use a ref to access the current identifyGearMessage value
      setIdentifyGearMessage((currentGearMessage) => {
        setUploadedInfoMsg(
          currentGearMessage || "Fish Photo Uploaded and Saved to Gallery",
        );
        return currentGearMessage; // Don't clear it here, clear it later
      });
      timeoutRefs.current.message = null;

      // Auto-hide after configured time
      timeoutRefs.current.autoHide = setTimeout(() => {
        setShowUploadedInfoMsg(false);
        setUploadedInfoMsg(null);
        setIdentifyGearMessage(null);
        setTotalPhotosUploading(undefined);
        timeoutRefs.current.autoHide = null;
      }, UPLOAD_TIMEOUTS.AUTO_HIDE);
    }, UPLOAD_TIMEOUTS.MESSAGE_DELAY);
  }, [refreshProfile, clearError]);

  const uploadGearItemCompleteCallBack = useCallback(() => {
    console.log("[STREAM] Gear item uploaded successfully!");
    refreshProfile();
    setIsUploadLocked(false);
    clearError();

    // Clear any existing timeouts
    clearAllTimeouts();

    timeoutRefs.current.cleanup = setTimeout(() => {
      setUploadGearItemStreamData(null);
      timeoutRefs.current.cleanup = null;
    }, UPLOAD_TIMEOUTS.CLEANUP);

    timeoutRefs.current.message = setTimeout(() => {
      setShowUploadedInfoMsg(true);
      // Use a ref to access the current identifyGearMessage value
      setIdentifyGearMessage((currentGearMessage) => {
        setUploadedInfoMsg(
          currentGearMessage || "Gear item uploaded and saved to gallery",
        );
        return currentGearMessage; // Don't clear it here, clear it later
      });
      timeoutRefs.current.message = null;

      // Auto-hide after configured time
      timeoutRefs.current.autoHide = setTimeout(() => {
        setShowUploadedInfoMsg(false);
        setUploadedInfoMsg(null);
        setIdentifyGearMessage(null);
        setTotalGearItemsUploading(undefined);
        timeoutRefs.current.autoHide = null;
      }, UPLOAD_TIMEOUTS.AUTO_HIDE);
    }, UPLOAD_TIMEOUTS.MESSAGE_DELAY);
  }, [refreshProfile, clearError, clearAllTimeouts]);

  // Queue management functions
  const addToQueue = useCallback((files: File[], type: UploadType): string => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const queueItem: UploadQueueItem = {
      id,
      files,
      type,
      retryCount: 0,
      timestamp: Date.now(),
    };

    setUploadQueue((prev) => {
      if (prev.length >= UPLOAD_QUEUE_SIZE) {
        console.warn("[UPLOAD] Queue is full, removing oldest item");
        return [...prev.slice(1), queueItem];
      }
      return [...prev, queueItem];
    });

    return id;
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setUploadQueue([]);
  }, []);

  // Core upload logic with proper locking
  const executeUpload = useCallback(
    async (files: File[], type?: UploadType) => {
      setIsUploadLocked(true);
      clearError();

      try {
        const formData = createFormData(files);

        if (type === "gear") {
          uploadGearItemStream.startStream({
            path:
              files.length > 1
                ? "user/gear-items/batch-stream"
                : "user/gear-items/stream",
            options: {
              method: "POST",
              body: formData,
            },
            isFormData: true,
          });
        } else {
          uploadPhotoStream.startStream({
            path:
              type === "universal"
                ? "user/universal-upload/stream"
                : "user/gallery-photos/stream",
            options: {
              method: "POST",
              body: formData,
            },
            isFormData: true,
          });
        }
      } catch (error: any) {
        console.error("❌ [UPLOAD] Upload execution failed:", error);
        setIsUploadLocked(false);
        setError(error?.message || "Upload failed", "upload", true);
        throw error;
      }
    },
    [
      createFormData,
      uploadGearItemStream,
      uploadPhotoStream,
      clearError,
      setError,
    ],
  );

  // Retry mechanism
  const retryUpload = useCallback(
    async (itemId: string): Promise<void> => {
      const queueItem = uploadQueue.find((item) => item.id === itemId);
      if (!queueItem) {
        console.warn("[UPLOAD] Queue item not found for retry:", itemId);
        return;
      }

      if (queueItem.retryCount >= MAX_RETRY_ATTEMPTS) {
        setError("Maximum retry attempts exceeded", "upload", false);
        removeFromQueue(itemId);
        return;
      }

      // Update retry count
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, retryCount: item.retryCount + 1 }
            : item,
        ),
      );

      // Wait before retrying
      timeoutRefs.current.retry = setTimeout(async () => {
        try {
          await executeUpload(queueItem.files, queueItem.type);
          removeFromQueue(itemId);
        } catch (error) {
          console.error("[UPLOAD] Retry failed:", error);
          // The error is already handled in executeUpload
        }
        timeoutRefs.current.retry = null;
      }, UPLOAD_TIMEOUTS.RETRY_DELAY);
    },
    [uploadQueue, setError, removeFromQueue, executeUpload],
  );

  // Cancel upload
  const cancelUpload = useCallback(
    (itemId: string) => {
      removeFromQueue(itemId);
      // If this is the currently processing item, we should ideally cancel the stream
      // but the useStream hook may not support cancellation
      console.log("[UPLOAD] Upload cancelled:", itemId);
    },
    [removeFromQueue],
  );

  const handlePhotoUpload = useCallback(
    async (
      files: File[],
      options?: {
        type: "photo" | "gear";
      },
    ) => {
      // Prevent multiple uploads with proper locking
      if (isUploadLocked || classifyingImage) {
        console.warn(
          "[UPLOAD] Upload already in progress, ignoring new upload",
        );
        return;
      }

      log("[UPLOAD] Starting upload:", {
        files,
        options,
      });

      if (files.length == 1) {
        const gearQueueId = addToQueue(files, "universal");
        // eslint-disable-next-line no-useless-catch
        try {
          setTotalGearItemsUploading(files.length);
          await executeUpload(files, "universal");
          removeFromQueue(gearQueueId);
        } catch (uploadError) {
          throw uploadError;
        }
      } else {
        let filesTypes: UploadType[] = [];

        // if (!options) {
        setClassifyingImage(true);
        clearError();

        try {
          const classificationPromises = files.map(async (file) => {
            if (file.size > 15 * 1024 * 1024) {
              throw new Error(`Photo must be less than 15MB`);
            }

            if (!file.type.startsWith("image/")) {
              throw new Error("Please select an image file");
            }

            const classification =
              await classifyPhotoMutation.mutateAsync(file);
            return classification.type as UploadType;
          });

          const classifications = await Promise.allSettled(
            classificationPromises,
          );
          filesTypes = classifications.map((classification) =>
            classification.status === "fulfilled"
              ? (classification.value as UploadType)
              : "fish",
          );
        } catch {
          setClassifyingImage(false);
          setError("Failed to classify image", "classification", true);

          // throw new Error(
          //   classificationError?.message ||
          //     "Failed to classify image. Please try again."
          // );
        }

        setClassifyingImage(false);

        try {
          // Separate files by type
          const gearFiles = files.filter(
            (file, index) => filesTypes[index] == "gear",
          );
          const photoFiles = files.filter(
            (file, index) => filesTypes[index] == "fish",
          );

          // Process gear files if any
          if (gearFiles.length > 0) {
            const gearQueueId = addToQueue(gearFiles, "gear");
            // eslint-disable-next-line no-useless-catch
            try {
              setTotalGearItemsUploading(gearFiles.length);
              await executeUpload(gearFiles, "gear");
              removeFromQueue(gearQueueId);
            } catch (uploadError) {
              throw uploadError;
            }
          }

          // Process photo files if any
          if (photoFiles.length > 0) {
            const photoQueueId = addToQueue(photoFiles, "fish");
            // eslint-disable-next-line no-useless-catch
            try {
              setTotalPhotosUploading(photoFiles.length);
              await executeUpload(photoFiles, "fish");
              removeFromQueue(photoQueueId);
            } catch (uploadError) {
              throw uploadError;
            }
          }
        } catch (error: any) {
          errorLog("❌ [UPLOAD] Smart upload failed:", error);
          setClassifyingImage(false);
          setIsUploadLocked(false);

          if (!uploadError) {
            setError(
              error?.message || "Failed to process photo. Please try again.",
              "upload",
              true,
            );
          }

          throw error;
        }
      }
    },
    [
      isUploadLocked,
      classifyingImage,
      classifyPhotoMutation,
      clearError,
      setError,
      addToQueue,
      executeUpload,
      totalGearItemsUploading,
      setTotalGearItemsUploading,
      removeFromQueue,
      uploadError,
      totalPhotosUploading,
      setTotalPhotosUploading,
    ],
  );

  const closeUploadedInfoMsg = useCallback(() => {
    clearAllTimeouts();
    setShowUploadedInfoMsg(false);
    setUploadedInfoMsg(null);
  }, [clearAllTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return clearAllTimeouts;
  }, [clearAllTimeouts]);

  const isUploading = useMemo(() => {
    return (
      isUploadLocked ||
      uploadPhotoStream.isStreaming ||
      uploadGearItemStream.isStreaming
    );
  }, [
    isUploadLocked,
    uploadPhotoStream.isStreaming,
    uploadGearItemStream.isStreaming,
  ]);

  const queueSize = useMemo(() => uploadQueue.length, [uploadQueue.length]);

  const value = useMemo(
    () => ({
      uploadPhotoStreamData,
      uploadGearItemStreamData,
      identifyGearMessage,
      showUploadedInfoMsg,
      uploadedInfoMsg,
      classifyingImage,
      isUploading,
      uploadError,
      clearError,
      uploadQueue,
      queueSize,
      totalGearItemsUploading,
      handlePhotoUpload,
      retryUpload,
      cancelUpload,
      clearQueue,
      closeUploadedInfoMsg,
    }),
    [
      uploadPhotoStreamData,
      uploadGearItemStreamData,
      identifyGearMessage,
      showUploadedInfoMsg,
      uploadedInfoMsg,
      classifyingImage,
      isUploading,
      totalGearItemsUploading,
      uploadError,
      clearError,
      uploadQueue,
      queueSize,
      handlePhotoUpload,
      retryUpload,
      cancelUpload,
      clearQueue,
      closeUploadedInfoMsg,
      totalPhotosUploading,
      setTotalPhotosUploading,
    ],
  );

  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
};
