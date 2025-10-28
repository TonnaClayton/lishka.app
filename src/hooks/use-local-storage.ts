import { useState, useEffect, useCallback } from "react";
import { log, warn as warnLog } from "@/lib/logging";

/**
 * Custom hook for safe localStorage access with TypeScript support
 * Handles edge cases like private browsing mode, quota exceeded, and JSON parsing errors
 *
 * @param key - The localStorage key
 * @param initialValue - Default value if key doesn't exist
 * @returns [value, setValue, removeValue] tuple
 *
 * @example
 * const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      warnLog(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to local storage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          log(`Successfully saved to localStorage: ${key}`);
        }
      } catch (error) {
        // Handle QuotaExceededError and other errors
        if (error instanceof Error) {
          if (error.name === "QuotaExceededError") {
            warnLog(`localStorage quota exceeded for key "${key}"`);
          } else if (error.name === "SecurityError") {
            warnLog(
              `localStorage access denied (private browsing?) for key "${key}"`,
            );
          } else {
            warnLog(`Error setting localStorage key "${key}":`, error);
          }
        }
      }
    },
    [key, storedValue],
  );

  // Function to remove the value
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
        log(`Successfully removed from localStorage: ${key}`);
      }
    } catch (error) {
      warnLog(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to this localStorage key from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          warnLog(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for boolean localStorage values with simpler API
 *
 * @param key - The localStorage key
 * @param initialValue - Default boolean value
 * @returns [value, setValue, toggle, remove] tuple
 *
 * @example
 * const [isDarkMode, setIsDarkMode, toggleDarkMode] = useLocalStorageBoolean('darkMode', false);
 */
export function useLocalStorageBoolean(
  key: string,
  initialValue: boolean = false,
): [boolean, (value: boolean) => void, () => void, () => void] {
  const [value, setValue, removeValue] = useLocalStorage<boolean>(
    key,
    initialValue,
  );

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, [setValue]);

  return [value, setValue, toggle, removeValue];
}
