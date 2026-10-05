"use client";
import {useEffect} from "react";
import {useAppearance} from "./appearance-provider";
import {brandAsset,colourOptions} from "./appearance";
export default function AppIcon(){
 const {colour,dark}=useAppearance();
 useEffect(()=>{
  for(const link of document.querySelectorAll<HTMLLinkElement>('link[rel="icon"],link[rel="shortcut icon"]'))link.href=brandAsset(colour,dark,"favicon");
  for(const link of document.querySelectorAll<HTMLLinkElement>('link[rel="apple-touch-icon"]'))link.href=brandAsset(colour,dark,"apple-touch-icon");
  const manifest=document.querySelector<HTMLLinkElement>('link[rel="manifest"]');if(manifest)manifest.href=brandAsset(colour,dark,"manifest");
  const palette=colourOptions.find(c=>c.value===colour)!;
  for(const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')){meta.removeAttribute("media");meta.content=dark?palette.darkBackground:palette.background;}
 },[colour,dark]);
 return null;
}
