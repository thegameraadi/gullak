# Gullak — Goal Coin identity

An original, coin-fed piggy bank with a dollar counter. The restrained round body, curled tail, folded ear, and sturdy feet keep the mark recognizable at small sizes. The entering coin expresses a small contribution toward a goal. Matte gold on forest green is the primary finish; mint on green and silver on charcoal support the existing colour settings.

Production SVG geometry lives in `scripts/gullak-brand.mjs`; `scripts/build-brand-icons.mjs` exports every asset from that master. The 3840 × 3840 PNG exports are rendered directly from vectors, rather than enlarged from the concept image. Favicons simplify lighting and detail. App icons are opaque, full bleed and keep the essential silhouette in the maskable safe zone. Website badges use a CSS corner mask.

The native ImageGen concept is saved alongside this brief as `goal-coin-concept.png`. It informed the material and silhouette direction; the shipped mark is custom vector artwork, not the earlier Lucide outline. The image was generated with the built-in image tool.

Generation brief: one premium square icon for a savings-goal tracker; original geometric right-facing piggy bank, central dollar counter, entering savings coin, matte champagne gold, deep forest-green full-bleed background, restrained bevel lighting, clear negative space, no wordmark or decorative objects, recognizable at 32px.

Industry guidance: Apple recommends a simple, unique core idea and a restrained background. See https://developer.apple.com/design/human-interface-guidelines/app-icons . No competitor mark or Apple symbol was used.

All manifest IDs, scopes and start URLs remain unchanged. New asset URLs use `goal-coin-1` to refresh browser branding. Gullak's existing release updater remains intact. iOS chooses and stores the Home Screen image; an installed icon cannot be reliably forced to refresh by the website. If it remains old, save a backup if using Guest, then remove the icon and add Gullak again from Safari. Do not clear website data.
