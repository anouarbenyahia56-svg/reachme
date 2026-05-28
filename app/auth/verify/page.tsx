import type { Metadata } from "next";
import { VerifyScreen } from "./VerifyScreen";

export const metadata: Metadata = {
  title: "Signing you in",
  description: "Verifying your sign-in link.",
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return <VerifyScreen />;
}
