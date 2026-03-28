---
status: resolved
type: bug
severity: high
found-during: "brainstorm session - reviewing new user flow"
found-in: "src/pages/onboarding/index.vue, src/middleware/auth.global.ts"
found-in-branch: "main"
date: 2026-03-28 10:00
updated: 2026-03-28 12:00
resolved-date: 2026-03-28 12:00
discard-reason:
deferred:
---

# Onboarding flow is broken for new users

## What was found
The onboarding flow is incomplete and broken in multiple ways:

1. **Empty onboarding page**: `src/pages/onboarding/index.vue` is an empty file — after sign-up, the user lands on a blank page
2. **Empty composable**: `src/composables/useOnboarding.ts` returns an empty object with no logic
3. **No middleware guard**: `src/middleware/auth.global.ts` doesn't check `hasCompletedOnboarding` — authenticated users can navigate directly to `/dashboard` bypassing onboarding
4. **Google OAuth skips onboarding**: Google sign-in redirects directly to `/dashboard`, never touching `/onboarding`
5. **`hasCompletedOnboarding` field unused**: The user schema has `hasCompletedOnboarding: z.boolean().nullish()` but it's never read or updated anywhere
6. **No onboarding route in AUTH_ROUTES**: The `/onboarding` route is not protected — unauthenticated users could technically access it

## Where
- `src/pages/onboarding/index.vue` — empty page
- `src/composables/useOnboarding.ts` — empty composable
- `src/middleware/auth.global.ts` — missing onboarding guard
- `src/pages/sign-up.vue` — redirects to `/onboarding` (line 59)
- `src/@schemas/models/user.ts` — has `hasCompletedOnboarding` field (unused)

## Why it matters
New users who sign up via email hit a blank page. Google OAuth users skip any setup entirely. There is no guided flow to create a first bank account, set up categories, or configure preferences. This creates a confusing first experience and likely causes user drop-off.

## Suggested approach

### Onboarding wizard steps (decided)
1. **Welcome** — confirm/edit profile name
2. **Create first bank account** — required, can't skip
3. **Categories setup** — present the 16 default categories (from `src/static/default-categories.ts`), let the user toggle on/off which ones they want, then bulk-create via existing `setupDefaultCategories` service. Pre-select all by default.

### Infrastructure (decided)
1. Add middleware guard: if `hasCompletedOnboarding !== true` and route is `/dashboard/*`, redirect to `/onboarding`
2. Update `hasCompletedOnboarding` to `true` when wizard completes
3. Ensure both email sign-up and Google OAuth go through onboarding
4. Add `/onboarding` to a protected routes list (requires auth but not completed onboarding)
5. Reuse existing services: `createBankAccount`, `setupDefaultCategories`
