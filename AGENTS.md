# Beyond Work Planner Agent Guide

## Product Bar

- Build for paid-release quality, not prototype quality.
- Keep the visual direction Nordic minimal: restrained color, clear hierarchy, generous but efficient spacing, and no decorative clutter.
- Treat mobile iPhone layouts as first-class. A change is not complete if it only looks correct on desktop.
- Preserve the planner's core value: daily priorities, schedule, weekly focus, Money, projects, sheets, and AI coaching must feel connected rather than like separate tools.

## Data Rules

- The app is a web app backed by the database. Do not describe normal product behavior as device sync, local backup, or manual synchronization.
- User-visible planner data must be read from and saved to the server/database path whenever the user is logged in.
- Local cache may be used only as a temporary boot/loading aid. It must not become the source of truth.
- Before changing save/load/restore logic, inspect the existing API and Supabase paths and explain the data-safety impact.
- Never add destructive cleanup, migration, or overwrite behavior without a clear recovery path.

## UI Rules

- On phone-sized screens, test for clipped headers, hidden buttons, overlapping title rows, tiny tap targets, and bottom content cut off by the viewport.
- Keep key controls reachable without forcing horizontal guessing. If horizontal scroll is used, make it intentional and visually clear.
- Prefer one clear gesture per job. Do not let vertical scrolling trigger page navigation.
- Keep AI buttons visually consistent and position them inside section title rows unless there is a strong reason not to.
- Avoid repeated empty rows, oversized forms, and full-sheet popups for single-item entry.

## Development Workflow

- Read the existing implementation before editing.
- Keep edits scoped to the user's request.
- Use `rg` for search and `apply_patch` for manual file edits.
- Do not revert user changes or unrelated work.
- After UI or behavior changes, run `git diff --check`.
- For JavaScript changes, run a syntax check if a Node runtime is available.
- For mobile UI changes, follow `docs/mobile-qa-routine.md` before reporting completion.

## Commit Policy

- Commit and push only when the user explicitly asks, including shorthand such as `ㅋㅍ`.
- Commit messages should be concise and describe the product-visible change.
