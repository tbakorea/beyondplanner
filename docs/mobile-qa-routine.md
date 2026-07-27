# Mobile QA Routine

Use this checklist before finishing any Beyond Work Planner change that touches layout, navigation, daily planning, settings, Money, projects, sheets, or AI coaching.

## Viewports

Check at least:

- iPhone compact: `390 x 844`
- iPhone large: `430 x 932`
- iPad portrait: `768 x 1024`
- Desktop: `1366 x 900`

## Startup

- App opens with the last cached content or a polished boot state, then refreshes from database.
- No blank white screen appears during normal startup.
- Header, main menu, coaching icon, and mode controls do not overlap.

## Today Section

- Date row and pulse/banner row do not overlap.
- Weekly / Today / Memo movement progresses one panel at a time.
- Vertical scrolling never jumps to Weekly or Memo.
- Top Tasks and Schedule title rows remain visible in expanded mode.
- Expanded mode returns using the intended control only.
- Task input does not lose typed characters, close unexpectedly, or reorder unexpectedly.
- Check states preserve black text and use red line/check only where intended.
- Schedule merge, split, delete, and undo controls work and do not overlap schedule text.

## Calendar

- Every calendar starts on Sunday.
- Dates use year/month/day/weekday order.
- Year and month controls remain reachable on phone.
- Selecting a date opens the intended daily page only through the defined action.

## Settings

- User Settings separates required basics from optional details.
- App Settings groups controls by workflow, display, and operations.
- No duplicated menu labels, especially Money.
- Logout, language, export/import, and approval controls are easy to find.

## Money

- Amounts use thousands separators.
- Repeating Money items appear in daily priorities only when their date is due and within the intended window.
- Editing an existing row does not create duplicate daily tasks.

## Data Safety

- Logged-in user data loads from the database-backed API.
- Local cache is treated as display cache only.
- Any change touching data persistence is tested with save, reload, and cross-session read behavior.

## Final Checks

- Run `git diff --check`.
- Confirm changed files are limited to the intended scope.
- If a browser test was not possible, state that explicitly in the final answer.
