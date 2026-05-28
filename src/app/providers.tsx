"use client";

import { SessionProvider } from "@/lib/session";
import type { ReactNode } from "react";

/**
 * Root client providers. The single `"use client"` boundary that wraps
 * the whole app — server pages render through it transparently.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
