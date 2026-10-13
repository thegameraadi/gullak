import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {brandAsset,colourOptions} from "../app/appearance.ts";

const read=path=>readFileSync(new URL("../public/"+path,import.meta.url));
test("all colour/appearance icons have valid opaque PNG sizes and the same installed-app identity",()=>{
 for(const colour of colourOptions)for(const dark of [false,true]){
  const suffix=dark?"-dark":"",base=`brand/${colour.value}/`;
  const manifest=JSON.parse(read(base+`manifest${suffix}.webmanifest`));
  assert.deepEqual([manifest.id,manifest.start_url,manifest.scope,manifest.display],["/","/","/","standalone"]);
  assert.equal(manifest.icons.length,3);
  for(const icon of manifest.icons){
   assert.match(icon.purpose,/\bmaskable\b/);assert.equal(icon.type,"image/png");
   const data=read(icon.src.slice(1).split("?")[0]),size=Number(icon.sizes.split("x")[0]);
   assert.equal(data.subarray(1,4).toString(),"PNG");
   assert.deepEqual([data.readUInt32BE(16),data.readUInt32BE(20)],[size,size]);
   assert.equal(data[25],2,"RGB app icons must have no transparent corner pixels");
  }
  for(const size of [180,3840]){
   const data=read(base+(size===180?`apple-touch-icon${suffix}.png`:`icon-${size}${suffix}.png`));
   assert.deepEqual([data.readUInt32BE(16),data.readUInt32BE(20)],[size,size]);assert.equal(data[25],2);
  }
  assert.match(read(base+`logo${suffix}.svg`).toString(),/viewBox="0 0 1024 1024"/);
  for(const file of ["favicon","logo","apple-touch-icon","manifest"]){
   const url=brandAsset(colour.value,dark,file);assert.match(url,/\?v=goal-coin-1$/);assert.ok(read(url.slice(1).split("?")[0]).length);
  }
 }
 assert.deepEqual(read("icon-1024.png"),read("brand/golden/icon-1024.png"));
});
