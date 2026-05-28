/**
 * Layout primitives — pure-string constants shared across the page.
 *
 * Lives in its own file (no "use client") so both server and client
 * components import them directly. Avoids RSC serialization issues
 * that arise when a server component imports constants from a file
 * that also exports hook-using components.
 */

/** Decelerating easing — strong at the start, gentle at the end.
 *  Elements arrive and settle; they never stop abruptly. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Shared section padding rhythm. Every section uses it. */
export const SECTION_PADDING = "px-6 py-32 md:px-10 md:py-40";

/** 12-column inner grid; section content lives inside. */
export const SECTION_GRID = "mx-auto grid max-w-[1240px] grid-cols-12 gap-8";
