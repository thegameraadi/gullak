export const colourOptions = [
  {value:"golden",label:"Golden",swatch:"#8a6726",dark:"#e4c486",background:"#f5f4ed",darkBackground:"#111e17"},
  {value:"green",label:"Green",swatch:"#237d4a",dark:"#a5d8b3",background:"#f1f5ef",darkBackground:"#0f1d15"},
  {value:"black",label:"Black",swatch:"#222222",dark:"#e4eae2",background:"#f2f3ef",darkBackground:"#141916"},
  {value:"white",label:"White",swatch:"#ffffff",dark:"#ffffff",background:"#ffffff",darkBackground:"#111e17"},
] as const;
export type Colour = typeof colourOptions[number]["value"];
export type Appearance = "system"|"light"|"dark";
export const isColour = (value:unknown):value is Colour => colourOptions.some(c=>c.value===value);
export const isAppearance = (value:unknown):value is Appearance => ["system","light","dark"].includes(value as string);
export const brandAsset = (colour:Colour,dark:boolean,file:"logo"|"favicon"|"apple-touch-icon"|"manifest") => `/brand/${colour}/${file}${dark?"-dark":""}.${file==="favicon"||file==="logo"?"svg":file==="manifest"?"webmanifest":"png"}?v=goal-coin-1`;

// Apply saved device preferences before the page paints, including server-rendered routes.
export const appearanceBootstrap=`try{var c=localStorage.getItem("gullak-colour"),t=localStorage.getItem("gullak-theme");if(["golden","green","black","white"].includes(c))document.documentElement.dataset.colour=c;if(["light","dark"].includes(t))document.documentElement.dataset.theme=t;}catch{}`;
