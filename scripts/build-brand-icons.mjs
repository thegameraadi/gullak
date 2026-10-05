import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {PiggyBank, DollarSign} from "lucide-react";
import {createRequire} from "node:module";
import {writeFile} from "node:fs/promises";

// Reuse Lucide's functional icons for a crisp favicon and matching app mark.
const require=createRequire(import.meta.url);
const wranglerRequire=createRequire(require.resolve("wrangler/package.json"));
const miniflareRequire=createRequire(wranglerRequire.resolve("miniflare"));
const sharp=miniflareRequire("sharp");
const glyph=icon=>renderToStaticMarkup(React.createElement(icon,{strokeWidth:1.7})).replace(/^<svg[^>]*>/,"").replace(/<\/svg>$/,"");
const body=glyph(PiggyBank),dollar=glyph(DollarSign);
for(const dark of [false,true]){
  const gold=dark?"#d0b171":"#8a6726",background=dark?"#191815":"#f7f2e7";
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${background}"/><g transform="translate(8 8) scale(2)" fill="none" stroke="${gold}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}<g transform="translate(7.5 7) scale(.375)" stroke-width="2.8">${dollar}</g></g></svg>`;
  await writeFile(`public/favicon-${dark?"dark":"light"}.svg`,svg);
  if(!dark)await writeFile("public/favicon.svg",svg);
  for(const size of [180,192,512]){
    const name=size===180?`apple-touch-icon${dark?"-dark":""}.png`:`icon-${size}${dark?"-dark":""}.png`;
    await sharp(Buffer.from(svg)).resize(size,size).flatten({background}).png().toFile(`public/${name}`);
  }
}
console.log("Generated matching light/dark piggy-bank favicons and Home Screen icons.");
