import { cn } from "@/lib/utils";
import { type TypePreset } from "@/lib/typography";
import { type ReactNode } from "react";

interface BodyTextProps {
  preset: TypePreset;
  children: ReactNode;
  className?: string;
}

export function BodyText({ preset, children, className }: BodyTextProps) {
  return (
    <p className={cn(preset.className, className)} style={preset.style}>
      {children}
    </p>
  );
}
