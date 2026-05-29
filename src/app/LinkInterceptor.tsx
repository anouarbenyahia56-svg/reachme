import { useEffect } from "react";
import { useRouter } from "./router";

/**
 * Document-level click interceptor.
 *
 * The locked landing-page sections (Nav, Hero, Closing, Footer)
 * use plain `<a href="/claim">` and `<a href="/login">`. Without
 * intercepting, those would reload the entire app.
 *
 * We catch clicks at the document level, decide whether the anchor
 * is an in-app route (relative path, no modifier, no target), and
 * route through the SPA navigator. Hash links and external URLs
 * fall through untouched.
 */
export function LinkInterceptor() {
  const { navigate } = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      let node = e.target as HTMLElement | null;
      while (node && node.nodeName !== "A") {
        node = node.parentElement;
      }
      if (!node) return;
      const a = node as HTMLAnchorElement;
      if (!a.href) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;

      const url = new URL(a.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith("/")) {
        // Hash-only on the same path → let the browser scroll.
        if (
          url.pathname === window.location.pathname &&
          url.hash &&
          !a.dataset.routerForce
        ) {
          return;
        }
        e.preventDefault();
        navigate(url.pathname + url.search + url.hash);
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);

  return null;
}
