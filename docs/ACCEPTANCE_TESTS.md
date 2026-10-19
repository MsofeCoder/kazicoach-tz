# Acceptance Tests
- Guest can complete existing interview/written practice without login or network.
- Existing local workspace remains readable after upgrade; no silent uploads.
- Registered A cannot read or mutate B's profile, progress or testimonials.
- Anonymous visitor cannot read private rows.
- User cannot grant themselves premium or admin rights.
- Entitlements are checked by trusted backend on premium operations.
- Offline changes sync once after reconnection without duplicates.
- Conflicting updates have deterministic, documented resolution.
- Testimonial stays private until moderator approval and can be withdrawn.
- Account deletion and export work as documented.
- All repository checks pass and local preview is usable on desktop/mobile.
- No push/merge/deploy occurs before approval.

## Local evidence
The original acceptance list above remains the rollout target. Automated and manual evidence, plus unverified launch items, are recorded in [STATUS.md](STATUS.md). Review cases and exact commands are in [LOCAL_PREVIEW.md](LOCAL_PREVIEW.md). The owner's approved five-question guest trial supersedes unlimited guest practice in the original draft; core materials/storage/export remain private and available.

Passing local tests is not production approval: hosted recovery, retention, paid offline-content enforcement and live AI provider behavior remain open. No production project has been connected.
