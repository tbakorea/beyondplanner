# Five-week Sunday upgrade roadmap

Authorized on 2026-11-27. The user requested one incremental upgrade each Sunday
for five weeks, careful review to prevent regressions, and commit/push of verified
changes. The user is satisfied with the current opening speed; preserve it.

Repository: `/Users/jeongdaepyo/projects/Planner/비욘드 플래너`

Schedule: Sundays at 09:00 Asia/Seoul, from 2026-11-29 through 2026-12-27.
Initial product baseline: `e5c4440` (opening v3, clearer save clock).

## Release sequence and progress

| Step | Earliest Sunday | Scope | Status |
| --- | --- | --- | --- |
| 1 | 2026-11-29 | Measure performance and remove proven redundant work | Planned |
| 2 | 2026-12-06 | Simplify Today, navigation and settings | Planned |
| 3 | 2026-12-13 | Split JavaScript/CSS and lighten feature loading | Planned |
| 4 | 2026-12-20 | Optimize input, row updates and repeated calculations | Planned |
| 5 | 2026-12-27 | Cross-device acceptance, regressions and final polish | Planned |

For every run, add a dated entry below recording scope, the starting commit,
evidence, changes, checks, outstanding issues and deployment outcome. Use one
release commit with the title prefix `Upgrade step N:` so it can be located
without embedding a commit's own hash in its contents. Mark a step Released
only when its implementation and required checks passed and its commit was
pushed; report production deployment verification separately and accurately.

## Common constraints

- Read `AGENTS.md` and `docs/mobile-qa-routine.md` before work. Fetch and inspect
  current Git history and worktree state. Preserve unrelated or unfinished work;
  isolate the release when necessary. Never force-push or discard user edits.
- Do at most one roadmap step per Sunday and never advance before its earliest
  date. Repeated triggers on the same Sunday must not produce another release.
  If a preceding step is unfinished, continue that step instead of skipping it
  or combining several steps into one large update.
- Maintain today's satisfying opening speed. Preserve immediate entry when
  canonical database data is ready, silent inline video, poster fallback and
  reduced-motion behavior. Add no mandatory video dwell time. Assess cold and
  warm startup separately; compare the same fixtures, browsers and conditions.
- Keep planner data authoritative in the server/database. Inspect API/Supabase
  paths before persistence changes. Preserve task IDs, completion, deletion,
  recurrence, carryovers and genuine pending edits. Protect against stale device
  resumes, repeated conflicts and out-of-order responses. Use isolated fixtures;
  do not manipulate a live account or perform destructive data migrations.
- Keep Money, projects, coaching and existing records accessible. Simplification
  means clearer hierarchy and fewer competing controls, with appropriate entry
  points for advanced features. Do not silently remove existing capabilities.
- Keep each change small enough to review. Review the final diff, run JavaScript
  syntax checks and `git diff --check`, and select meaningful regression tests
  for the changed paths. After persistence/merge changes run the JavaScript
  regression suites and Python state/atomic-save tests. For layout/input/loading
  changes test iPhone 390x844 and 430x932, iPad 768x1024, desktop Chrome and Mac
  Safari/WebKit. Include landscape when affected. Verify real fixture save,
  reload and independent browser contexts where relevant.
- Treat existing boot-brand tests, startup-with-history tests, resume/conflict
  tests and save/restore tests as release protections. Use available local
  browser binaries or the supported CI workflow; do not claim physical-device
  testing when only browser emulation was performed.
- A performance target is a measured result, not an unsupported percentage.
  Reject an opening-speed regression or an unresolved data-safety failure.
  Fix and retest, or preserve the candidate separately and withhold release.
  Do not push unverified product changes or label an incomplete step complete.
- The user authorized commit/push for these weekly upgrades. Once required
  checks pass, commit and push the scoped change to the normal deployment
  branch without another permission question. Verify the deployed release at
  `https://beyondplanner.vercel.app` without writing production fixture data.
  Report changes, checks, measured effects, commit and any actual blockers.

## Step details

1. **Performance baseline.** Measure database readiness, first usable Today
   frame, section navigation, checkbox/priority feedback, request counts and
   asset loading with representative short and accumulated histories. Separate
   network time from computation and rendering. Inspect the existing lazy
   loading before proposing it again. Remove only redundant work supported by
   measurements. Record comparable results for later steps.
2. **Simpler interface.** Keep priorities and schedule central on Today. Reduce
   competing banners and repeated controls. Group weekly/monthly navigation and
   optional settings coherently; explore Today/Memo/Calendar/More only where it
   improves actual flows. Keep due Money work and urgent project decisions
   visible in their daily context. Preserve reachable controls, text editing,
   familiar page movement and access to all existing records.
3. **Lighter loading.** Split large JavaScript/CSS bundles by responsibility and
   view in reviewable increments. Extend the lazy rendering already present.
   Keep required Today dependencies ready before interaction and load advanced
   code on demand. Validate cache invalidation and optional-load failures.
   Preserve canonical startup semantics; do not revive the old partial-state
   or timestamp/cache mismatch issues to save a request.
4. **Faster interaction.** Extend existing immediate checkbox/priority feedback
   to remaining relevant actions. Update affected rows/sections instead of
   rebuilding unrelated views. Cache repeated analysis with explicit invalidation
   on edits and new server revisions. Preserve Korean composition, focus, scroll,
   schedule merging, completion counts and verified save indicators.
5. **Release acceptance.** Verify the preceding four steps together. Exercise
   cold/warm starts, large histories, editing/completion, recurrence/carryover,
   schedule operations, Money/projects, pending edits, offline recovery and
   three independent device contexts. Compare final measurements to step 1.
   Address demonstrated regressions and document remaining limitations and
   the product changes. Use actual reports and evidence rather than inventing
   usage telemetry or making an unrelated redesign.

## Completion and missed runs

The automation is bounded to these five Sundays and must not become permanent
weekly development. After the final scheduled run, or when all five steps are
released, delete its automation using the Automations tool. If an earlier step
could not safely ship, the final run must list the unfinished work and reasons;
do not compress it into an unsafe catch-up release or silently extend the plan.
If invoked outside the planned dates, do no product upgrade; report a material
schedule problem if needed and stop/delete an expired automation. Check recorded
releases before work so a retry cannot repeat an already completed step.

## Run log

- 2026-11-27: Roadmap prepared. No upgrade step executed yet. Existing opening
  speed and the current brand/save-clock designs are the protected baseline.
