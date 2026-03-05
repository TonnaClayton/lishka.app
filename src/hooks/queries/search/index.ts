import { useState, useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiStreamed } from "../api";

// --- Streaming types ---

export interface SearchStreamResult {
  content: string;
  session_id: string;
  fish_results?: any[];
  fish_title?: string;
  fish_subtitle?: string;
  gear_results?: any[];
  gear_title?: string;
  gear_subtitle?: string;
  photo_gallery_results?: any[];
  photo_gallery_title?: string;
  photo_gallery_subtitle?: string;
}

export interface SearchStreamCallbacks {
  onChunk: (chunk: string) => void;
  onResult: (result: SearchStreamResult) => void;
  onError: (error: string) => void;
  onSessionCreated?: (sessionId: string) => void;
}

export const searchQueryKeys = {
  sessions: () => ["search", "sessions"] as const,
  search: (id: string) => ["search", id] as const,
  sessionFollowQuestions: (id?: string | null) =>
    ["search", id, "follow-questions"] as const,
};

export const useGetSearchSessions = () =>
  useQuery({
    queryKey: searchQueryKeys.sessions(),
    queryFn: async () => {
      const data = await api<{
        data: {
          created_at: string;
          id: string;
          title: string;
          updated_at: string | null;
          user_id: string;
        }[];
      }>("search-agent/sessions", {
        method: "GET",
      });

      return data.data;
    },
    // enabled: !!id, // Only run when saved location is loaded
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

export const useGetSearchSession = (id: string) =>
  useQuery({
    queryKey: searchQueryKeys.search(id),
    queryFn: async () => {
      if (!id || id == undefined || id == null) {
        return null;
      }

      const data = await api<{
        data: {
          created_at: string;
          id: string;
          title: string;
          updated_at: string | null;
          user_id: string;
          messages: {
            content: string | null;
            created_at: string;
            id: string;
            image: string | null;
            metadata: any;
            session_id: string;
            updated_at: string | null;
            user_role: "user" | "assistant";
          }[];
        };
      }>("search-agent/sessions/" + id, {
        method: "GET",
      });

      return data.data;
    },
    enabled: !!id, // Only run when saved location is loaded
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

export const useGetSearchSessionFollowQuestions = (id?: string | null) =>
  useQuery({
    queryKey: searchQueryKeys.sessionFollowQuestions(id),
    queryFn: async () => {
      if (!id || id == undefined || id == null) {
        throw new Error("No ID provided");
      }

      const data = await api<{
        data: string[];
      }>("search-agent/sessions/" + id + "/follow-up-questions", {
        method: "GET",
      });

      return data.data;
    },
    enabled: !!id, // Only run when saved location is loaded
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

export const useCreateSearchSession = () =>
  useMutation({
    mutationFn: async (payload: {
      use_location_context?: boolean;
      use_imperial_units?: boolean;
      message: string;
      attachments?: File[];
      session_id?: string;
    }) => {
      const FILE_SIZE_LIMIT = 3 * 1024 * 1024; // 3MB in bytes
      const formData = new FormData();
      formData.append(
        "use_location_context",
        payload.use_location_context?.toString() || "false",
      );
      formData.append(
        "use_imperial_units",
        payload.use_imperial_units?.toString() || "false",
      );
      formData.append("message", payload.message);

      if (payload.attachments) {
        for (const file of payload.attachments) {
          if (file.size > FILE_SIZE_LIMIT || payload.attachments.length > 1) {
            try {
              // Upload large file to Supabase and get URL
              // NOTE: This is to avoid the vercel request size limit
              const { uploadImageToSupabase } = await import(
                "@/lib/supabase-storage"
              );
              const fileUrl = await uploadImageToSupabase(file, "temp-uploads");

              // Append the URL instead of the file
              formData.append("attachmentsUrls", fileUrl);
            } catch (error) {
              console.error(
                "[UPLOAD] Failed to upload large file to Supabase:",
                error,
              );
              throw new Error(
                `Failed to upload ${file.name}. Please try again.`,
              );
            }
          } else {
            // Attach small file directly
            formData.append("attachments", file);
          }
        }
      }

      let path = "search-agent/sessions";
      if (payload.session_id) {
        path = "search-agent/sessions/" + payload.session_id;
      }

      const data = await api<{
        data: {
          content: string | null;
          created_at: string;
          id: string;
          image: string | null;
          metadata: any;
          session_id: string;
          updated_at: string | null;
          user_role: "user" | "assistant";
        };
      }>(
        path,
        {
          method: "POST",
          body: formData,
        },
        true,
      );

      return data.data;
    },
    onSuccess: () => {
      // // Update the current location cache
      // queryClient.setQueryData(
      //     locationQueryKeys.userLocation(),
      //     updatedLocation,
      // );
      // setCurrentLocation(updatedLocation);
    },
  });

export const useDeleteSearchSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await api<{
        data: {
          success: boolean;
          message: string;
        };
      }>(
        `search-agent/sessions/${id}`,
        {
          method: "DELETE",
        },
        true,
      );

      return data.data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({
        queryKey: searchQueryKeys.sessions(),
      });
      queryClient.invalidateQueries({
        queryKey: searchQueryKeys.search(id),
      });
    },
  });
};

// --- Streaming hook ---

function parseSearchStreamChunk(
  chunk: string,
  bufferRef: { current: string },
  callbacks: SearchStreamCallbacks,
) {
  if (!chunk) return;

  bufferRef.current += chunk;
  const lines = bufferRef.current.split("\n");

  // Keep the last line in buffer if it's incomplete (no trailing newline)
  if (!bufferRef.current.endsWith("\n")) {
    bufferRef.current = lines.pop() ?? "";
  } else {
    bufferRef.current = "";
  }

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const event = JSON.parse(line.trim());

      switch (event.type) {
        case "search_agent_chunk":
          callbacks.onChunk(event.chunk);
          break;
        case "search_agent_result":
          callbacks.onResult({
            content: event.content,
            session_id: event.session_id,
            fish_results: event.fish_results,
            fish_title: event.fish_title,
            fish_subtitle: event.fish_subtitle,
            gear_results: event.gear_results,
            gear_title: event.gear_title,
            gear_subtitle: event.gear_subtitle,
            photo_gallery_results: event.photo_gallery_results,
            photo_gallery_title: event.photo_gallery_title,
            photo_gallery_subtitle: event.photo_gallery_subtitle,
          });
          break;
        case "search_agent_session_created":
          callbacks.onSessionCreated?.(event.session_id);
          break;
        case "search_agent_error":
          callbacks.onError(event.error || "An error occurred");
          break;
      }
    } catch {
      // Incomplete JSON line — will be completed in next chunk
    }
  }
}

export function useSearchAgentStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamBufferRef = useRef<string>("");

  const sendMessage = useCallback(
    async (
      payload: {
        message: string;
        sessionId?: string;
        attachments?: File[];
        useLocationContext?: boolean;
        useImperialUnits?: boolean;
      },
      callbacks: SearchStreamCallbacks,
    ) => {
      if (isStreaming) return;

      streamBufferRef.current = "";
      setIsStreaming(true);

      try {
        const FILE_SIZE_LIMIT = 3 * 1024 * 1024; // 3MB
        const formData = new FormData();
        formData.append(
          "use_location_context",
          payload.useLocationContext?.toString() || "false",
        );
        formData.append(
          "use_imperial_units",
          payload.useImperialUnits?.toString() || "false",
        );
        formData.append("message", payload.message);

        if (payload.attachments) {
          for (const file of payload.attachments) {
            if (file.size > FILE_SIZE_LIMIT || payload.attachments.length > 1) {
              try {
                const { uploadImageToSupabase } = await import(
                  "@/lib/supabase-storage"
                );
                const fileUrl = await uploadImageToSupabase(
                  file,
                  "temp-uploads",
                );
                formData.append("attachmentsUrls", fileUrl);
              } catch (error) {
                console.error(
                  "[UPLOAD] Failed to upload large file to Supabase:",
                  error,
                );
                throw new Error(
                  `Failed to upload ${file.name}. Please try again.`,
                );
              }
            } else {
              formData.append("attachments", file);
            }
          }
        }

        // Use streaming endpoint: new session or existing session
        const path = payload.sessionId
          ? `search-agent/sessions/${payload.sessionId}/stream`
          : "search-agent/sessions/stream";

        abortControllerRef.current = new AbortController();

        const stream = await apiStreamed(
          path,
          {
            method: "POST",
            body: formData,
            signal: abortControllerRef.current.signal,
          },
          true,
        );

        if (!stream) {
          throw new Error("Failed to create stream");
        }

        const reader = stream.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          parseSearchStreamChunk(chunk, streamBufferRef, callbacks);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          callbacks.onError(err.message);
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [isStreaming],
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  return { sendMessage, isStreaming, abort };
}
