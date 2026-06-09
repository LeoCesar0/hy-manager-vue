---
name: deploy
description: Deploy the app to Firebase Hosting production (project hyfinances-1532e). Use when the user runs /deploy or asks to deploy/ship/publish to prod. Invoking this skill is the user's authorization to run the production deploy.
---

# Deploy to Production

Firebase Hosting, single project `hyfinances-1532e`, **no staging** — `firebase deploy --only hosting` replaces the live site immediately.

## Authorization

- **An active invocation of this skill IS the user's explicit authorization to run the production deploy.** While this skill is active, run `firebase deploy --only hosting` yourself. This overrides the global Production Safety rule against deploys, for the hosting deploy only.
- Authorization does **not** extend to `firestore:rules` or `firestore:indexes` — those still require a separate explicit confirmation (see step 4).

## Steps

Run in order. Each gate is blocking — if it fails, stop, report, and do not proceed.

### 1. Pre-flight verification (blocking gates)

- `pnpm run ts-check` — must be clean.
- `pnpm test:unit` — must be green. **Do not run `test:integration`** (it hits a shared remote Firestore).
- Report any failure and **abort the deploy**. Never deploy on red.

### 2. Version ritual

- Read the current version at `nuxt.config.ts` → `runtimeConfig.public.appVersion`.
- Summarize what is shipping: `git status --short` (working tree) + recent `git log --oneline` since the last release. Reading git is fine even though this skill does not write git.
- Classify the change and propose the next SemVer:
  - breaking change (contract/schema/route/removed behavior) → **major** (`X+1.0.0`)
  - new user-facing feature → **minor** (`x.Y+1.0`)
  - fix / perf / refactor only → **patch** (`x.y.Z+1`)
- The current value carries a `-beta` suffix. State whether the proposal drops it; only drop `-beta` if the user confirms.
- Present the proposed version (one line) and confirm before editing.
- On confirmation, edit only the `appVersion` string in `nuxt.config.ts`.

### 3. Build

- `pnpm run generate:prod` — uses `.env.production` and outputs `.output/public` (what Hosting serves). **Do not use `pnpm run build`** for a prod deploy (wrong env).
- If the build fails, abort and report.

### 4. Firestore rules / indexes check

- Check whether `firestore.rules` or `firestore.indexes.json` changed since their last deploy (`git log -1 --oneline -- firestore.rules firestore.indexes.json` and working-tree diff).
- If either changed: **stop and ask the user explicitly** before running `pnpm run deploy:rules` and/or `pnpm run deploy:indexes`. Index builds are heavy and prod-affecting. Never bundle them silently into the hosting deploy.
- If unchanged: skip — deploy hosting only.

### 5. Deploy

- Run `firebase deploy --only hosting`.
- If it fails with an auth error, the CLI is not logged in — report it and tell the user to run `! firebase login` in the prompt, then re-invoke. Do not attempt interactive login yourself.

### 6. Final gate — verify the new version is served (blocking)

- `firebase deploy` reporting "complete" is **not** sufficient proof. Confirm the live site actually serves the new bundle.
- `curl` the prod URL and assert the new version string is present **and the previous version string is absent**:
  - `curl -s "https://hyfinances-1532e.web.app/?cb=$(date +%s%N)"` then grep for the new version.
- The version lives in the prerendered **`index.html`** payload (`window.__NUXT__` → `appVersion`), **not** in the `/_nuxt/*.js` chunks. Grep the HTML, not the JS.
- Pass only when the new version count is ≥1 and the old version count is 0. If the old version still serves (CDN cache lag), wait and re-curl before declaring success; do not claim the deploy is live on a failed grep.

### 7. Post-deploy

- Report: the deployed version, the `firebase deploy` summary, the live URL (`https://hyfinances-1532e.web.app`), and the step-6 grep result (new present / old absent).
- Tell the user to hard-refresh and confirm the version label in the sidebar footer (`AppVersionLabel`) matches the deployed version.

## Git

- This skill performs **no git operations** (user's choice). The `appVersion` edit and any other working-tree changes stay uncommitted.
- State in the post-deploy report that the deployed state is **not tracked in git** — the user manages commit/push/merge separately.
