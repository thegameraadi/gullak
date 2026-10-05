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

The strict collector accepts only fixed event names and random IDs. It rejects arbitrary payload fields. No financial amounts, private goal details, Gullie text, email, raw user agent, IP address, or complete referrer is stored. IP addresses are used transiently for rate limiting. Do Not Track and Global Privacy Control suppress collection. Old events are pruned incrementally beyond the rolling 90-day reporting window. Management and privacy pages are not tracked.

Collection starts at deployment; historical visitors cannot be inferred. Browser privacy controls, blocked requests, and cleared storage affect counts. Collection failures do not interrupt the product.

## Google visibility

Public pages have descriptive metadata, canonical URLs, Open Graph metadata, and WebApplication structured data. `/sitemap.xml` contains the public introduction and privacy page only. Public welcome pages are indexable; authenticated personal dashboards, management, and API responses use noindex. Management is login protected and omitted from navigation and the sitemap.

Use the exact URL-prefix property `https://gullak-aditya.thegameraadi3.chatgpt.site/` in Google Search Console. Verify using the public homepage meta tag, submit `sitemap.xml`, and request homepage indexing. Keep the tag in place after verification. Set runtime `GULLAK_SEARCH_CONSOLE_VERIFIED=true` only after Google confirms ownership, then redeploy a saved version to apply the setting.

That flag records completed setup. Google impressions, clicks, queries, and average position remain in Search Console and are not imported into `/manage`. Indexing and ranking depend on Google; a verification or indexing request is not a ranking guarantee.

Campaign attribution uses fixed `utm_source` categories. For WhatsApp group sharing, use `?utm_source=bay-area-builders&utm_medium=whatsapp`; for friends, use `?utm_source=friends`. The public canonical address remains the root URL.
