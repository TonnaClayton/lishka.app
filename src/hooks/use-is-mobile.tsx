import { useEffect, useState } from "react";
import useDebounce from "./use-debounce";

const useIsMobile = (
  threshold: number = 768,
  debounceDelay: number = 300,
): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const handleResize = (): void => {
    setIsMobile(window.innerWidth <= threshold);
  };

  useDebounce(handleResize, debounceDelay);

  useEffect(() => {
    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, debounceDelay]);

  return isMobile;
};

export default useIsMobile;
