import { useCallback, useRef } from "react";

/**
 * Hook to manage two refs pointing to the same element efficiently
 */
export const useDualRef = <T extends HTMLElement>(): [
  React.RefObject<T>,
  React.RefObject<T>,
  (element: T | null) => void,
] => {
  const ref1 = useRef<T>(null);
  const ref2 = useRef<T>(null);

  const setRefs = useCallback((element: T | null) => {
    ref1.current = element;
    ref2.current = element;
  }, []);

  return [ref1, ref2, setRefs];
};
