import { useEffect, useState } from "react";
import useDebounce from "./use-debounce";

const useDeviceSize = (debounceDelay: number = 300) => {
  const [deviceSize, setDeviceSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const handleResize = (): void => {
    setDeviceSize({ width: window.innerWidth, height: window.innerHeight });
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
  }, [debounceDelay]);

  return deviceSize;
};

export default useDeviceSize;
