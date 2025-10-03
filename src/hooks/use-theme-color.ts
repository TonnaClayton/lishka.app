import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ROUTES } from "@/lib/routing";

/**
 * Hook to dynamically update the theme-color meta tag based on the current route
 * Black for landing, privacy policy, and terms pages
 * White for all other pages
 */
export function useThemeColor() {
  const location = useLocation();

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (!metaThemeColor) return;

    // Pages that should have black theme color
    const blackThemePages = [
      "/home", // Landing page route
      ROUTES.PRIVACY_POLICY,
      ROUTES.TERMS,
      ROUTES.LOGIN,
    ];

    const shouldUseBlackTheme = blackThemePages.includes(location.pathname);
    const themeColor = shouldUseBlackTheme ? "#000000" : "#ffffff";

    metaThemeColor.setAttribute("content", themeColor);
  }, [location.pathname]);
}
