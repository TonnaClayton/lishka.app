import { useEffect, useLayoutEffect, useRef } from "react";

const STORAGE_PREFIX = "scroll-restore-";

/**
 * Tracks scroll position and restores it when the element re-mounts.
 *
 * Uses sessionStorage for persistence (survives HMR and hard navigations)
 * and useLayoutEffect cleanup for the final save (runs before DOM removal,
 * unlike useEffect cleanup which runs after the element is detached).
 *
 * @param key   Unique identifier per scrollable view
 * @param ready Whether content has rendered enough to restore scroll
 */
export function useScrollRestoration<T extends HTMLElement = HTMLElement>(
  key: string,
  ready: boolean,
) {
  const ref = useRef<T | null>(null);
  const restoredRef = useRef(false);
  const storageKey = STORAGE_PREFIX + key;

  // Track scroll position continuously via scroll events.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        sessionStorage.setItem(storageKey, String(el.scrollTop));
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [storageKey]);

  // Capture final scroll position before DOM removal.
  // useLayoutEffect cleanup runs synchronously BEFORE React detaches
  // the element, so el.scrollTop is still accurate.
  // (useEffect cleanup runs AFTER detachment → scrollTop returns 0.)
  useLayoutEffect(() => {
    const el = ref.current;
    return () => {
      if (el) {
        sessionStorage.setItem(storageKey, String(el.scrollTop));
      }
    };
  }, [storageKey]);

  // Restore saved position once content is ready.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !ready || restoredRef.current) return;
    restoredRef.current = true;

    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return;

    el.scrollTop = parseInt(saved, 10);
  }, [storageKey, ready]);

  // Reset the restored flag when the key changes (different category).
  useEffect(() => {
    restoredRef.current = false;
  }, [key]);

  return { ref };
}
