import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RESERVED_HANDLES, validateHandleSyntax } from "@/lib/domain";
import { ProfileScreen } from "./ProfileScreen";

interface RouteProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { handle } = await params;
  const lower = handle.toLowerCase();

  // Pre-route guard: invalid syntax or reserved handle → 404 page below.
  // We still return generic metadata so the 404 doesn't leak the reason.
  return {
    title: `reachme.com/${lower}`,
    description: `Send a serious request to ${lower} on ReachMe.`,
    robots: { index: true, follow: true },
    openGraph: {
      type: "profile",
      title: `reachme.com/${lower}`,
      description: `Send a serious request to ${lower} on ReachMe.`,
    },
    twitter: {
      card: "summary",
      title: `reachme.com/${lower}`,
      description: `Send a serious request to ${lower} on ReachMe.`,
    },
  };
}

/**
 * Public profile route — `/[handle]`.
 *
 * Server component. Validates the handle's shape and reservation
 * status before rendering. The actual page (read view + owner edit
 * view) lives in <ProfileScreen>, a client island that subscribes to
 * the session and the local store.
 *
 * When the real backend lands, this server component will be the
 * place we fetch the profile for SSR — so social previews carry the
 * owner's name, bio, and floor without waiting for client hydration.
 */
export default async function HandlePage({ params }: RouteProps) {
  const { handle } = await params;
  const lower = handle.toLowerCase();

  const syntax = validateHandleSyntax(lower);
  if (syntax.state !== "available") notFound();
  if (RESERVED_HANDLES.has(lower)) notFound();

  return <ProfileScreen handle={lower} />;
}
