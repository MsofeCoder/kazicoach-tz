# Visual interactive onboarding — 2026-10-23

Replaces the text-focused guide with a responsive illustrated walkthrough. Desktop presents an interactive preview beside the explanation; narrow screens stack them with a persistent footer. Labelled step navigation, completion indicators, Continue/Back, replay, page shortcuts and Escape dismissal remain available. Reduced-motion and visible keyboard-focus styles are included.

Each step includes a local interactive example: a preparation roadmap, CV/job-brief/notes selector and preparation flow, oral/written preview with answer-structure reveal, improvement-topic selector, and private/optional-account diagram. Examples are explicitly labelled and cannot upload, record, call services, create accounts, award XP, alter saved study data or consume trial questions. New example state resets on step changes; existing storage/recovery safeguards remain intact.

Automated checks: 79 tests / 11 suites pass; application/Functions TypeScript and ESLint pass. Default and hosted builds, smoke and release artifact scans pass. No dependencies or lockfile changed, so dependency installation was not repeated. No backend/schema/entitlement change was made and hosted fixture mutation was not repeated.

Local browser acquisition failed on an unavailable/error page, then the browser policy refused observation of that page. No alternate browser, raw CDP or policy bypass was used. This is not a passing local visual test. The existing authorized HTTPS staging target remains the delivery target; no production launch or billing enablement is included.

## Final deployed evidence

Implementation `6dfa287`, Cloudflare staging deployment `b0a78a87`: <https://staging.kazicoach-tz-441.pages.dev/>. Actual HTTP verifies the page, compiled interactive preview and intended hosted CSP; see `deployed-http.json`. Build inventory/hashes are in `release-audit.json`. No hosted database settings, identities or records were changed by this update.

The first upload timed out; the retry succeeded. Browser transition testing then caught duplicate React sibling keys retaining an old preview. The follow-up commit assigns distinct preview/copy keys; the corrected artifact was rebuilt, scanned and deployed. Exactly one preview was observed after transitions. Initial deployment `8b6f57e7` is not an approved rollback target.

Actual HTTPS staging browser checks:

- Desktop 1280 × 900: split layout; all five steps; document-type switching and preparation-flow reveal; oral/written switching and answer-structure reveal; improvement-topic switching; private/optional-account diagram and copy switching.
- Mobile 360 × 800: stacked layout, working step links/options, persistent footer and no horizontal dialog overflow (309px client width equals scroll width). Mobile screenshots capture welcome, practice and account choice.
- Direct Practice shortcut opens the real room with all five trial questions remaining. Replay returns to welcome; Escape closes the guide. No captured browser warning/error messages during final checks.
- Existing cached shell required a subsequent reload to pick up the update. No browser data was cleared. Temporary viewport overrides were reset.

Screenshots: `desktop-prepare.png`, `desktop-practice.png`, `desktop-welcome.png`, `mobile-welcome.png`, `mobile-practice.png`, `mobile-account-choice.png`. These are actual rendered browser captures, not physical Samsung acceptance or generated mockups. No current physical-device pass is claimed.

Rollback: use the prior compatible onboarding artifact (`f4d7be5`, staging deployment `44deab20`) or revert this frontend implementation and rebuild for the correct origin. Preserve `kazicoach-tz:v1` and the separate dismissal marker. Work stays on `feature/kazicoach-v2`; master is unchanged.
