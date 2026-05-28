import type { Metadata } from "next";
import { InboxScreen } from "./InboxScreen";

export const metadata: Metadata = {
  title: "Inbox",
  description: "Review and reply to your incoming requests.",
  robots: { index: false, follow: false },
};

export default function InboxPage() {
  return <InboxScreen />;
}
