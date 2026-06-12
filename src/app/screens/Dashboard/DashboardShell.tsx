import { type ReactNode, useRef, useLayoutEffect, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AppHeader } from "../../ui/AppHeader";
import { Link, useNavigate } from "../../router";
import { VerifyEmailBanner } from "./VerifyEmailBanner";

const TABS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Received", href: "/dashboard/received" },
  { label: "Sent", href: "/dashboard/sent" },
  { label: "Earnings", href: "/dashboard/earnings" },
  { label: "Page", href: "/dashboard/page" },
  { label: "Settings", href: "/dashboard/settings" },
] as const;

const DURATION = 120;
const EASE = "cubic-bezier(0.25, 1, 0.5, 1)";

const INK_MUTED = "hsl(var(--ink-muted))";
const PAGE = "hsl(var(--page))";

const ACTIVE_CLASSES = ["text-[hsl(var(--page))]"];
const INACTIVE_CLASSES = ["text-[hsl(var(--ink-muted))]", "hover:text-[hsl(var(--ink))]"];

function resolveHref(path: string) {
  return TABS.find((t) =>
    t.href === "/dashboard" ? path === "/dashboard" : path.startsWith(t.href),
  )?.href ?? "/dashboard";
}

function getTabKey(href: string) {
  return href === "/dashboard" ? "overview" : href.split("/").pop()!;
}

function cachePositions(nav: HTMLElement) {
  const navRect = nav.getBoundingClientRect();
  const map = new Map<string, { left: number; width: number }>();
  for (const t of TABS) {
    const el = nav.querySelector(`[href="${t.href}"]`) as HTMLElement | null;
    if (el) {
      const r = el.getBoundingClientRect();
      map.set(t.href, { left: r.left - navRect.left, width: r.width });
    }
  }
  return map;
}

/**
 * Zero React re-renders on tab switch.
 * All DOM writes go through apply() — pill, text, headlines, panels.
 * React never touches the managed elements after mount.
 */
export function DashboardShell({
  headlines,
  description,
  trailing,
  children,
}: {
  headlines: Record<string, ReactNode>;
  description?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  useNavigate();
  const navRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const posCache = useRef<Map<string, { left: number; width: number }>>(new Map());

  const linksRef = useRef<HTMLAnchorElement[]>([]);
  const panelsRef = useRef<HTMLElement[]>([]);
  const headlinesRef = useRef<HTMLElement[]>([]);
  const rafRef = useRef(0);
  const targetRef = useRef<string>("");

  const apply = (href: string, animate: boolean) => {
    const pill = pillRef.current;
    const pos = posCache.current.get(href);
    if (pill && pos) {
      pill.style.transition = animate
        ? `width ${DURATION}ms ${EASE}, transform ${DURATION}ms ${EASE}`
        : "none";
      pill.style.width = `${pos.width}px`;
      pill.style.transform = `translateX(${pos.left}px)`;
    }

    const key = getTabKey(href);

    for (const link of linksRef.current) {
      const linkHref = link.getAttribute("href");
      if (!linkHref) continue;
      const isActive = linkHref === href;
      link.style.color = isActive ? PAGE : INK_MUTED;
      link.setAttribute("aria-current", isActive ? "page" : "none");
      if (isActive) {
        link.classList.remove(...INACTIVE_CLASSES);
        link.classList.add(...ACTIVE_CLASSES);
      } else {
        link.classList.remove(...ACTIVE_CLASSES);
        link.classList.add(...INACTIVE_CLASSES);
      }
    }

    for (const h of headlinesRef.current) {
      h.style.display = h.dataset.headline === key ? "" : "none";
    }

    for (const panel of panelsRef.current) {
      panel.style.display = panel.dataset.panel === key ? "" : "none";
    }
  };

  // Mount: cache positions, query DOM refs once
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    posCache.current = cachePositions(nav);
    linksRef.current = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a"));
    headlinesRef.current = Array.from(document.querySelectorAll<HTMLElement>("[data-headline]"));
    panelsRef.current = Array.from(document.querySelectorAll<HTMLElement>("[data-panel]"));
    const initial = resolveHref(window.location.pathname);
    apply(initial, false);
    targetRef.current = initial;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Resize
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onResize = () => {
      posCache.current = cachePositions(nav);
      apply(targetRef.current, false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // popstate: sync DOM for back/forward navigation
  useEffect(() => {
    const onPop = () => {
      const href = resolveHref(window.location.pathname);
      if (href === targetRef.current) return;
      targetRef.current = href;
      apply(href, false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // pointerdown: instant pill + text + headline, deferred content
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = (e.target as HTMLElement).closest("a") as HTMLAnchorElement | null;
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || !posCache.current.has(href)) return;
      if (href === targetRef.current) return;

      targetRef.current = href;

      cancelAnimationFrame(rafRef.current);

      apply(href, true);

      rafRef.current = requestAnimationFrame(() => {
        const key = getTabKey(href);
        for (const panel of panelsRef.current) {
          panel.style.display = panel.dataset.panel === key ? "" : "none";
        }
      });
    };

    nav.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => {
      nav.removeEventListener("pointerdown", onPointerDown);
      cancelAnimationFrame(rafRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeKey = getTabKey(targetRef.current || resolveHref(window.location.pathname));

  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]">
      <AppHeader />

      <main id="main-content" className="mx-auto max-w-[1180px] px-5 pb-32 pt-10 md:px-8 md:pt-14">
        <VerifyEmailBanner />

        <div>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              {Object.entries(headlines).map(([key, h1]) => (
                <h1
                  key={key}
                  data-headline={key}
                  className="font-serif text-[hsl(var(--ink))]"
                  style={{
                    display: key === activeKey ? "" : "none",
                    fontSize: "clamp(2.4rem, 5.4vw, 4rem)",
                    fontWeight: 500,
                    lineHeight: 1.02,
                    letterSpacing: "-0.04em",
                    textWrap: "balance",
                  }}
                >
                  {h1}
                </h1>
              ))}
              {description && (
                <p
                  className="mt-4 max-w-[58ch] text-[hsl(var(--ink-muted))]"
                  style={{ fontSize: "1rem", lineHeight: 1.6 }}
                >
                  {description}
                </p>
              )}
            </div>
            {trailing && <div className="shrink-0">{trailing}</div>}
          </div>
        </div>

        <nav
          ref={navRef}
          aria-label="Dashboard sections"
          className="relative mt-10 flex flex-wrap items-center gap-2"
        >
          <span
            ref={pillRef}
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 h-full rounded-full bg-[hsl(var(--ink))] shadow-sm"
            style={{ willChange: "transform, width" }}
          />

          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "relative rounded-full px-4 py-2 text-[13px] font-medium",
                ...INACTIVE_CLASSES,
              )}
            >
              <span className="relative">{t.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-10">{children}</div>
      </main>
    </div>
  );
}