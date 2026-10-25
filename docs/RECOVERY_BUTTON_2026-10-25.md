# Password recovery entry point — 25 October 2026

Replaced the easily overlooked disclosure below the account card with a visible Forgot password? button inside the signed-out account card, directly after authentication controls and before testimonials. It opens a labelled Reset your password form, prefills the email already entered, focuses the email input, explains same-browser link handling and displays Send reset link / Sending status. Button is non-submitting and exposes expanded/control attributes. Existing reset request, callback validation and privacy-preserving response remain unchanged.

Verification: 84 tests in 11 suites, app/Functions types, ESLint, build and smoke all pass. git diff --check passes. No new dependency or backend change: npm ci and database integration suites were not repeated. Local browser verification was attempted but the tool reported local browser use disabled in Work settings; no UI/visual pass is claimed for this increment. Owner can preview via npm run dev -> http://127.0.0.1:5173/ -> Settings -> Forgot password?. Check keyboard activation, initial email, focus, mobile wrapping and real hosted recovery after staging release. No reset email sent by the agent.

Local source change only on feature/kazicoach-v2; no push, merge, deployment or hosted mutation. Prior user screenshots show confirmation email arrived and account sign-in worked after SMTP IP authorization; full recovery success and owner MFA remain unverified.

Rollback: revert this isolated frontend commit and rebuild. No database rollback needed. Preserve the browser workspace and account configuration. Reverting code does not authorize deployment.
