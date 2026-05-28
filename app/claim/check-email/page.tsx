import type { Metadata } from "next";
import { CheckEmailScreen } from "./CheckEmailScreen";

export const metadata: Metadata = {
  title: "Check your email",
  description: "We sent your sign-in link.",
};

export default function CheckEmailPage() {
  return <CheckEmailScreen />;
}
