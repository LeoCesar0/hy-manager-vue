---
status: resolved
type: smell
severity: low
found-during: "discussion about merging Dashboard and Reports pages"
found-in: "src/composables/useDashboardAnalytics.ts"
working-branch: "main"
found-in-branch: "main"
date: 2026-04-05
updated: 2026-04-05
resolved-date: 2026-04-05
discard-reason:
deferred:
---

# Debug `console.log` left in `loadData`

## What was found
A leftover debug log runs on every dashboard load:

```ts
console.log('❗ loadData reportRes -->', reportRes);
```

## Where
`src/composables/useDashboardAnalytics.ts:191`

## Why it matters
Ships noise to production console, can leak report shape in shared browsers, and is easy to forget. Low severity but should be removed unless it's actively being used for debugging.

## Suggested approach
Remove the line. If the user is actively debugging report fetches, leave it and re-open this observation later.

## Resolution
Resolved on 2026-04-05. Deleted the debug line in `useDashboardAnalytics.ts` (the blank line that held the log was also removed). User confirmed they were fine with cleanup as part of the Relatórios enrichment batch.
