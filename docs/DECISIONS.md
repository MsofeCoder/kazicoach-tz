# Product decisions — approved 2026-10-19

Approved directly by the owner in this chat:
- Free: no account required, five-question browser trial, own preparation-material uploads and a professional upgrade invitation. Preserve the private workspace.
- Premium Basic: TSh 3,000 / 7 days; unlimited local practice subject to abuse controls, personalized questions, oral/written practice, feedback, progress and gamification.
- Premium Plus: TSh 5,000 / 7 days; Basic plus five-member panel, detailed analysis, improvement recommendations, advanced progress and achievements.
- Owner is the initial sole Super Admin. Trusted administration manages access, prices, durations, trial limits, contact settings and moderated testimonials; record important actions in an audit trail.
- No gateway. WhatsApp contact and payment verification happen outside the app. Super Admin manually activates a package; access expires automatically. Billing remains disabled until implementation approval.
- Local tests and free/open-source tooling first. No master edits, merge, deployment or hosted Supabase changes.

Engineering choices for review, configurable where applicable:
- A trial question is counted when an oral or written answer is scored. Browser trial usage survives the in-app workspace reset; clearing browser storage resets it. Anonymous, offline clients cannot offer tamper-proof quotas.
- Existing v1 data is preserved; the v2 trial starts with zero usage on upgrade. Private study/materials/export remain available after the trial. The 5th score is visible in Progress when the upgrade invitation appears.
- The initial cloud abuse ceiling is 100 requests per Dar es Salaam day per account, editable by Super Admin. Local practice has no daily ceiling. Failed/invalid cloud requests may consume a quota slot once access is checked.
- Activating a package replaces its current grant and starts a fresh duration from verification time. Price/duration changes affect subsequent activations. Revocation is immediate for backend operations; offline UI rechecks cached expiry locally and refreshes access after reconnection.
- Summaries sync explicitly; unique attempt IDs are immutable and first accepted write wins. No score, XP or badge represents verified certification or hiring eligibility.
- No production administrator has been assigned. Synthetic local owner is exclusively a review fixture. Production ownership must be verified out of band.

Still required before hosted rollout:
- Real owner account identity, WhatsApp contact number, account recovery and email delivery; moderator delegation/recovery procedure.
- Retention and deletion rules for audit IDs, backups and browser queues; age/eligibility and consent wording.
- Production abuse policy, content generalization, hosting/budget, remote schema compatibility and explicit migration/deployment approval.
- Strong enforcement of paid downloadable/offline content would require a different distribution/licensing design: client-side bundled questions and algorithms cannot be securely paywalled. Hosted AI/Plus analysis are enforced by Postgres; local UI gating is advisory.
