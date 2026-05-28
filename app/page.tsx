import { Audience } from "@/sections/Audience";
import { Closing } from "@/sections/Closing";
import { FAQ } from "@/sections/FAQ";
import { Footer } from "@/sections/Footer";
import { Hero } from "@/sections/Hero";
import { Mechanic } from "@/sections/Mechanic";
import { Nav } from "@/sections/Nav";
import { Pricing } from "@/sections/Pricing";
import { Thesis } from "@/sections/Thesis";

/**
 * Landing page.
 *
 * Two registers, one shared palette:
 *   • Hero → FAQ          — light register (page).
 *   • Closing + Footer    — dark register (.dark-world).
 *
 * No lines or rules between sections. The transition between registers
 * is carried by the color shift alone.
 *
 * This file is a server component. Interactive children carry their own
 * "use client" boundaries.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]">
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
