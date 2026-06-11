import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * A small, dependency-free router built on top of the History API.
 *
 * Why not React Router: the app is intentionally compact, the routes
 * are stable, and one well-shaped primitive is more honest than a
 * configured library. This file is the entire client-side routing
 * surface — pushState, popstate, and a context that holds path +
 * navigate.
 */

type NavigateFn = (to: string, opts?: { replace?: boolean }) => void;

interface RouterValue {
  path: string;
  navigate: NavigateFn;
}

const RouterContext = createContext<RouterValue | null>(null);
const NavigateContext = createContext<NavigateFn | null>(null);

function currentPath(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(currentPath);

  useEffect(() => {
    const onPop = () => setPath(currentPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback(
    (to: string, opts: { replace?: boolean } = {}) => {
      if (typeof window === "undefined") return;
      const raw = to.startsWith("/") ? to : `/${to}`;
      const target = raw.split("?")[0];
      if (target === window.location.pathname) return;
      if (opts.replace) {
        window.history.replaceState(null, "", target);
      } else {
        window.history.pushState(null, "", target);
      }
      setPath(target);
    },
    [],
  );

  const value = useMemo<RouterValue>(() => ({ path, navigate }), [path, navigate]);

  return (
    <RouterContext.Provider value={value}>
      <NavigateContext.Provider value={navigate}>{children}</NavigateContext.Provider>
    </RouterContext.Provider>
  );
}

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used inside <RouterProvider>");
  return ctx;
}

/** Returns the stable navigate function without subscribing to path changes. */
export function useNavigate(): NavigateFn {
  const ctx = useContext(NavigateContext);
  if (!ctx) throw new Error("useNavigate must be used inside <RouterProvider>");
  return ctx;
}

/** Anchor that respects in-app navigation. Modifier keys, target,
 *  and external URLs all fall through to the browser. */
export function Link({
  href,
  className,
  children,
  replace,
  onClick,
  ...rest
}: {
  href: string;
  className?: string;
  children: ReactNode;
  replace?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "onClick" | "href" | "className" | "children">) {
  const { navigate } = useRouter();
  const isExternal =
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:");
  const isHash = href.startsWith("#");

  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (onClick) onClick(e);
        if (e.defaultPrevented) return;
        if (isExternal || isHash) return;
        if (
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          (rest.target && rest.target !== "_self")
        ) {
          return;
        }
        e.preventDefault();
        navigate(href, { replace });
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

// ─── Tiny matcher ──────────────────────────────────────────────────
//
// Supports `/static`, `/static/:param`, and a final `:rest`.

export function match(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const ps = pattern.replace(/\/$/, "").split("/");
  const xs = path.replace(/\/$/, "").split("/");
  if (ps.length !== xs.length) return null;
  const out: Record<string, string> = {};
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    const x = xs[i];
    if (p.startsWith(":")) {
      out[p.slice(1)] = decodeURIComponent(x);
    } else if (p !== x) {
      return null;
    }
  }
  return out;
}
