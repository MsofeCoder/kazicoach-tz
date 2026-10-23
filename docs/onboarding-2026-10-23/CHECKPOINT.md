# Visual interactive onboarding — 2026-10-23

Replaces the text-focused guide with a responsive illustrated walkthrough. Desktop presents an interactive preview beside the explanation; narrow screens stack them with a persistent footer. Labelled step navigation, completion indicators, Continue/Back, replay, page shortcuts and Escape dismissal remain available. Reduced-motion and visible keyboard-focus styles are included.

Each step includes a local interactive example: a preparation roadmap, CV/job-brief/notes selector and preparation flow, oral/written preview with answer-structure reveal, improvement-topic selector, and private/optional-account diagram. Examples are explicitly labelled and cannot upload, record, call services, create accounts, award XP, alter saved study data or consume trial questions. New example state resets on step changes; existing storage/recovery safeguards remain intact.

Automated checks: 79 tests / 11 suites pass; application/Functions TypeScript and ESLint pass. No dependencies or lockfile changed, so dependency installation was not repeated. No backend/schema/entitlement change was made and hosted fixture mutation was not repeated. Build, smoke, artifact and deployed browser evidence are recorded below when completed.

Local browser acquisition failed on an unavailable/error page, then the browser policy refused observation of that page. No alternate browser, raw CDP or policy bypass was used. This is not a passing local visual test. The existing authorized HTTPS staging target remains the delivery target; no production launch or billing enablement is included.

Rollback: use the prior compatible onboarding artifact (`f4d7be5`, staging deployment `44deab20`) or revert this frontend implementation and rebuild for the correct origin. Preserve `kazicoach-tz:v1` and the separate dismissal marker. Work stays on `feature/kazicoach-v2`; master is unchanged.
