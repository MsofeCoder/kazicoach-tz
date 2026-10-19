# Corrective mobile UAT — 2026-10-19

Environment: feature/kazicoach-v2; isolated local Supabase at 127.0.0.1:57421; app at 127.0.0.1:5173; requested browser viewport 390 × 844 (observed CSS layout width 375 after browser chrome/scrollbar). Existing private workspace was preserved. Disposable Basic/Plus learners were used to avoid altering prior owner UAT data.

The owner acknowledged the previous 8/8 mobile UAT results. The pre-existing `docs/uat-review-2026-10-19` screenshots remain untouched and untracked; they are historical evidence, not a rerun of these corrections.

| Changed-feature case | Result | Evidence |
| --- | --- | --- |
| Free Settings voice options | Pass | DOM contains male/female/soft/deep, no mixed; saved mixed preference displays Female fallback; `01-free-voice-options.png` |
| Basic Settings, oral and written voice options | Pass | All three selectors have the four permitted styles; oral practice remains usable with Interview coach identity; `02-basic-practice.png` |
| Package card order and WhatsApp targets | Pass | Mobile DOM has Basic before Plus; both links use admin-managed 255688010595, selected package/price/duration, no-referrer and noopener/noreferrer; no horizontal overflow observed |
| Sign-out and second user's email | Pass | Basic sign-out produces empty email input; typing the disposable Plus email yields that address alone, without appending. Password is also cleared; account-specific forms remount on identity change. DOM inspection plus `03-signout-empty-email.png` (viewport shows lower part of login form) |
| Physical phone: Basic and Plus WhatsApp | **Owner verified pass** | Owner opened both supplied links and replied “Both open with the correct recipient and package.” No message was requested or sent by the agent. This verifies recipient/package handoff on a real phone, not a complete paid activation |
| Plus Settings and five-member oral/written panel after correction | Pending browser access | Unit tests preserve all five styles for Plus and existing panel code remains; interactive test was blocked before Plus sign-in |
| Admin package editor order and contact field on mobile | Pending browser access | Both use the same tested explicit Basic/Plus sort; contact input is initialized from settings. Rendered screenshot still needed |
| Plus → sign-out → Free saved-mixed fallback | Pending browser access | Unit-tested fallback in Settings, selector and speech runtime; end-to-end transition still needed |

## Tool interruption

After the completed Free/Basic/sign-out cases, browser calls returned “Local browser use is disabled in Work settings.” The owner then reported enabling it; a fresh read-only observation still returned the same error. This is a browser-tool blocker, not a failing application assertion. No alternate browser automation or fabricated screenshots were used. Temporary browser viewport reset could not be executed while access remained disabled.

## Remaining review steps

Once browser access is restored: run `node scripts/mobile-uat-fixtures.mjs` to create fresh disposable accounts; sign in to the Plus account listed in ignored `.local-review/mobile-uat.json` using the local demo password; verify Settings mixed selection, oral five-person roster and written panel; sign out and confirm the four-style fallback; sign in as local owner and inspect Basic/Plus editor ordering and business contact. Capture fresh screenshots, clear the viewport override, and remove only the disposable UAT learners with `node scripts/mobile-uat-fixtures.mjs --cleanup`. Existing owner/learner/other review accounts and prior testimonials must remain untouched. The disposable learners from this interrupted run were cleaned up after evidence capture.

Account IDs and emails used for testing are synthetic local fixtures. No customer data was transmitted to WhatsApp. No hosted service, billing, merge or deployment was enabled.
