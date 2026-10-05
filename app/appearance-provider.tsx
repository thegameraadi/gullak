"use client";
import {createContext,useContext,useEffect,useState,type ReactNode} from "react";
import {isAppearance,isColour,type Appearance,type Colour} from "./appearance";

type Preferences={colour:Colour;theme:Appearance;dark:boolean;setColour:(colour:Colour)=>void;setTheme:(theme:Appearance)=>void};
const AppearanceContext=createContext<Preferences>({colour:"golden",theme:"system",dark:false,setColour:()=>{},setTheme:()=>{}});
export const useAppearance=()=>useContext(AppearanceContext);

export default function AppearanceProvider({children}:{children:ReactNode}){
 const [colour,setColour]=useState<Colour>("golden"),[theme,setTheme]=useState<Appearance>("system"),[systemDark,setSystemDark]=useState(false),[ready,setReady]=useState(false);
 useEffect(()=>{
  const read=()=>{try{const c=localStorage.getItem("gullak-colour"),t=localStorage.getItem("gullak-theme");setColour(isColour(c)?c:"golden");setTheme(isAppearance(t)?t:"system");}catch{}};
  read();setReady(true);
  const query=window.matchMedia("(prefers-color-scheme: dark)"),update=()=>setSystemDark(query.matches);
  update();query.addEventListener("change",update);
  const storage=(e:StorageEvent)=>{if(e.key===null||e.key==="gullak-colour"||e.key==="gullak-theme")read();};
  window.addEventListener("storage",storage);
  return()=>{query.removeEventListener("change",update);window.removeEventListener("storage",storage);};
 },[]);
 useEffect(()=>{
  if(!ready)return;
  document.documentElement.dataset.colour=colour;
  if(theme==="system")delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=theme;
  try{localStorage.setItem("gullak-colour",colour);localStorage.setItem("gullak-theme",theme);}catch{}
 },[colour,theme,ready]);
 return <AppearanceContext.Provider value={{colour,theme,dark:theme==="dark"||(theme==="system"&&systemDark),setColour,setTheme}}>{children}</AppearanceContext.Provider>;
}

