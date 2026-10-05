import type {MetadataRoute} from "next";
import {siteOrigin} from "./seo";
export default function sitemap():MetadataRoute.Sitemap {return [{url:siteOrigin+"/",changeFrequency:"monthly",priority:1},{url:siteOrigin+"/privacy",changeFrequency:"yearly",priority:0.3}];}
