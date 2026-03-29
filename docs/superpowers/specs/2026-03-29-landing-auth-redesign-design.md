# Landing Page & Auth Pages Redesign

**Date:** 2026-03-29
**Status:** Approved

## Overview

Redesign the landing page with glassmorphism aesthetic and create an immersive full-page auth layout shared by sign-in, sign-up, forgot-password, and onboarding pages. All UI text centralized in a const file.

## Decisions

- **Target audience**: Personal finance — friendly, approachable tone
- **Brand**: HyManager
- **Landing style**: Glassmorphism (blur, transparency, gradients, floating orbs)
- **Auth style**: Full-page immersive with animated gradient background, no cards
- **Auth layout**: Shared `auth.vue` layout for sign-in, sign-up, forgot-password, onboarding
- **Strings**: All copy in `src/static/landing.ts` const
- **Dashboard**: Not in scope

## Architecture

### New Files

- `src/static/landing.ts` — centralized strings/copy
- `src/layouts/auth.vue` — immersive auth layout with animated blobs
- `src/components/Landing/Navbar.vue`
- `src/components/Landing/HeroSection.vue`
- `src/components/Landing/FeaturesSection.vue`
- `src/components/Landing/HowItWorksSection.vue`
- `src/components/Landing/CtaSection.vue`
- `src/components/Landing/FooterSection.vue`

### Modified Files

- `src/layouts/home.vue` — rebuilt with navbar + footer + glassmorphism background
- `src/pages/index.vue` — full landing page with all sections
- `src/pages/sign-in.vue` — use auth layout, remove card wrapper, full-page style
- `src/pages/sign-up.vue` — same
- `src/pages/forgot-password.vue` — same
- `src/pages/onboarding/index.vue` — use auth layout

## Landing Page Design

### Navbar
- Fixed top, transparent with backdrop-blur on scroll
- Logo "HyManager" left-aligned, links to `/`
- "Entrar" and "Comece grátis" buttons right-aligned
- Responsive: hamburger on mobile

### Hero Section
- Large heading + subtitle describing the app value
- Two CTAs: "Comece grátis" (primary) + "Entrar" (outline)
- Abstract glassmorphism decorative element (floating glass cards suggesting a dashboard)
- Animated gradient orbs in background

### Features Section (2x2 grid)
- 4 feature cards with glass effect (backdrop-blur, border, transparency)
- Each: lucide icon + title + description
- Features: Transactions, Categories, Reports, Bank Accounts

### How It Works Section
- 3 horizontal steps
- Each: numbered circle + icon + title + description
- Steps: Cadastre-se, Configure, Controle

### CTA Section
- Gradient background section
- Compelling title + subtitle
- Single "Comece grátis" button

### Footer
- Logo + brief description
- Navigation links
- Copyright text
- Simple, clean

## Auth Layout Design

### Background
- Dark gradient base (primary → background)
- 2-3 animated blobs/orbs using primary and accent colors
- Heavy blur (`filter: blur(100px+)`) creating aurora/ambient effect
- CSS `@keyframes` only — translate + scale, ~20s loop

### Content Area
- Centered vertically and horizontally
- Logo "HyManager" at top, links to `/`
- No card wrapper — form inputs directly on blurred background
- Inputs with subtle borders and `backdrop-filter: blur`
- Max-width constrained (~400px for auth, ~448px for onboarding)

### Pages
- **Sign-in**: email + password + Google OAuth + links to sign-up and forgot-password
- **Sign-up**: name + email + password + confirm password + Google OAuth
- **Forgot-password**: email input + submit
- **Onboarding**: step progress + step content (keeps existing multi-step logic)

## Styling Approach

- Use existing Tailwind CSS tokens (primary, secondary, accent, border, background, muted)
- Dark mode supported automatically via CSS variables
- Glass effects via Tailwind's `backdrop-blur`, `bg-opacity`, `border` utilities
- Animations via CSS `@keyframes` in scoped styles or tailwind.css
- Responsive design with Tailwind breakpoints

## What's NOT Changing

- Auth flow logic (middleware, stores, Firebase)
- Dashboard layout and pages
- Any backend/service layer
- Routing structure (same URLs)
- Form validation logic
