# Multi-device resume safety

## Reproduced defects

The production JavaScript module reproduced a rollback without a real account:
an iPad's independent pending edit was merged with server revision 1, then with
revision 2. Because the baseline still described revision 0, the value imported
from revision 1 was treated as a new local edit and replaced revision 2. The same
failure occurred during consecutive compare-and-swap save conflicts.

Resume validation also updated in-memory state without repainting the active
view. Its 120 ms debounce left a window for a delayed autosave to start before
validation. A save already awaiting token refresh needed another gate check.

These are code-level reproductions, not a forensic attribution of the reported
account incident. No real account data was changed or restored during testing.

## Resulting behavior

- Focus, visibility, online and page-show events close the save gate immediately.
  Saving resumes only after a successful full database read. Failed reads retry
  automatically with backoff capped at 30 seconds while the app is visible.
- The accepted server revision and its immutable merge baseline advance
  together, including successive conflict retries and deferred merges.
- On wake, conflicting task text, schedule values and other ordinary fields
  prefer the committed database version. Independent unsaved edits survive.
  This also applies when pending edits resume after a complete app restart.
  Existing task completion/lifecycle protections remain in force.
- Pending local state is captured in the account-scoped `.suspendedRecovery`
  snapshot before resume validation. It is a best-effort recovery record,
  subject to browser storage availability; it is never uploaded automatically.
- The active view repaints after validation. Pending text-entry merges retain
  their existing deferred behavior until editing finishes.
- A clean device cannot upload a complete state merely because an old save
  callback runs. Authentication completion rechecks the resume save gate.
- Safari storage failures retain an immutable runtime baseline. A durable
  baseline revision marker prevents an obsolete disk copy from authorizing a
  pending upload after restart. Unverifiable pending data is preserved for
  recovery before the authoritative database state is displayed.
- Pending snapshot validity is recorded separately from dirty metadata, so a
  failed primary snapshot write cannot give an older cached state authority to
  overwrite the database after restart.

The API's conditional PATCH on `updated_at`, database RLS, destructive-overwrite
guard and revision archive are unchanged. No database migration is required.

## Verification

`node tests/multi_device_resume_regression.js` executes the production module
with fixture HTTP and browser rendering substituted. It covers repeated server
revisions, repeated save conflicts, same-field wake conflicts, record removal,
an authentication/resume race, failed resume reads and baseline quota failures.

`tests/browser/multi-device-resume.spec.js` uses isolated browser contexts and
the test HTTP store. It checks immediate gating, repainting and three devices:
an offline iPad edit, a newer conflicting Mac edit, an independent phone edit,
then iPad wake and a fresh reload.

For physical-device acceptance, open the same account on all three devices,
sleep the iPad, edit and confirm saving on the Mac and iPhone, wake the iPad,
then check the latest task text, completion and appointments on all devices.
Repeat with a temporarily unavailable network and an unsaved iPad edit.

Claude review was attempted through the installed app. Native access was blocked
by the Mac lock screen and automatic unlock failed; no Claude review result is
claimed.
