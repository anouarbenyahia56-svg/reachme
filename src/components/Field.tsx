"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Form primitives — editorial register.
 *
 * One typographic system across all forms. Labels are tracked-out
 * uppercase captions; inputs are large body type with a hairline rule
 * underneath, no chunky borders, no surface fills. The eye reads the
 * field as a line of text on paper, not a UI control.
 *
 * Each field is built around a native <input>/<textarea> so the browser
 * password-manager / autofill / IME flow is preserved (per the web
 * interface guidelines: "Compatible with password managers & 2FA").
 */

export function FieldGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-7">{children}</div>;
}

export function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <label
        htmlFor={htmlFor}
        className="text-[hsl(var(--ink))]"
        style={{
          fontSize: "0.7rem",
          fontWeight: 500,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </label>
      {hint ? (
        <span
          className="text-[hsl(var(--ink-subtle))]"
          style={{
            fontSize: "0.72rem",
            letterSpacing: "0.04em",
          }}
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="text-[hsl(var(--ink-muted))]"
      style={{
        fontSize: "0.85rem",
        fontStyle: "italic",
        letterSpacing: "-0.005em",
        marginTop: "0.4rem",
      }}
    >
      {children}
    </p>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      // 16px on mobile prevents iOS auto-zoom (web interface guidelines).
      className={cn(
        "block w-full bg-transparent text-[hsl(var(--ink))]",
        "border-0 border-b border-[hsl(var(--rule-strong))]",
        "px-0 py-3 placeholder:text-[hsl(var(--ink-subtle))]",
        "outline-none transition-[border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:border-[hsl(var(--ink-muted))] focus:border-[hsl(var(--ink))]",
        invalid &&
          "border-[hsl(var(--ink))]/60 focus:border-[hsl(var(--ink))]",
        className,
      )}
      style={{
        fontSize: "max(16px, 1.1rem)",
        letterSpacing: "-0.01em",
        fontWeight: 400,
      }}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, rows = 5, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        "block w-full resize-y bg-transparent text-[hsl(var(--ink))]",
        "border-0 border-b border-[hsl(var(--rule-strong))]",
        "px-0 py-3 placeholder:text-[hsl(var(--ink-subtle))]",
        "outline-none transition-[border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:border-[hsl(var(--ink-muted))] focus:border-[hsl(var(--ink))]",
        invalid &&
          "border-[hsl(var(--ink))]/60 focus:border-[hsl(var(--ink))]",
        className,
      )}
      style={{
        fontSize: "max(16px, 1.05rem)",
        letterSpacing: "-0.005em",
        fontWeight: 400,
        lineHeight: 1.55,
      }}
      {...props}
    />
  );
});
