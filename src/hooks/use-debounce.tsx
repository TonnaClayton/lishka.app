import { useEffect } from "react";

const useDebounce = (callback: () => void, delay: number): void => {
  useEffect(() => {
    const debounceTimer = setTimeout(callback, delay);

    return () => clearTimeout(debounceTimer);
  }, [callback, delay]);
};

export default useDebounce;
