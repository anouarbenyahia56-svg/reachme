/**
 * Centralized typography presets.
 *
 * Every repeated type pattern across the product lives here.
 * Highly localized one-offs may still use inline styles, but
 * all recurring headings and body copy should pull from these
 * presets to guarantee consistency.
 */

export interface TypePreset {
  className: string;
  style: React.CSSProperties;
}

export const headlineHero: TypePreset = {
  className: "font-serif text-[hsl(var(--ink))]",
  style: {
    fontSize: "clamp(2.7rem, 10vw, 7rem)",
    lineHeight: 1.02,
    letterSpacing: "-0.045em",
    fontWeight: 500,
    fontOpticalSizing: "auto",
    fontFeatureSettings: "'ss01', 'kern'",
    textWrap: "balance",
    paddingTop: "0.06em",
    paddingBottom: "0.04em",
    maxWidth: "min(18ch, 100%)",
  },
};

export const headlineSection: TypePreset = {
  className: "font-serif text-[hsl(var(--ink))]",
  style: {
    fontSize: "clamp(2.1rem, 4.4vw, 3.8rem)",
    fontWeight: 400,
    lineHeight: 1.05,
    letterSpacing: "-0.03em",
    textWrap: "balance",
  },
};

export const headlineSectionAlt: TypePreset = {
  className: "font-serif text-[hsl(var(--ink))]",
  style: {
    fontSize: "clamp(2.6rem, 5.4vw, 4.6rem)",
    fontWeight: 500,
    lineHeight: 1.02,
    letterSpacing: "-0.035em",
    textWrap: "balance",
  },
};

export const headlineCard: TypePreset = {
  className: "font-serif text-[hsl(var(--ink))]",
  style: {
    fontSize: "clamp(1.5rem, 2.4vw, 2.1rem)",
    fontWeight: 500,
    lineHeight: 1.1,
    letterSpacing: "-0.025em",
    fontOpticalSizing: "auto",
    textWrap: "balance",
  },
};

export const headlineStat: TypePreset = {
  className: "font-serif text-[hsl(var(--ink))]",
  style: {
    fontSize: "clamp(1.9rem, 3.4vw, 2.3rem)",
    fontWeight: 500,
    letterSpacing: "-0.03em",
    lineHeight: 1.05,
    fontVariantNumeric: "tabular-nums",
  },
};

export const headlineModal: TypePreset = {
  className: "font-serif text-[hsl(var(--ink))]",
  style: {
    fontSize: "clamp(1.45rem, 2.4vw, 1.9rem)",
    fontWeight: 500,
    lineHeight: 1.1,
    letterSpacing: "-0.025em",
    textWrap: "balance",
  },
};

export const headlineClosing: TypePreset = {
  className: "font-serif text-[hsl(var(--ink))]",
  style: {
    fontSize: "clamp(2.8rem, 8.5vw, 6.4rem)",
    fontWeight: 500,
    lineHeight: 1,
    letterSpacing: "-0.04em",
    textWrap: "balance",
    paddingBottom: "0.06em",
  },
};

export const bodyLarge: TypePreset = {
  className: "text-[hsl(var(--ink-muted))]",
  style: {
    fontSize: "clamp(1.05rem, 1.5vw, 1.25rem)",
    lineHeight: 1.5,
    fontWeight: 400,
    textWrap: "balance",
  },
};

export const body: TypePreset = {
  className: "text-[hsl(var(--ink-muted))]",
  style: {
    fontSize: "1.05rem",
    lineHeight: 1.6,
    fontWeight: 400,
    textWrap: "balance",
  },
};

export const bodySmall: TypePreset = {
  className: "text-[hsl(var(--ink-muted))]",
  style: {
    fontSize: "0.97rem",
    lineHeight: 1.65,
  },
};

export const caption: TypePreset = {
  className: "text-[hsl(var(--ink-subtle))]",
  style: {
    fontSize: "0.92rem",
    lineHeight: 1.55,
    letterSpacing: "0.005em",
    textWrap: "balance",
  },
};

export const label: TypePreset = {
  className: "text-[hsl(var(--ink-subtle))]",
  style: {
    fontSize: "0.66rem",
    fontWeight: 500,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
  },
};

export const eyebrow: TypePreset = {
  className: "text-[hsl(var(--ink-subtle))]",
  style: {
    fontSize: "0.72rem",
    fontWeight: 500,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    lineHeight: 1.7,
  },
};
