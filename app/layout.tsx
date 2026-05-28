import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

/**
 * Fonts are loaded through next/font/google so Next.js self-hosts the
 * font files at build time. No runtime requests to fonts.googleapis.com.
 *
 * Both fonts expose CSS variables (--app-font-sans, --app-font-serif)
 * which globals.css composes into --font-sans / --font-serif.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--app-font-serif",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--app-font-sans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://reachme.com"),
  title: {
    default: "ReachMe — Stay reachable. Let only what matters reach you.",
    template: "%s · ReachMe",
  },
  description:
    "ReachMe is a serious request layer for people whose attention has value. Set the floor. Let the requests worth your time through. Let everything else disappear.",
  applicationName: "ReachMe",
  authors: [{ name: "ReachMe" }],
  keywords: [
    "reachability",
    "paid request",
    "attention",
    "creator economy",
    "professional inbox",
  ],
  openGraph: {
    type: "website",
    siteName: "ReachMe",
    title: "ReachMe",
    description:
      "Stay reachable without letting noise reach you. ReachMe is a serious request layer for people whose attention has value.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReachMe",
    description:
      "Stay reachable without letting noise reach you. ReachMe is a serious request layer for people whose attention has value.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fafaf7",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
