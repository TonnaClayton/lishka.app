import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { PostHogProvider, PostHogErrorBoundary } from "posthog-js/react";
import { initPosthog, posthog } from "./lib/posthog";
import { ROUTES } from "./lib/routing";
import ErrorBoundary from "./components/error-boundary";
import LandingPage from "./pages/landing";

const TermsPage = lazy(() => import("./pages/terms"));
const PrivacyPolicyPage = lazy(() => import("./pages/privacy-policy"));
const DataDeletionPage = lazy(() => import("./pages/data-deletion"));
const SupportPage = lazy(() => import("./pages/support"));

// Marketing site only. The old web app's paths (/login, /home, /fish/...)
// fall through to the landing page.
const router = createBrowserRouter([
  { path: ROUTES.HOME, element: <LandingPage /> },
  { path: ROUTES.TERMS, element: <TermsPage /> },
  { path: ROUTES.PRIVACY_POLICY, element: <PrivacyPolicyPage /> },
  { path: ROUTES.DATA_DELETION, element: <DataDeletionPage /> },
  { path: ROUTES.SUPPORT, element: <SupportPage /> },
  { path: "*", element: <Navigate to={ROUTES.HOME} replace /> },
]);

function App() {
  initPosthog();

  return (
    <PostHogProvider client={posthog}>
      <PostHogErrorBoundary>
        <ErrorBoundary>
          <Suspense fallback={null}>
            <RouterProvider router={router} />
          </Suspense>
        </ErrorBoundary>
      </PostHogErrorBoundary>
    </PostHogProvider>
  );
}

export default App;
