# Password visibility control — 25 October 2026

Added a reusable password field with an eye button for sign-in/registration and both recovery password fields. Passwords are masked by default. The button toggles text visibility without submitting, has an accessible Show/Hide label and pressed state, and supports keyboard activation. Leaving the field group or clearing its value masks it again. Password policy, account requests and storage remain unchanged.

Verification: 84 unit tests pass; application/Functions TypeScript, ESLint, build and smoke pass. Actual local browser checks verified password -> text -> password, Space activation and masking after focus leaves. Mobile 360x800 layout inspected: 44px eye button stays inside the field and account actions wrap correctly. Only synthetic text was entered, then cleared; no credentials or account submissions were used. Screenshots desktop.png and mobile.png show empty fields. Recovery uses the same component; no live recovery link was exercised. No new dependencies, so npm ci was not repeated. No database or Auth behavior changed; database suites were not repeated.

Local preview: http://127.0.0.1:5173/ -> Settings. Source stays on feature/kazicoach-v2. No push, merge, deployment or hosted mutation. This UI change does not resolve the staging registration failure shown by the owner; hosted SMTP/IP diagnosis remains pending. No production-readiness claim is made.

Rollback: revert this isolated frontend commit and rebuild. No schema migration or stored-data change is required. Retain browser-private data. A source rollback does not authorize deployment.
