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

## Product link import and viewport review

Added Use Link beside Use Voice in the goal form. Approved public retailers are fetched with bounded response sizes, timeouts, redirect checks, and no forwarded credentials. Product JSON-LD, Open Graph metadata, and Amazon primary price markup can fill name, original-currency price, description, and category. Ambiguous variants, blocked pages, and unavailable prices remain manual. Other store links can still be saved without fetching arbitrary URLs. The importer prepares a form and never saves or allocates money by itself. Saved source links survive account/guest backups and ordinary edits, and Open Product is available in the goal menu. Game goals receive a gamepad icon.

Reviewed layout constraints for 320, 430, 440, 768, 1024, and 1440 CSS-pixel widths and short keyboard/landscape viewports. Link controls wrap within the form. Gullie’s composer is bounded and scrollable so long errors and keyboard-height windows keep actions reachable; the header reserves space for Close. Runtime browser QA remains unavailable because the required control-browser skill is absent. Full AI activation also remains blocked because OpenAI Developers’ required secure API-key setup skill is not available in this session, although the connector tools are present. No API key was created or exposed.


## Browser responsive repair — October 5, 2026

Used the Codex Browser on the published site to reproduce Gullie opening at x = -195, y = -422 in a 390 × 844 viewport. Tailwind's independent `translate: -50% -50%` remained active even though the custom panel cleared `transform`. The panel now also clears `translate`, remains at (0, 0) on portrait phones, and fits its right-side desktop placement. Panel animation is disabled to avoid transient displacement.

Dashboard dialogs now have a fixed header and a separate scrolling body. The outer container uses `overflow: clip`, so focusing a field or a footer button cannot scroll the header and Close out of view. Mobile opening focuses the heading instead of summoning the keyboard; desktop forms still focus the intended input. Gullie returns focus to its launcher and keeps the latest answer visible when its available height changes. Long choices and date inputs are bounded, narrow card actions wrap, financial rows stack on phones, and long dashboard totals receive a full-width column.

Verified in the local preview using isolated guest test data; no real account finances were changed:

- Dashboard container checks at 320 × 568, 375 × 667, 390 × 844, 430 × 932, 440 × 956, 768 × 1024, 1024 × 768, and 1440 × 900 found no horizontal document overflow or dashboard elements outside the screen.
- Gullie: portrait fullscreen boundaries, desktop right-side panel, 844 × 390 landscape, typing, sending, long replies, scrolling, review/cancel, Close, and focus return.
- Keyboard-height simulations at 390 × 360 and 375 × 320: composer, Send, Close, scrolling review controls, long form title, optional date/note fields, validation, and submit remained reachable. A real iPhone software keyboard, Safari panning, and safe-area hardware were not available in this desktop Browser.
- Settings: currency change, long content scrolling, and Close after reaching the bottom. Goal form: long name, large USD/INR values, expanded details, input focus, submit, and saved card layout. History: long name/note and menu. Dashboard menu and reset confirmation were opened, scrolled, and cancelled; no reset was applied.

The Explain My Balances shortcut now accepts the plural word balances instead of returning fallback help; an existing assistant regression test covers its exact visible label. TypeScript, guest/assistant tests, the production build, and the built Worker smoke test passed. Browser screenshots are saved separately as review evidence.

## Public repository and installed-app updates — October 5, 2026

Added a public Gullak overview, desktop and phone screenshots with fictional guest data, local development instructions, a deployment guide, and GitHub verification workflow. The original framework reference is retained under docs/development.md. GitHub is the public source repository; production continues on the existing Sites URL.

Build inputs now produce a shared browser/server release fingerprint. The anonymous /api/version endpoint is uncached, and HTML/RSC responses are private and uncached. The browser checks releases on startup, pageshow, return to visibility, reconnect, and each visible minute. A pending new release reloads once after a quiet moment, deferring for dialogs, menus, focused editors, and dashboard operations. Updates do not clear guest storage or cookies. The manifests retain their existing ID, scope, and start URL.

All 60 product/update tests passed, including changed/unchanged releases, delayed reloads, failed requests, concurrent checks, disposal, and rollback before reload. TypeScript and the production build passed. Built Worker checks verified the release response, stable version for the same build, no-store page headers, and the existing account/ledger safeguards. Browser checks reconfirmed Gullie at 390x844 and a 390x360 keyboard-height simulation: panel bounds were 390x360, Send was fully inside, and Close stayed visible at y=11. The clean demo dashboard fit the phone width and laptop layout, and the balance explanation matched the demo ledger.

The updater was checked in desktop Browser and automated tests. Real Safari Home Screen lifecycle on an iPhone was not available and is not claimed as verified. A pre-updater suspended session needs one normal close/reopen to load this release; removing the installed icon is unnecessary.


## Owner analytics and search visibility — October 5, 2026

Added server-protected `/manage` analytics, with no public entrance. Built Worker checks cover anonymous rejection, another account attempting to claim ownership first, exact owner ID pinning, changed owner email, same-email different-ID denial, and missing configuration failing closed. Only aggregate usage is returned. The additive migration creates analytics and owner-binding tables without changing account records.

Collector tests verify fixed events, bounded batches, deduplication, same-origin writes, DNT/GPC opt-outs, and rejection of private or arbitrary fields. Reports were checked against recorded fixtures for visitors, sessions, source, device, standalone mode, and goal activity. All 64 product tests, TypeScript, production build, and built Worker integration checks passed.

Browser checks used fictional local preview data at 1440×900, 430×932, and 320×568. No horizontal document overflow was found. The 90-day selector and Apply worked; daily values expanded into a bounded scrollable table. Charts and tables receive keyboard focus, and keyboard scrolling reached later rows. Phone chart labels were spaced to avoid overlap. These are desktop viewport simulations, not physical iPhone Safari checks.

Public welcome metadata, canonical URLs, WebApplication structured data, sitemap, robots rules, and authenticated/private noindex headers were checked in the built Worker. Google Search Console ownership and indexing are separate live setup steps; a request to index is not evidence of ranking. Product analytics starts at release and does not reconstruct older traffic.


## Human and bot traffic split — October 5, 2026

Added likely-human, AI/bot, and unknown traffic estimates to the private owner dashboard for each existing reporting period. Successful home/privacy document requests are recorded independently of JavaScript, with a random per-document ID and coarse classification only. Feature activity excludes page-view and interaction-detection events. Declared crawler identities, browser automation, and optional platform-owned verified-bot metadata are explained; user-agent identities and browser signals are not treated as proof. Historical activity remains unknown.

All 68 unit tests and TypeScript passed. Built Worker integration verified additive migrations, server-only crawler visits, caller visit-header replacement, legacy unknown records, linked interaction upgrades, bot signals resisting later human claims, exact category and automation subtotals, DNT/GPC and prefetch exclusions, private payload rejection, and existing account/owner-access safeguards.

Browser checks used local fictional data and actual local browser actions at 1440×900, 430×932, and 320×568. A Gullie action upgraded the linked browser visit without labelling AI feature use as bot traffic. Cards stayed inside the viewport, the automation table fit without document overflow, its disclosure worked with Enter, and Tab reached the table region. Empty traffic records and populated bot records were reviewed. These are desktop viewport simulations, not physical iPhone Safari checks.
