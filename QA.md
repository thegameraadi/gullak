# Gullak release review — 5 October 2026

This release adds visible amount sliders, synced USD/INR settings, voice entry, Gullie, a new monogram, and public login / signup / guest entry.

## Product and data checks

| Surface / action | Review |
| --- | --- |
| Anonymous welcome / Login / Create an account | Public SSR shows all three entry choices. Both account choices navigate through the platform-owned ChatGPT flow; first authenticated account load creates a user-specific record. Auth flow wiring is checked; live authentication is not browser-tested. |
| Continue as guest / reload / another device | Device-local snapshot, empty starting dashboard, independent storage, strict backup validation. Guest finances never call the account or assistant API. |
| Guest tabs / duplicate save / storage failure | Version conflicts, Web Locks where supported, retry deduplication, quota/error recovery. Corrupt data is preserved for export. |
| Guest → account | Settings offers explicit replacement review and backup download. Guest data is not automatically uploaded. |
| Goals / History / logo home / menus | Reviewed navigation handlers, state-dependent enabled controls, phone tabs, and accessible button labels. |
| New / edit goal | Amount plus always-visible slider; automatic category/icon; voice text is reviewed and fills editable fields. |
| Record income / add savings / allocate / release / withdrawal | Shared finance domain enforces integer USD cents, source selection, available caps, and accounting invariants. Sliders are visible under amount fields. |
| Split / suggested split / range expansion | Pool caps, unfinished goal caps, exact cents, remaining available balance, and deliberate confirmation. |
| Progress / ETA / confetti | First-deposit ETA, future-entry exclusion, reset marker, target milestones, one-time completion celebration. |
| Bought it / delete goal | Purchase confirmation gate, why MCQ, actual cost, paired leftovers, WINS / LOSSES math. |
| History edit / delete / reset | Rebuild ledger, dependent transaction rejection, purchase group handling, correct WINS and LOSSES updates. |
| Reset scopes | Five scopes, explicit confirmation, backup option, no automatic destructive assistant execution. |
| Currency / refresh / failed feed | Settings defaults USD; switch to INR fetches latest published reference rates. Global balance display, input choices, original amounts, rate date, and USD canonical amounts are preserved. Feed updates daily, not intraday. |
| Theme / logo | Light/dark/system theme; G dollar monogram follows system appearance independently. Light/dark SVG and PNG app-icon assets. Browser icon URLs refresh on system changes. iOS may retain the icon installed on Home Screen; native automatic replacement is not guaranteed. |
| Backup / restore | Validated bounded JSON; replacement review; guest/account copies exportable. |
| Gullie ask / voice / summaries / expansion / read aloud | Read-only assistant endpoint; speech API feature detection, editable recognized text, no auto-save, explicit read-aloud request, stop reading, clear chat. |
| Gullie review / cancel / save / disabled | Domain preview shows balance impact. Stale proposals disabled. Every write uses the existing versioned account or guest action path. Disabled assistant rejected server-side. |
| Gullie scope / ambiguous names / amounts | Credential and external money action refusal; missing amount/source/name questions; ambiguous goal/amount rejection; money precision and cap validation. |
| Gullie preferences | Explicit review to remember product preferences; persisted settings; inspect / forget controls. |
| Optional full AI | Server-only Responses API adapter with structured outputs, store:false, timeout, scoped instructions, local-plan validation. No AI credential currently configured; only built-in mode has been exercised. |
| Account isolation / authorization / CSRF | Built Worker tests anonymous denial, distinct user state, no-store responses, cross-origin rejection, compare-and-swap writes and idempotent retries. Public sharing changes audience only; data endpoints still require each user's identity. |

## iPhone adaptation review

The layout uses fluid sizing at the 430-pixel iPhone 15 Plus and 440-pixel iPhone 18 Pro Max portrait width classes, plus narrower sizes and landscape. It includes safe-area padding, 44-pixel touch controls, zoom-friendly inputs, wrapping long INR amounts, compact history rows, always-visible sliders, phone Goals/History tabs, scrolling dialogs, a full-screen Gullie conversation, and Visual Viewport sizing for the keyboard. Manifest and Apple web-app metadata provide Add to Home Screen launch behavior. No service worker caches account data; opening the app requires connectivity.

TypeScript checks, domain/guest/assistant tests, built Worker integration tests, icon inspection, and source-level interaction/layout review were performed. Browser interaction, microphone permission, speech playback, native ChatGPT redirects, and real iPhone Home Screen behavior were **not** tested: the required managed preview browser skill is unavailable in this environment. These remain real-device acceptance checks, not asserted passes.

## Typography and copy review — October 5, 2026

Moved Share Gullak from Settings into the dashboard’s three-dot menu, before Settings & Backups. Sharing opens the device share sheet when available and copies the app URL otherwise; failures now show a toast from the menu. Standardized title case for navigation, actions, and short labels, and sentence case for instructions and status messages. Corrected Log In, Goal, and references to available balances. Preserved user-entered names and ledger identifiers.

Bundled the official Inter variable WOFF2 with its SIL license, preloaded locally, and applied it to the dashboard, onboarding, dialogs, menus, voice controls, assistant, and wordmark. Kept lining/tabular numerals for financial figures and input amounts. Retained the existing responsive layouts and color themes. Verified the font with FreeType. This change received source, type, build, and Worker smoke checks; no browser visual check was performed.
