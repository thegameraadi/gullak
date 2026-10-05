# Analytics and search setup

## Owner access

Open `/manage` directly and sign in with ChatGPT. There is no public navigation link. Page rendering and `/api/manage` both enforce the server-side owner check; hiding the route is not the access control.

Configure `GULLAK_MANAGE_OWNER_EMAIL` as a secret in Sites using the Site owner's platform-verified ChatGPT email. The first matching sign-in pins that account's stable per-Site ID in D1. Later requests require that exact ID, even if another account has the same email. Missing configuration fails closed. Never place owner identities or credentials in the public repository.

For portable local development only, an ignored `.dev.vars` can set this value to the local preview's fictional sign-in email. This is not production authentication and must never be archived or deployed.

## Reporting definitions

- Visitors are distinct browser IDs, not verified people. The random ID expires after 90 days without activity.
- Sessions restart after 30 minutes idle or a new attributed campaign. Tabs share browser storage.
- Returning visitors were observed on an earlier UTC day. Daily charts use UTC; today is partial.
- Feature adoption is independent per feature, not a sequential conversion funnel.
- Event counts include guest and signed-in use. Current account, active-goal, and WINS totals include synced accounts only; draft goals are excluded.
- Device, operating system, browser, source, access mode, and standalone mode are broad categories. A browser can appear in multiple breakdowns.
- Errors are client-reported activity errors, not comprehensive server uptime monitoring.

The strict browser collector accepts only fixed event names, random IDs, and two boolean classification signals. It rejects arbitrary payload fields. No financial amounts, private goal details, Goalie text, email, raw user agent, IP address, or complete referrer is stored. IP addresses are used transiently for rate limiting. Do Not Track and Global Privacy Control suppress collection. Old events and page request records are pruned incrementally beyond the rolling 90-day reporting window. Management is not tracked; the privacy page contributes only a coarse page request record.

Collection starts at deployment; historical visitors cannot be inferred. Browser privacy controls, blocked requests, and cleared storage affect counts. Collection failures do not interrupt the product.

## Human and bot split

The owner dashboard shows **Likely humans**, **AI / bots**, and **Unknown** for the selected reporting period. These are estimates, not proof of identity.

- **Visits** count successful GET HTML loads of the home and privacy pages, including crawlers that do not execute JavaScript. They are page loads, not distinct people or bot identities. API requests, assets, management, React component requests, and declared prefetches are excluded.
- **Activities** count reported feature events. `page_view` and `visitor_engaged` are excluded to keep page visits and interaction detection from inflating feature usage.
- **Likely humans** require a recognised browser user agent and a browser-reported trusted pointer or keyboard interaction, with no detected automation. The collector sends only the fact of interaction, never keys or coordinates. A passive browser remains unknown; signing in is not sufficient evidence.
- **AI / bots** include declared AI/search crawlers and HTTP tools, headless browser user agents, or `navigator.webdriver`. If the hosting platform exposes its verified-bot flag, that flag strengthens the bot evidence; caller-supplied headers do not. Provider names remain declared user-agent identities. The expandable table shows each signal's visits and activities.
- **Unknown** includes records without sufficient evidence and all events collected before the split existed. Previously excluded bots cannot be recovered. Bots blocked upstream are not visible. User agents and browser flags can be spoofed, and disguised automation can appear human or unknown.

A random per-document ID links server page loads to browser events without a cookie or personal identifier. Later interaction upgrades that page load and its earlier events from unknown to likely human; detected bot evidence cannot be downgraded by a later human claim. A person using Goalie, or arriving via an AI recommendation, is not classified as a bot for that reason. Other dashboard reports include all collected browser traffic.

## Google visibility

Public pages have descriptive metadata, canonical URLs, Open Graph metadata, and WebApplication structured data. `/sitemap.xml` contains the public introduction and privacy page only. Public welcome pages are indexable; authenticated personal dashboards, management, and API responses use noindex. Management is login protected and omitted from navigation and the sitemap.

Use the exact URL-prefix property `https://gullak-aditya.thegameraadi3.chatgpt.site/` in Google Search Console. Verify using the public homepage meta tag, submit `sitemap.xml`, and request homepage indexing. Keep the tag in place after verification. Set runtime `GULLAK_SEARCH_CONSOLE_VERIFIED=true` only after Google confirms ownership, then redeploy a saved version to apply the setting.

That flag records completed setup. Google impressions, clicks, queries, and average position remain in Search Console and are not imported into `/manage`. Indexing and ranking depend on Google; a verification or indexing request is not a ranking guarantee.

Campaign attribution uses fixed `utm_source` categories. For WhatsApp group sharing, use `?utm_source=bay-area-builders&utm_medium=whatsapp`; for friends, use `?utm_source=friends`. The public canonical address remains the root URL.
