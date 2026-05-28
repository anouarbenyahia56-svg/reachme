import type { Metadata } from "next";
import { ClaimScreen } from "./ClaimScreen";

export const metadata: Metadata = {
  title: "Claim your handle",
  description:
    "Pick the handle for your ReachMe page. It's yours from the moment you claim it.",
};

export default function ClaimPage() {
  return <ClaimScreen />;
}
