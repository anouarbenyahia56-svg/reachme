import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { EASE } from "@/components/motion";
import { AppHeader } from "../../ui/AppHeader";
import { Reveal } from "../../ui/Reveal";
import { listDirectory } from "../../store/directory";
import { Avatar } from "../../ui/Avatar";
import { VerifiedBadge } from "../../ui/VerifiedBadge";
import { Pill } from "../../ui/Pill";
import { Link } from "../../router";
import { formatMoney } from "../../store/format";

/**
 * Find — directory of public ReachMe pages.
 *
 * Quiet typed search. Selecting a row routes to the public
 * profile. Echoes the marketing register so it feels like the
 * same product, not a separate app.
 */
export function Find() {
  const all = listDirectory();
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const list = all.filter((p) => p.visibility !== "paused");
    if (!q.trim()) return list;
    const needle = q.trim().toLowerCase();
    return list.filter(
      (p) =>
        p.handle.toLowerCase().includes(needle) ||
        p.displayName.toLowerCase().includes(needle) ||
        p.title.toLowerCase().includes(needle),
    );
  }, [all, q]);

  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]">
      <AppHeader />

      <main className="mx-auto max-w-[1100px] px-5 pb-32 pt-16 md:px-8 md:pt-24">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
            Reach someone
          </p>
          <h1
            className="mt-5 font-serif text-[hsl(var(--ink))]"
            style={{
              fontSize: "clamp(2.4rem, 5.4vw, 4rem)",
              fontWeight: 500,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              textWrap: "balance",
              maxWidth: "18ch",
            }}
          >
            Find the person you want to reach.
          </h1>
          <p className="mt-6 max-w-[58ch] text-[hsl(var(--ink-muted))]">
            Public ReachMe pages from founders, investors, operators,
            creators, experts, and public figures. Each sets their own
            floor. Each replies on their own terms.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 flex items-center overflow-hidden rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] focus-within:border-[hsl(var(--ink))]">
            <span className="pl-5 text-[hsl(var(--ink-muted))]">
              <Search size={15} strokeWidth={1.6} />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, handle, or role"
              className="w-full bg-transparent px-4 py-4 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none"
              autoFocus
            />
          </div>
        </Reveal>

        {visible.length === 0 ? (
          <Reveal delay={0.2}>
            <div className="mt-12 rounded-3xl border border-dashed border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] px-8 py-20 text-center">
              <h3
                className="font-serif text-[hsl(var(--ink))]"
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 500,
                  letterSpacing: "-0.025em",
                }}
              >
                No matches.
              </h3>
              <p className="mx-auto mt-3 max-w-[44ch] text-[hsl(var(--ink-muted))]">
                Try a different name or role. The directory only shows pages
                that are public and accepting requests.
              </p>
            </div>
          </Reveal>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((p, i) => (
              <motion.li
                key={p.handle}
                initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.65, delay: 0.04 * i, ease: EASE }}
              >
                <Link
                  href={`/${p.handle}`}
                  className="group flex h-full flex-col rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-6 py-6 transition-[border-color] duration-300 hover:border-[hsl(var(--ink))]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar size="md" src={p.avatarUrl} name={p.displayName} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-serif text-[1.1rem] font-semibold text-[hsl(var(--ink))]" style={{ letterSpacing: "-0.02em" }}>
                          {p.displayName}
                        </p>
                        {p.verified && <VerifiedBadge size={14} />}
                      </div>
                      <p className="truncate text-[12.5px] text-[hsl(var(--ink-muted))]">
                        {p.title}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-3 text-[13.5px] leading-[1.6] text-[hsl(var(--ink-muted))]">
                    {p.bio}
                  </p>
                  <div className="mt-5 flex items-center gap-2 border-t border-[hsl(var(--rule))] pt-4">
                    <Pill size="sm" tone="ink">
                      {formatMoney(p.minAmountCents)} min
                    </Pill>
                    <p className="ml-auto truncate text-[12px] text-[hsl(var(--ink-subtle))]">
                      reachme.com/{p.handle}
                    </p>
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
