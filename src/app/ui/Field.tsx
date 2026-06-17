import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Form primitives.
 *
 * All inputs share the same hairline border, the same generous
 * vertical padding, the same focus treatment (border tightens to
 * ink, no glow). The visual weight of an input matches the visual
 * weight of body copy — type and field are the same world.
 */

const inputBase =
  "w-full rounded-2xl border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] px-4 py-3.5 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] transition-[border-color,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus:border-[hsl(var(--ink))] focus:outline-none focus-visible:outline-none";

const fieldLabel =
  "mb-2.5 block text-[12px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]";

export function Label({
  children,
  htmlFor,
  optional,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  optional?: boolean;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn(fieldLabel, className)}>
      {children}
      {optional && (
        <span className="ml-2 text-[hsl(var(--ink-subtle))]">
          (optional)
        </span>
      )}
    </label>
  );
}

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "suffix"> {
  label?: string;
  helper?: ReactNode;
  errorText?: string;
  optional?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      helper,
      errorText,
      optional,
      prefix,
      suffix,
      id,
      className,
      ...rest
    },
    ref,
  ) {
    const fieldId = id ?? rest.name;
    const hasAdorn = Boolean(prefix || suffix);
    return (
      <div className={cn("w-full", className)}>
        {label && (
          <Label htmlFor={fieldId} optional={optional}>
            {label}
          </Label>
        )}
        <div
          className={cn(
            "relative flex items-stretch rounded-2xl border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-within:border-[hsl(var(--ink))] focus-within:ring-1 ring-[hsl(var(--ink))]/10",
            errorText && "border-[hsl(var(--danger))] focus-within:border-[hsl(var(--danger))] focus-within:ring-0",
          )}
        >
          {prefix && (
            <span className="flex items-center pl-4 text-[15px] text-[hsl(var(--ink-subtle))]">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={fieldId}
          className={cn(
            "w-full bg-transparent px-4 py-3.5 text-[15px] leading-7 text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none",
            hasAdorn && "px-3",
            prefix && "pl-1",
            suffix && "pr-1",
            )}
            {...rest}
          />
          {suffix && (
            <span className="flex items-center pr-4 text-[15px] text-[hsl(var(--ink-subtle))]">
              {suffix}
            </span>
          )}
        </div>
        {(helper || errorText) && (
          <p
            aria-live={errorText ? "assertive" : undefined}
            className={cn(
              "mt-2.5 text-[13.5px] leading-[1.55]",
              errorText
                ? "text-[hsl(var(--danger))]"
                : "text-[hsl(var(--ink-subtle))]",
            )}
          >
            {errorText ?? helper}
          </p>
        )}
      </div>
    );
  },
);

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: ReactNode;
  errorText?: string;
  optional?: boolean;
  maxChars?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(
    { label, helper, errorText, optional, maxChars, className, id, value, ...rest },
    ref,
  ) {
    const fieldId = id ?? rest.name;
    const len = typeof value === "string" ? value.length : 0;
    return (
      <div className={cn("w-full", className)}>
        {label && (
          <Label htmlFor={fieldId} optional={optional}>
            {label}
          </Label>
        )}
        <textarea
          id={fieldId}
          ref={ref}
          value={value}
          maxLength={maxChars}
          className={cn(inputBase, "min-h-[120px] resize-none leading-[1.55] focus:ring-1 ring-[hsl(var(--ink))]/10", errorText && "border-[hsl(var(--danger))] focus:border-[hsl(var(--danger))] focus:ring-0")}
          {...rest}
        />
        <div className="mt-2.5 flex items-baseline justify-between gap-3">
          <p
            aria-live={errorText ? "assertive" : undefined}
            className={cn(
              "text-[12.5px] leading-[1.55]",
              errorText
                ? "text-[hsl(var(--danger))]"
                : "text-[hsl(var(--ink-subtle))]",
            )}
          >
            {errorText ?? helper}
          </p>
          {maxChars && (
            <span className="shrink-0 text-[12px] tabular-nums text-[hsl(var(--ink-subtle))]">
              {len} / {maxChars}
            </span>
          )}
        </div>
      </div>
    );
  },
);
