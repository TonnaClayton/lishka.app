import { useCallback, useEffect, useRef, useState } from "react";
import { apiStreamed } from "./queries/api";

interface StartStreamOptions {
  options?: RequestInit;
  isFormData?: boolean;
  enabled?: boolean;
  onData?: (chunk: string) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

interface UseStreamOptions {
  path: string;
  options?: RequestInit;
  isFormData?: boolean;
  enabled?: boolean;
  onData?: (chunk: string) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

interface UseStreamReturn {
  data: string;
  isStreaming: boolean;
  error: Error | null;
  startStream: (payload: StartStreamOptions) => void;
  stopStream: () => void;
  reset: () => void;
}

export const useStream = ({
  path,
  options,
  isFormData = false,
  enabled = true,
  onData,
  onError,
  onComplete,
}: UseStreamOptions): UseStreamReturn => {
  const [data, setData] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (payload: StartStreamOptions) => {
      if (!enabled || isStreaming) return;

      try {
        setIsStreaming(true);
        setError(null);

        abortControllerRef.current = new AbortController();

        const stream = await apiStreamed(
          path,
          {
            ...(payload.options || options),
            signal: abortControllerRef.current.signal,
          },
          payload.isFormData || isFormData,
        );

        if (!stream) {
          throw new Error("Failed to create stream");
        }

        const reader = stream.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              onComplete?.();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });

            setData((prevData) => {
              const newData = prevData + chunk;
              onData?.(chunk);
              return newData;
            });
          }
        } finally {
          reader.releaseLock();
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          const error = err instanceof Error ? err : new Error("Stream failed");
          setError(error);
          onError?.(error);
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [
      path,
      options,
      isFormData,
      enabled,
      onData,
      onError,
      onComplete,
      isStreaming,
    ],
  );

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stopStream();
    setData("");
    setError(null);
  }, [stopStream]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    data,
    isStreaming,
    error,
    startStream,
    stopStream,
    reset,
  };
};
