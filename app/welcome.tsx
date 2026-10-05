"use client";
import {useEffect,useState} from "react";
import {ArrowRight,LogIn,UserPlus,Smartphone} from "lucide-react";
import Dashboard from "./dashboard";
export default function Welcome({signInPath}:{signInPath:string}){const [guest,setGuest]=useState(false);useEffect(()=>{try{setGuest(localStorage.getItem("gullak-entry-mode")==="guest");}catch{}},[]);
 const prepareSignIn=()=>{try{localStorage.removeItem("gullak-entry-mode");}catch{}};
 const enterGuest=()=>{try{localStorage.setItem("gullak-entry-mode","guest");}catch{}setGuest(true);};
 const leaveGuest=()=>{try{localStorage.removeItem("gullak-entry-mode");}catch{}setGuest(false);};
 if(guest)return <Dashboard accountName="Guest" signOutPath="/" storageMode="guest" onLeaveGuest={leaveGuest}/>;
 return <main className="welcome-page"><a href="/" className="welcome-brand" aria-label="Gullak home"><picture><source srcSet="/favicon-dark.svg" media="(prefers-color-scheme: dark)"/><img src="/favicon-light.svg" width="60" height="60" alt="Gullak G dollar monogram"/></picture><span>gullak</span></a><div className="welcome-copy"><h1>A little closer.<br/>To the things you want.</h1><p>Set a goal. Put money aside. Make it happen.</p></div><div className="welcome-options"><a className="welcome-option" href={signInPath} target="_top" onClick={prepareSignIn}><LogIn size={21}/><div><strong>Log In</strong><span>Continue with your ChatGPT account.</span></div><ArrowRight size={18}/></a><a className="welcome-option" href={signInPath} target="_top" onClick={prepareSignIn}><UserPlus size={21}/><div><strong>Create an Account</strong><span>Use ChatGPT to save and sync across devices.</span></div><ArrowRight size={18}/></a><button className="welcome-option" onClick={enterGuest}><Smartphone size={21}/><div><strong>Continue as a Guest</strong><span>Your goals stay on this device.</span></div><ArrowRight size={18}/></button></div><p className="welcome-footnote">Signing in and creating an account both use ChatGPT. Your Gullak account is created automatically the first time you sign in. Guest data does not sync; clearing browser data removes it.</p></main>;
}
