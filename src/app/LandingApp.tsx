import { Nav } from "@/sections/Nav";
import { Hero } from "@/sections/Hero";
import { Thesis } from "@/sections/Thesis";
import { Mechanic } from "@/sections/Mechanic";
import { Audience } from "@/sections/Audience";
import { Pricing } from "@/sections/Pricing";
import { FAQ } from "@/sections/FAQ";
import { Closing } from "@/sections/Closing";
import { Footer } from "@/sections/Footer";

/**
 * The marketing landing page — re-exported here so the router
 * can render it as a route without touching the locked sections.
 *
 * Anchors like /claim and /login that live inside locked components
 * are intercepted globally by `LinkInterceptor` so they navigate
 * via the in-app router rather than triggering a hard reload.
 */
export function LandingApp() {
  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))] antialiased">
      <Nav />
      <main>
        <Hero />
        <Thesis />
        <Mechanic />
        <Audience />
        <Pricing />
        <FAQ />

        <div className="dark-world">
          <Closing />
          <Footer />
        </div>
      </main>
    </div>
  );
}
