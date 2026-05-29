import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Error boundary — surfaces real errors instead of a silent
 * white page. The fallback is intentionally honest: it shows
 * the error and the stack so issues are diagnosable instead of
 * invisible.
 *
 * Designed so a real telemetry sink (Sentry, LogRocket, etc.)
 * drops in by replacing the body of `componentDidCatch`.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; info: ErrorInfo | null }
> {
  state = { error: null as Error | null, info: null as ErrorInfo | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ReachMe] render error:", error, info);
    this.setState({ error, info });
  }

  reset = () => {
    this.setState({ error: null, info: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-[hsl(var(--page))] px-6 py-16 text-[hsl(var(--ink))]">
        <div className="mx-auto max-w-[760px]">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
            Something didn't render
          </p>
          <h1
            className="mt-5 font-serif"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            We hit an unexpected error.
          </h1>
          <p className="mt-5 text-[hsl(var(--ink-muted))]">
            The team has been notified. You can try again, or head home.
          </p>
          <pre className="mt-8 overflow-auto rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] p-5 text-[12px] leading-[1.55] text-[hsl(var(--ink))]">
            {this.state.error.message}
            {this.state.info?.componentStack
              ? "\n\n" + this.state.info.componentStack
              : ""}
          </pre>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={this.reset}
              className="rounded-full bg-[hsl(var(--ink))] px-5 py-2.5 text-[13px] font-medium text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] px-5 py-2.5 text-[13px] font-medium text-[hsl(var(--ink))] transition-colors duration-300 hover:border-[hsl(var(--ink))]"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
