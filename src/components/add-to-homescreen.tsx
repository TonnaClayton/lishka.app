import { useEffect } from "react";
import { AddToHomeScreen } from "@/lib/add-to-homescreen";

/**
 * AddToHomeScreenPrompt component
 *
 * Initializes and displays the add-to-homescreen prompt for users
 * to install the Lishka app on their device's home screen.
 *
 * Features:
 * - Works across iOS Safari, Android Chrome/Edge, and desktop browsers
 * - Supports 20+ languages
 * - Detects in-app browsers (Instagram, Facebook, Twitter)
 * - Customizable display frequency
 *
 * Uses the local add-to-homescreen library implementation
 * Source: /src/lib/add-to-homescreen
 *
 * You can customize the UI by modifying:
 * - Styles: /src/lib/add-to-homescreen/style.css
 * - Localization: /src/lib/add-to-homescreen/locales/*.json
 * - Assets: /src/lib/add-to-homescreen/assets/*
 */
const AddToHomeScreenPrompt = () => {
  useEffect(() => {
    // Initialize the add-to-homescreen instance
    const instance = AddToHomeScreen({
      appName: "Lishka",
      appIconUrl: "/apple-touch-icon.png",
      assetUrl: "/add-to-homescreen-assets/",
      // Show the prompt indefinitely (set to a positive number to limit display count)
      maxModalDisplayCount: -1,
      displayOptions: {
        showMobile: true,
        showDesktop: true,
      },
    });

    // Show the prompt after 3 seconds delay
    // Available languages: en, fr, es, de, pt, it, nl, sv, da, fi, nb, pl, tr, uk, ru, ar, ja, ko, zh, zh_CN, zh_HK, zh_TW
    const timeoutId = setTimeout(() => {
      instance.show("en");
    }, 3000);

    // Cleanup timeout on component unmount
    return () => clearTimeout(timeoutId);
  }, []);

  // This component doesn't render any visible UI
  // The library handles the modal display
  return null;
};

export default AddToHomeScreenPrompt;
