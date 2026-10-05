# Deploying Gullak

Production: **[gullak-aditya.thegameraadi3.chatgpt.site](https://gullak-aditya.thegameraadi3.chatgpt.site/)**

The public GitHub repository contains the source. The production app is hosted by Sites; the runtime includes a Cloudflare Worker, a D1 database, and platform-owned Sign in with ChatGPT. A static GitHub Pages deployment cannot provide these server features.

## Release procedure

1. Update the source and preserve `.openai/hosting.json` for this existing Site.
2. Install the locked dependencies. Run `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build`, and `pnpm test:worker`.
3. Use the Sites publishing workflow to commit and push the exact tested source to the Site's source repository, package the matching built assets, and save a version.
4. Deploy that saved version to the same production Site. Confirm the deployment reports **succeeded** before announcing it live.
5. Push the same source revision to this GitHub repository. Update product screenshots when the visible experience changes.

The Sites plugin supplies short-lived publishing credentials through its native tools. Keep credentials out of source, documentation, archives, and command arguments. Production secrets are configured in Sites runtime settings. The GitHub verification workflow does not contain deployment credentials or publish automatically.

Schema changes require a reviewed migration under `drizzle/`. The publishing workflow handles the declared D1 binding. Do not replace the Site or its database just to publish a product update.

## Installed Safari app updates

The manifest keeps `id`, `start_url`, and `scope` at `/`, and the production origin stays unchanged. The existing Home Screen installation continues to point to that app.

- Build inputs receive a deterministic release fingerprint. Browser code and `/api/version` use that same identifier.
- HTML and React server responses use `Cache-Control: private, no-store`; `/api/version` uses `no-store`. Browser bundles use build-generated asset names.
- The client checks on startup, `pageshow`, visibility changes, reconnect, and once a minute while visible and online.
- A different valid release triggers one normal reload after five seconds without interaction. Open dialogs, menus, editing fields, and pending dashboard operations defer it. The pending release applies once those blockers clear.
- Failed requests, invalid version responses, and offline periods leave the current session usable and are retried later. No update step clears cookies, guest data, backups, or local preferences.

No service worker or offline page cache is registered by this application. A fresh launch requires network access. An older suspended session that predates the updater must first load this release through an ordinary close/reopen; installing a new icon is unnecessary. Safari controls background suspension and installed icon refresh, so neither is promised as an instant background operation.

Relevant platform references: [WebKit Home Screen web apps](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching), and [the pageshow lifecycle event](https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event).

## Verification

GitHub Actions validates each push and pull request using the committed lockfile. Tests cover ledger invariants, guest storage, assistant proposals, release changes, delayed updates, failed requests, and concurrent resume checks. Built Worker checks exercise the public welcome, release endpoint and response headers, anonymous denial, account isolation, persistence, idempotency, conflicts, and cross-origin write rejection.

Desktop Browser checks cover responsive layouts and keyboard-height simulations. Real iPhone Safari, the native software keyboard, installed Home Screen lifecycle, microphone permissions, and live platform authentication require device verification; they are not asserted as passes by those simulations.


### Production layout checks

Run responsive checks against the built Worker, not only the development server. Open Goalie at 430 × 932 (iPhone 15 Plus), narrower phone widths, a reduced height for keyboard space, landscape, and laptop size. Verify the entire panel is inside the viewport, Close and Send remain reachable, conversation scrolling is independent, and closing returns focus to Ask Goalie. Repeat with the New Goal form.

Goalie uses the dialog's `custom` placement so it never receives the centered dialog's position, translation, or animation utilities. CSS optimization can lower an individual `translate` reset into a `transform`, which does not cancel a separate `translate` utility. Overriding those utilities with `translate: none` passed development checks but left the production panel shifted by half its width and height. Keep placement separate at the component level.
