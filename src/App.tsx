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
 * Page composition.
 *
 * Two registers, one shared palette:
 *
 *   • Hero → FAQ          — light register (page).
 *   • Closing + Footer    — dark register (.dark-world).
 *
 * No lines, rules, or hairlines separate sections. The transition
 * between registers is carried by the color change alone — the
 * background shift is the chapter break.
 */
export default function App() {
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
