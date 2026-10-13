// Gullak's original Goal Coin mark. All production artwork is vector geometry.
// The pig, dollar counter, coin and slot share a 1024-unit master grid.
export const brandVersion = "goal-coin-1";
const finishes = {
  golden: {background:["#214e3a","#092d22"],metal:["#fae9bd","#d9b36c","#a77a37"],edge:"#fff4d6"},
  green: {background:["#215940","#073626"],metal:["#e5f5e9","#a3d5b2","#68a883"],edge:"#f4fff7"},
  white: {background:["#28513b","#0f3121"],metal:["#ffffff","#eef5e9","#bdd2ba"],edge:"#ffffff"},
  black: {background:["#353c38","#101614"],metal:["#f6f8f3","#c4cdc5","#818e83"],edge:"#ffffff"},
};
// The full silhouette fits the central 80%-diameter circle used by maskable icons.
const pig = "M 257 422 C 302 360 379 329 466 325 C 534 322 591 332 637 350 C 669 319 707 299 746 300 C 758 300 763 307 760 320 L 747 393 C 779 418 799 445 813 475 C 824 497 846 511 873 511 L 884 511 C 896 511 902 519 902 531 L 902 582 C 902 594 896 602 883 606 L 854 615 C 831 673 789 713 735 741 L 721 806 C 719 821 710 829 695 829 L 655 829 C 641 829 631 821 627 807 L 615 767 C 556 784 486 785 428 770 L 409 811 C 404 824 396 829 382 829 L 343 829 C 328 829 320 820 318 806 L 309 733 C 261 695 235 641 231 581 C 226 518 231 464 257 422 Z";
const dollar = "M 549 410 L 549 443 C 574 447 596 458 612 475 L 584 505 C 568 491 548 483 529 483 C 504 483 488 495 488 511 C 488 527 503 535 535 546 C 582 562 609 583 609 621 C 609 661 582 688 549 696 L 549 729 L 513 729 L 513 697 C 479 693 450 679 430 655 L 459 625 C 480 645 504 656 530 656 C 557 656 573 643 573 625 C 573 608 558 598 525 587 C 478 571 452 551 452 515 C 452 477 477 449 513 443 L 513 410 Z";

export function brandSvg(colour="golden",dark=false,{favicon=false,transparent=false}={}){
  const p=finishes[colour];if(!p)throw new Error("Unknown Gullak colour");
  const background=dark?[p.background[1],colour==="black"?"#070908":"#071710"]:p.background;
  const shadow=favicon?"":"filter=\"url(#shadow)\"";
  const fill=favicon?p.metal[1]:"url(#metal)";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-labelledby="title"><title id="title">Gullak Goal Coin piggy bank</title><defs>
  <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${background[0]}"/><stop offset="1" stop-color="${background[1]}"/></linearGradient>
  <linearGradient id="metal" x1=".2" y1="0" x2=".8" y2="1"><stop stop-color="${p.metal[0]}"/><stop offset=".52" stop-color="${p.metal[1]}"/><stop offset="1" stop-color="${p.metal[2]}"/></linearGradient>
  <linearGradient id="coin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p.metal[0]}"/><stop offset="1" stop-color="${p.metal[1]}"/></linearGradient>
  <filter id="shadow" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="15" stdDeviation="13" flood-color="#001d12" flood-opacity=".28"/></filter>
  <mask id="pig-counter"><rect width="1024" height="1024" fill="#fff"/><path d="${dollar}" fill="#000"/><rect x="389" y="360" width="183" height="28" rx="14" fill="#000"/><circle cx="766" cy="472" r="18" fill="#000"/></mask></defs>
  ${transparent?"":`<rect width="1024" height="1024" ${favicon?'rx="224"':''} fill="url(#background)"/>`}
  <g ${shadow}><path d="M 240 555 C 202 559 176 541 176 509 C 176 481 197 468 216 478 C 230 486 231 504 220 512" fill="none" stroke="${fill}" stroke-width="33" stroke-linecap="round"/>
  <path d="${pig}" fill="${fill}" mask="url(#pig-counter)"/>
  ${favicon?"":`<path d="M 635 350 C 675 327 713 311 747 311 L 717 389 C 685 384 657 372 635 350 Z" fill="url(#coin)"/><path d="M 282 424 C 328 372 390 347 457 343" fill="none" stroke="${p.edge}" stroke-opacity=".38" stroke-width="8" stroke-linecap="round"/>`}
  <circle cx="479" cy="240" r="72" fill="${favicon?fill:"url(#coin)"}"/>
  ${favicon?"":`<circle cx="479" cy="240" r="61" fill="none" stroke="${p.edge}" stroke-width="3" stroke-opacity=".55"/>`}</g></svg>`.replace(/[ \t]+\n/g,"\n");
}
