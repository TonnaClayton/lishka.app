import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import LoadingDots from "@/components/loading-dots";
import { log } from "@/lib/logging";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  log("[ProtectedRoute] Checking auth", {
    requireAuth,
    hasUser: !!user,
    loading,
    pathname: location.pathname,
    isMobile:
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ),
  });

  if (loading) {
    log("[ProtectedRoute] Still loading auth state");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingDots />
        <p className="text-sm text-muted-foreground ml-2">Loading...</p>
      </div>
    );
  }

  if (requireAuth && !user) {
    log("[ProtectedRoute] Auth required but no user, redirecting to login", {
      from: location.pathname,
    });
    // Clear any stale data from localStorage on logout redirect
    if (location.pathname !== "/login") {
      log("[ProtectedRoute] Clearing potential stale auth data");
    }
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!requireAuth && user) {
    log("[ProtectedRoute] User authenticated, redirecting away from auth page");
    // Redirect authenticated users away from auth pages to home
    const from = (location.state as any)?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  log("[ProtectedRoute] Auth check passed, rendering children");
  return <>{children}</>;
};

export default ProtectedRoute;
