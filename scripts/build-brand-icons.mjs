import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {PiggyBank, DollarSign} from "lucide-react";
import {createRequire} from "node:module";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {colourOptions} from "../app/appearance.ts";

// Reuse Lucide's functional icons for a crisp favicon and matching app mark.
const require=createRequire(import.meta.url);
const wranglerRequire=createRequire(require.resolve("wrangler/package.json"));
const miniflareRequire=createRequire(wranglerRequire.resolve("miniflare"));
const sharp=miniflareRequire("sharp");
const glyph=icon=>renderToStaticMarkup(React.createElement(icon,{strokeWidth:1.7})).replace(/^<svg[^>]*>/,"").replace(/<\/svg>$/,"");
const body=glyph(PiggyBank),dollar=glyph(DollarSign);
const manifest=JSON.parse(await readFile("public/manifest.webmanifest","utf8"));
for(const colour of colourOptions)for(const dark of [false,true]){
  const ink=dark?colour.dark:colour.swatch,background=dark?colour.darkBackground:colour.background;
  const directory=`public/brand/${colour.value}`;
  await mkdir(directory,{recursive:true});
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${background}"/><g transform="translate(8 8) scale(2)" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}<g transform="translate(7.5 7) scale(.375)" stroke-width="2.8">${dollar}</g></g></svg>`;
  await writeFile(`${directory}/favicon${dark?"-dark":""}.svg`,svg);
  if(colour.value==="golden"){
    await writeFile(`public/favicon-${dark?"dark":"light"}.svg`,svg);
    if(!dark)await writeFile("public/favicon.svg",svg);
  }
  for(const size of [180,192,512]){
    const name=size===180?`apple-touch-icon${dark?"-dark":""}.png`:`icon-${size}${dark?"-dark":""}.png`;
    const png=await sharp(Buffer.from(svg)).resize(size,size).flatten({background}).png().toBuffer();
    await writeFile(`${directory}/${name}`,png);
    if(colour.value==="golden")await writeFile(`public/${name}`,png);
  }
  await writeFile(`${directory}/manifest${dark?"-dark":""}.webmanifest`,JSON.stringify({...manifest,background_color:background,theme_color:background,icons:[192,512].map(size=>({src:`/brand/${colour.value}/icon-${size}${dark?"-dark":""}.png?v=colours-1`,sizes:`${size}x${size}`,type:"image/png",purpose:"any"}))},null,2)+"\n");
}
console.log("Generated Golden, Green, and Black piggy-bank icons and stable-identity manifests in both appearances.");
