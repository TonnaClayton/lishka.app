import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { log } from "@/lib/logging";
import { ROUTES } from "@/lib/routing";

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        log("[AuthCallback] Starting OAuth callback handling");

        // Get session from URL fragments
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);

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
            "[AuthCallback] OAuth authentication successful, redirecting to home",
          );
          navigate(ROUTES.HOME, { replace: true });
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

    if (code && state) {
      handleAuthCallback();
    } else {
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: { error: "Authentication failed. Please try again." },
      });
    }
  }, [navigate, code, state]);

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
