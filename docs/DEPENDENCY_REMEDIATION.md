# Dependency review — 2026-10-19

Status: reviewed; no breaking dependency changes made. The three moderate findings remain visible in `npm audit`. No suppressed advisories, forced downgrade, unreviewed override or hand-edited vendor files were introduced.

## Findings and reachability

The installed graph is `mammoth@1.12.1 → argparse@1.0.10 → sprintf-js@1.0.3`. These are three audit entries propagated from one underlying advisory, not three independent vulnerabilities. The [reviewed sprintf-js advisory](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) identifies an availability failure when an attacker controls excessive numeric precision in a formatting string; it currently lists no patched version.

Local inspection finds the `argparse` import in `node_modules/mammoth/bin/mammoth`, the package's command-line executable. KaziCoach imports `mammoth/mammoth.browser` and calls `extractRawText({ arrayBuffer })`; it never invokes that executable or accepts a format string for it. Searches of the prebuilt browser reader and application JavaScript bundles found no `ArgumentParser`, `argparse`, `sprintf-js` or `sprintf.parse` markers. The smoke check now guards those markers in built JavaScript. This supports a **currently unreachable application path** assessment; string scans do not establish the absence of every possible vulnerability.

This distinction does not erase the installed-package finding. Build/development systems still install the vulnerable CLI dependency. Do not run the Mammoth CLI against user-controlled arguments, add it to a server upload route, or expand the browser import into the Node CLI path. Source reference: [Mammoth CLI](https://github.com/mwilliamson/mammoth.js/blob/master/bin/mammoth).

## Safe remediation sequence

1. Keep the current lockfile and browser-only extraction path for this corrective increment. Preserve the existing 8 MB input limit, plain-text extraction and error handling. Continue displaying the moderate findings in the checkpoint.
2. At the next dependency review, inspect the upstream advisory and Mammoth release/dependency graph. If an upstream compatible release removes or patches the vulnerable chain, update in a separate branch commit with a reviewed lockfile diff. Do not assume a newer sprintf-js within the affected range fixes this issue.
3. Validate a compatible candidate against synthetic DOCX fixtures covering paragraphs, tables, Unicode/Kiswahili text, empty files, damaged archives and oversized input rejection. Compare extracted text with the current reader. Verify local-only processing, error fallback, bundle contents, offline reading, size and all repository checks.
4. If no compatible upstream fix exists, propose an upstream patch or a maintained parser replacement separately. A replacement requires a documented equivalence corpus, accessibility/privacy review and owner acceptance before adoption. A browser-worker parser with resource/time bounds is a separate resilience improvement; it is not a substitute for fixing this advisory.
5. `npm audit fix --force` currently proposes Mammoth 0.3.29, a major downgrade. Do not apply it: it can break existing DOCX processing and is not evidence that the underlying modern feature set is secure. Do not force argparse 2.x across its incompatible CLI API merely to alter the audit count.

Owner decision requested before public rollout: accept the documented short-term unreachable-path risk or require the compatible upstream/parser remediation first. Billing and hosted services remain disabled/unmodified regardless of that decision.

Reproduce with `npm audit --json`, `npm ls mammoth argparse sprintf-js`, `npm run build` and `npm run smoke`. An audit nonzero exit is expected while findings remain.
