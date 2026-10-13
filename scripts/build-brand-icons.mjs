import {createRequire} from "node:module";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {colourOptions} from "../app/appearance.ts";
import {brandSvg,brandVersion} from "./gullak-brand.mjs";

const require=createRequire(import.meta.url);
const wranglerRequire=createRequire(require.resolve("wrangler/package.json"));
const miniflareRequire=createRequire(wranglerRequire.resolve("miniflare"));
const sharp=miniflareRequire("sharp");
const priorManifest=JSON.parse(await readFile("public/manifest.webmanifest","utf8"));
const identity={id:priorManifest.id,name:priorManifest.name,short_name:priorManifest.short_name,start_url:priorManifest.start_url,scope:priorManifest.scope,display:priorManifest.display,description:priorManifest.description};
for(const colour of colourOptions)for(const dark of [false,true]){
  const suffix=dark?"-dark":"",directory=`public/brand/${colour.value}`;
  const background=dark?colour.darkBackground:colour.background;
  const svg=brandSvg(colour.value,dark),favicon=brandSvg(colour.value,dark,{favicon:true});
  await mkdir(directory,{recursive:true});
  await writeFile(`${directory}/logo${suffix}.svg`,svg);
  await writeFile(`${directory}/mark${suffix}.svg`,brandSvg(colour.value,dark,{transparent:true}));
  await writeFile(`${directory}/favicon${suffix}.svg`,favicon);
  for(const size of [180,192,512,1024,3840]){
    const name=size===180?`apple-touch-icon${suffix}.png`:`icon-${size}${suffix}.png`;
    const png=await sharp(Buffer.from(svg)).resize(size,size).flatten({background}).png().toBuffer();
    await writeFile(`${directory}/${name}`,png);
    if(colour.value==="golden")await writeFile(`public/${name}`,png);
  }
  const icons=[192,512,1024].map(size=>({src:`/brand/${colour.value}/icon-${size}${suffix}.png?v=${brandVersion}`,sizes:`${size}x${size}`,type:"image/png",purpose:"any maskable"}));
  await writeFile(`${directory}/manifest${suffix}.webmanifest`,JSON.stringify({...identity,background_color:background,theme_color:background,icons},null,2)+"\n");
  if(colour.value==="golden"){
    await writeFile(`public/favicon-${dark?"dark":"light"}.svg`,favicon);
    if(!dark)await writeFile("public/favicon.svg",favicon);
    await writeFile(`public/manifest${suffix}.webmanifest`,JSON.stringify({...identity,background_color:background,theme_color:background,icons:icons.map(i=>({...i,src:i.src.replace('/brand/golden','')}))},null,2)+"\n");
  }
}
console.log("Generated original Goal Coin logos, favicons, 180–3840px opaque app icons and stable-identity manifests in all three colours and both appearances.");
