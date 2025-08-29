import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { log } from "@/lib/logging";
import { ROUTES } from "@/lib/routing";

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        log("[AuthCallback] Starting OAuth callback handling");

        // Get session from URL fragments
        const { data, error } = await supabase.auth.getSession();

        log("[AuthCallback] Session result:", {
          hasSession: !!data?.session,
          hasUser: !!data?.session?.user,
          error: error?.message,
        });

        if (error) {
          console.error("[AuthCallback] OAuth callback error:", error);
          navigate(ROUTES.LOGIN, {
            replace: true,
            state: { error: "Authentication failed. Please try again." },
          });
          return;
        }

        if (data?.session) {
          log(
            "[AuthCallback] OAuth authentication successful, redirecting to dashboard",
          );
          navigate(ROUTES.DASHBOARD, { replace: true });
        } else {
          log("[AuthCallback] No session found, redirecting to login");
          navigate(ROUTES.LOGIN, { replace: true });
        }
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        navigate(ROUTES.LOGIN, {
          replace: true,
          state: {
            error: "An unexpected error occurred during authentication.",
          },
        });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

export default AuthCallback;
