import { useEffect, useRef, useState, useMemo } from "react";

interface UseLazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
}

export const useLazyLoading = (
  options: UseLazyLoadingOptions = {},
): [React.RefObject<HTMLElement>, boolean] => {
  const { threshold = 0.1, rootMargin = "50px" } = options;
  const elementRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Memoize observer options to prevent unnecessary re-renders
  const observerOptions = useMemo(
    () => ({
      threshold,
      rootMargin,
    }),
    [threshold, rootMargin],
  );

  useEffect(() => {
    // Check for IntersectionObserver support first
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true); // Fallback for older browsers
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(element);
      }
    }, observerOptions);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [observerOptions]);

  return [elementRef, isVisible];
};
