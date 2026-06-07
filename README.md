# ReachMe

A serious request layer for people whose attention has value.

ReachMe is not a contact form, a DM inbox, a scheduler, a link-in-bio, or a
social network. It is a request layer. People who want to reach a ReachMe
user send a structured request — with category, message, context, and an
attached amount that signals seriousness. The owner sets the floor, reviews
incoming requests, and stays in control of their attention.

The promise: stay reachable without letting noise reach you.

## Stack

- React 19 + TypeScript 5.9
- Vite 7
- Tailwind CSS 4
- Framer Motion (motion choreography)
- Lucide (icons)

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Build

```bash
npm run build
npm run preview
```

The production bundle is emitted to `dist/`.

## Project shape

```
src/
├─ app/             router, routes, screens, store, UI primitives
│  ├─ router.tsx        tiny pushState router
│  ├─ Routes.tsx        path dispatch
│  ├─ screens/
│  │  ├─ Landing/       Nav, Hero, Thesis, Mechanic, Audience, Pricing, FAQ, Closing, Footer (see /sections)
│  │  ├─ Auth/          Login
│  │  ├─ Onboarding/    Steps 1–7 (handle → email → identity → floor → categories → visibility → finish)
│  │  ├─ Dashboard/     Overview, Received, Sent, MyPage, Settings, VerifyEmailBanner
│  │  ├─ Find/          public directory
│  │  ├─ Public/        public profile + preview card
│  │  └─ Send/          five-step send-a-request flow
│  ├─ store/        localStorage-backed stores (session, draft, directory, requests, verification, format, categories)
│  ├─ ui/           Button, Avatar, Card, Field, Pill, Modal, Toast, Reveal, AppHeader, VerifiedBadge
├─ components/      marketing primitives (Wordmark, CTA, motion)
├─ sections/        Nav, Hero, Thesis, Mechanic, Audience, Pricing, FAQ, Closing, Footer
├─ lib/             utilities (cn)
├─ App.tsx          composes the providers and routes
├─ main.tsx         entry
└─ index.css        design tokens, type, base layer
```

## Design language

White and black. One mode. The palette is deliberate restraint —
warm off-white, near-black, three weights of muted ink, two rules.
Type pairs Inter (body) with Fraunces (display). Motion is slow,
weighted, and inevitable. Whitespace is the layout.
