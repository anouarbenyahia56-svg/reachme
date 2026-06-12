import { cn } from "@/lib/utils";
import { type TypePreset } from "@/lib/typography";
import { type ReactNode } from "react";

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

interface HeadlineProps {
  as?: HeadingElement;
  preset: TypePreset;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Headline({
  as: Tag = "h2",
  preset,
  children,
  className,
  id,
}: HeadlineProps) {
  return (
    <Tag id={id} className={cn(preset.className, className)} style={preset.style}>
      {children}
    </Tag>
  );
}
