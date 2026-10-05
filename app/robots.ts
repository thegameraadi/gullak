import type {MetadataRoute} from "next";
import {siteOrigin} from "./seo";
export default function robots():MetadataRoute.Robots {
  return {rules:{userAgent:"*",allow:"/",disallow:["/api/","/signin-with-chatgpt","/signout-with-chatgpt","/callback"]},sitemap:siteOrigin+"/sitemap.xml"};
}
