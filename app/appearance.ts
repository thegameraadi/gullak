export const colourOptions = [
  {value:"golden",label:"Golden",swatch:"#8a6726",dark:"#d0b171",background:"#f7f2e7",darkBackground:"#191815"},
  {value:"green",label:"Green",swatch:"#237d4a",dark:"#7dc69a",background:"#eef6f0",darkBackground:"#121715"},
  {value:"black",label:"Black",swatch:"#222222",dark:"#e5e5e5",background:"#f3f3f3",darkBackground:"#161616"},
] as const;
export type Colour = typeof colourOptions[number]["value"];
export type Appearance = "system"|"light"|"dark";
export const isColour = (value:unknown):value is Colour => colourOptions.some(c=>c.value===value);
export const isAppearance = (value:unknown):value is Appearance => ["system","light","dark"].includes(value as string);
export const brandAsset = (colour:Colour,dark:boolean,file:"favicon"|"apple-touch-icon"|"manifest") => `/brand/${colour}/${file}${dark?"-dark":""}.${file==="favicon"?"svg":file==="manifest"?"webmanifest":"png"}?v=colours-1`;

// Apply saved device preferences before the page paints, including server-rendered routes.
export const appearanceBootstrap=`try{var c=localStorage.getItem("gullak-colour"),t=localStorage.getItem("gullak-theme");if(["golden","green","black"].includes(c))document.documentElement.dataset.colour=c;if(["light","dark"].includes(t))document.documentElement.dataset.theme=t;}catch{}`;
