import { useState, useEffect } from "react";
import { RouterProvider } from "@/app/router";
import { Routes } from "@/app/Routes";
import { LinkInterceptor } from "@/app/LinkInterceptor";
import { ToastProvider } from "@/app/ui/Toast";
import { ErrorBoundary } from "@/app/ErrorBoundary";
import { attachmentHydrated } from "@/app/store/requests";

/**
 * App root.
 *
 * The router lives at the very top so every screen — marketing,
 * onboarding, dashboard, public profile — speaks the same path
 * language and shares the same single source of navigation truth.
 *
 *   • ErrorBoundary      — last line of defence. Surfaces render
 *                          errors as a real, navigable screen
 *                          instead of a silent blank page.
 *   • RouterProvider     — pushState + popstate + path context.
 *   • LinkInterceptor    — captures plain `<a href="/...">` from
 *                          locked landing sections and routes them
 *                          through the SPA without a hard reload.
 *   • ToastProvider      — global confirmation surface used across
 *                          dashboard, onboarding, and send flows.
 *   • Routes             — the dispatch surface itself.
 */
export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    attachmentHydrated.then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <ErrorBoundary>
      <RouterProvider>
        <ToastProvider>
          <a href="#main-content" className="skip-to-content">
            Skip to content
          </a>
          <LinkInterceptor />
          <Routes />
        </ToastProvider>
      </RouterProvider>
    </ErrorBoundary>
  );
}
