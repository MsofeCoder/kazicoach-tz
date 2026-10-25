# Real-page onboarding tour — 2026-10-25

Replaces the illustrated example dialog with seven guided stops on the actual workspace: Today, Materials import, local question builder, Practice mode, Progress, optional accounts and local backup. Each stop navigates to its page, scrolls smoothly to the target and highlights it beside an explanation card. Desktop places the builder explanation opposite the feature; mobile uses a bottom sheet with a clipped, visible spotlight above it. No dependency was added.

Next/Back, labelled direct-step navigation, Skip/Close/Escape, Explore and Finish are available. A native modal keeps focus inside the explanation and prevents accidental background actions. Reduced-motion preferences disable transitions and use instant scrolling. An existing workspace or account callback is not automatically interrupted. The original page stays mounted while touring so closing restores its unsaved form state and scroll position. Oral timing pauses and active speech stops while the guide is open; microphones are never started automatically. Explore intentionally leaves the tour on the selected page.

Browser evidence (actual local app, not staging or physical-device acceptance):
- Desktop 1280x900: actual Materials and Practice navigation, full import-area spotlight, builder highlighted on the right with the card on the left, Explore opens Practice.
- Mobile 360x800: actual Practice/Progress/account/backup navigation; spotlight and bottom sheet fit inside the layout viewport after accounting for the scrollbar. Finish leaves Settings open with focus returned to the page.
- A synthetic unfinished answer survived replay, navigation to Progress and Close back to Practice. The synthetic text was subsequently cleared without scoring. Escape closes and returns to Practice. The free trial remained at five questions, XP/attempts stayed zero; no upload, registration, export, reset, provider call or account mutation was performed by the tour.
- Browser warning/error capture returned no entries. Temporary viewport overrides reset. Screenshots: desktop-materials.png and mobile-backup.png.
- Browser testing found and corrected inert-page scrollIntoView behavior and a route-commit timing race before final verification.

Verification: 84 tests in 11 suites pass (including five spotlight/target regressions). Application and Functions types, ESLint, build, smoke and release-artifact scans are recorded for this increment. No dependencies/lockfile/schema/backend rules changed, so npm ci and database/Auth integration suites were not repeated. Existing database authorization evidence remains historical, not newly claimed. Physical-phone and hosted acceptance remain pending.

Preview: npm run dev, open http://127.0.0.1:5173/, choose Show me around from the menu or Settings. This increment is local only: no push, merge, staging/production deployment or hosted configuration changes.

Rollback: revert the isolated tour commit on feature/kazicoach-v2 and rebuild the frontend. This restores the previous illustrated guide; no database rollback is required. Preserve kazicoach-tz:v1 and the existing separate guide dismissal marker. Reverting code does not authorize a deployment.
