"use client";
import {useAppearance} from "./appearance-provider";
import {brandAsset} from "./appearance";
export default function BrandIcon({size,alt=""}:{size:number;alt?:string}){
 const {colour,theme,dark}=useAppearance();
 return <picture className="brand-symbol">{theme==="system"&&<source srcSet={brandAsset(colour,true,"logo")} media="(prefers-color-scheme: dark)"/>}<img src={brandAsset(colour,dark,"logo")} width={size} height={size} alt={alt}/></picture>;
}
