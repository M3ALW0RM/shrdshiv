// Havenport Shards: deck and cracker engine.
// Built from the SHRDSHIV test bench. Game rules live in js/game.js, content in data/*.js.

(function(){
"use strict";
const HEX = "0123456789ABCDEF";
const W = 22;
const DIFF = {
  1:{len:3,syms:6,rep:false,pos:true},
  2:{len:4,syms:8,rep:false,pos:true},
  3:{len:4,syms:10,rep:false,pos:false},
  4:{len:5,syms:10,rep:false,pos:false},
  5:{len:5,syms:16,rep:true,pos:false},
  6:{len:6,syms:16,rep:true,pos:false}
};
const SHARDS = (window.HR_SHARDS || []).map(d=>JSON.parse(JSON.stringify(d)));
const SSTORE = "shrdshiv-custom-shards";

// In-universe encryption schemes. Only the cracker ever names them.
const ENC = {
  A:{name:"SEGLOCK", how:"blocks", real:"KDS-SEG/4", org:"Kestrel, 2081 rev c", native:true, conf:"high", confS:"hi"},   // Kestrel: each sector is one contiguous block
  B:{name:"COMB", how:"stride", real:"MSX-COMB/3", org:"Meridian, 2079 rev b", native:false, conf:"moderate", confS:"mod"},      // Meridian: sector k holds every nth character, offset k
  C:{name:"CHAFF", how:"scatter", real:"AK-CHAFF/2", org:"Aurelius-Kade, 2080", native:false, conf:"low", confS:"low"},     // Aurelius-Kade: whole words dealt out to sectors at random
  X:{name:"XORPAD", how:"blocks", real:"FER-XOR/1", org:"Ferrous Logic", native:false, conf:"high", confS:"hi"},
  R:{name:"ROOKCRYPT", how:"scatter", real:"unknown", org:"unknown", native:false, conf:"low", confS:"low"}
};
function seeded(id){
  let h = 2166136261; for(const c of id){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return ()=>{ h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
function buildCharMap(d){
  const out = [], n = d.sectors.length;
  if(d.enc === "A" || d.enc === "X"){
    d.sectors.forEach((s,i)=>{ if(i) out.push({ch:" ", sec:-1}); for(const ch of s.text) out.push({ch, sec: ch === " " ? -1 : i}); });
  } else if(d.enc === "B"){
    let j = 0;
    for(const ch of d.text){ if(ch === " ") out.push({ch, sec:-1}); else { out.push({ch, sec: j % n}); j++; } }
    d.sectors.forEach(s=>s.type = "1 IN " + n);
  } else if(d.enc === "C" || d.enc === "R"){
    const words = d.text.split(" "), rnd = seeded(d.id), order = words.map((_,i)=>i);
    for(let i=order.length-1;i>0;i--){ const k = Math.floor(rnd()*(i+1)); [order[i],order[k]] = [order[k],order[i]]; }
    const owner = [], count = Array(n).fill(0);
    order.forEach((wi,k)=>{ owner[wi] = k % n; count[k % n]++; });
    words.forEach((w,wi)=>{ if(wi) out.push({ch:" ", sec:-1}); for(const ch of w) out.push({ch, sec: owner[wi]}); });
    d.sectors.forEach((s,i)=>s.type = count[i] + " WORDS");
  }
  return out;
}
SHARDS.forEach(d=>prepShard(d));

const GL = "#%@&$!?/<>=+";
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }

// ---------- cracker software ----------
// sw: built-in features. map/tags: "auto" = free and automatic, a number = juice cost to run once, null = not available.
const CRACKERS = {
  shiv:{
    name:"SHRDSHIV", ver:"v0.3b", by:"//n1ghtjar", blurb:"Street freeware. Rude, buggy, free.",
    stripe:"repeating-linear-gradient(45deg,#e9a440 0 8px,#141617 8px 16px)",
    sw:{analyzer:false, elim:false, cheap:false, map:2, tags:null, probe:0},
    terms:{sec:"sec", juice:"juice", crack:"crack", sniff:"sniff", warez:"warez", open:"open", lock:"lock", burn:"BURN", nope:"nope", enc:"enc"},
    upper:false, idx:i=>"["+i+"]", bar:["█","░"], hit:"●", near:"○", miss:"·",
    title:id=>"SHRDSHIV :: " + id,
    boot:["", "    .-.", "   (o.o)  SHRDSHIV", "    |=|   v0.3b", "   __|__  //n1ghtjar"],
    hello:[" corp lock detected", " lemme at it..."], idle:[" no shard in the slot", " feed me, choom"],
    menu:k=>["1crak 2snif 3warez", (k === "text" ? "4read" : "4play") + " *eject"],
    tryHint:"#try *del/back", confirm:" [#] do it  [*] nah", scanTitle:"sniffin...",
    cracked:(i,n)=>["", "   \\o/", " CRACKED", "", " sec" + i + " is ours", " " + pick(["easy money","too clean","corp tears, yum","next."])],
    out:["", "   x_x", " OUT OF JUICE", "", " every locked sec", " went to static.", " shoulda bought a", " better deck lol"],
    sound:{wave:"square", key:720, hit:520, miss:300, ok:[440,554,659,880], bad:110, boot:[220,330,440]}, fx:"tear"
  },
  veuve:{
    name:"LA VEUVE", ver:"v1.0", by:"Collectif Bastille", blurb:"Made in Paris by a hacker collective, for revolutionaries. Reads feedback by position.",
    stripe:"linear-gradient(90deg,#2b4fa3 0 33%,#f2efe6 33% 66%,#c8343a 66%)",
    sw:{analyzer:true, elim:false, cheap:false, map:1, tags:1, probe:1},
    terms:{sec:"zone", juice:"essais", crack:"casser", sniff:"sonder", warez:"arsenal", open:"libre", lock:"captif", burn:"perdu", nope:"absents", enc:"chiffre"},
    upper:false, idx:i=>"n°" + i, bar:["▒","·"], hit:"★", near:"☆", miss:"·",
    title:id=>"LA VEUVE · " + id,
    boot:["  .=======.", "  ||/////||  LA VEUVE", "  ||     ||  v1.0", "  ||_____||  collectif", "  ||(   )||  bastille", " ==========="],
    hello:[" serrure détectée.", " à la lanterne!"], idle:[" pas de shard.", " liberté, égalité, data."],
    menu:k=>["1casser 2sonder", "3arsenal " + (k === "text" ? "4lire" : "4jouer") + " *quit"],
    pick:{crack:"casser quelle zone?", len:"longueur: quelle zone?", type:"contenu: quelle zone?", sym:"symboles: quelle zone?", probe:"aperçu: quelle zone?", insight:"insight: quelle zone?", bypass:"contourner: zone?", brute:"forcer quelle zone?", scrap:"sacrifier: zone?"},
    str:{noGuess:" aucun essai encore", back:"*retour", hint:" indice",
      need:n=>"il faut " + n + " symboles.", only:r=>"seulement " + r + " ici.", noRep:"pas de répétitions.", noSpend:"aucun essai perdu.",
      codeLen:" longueur du code", symbols:n=>" >> " + n + " symboles", holds:" contient", hardest:" zone la plus dure",
      uses:" utilise", distinct:n=>" >> " + n + " symb. distincts", diffMap:" carte des difficultés", tagsDone:" étiquettes",
      onMap:" >> sur la carte", notEnough:" pas assez d'essais.",
      probeWord:"sonde", pTest:" tester:", pTestLbl:"tester", noGuessS:" aucun essai", hintW:"aperçu",
      pBlockedS:"bloquée", pSpentS:"épuisée", pCoolS:"attends", pBlocked:"trop forte", pSpent:"épuisée", pCool:"après un essai", pLocked:n=>"à <=" + n + " cand.", pFree:"gratuite", pCharge:"en charge", dry1:" ça viderait", dry2:" le shard.", cost:n=>" -" + n + " essais"},
    scans:{len:"longueur zone", type:"contenu zone", hard:"zone la + dure", sym:"symboles zone", all:"toutes diffic.", map:"carte complète", tags:"étiqueter tout"},
    tryHint:"#tenter *effacer", confirm:" [#] oui  [*] non", scanTitle:"sondage...",
    // La Marseillaise, opening phrase: "Allons enfants de la Patrie"
    tune:[[293.66,.27],[293.66,.09],[293.66,.36],[392,.36],[392,.36],[440,.36],[440,.36],[587.33,.72],[493.88,.27],[392,.36]],
    bootHold:3800,
    crackAnim:(i,n)=>{
      const top = "  .=======.", base = " ===========", post = "  ||     ||", blade = "  ||/////||", bar = "  ||_____||", lock = "  ||(###)||";
      const frame = (bladeRow, extra)=>{
        const rows = [top];
        for(let r=1;r<=4;r++) rows.push(r === bladeRow ? blade : post);
        rows.push(bladeRow === 5 ? blade : bar);
        rows.push(bladeRow === 5 ? "  ||  '  ||" : lock);
        rows.push(base);
        return rows.concat(extra || []);
      };
      const f = [];
      [1,2,3,4].forEach(r=>f.push({lines:frame(r), ms: r === 1 ? 260 : 70, sfx: r === 1 ? ()=>beep(880, .05, "square", .03) : null}));
      f.push({lines:frame(5, ["      (###)"]), ms:160, sfx:()=>{ noise(.25); beep(70, .25, "sawtooth", .07); fx("drop", 300); }});
      f.push({lines:frame(5, ["          (###)~"]), ms:180});
      f.push({lines:frame(5, ["", " zone " + i + " libérée!", " ça ira! (" + n + " essais)"]), ms:2700, sfx:()=>chord([392, 493.88, 587.33, 783.99], "square")});
      return f;
    },
    cracked:(i,n)=>["", " zone " + i + " libérée!"],
    out:["", " plus d'essais.", "", " les zones captives", " sont perdues.", " la lutte continue."],
    sound:{wave:"square", key:660, hit:587, miss:294, ok:[392,494,587,784], bad:147, boot:[294,392,440]}, fx:"drop"
  },
  razor:{
    name:"RAZORBACK", ver:"PRO 5", by:"CrackWorks Ltd", blurb:"Loud black-market workhorse. Spread shot: one guess, up to 3 locks at once.",
    stripe:"repeating-linear-gradient(-45deg,#c23b2a 0 6px,#2a0f0b 6px 12px)",
    sw:{analyzer:false, elim:true, cheap:true, map:"auto", tags:2, probe:2},
    terms:{sec:"tgt", juice:"ammo", crack:"smash", sniff:"recon", warez:"loadout", open:"dead", lock:"live", burn:"slag", nope:"duds", enc:"ice"},
    upper:true, idx:i=>"<" + i + ">", bar:["■","-"], hit:"X", near:"O", miss:"-",
    title:id=>"▓ RAZORBACK ▓ " + id,
    spread:true, rack:true,
    boot:["", " ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓", "  RAZORBACK PRO 5", "  CRACKWORKS LTD", " ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"],
    hello:[" target acquired", " time to break stuff"], idle:[" no target loaded", " feed the beast"],
    menu:k=>["1smash 2recon 3load", (k === "text" ? "4read" : "4play") + " *eject"],
    tryHint:"#fire *del", confirm:" [#] do it  [*] abort", scanTitle:"recon sweep",
    cracked:(i,n)=>["", " >>>>>>>>>>>>>>>>>>>>", " tgt " + i + " smashed", " >>>>>>>>>>>>>>>>>>>>", " " + pick(["next!","too easy","boom","get wrecked"])],
    out:["", " XXXXXXXXXXXXXXXXXXXX", " out of ammo", " live tgts slagged", " XXXXXXXXXXXXXXXXXXXX"],
    sound:{wave:"sawtooth", key:420, hit:300, miss:140, ok:[220,277,330,440], bad:70, boot:[110,147,220]}, fx:"shake"
  },
  oracle:{
    name:"ORACLE//ZERO", ver:"r9", by:"ex-Kestrel", blurb:"Kestrel's own counter-intrusion suite. It should never have left the building.",
    stripe:"linear-gradient(90deg,#e8e4da 0 30%,#141617 30% 36%,#e8e4da 36% 70%,#141617 70% 76%,#e8e4da 76%)",
    sw:{analyzer:true, elim:true, cheap:true, map:"auto", tags:"auto", probe:3},
    terms:{sec:"blk", juice:"budget", crack:"solve", sniff:"scan", warez:"tools", open:"clear", lock:"sealed", burn:"purged", nope:"excl", enc:"cipher"},
    upper:false, panelUpper:true, idx:i=>String(i).padStart(2,"0"), bar:["|","."], hit:"■", near:"□", miss:".",
    banner:{t:" KESTREL INTERNAL//NFD", cls:"inv", full:true},
    engine:true, zeroTrace:true, smooth:true,
    title:id=>({t:" KESTREL INTERNAL " + id, cls:"inv", full:true}),
    bootFrames:(inserted)=>{
      const bird = [
        "  \\\\\\__   ,-.   __///",
        "   \\\\\\\\_ (o >) _////",
        "    `\\\\\\\\_\\  /_////'",
        "         `\\/\\/'",
        "          /  \\"
      ];
      // center the bird as one block, horizontally and vertically
      const lead = Math.min.apply(null, bird.map(l=>l.match(/^ */)[0].length));
      const trimmed = bird.map(l=>l.slice(lead)), wid = Math.max.apply(null, trimmed.map(l=>l.length));
      const lpad = " ".repeat(Math.floor((22 - wid) / 2)), art = trimmed.map(l=>lpad + l);
      const ctr = t=>{ const n = Math.floor((22 - t.length) / 2); return " ".repeat(n) + t; };
      const top = ["", ""];
      const f = [{lines:["", "", "", "", "", ctr("_")], ms:350, raw:true, sfx:()=>lowSweep(48, 96, 2.6, .09)}];
      for(let k=1;k<=art.length;k++) f.push({lines:top.concat(art.slice(0,k)), ms:180, raw:true});
      f.push({lines:top.concat(art, ["", {t:ctr("KESTREL DATASYSTEMS"), cls:"inv", full:true}, {t:ctr("we remember."), cls:"dim"}]), ms:1700, raw:true, sfx:()=>lowHit(98, 1.4, .08)});
      f[f.length-1].ms = 2400;
      const head = [{t:" ORACLE//ZERO  r9", cls:"inv", full:true}, " counter-intrusion", "-".repeat(22)];
      f.push({lines:head, ms:900, raw:true});
      const done = [];
      const bar = k => " [" + "|".repeat(k) + ".".repeat(10 - k) + "] " + String(k*10).padStart(3," ") + "%";
      const step = (label, result, hold, sfx)=>{
        for(let k=0;k<=10;k++) f.push({lines:head.concat(done, [" " + label, bar(k)]), ms:k === 0 ? 300 : 75, raw:true, sfx: k === 10 ? ()=>lowHit(110, .12, .03) : null});
        result.forEach(r=>done.push(r));
        f.push({lines:head.concat(done), ms:hold, raw:true, sfx});
      };
      step("candidate engine", [" [ok] candidate engine"], 700);
      step("residue scrubber", [" [ok] residue scrubber"], 700);
      step("decision model", [" [ok] decision model"], 700);
      step("licence check", [" [!!] licence REVOKED", "      asset 44-0917"], 1800, ()=>lowHit(73, .5, .07));
      step("field override", [" override: field mode"], 1200, ()=>lowHit(98, .35, .05));
      f.push({lines:head.concat(done, ["", inserted ? " media mounted." : " awaiting media."]), ms:2000, raw:true});
      return f;
    },
    boot:[{t:" ORACLE//ZERO  r9", cls:"inv", full:true}, " counter-intrusion"],
    hello:[" media mounted.", " analysis ready."], idle:[" awaiting media."],
    menu:k=>["1solve 2scan 3tools", (k === "text" ? "4read" : "4review") + " *eject"],
    str:{noGuessS:" awaiting"},
    tryHint:"#submit *del", confirm:" [#] confirm [*] cancel", scanTitle:"scan running",
    cracked:(i,n)=>["", {t:" DECLASSIFIED ", cls:"inv"}, "", " blk " + String(i).padStart(2,"0") + " clear", " attempts used: " + n, " residue: none"],
    out:["", " [FAIL] budget 0", " sealed blocks purged.", " log closed."],
    sound:{wave:"triangle", key:1200, hit:980, miss:600, ok:[784,1175], bad:400, boot:[523,659,784,1047]}, fx:"sweep"
  }
};
// RAZORBACK PRO 5 // KX: the Tianshu-native edition
(function(){
  const oracle = CRACKERS.oracle; delete CRACKERS.oracle;
  CRACKERS.razorkx = Object.assign({}, CRACKERS.razor, {
    name:"RAZORBACK KX", ver:"PRO 5", blurb:"Tianshu-native RAZORBACK. Full colour, one window per target. ARCHON-7 only.",
    stripe:"repeating-linear-gradient(-45deg,#c23b2a 0 6px,#2a0f0b 6px 12px,#3fd6ff 12px 15px,#2a0f0b 15px 20px)",
    title:id=>"▓ RAZORBACK KX ▓ " + id,
    boot:["", " ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓", "  RAZORBACK PRO 5", "  KX // TIANSHU NATIVE", " ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"],
    nativeOn:"archon", targetWins:true, gui:true, upper:false,
    terms:{sec:"target", juice:"ammo", crack:"smash", sniff:"recon", warez:"loadout", open:"down", lock:"live", burn:"lost", nope:"ruled out", enc:"cipher"},
    str:{probeWord:"assist", noGuessS:"No shots fired yet"},
    cracked:(i,n)=>["Target " + i + " down", "Cleared in " + n + (n === 1 ? " shot." : " shots.")],
    out:["Out of ammo", "Every live target on this shard is lost."],
    sound:{wave:"sine", key:900, hit:660, miss:392, ok:[523,659,784,1047], bad:196, boot:[392,523,659]}
  });
  CRACKERS.tenkyu = Object.assign({}, CRACKERS.shiv, {
    name:"HUNTIAN 浑天", ver:"1.0", by:"Lin Yuhan, ex-Tianshu", blurb:"Reads the whole shard as an armillary sphere of star-mansion glyphs. Breaks the cipher, not the locks. Chinese or English interface. ARCHON-7 only.",
    stripe:"radial-gradient(circle at 20% 50%,#f0c97a 0 2px,transparent 3px) 0 0/14px 10px,radial-gradient(circle at 70% 30%,#8fc9ff 0 1.5px,transparent 2.5px) 0 0/22px 10px,#0b1020",
    title:id=>(S.tkLang === "en" ? "HUNTIAN · shard " : "浑天 · 数据片 ") + id,
    nativeOn:"archon", gui:true, tk:true, upper:false,
    sw:{analyzer:false, elim:true, cheap:false, map:null, tags:null, probe:0},
    terms:{sec:"sector", juice:"attempts", crack:"lock", sniff:"scan", warez:"tools", open:"readable", lock:"sealed", burn:"lost", nope:"ruled out", enc:"cipher"},
    str:{noGuessS:"No guesses yet"},
    hello:["Shard mapped."], idle:["No shard loaded."],
    sound:{wave:"sine", key:1100, hit:880, miss:440, ok:[659,880,1319], bad:220, boot:[523,659,784]}
  });
  Object.defineProperty(CRACKERS.tenkyu, "out", {get:()=>S.tkLang === "en" ? ["Out of attempts", "The unread sectors have faded to static."] : ["尝试次数已用尽", "未读扇区已化为杂讯。"]});
  CRACKERS.oracle = oracle;
  CRACKERS.oraclek = Object.assign({}, oracle, {
    name:"ORACLE//ZERO", ver:"r10 XJ", by:"Kestrel DataSystems", blurb:"Kestrel's counter-intrusion suite, rebuilt for Tianshu's Xuanji OS. Full engine, no meltdown. ARCHON-7 only.",
    stripe:"linear-gradient(90deg,#e8e4da 0 30%,#141617 30% 36%,#e8e4da 36% 70%,#141617 70% 76%,#6fd3c6 76% 80%,#e8e4da 80%)",
    nativeOn:"archon", gui:true, or:true, bootFrames:null,
    terms:{sec:"block", juice:"budget", crack:"solve", sniff:"scan", warez:"tools", open:"clear", lock:"sealed", burn:"purged", nope:"excluded", enc:"cipher"},
    str:{probeWord:"solver", noGuessS:"Awaiting input"},
    cracked:(i,n)=>["DECLASSIFIED", "Block " + String(i).padStart(2, "0") + " clear", "Attempts used: " + n, "Residue: none"],
    out:["Budget exhausted", "Sealed blocks purged. Log closed."]
  });
})();
// ---------- SPLICE custom carts: cart images built in the SPLICE assembler ----------
const CART_STORE = "shrdshiv-splice-carts";
let CUSTOM = [];
function cartRead(){ try{ const r = localStorage.getItem(CART_STORE); if(r){ const a = JSON.parse(r); if(Array.isArray(a)) return a; } }catch(e){} return []; }
function cartWrite(){ try{ localStorage.setItem(CART_STORE, JSON.stringify(CUSTOM)); }catch(e){} }
function parseCart(text){
  const t = String(text || "").trim().replace(/\s+/g, "");
  if(!t) throw new Error("Paste a cart image first.");
  const body = t.indexOf("SPLICE1:") === 0 ? t.slice(8) : t;
  let img;
  try{ img = JSON.parse(decodeURIComponent(escape(atob(body)))); }catch(e){ throw new Error("That isn't a SPLICE cart image. Copy it again from SPLICE's Build sheet."); }
  if(!img || typeof img !== "object") throw new Error("That isn't a SPLICE cart image.");
  if(!img.x) throw new Error("This image came from an older SPLICE build. Build the cart again and copy the new image.");
  if(img.x.kind === "ice") throw new Error("That's an ICE image. Paste it into New shard to protect a shard with it.");
  if(!img.x.runs || !img.x.runs.length) throw new Error("This cart doesn't run on either deck, so it can't be burned.");
  return img;
}
const DECK_SHORT = {ds4:"DS-4", archon:"ARCHON-7"};
function customDef(c){
  const x = c.img.x, seen = k=>!x.vis || !!x.vis[k], nm = String(c.img.n || "custom").toUpperCase().slice(0, 14);
  const feats = [x.analyzer ? "positional marks" : null, x.elim ? "elimination" : null, x.cand ? "candidate count" : null, x.est ? "estimates" : null,
    x.probe ? "probe level " + x.probe : null, x.auto ? "lock-on" : null, x.spread ? "spread shot" : null, x.zeroTrace ? "zero trace" : null,
    x.scans === "free" ? "free scans" : x.scans === "none" ? "no scans" : null, x.map === "auto" || x.skim ? "auto map" : null, x.freeOn && x.freeOn.length ? "cipher tables" : null,
    x.safe ? "safe lock" : null, x.side ? "side channel" : null, x.sym ? "symbol count" : null, x.reserve ? "reserve " + x.reserve : null, x.deadman ? "deadman " + x.deadman : null,
    x.validate === false ? "no validation" : null, x.macro ? "macro key" : null, x.predict ? "predictive input" : null, x.hud ? "HUD" : null, x.ghost ? "ghostboot" : null, x.signed ? "signed (" + x.signed + ")" : null,
    x.rows ? x.rows + " history rows" : null, x.logbook ? "logbook" : null, x.watermark && x.watermark.length ? "watermarked (" + x.watermark.join(", ") + ")" : null, x.solverIntel ? "intel-fed solver" : null].filter(Boolean);
  return Object.assign({}, CRACKERS.shiv, {
    name:nm, ver:"custom", by:"SPLICE", blurb:"Your SPLICE build: " + (feats.join(", ") || "the bare minimum") + ". " + x.mem + " KB." + (x.reports ? " Reports to Meridian." : ""),
    stripe:"repeating-linear-gradient(90deg,#c27a12 0 6px,#1c2830 6px 12px)",
    sw:{analyzer:!!x.analyzer, elim:!!x.elim, cheap:false, map:x.skim ? (seen("skim") ? "auto" : null) : x.map === "auto" && !seen("survey") ? null : x.map, tags:null, probe:x.probe || 0},
    terms:{sec:"sec", juice:"juice", crack:"crack", sniff:"scan", warez:"warez", open:"open", lock:"lock", burn:"BURN", nope:"out", enc:"enc"},
    banner:x.cand ? {t:" " + nm.slice(0, 12) + " :: SPLICE", cls:"inv", full:true} : undefined,
    title:id=>nm.slice(0, 12) + " :: " + id,
    boot:["", " " + nm, " SPLICE custom build", " " + x.mem + " KB · " + x.runs.map(r=>DECK_SHORT[r]).join("+")],
    hello:[" shard mounted."], idle:[" no shard in the slot."],
    menu:k=>["1crack 2scan 3warez", (k === "text" ? "4read" : "4play") + (x.logbook ? " 5log" : "") + " *eject"],
    tryHint:"#try *del/back",
    cracked:(i,n)=>["", " OPEN", "", " sec" + i + " cracked", " in " + n + (n === 1 ? " try." : " tries.")],
    out:["", " OUT OF JUICE", "", " locked sectors", " burned to static."],
    cand:!!x.cand, est:!!x.est && seen("est"), ident:!!x.ident && seen("ident"), hasEst:!!x.est, hasIdent:!!x.ident, hasSkim:!!x.skim, hasSurvey:x.map != null,
    seeScans:seen("scans"), seeSurvey:seen("survey"), seeSide:seen("side"), logbook:x.logbook || null, solverIntel:!!x.solverIntel, auto:!!x.auto, zeroTrace:!!x.zeroTrace, spread:!!x.spread, rack:!!x.spread, elimBug:x.elimBug || null,
    freeScans:x.scans === "free", noScans:x.scans === "none", freeOn:x.freeOn || [], reports:!!x.reports, runs:x.runs.slice(), custom:c.id, heatRating:x.heat || 0,
    histRows:x.rows || 4, hud:!!x.hud, safe:!!x.safe, side:!!x.side, sym:!!x.sym, noValidate:x.validate === false, reserve:x.reserve || 0, deadman:x.deadman || 0,
    skim:!!x.skim, macro:!!x.macro, predict:!!x.predict, ghost:!!x.ghost, signed:x.signed || null, bugs:(x.bugs || []).slice(), watermark:(x.watermark || []).slice()
  });
}
function registerCustom(){
  Object.keys(CRACKERS).forEach(k=>{ if(CRACKERS[k].custom) delete CRACKERS[k]; });
  CUSTOM.forEach(c=>{ try{ CRACKERS[c.id] = customDef(c); }catch(e){} });
}
CUSTOM = []; registerCustom();
const strHashB = t=>{ let x = 7; for(const c of t) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };
// bugs a SPLICE cart shipped with
function hasBug(k){ const v = V(); return !!(v && v.bugs && v.bugs.includes(k)); }
// logbook: notes a custom cart keeps per shard, saved with the cart
function logs(kind){ const v = V(); return !!(v && v.custom && v.logbook && v.logbook.includes(kind)); }
function logNotes(id){ const v = V(), c = v && CUSTOM.find(x=>x.id === v.custom); return c ? ((c.notes || (c.notes = {}))[id] || (c.notes[id] = [])) : null; }
function logNote(kind, lines){
  if(!logs(kind) || !S.inserted) return false;
  const a = logNotes(S.inserted); if(!a) return false;
  let added = false;
  lines.forEach(t=>{ t = String(t).trim(); if(t && !a.includes(t)){ a.push(t); added = true; } });
  if(a.length > 80) a.splice(0, a.length - 80);
  if(added) cartWrite();
  return true;
}
// what happens when a cartridge meets a deck
function compat(id, deck){
  const c = CRACKERS[id]; if(!c) return "none";
  if(c.runs) return c.runs.includes(deck) ? "native" : (deck === "archon" && c.runs.includes("ds4") ? "emu" : "reject");
  if(c.nativeOn) return c.nativeOn === deck ? "native" : "reject";
  if(deck === "ds4") return "native";
  if(id === "oracle") return "overheat";
  return "emu";
}
const CORP_SOUND = {wave:"square", key:720, hit:520, miss:300, ok:[523,659], bad:110, boot:[220,330]};
const V = () => S.cracker ? CRACKERS[S.cracker] : null;
const STR = {noGuess:" no guesses yet", back:"*back", hint:" hint",
  need:n=>"need " + n + " symbols.", only:r=>"only " + r + " here.", noRep:"no repeats here.", noSpend:"no {juice} spent.",
  codeLen:" code length", symbols:n=>" >> " + n + " symbols", holds:" holds", hardest:" hardest locked {sec}",
  uses:" uses", distinct:n=>" >> " + n + " distinct syms", diffMap:" difficulty map", tagsDone:" content tags",
  onMap:" >> on the map now", notEnough:" not enough {juice}.",
  probeWord:"probe", pTest:" test:", pTestLbl:"test", noGuessS:" no guesses", hintW:"peek",
  pBlockedS:"blocked", pSpentS:"spent", pCoolS:"wait", pBlocked:"lock too strong", pSpent:"spent", pCool:"after next guess", pLocked:n=>"at <=" + n + " cand", pFree:"free", pCharge:"charging", dry1:" that would dry the", dry2:" shard out.", cost:n=>say(" -" + n + " {juice}")};
function T(k, a){ const v = V(); const e = (v && v.str && v.str[k] !== undefined) ? v.str[k] : STR[k]; return typeof e === "function" ? e(a) : say(e); }
function say(str){ const v = V(); return v ? str.replace(/\{(\w+)\}/g, (m,k)=>v.terms[k] || k) : str; }
function snd(){ const v = V(); return v ? v.sound : CORP_SOUND; }

const WARE = [
  {k:"probe", name:"peek", label:"Peek"},
  {k:"bypass", name:"bypass", label:"Bypass"},
  {k:"brute", name:"bruteforce", label:"Brute force"},
  {k:"scrap", name:"scrapper", label:"Scrapper"},
  {k:"reset", name:"reset", label:"Reset"},
  {k:"insight", name:"insight", label:"Insight"}
];
const BASE_SCANS = [
  {k:"len", label:"length of {sec}", cost:1, needSec:true},
  {k:"type", label:"contents of {sec}", cost:2, needSec:true, hide:F=>F.autoTags},
  {k:"hard", label:"hardest {sec}", cost:3, hide:F=>F.auto},
  {k:"sym", label:"symbols in {sec}", cost:4, needSec:true},
  {k:"all", label:"all difficulty", cost:5, hide:F=>F.autoMap}
];

// ==================== custom shards and ICE ====================
const ICE_MAKER = {sc1:"FERROUS LOGIC", ksc4:"HALDEN & PRYCE", tsv:"MNEMOS", akvc:"AURELIUS-KADE"};
const ICE_CTRL = {sc1:"Ferrous FL-1", ksc4:"H&P Warden-4", tsv:"Mnemos MV-3", akvc:"AK vault core"};
const blockCipher = e=>!e || e === "A" || e === "X";
function saveCustomShards(){ try{ localStorage.setItem(SSTORE, JSON.stringify(SHARDS.filter(d=>d.custom).map(d=>d.src))); }catch(e){} }
function prepShard(d){
  if(!d.src) d.src = JSON.parse(JSON.stringify(d));
  d.kind = d.kind || "audio";
  const scheme = d.enc || "A";
  d.enc = d.sectors.every(s=>s.lvl === 0) ? null : scheme;
  if(d.kind === "text") d.map = buildCharMap(Object.assign(d, {enc: scheme}));
  if(d.sectors.every(s=>s.lvl === 0)) d.enc = null;
}
function restoreDef(d){ if(!d.custom || !d.src) return; const o = JSON.parse(JSON.stringify(d.src)); d.sectors = o.sectors; d.text = o.text; d.enc = o.enc; prepShard(d); }
const JUNK = "QXZJVKWYFGPBHMNRT";
function junkSector(d, i){
  if(d.map) d.map.forEach(c=>{ if(c.sec === i && c.ch !== " ") c.ch = JUNK[Math.floor(Math.random() * JUNK.length)]; });
  if(d.sectors[i] && d.sectors[i].text) d.sectors[i].text = d.sectors[i].text.replace(/\S/g, ()=>JUNK[Math.floor(Math.random() * JUNK.length)].toLowerCase());
}
function iceBug(k){ const d = curDef(); return !!(d && d.ice && d.ice.bugs && d.ice.bugs.includes(k)); }
function iceOn(){ const d = curDef(), sh = cur(); return !!(d && d.ice && sh && !sh.iceOff); }
function iceAudit(text){
  const d = curDef(); if(!d || !d.ice) return;
  if(d.ice.reports) corpLog("MERIDIAN COMPLIANCE", "Shard " + d.id + ": " + text);
  if(!d.ice.logger) return;
  if(iceBug("logdrop") && Math.random() < .4) return;
  corpLog((ICE_MAKER[d.ice.ctrl] || "SHARD") + " AUDIT", "Shard " + d.id + ": " + text);
}
// per-sector juice (key vaults): while cracking a vaulted sector, sh.juice is that sector's juice
function enterSwap(sh, i){
  if(!sh || !sh.secJ || sh.secJ[i] == null || sh.swap != null) return;
  sh.poolSave = sh.juice; sh.poolMaxSave = sh.max; sh.juice = sh.secJ[i]; sh.max = sh.secMax[i]; sh.swap = i;
}
function leaveSwap(sh){
  if(!sh || sh.swap == null) return;
  sh.secJ[sh.swap] = Math.max(0, sh.juice); sh.juice = sh.poolSave; sh.max = sh.poolMaxSave; sh.swap = null;
  if(sh.vaultOnly){ sh.juice = sh.secJ.reduce((a, b)=>a + (b || 0), 0); }
}
function iceFresh(def, sh){
  const I = def.ice; if(!I) return sh;
  sh.alert = 0;
  const J = I.juice, n = def.sectors.length;
  if(J.mode === "vault" || J.mode === "tiered"){
    sh.secJ = Array(n).fill(null); sh.secMax = Array(n).fill(null);
    def.sectors.forEach((s, i)=>{ let v = null;
      if(J.mode === "vault") v = s.honey ? 4 : (J.per[i] != null ? J.per[i] : J.per[J.per.length - 1]);
      else if(i === I.n - 1) v = J.last;
      if(v != null){ sh.secJ[i] = v; sh.secMax[i] = v; } });
    if(J.mode === "vault"){ sh.vaultOnly = true; sh.juice = sh.max = sh.secJ.reduce((a, b)=>a + (b || 0), 0); }
  }
  if(I.bugs && I.bugs.includes("weakrng")){
    const L = sh.sectors.map((s, i)=>({s, i})).filter(x=>x.s.status === "locked");
    const mk = lv=>{ const dd = Math.max(1, Math.min(6, lv)), c = DIFF[dd], pool = HEX.slice(0, c.syms).split(""); let code = ""; while(code.length < c.len){ const ch = pool[Math.floor(Math.random() * pool.length)]; if(c.rep || !code.includes(ch)) code += ch; } return {code, diff:dd, history:[], hints:{}}; };
    for(let a=0;a<L.length;a++) for(let b=a+1;b<L.length;b++){ if(!sh.dup && L[a].s.lvl === L[b].s.lvl){ L[a].s.puzzle = mk(L[a].s.lvl); L[b].s.puzzle = Object.assign(mk(L[b].s.lvl), {code:L[a].s.puzzle.code}); sh.dup = [L[a].i, L[b].i]; } }
  }
  return sh;
}
function iceScore(code, g, basePos){
  const d = curDef(), F = feat();
  if(!d || !d.ice) return {r:score(code, g, basePos), pos:!!basePos};
  if(cur().iceOff) return {r:score(code, g, true), pos:true};
  const fb = d.ice.fb, pos = fb === "positions" || F.analyzer;
  let r;
  if(fb === "sparse"){ const full = score(code, g, true); r = pos ? full.replace(/○/g, "·") : ("●".repeat((full.match(/●/g) || []).length) || "-"); }
  else r = score(code, g, pos);
  if(fb === "noisy" && g !== code && Math.random() < .2) r = r.includes("○") ? (pos ? r.replace("○", "·") : r.replace("○", "") || "-") : (pos ? r : r + "○");
  if(fb === "delay") ui.hangUntil = performance.now() + 2500;
  if(iceBug("fbleak") && !pos && Math.random() < .35) return {r:score(code, g, true), pos:true};
  return {r, pos};
}
function iceTrip(rule, why){
  if(!iceOn()) return false;
  const d = curDef(), sh = cur();
  if(!d.ice.rules.includes(rule)) return false;
  if(iceBug("misstrip") && Math.random() < .4) return false;
  sh.alert = Math.min(3, (sh.alert || 0) + (rule === "sniff" ? 3 : 1));
  logEvt("ice trip " + rule); iceAudit("tripwire " + why + ".");
  return true;
}
// returns a message to show (or null) after the sentries fire
function iceSentries(){
  const d = curDef(), sh = cur(); if(!iceOn() || (sh.alert || 0) < 3) return null;
  sh.alert = 0;
  if(!d.ice.sentries.length) return null;
  if(iceBug("sentrydud") && Math.random() < .5) return null;
  const s = ui.sec != null && sh.sectors[ui.sec] && sh.sectors[ui.sec].status === "locked" ? sh.sectors[ui.sec] : sh.sectors.find(x=>x.status === "locked");
  const lines = ["", " ICE RESPONSE"];
  d.ice.sentries.forEach(k=>{
    if(k === "lockdown" && s){ s.freeze = Date.now() + 20000; lines.push(" sector frozen 20 s"); }
    if(k === "trace"){ sh.tampered = true; lines.push(" trace: deck logged"); corpLog((ICE_MAKER[d.ice.ctrl] || "SHARD") + " SECURITY", "Intrusion on shard " + d.id + ". Deck SN " + DECKS[S.deck].sn + " traced."); }
    if(k === "scramble" && s){ s.puzzle = makePuzzle(s); lines.push(" sector re-keyed"); }
    if(k === "black"){ sh.black = (sh.black || 0) + 1; lines.push({t:" BLACK ICE ", cls:"inv"}, " GM consequence"); }
  });
  iceAudit("sentries fired: " + d.ice.sentries.join(", ") + ".");
  logEvt("ice sentry");
  return lines;
}
function iceDryHook(sh){
  const d = curDef(); if(!d || !d.ice) return false;
  if(sh.juice <= 0 && iceBug("juiceover") && Math.random() < .5 && lockedIdx(sh).length){ sh.juice = sh.max; save(); return false; }
  if(sh.swap != null){
    const i = sh.swap, s = sh.sectors[i];
    if(sh.juice <= 0 && s.status === "locked"){
      if(d.ice.poison){ s.status = "open"; s.puzzle = null; s.trace = true; junkSector(d, i); (sh.junk = sh.junk || []).push(i); }
      else { s.status = "burned"; s.puzzle = null; }
      leaveSwap(sh); save(); iceAudit("sector " + (i + 1) + " ran dry.");
      noise(1); showMsg(d.ice.poison ? [say("{sec}") + (i + 1), "", " vault dry.", " sector open?"] : [say("{sec}") + (i + 1), "", " vault dry.", " sector burned."], 2200, toMap);
      return true;
    }
    leaveSwap(sh);
  }
  if(d.ice.poison && sh.juice <= 0 && lockedIdx(sh).length){
    sh.sectors.forEach((s, i)=>{ if(s.status === "locked"){ s.status = "open"; s.puzzle = null; s.trace = true; junkSector(d, i); (sh.junk = sh.junk || []).push(i); } });
    sh.juice = 0; save(); iceAudit("juice dry, junk written.");
    showMsg(["", " all sectors open.", "", " (or are they?)"], 2400, toMap);
    return true;
  }
  return false;
}
function iceIntro(id){
  const d = defOf(id), sh = S.shards[id]; if(!d || !d.ice) return null;
  sh.iceOff = !!(d.ice.bugs && d.ice.bugs.includes("bootfail") && Math.random() < .5);
  if(sh.iceOff){ logEvt("ice offline"); return null; }
  const v = V();
  if(v && (v.side || v.skim) && iceTrip("sniff", "side channel")) return iceSentries();
  return null;
}
// ---------- shard form (GM) ----------
let NS = null;
function nsFresh(){
  let id; do { id = String(Math.floor(1000 + Math.random() * 8999)); } while(defOf(id));
  return {id, name:"", color:"#8a7fb3", kind:"text", enc:"A", juice:20, key:String(Math.floor(100000 + Math.random() * 899999)), n:3,
    secs:[{lvl:2, type:"DATA", text:""}, {lvl:3, type:"DATA", text:""}, {lvl:3, type:"DATA", text:""}], text:"", ice:null, iceRaw:"", iceName:""};
}
function nsIce(raw){
  const t = String(raw || "").trim().replace(/\s+/g, ""); if(!t) return null;
  try{ const im = JSON.parse(decodeURIComponent(escape(atob(t.indexOf("SPLICE1:") === 0 ? t.slice(8) : t)))); if(im && im.x && im.x.kind === "ice") return {x:im.x, n:im.n}; }catch(e){}
  return false;
}
function nsApplyIce(){
  const I = NS.ice; if(!I) return;
  const n = I.n + (I.honeypot ? 1 : 0);
  NS.n = n; NS.enc = I.cipher || "X";
  while(NS.secs.length < n) NS.secs.push({lvl:3, type:"DATA", text:""});
  NS.secs = NS.secs.slice(0, n);
  I.d.forEach((v, i)=>{ NS.secs[i].lvl = v; });
  if(I.honeypot){ NS.secs[n - 1].lvl = 2; NS.secs[n - 1].type = "DATA"; }
  NS.juice = I.juice.mode === "pool" || I.juice.mode === "tiered" ? I.juice.pool : I.juice.per.reduce((a, b)=>a + b, 0);
  if(!blockCipher(NS.enc)) NS.kind = "text";
}
function renderNS(){
  const el = document.getElementById("nsForm"); if(!el) return;
  if(!NS) NS = nsFresh();
  const I = NS.ice, lock = I ? " disabled" : "", blk = blockCipher(NS.enc);
  const encs = [["", "none (plain)"], ["A", "SEGLOCK · per-sector text"], ["X", "XORPAD · per-sector text"], ["B", "COMB · one text"], ["C", "CHAFF · one text"], ["R", "ROOKCRYPT · one text"]];
  let h = '<div class="ns-grid">' +
    '<label>ID<input data-ns="id" value="' + esc(NS.id) + '" maxlength="4" inputmode="numeric"></label>' +
    '<label class="wide">Name<input data-ns="name" value="' + esc(NS.name) + '" maxlength="28" placeholder="e.g. Pier 9 manifest"></label>' +
    '<label>Colour<input type="color" data-ns="color" value="' + esc(NS.color) + '"></label>' +
    '<label>Kind<select data-ns="kind"' + (blk ? "" : " disabled") + '><option value="text"' + (NS.kind === "text" ? " selected" : "") + '>text</option><option value="audio"' + (NS.kind === "audio" ? " selected" : "") + ">audio</option></select></label>" +
    '<label>Owner key<input data-ns="key" value="' + esc(NS.key) + '" maxlength="6" inputmode="numeric"></label>' +
    '<label class="wide">Cipher<select data-ns="enc"' + lock + ">" + encs.map(([v, t])=>'<option value="' + v + '"' + ((NS.enc || "") === v ? " selected" : "") + ">" + t + "</option>").join("") + "</select></label>" +
    '<label>Juice<input type="number" min="0" max="80" data-ns="juice" value="' + NS.juice + '"' + lock + "></label>" +
    '<label>Sectors<select data-ns="n"' + lock + ">" + [1,2,3,4,5,6,7,8,9].map(n=>'<option' + (n === NS.n ? " selected" : "") + ">" + n + "</option>").join("") + "</select></label></div>";
  h += '<div class="ns-secs">' + NS.secs.map((s, i)=>{
    const honey = I && I.honeypot && i === NS.n - 1;
    return '<div class="ns-sec"><b>sec ' + (i + 1) + (honey ? " · honeypot" : "") + '</b><select data-nslvl="' + i + '"' + lock + ">" + [0,1,2,3,4,5,6].map(v=>'<option value="' + v + '"' + (v === s.lvl ? " selected" : "") + ">" + (v ? "d" + v : "open") + "</option>").join("") + "</select>" +
      (blk ? '<input data-nstype="' + i + '" value="' + esc(s.type) + '" maxlength="8" placeholder="TYPE" aria-label="Sector ' + (i + 1) + ' type"><input class="ns-txt" data-nstext="' + i + '" value="' + esc(s.text) + '" placeholder="' + (honey ? "decoy content" : "What this sector says") + '" aria-label="Sector ' + (i + 1) + ' text">' : "") + "</div>"; }).join("") + "</div>";
  if(!blk) h += '<label class="ns-one">Shard text (spread across the sectors by the cipher)<textarea data-ns="text" rows="3" placeholder="The whole message">' + esc(NS.text) + "</textarea></label>";
  h += '<label class="ns-one">ICE image (optional)<textarea id="nsIce" rows="2" placeholder="Paste an ICE image from SPLICE to protect this shard with it" spellcheck="false">' + esc(NS.iceRaw) + "</textarea></label>";
  if(I) h += '<p class="ns-ice">ICE: <b>' + esc(String(NS.iceName || "custom").toUpperCase()) + "</b> on " + esc(ICE_CTRL[I.ctrl] || I.ctrl) + " · " + I.n + " sectors" + (I.honeypot ? " + honeypot" : "") + " · " + esc((ENC[I.cipher] || {name:I.cipher}).name) + " · " + I.fb + " feedback · juice " + (I.juice.mode === "vault" ? I.juice.per.join("/") + " per sector" : I.juice.mode === "tiered" ? I.juice.pool + " + " + I.juice.last + " vault" : I.juice.pool) +
    (I.sentries.length ? " · sentries: " + I.sentries.join(", ") : "") + (I.black ? ' · <b class="bad">BLACK ICE</b>' : "") + ". The ICE sets the cipher, sectors, difficulty and juice.</p>";
  h += '<div class="burn-row"><button type="button" class="btn" id="nsMake">Create shard</button><button type="button" class="btn" id="nsClear">Clear form</button><span id="nsMsg" role="status"></span></div>';
  const mine = SHARDS.filter(d=>d.custom);
  h += mine.length ? '<div>' + mine.map(d=>'<div class="burn-item"><span><b>' + esc(d.id) + "</b> " + esc(d.name) + (d.ice ? " · ICE" : "") + '</span><button type="button" class="mini wide" data-nsdel="' + esc(d.id) + '">Erase</button></div>').join("") + "</div>" : "";
  el.innerHTML = h;
}
function nsMsg(t, bad){ const m = document.getElementById("nsMsg"); if(m){ m.textContent = t; m.className = bad ? "bad" : ""; } }
function nsCreate(){
  const N = NS, I = N.ice, blk = blockCipher(N.enc);
  if(!/^\d{4}$/.test(N.id)) return nsMsg("The ID needs 4 digits.", true);
  if(defOf(N.id)) return nsMsg("Shard " + N.id + " already exists.", true);
  if(!N.name.trim()) return nsMsg("Give the shard a name.", true);
  if(N.key && !/^\d{6}$/.test(N.key)) return nsMsg("The owner key needs 6 digits.", true);
  if(blk && N.secs.some(s=>!s.text.trim())) return nsMsg("Every sector needs some text.", true);
  if(!blk && N.text.trim().split(/\s+/).length < N.n) return nsMsg("The text needs at least one word per sector.", true);
  const allOpen = N.secs.every(s=>s.lvl === 0);
  const def = {id:N.id, name:N.name.trim(), color:N.color, kind:blk ? N.kind : "text", enc:allOpen ? undefined : (N.enc || "A"), juice:allOpen ? 0 : Math.max(1, +N.juice || 1), key:allOpen ? null : (N.key || null), custom:true,
    sectors:N.secs.map((s, i)=>Object.assign(blk ? {lvl:s.lvl, type:(s.type || "DATA").toUpperCase().slice(0, 8), text:s.text.trim()} : {lvl:s.lvl}, I && I.honeypot && i === N.n - 1 ? {honey:true} : {}))};
  if(!blk) def.text = N.text.trim().replace(/\s+/g, " ");
  if(allOpen) def.sectors.forEach(s=>s.lvl = 0);
  if(I){ def.ice = I; def.iceName = N.iceName || "custom ICE"; }
  def.src = JSON.parse(JSON.stringify(def));
  SHARDS.push(def); prepShard(def); S.shards[def.id] = freshShard(def); save(); saveCustomShards();
  NS = nsFresh(); renderNS(); renderTray(); nsMsg("Created shard " + def.id + ". It's in the shard tray.");
  beep(660, .06, "square", .03);
}
function nsDelete(id){
  if(S.inserted === id){ cancelTimers(); S.inserted = null; ui.mode = "idle"; }
  const k = SHARDS.findIndex(d=>d.id === id); if(k >= 0) SHARDS.splice(k, 1);
  delete S.shards[id]; save(); saveCustomShards(); renderNS(); renderTray(); render(); nsMsg("Shard " + id + " erased.");
}
function nsWire(){
  const el = document.getElementById("nsForm"); if(!el) return;
  el.addEventListener("input", e=>{
    const t = e.target;
    if(t.id === "nsIce"){ NS.iceRaw = t.value; const r = nsIce(t.value); if(r){ NS.ice = r.x; NS.iceName = r.n; nsApplyIce(); renderNS(); nsMsg("ICE loaded."); } else if(r === false){ if(NS.ice){ NS.ice = null; renderNS(); } nsMsg("That isn't an ICE image. Build ICE in SPLICE and copy its image.", true); } else { if(NS.ice){ NS.ice = null; renderNS(); } } return; }
    if(t.dataset.ns === "id" || t.dataset.ns === "name" || t.dataset.ns === "key" || t.dataset.ns === "text") NS[t.dataset.ns] = t.value;
    else if(t.dataset.nstype != null) NS.secs[+t.dataset.nstype].type = t.value;
    else if(t.dataset.nstext != null) NS.secs[+t.dataset.nstext].text = t.value;
    else if(t.dataset.ns === "juice") NS.juice = parseInt(t.value, 10) || 0;
    else if(t.dataset.ns === "color") NS.color = t.value;
  });
  el.addEventListener("change", e=>{
    const t = e.target;
    if(t.dataset.ns === "kind"){ NS.kind = t.value; }
    else if(t.dataset.ns === "enc"){ NS.enc = t.value; if(!blockCipher(NS.enc)) NS.kind = "text"; renderNS(); }
    else if(t.dataset.ns === "n"){ NS.n = +t.value; while(NS.secs.length < NS.n) NS.secs.push({lvl:3, type:"DATA", text:""}); NS.secs = NS.secs.slice(0, NS.n); renderNS(); }
    else if(t.dataset.nslvl != null){ NS.secs[+t.dataset.nslvl].lvl = +t.value; }
  });
  el.addEventListener("click", e=>{
    const t = e.target.closest("button"); if(!t) return;
    if(t.id === "nsMake") nsCreate();
    else if(t.id === "nsClear"){ NS = nsFresh(); renderNS(); }
    else if(t.dataset.nsdel) nsDelete(t.dataset.nsdel);
  });
  renderNS();
}

// ---------- state ----------
const STORE = "havenport-engine-v1";
function freshShard(def){
  if(def.custom) restoreDef(def);
  return iceFresh(def, {juice:def.juice, max:def.juice, hard:false, sectors:def.sectors.map(s=>({
    status: s.lvl === 0 ? "open" : "locked", lvl:s.lvl, puzzle:null, known:{}
  }))});
}
const DECKS = {
  ds4:{name:"KESTREL DS-4", short:"DS-4", maker:"Kestrel DataSystems", sn:"44-0917", bays:2, blurb:"Consumer datadeck. Cheap, tough, 2 expansion bays. Looks like a calculator."},
  archon:{name:"TIANSHU ARCHON-7", short:"ARCHON-7", maker:"Tianshu Systems", sn:"TS7-2219", bays:5, blurb:"Shenzhen-built runner deck by Tianshu 天枢. Xuanji OS, multi-window display, 7 programmable side keys, 5 expansion bays."}
};
const HW = [["auto","AUTO-SCAN"],["map","SURVEY"],["tags","INDEXER"],["cheap","EFFICIENCY"],["coproc","CO-PROC"]];
const blankUpg = ()=>({auto:false, map:false, tags:false, cheap:false, coproc:false});
const hwUsed = u=>HW.filter(([k])=>u[k]).length;
function freshState(){
  const deckUpg = {ds4:blankUpg(), archon:blankUpg()};
  const st = {rating:0, deck:"ds4", deckUpg, upg:deckUpg.ds4,
    ware:{probe:0, bypass:0, brute:0, scrap:0, reset:0, insight:0}, show:false, voice:true,
    inserted:null, cracker:null, shards:{}};
  SHARDS.forEach(d=>st.shards[d.id] = freshShard(d));
  return st;
}
let S = freshState();
try{
  const raw = localStorage.getItem(STORE);
  if(raw){
    const p = JSON.parse(raw);
    if(p && p.shards){
      const f = freshState();
      S = Object.assign(f, p);
      S.upg = {auto:!!(p.upg && p.upg.auto), map:!!(p.upg && p.upg.map), tags:!!(p.upg && p.upg.tags), cheap:!!(p.upg && p.upg.cheap), coproc:!!(p.upg && p.upg.coproc)};
      S.ware = Object.assign(freshState().ware, p.ware || {});
      if(p.cracker === true) S.cracker = "shiv";
      if(p.cracker === "ghost") S.cracker = "veuve";
      if(!CRACKERS[S.cracker]) S.cracker = null;
    }
  }
}catch(e){}
SHARDS.forEach(d=>{ if(!S.shards[d.id] || S.shards[d.id].sectors.length !== d.sectors.length) S.shards[d.id] = freshShard(d); });
SHARDS.forEach(d=>{ const sh = S.shards[d.id]; if(sh){ if(sh.swap != null) leaveSwap(sh); (sh.junk || []).forEach(i=>junkSector(d, i)); } });
// per-deck hardware, limited by each deck's bays
if(!S.deckUpg || typeof S.deckUpg !== "object") S.deckUpg = {ds4:S.upg};
Object.keys(DECKS).forEach(id=>{
  const u = Object.assign(blankUpg(), S.deckUpg[id] || {});
  let n = 0; HW.forEach(([k])=>{ if(u[k]){ n++; if(n > DECKS[id].bays) u[k] = false; } });
  S.deckUpg[id] = u;
});
if(!DECKS[S.deck]) S.deck = "ds4";
S.upg = S.deckUpg[S.deck];
function save(){ try{ localStorage.setItem(STORE, JSON.stringify(S)); }catch(e){} if(window.HR_onSave) window.HR_onSave(); }

// combined hardware + software features
function feat(){
  const v = V(), sw = v ? v.sw : {};
  return {
    analyzer: !!sw.analyzer,
    elim: !!sw.elim,
    cheap: (S.upg.cheap ? 1 : 0) + (sw.cheap ? 1 : 0),
    autoMap: S.upg.map || sw.map === "auto",
    autoTags: S.upg.tags || sw.tags === "auto" || homeBonus() === 1,
    paidMap: typeof sw.map === "number" ? sw.map : null,
    paidTags: typeof sw.tags === "number" ? sw.tags : null,
    auto: S.upg.auto
  };
}
function scansNow(){
  const F = feat();
  const list = (V() && V().noScans ? [] : BASE_SCANS).filter(sc=>!(sc.hide && sc.hide(F)));
  if(F.paidMap != null && !F.autoMap) list.push({k:"map", label:"full map (sw)", cost:F.paidMap, sw:true});
  if(F.paidTags != null && !F.autoTags) list.push({k:"tags", label:"tag all (sw)", cost:F.paidTags, sw:true});
  return list;
}
function scanCost(sc){
  const v = V(), d = S.inserted ? defOf(S.inserted) : null;
  if(v && (v.freeScans || (v.freeOn && d && v.freeOn.includes(d.enc)))) return 0;
  return Math.max(1, sc.cost - feat().cheap);
}

let ui = {sel:[], mode:"idle", input:"", pickFor:null, sec:null, confirm:null, msg:null, play:null, read:null};
let timer = null, timerTok = 0;
function later(ms, fn){ const t = ++timerTok; clearTimeout(timer); timer = setTimeout(()=>{ if(t === timerTok) fn(); }, ms); }
function cancelTimers(){ timerTok++; clearTimeout(timer); stopVoice(); ui.orBoot = null; ui.orCard = null; }

const defOf = id => SHARDS.find(d=>d.id === id);
const cur = () => S.inserted ? S.shards[S.inserted] : null;
const curDef = () => S.inserted ? defOf(S.inserted) : null;
const homeBonus = () => { const v = V(), d = curDef(); return v && v.home && d && d.enc === v.home ? 1 : 0; };
const diffOf = sec => Math.max(1, Math.min(6, sec.lvl - S.rating - homeBonus()));
const lockedIdx = sh => sh.sectors.map((s,i)=>s.status === "locked" ? i : -1).filter(i=>i >= 0);

// ---------- audio ----------
let actx = null;
function ac(){ if(!actx){ try{ actx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} } return actx; }
function beep(freq, dur, type, vol){
  const a = ac(); if(!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type || "square"; o.frequency.value = freq;
  o.connect(g); g.connect(a.destination);
  const t = a.currentTime; g.gain.setValueAtTime(vol || 0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur);
}
function chord(list, wave){ list.forEach((f,i)=>setTimeout(()=>beep(f, wave === "sine" ? 0.35 : 0.18, wave || "square", 0.035), i * (wave === "sine" ? 140 : 90))); }
function noise(dur){
  const a = ac(); if(!a) return;
  const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = (Math.random()*2-1) * (0.4 + 0.6*Math.abs(Math.sin(i/900)));
  const src = a.createBufferSource(), g = a.createGain(); g.gain.value = 0.05;
  src.buffer = buf; src.connect(g); g.connect(a.destination); src.start();
}
function speak(text){
  if(!S.voice) return;
  try{ if(window.speechSynthesis){ const u = new SpeechSynthesisUtterance(text); u.rate = 0.95; u.pitch = 0.8; speechSynthesis.speak(u); } }catch(e){}
}
function stopVoice(){ try{ window.speechSynthesis && speechSynthesis.cancel(); }catch(e){} }
function playTune(tune){
  let t = 0;
  tune.forEach(([f,d])=>{ setTimeout(()=>{ beep(f, d * 0.92, "square", 0.03); beep(f * 2, d * 0.6, "triangle", 0.012); }, t * 1000); t += d; });
}
function playFrames(frames, done){
  let i = 0; ui.mode = "msg";
  const step = ()=>{ const f = frames[i++]; ui.msg = f.lines; ui.raw = !!f.raw; render(); if(f.sfx) f.sfx(); later(f.ms, i < frames.length ? step : done); };
  step();
}
// deep, slow tones for Kestrel hardware
function lowSweep(f0, f1, dur, vol){
  const a = ac(); if(!a) return;
  const t = a.currentTime, g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.55);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(a.destination);
  [[1,"sine",1],[2,"triangle",.35],[3,"sine",.12]].forEach(([mult, type, lvl])=>{
    const o = a.createOscillator(), og = a.createGain();
    o.type = type; og.gain.value = lvl;
    o.frequency.setValueAtTime(f0 * mult, t);
    o.frequency.exponentialRampToValueAtTime(f1 * mult, t + dur);
    o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + .05);
  });
}
function lowHit(f, dur, vol){
  const a = ac(); if(!a) return;
  const t = a.currentTime, g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + .04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(a.destination);
  [[1,"sine",1],[2,"triangle",.3]].forEach(([mult, type, lvl])=>{
    const o = a.createOscillator(), og = a.createGain();
    o.type = type; o.frequency.value = f * mult; og.gain.value = lvl;
    o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + .05);
  });
}
function corpLog(src, text){
  if(!S.log) S.log = [];
  S.log.unshift({t:new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", second:"2-digit"}), src, text});
  if(S.log.length > 40) S.log.length = 40;
  save();
}
function powerChord(f, d){ beep(f, d, "sawtooth", .05); beep(f * 1.5, d, "sawtooth", .04); beep(f * 2, d * .8, "square", .02); }
function riff(notes){ let t = 0; notes.forEach(([f,d])=>{ setTimeout(()=>powerChord(f, d * .9), t * 1000); t += d; }); }
function sOk(){ const s = snd(); chord(s.ok, s.wave); }

// ---------- ORACLE candidate engine ----------
const _cc = new Int32Array(16), _gc = new Int32Array(16), _cd = new Int32Array(6), _gd = new Int32Array(6);
function fb(cn, gn, len, pos){
  for(let i=len-1;i>=0;i--){ _cd[i] = cn & 15; cn >>>= 4; _gd[i] = gn & 15; gn >>>= 4; }
  _cc.fill(0);
  if(pos){
    for(let i=0;i<len;i++) if(_cd[i] !== _gd[i]) _cc[_cd[i]]++;
    let key = 0;
    for(let i=0;i<len;i++){ let m = 0; if(_cd[i] === _gd[i]) m = 2; else if(_cc[_gd[i]] > 0){ _cc[_gd[i]]--; m = 1; } key = key*3 + m; }
    return key;
  }
  _gc.fill(0); let b = 0;
  for(let i=0;i<len;i++){ if(_cd[i] === _gd[i]) b++; else { _cc[_cd[i]]++; _gc[_gd[i]]++; } }
  let w = 0; for(let k=0;k<16;k++) w += Math.min(_cc[k], _gc[k]);
  return b*10 + w;
}
function packStr(str){ let n = 0; for(const c of str) n = (n << 4) | HEX.indexOf(c); return n >>> 0; }
function unpack(n, len){ let s = ""; for(let i=len-1;i>=0;i--) s += HEX[(n >>> (4*i)) & 15]; return s; }
function codeAt(idx, syms, len, rep){
  let n = 0, mask = 0;
  for(let i=0;i<len;i++){ const d = idx % syms; idx = Math.floor(idx / syms); if(!rep){ if(mask & (1 << d)) return -1; mask |= 1 << d; } n |= d << (4*i); }
  return n >>> 0;
}
function spaceSize(cfg){ if(cfg.rep) return Math.pow(cfg.syms, cfg.len); let n = 1; for(let i=0;i<cfg.len;i++) n *= cfg.syms - i; return n; }
let CAND = {key:null};
function candKey(){ const s = cur().sectors[ui.sec], p = s.puzzle; return S.inserted + "|" + ui.sec + "|" + p.code + "|" + p.diff; }
function candUpdate(){
  const sh = cur(), s = sh.sectors[ui.sec], p = s.puzzle, cfg = DIFF[p.diff], key = candKey();
  if(CAND.key !== key) CAND = {key, list:null, used:0, count:spaceSize(cfg), busy:false, sugg:null, suggAt:-1};
  if(CAND.busy || CAND.used === p.history.length) return;
  const real = packStr(p.code), aPos = cfg.pos || feat().analyzer;
  const cons = p.history.map(h=>{ const g = packStr(h.g), pos = h.pos !== undefined ? h.pos : aPos; return {g, pos, k:fb(real, g, cfg.len, pos)}; });
  const ok = n=>{ for(let j=0;j<cons.length;j++){ const c = cons[j]; if(fb(n, c.g, cfg.len, c.pos) !== c.k) return false; } return true; };
  if(CAND.list){ CAND.list = CAND.list.filter(ok); CAND.count = CAND.list.length; CAND.used = cons.length; CAND.sugg = null; return; }
  CAND.list = enumerate(cfg, cons); CAND.count = CAND.list.length; CAND.used = cons.length; CAND.sugg = null;
}
// Pruned search: build codes one position at a time and drop a branch as soon as it breaks a clue.
function enumerate(cfg, cons){
  const len = cfg.len, syms = cfg.syms, out = [];
  let allowed = (1 << syms) - 1;
  const fixed = new Array(len).fill(-1), banned = new Array(len).fill(0);
  const counts = [];
  cons.forEach(c=>{
    const gd = []; for(let i=0;i<len;i++) gd.push((c.g >>> (4*(len-1-i))) & 15);
    if(c.pos){
      const marks = new Array(len); let k = c.k;
      for(let i=len-1;i>=0;i--){ marks[i] = k % 3; k = Math.floor(k / 3); }
      const seen = {};
      for(let i=0;i<len;i++){
        if(marks[i] === 2) fixed[i] = gd[i]; else banned[i] |= 1 << gd[i];
        const sym = gd[i]; if(!(sym in seen)) seen[sym] = true; if(marks[i] !== 0) seen[sym] = false;
      }
      Object.keys(seen).forEach(sym=>{ if(seen[sym]) allowed &= ~(1 << +sym); });
    } else {
      const bb = Math.floor(c.k / 10), ww = c.k % 10;
      if(bb === 0) for(let i=0;i<len;i++) banned[i] |= 1 << gd[i];
      if(bb + ww === 0) gd.forEach(sym=>{ allowed &= ~(1 << sym); });
      counts.push({gd, b:bb});
    }
  });
  const hits = new Int32Array(counts.length);
  const full = n=>{ for(let j=0;j<cons.length;j++){ const c = cons[j]; if(fb(n, c.g, len, c.pos) !== c.k) return false; } return true; };
  const rec = (i, mask, packed)=>{
    if(i === len){ if(full(packed)) out.push(packed >>> 0); return; }
    const rem = len - i - 1;
    for(let sym=0; sym<syms; sym++){
      if(fixed[i] >= 0 ? sym !== fixed[i] : (!((allowed >> sym) & 1) || ((banned[i] >> sym) & 1))) continue;
      if(!cfg.rep && ((mask >> sym) & 1)) continue;
      let bad = false;
      for(let j=0;j<counts.length;j++){ if(counts[j].gd[i] === sym) hits[j]++; if(hits[j] > counts[j].b || hits[j] + rem < counts[j].b) bad = true; }
      if(!bad) rec(i + 1, mask | (1 << sym), packed | (sym << (4*(len-1-i))));
      for(let j=0;j<counts.length;j++) if(counts[j].gd[i] === sym) hits[j]--;
    }
  };
  rec(0, 0, 0);
  return out;
}
function sampleArr(a, k){ if(a.length <= k) return a.slice(); const out = []; for(let i=0;i<k;i++) out.push(a[Math.floor(Math.random()*a.length)]); return out; }
function suggestion(cfg){
  const p = cur().sectors[ui.sec].puzzle, aPos = cfg.pos || feat().analyzer;
  if(!p.history.length){
    if(!CAND.opener){ const pool = HEX.slice(0, cfg.syms).split(""), st = Math.floor(Math.random()*cfg.syms); let o = ""; for(let i=0;i<cfg.len;i++) o += pool[(st + i) % cfg.syms]; CAND.opener = o; }
    return CAND.opener;
  }
  if(CAND.busy || !CAND.list || !CAND.list.length) return null;
  if(CAND.sugg && CAND.suggAt === CAND.used) return CAND.sugg;
  const L = CAND.list;
  let best = L[0];
  if(L.length > 1){
    const guesses = sampleArr(L, 120), evalSet = sampleArr(L, 500);
    let bestScore = Infinity;
    guesses.forEach(g=>{
      const m = new Map(); evalSet.forEach(c=>{ const k = fb(c, g, cfg.len, aPos); m.set(k, (m.get(k) || 0) + 1); });
      let sc = 0; m.forEach(v=>sc += v*v);
      if(sc < bestScore){ bestScore = sc; best = g; }
    });
  }
  CAND.sugg = unpack(best, cfg.len); CAND.suggAt = CAND.used;
  return CAND.sugg;
}
// ---------- probe levels ----------
// q: suggestion quality 0 sloppy, 1 decent, 2 sharp. out: syms | partial | full.
const PROBE = {
  1:{name:"hunch", q:0, out:"syms", cost:1, uses:2},
  2:{name:"assist", q:1, out:"partial", cost:1, unlock:500},
  3:{name:"solver", q:2, out:"full", cost:2, uses:3, cooldown:true},
  4:{name:"oracle-class", q:2, out:"full", cost:0, block6:true, ice5:0.25}
};
function probeCfg(){
  const v = V(); if(!v || !v.sw.probe) return null;
  let lvl = v.sw.probe;
  if(S.upg.coproc && lvl === 3) lvl = 4;
  const pr = Object.assign({lvl}, PROBE[lvl]);
  if(S.upg.coproc && lvl < 3) pr.q = Math.min(2, pr.q + 1);
  if(v.solverIntel){ if(pr.uses) pr.uses++; if(pr.unlock) pr.unlock *= 2; if(pr.cost > 1) pr.cost--; }
  return pr;
}
function pickCode(cfg, q){
  const p = cur().sectors[ui.sec].puzzle, aPos = cfg.pos || feat().analyzer;
  if(!p.history.length){
    if(q === 0){ let n; do { n = codeAt(Math.floor(Math.random() * Math.pow(cfg.syms, cfg.len)), cfg.syms, cfg.len, cfg.rep); } while(n < 0); return unpack(n, cfg.len); }
    const pool = HEX.slice(0, cfg.syms).split(""), st = Math.floor(Math.random() * cfg.syms); let o = "";
    for(let i=0;i<cfg.len;i++) o += pool[(st + i) % cfg.syms];
    return o;
  }
  candUpdate();
  const L = CAND.list; if(!L || !L.length) return null;
  if(q === 0 || L.length === 1) return unpack(L[Math.floor(Math.random() * L.length)], cfg.len);
  const gN = q === 1 ? 10 : 120, eN = q === 1 ? 100 : 500;
  const guesses = sampleArr(L, gN), evalSet = sampleArr(L, eN);
  let best = guesses[0], bestScore = Infinity;
  guesses.forEach(g=>{
    const m = new Map(); evalSet.forEach(c=>{ const k = fb(c, g, cfg.len, aPos); m.set(k, (m.get(k) || 0) + 1); });
    let sc = 0; m.forEach(x=>sc += x*x);
    if(sc < bestScore){ bestScore = sc; best = g; }
  });
  return unpack(best, cfg.len);
}
function probeStatus(s, p, pr){
  const sh = cur(), P = " " + T("probeWord"), used = sh.probesUsed || 0;
  if(pr.block6 && s.lvl >= 6) return {ok:false, t:P + ": " + T("pBlocked"), short:T("pBlockedS")};
  if(pr.uses && used >= pr.uses) return {ok:false, t:P + ": " + T("pSpent"), short:T("pSpentS")};
  if(pr.cooldown && p.lastProbe === p.history.length) return {ok:false, t:P + ": " + T("pCool"), short:T("pCoolS")};
  if(pr.unlock){
    candUpdate();
    if(CAND.count > pr.unlock){
      // charging meter: how far the candidate count has fallen toward the unlock threshold, on a log scale
      const total = spaceSize(DIFF[p.diff]), span = Math.log(total) - Math.log(pr.unlock);
      const prog = span > 0 ? Math.max(0, Math.min(1, (Math.log(total) - Math.log(CAND.count)) / span)) : 0;
      const n = Math.min(5, Math.floor(prog * 6)), v = V();
      const meter = v.bar[0].repeat(n) + v.bar[1].repeat(6 - n);
      return {ok:false, t:P + ": " + T("pCharge") + " " + meter, short:meter};
    }
  }
  const marks = ui.arm ? "#".repeat(ui.arm) + "·".repeat(3 - ui.arm) : "###";
  const short = marks + (pr.cost ? "-" + pr.cost : " ok") + (pr.uses ? "x" + (pr.uses - used) : "");
  return {ok:true, t:P + " [" + marks + "] " + (pr.cost ? "-" + pr.cost : T("pFree")) + (pr.uses ? " x" + (pr.uses - used) : ""), short};
}
function probeLines(s, p){
  const out = [];
  if(p.probeOut){
    const lbl = p.probeIns ? " insight" : p.probeKind === "syms" ? T("pTest") : " " + T("probeWord");
    out.push(lbl + " " + p.probeOut.replace(/ /g,"").split("").join(" "));
  }
  const pr = probeCfg();
  if(pr) out.push({t:probeStatus(s, p, pr).t, cls:"dim"});
  return out;
}
function formatProbe(code, out){
  if(out === "syms"){ const u = Array.from(new Set(code.split(""))).sort((a,b)=>HEX.indexOf(a) - HEX.indexOf(b)); return u.length <= 4 ? u.join(" ") : u.join(""); }
  if(out === "partial"){
    const idx = code.split("").map((_,i)=>i).sort(()=>Math.random() - 0.5).slice(0, Math.max(1, Math.floor(code.length / 2)));
    return code.split("").map((c,i)=>idx.includes(i) ? c : "_").join("");
  }
  return code;
}
function runProbe(){
  const sh = cur(), s = sh.sectors[ui.sec], p = s.puzzle, cfg = DIFF[p.diff], pr = probeCfg(), v = V();
  const st = probeStatus(s, p, pr);
  if(!st.ok){ errBeep(); flash([say("{sec}") + (ui.sec+1), "", st.t]); return; }
  if(pr.cost && sh.juice <= pr.cost){ errBeep(); flash([say("{sec}") + (ui.sec+1), "", T("notEnough"), T("dry1"), T("dry2")]); return; }
  if(pr.ice5 && s.lvl === 5 && Math.random() < pr.ice5){
    s.puzzle = makePuzzle(s); save(); noise(0.5); fx(v.fx, 600);
    showMsg(["", {t:" ICE TRIGGERED ", cls:"inv"}, "", " probe detected.", " lock rotated.", " progress lost."], 2600, ()=>enterCrack(ui.sec));
    return;
  }
  const code = pickCode(cfg, pr.q); if(!code) return;
  sh.juice -= pr.cost; if(pr.uses) sh.probesUsed = (sh.probesUsed || 0) + 1; heatUp(1.2);
  p.lastProbe = p.history.length;
  p.probeOut = formatProbe(code, pr.out); p.probeKind = pr.out; p.probeIns = false;
  save(); beep(v.sound.hit, 0.08, v.sound.wave, 0.03); fx("sweep", 400);
  render();
}
// ---------- ORACLE planning: attempt estimates from self-play ----------
const EST = {}, EST_PENDING = {};
function simulate(d){
  const cfg = DIFF[d], runs = d >= 5 ? 16 : 40, tot = Math.pow(cfg.syms, cfg.len);
  let sum = 0;
  for(let r=0;r<runs;r++){
    let secret; do { secret = codeAt(Math.floor(Math.random() * tot), cfg.syms, cfg.len, cfg.rep); } while(secret < 0);
    const st = Math.floor(Math.random() * cfg.syms); let o = 0;
    for(let i=0;i<cfg.len;i++) o = (o << 4) | ((st + i) % cfg.syms);
    let guess = o >>> 0, n = 0, list = null; const cons = [];
    while(n < 40){
      n++;
      if(guess === secret) break;
      const k = fb(secret, guess, cfg.len, true), g = guess;
      cons.push({g, pos:true, k});
      list = list ? list.filter(c=>fb(c, g, cfg.len, true) === k) : enumerate(cfg, cons);
      guess = list[Math.floor(Math.random() * list.length)];
    }
    sum += n;
  }
  return sum / runs;
}
function queueEst(d){
  if(EST[d] !== undefined || EST_PENDING[d]) return;
  EST_PENDING[d] = true;
  setTimeout(()=>{ EST[d] = simulate(d); delete EST_PENDING[d]; if(ui.mode === "map") render(); }, 40);
}
function estText(s){
  const d = diffOf(s), e = EST[d];
  if(e === undefined){ queueEst(d); return "~... att"; }
  const done = s.puzzle && s.puzzle.diff === d ? s.puzzle.history.length : 0;
  const left = Math.max(1, e - done);
  return "~" + (left >= 10 ? Math.round(left) : left.toFixed(1)) + " att";
}
function identFrames(id){
  const d = defOf(id), e = d.enc ? ENC[d.enc] : null, f = [];
  for(let k=0;k<=10;k++) f.push({lines:[" " + id + " mounted", "", " identifying cipher", " [" + "|".repeat(k) + ".".repeat(10-k) + "] " + (k*10) + "%"], ms:k === 0 ? 300 : 70});
  const res = e
    ? [" " + id + " mounted", "", " cipher identified", " " + e.real, " " + e.org, "", e.native ? " native format." : " foreign cipher.", " confidence " + e.conf + "."]
    : [" " + id + " mounted", "", " no cipher detected.", " plain media."];
  f.push({lines:res, ms:2600, sfx:()=>lowHit(e && e.native ? 98 : 73, .5, .05)});
  return f;
}
function fmtCount(n){ return n >= 1e6 ? (n/1e6).toFixed(1) + "M" : n >= 1e4 ? Math.round(n/1000) + "k" : String(n); }

// ---------- smooth number tweens (ORACLE) ----------
const TW = new Map(); let twRunning = false;
const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function twGet(name, target){
  let t = TW.get(name);
  if(!t){ TW.set(name, {v:target, from:target, target, t0:0}); return target; }
  if(t.target !== target){ t.from = t.v; t.target = target; t.t0 = performance.now(); if(reduceMotion) t.v = target; else twLoop(); }
  return Math.round(t.v);
}
function twLoop(){
  if(twRunning) return; twRunning = true;
  const tick = ()=>{
    const now = performance.now(); let busy = false;
    TW.forEach(t=>{ if(t.v !== t.target){ const k = Math.min(1, (now - t.t0) / 650), e = 1 - Math.pow(1 - k, 3); t.v = k >= 1 ? t.target : t.from + (t.target - t.from) * e; if(k < 1) busy = true; } });
    render();
    if(busy) requestAnimationFrame(tick); else twRunning = false;
  };
  requestAnimationFrame(tick);
}
function fit11(L){ while(L.length > 11){ const i = L.lastIndexOf(""); if(i > 0) L.splice(i, 1); else L.splice(Math.max(1, L.length - 3), 1); } return L; }
function sBad(){ const s = snd(); beep(s.bad, 0.22, s.wave === "sine" ? "sine" : "sawtooth", 0.05); }
function errBeep(){ sBad(); }

// ---------- screen effects ----------
function fx(kind, ms){
  const o = document.getElementById("oled"), cls = "fx-" + (kind || "tear");
  o.classList.remove("fx-tear","fx-flicker","fx-shake","fx-sweep","fx-drop");
  void o.offsetWidth;
  o.classList.add(cls);
  setTimeout(()=>o.classList.remove(cls), ms || 450);
}

// ---------- puzzle ----------
function makePuzzle(sec){
  const d = diffOf(sec), cfg = DIFF[d], pool = HEX.slice(0, cfg.syms).split("");
  let code = "";
  if(cfg.rep){ for(let i=0;i<cfg.len;i++) code += pool[Math.floor(Math.random()*pool.length)]; }
  else { const p = pool.slice(); for(let i=0;i<cfg.len;i++) code += p.splice(Math.floor(Math.random()*p.length), 1)[0]; }
  return {code, diff:d, history:[], hints:{}};
}
function ensurePuzzle(sec){
  if(!sec.puzzle || sec.puzzle.diff !== diffOf(sec)){ sec.puzzle = makePuzzle(sec); return true; }
  return false;
}
// raw marks: ● hit, ○ near, · miss. Translated to each cracker's glyphs on screen.
function score(code, guess, posMode){
  const n = code.length, mark = Array(n).fill("·"), rest = {};
  let b = 0, w = 0;
  for(let i=0;i<n;i++){ if(guess[i] === code[i]){ mark[i] = "●"; b++; } else rest[code[i]] = (rest[code[i]] || 0) + 1; }
  for(let i=0;i<n;i++){ if(guess[i] !== code[i] && rest[guess[i]]){ rest[guess[i]]--; mark[i] = "○"; w++; } }
  if(posMode) return mark.join("");
  return ("●".repeat(b) + "○".repeat(w)) || "-";
}
// a history row: guess, marks, plus symbol count (symparse) and first-symbol leak (sidechannel)
function histLine(h){ let t = " " + h.g + "  " + (hasBug("ghostrow") && strHashB(h.g) % 4 === 0 ? "▒".repeat(h.r.length) : glyphs(h.r)); if(h.sym != null) t += " s" + h.sym; if(h.side != null && !(V() && V().seeSide === false)) t += h.side ? " 1+" : " 1x"; return t; }
function glyphs(r){ const v = V(); return r.replace(/●/g, v.hit).replace(/○/g, v.near).replace(/·/g, v.miss); }
// only what the feedback proves: a guess with no hits or grazes rules out all its symbols;
// with positional marks, a symbol marked miss everywhere it appears in that guess is out.
function absentSyms(p){
  const set = new Set();
  p.history.forEach(h=>{
    const g = h.g.split("");
    if(h.pos) g.forEach((c,i)=>{ if(h.r[i] === "·" && !g.some((d,j)=>d === c && h.r[j] !== "·")) set.add(c); });
    else if(!/[●○]/.test(h.r)) g.forEach(c=>set.add(c));
  });
  const out = HEX.split("").filter(c=>set.has(c));
  // a SPLICE elimination block with a bad block size for this deck strikes out a symbol that is really in the code
  const v = V();
  if(v && v.elimBug && v.elimBug === S.deck && out.length && p.code){ const bad = p.code[p.history.length % p.code.length]; if(!out.includes(bad)) out.push(bad); out.sort((a,b)=>HEX.indexOf(a) - HEX.indexOf(b)); }
  return out;
}

// ---------- shard status ----------
function traced(sh){ return !!sh.tampered || sh.sectors.some(x=>x.status === "burned" || (x.status === "open" && x.lvl > 0 && x.trace !== false)); }
function shardStatus(id){
  const sh = S.shards[id], def = defOf(id);
  const L = sh.sectors.filter(s=>s.status === "locked").length;
  const B = sh.sectors.filter(s=>s.status === "burned").length;
  if(def.sectors.every(s=>s.lvl === 0)) return {tag:"plain", label:"unencrypted"};
  if(L === sh.sectors.length) return sh.tampered ? {tag:"partial", label:"tampered"} : {tag:"sealed", label:"encrypted"};
  if(L > 0) return traced(sh) ? {tag:"partial", label:"tampered"} : {tag:"sealed", label:"cracked, no trace"};
  if(B > 0) return {tag:"partial", label:"damaged"};
  return {tag:"open", label:"decrypted"};
}

// ---------- text helpers ----------
function padT(t){ return pad(t, Math.max(7, t.length + 1)); }
function pad(s, n){ s = String(s); return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length); }
function wrap(text, width){
  const words = text.split(" "), out = []; let line = "";
  words.forEach(w=>{ if((line + " " + w).trim().length > width){ out.push(line.trim()); line = w; } else line += " " + w; });
  if(line.trim()) out.push(line.trim()); return out;
}
function garble(n){ const g = "#@%&!?$~*/\\<>"; let s = ""; for(let i=0;i<n;i++) s += Math.random() < 0.18 ? " " : g[Math.floor(Math.random()*g.length)]; return s; }
function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function docText(def, sh, focus){
  return def.map.map((c,i)=>{
    if(c.sec < 0) return c.ch;
    if(focus >= 0 && c.sec !== focus) return "·";
    const st = sh.sectors[c.sec].status;
    if(st === "open") return c.ch;
    if(st === "burned") return "~";
    return GL[(i*7 + c.ch.charCodeAt(0)) % GL.length];
  }).join("");
}
function docPages(def, sh, focus){
  const lines = wrap(docText(def, sh, focus), W), pages = [];
  for(let i=0;i<lines.length;i+=7) pages.push(lines.slice(i, i+7));
  return pages.length ? pages : [[""]];
}

// lines: strings or {t, cls, full, raw}. raw lines (shard content) are never re-cased.
function draw(lines, upper){
  document.getElementById("screen").innerHTML = lines.map(l=>{
    if(typeof l === "string") l = {t:l};
    if(l.parts) return l.parts.map(pt=>{ const t = upper ? pt.t.toUpperCase() : pt.t; return pt.cls ? '<span class="' + pt.cls + '">' + esc(t) + "</span>" : esc(t); }).join("");
    let t = l.t; if(upper && !l.raw) t = t.toUpperCase();
    if(!l.cls) return esc(t);
    return '<span class="' + l.cls + '">' + esc(l.full ? pad(t, W) : t) + "</span>";
  }).join("\n");
}

// ---------- screens ----------
function corpHeader(){
  if(S.deck === "archon") return [{t:" TIANSHU DATAVIEW", cls:"inv", full:true, hdr:true}, {t:" 数据视图 2.1", hdr:true}, {t:"-".repeat(W), hdr:true}];
  return [{t:" KESTREL DATASYSTEMS", cls:"inv", full:true, hdr:true}, {t:" ShardView 4.2", hdr:true}, {t:"-".repeat(W), hdr:true}];
}
const CRACK_MODES = ["map","pick","crack","sniff","warez","confirm","msg","glitch","play","read","idle"];

function juiceLine(sh){
  const v = V(), n = Math.max(0, Math.min(10, Math.round(sh.juice / Math.max(1, sh.max) * 10)));
  const shown = v.smooth ? twGet("budget" + S.inserted, sh.juice) : sh.juice;
  const nn = v.smooth ? Math.max(0, Math.min(10, Math.round(shown / Math.max(1, sh.max) * 10))) : n;
  return say("{juice}") + " " + String(shown).padStart(2," ") + " " + v.bar[0].repeat(nn) + v.bar[1].repeat(10 - nn);
}
function typeTag(s, d, open){ return (open || feat().autoTags || s.known.type) ? d.type : "?????"; }
function hardIdxLocked(sh){
  let best = -1, lv = -1;
  sh.sectors.forEach((s,i)=>{ if(s.status === "locked" && s.lvl > lv){ lv = s.lvl; best = i; } });
  return best;
}

function render(){
  const sh = cur(), def = curDef(), v = V(), F = feat();
  const m = ui.mode;
  let L = [];
  const inCracker = !!v && !["corp","corpKey","corpMsg"].includes(m) && !(ui.play && ui.play.corp && m === "play") && !(ui.read && ui.read.corp && m === "read");
  if(m === "idle"){
    if(v) L = v.boot.concat([""]).concat(v.idle);
    else L = corpHeader().concat(["", " Please insert a", " data shard.", "", {t:" Kestrel. We remember.", cls:"dim"}]);
  }
  else if(m === "corp"){
    const st = shardStatus(S.inserted), lockN = lockedIdx(sh).length, burnN = sh.sectors.filter(s=>s.status === "burned").length;
    L = corpHeader().concat([" Shard " + def.id]);
    if(lockN > 0 && !traced(sh)){
      L = L.concat([" This shard is", " encrypted.", " Authorization needed.", "", " [1] Enter key", " [2] Eject"]);
    } else if(lockN > 0){
      L = L.concat([{t:" INTEGRITY ERROR", cls:"inv"}, " This shard has been", " modified. Contents", " cannot be displayed.", " [1] Enter key", " [2] Eject"]);
    } else {
      if(def.kind === "text") L = L.concat([" Text document", " Pages: " + docPages(def, sh, -1).length]);
      else {
        const secs = Math.round(def.sectors.reduce((a,s)=>a + s.text.length, 0) / 14);
        L = L.concat([" Voice recording", " Length: 0:" + String(secs).padStart(2,"0")]);
      }
      L.push(burnN ? " Damaged: " + burnN + "/" + sh.sectors.length + " lost" : " Integrity: verified");
      L = L.concat(["", def.kind === "text" ? " [1] Read  [2] Eject" : " [1] Play  [2] Eject"]);
    }
  }
  else if(m === "corpKey"){
    L = corpHeader().concat([" Shard " + def.id, " Enter 6-digit key:", "", "   " + pad(ui.input, 6).replace(/ /g,"_").split("").join(" "), "", " # confirm  * cancel"]);
  }
  else if(m === "msg" || m === "corpMsg" || m === "glitch"){ L = ui.msg; }
  else if(m === "policy"){ L = v.policy; }
  else if(m === "log"){
    const a = logNotes(S.inserted) || [], n = Math.max(1, Math.ceil(a.length / 7)), pg = Math.min(ui.logPage || 0, n - 1);
    L = [pad("logbook " + def.id, W - 4) + (pg+1) + "/" + n, "-".repeat(W)];
    if(!a.length) L.push(" nothing logged yet.", " scans, ids and", " estimates land here.");
    a.slice(pg * 7, pg * 7 + 7).forEach(t=>L.push(" " + t.slice(0, W - 1)));
    while(L.length < 10) L.push("");
    L.push({t:"#next Bprev *map", cls:"dim"});
  }
  else if(m === "map"){
    let encLine = say("{enc}") + " none";
    if(def.enc){ encLine = say("{enc}") + " " + ENC[def.enc].name; const withHow = encLine + " (" + ENC[def.enc].how + ")"; if(withHow.length <= W) encLine = withHow; }
    if(v.encLine) encLine = v.encLine(def);
    if(v.engine || v.ident) encLine = def.enc ? ENC[def.enc].real + " " + (ENC[def.enc].native ? "native" : "foreign") + " " + ENC[def.enc].confS : "no cipher";
    L = [v.title(def.id), encLine, juiceLine(sh)];
    if(v.custom && v.hasEst && logs("est")){ const en = []; sh.sectors.forEach((s,i)=>{ if(s.status === "locked" && EST[diffOf(s)] !== undefined) en.push("sec" + (i+1) + " est " + estText(s)); else if(s.status === "locked") estText(s); }); logNote("est", en); }
    const hard = hardIdxLocked(sh);
    sh.sectors.forEach((s,i)=>{
      let row = v.idx(i+1) + " ";
      if(s.status === "open") row += padT(say("{open}")) + (s.lvl === 0 ? "plain" : typeTag(s, def.sectors[i], true));
      else if(s.status === "burned") row += padT(say("{burn}")) + "~~~~~~";
      else {
        if(v.engine || v.est) row += pad(estText(s), 10) + typeTag(s, def.sectors[i], false);
        else row += padT(say("{lock}")) + ((F.autoMap || s.known.diff) ? "d" + diffOf(s) : "d?") + " " + typeTag(s, def.sectors[i], false);
        if((F.auto || sh.hard) && i === hard) row = pad(row, 20) + " !";
      }
      L.push(row);
    });
    while(L.length < 9) L.push("");
    v.menu(def.kind).forEach(t=>L.push({t, cls:"dim"}));
  }
  else if(m === "pick"){
    const titles = {crack:"{crack} which {sec}?", len:"length of which {sec}?", type:"contents of which?", sym:"symbols of which?", probe:"peek which {sec}?", insight:"insight which {sec}?", bypass:"bypass which {sec}?", brute:"bruteforce which?", scrap:"scrap which {sec}?"};
    const multi = v.spread && ui.pickFor === "crack";
    L = [multi ? "load up to 3 tgts" : (v.pick && v.pick[ui.pickFor]) || say(titles[ui.pickFor] || "which {sec}?"), "-".repeat(W)];
    sh.sectors.forEach((s,i)=>{ if(s.status === "locked") L.push((multi ? (ui.sel.includes(i) ? ">" : " ") : " ") + v.idx(i+1) + " " + say("{sec}") + " " + (i+1) + ((F.autoMap || s.known.diff) ? "  d" + diffOf(s) : "")); });
    if(multi){ L.push(""); L.push({t:"same d only", cls:"dim"}); L.push({t:"#fire (" + ui.sel.length + ") *back", cls:"dim"}); }
    else { L.push(""); L.push({t:T("back"), cls:"dim"}); }
  }
  else if(m === "crack" && v && (v.engine || v.cand)){
    const s = sh.sectors[ui.sec], p = s.puzzle, cfg = DIFF[p.diff];
    candUpdate();
    const range = cfg.syms === 16 ? "0-F" : "0-" + HEX[cfg.syms-1];
    L = [v.banner, say("{sec}") + String(ui.sec+1).padStart(2,"0") + " L" + cfg.len + " [" + range + "]" + (cfg.rep ? "r" : "") + "  b" + twGet("budget" + S.inserted, sh.juice)];
    const tail = [];
    if(Object.keys(p.hints).length){ let hs = ""; for(let i=0;i<cfg.len;i++) hs += p.hints[i] || "_"; tail.push(" hint " + hs); }
    if(F.elim){ const ab = absentSyms(p); if(ab.length) tail.push(" excl " + (ab.length > 7 ? ab.join("") : ab.join(" "))); }
    if(CAND.busy) tail.push(" cand computing" + ".".repeat(Math.floor(performance.now()/300) % 4));
    else { const c = twGet("cand|" + CAND.key, CAND.count); tail.push(CAND.count === 1 ? {t:" LOCKED ON  [#] submit", cls:"inv"} : " cand " + fmtCount(c)); }
    probeLines(s, p).forEach(t=>tail.push(t));
    const room = 11 - L.length - tail.length - 2;
    p.history.slice(-Math.max(1, v.histRows ? Math.min(room, v.histRows) : room)).forEach(h=>L.push(histLine(h)));
    if(!p.history.length) L.push({t:" awaiting input", cls:"dim"});
    while(L.length < 11 - tail.length - 2) L.push("");
    tail.forEach(t=>L.push(t));
    L.push("> " + pad(ui.input, cfg.len).replace(/ /g,"_"));
    L.push({t:v.tryHint, cls:"dim"});
  }
  else if(m === "crack"){
    const s = sh.sectors[ui.sec], p = s.puzzle, cfg = DIFF[p.diff];
    const range = cfg.syms === 16 ? "0-F" : "0-" + HEX[cfg.syms-1];
    const extras = [];
    if(Object.keys(p.hints).length){ let hs = ""; for(let i=0;i<cfg.len;i++) hs += p.hints[i] || "_"; extras.push(T("hint") + " " + hs); }
    if(F.elim){ const ab = absentSyms(p); if(ab.length) extras.push(" " + say("{nope}") + " " + (ab.length > 7 ? ab.join("") : ab.join(" "))); }
    probeLines(s, p).forEach(t=>extras.push(t));
    L = [say("{sec}") + (ui.sec+1) + " len" + cfg.len + " [" + range + "]" + (cfg.rep ? " rep" : ""), juiceLine(sh)];
    const room = 11 - 4 - extras.length;
    if(v.hud) extras.push(" hud " + say("{juice}") + " " + sh.juice + (s.puzzle ? " · try " + (p.history.length + 1) : ""));
    const hist = p.history.slice(-Math.max(1, v.histRows ? Math.min(room - (v.hud ? 1 : 0), v.histRows) : room));
    if(!hist.length) L.push({t:T("noGuess"), cls:"dim"});
    hist.forEach(h=>L.push(histLine(h)));
    while(L.length < 11 - 2 - extras.length) L.push("");
    extras.forEach(e=>L.push(e));
    L.push("> " + pad(ui.input, cfg.len).replace(/ /g,"_"));
    L.push({t:v.tryHint, cls:"dim"});
  }
  else if(m === "spread"){
    const cols = ui.spreadCols, s0 = sh.sectors[cols[0]], cfg = DIFF[ui.spreadDiff];
    const range = cfg.syms === 16 ? "0-F" : "0-" + HEX[cfg.syms-1];
    L = ["spread " + cols.map(i=>i+1).join("+") + " len" + cfg.len + " [" + range + "]" + (cfg.rep ? " rep" : ""), juiceLine(sh)];
    L.push({t:pad("", cfg.len + 1) + cols.map(i=>pad("T" + (i+1), 5)).join(""), cls:"dim"});
    const fmt = (r, pos)=>{
      if(r === "DOWN" || r === "HIT") return r;
      if(r === null) return "";
      if(pos) return glyphs(r);
      const b = (r.match(/●/g) || []).length, w = (r.match(/○/g) || []).length;
      return ((b ? b + v.hit : "") + (w ? w + v.near : "")) || "-";
    };
    ui.spreadLog.slice(-5).forEach(e=>L.push(e.g + " " + e.res.map(r=>pad(fmt(r, e.pos), 5)).join("")));
    if(!ui.spreadLog.length) L.push({t:" one guess, every tgt", cls:"dim"});
    while(L.length < 9) L.push("");
    L.push("> " + pad(ui.input, cfg.len).replace(/ /g,"_"));
    const live = cols.filter(i=>sh.sectors[i].status === "locked").length;
    L.push({t:"#fire x" + live + " *del", cls:"dim"});
  }
  else if(m === "sniff"){
    L = [say("{sniff}"), juiceLine(sh)];
    scansNow().forEach((sc,i)=>L.push((i+1) + " " + pad((v.scans && v.scans[sc.k]) || say(sc.label), 16) + "-" + scanCost(sc)));
    L.push(""); L.push({t:T("back"), cls:"dim"});
  }
  else if(m === "warez"){
    L = [say("{warez}"), juiceLine(sh)];
    WARE.forEach((w,i)=>L.push((i+1) + " " + pad(w.name, 12) + "x" + S.ware[w.k]));
    L.push(""); L.push({t:T("back"), cls:"dim"});
  }
  else if(m === "confirm"){ L = ui.confirm.lines.concat(["", v.confirm]); }
  else if(m === "play"){
    const pl = ui.play, s = sh.sectors[pl.i];
    L = [pl.corp ? " ShardView :: PLAY" : v.name + " :: play", "-".repeat(W),
      (pl.corp ? " Part " : say("{sec}")) + (pl.i+1) + "/" + sh.sectors.length + (s.status === "open" ? "" : s.status === "burned" ? "  [lost]" : "  [locked]")];
    if(s.status === "open") wrap(def.sectors[pl.i].text, W-1).forEach(l=>L.push({t:" " + l, raw:true}));
    else for(let k=0;k<3;k++) L.push({t:" " + garble(18), raw:true});
    while(L.length < 9) L.push("");
    L.push({t:"#next Bprev 0again", cls:"dim"});
    L.push({t:"1-" + sh.sectors.length + " jump *stop", cls:"dim"});
  }
  else if(m === "read"){
    const rd = ui.read, pages = docPages(def, sh, rd.focus);
    rd.page = Math.min(rd.page, pages.length - 1);
    L = [rd.corp ? " ShardView :: READ" : v.name + " :: read",
      "pg " + (rd.page+1) + "/" + pages.length + (rd.focus >= 0 ? "  " + say("{sec}") + (rd.focus+1) + " only" : "")];
    pages[rd.page].forEach(l=>L.push({t:l, raw:true}));
    while(L.length < 9) L.push("");
    L.push({t:"#pg+ Bpg- *back", cls:"dim"});
    L.push({t: rd.corp ? "" : "1-" + sh.sectors.length + " one " + say("{sec}") + " 0 all", cls:"dim"});
  }
  if(inCracker && v && v.banner && !ui.raw && !["map","crack","glitch"].includes(m) && L[0] !== v.banner) L = [v.banner].concat(L);
  if(inCracker && v && v.banner) fit11(L);
  draw(L, inCracker && v && v.upper);
  const scr = document.getElementById("screen");
  if(inCracker && v && v.smooth && ui.lastMode !== m + "|" + (ui.msg ? ui.msg.length : 0) && !reduceMotion){ scr.classList.remove("fade"); void scr.offsetWidth; scr.classList.add("fade"); }
  ui.lastMode = m + "|" + (ui.msg ? ui.msg.length : 0);
  document.getElementById("oled").dataset.skin = inCracker && v ? S.cracker : "corp";
  renderSeg(); renderTherm();
  renderSide();
}

// ---------- segment display ----------
const SEGS = {"0":"abcdef","1":"bc","2":"abdeg","3":"abcdg","4":"bcfg","5":"acdfg","6":"acdefg","7":"abc","8":"abcdefg","9":"abcdfg","A":"abcefg","B":"cdefg","C":"adef","D":"bcdeg","E":"adefg","F":"aefg","-":"g"};
const SEGP = {a:"6,2 24,2 20,6 10,6", b:"25,3 25,22 21,20 21,7", c:"25,26 25,45 21,41 21,28", d:"6,46 24,46 20,42 10,42", e:"5,26 5,45 9,41 9,28", f:"5,3 5,22 9,20 9,7", g:"7,24 11,21 19,21 23,24 19,27 11,27"};
function renderSeg(){
  const txt = (ui.mode === "crack" || ui.mode === "spread" || ui.mode === "corpKey") ? ui.input : "";
  document.getElementById("seg").innerHTML = pad(txt, 6).split("").map(c=>{
    const on = SEGS[c] || "";
    return '<svg viewBox="0 0 30 48">' + Object.keys(SEGP).map(k=>'<polygon class="' + (on.includes(k) ? "on" : "off") + '" points="' + SEGP[k] + '"/>').join("") + "</svg>";
  }).join("");
}

// ---------- flow ----------
function showMsg(lines, ms, next){ ui.mode = "msg"; ui.raw = false; ui.msg = lines; render(); later(ms, next); }
function flash(lines){ const back = ui.mode; ui.msg = lines; ui.mode = "msg"; render(); later(1300, ()=>{ ui.mode = back; render(); }); }
function showPolicy(){ ui.mode = "policy"; ui.raw = true; render(); }
function toMap(){ leaveSwap(cur()); ui.inSpread = false; ui.mode = "map"; ui.input = ""; render(); }
function toHome(){
  cancelTimers();
  ui.input = ""; ui.raw = false; ui.kxSplash = false;
  if(!S.inserted){ ui.mode = "idle"; render(); return; }
  if(S.cracker) toMap(); else { ui.mode = "corp"; render(); }
}
function startCracker(){
  const c = compat(S.cracker, S.deck);
  if(c === "reject") return rejectCart();
  if(c === "emu") return playFrames(emuFrames(), bootCracker);
  if(c === "overheat") return playFrames(emuFrames(), oracleMeltdown);
  bootCracker();
}
function emuFrames(){
  const v = V(), f = [];
  const head = [{t:" XUANJI OS 3.1", cls:"inv", full:true}, " cart: " + v.name.slice(0, 15), " built for: KESTREL DS-4", ""];
  for(let k=0;k<=10;k++) f.push({lines:head.concat([" DS-4 emulator 1.4", " [" + "|".repeat(k) + ".".repeat(10 - k) + "] " + (k * 10) + "%"]), ms:k ? 60 : 320, raw:true});
  f.push({lines:head.concat([" DS-4 emulator 1.4", " shardio 2.0    ok", " dsgfx 1.1      ok", " dskeys 1.0     ok"]), ms:950, raw:true, sfx:()=>beep(880, .05, "sine", .03)});
  return f;
}
function rejectCart(){
  S.cracker = null; save(); logEvt("aux rejected"); errBeep();
  showMsg(corpHeader().concat([{t:" UNKNOWN MODULE", cls:"inv"}, " The cartridge in AUX", " is not compatible", " with this deck.", "", " Module ejected."]), 2800, toHome);
}
// ORACLE//ZERO's engine is too much for a Tianshu host
function oracleMeltdown(){
  ui.heat = true;
  const t0 = ui.temp, f = [];
  const head = [{t:" ORACLE//ZERO  r9", cls:"inv", full:true}, " counter-intrusion", "-".repeat(22)];
  for(let k=0;k<=10;k++){
    const tk = Math.min(99, t0 + 5.6 * (k + 1));
    const lines = head.concat([" candidate engine", " [" + "|".repeat(k) + ".".repeat(10 - k) + "] " + (k * 10) + "%"]);
    if(tk > 70) lines.push("", " !! host temp " + Math.round(tk) + "°C");
    f.push({lines, ms:k ? 280 : 500, raw:true, sfx:()=>{ ui.temp = tk; archonSys(); if(tk > 80) fx("flicker", 220); if(tk > 70) beep(200 + tk * 4, .05, "square", .02); }});
  }
  f.push({lines:["", {t:" !! THERMAL LIMIT !! ", cls:"inv", full:true}, "", " host 99°C", " emergency shutdown"], ms:1600, raw:true, sfx:()=>{ ui.temp = 99; archonSys(); noise(.6); lowHit(55, .9, .09); fx("shake", 500); }});
  playFrames(f, coolDown);
}
function coolDown(reason){
  const scr = document.querySelector(".a-screen"), ov = document.getElementById("aCool");
  if(!scr || !ov){ ui.heat = false; S.cracker = null; save(); toHome(); return; }
  scr.classList.add("off"); ov.hidden = false;
  ui.mode = "msg"; ui.msg = [""]; render();
  const steps = 20; let k = 0, t0 = Math.max(ui.temp, 99), t1 = THERM.archon.resume - 4;
  const step = ()=>{
    k++; ui.temp = t0 - (t0 - t1) * k / steps;
    document.getElementById("aCoolBar").textContent = "COOLING [" + "|".repeat(Math.round(k / 2)) + ".".repeat(10 - Math.round(k / 2)) + "]";
    document.getElementById("aCoolT").textContent = ui.temp.toFixed(1) + "°C";
    if(k < steps){ later(420, step); return; }
    scr.classList.remove("off"); ov.hidden = true; ui.heat = false;
    S.cracker = null; save(); logEvt("aux ejected: heat");
    beep(523, .08, "sine", .03);
    if(reason === "runtime") showMsg([{t:" XUANJI OS 3.1", cls:"inv", full:true, hdr:true}, "", " Thermal shutdown.", "", " The cart ran the deck", " past 100°C and was", " ejected to protect it.", "", " Let it cool between", " heavy cracks."], 3800, toHome);
    else showMsg([{t:" XUANJI OS 3.1", cls:"inv", full:true, hdr:true}, "", " ORACLE//ZERO r9", " is not supported on", " this host.", "", " Cartridge ejected", " to protect the deck."], 3400, toHome);
  };
  document.getElementById("aCoolBar").textContent = "COOLING [..........]";
  document.getElementById("aCoolT").textContent = Math.max(ui.temp, 99).toFixed(1) + "°C";
  later(600, step);
}
function bootCracker(){
  cancelTimers();
  if(V().gui && V().or && S.deck === "archon" && compat(S.cracker, "archon") === "native"){ orBoot(); return; }
  if(V().gui && S.deck === "archon" && compat(S.cracker, "archon") === "native"){
    ui.mode = "msg"; ui.msg = [""]; ui.kxSplash = true; render();
    if(V().tk) tkBoot(); else kxBoot();
    later(V().tk ? 2600 : 2000, ()=>{ ui.kxSplash = false; toHome(); });
    return;
  }
  if(V().bootFrames){ playFrames(V().bootFrames(!!S.inserted), V().policy ? showPolicy : toHome); return; }
  const v = V(), base = document.getElementById("screen").textContent.split("\n");
  let f = 0;
  ui.mode = "glitch";
  const step = ()=>{
    f++;
    ui.msg = base.map(l=>l.split("").map(c=>Math.random() < f*0.12 ? "#%@&$!?/\\<>"[Math.floor(Math.random()*11)] : c).join(""));
    beep(80 + Math.random()*400, 0.05, v.sound.wave, 0.03);
    fx(v.fx, 120);
    render();
    if(f < 7) later(85, step);
    else {
      ui.mode = "msg";
      ui.msg = v.boot.concat([""]).concat(S.inserted ? v.hello : v.idle);
      if(v.tune) playTune(v.tune); else if(v.bootSfx) v.bootSfx(); else chord(v.sound.boot, v.sound.wave);
      render();
      later(v.bootHold || 1600, toHome);
    }
  };
  later(60, step);
}
function insert(id){
  if(ui.heat){ errBeep(); return; }
  cancelTimers(); if(S.inserted !== id) logEvt("mount " + id);
  if(S.inserted === id){ eject(); return; }
  S.inserted = id;
  if(V() && V().skim && S.shards[id].sectors.some(x=>x.status === "locked")){ S.shards[id].tampered = true; logEvt("skim " + id); }
  if(V() && V().custom){
    const vv = V(), dd = defOf(id), diffs = S.shards[id].sectors.map((x,j)=>x.status === "locked" ? "sec" + (j+1) + " d" + diffOf(x) : null).filter(Boolean);
    if(vv.hasSkim) logNote("skim", diffs);
    if(vv.hasSurvey && CUSTOM.find(c=>c.id === vv.custom).img.x.map === "auto") logNote("survey", diffs);
    if(vv.hasIdent) logNote("ident", [dd.enc ? "cipher " + ENC[dd.enc].real : "no cipher"]);
  }
  save();
  const iceIn = iceIntro(id);
  if(iceIn && V()){ beep(140, 0.08, "square", 0.05); noise(.8); showMsg(iceIn, 2600, toMap); return; }
  beep(140, 0.08, "square", 0.05);
  const v = V();
  if(v && v.watermark && v.watermark.length) v.watermark.forEach(c=>corpLog(c.toUpperCase() + " SECURITY", "Watermarked " + c + " code seen on shard " + id + ". Logging the deck."));
  if(v && (v.engine || v.ident)){ if(v.or && guiActive()){ orIdent(id); return; } playFrames(identFrames(id), toMap); return; }
  if(v && v.reports) corpLog("MERIDIAN COMPLIANCE", "Audit opened on shard " + id + " (" + (defOf(id).enc === "B" ? "in-house cipher" : "third-party cipher") + "). Deck SN 44-0917.");
  if(v) showMsg([v.title(id), "", say(" reading shard..."), " [" + v.bar[0].repeat(4) + v.bar[1].repeat(6) + "]"], 700, toMap);
  else showMsg(corpHeader().concat(["", " Reading shard...", " Please wait."]), 700, ()=>{ ui.mode = "corp"; render(); });
}
// ghostboot: pulling the shard or the cart mid-crack wipes the cart
function midCrack(){ const sh = cur(); return !!sh && (["crack","spread"].includes(ui.mode) || sh.sectors.some(x=>x.status === "locked" && x.puzzle && x.puzzle.history.length)); }
function ghostWipe(){
  const v = V(); if(!v || !v.ghost || !v.custom || !midCrack()) return false;
  const id = S.cracker, nm = v.name;
  CUSTOM = CUSTOM.filter(c=>c.id !== id); cartWrite(); S.cracker = null; registerCustom(); renderBurnList(); save();
  logEvt("ghostboot wipe"); noise(.4);
  showMsg(["", " GHOSTBOOT", "", " " + nm.slice(0, 18), " wiped itself.", " nothing left to", " analyse."], 2600, toHome);
  return true;
}
function eject(){
  if(ui.heat){ errBeep(); return; }
  if(ghostWipe()){ S.inserted = null; save(); return; }
  cancelTimers(); logEvt("eject");
  leaveSwap(cur()); S.inserted = null; save();
  beep(100, 0.08, "square", 0.05);
  ui.mode = "idle"; ui.input = ""; render();
}
function plugCracker(id){
  if(ui.heat){ errBeep(); return; }
  logEvt(S.cracker === id ? "aux removed" : "aux " + CRACKERS[id].name.slice(0, 12));
  if(S.cracker === id){
    if(ghostWipe()) return;
    const signed = CRACKERS[id].signed;
    S.cracker = null; save(); cancelTimers();
    beep(120, 0.1, "triangle", 0.05);
    showMsg(corpHeader().concat(signed ? ["", " Licensed module", " removed."] : ["", " Unlicensed module", " removed.", " Thank you."]), 1100, toHome);
    return;
  }
  const bc = CRACKERS[id];
  if(bc && bc.bugs && bc.bugs.includes("bootfail") && Math.random() < .3){ errBeep(); logEvt("aux boot fail"); showMsg(corpHeader().concat(["", " Module failed", " to start.", " Reseat it."]), 1600, toHome); return; }
  S.cracker = id; save();
  startCracker();
}

// play / read
function startPlay(corp){
  const def = curDef();
  cancelTimers();
  if(def.kind === "text"){
    ui.mode = "read"; ui.read = {page:0, focus:-1, corp};
    addTranscriptHeader(def, corp, "READING");
    addTranscriptDoc(docText(def, cur(), -1));
    render(); return;
  }
  ui.mode = "play"; ui.play = {i:0, corp};
  addTranscriptHeader(def, corp, "PLAYING");
  playStep();
}
function playStep(){
  const sh = cur(), def = curDef(), pl = ui.play;
  cancelTimers();
  const s = sh.sectors[pl.i];
  render();
  if(s.status === "open"){ speak(def.sectors[pl.i].text); addTranscript(pl.i, def.sectors[pl.i].text, true); }
  else { noise(1.4); addTranscript(pl.i, garble(26), false); }
}

// RAZORBACK spread shot: one guess fired at several locks of the same difficulty
function enterSpread(sel){
  const sh = cur();
  sel.forEach(i=>ensurePuzzle(sh.sectors[i])); save();
  ui.spreadCols = sel; ui.spreadDiff = diffOf(sh.sectors[sel[0]]); ui.spreadLog = []; ui.input = "";
  ui.inSpread = true;
  ui.mode = "spread"; render();
}
function submitSpread(){
  const sh = cur(), v = V(), cfg = DIFF[ui.spreadDiff], g = ui.input;
  const live = ui.spreadCols.filter(i=>sh.sectors[i].status === "locked");
  const reject = (a,b)=>{ errBeep(); const back = "spread"; ui.msg = ["spread", "", " " + a, " " + b]; ui.mode = "msg"; render(); later(1300, ()=>{ ui.mode = back; render(); }); };
  if(live.some(i=>{ const s = sh.sectors[i]; return ensurePuzzle(s) || s.puzzle.diff !== ui.spreadDiff; })){ save(); ui.input = ""; toMap(); return; }
  if(g.length !== cfg.len) return reject(T("need", cfg.len), T("noSpend"));
  if(g.split("").some(c=>!HEX.slice(0, cfg.syms).includes(c))) return reject(T("only", cfg.syms === 16 ? "0-F" : "0-" + HEX[cfg.syms-1]), T("noSpend"));
  if(!cfg.rep && new Set(g).size !== g.length) return reject(T("noRep"), T("noSpend"));
  if(sh.juice < 1) return reject("not enough ammo", T("noSpend"));
  const pos = !!(cfg.pos || feat().analyzer), down = [];
  const res = ui.spreadCols.map(i=>{
    const s = sh.sectors[i];
    if(s.status !== "locked") return null;
    const p = s.puzzle, r = score(p.code, g, pos);
    p.history.push({g, r, pos}); p.probeOut = null; p.probeIns = false; p.probeKind = null;
    if(g === p.code){ s.status = "open"; s.puzzle = null; s.trace = true; down.push(i); return "HIT"; }
    return r;
  });
  sh.juice -= 1;   // one shell, whole spread
  heatUp(1 + .25 * (live.length - 1));
  ui.spreadLog.push({g, res, pos}); ui.input = "";
  // later rows show DOWN for targets already cleared
  ui.spreadLog.forEach(e=>{ e.res = e.res.map((r,k)=>r === null && sh.sectors[ui.spreadCols[k]].status === "open" ? "DOWN" : r); });
  save();
  const stillLive = ui.spreadCols.filter(i=>sh.sectors[i].status === "locked");
  if(down.length){
    rack(); fx(v.fx, 500);
    showMsg(["", " >>>>>>>>>>>>>>>>>>>>"].concat(down.map(i=>" " + say("{sec}") + " " + (i+1) + " down")).concat([" >>>>>>>>>>>>>>>>>>>>", " " + pick(["next!","boom","reload","get wrecked"])]), 2200, ()=>{
      if(sh.juice <= 0 || !stillLive.length){ checkDry(); return; }
      ui.mode = "spread"; render();
    });
    return;
  }
  beep(res.some(r=>r && r.includes("●")) ? v.sound.hit : v.sound.miss, 0.09, v.sound.wave, 0.04);
  if(sh.juice <= 0){ checkDry(); return; }
  render();
}
// shotgun rack: chk-chk
function rack(){
  const a = ac(); if(!a) return;
  const burst = (t0, freq, dur, vol)=>{
    const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i] = (Math.random()*2 - 1) * Math.pow(1 - i/len, 3);
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 1.4; g.gain.value = vol;
    src.buffer = buf; src.connect(f); f.connect(g); g.connect(a.destination); src.start(a.currentTime + t0);
  };
  // slide back ... slide forward: slower and lower
  burst(0, 950, .11, .9); burst(.006, 190, .10, .8);
  burst(.34, 1400, .09, .9); burst(.346, 240, .11, .85);
  setTimeout(()=>beep(55, .18, "sine", .09), 350);
  // then the shot
  setTimeout(gunshot, 720);
}
function gunshot(){
  const a = ac(); if(!a) return;
  const t = a.currentTime, len = Math.floor(a.sampleRate * .9), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for(let i=0;i<len;i++){ const k = i / len; d[i] = (Math.random()*2 - 1) * (k < .01 ? 1 : Math.pow(1 - k, 4)); }
  const src = a.createBufferSource(), lp = a.createBiquadFilter(), g = a.createGain();
  lp.type = "lowpass"; lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(300, t + .5);
  g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + .9);
  src.buffer = buf; src.connect(lp); lp.connect(g); g.connect(a.destination); src.start(t);
  const o = a.createOscillator(), og = a.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(38, t + .35);
  og.gain.setValueAtTime(.35, t); og.gain.exponentialRampToValueAtTime(0.001, t + .45);
  o.connect(og); og.connect(a.destination); o.start(t); o.stop(t + .5);
}
// cracking
function enterCrack(i){
  const s = cur().sectors[i];
  leaveSwap(cur()); enterSwap(cur(), i);
  ui.sec = i; ui.input = "";
  ensurePuzzle(s); save();
  ui.mode = "crack"; render();
}
function submitGuess(){
  const sh = cur(), s = sh.sectors[ui.sec], v = V(), F = feat();
  if(ensurePuzzle(s)){ save(); ui.input = ""; showMsg([say("{sec}") + (ui.sec+1), "", " ice shifted on you.", " puzzle reset."], 1200, ()=>enterCrack(ui.sec)); return; }
  const p = s.puzzle, cfg = DIFF[p.diff], g = ui.input;
  if(s.freeze && Date.now() < s.freeze){ errBeep(); flash([say("{sec}") + (ui.sec+1), "", " ICE LOCKDOWN", " " + Math.ceil((s.freeze - Date.now()) / 1000) + " s left."]); return; }
  const reject = (a,b)=>{
    if(v.noValidate && g.length){ // no validation in the session block: a malformed guess still hits the lock
      if(v.reserve && sh.juice <= v.reserve && ui.rsvOk !== g){ ui.rsvOk = g; errBeep(); flash(["", " RESERVE", " " + sh.juice + " " + say("{juice}") + " left.", " # again to spend", " it anyway."]); return; }
      ui.rsvOk = null;
      sh.juice--; heatUp(.5); ui.input = ""; save(); errBeep(); logEvt("bad guess");
      if(sh.juice <= 0){ checkDry(); return; }
      flash([say("{sec}") + (ui.sec+1), "", " " + a, " no validation:", " 1 " + say("{juice}") + " wasted."]); return;
    }
    errBeep(); flash([say("{sec}") + (ui.sec+1), "", " " + a, " " + b]);
  };
  if(g.length !== cfg.len) return reject(T("need", cfg.len), T("noSpend"));
  if(g.split("").some(c=>!HEX.slice(0, cfg.syms).includes(c))) return reject(T("only", cfg.syms === 16 ? "0-F" : "0-" + HEX[cfg.syms-1]), T("noSpend"));
  if(!cfg.rep && new Set(g).size !== g.length) return reject(T("noRep"), T("noSpend"));
  if(v.safe && p.history.some(h=>score(g, h.g, h.pos) !== h.r)){ errBeep(); flash([say("{sec}") + (ui.sec+1), "", " safelock: that", " guess can't be right.", " " + T("noSpend").trim()]); return; }
  if(v.reserve && sh.juice <= v.reserve && ui.rsvOk !== g){ ui.rsvOk = g; errBeep(); flash(["", " RESERVE", " " + sh.juice + " " + say("{juice}") + " left.", " # again to spend", " it anyway."]); return; }
  ui.rsvOk = null;
  sh.juice--; heatUp(1);
  if(hasBug("juiceleak") && sh.juice > 1 && Math.random() < .2) sh.juice--;
  let iceMsg = null;
  if(iceOn()){ let ex = 0; if(p.history.some(h=>h.g === g) && iceTrip("repeat", "repeated guess")) ex += 1; if(sh.lastG && Date.now() - sh.lastG < 3000 && iceTrip("rate", "rapid guess")) ex += 2; sh.juice -= ex; iceMsg = iceSentries(); }
  sh.lastG = Date.now();
  const ir = iceScore(p.code, g, cfg.pos || F.analyzer);
  let r = ir.r;
  if(hasBug("dropmark") && !(cfg.pos || F.analyzer) && r.includes("●") && g !== p.code && Math.random() < .3) r = r.replace("●", "") || "-";
  if(hasBug("hang") && Math.random() < .25) ui.hangUntil = performance.now() + 3000;
  const entry = {g, r, pos: ir.pos};
  if(v.sym) entry.sym = new Set(g.split("").filter(c=>p.code.includes(c))).size;
  if(v.side){ entry.side = g[0] === p.code[0]; sh.tampered = true; heatUp(.5); logNote("side", ["sec" + (ui.sec+1) + " " + g + " 1st " + (entry.side ? "right" : "wrong")]); }
  p.history.push(entry); logEvt("try " + g);
  p.probeOut = null; p.probeIns = false; p.probeKind = null;
  ui.input = "";
  if(g === p.code){
    const tries = p.history.length;
    s.status = "open"; s.puzzle = null; s.trace = v.zeroTrace && !(hasBug("leaktrace") && Math.random() < .4) ? false : true; save(); logEvt("sec " + (ui.sec+1) + " open");
    if(v.reports) corpLog("MERIDIAN COMPLIANCE", "Shard " + S.inserted + " unit " + (ui.sec+1) + " verified in " + tries + (tries === 1 ? " attempt" : " attempts") + ". Contents now readable.");
    if(curDef().ice){ iceAudit("sector " + (ui.sec + 1) + " opened by an intruder.");
      if(curDef().sectors[ui.sec].honey && iceOn()){ junkSector(curDef(), ui.sec); (sh.junk = sh.junk || []).push(ui.sec); sh.alert = 3; const hm = iceSentries(); save(); if(hm){ noise(1); showMsg(hm, 2600, checkDry); return; } } }
    if(v.crackAnim){ playFrames(v.crackAnim(ui.sec+1, tries), checkDry); return; }
    if(v.rack) rack(); else sOk();
    fx(v.fx, 600);
    showMsg(v.cracked(ui.sec+1, tries), 2700, checkDry);
    return;
  }
  beep(r.includes("●") ? v.sound.hit : v.sound.miss, 0.09, v.sound.wave, 0.04);
  if(!r.includes("●") && !r.includes("○")) fx(v.fx, 300);
  if(iceOn() && curDef().ice.rekey){ s.fails = (s.fails || 0) + 1; if(s.fails >= curDef().ice.rekey && s.status === "locked"){ s.fails = 0; s.puzzle = makePuzzle(s); iceMsg = iceMsg || ["", " ICE re-keyed", " this sector.", " old marks are void."]; } }
  save();
  if(iceMsg){ noise(.8); showMsg(iceMsg, 2400, ()=>{ if(sh.juice <= 0) checkDry(); else { ui.mode = "crack"; render(); } }); return; }
  if(v.deadman && sh.juice <= v.deadman && sh.juice > 0 && lockedIdx(sh).length){
    logEvt("deadman eject");
    showMsg(["", " DEADMAN", "", " " + sh.juice + " " + say("{juice}") + " left.", " shard ejected", " before it burns."], 2400, ()=>{ S.inserted = null; save(); ui.mode = "idle"; ui.input = ""; render(); });
    return;
  }
  if(sh.juice <= 0){ checkDry(); return; }
  render();
}
function checkDry(){
  const sh = cur(), v = V();
  if(iceDryHook(sh)) return;
  if(sh.juice > 0 || !lockedIdx(sh).length){ toMap(); return; }
  sh.sectors.forEach((s,i)=>{ if(s.status === "locked" && !(sh.secJ && sh.secJ[i] > 0)){ s.status = "burned"; s.puzzle = null; } });
  sh.juice = 0; save();
  noise(1.2); fx(v.fx, 800);
  if(v.reports) corpLog("MERIDIAN COMPLIANCE", "Shard " + S.inserted + " audit ended. Remaining units marked non-compliant.");
  showMsg(v.out, 3600, toMap);
}

// sniffing
function doScan(k, i){
  logEvt("scan " + k + (i != null ? " " + (i+1) : ""));
  const sh = cur(), v = V(), sc = scansNow().find(x=>x.k === k);
  if(!sc) return;
  const cost = scanCost(sc);
  if(sh.juice <= cost){ errBeep(); flash([say("{sniff}"), "", T("notEnough"), T("dry1"), T("dry2")]); return; }
  const iceEx = iceTrip("scan", "scan") ? 1 : 0;
  if(sh.secJ && i != null && sh.secJ[i] != null && sh.swap == null){
    if(sh.secJ[i] <= cost + iceEx){ errBeep(); flash([say("{sniff}"), "", " that sector's vault", " can't cover the scan."]); return; }
    sh.secJ[i] -= cost + iceEx; if(sh.vaultOnly) sh.juice = sh.secJ.reduce((a, b)=>a + (b || 0), 0);
  } else sh.juice -= cost + iceEx;
  heatUp(.5);
  let out = [], note = [];
  const tag = say("{sec}") + (i != null ? (i+1) : ""), nt = "sec" + (i != null ? (i+1) : "");
  const ik = k === "map" ? "survey" : "scans", vis = v.custom ? (ik === "survey" ? v.seeSurvey : v.seeScans) : true;
  const noise = n=>hasBug("badscan") && Math.random() < .35 ? Math.max(1, n + (Math.random() < .5 ? -1 : 1)) : n;
  if(k === "len"){ const n = noise(DIFF[diffOf(sh.sectors[i])].len); out = [" " + tag + T("codeLen"), T("symbols", n)]; note = [nt + " length " + n]; }
  if(k === "type"){ if(vis) sh.sectors[i].known.type = true; out = [" " + tag + T("holds"), " >> " + curDef().sectors[i].type]; note = [nt + " holds " + curDef().sectors[i].type]; }
  if(k === "hard"){ if(vis) sh.hard = true; out = [T("hardest"), " >> " + say("{sec}") + (hardIdxLocked(sh)+1)]; note = ["hardest is sec" + (hardIdxLocked(sh)+1)]; }
  if(k === "sym"){ const s = sh.sectors[i]; ensurePuzzle(s); const n = noise(new Set(s.puzzle.code).size); out = [" " + tag + T("uses"), T("distinct", n)]; note = [nt + " uses " + n + " symbols"]; }
  if(k === "all" || k === "map"){ sh.sectors.forEach((s,j)=>{ if(s.status === "locked"){ if(vis) s.known.diff = true; note.push("sec" + (j+1) + " d" + diffOf(s)); } }); out = [T("diffMap"), T("onMap")]; }
  if(k === "tags"){ sh.sectors.forEach((s,j)=>{ if(s.status === "locked"){ if(vis) s.known.type = true; note.push("sec" + (j+1) + " holds " + curDef().sectors[j].type); } }); out = [T("tagsDone"), T("onMap")]; }
  const logged = logNote(ik, note);
  if(!vis) out = [" scan ran, but no", " screen is wired", " for intel."].concat(logged ? [" saved to logbook."] : [" nothing kept it."]);
  else if(logged) out = out.concat([" + logbook"]);
  save();
  beep(v.sound.hit, 0.06, v.sound.wave, 0.03); fx("sweep", 500);
  if(v.smooth){
    const frames = [];
    for(let k=0;k<=10;k++) frames.push({lines:[" " + v.scanTitle, " [" + v.bar[0].repeat(k) + v.bar[1].repeat(10-k) + "] " + (k*10) + "%"], ms:55});
    frames.push({lines:[" " + v.scanTitle, " [" + v.bar[0].repeat(10) + "] done", ""].concat(out).concat(["", T("cost", cost)]), ms:2000});
    playFrames(frames, toMap); return;
  }
  showMsg([v.scanTitle, " [" + v.bar[0].repeat(10) + "]", ""].concat(out).concat(["", T("cost", cost)]), 2000, toMap);
}

// warez
function confirmBox(lines, fn){ ui.mode = "confirm"; ui.confirm = {lines, fn}; render(); }
function useWare(k, i){
  const sh = cur(), s = i != null ? sh.sectors[i] : null, v = V();
  if(S.ware[k] <= 0){ errBeep(); flash([say("{warez}"), "", " no charges left.", " hit up your fixer."]); return; }
  if(k === "probe"){
    ensurePuzzle(s);
    const free = []; for(let j=0;j<s.puzzle.code.length;j++) if(!s.puzzle.hints[j]) free.push(j);
    if(!free.length){ flash(["peek", "", " nothing left to", " peek at there."]); return; }
    const j = pick(free); s.puzzle.hints[j] = s.puzzle.code[j]; S.ware.probe--; save();
    showMsg(["peek.exe", "", " " + say("{sec}") + (i+1) + " position " + (j+1), " >> " + s.puzzle.code[j]], 1800, toMap);
  }
  if(k === "bypass"){
    if(diffOf(s) > 3){ errBeep(); flash(["bypass", "", " " + say("{sec}") + (i+1) + " is d" + diffOf(s) + ".", " bypass only eats", " d3 or lower."]); return; }
    if(sh.juice <= 2){ errBeep(); flash(["bypass", "", say(" needs 2 {juice} and"), " you'd be dry."]); return; }
    confirmBox(["bypass " + say("{sec}") + (i+1) + "?", "", say(" costs 2 {juice}")].concat(v.zeroTrace ? [" ! leaves forensic", "   residue"] : []), ()=>{
      sh.juice -= 2; s.status = "open"; s.puzzle = null; s.trace = true; S.ware.bypass--; save(); sOk();
      showMsg(["", " bypassed.", " " + say("{sec}") + (i+1) + " is open"], 1400, toMap);
    });
  }
  if(k === "brute"){
    const others = lockedIdx(sh).filter(x=>x !== i).length;
    confirmBox(["bruteforce " + say("{sec}") + (i+1) + "?", "", " opens it now.", " " + others + " other locked", " re-encrypt +1 and", " lose progress."].concat(v.zeroTrace ? [" ! leaves residue"] : []), ()=>{
      s.status = "open"; s.puzzle = null; s.trace = true; S.ware.brute--;
      sh.sectors.forEach(o=>{ if(o.status === "locked"){ o.lvl = Math.min(6 + S.rating, o.lvl + 1); o.puzzle = null; o.known = {type:o.known.type}; } });
      save(); noise(0.6); fx(v.fx, 700); sOk();
      showMsg(["", " SMASHED IT", " " + say("{sec}") + (i+1) + " open", " the rest got angry"], 1800, toMap);
    });
  }
  if(k === "scrap"){
    if(lockedIdx(sh).length <= 1){ errBeep(); flash(["scrapper", "", " cant scrap the last", " locked " + say("{sec}") + "."]); return; }
    const d = diffOf(s), gain = d <= 2 ? 2 : d <= 4 ? 4 : 6;
    confirmBox(["SCRAPPER v1.2", "", " burn " + say("{sec}") + (i+1) + " (d" + d + ")", say(" for +" + gain + " {juice}?"), " no undo."].concat(v.zeroTrace ? [" ! leaves residue"] : []), ()=>{
      s.status = "burned"; s.puzzle = null; sh.juice += gain; sh.max = Math.max(sh.max, sh.juice); S.ware.scrap--; save(); noise(0.8);
      showMsg(["", " " + say("{sec}") + (i+1) + " -> static", say(" +" + gain + " {juice}")], 1500, toMap);
    });
  }
  if(k === "insight"){
    ui.sec = i; ensurePuzzle(s); save();
    const cfg = DIFF[s.puzzle.diff], code = pickCode(cfg, 2); if(!code) return;
    s.puzzle.probeOut = code; s.puzzle.probeIns = true; s.puzzle.probeKind = "full";
    S.ware.insight--; save(); sOk();
    showMsg(["insight.exe", "", " one clean read on", " " + say("{sec}") + (i+1) + ". use it well."], 1500, ()=>enterCrack(i));
    return;
  }
  if(k === "reset"){
    confirmBox(["reset.exe", "", " refill this shard", say(" to " + defOf(S.inserted).juice + " {juice}?")], ()=>{
      sh.juice = Math.max(sh.juice, defOf(S.inserted).juice); sh.max = Math.max(sh.max, sh.juice); S.ware.reset--; save(); sOk();
      showMsg(["", say(" {juice} restored."), " dont waste it"], 1400, toMap);
    });
  }
}

// corp key
function corpKey(){
  const def = curDef(), sh = cur();
  if(def.ice && ui.input === def.key && !ui.keyOk){
    ui.input = "";
    const fail = (def.ice.bugs && def.ice.bugs.includes("keydesync") && Math.random() < .5) || Math.random() * 100 < (def.ice.lockout || 0);
    if(fail){ errBeep(); iceAudit("owner key rejected."); showMsg(corpHeader().concat([{t:" ACCESS DENIED", cls:"inv"}, "", " Key schedule error.", " Please try again."]), 2200, ()=>{ ui.mode = "corp"; render(); }); return; }
    const secs = Math.max(1, Math.min(300, Math.round(def.ice.legit || 1)));
    showMsg(corpHeader().concat([" Key accepted.", " ICE is verifying...", " about " + (secs >= 60 ? Math.floor(secs / 60) + " min " : "") + (secs % 60) + " s."]), secs * 1000, ()=>{ ui.input = def.key; ui.keyOk = true; corpKey(); ui.keyOk = false; });
    return;
  }
  if(ui.input === def.key){
    sh.sectors.forEach(s=>{ if(s.status === "locked"){ s.status = "open"; s.puzzle = null; } });
    save(); ui.input = ""; chord([523, 659]);
    const burned = sh.sectors.filter(s=>s.status === "burned").length;
    showMsg(corpHeader().concat([" Key accepted.", burned ? " " + burned + " part(s) could not" : " Shard decrypted.", burned ? " be recovered." : ""]), 1800, ()=>{ ui.mode = "corp"; render(); });
  } else {
    ui.input = ""; errBeep();
    showMsg(corpHeader().concat([{t:" ACCESS DENIED", cls:"inv"}, "", " This attempt has", " been recorded.", "", " Thank you for using", S.deck === "archon" ? " Tianshu Systems." : " Kestrel DataSystems."]), 2000, ()=>{ ui.mode = "corp"; render(); });
  }
}

// ---------- input ----------
function press(k){
  if(ui.heat) return;
  if(ui.hangUntil && performance.now() < ui.hangUntil){ if(ui.mode === "crack") errBeep(); return; }
  pressFx(k);
  const sd = snd();
  if(guiActive() || dvActive()) kxClick(k === "#" ? 1.4 : k === "*" ? .7 : 1);
  else beep(k === "#" ? sd.key * 1.25 : k === "*" ? sd.key * 0.7 : sd.key, 0.03, sd.wave, 0.02);
  if(V() && V().tk && guiActive() && tkPress(k)) return;
  const m = ui.mode, sh = cur();
  if(m === "policy"){
    if(k === "#"){
      if(S.inserted) corpLog("MERIDIAN COMPLIANCE", "Audit opened on shard " + S.inserted + " (" + (curDef().enc === "B" ? "in-house cipher" : "third-party cipher") + "). Deck SN 44-0917.");
      chord([784,988,1175], "sine");
      showMsg(["", " ✦ Thank you for", "   your diligence! ✦"], 1500, toHome);
    } else if(k === "*"){ plugCracker(S.cracker); }
    return;
  }
  if(m === "msg" || m === "glitch" || m === "idle") return;
  if(m === "play"){
    const n = sh.sectors.length, pl = ui.play;
    if(k === "*"){ toHome(); return; }
    if(k === "#"){ if(pl.i < n-1){ pl.i++; playStep(); } else errBeep(); return; }
    if(k === "B"){ if(pl.i > 0){ pl.i--; playStep(); } else errBeep(); return; }
    if(k === "0"){ playStep(); return; }
    const j = parseInt(k, 10) - 1; if(j >= 0 && j < n){ pl.i = j; playStep(); }
    return;
  }
  if(m === "read"){
    const rd = ui.read, n = sh.sectors.length, pages = docPages(curDef(), sh, rd.focus).length;
    if(k === "*"){ toHome(); return; }
    if(k === "#"){ if(rd.page < pages-1){ rd.page++; render(); } else errBeep(); return; }
    if(k === "B"){ if(rd.page > 0){ rd.page--; render(); } else errBeep(); return; }
    if(rd.corp) return;
    if(k === "0"){ rd.focus = -1; rd.page = 0; render(); return; }
    const j = parseInt(k, 10) - 1; if(j >= 0 && j < n){ rd.focus = rd.focus === j ? -1 : j; rd.page = 0; render(); }
    return;
  }
  if(m === "corp"){
    if(k === "2" || k === "*"){ eject(); return; }
    if(k === "1"){ if(lockedIdx(sh).length){ ui.mode = "corpKey"; ui.input = ""; render(); } else startPlay(true); }
    return;
  }
  if(m === "corpKey"){
    if(/[0-9]/.test(k) && ui.input.length < 6){ ui.input += k; render(); }
    else if(k === "*"){ if(ui.input){ ui.input = ui.input.slice(0,-1); render(); } else { ui.mode = "corp"; render(); } }
    else if(k === "#"){ if(ui.input.length === 6) corpKey(); else errBeep(); }
    return;
  }
  if(m === "map"){
    if(k === "*"){ eject(); return; }
    const lock = lockedIdx(sh).length;
    if(k === "1"){ if(!lock){ flash(["", " nothing left to", " crack here."]); return; } ui.pickFor = "crack"; ui.sel = []; ui.mode = "pick"; render(); }
    if(k === "2"){ if(!lock){ flash(["", " nothing locked", " to look at."]); return; } ui.mode = "sniff"; render(); }
    if(k === "3"){ ui.mode = "warez"; render(); }
    if(k === "4"){ startPlay(false); }
    if(k === "5" && V().logbook){ ui.mode = "log"; ui.logPage = 0; render(); }
    return;
  }
  if(m === "log"){
    const n = Math.max(1, Math.ceil((logNotes(S.inserted) || []).length / 7));
    if(k === "*"){ toMap(); return; }
    if(k === "#"){ ui.logPage = (ui.logPage + 1) % n; render(); return; }
    if(k === "B"){ ui.logPage = (ui.logPage - 1 + n) % n; render(); return; }
    return;
  }
  if(m === "pick" && V().spread && ui.pickFor === "crack"){
    if(k === "*"){ ui.sel = []; ui.mode = "map"; render(); return; }
    if(k === "#"){
      if(!ui.sel.length){ errBeep(); return; }
      if(ui.sel.length === 1){ const i = ui.sel[0]; ui.sel = []; enterCrack(i); return; }
      enterSpread(ui.sel.slice()); ui.sel = []; return;
    }
    const i = parseInt(k, 16) - 1;
    if(isNaN(i) || i < 0 || i >= sh.sectors.length || sh.sectors[i].status !== "locked"){ errBeep(); return; }
    if(ui.sel.includes(i)){ ui.sel = ui.sel.filter(x=>x !== i); render(); return; }
    if(ui.sel.length >= 3){ errBeep(); flash(["", " 3 tgts max."]); return; }
    if(ui.sel.length && diffOf(sh.sectors[ui.sel[0]]) !== diffOf(sh.sectors[i])){ errBeep(); flash(["", " spread needs locks", " of the same d."]); return; }
    ui.sel.push(i); beep(V().sound.hit, .05, V().sound.wave, .03); render(); return;
  }
  if(m === "pick"){
    if(k === "*"){ ui.mode = ["len","type","sym"].includes(ui.pickFor) ? "sniff" : ["crack","smash"].includes(ui.pickFor) ? "map" : "warez"; render(); return; }
    const i = parseInt(k, 16) - 1;
    if(isNaN(i) || i < 0 || i >= sh.sectors.length || sh.sectors[i].status !== "locked"){ errBeep(); return; }
    const f = ui.pickFor;
    if(f === "crack") enterCrack(i);
    else if(["len","type","sym"].includes(f)) doScan(f, i);
    else useWare(f, i);
    return;
  }
  if(m === "spread"){
    const cfg = DIFF[ui.spreadDiff];
    if(k === "*"){ if(ui.input){ ui.input = ui.input.slice(0,-1); render(); } else toMap(); return; }
    if(k === "#"){ submitSpread(); return; }
    if(ui.input.length < cfg.len){ ui.input += k; render(); }
    return;
  }
  if(m === "crack"){
    const s = sh.sectors[ui.sec], cfg = DIFF[s.puzzle ? s.puzzle.diff : diffOf(s)];
    if(k === "*"){ if(ui.input){ ui.input = ui.input.slice(0,-1); render(); } else toMap(); return; }
    if(k === "#"){
      if(!ui.input && (V().engine || V().auto) && !CAND.busy && CAND.list && CAND.count === 1 && CAND.key === candKey()){
        ui.arm = 0; ui.input = unpack(CAND.list[0], cfg.len); render();
        setTimeout(()=>{ if(ui.mode === "crack") submitGuess(); }, 350);
        return;
      }
      if(!ui.input && V().macro && !probeCfg() && s.puzzle && s.puzzle.history.length){ ui.input = s.puzzle.history[s.puzzle.history.length - 1].g; render(); return; }
      if(!ui.input && probeCfg()){
        const now = performance.now();
        ui.arm = (now - (ui.armT || 0) < 1500 ? (ui.arm || 0) : 0) + 1; ui.armT = now;
        if(ui.arm >= 3){ ui.arm = 0; runProbe(); return; }
        render();
        setTimeout(()=>{ if(performance.now() - ui.armT >= 1500 && ui.arm){ ui.arm = 0; if(ui.mode === "crack") render(); } }, 1550);
        return;
      }
      ui.arm = 0; submitGuess(); return;
    }
    ui.arm = 0;
    if(ui.input.length < cfg.len){
      ui.input += k;
      if(hasBug("keybounce") && ui.input.length < cfg.len && Math.random() < .08) ui.input += k;
      if(V().predict && s.puzzle && s.puzzle.history.length && ui.input.length < cfg.len){
        candUpdate();
        if(CAND.list && CAND.key === candKey()){
          const hits = []; for(let j=0;j<CAND.list.length && hits.length < 2;j++){ const c = unpack(CAND.list[j], cfg.len); if(c.startsWith(ui.input)) hits.push(c); }
          if(hits.length === 1){ ui.input = hits[0]; beep(1200, .03, "sine", .02); }
        }
      }
      render();
    }
    return;
  }
  if(m === "sniff"){
    if(k === "*"){ toMap(); return; }
    const sc = scansNow()[parseInt(k,10)-1]; if(!sc) return;
    if(sc.needSec){ ui.pickFor = sc.k; ui.mode = "pick"; render(); } else doScan(sc.k, null);
    return;
  }
  if(m === "warez"){
    if(k === "*"){ toMap(); return; }
    const w = WARE[parseInt(k,10)-1]; if(!w) return;
    if(S.ware[w.k] <= 0){ errBeep(); flash([say("{warez}"), "", " " + w.name + ": no charges.", " hit up your fixer."]); return; }
    if(w.k === "reset"){ useWare("reset", null); return; }
    if(!lockedIdx(sh).length){ flash(["", " nothing locked."]); return; }
    ui.pickFor = w.k; ui.mode = "pick"; render();
    return;
  }
  if(m === "confirm"){
    if(k === "#"){ const fn = ui.confirm.fn; ui.confirm = null; fn(); }
    else if(k === "*"){ ui.confirm = null; ui.mode = "warez"; render(); }
  }
}
function pressFx(k){
  const led = document.getElementById("ledAct"); if(led){ led.classList.add("on"); setTimeout(()=>led.classList.remove("on"), 120); }
  const b = document.querySelector('.key[data-k="' + k + '"]');
  if(b){ b.classList.add("pressed"); setTimeout(()=>b.classList.remove("pressed"), 90); }
}

// ---------- side panels ----------
function swLabel(x){ return x === "auto" ? "auto" : typeof x === "number" ? x + " juice" : x ? "yes" : "no"; }
function renderTray(){
  const own = (k, id)=>!window.HR_owns || window.HR_owns(k, id);
  const shards = SHARDS.filter(d=>own("shard", d.id)).map(d=>{
    const st = shardStatus(d.id), sh = S.shards[d.id];
    return '<button type="button" class="cart' + (S.inserted === d.id ? " in" : "") + '" data-id="' + d.id + '" style="--c:' + d.color + '">' +
      '<div class="label"></div><div class="body"><span class="id">' + d.id + '</span><span class="nm">' + esc(d.name) + '</span>' +
      '<span class="chips"><span class="chip ' + st.tag + '">' + st.label + '</span><span class="chip">' + d.kind + '</span>' +
      (d.juice ? '<span class="chip">juice ' + sh.juice + '</span>' : "") +
(d.ice ? '<span class="chip">ICE · ' + esc(ICE_CTRL[d.ice.ctrl] || "custom") + "</span>" : "") + (sh.black ? '<span class="chip bad">BLACK ICE ×' + sh.black + "</span>" : "") + "</span></div></button>";
  }).join("");
  const carts = Object.keys(CRACKERS).filter(id=>own("cracker", id)).map(id=>{
    const c = CRACKERS[id];
    return '<button type="button" class="cart cracker' + (S.cracker === id ? " in" : "") + '" data-cr="' + id + '" style="--c:' + c.stripe + '">' +
      '<div class="label"></div><div class="body"><span class="id">' + esc(c.name) + '</span><span class="nm">' + esc(c.ver + " · " + c.by) + "<br>" + esc(c.blurb) + '</span>' +
      '<span class="chips"><span class="chip">' + (S.cracker === id ? "click to unplug" : "click to plug in") + '</span><span class="chip">' + (c.runs ? (c.runs.length === 2 ? "DS-4 · ARCHON-7" : c.runs[0] === "ds4" ? "DS-4 · ARCHON emu" : "ARCHON-7 only") : c.nativeOn ? "ARCHON-7 only" : id === "oracle" ? "DS-4 only" : "DS-4 · ARCHON emu") + "</span></span></div></button>";
  }).join("");
  document.getElementById("tray").innerHTML = shards;
  document.getElementById("crackerTray").innerHTML = carts;
}
function renderBurnList(){
  const el = document.getElementById("burnList"); if(!el) return;
  el.innerHTML = CUSTOM.map(c=>{ const x = c.img.x; return '<div class="burn-item"><span><b>' + esc(String(c.img.n || "custom").toUpperCase()) + "</b> · " + x.mem + " KB · " + x.runs.map(r=>DECK_SHORT[r]).join(" + ") + (x.cpu ? " · " + x.cpu + " ms/guess" : "") + '</span><button type="button" class="btn" data-unburn="' + c.id + '">Erase</button></div>'; }).join("");
}
function renderSide(){
  renderTray(); renderBays(); renderArchon();
  const sa = document.getElementById("slotShard"), sx = document.getElementById("slotAux"), v = V();
  sa.textContent = S.inserted ? S.inserted + " " + curDef().name.toLowerCase() : "empty"; sa.className = S.inserted ? "" : "empty";
  sx.textContent = v ? v.name + " " + v.ver : "empty"; sx.className = v ? "" : "empty";
  WARE.forEach(w=>{ const o = document.getElementById("w_" + w.k); if(o) o.textContent = S.ware[w.k]; });
  const gm = document.getElementById("gmBox");
  if(gm && S.show && S.inserted){
    const sh = cur(), d = curDef();
    gm.hidden = false;
    gm.textContent = "GM VIEW  shard " + S.inserted + "  juice " + sh.juice + "  enc " + (d.enc ? ENC[d.enc].name : "none") + "\n" +
      sh.sectors.map((s,i)=>"sec" + (i+1) + " " + s.status + " lvl" + s.lvl + " d" + diffOf(s) + (s.puzzle ? "  code " + s.puzzle.code : "")).join("\n");
  } else if(gm) gm.hidden = true;

}
let transcriptStarted = false;
function addTranscriptHeader(def, corp, verb){
  const box = document.getElementById("transcript");
  if(!transcriptStarted){ box.innerHTML = ""; transcriptStarted = true; }
  const el = document.createElement("div"); el.className = "t";
  el.innerHTML = "<b>" + esc(corp || !V() ? (S.deck === "archon" ? "DATAVIEW" : "SHARDVIEW") : V().name) + " " + verb + " " + def.id + " · " + esc(def.name.toUpperCase()) + "</b>";
  box.prepend(el);
}
function pushUnderHeader(el){
  const box = document.getElementById("transcript"), head = box.firstChild;
  box.insertBefore(el, head); box.insertBefore(head, el);
}
function addTranscript(i, text, ok){
  const el = document.createElement("div"); el.className = "t " + (ok ? "ok" : "g");
  el.textContent = "[" + (i+1) + "] " + text; pushUnderHeader(el);
}
function addTranscriptDoc(text){
  const el = document.createElement("div"); el.className = "t doc"; el.textContent = text; pushUnderHeader(el);
}

// ---------- decks ----------
function deckHTML(id){
  if(id === "archon") return `
    <div class="archon" aria-label="TIANSHU ARCHON-7 cyberdeck">
      <div class="a-top"><span class="a-brand"><span class="a-seal" aria-hidden="true">天枢</span>TIANSHU <b>ARCHON-7</b><em>执政官-7</em></span>
        <span class="a-leds"><span><i id="ledPow" class="on"></i>PWR</span><span><i id="ledAux"></i>AUX</span><span><i id="ledAct"></i>ACT</span></span></div>
      <div class="slots">
        <div class="slot"><b>SHARD</b><span id="slotShard" class="empty">empty</span></div>
        <div class="slot"><b>AUX</b><span id="slotAux" class="empty">empty</span></div>
      </div>
      <div class="a-face">
        <div class="a-screen">
          <div class="win main"><div class="wt"><span id="wMainTitle">DATAVIEW 2.1 数据视图</span><span>■ □ ×</span></div><div class="oled" id="oled"><pre id="screen" aria-live="polite"></pre></div><div class="kx" id="kxui" hidden aria-live="polite"></div></div>
          <div class="a-side">
            <div class="win sys" data-w="sys"><button type="button" class="wt" data-min="sys" title="Collapse to sidebar"><span>SYS</span><span>璇玑 OS 3.1 ▁</span></button><pre class="wp" id="wSys"></pre></div>
            <div class="win media" data-w="media"><button type="button" class="wt" data-min="media" title="Collapse to sidebar"><span>MEDIA</span><span><span id="wMediaTag">--</span> ▁</span></button><pre class="wp" id="wMedia"></pre></div>
            <div class="a-targets" id="aTargets" hidden></div>
            <div class="win log" data-w="log"><button type="button" class="wt" data-min="log" title="Collapse to sidebar"><span>LOG</span><span>tail ▁</span></button><pre class="wp" id="wLog"></pre></div>
          </div>
          <div class="a-dock" id="aDock" hidden></div>
          <div class="a-cool" id="aCool" hidden aria-live="polite"><b>THERMAL SHUTDOWN</b><span id="aCoolBar"></span><span id="aCoolT"></span></div>
        </div>
        <div class="softcol" id="softkeys"></div>
      </div>
      <div class="seg" id="seg" hidden></div>
      <div class="keypad" id="keypad"></div>
      <div class="bays" id="bays"></div>
      <div class="a-foot"><span>SN TS7-2219</span><span>天枢系统 · TIANSHU SYSTEMS · SHENZHEN</span></div>
    </div>`;
  return `
    <div class="deck" aria-label="KESTREL DS-4 cyberdeck">
      <i class="screw s1"></i><i class="screw s2"></i><i class="screw s3"></i><i class="screw s4"></i>
      <div class="slots">
        <div class="slot"><b>SHARD</b><span id="slotShard" class="empty">empty</span></div>
        <div class="slot"><b>AUX</b><span id="slotAux" class="empty">empty</span></div>
      </div>
      <div class="bezel">
        <div class="oled" id="oled"><pre id="screen" aria-live="polite"></pre></div>
        <div class="seg" id="seg" aria-hidden="true"></div>
      </div>
      <div class="therm" id="therm" role="group" aria-label="Thermal monitor">
        <div class="cool-bar" id="coolBar" aria-label="Cooldown progress"></div>
        <div class="therm-row"><span class="therm-lbl">TEMP</span><span class="therm-digits" id="thermDigits" aria-live="off"></span><span class="therm-lbl">°C</span>
          <span class="ovh"><i id="ovhLed"></i><span class="therm-lbl">OVERHEAT</span></span></div>
      </div>
      <div class="keypad" id="keypad"></div>
      <div class="bays" id="bays"></div>
      <div class="brand"><span>KESTREL DS-4</span><span>SN 44-0917</span></div>
    </div>`;
}
function mountDeck(){
  document.getElementById("deckMount").innerHTML = deckHTML(S.deck);
  document.querySelector(".wrap").classList.toggle("is-archon", S.deck === "archon");
  buildKeypad(); applyWins(); renderTherm();
}
function switchDeck(id){
  if(id === S.deck) return;
  if(ui.heat){ errBeep(); syncHw(); return; }
  ui.temp = THERM[id].amb + 2;
  cancelTimers();
  S.deck = id; S.upg = S.deckUpg[id]; save();
  ui.log = []; logEvt("boot " + DECKS[id].short);
  mountDeck(); syncHw();
  const c = S.cracker ? compat(S.cracker, id) : "none";
  if(c === "reject" || c === "overheat") startCracker();
  else if(c === "emu") playFrames(emuFrames(), toHome);
  else toHome();
}
const WINS = [["sys","SYS"],["media","MEDIA"],["log","LOG"]];
function applyWins(){
  const dock = document.getElementById("aDock"); if(!dock) return;
  if(!S.winMin) S.winMin = {};
  WINS.forEach(([k])=>{ const w = document.querySelector('.win[data-w="' + k + '"]'); if(w) w.hidden = !!S.winMin[k]; });
  const mins = WINS.filter(([k])=>S.winMin[k]);
  dock.hidden = !mins.length;
  dock.innerHTML = mins.map(([k,n])=>'<button type="button" class="dock-tab ' + k + '" data-restore="' + k + '" title="Restore ' + n + '">' + n + "</button>").join("");
  document.querySelector(".a-screen").classList.toggle("all-min", mins.length === WINS.length);
  document.querySelector(".a-side").hidden = mins.length === WINS.length;
}
function toggleWin(k, min){
  if(!S.winMin) S.winMin = {};
  S.winMin[k] = min; save(); applyWins();
  beep(min ? 520 : 780, .04, "sine", .02);
  const f = document.querySelector(min ? '.dock-tab[data-restore="' + k + '"]' : '.wt[data-min="' + k + '"]'); if(f) f.focus();
}
function renderBays(){
  const el = document.getElementById("bays"); if(!el) return;
  const d = DECKS[S.deck], inst = HW.filter(([k])=>S.upg[k]).map(([,n])=>n);
  let h = "";
  for(let i=0;i<d.bays;i++) h += inst[i] ? '<span class="bay full">' + inst[i] + "</span>" : '<span class="bay open">OPEN</span>';
  el.innerHTML = h;
}
function logEvt(t){ if(!ui.log) ui.log = []; ui.log.push(t); if(ui.log.length > 6) ui.log.shift(); }
ui.log = []; ui.temp = 34;
function archonSys(){
  const el = document.getElementById("wSys"); if(!el) return;
  const v = V(), used = hwUsed(S.upg);
  el.innerHTML = '<span class="c-hi">ARCHON-7</span>  r' + S.rating + "\n" +
    "cpu " + (ui.temp >= THERM.archon.warn ? '<span class="c-burn">' + ui.temp.toFixed(1) + "°C hot</span>" : ui.temp.toFixed(1) + "°C") + "\n" +
    "hw  " + used + "/" + DECKS.archon.bays + ' <span class="c-dim">bays</span>\n' +
    "aux " + (v ? '<span class="c-lock">' + esc(v.name.slice(0, 12)) + "</span>" : '<span class="c-dim">none</span>') + "\n" +
    (v ? (compat(S.cracker, "archon") === "native" ? 'mode <span class="c-open">native</span>' : 'mode <span class="c-lock">DS-4 emu</span>') : 'lib <span class="c-dim">shardio 2.0</span>');
}
function archonMedia(){
  const el = document.getElementById("wMedia"), tag = document.getElementById("wMediaTag"); if(!el) return;
  if(!S.inserted){ el.innerHTML = '<span class="c-dim">no media</span>\n\n'; tag.textContent = "--"; return; }
  if(ui.heat){ el.innerHTML = '<span class="c-burn">host overheating</span>\n\n'; return; }
  const d = curDef(), sh = cur(), v = V(), st = shardStatus(S.inserted);
  tag.textContent = d.kind.toUpperCase();
  let h = '<span class="c-hi">' + d.id + "</span> " + esc(d.name.slice(0, 13).toLowerCase()) + "\n";
  if(!v){
    const lbl = st.tag === "partial" ? '<span class="c-burn">integrity err</span>' : st.tag === "sealed" ? '<span class="c-lock">encrypted</span>' : '<span class="c-open">readable</span>';
    h += "view " + lbl + "\n" + '<span class="c-dim">sectors hidden</span>';
  } else {
    const n = Math.max(0, Math.min(10, Math.round(sh.juice / Math.max(1, sh.max) * 10)));
    h += "jc " + String(sh.juice).padStart(2, " ") + ' <span class="c-open">' + "▮".repeat(n) + '</span><span class="c-dim">' + "▯".repeat(10 - n) + "</span>\n";
    h += "sec " + sh.sectors.map((x,i)=>{
      const sel = (ui.mode === "crack" && ui.sec === i) || (ui.mode === "spread" && ui.spreadCols && ui.spreadCols.includes(i));
      const cls = x.status === "open" ? "c-open" : x.status === "burned" ? "c-burn" : sel ? "c-hi" : "c-lock";
      return '<span class="' + cls + '">' + (x.status === "open" ? "■" : x.status === "burned" ? "×" : sel ? "▶" : "□") + "</span>";
    }).join("");
  }
  el.innerHTML = h;
}
function archonLog(){
  const el = document.getElementById("wLog"); if(!el) return;
  const L = (ui.log || []).slice(-4);
  el.innerHTML = L.length ? L.map((t,i)=>(i === L.length - 1 ? '<span class="c-open">&gt; </span>' : '<span class="c-dim">&gt; </span>') + esc(t.slice(0, 18))).join("\n") : '<span class="c-dim">&gt; ready</span>';
}
// side keys: each screen decides what its 7 keys do
const SOFT_N = 7;
function softKeys(){
  if(V() && V().tk && guiActive()){ const t = tkSoft(); if(t) return t; }
  const m = ui.mode, v = V(), sh = cur(), d = curDef(), K = (label, keys, fn)=>({label, keys, fn});
  const up = t=>String(t).toUpperCase().slice(0, 9);
  const list = (items, back)=>{
    if(items.length <= SOFT_N - 1) return items.concat([back]);
    const per = SOFT_N - 2, pages = Math.ceil(items.length / per), pg = (ui.softPage || 0) % pages;
    return items.slice(pg * per, pg * per + per).concat([K("MORE ▸", null, ()=>{ ui.softPage = (pg + 1) % pages; render(); }), back]);
  };
  const zh = (a, b)=>S.deck === "archon" ? a : b;
  if(m === "corp"){
    const locked = lockedIdx(sh).length;
    return [locked ? K(zh("解锁", "UNLOCK"), ["1"]) : K(d.kind === "text" ? zh("阅读", "READ") : zh("播放", "PLAY"), ["1"]), K(zh("弹出", "EJECT"), ["2"])];
  }
  if(m === "corpKey") return [K(zh("确认", "CONFIRM"), ["#"]), K(ui.input ? zh("删除", "DELETE") : zh("取消", "CANCEL"), ["*"])];
  if(m === "play" && ui.play && ui.play.corp) return [K("下一段", ["#"]), K("上一段", ["B"]), K("重播", ["0"]), K("停止", ["*"])];
  if(m === "read" && ui.read && ui.read.corp) return [K("返回", ["*"])];
  if(m === "map") return [K(up(say("{crack}")), ["1"]), K(up(say("{sniff}")), ["2"]), K(up(say("{warez}")), ["3"]), K(d.kind === "text" ? "READ" : "PLAY", ["4"])].concat(v && v.logbook ? [K("LOG", ["5"])] : []).concat([K("EJECT", ["*"])]);
  if(m === "pick"){
    const items = sh.sectors.map((x,i)=>x.status === "locked" ? K(up(say("{sec}")) + " " + (i+1), [(i+1).toString(16).toUpperCase()]) : null).filter(Boolean);
    if(v && v.spread && ui.pickFor === "crack") return list(items.concat([K("FIRE (" + (ui.sel || []).length + ")", ["#"])]), K("BACK", ["*"]));
    return list(items, K("BACK", ["*"]));
  }
  if(m === "crack"){
    const out = [K("SUBMIT", ["#"]), K(ui.input ? "DELETE" : "BACK", ["*"])];
    if(v && (v.engine || v.auto) && !ui.input && CAND.count === 1 && CAND.list && CAND.key === candKey()) out.unshift(K("LOCK ON", ["#"]));
    if(probeCfg()) out.push(K(up(T("probeWord")), null, ()=>{ if(ui.input){ errBeep(); return; } runProbe(); }));
    return out;
  }
  if(m === "spread") return [K("FIRE", ["#"]), K(ui.input ? "DELETE" : "BACK", ["*"])];
  if(m === "sniff"){
    const SL = {len:"LENGTH", type:"CONTENT", hard:"HARDEST", sym:"SYMBOLS", all:"ALL DIFF", map:"FULL MAP", tags:"TAG ALL"};
    return list(scansNow().map((sc,i)=>K(SL[sc.k] || up(sc.k), [String(i+1)])), K("BACK", ["*"]));
  }
  if(m === "warez") return list(WARE.map((w,i)=>K(up(w.name), [String(i+1)])), K("BACK", ["*"]));
  if(m === "confirm") return [K("YES", ["#"]), K("NO", ["*"])];
  if(m === "log") return [K("PAGE +", ["#"]), K("PAGE -", ["B"]), K("BACK", ["*"])];
  if(m === "play") return [K("NEXT", ["#"]), K("PREV", ["B"]), K("REPLAY", ["0"]), K("STOP", ["*"])];
  if(m === "read"){
    const out = [K("PAGE +", ["#"]), K("PAGE -", ["B"])];
    if(!ui.read.corp) out.push(K("ALL SECS", ["0"]));
    return out.concat([K("BACK", ["*"])]);
  }
  return [];
}
function renderSoft(){
  const el = document.getElementById("softkeys"); if(!el) return;
  const keys = softKeys(); ui.soft = keys;
  let h = "";
  for(let i=0;i<SOFT_N;i++){
    const k = keys[i];
    h += '<button type="button" class="soft" data-s="' + i + '"' + (k ? "" : " disabled") + ' aria-label="' + (k ? esc(k.label) : "unused") + '"><span class="lcd">' + (k ? esc(k.label) : "") + '</span><span class="cap"></span></button>';
  }
  el.innerHTML = h;
}
function softPress(i){
  const k = ui.soft && ui.soft[i]; if(!k) return;
  const b = document.querySelector('.soft[data-s="' + i + '"]'); if(b){ b.classList.add("pressed"); setTimeout(()=>b.classList.remove("pressed"), 90); }
  if(k.fn){ beep(snd().key * 1.1, .03, snd().wave, .02); k.fn(); return; }
  k.keys.forEach(key=>press(key));
}
function targetWins(){
  const sh = cur();
  return ui.spreadCols.map((i,k)=>{
    const s = sh.sectors[i], down = s.status === "open";
    const rows = ui.spreadLog.filter(e=>e.res[k] !== null && e.res[k] !== "DOWN").slice(-4).map(e=>{
      const r = e.res[k];
      if(r === "HIT") return '<div class="kx-shot">' + kxTiles(e.g, "●".repeat(e.g.length), true) + "</div>";
      return '<div class="kx-shot">' + kxTiles(e.g, r, e.pos) + (e.pos ? "" : "<span>" + kxSummary(r) + "</span>") + "</div>";
    });
    const body = (rows.length ? rows.join("") : '<div class="kx-shot">Awaiting fire</div>') + (down ? '<div class="dn">' + kxIcon("down") + "Target down</div>" : "");
    return '<div class="win tgt' + (down ? " down" : "") + '"><div class="wt"><span>TARGET ' + (i+1) + '</span><span>' + (down ? "DOWN" : "LIVE") + '</span></div><div class="kxm">' + body + "</div></div>";
  }).join("");
}
// ---------- RAZORBACK KX interface ----------
function guiActive(){
  const v = V();
  if(!v || !v.gui || S.deck !== "archon" || compat(S.cracker, "archon") !== "native") return false;
  const m = ui.mode;
  if(m === "corp" || m === "corpKey" || m === "corpMsg") return false;
  if(m === "play" && ui.play && ui.play.corp) return false;
  if(m === "read" && ui.read && ui.read.corp) return false;
  return true;
}
// soft, filtered UI sounds instead of chiptune beeps
function kxClick(pitch){
  const a = ac(); if(!a) return;
  const t = a.currentTime, len = Math.floor(a.sampleRate * .012), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = (Math.random()*2 - 1) * Math.pow(1 - i/len, 2);
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  f.type = "bandpass"; f.frequency.value = 2600 * (pitch || 1); f.Q.value = 3; g.gain.value = .35;
  src.buffer = buf; src.connect(f); f.connect(g); g.connect(a.destination); src.start(t);
}
// boot: one quiet, swung bar of breakbeat (kick, snare with ghost notes, hats)
function kxBoot(){
  const a = ac(); if(!a) return;
  const t0 = a.currentTime + .03, step = .118, swing = .022;
  const out = a.createGain(); out.gain.value = .16; out.connect(a.destination);
  const nlen = Math.floor(a.sampleRate * .4), nb = a.createBuffer(1, nlen, a.sampleRate), nd = nb.getChannelData(0);
  for(let i=0;i<nlen;i++) nd[i] = Math.random()*2 - 1;
  const noise = (t, type, fq, vol, dec)=>{
    const n = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    n.buffer = nb; f.type = type; f.frequency.value = fq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dec);
    n.connect(f); f.connect(g); g.connect(out); n.start(t); n.stop(t + dec + .02);
  };
  const kick = (t, vol)=>{
    const o = a.createOscillator(), g = a.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(48, t + .11);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + .32);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + .35);
  };
  const snare = (t, vol)=>{
    noise(t, "highpass", 1400, vol * .8, .16);
    const o = a.createOscillator(), g = a.createGain(); o.type = "triangle"; o.frequency.value = 190;
    g.gain.setValueAtTime(vol * .6, t); g.gain.exponentialRampToValueAtTime(.0001, t + .08);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + .1);
  };
  //            0 1 2 3 4 5 6 7 8 9 A B C D E F
  const K = "x . . . . . x . . x x . . . . .".split(" ");
  const S = ". . . . X . . g . g . . X . . g".split(" ");
  const H = "x . x . x . x . x . x . x . o .".split(" ");
  for(let i=0;i<16;i++){
    const t = t0 + i * step + (i % 2 ? swing : 0);
    if(K[i] === "x") kick(t, i === 0 ? 1 : .8);
    if(S[i] === "X") snare(t, .9); else if(S[i] === "g") snare(t, .22);
    if(H[i] === "x") noise(t, "highpass", 7500, i % 4 ? .18 : .3, .04);
    else if(H[i] === "o") noise(t, "highpass", 6500, .22, .22);
  }
  kick(t0 + 16 * step, .9);
}
function kxBootMetal(){
  const a = ac(); if(!a) return;
  const t0 = a.currentTime + .02, out = a.createGain(); out.gain.value = .5;
  const comp = a.createDynamicsCompressor(); out.connect(comp); comp.connect(a.destination);
  const dist = a.createWaveShaper(), curve = new Float32Array(1024);
  for(let i=0;i<1024;i++){ const x = i/512 - 1; curve[i] = Math.tanh(x * 9); }
  dist.curve = curve; dist.oversample = "4x";
  const tone = a.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 2400; tone.Q.value = .8;
  const pre = a.createGain(); pre.gain.value = .9; pre.connect(dist); dist.connect(tone); tone.connect(out);
  // metallic clank: short noise through a ringing bandpass
  const len = Math.floor(a.sampleRate * .25), nb = a.createBuffer(1, len, a.sampleRate), d = nb.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = (Math.random()*2 - 1) * Math.pow(1 - i/len, 5);
  [1850, 2730, 4100].forEach(fq=>{
    const n = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain();
    n.buffer = nb; bp.type = "bandpass"; bp.frequency.value = fq; bp.Q.value = 18; g.gain.value = 1.4;
    n.connect(bp); bp.connect(g); g.connect(out); n.start(t0);
  });
  // chord: E2 power chord (root, fifth, octave), slightly detuned saws
  const chord = (t, dur, mute, bend)=>{
    const env = a.createGain();
    env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(.32, t + .012);
    env.gain.exponentialRampToValueAtTime(mute ? .0001 : .14, t + (mute ? .16 : .5));
    if(!mute) env.gain.exponentialRampToValueAtTime(.0001, t + dur);
    env.connect(pre);
    [82.4, 123.5, 164.8].forEach((fq,i)=>[-6, 6].forEach(c=>{
      const o = a.createOscillator(); o.type = "sawtooth"; o.frequency.value = fq; o.detune.value = c + i;
      if(bend) o.frequency.exponentialRampToValueAtTime(fq * .94, t + dur);
      o.connect(env); o.start(t); o.stop(t + dur + .05);
    }));
  };
  chord(t0 + .22, .2, true); chord(t0 + .42, .2, true); chord(t0 + .62, 1.3, false, true);
  // sub hit under the last chord
  const s = a.createOscillator(), sg = a.createGain(); s.type = "sine";
  s.frequency.setValueAtTime(110, t0 + .62); s.frequency.exponentialRampToValueAtTime(41, t0 + 1.1);
  sg.gain.setValueAtTime(.5, t0 + .62); sg.gain.exponentialRampToValueAtTime(.0001, t0 + 1.3);
  s.connect(sg); sg.connect(out); s.start(t0 + .62); s.stop(t0 + 1.35);
}
function kxTone(freqs, gap){
  const a = ac(); if(!a) return;
  freqs.forEach((fq,i)=>{
    const t = a.currentTime + i * (gap || .09), o = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
    o.type = "triangle"; o.frequency.value = fq; lp.type = "lowpass"; lp.frequency.value = 1800;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .02); g.gain.exponentialRampToValueAtTime(0.0001, t + .45);
    o.connect(lp); lp.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .5);
  });
}
const KXI = {
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5"/>',
  live:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  down:'<circle cx="12" cy="12" r="9"/><path d="M7.5 12.5l3 3 6-7"/>',
  lost:'<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>',
  ammo:'<path d="M9 21V9.5l3-6.5 3 6.5V21z"/><path d="M9 16h6"/>',
  radar:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12l6.5-6.5"/>',
  box:'<path d="M3 7.5l9-4.5 9 4.5v9l-9 4.5-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',
  star:'<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/>',
  play:'<path d="M8 5l11 7-11 7z"/>', doc:'<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7"/>',
  warn:'<path d="M12 3l10 18H2z"/><path d="M12 10v4.5M12 17.5v.5"/>', bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'
};
const kxIcon = n=>'<svg class="kxi" viewBox="0 0 24 24" aria-hidden="true">' + (KXI[n] || KXI.target) + "</svg>";
const kxPips = d=>'<span class="pips" aria-label="difficulty ' + d + ' of 6">' + Array.from({length:6}, (_,i)=>'<i class="' + (i < d ? "on" : "") + '"></i>').join("") + "</span>";
function kxTiles(g, r, pos){
  return '<span class="kx-tiles">' + g.split("").map((c,i)=>{
    const cls = !pos ? "" : r[i] === "●" ? "hit" : r[i] === "○" ? "graze" : "miss";
    return '<span class="kx-tile ' + cls + '">' + esc(c) + "</span>";
  }).join("") + "</span>";
}
function kxSyms(cfg, out){
  const all = HEX.slice(0, cfg.syms).split("");
  return '<div class="kx-syms"><span class="kx-label">Valid symbols ' + all[0] + "–" + all[all.length-1] + (out.length ? " · " + out.length + " ruled out" : "") + '</span><div class="kx-tiles">' +
    all.map(c=>'<span class="kx-tile sym' + (out.includes(c) ? " out" : "") + '">' + c + "</span>").join("") + "</div></div>";
}
function kxSummary(r){
  const b = (r.match(/●/g) || []).length, w = (r.match(/○/g) || []).length;
  if(!b && !w) return "No hits";
  return [b ? b + (b === 1 ? " hit" : " hits") : "", w ? w + (w === 1 ? " graze" : " grazes") : ""].filter(Boolean).join(", ");
}
function kxHead(){
  if(V() && V().tk) return tkHead();
  const sh = cur(), d = curDef();
  return '<div class="kx-head"><div><div class="kx-k">Shard ' + d.id + '</div><div class="kx-t">' + esc(d.name) + '</div></div><span class="kx-chip">' + (d.enc ? ENC[d.enc].name : "No cipher") + "</span></div>" +
    '<div class="kx-ammo">' + kxIcon("ammo") + "<b>" + sh.juice + '</b><span>ammo</span><div class="kx-bar"><i style="--p:' + (sh.juice / Math.max(1, sh.max)).toFixed(3) + '"></i></div></div>';
}
function kxTargetRow(s, i, opts){
  const d = curDef(), F = feat(), st = s.status === "open" ? "down" : s.status === "burned" ? "lost" : "live";
  const known = F.autoMap || s.known.diff, tag = typeTag(s, d.sectors[i], s.status === "open");
  let sub = st === "down" ? (tag !== "?????" && s.lvl ? "Holds: " + tag.toLowerCase() : "Open") : st === "lost" ? "Burned to static" : (known ? kxPips(diffOf(s)) + "difficulty " + diffOf(s) : "Difficulty unknown") + (tag !== "?????" ? " · " + tag.toLowerCase() : "");
  const hard = st === "live" && opts && opts.hard === i;
  return '<div class="kx-row ' + st + (opts && opts.sel ? " sel" : "") + '">' + (opts && opts.badge ? '<span class="kx-badge">' + (i+1).toString(16).toUpperCase() + "</span>" : kxIcon(st)) +
    '<div><div class="n">Target ' + (i+1) + '</div><div class="s">' + sub + '</div></div><span class="kx-status ' + (hard ? "hard" : st) + '">' + (hard ? "hardest" : st) + "</span></div>";
}
function kxCard(lines){
  const txt = lines.map(l=>typeof l === "string" ? l : l.t).map(t=>t.replace(/^\s*>>\s*/, "").trim()).filter(t=>t && !/^[>▓X!=\-~#|.\[\]\s%0-9■]*$/.test(t));
  if(!txt.length) return "";
  const title = txt[0].charAt(0).toUpperCase() + txt[0].slice(1), body = txt.slice(1).map(t=>t.charAt(0).toUpperCase() + t.slice(1));
  const kind = /down|cleared|bypassed|restored|open|smashed|reveal|insight|resolved|readable|found|\+/i.test(txt.join(" ")) ? "good" : /out of|not enough|need|only|no |can't|cant|max|spread needs|lost|exhausted|purged|fail/i.test(txt.join(" ")) ? "bad" : "info";
  return '<div class="kx-card ' + kind + '">' + kxIcon(kind === "good" ? "down" : kind === "bad" ? "warn" : "radar") + "<h3>" + esc(title) + "</h3>" + body.map(t=>"<p>" + esc(t) + "</p>").join("") + "</div>";
}
const KX_SCAN = {len:"Code length of a target", type:"What a target holds", hard:"Find the hardest target", sym:"How many symbols a target uses", all:"Difficulty of every target", map:"Full survey", tags:"Tag every target"};
const KX_WARE = {probe:"Reveal one symbol and its position", bypass:"Open an easy target (difficulty 3 or less) for 2 ammo", brute:"Open any target now; the rest get harder", scrap:"Burn a target into extra ammo", reset:"Refill this shard's ammo", insight:"One sharp, full suggestion"};
function renderKX(){
  const el = document.getElementById("kxui"); if(!el) return;
  el.classList.remove("dv");
  el.classList.toggle("tk", !!(V() && V().tk));
  el.classList.toggle("or", !!(V() && V().or));
  if(V() && V().or && renderOR(el)) return;
  if(V() && V().tk && renderTK(el)) return;
  const v = V(), sh = cur(), d = curDef(), F = feat(), m = ui.mode;
  let h = "";
  if(ui.kxSplash){
    h = '<div class="kx-splash">' + kxIcon("target") + "<h3>RAZORBACK KX</h3><p>PRO 5 · Tianshu native</p><div class=\"kx-load\"><i></i></div><p>" + (S.inserted ? "Target acquired" : "Ready") + "</p></div>";
  } else if(!S.inserted || m === "idle"){
    h = '<div class="kx-card info">' + kxIcon("target") + "<h3>No shard loaded</h3><p>Insert a shard to start a breach.</p></div>";
  } else if(m === "map"){
    const hard = (F.auto || sh.hard) ? hardIdxLocked(sh) : -1;
    h = kxHead() + '<div class="kx-list">' + sh.sectors.map((s,i)=>kxTargetRow(s, i, {hard})).join("") + "</div>" +
      '<div class="kx-foot">Use the side buttons: Smash to attack, Recon to scout, Loadout for programs.</div>';
  } else if(m === "pick"){
    const multi = v.spread && ui.pickFor === "crack";
    const what = {crack:"Choose a target", probe:"Peek at which target?", insight:"Run Insight on which target?", bypass:"Bypass which target?", brute:"Bruteforce which target?", scrap:"Scrap which target?", len:"Measure which target?", type:"Inspect which target?", sym:"Count symbols on which target?"};
    h = '<div class="kx-head"><div><div class="kx-k">' + (multi ? "Spread shot" : "Select") + '</div><div class="kx-t">' + (multi ? "Load up to 3 targets" : what[ui.pickFor] || "Choose a target") + "</div></div></div>" +
      (multi ? '<div class="kx-foot" style="margin:0">One shot hits every loaded target for 1 ammo. Targets must share the same difficulty.</div>' : "") +
      '<div class="kx-list">' + sh.sectors.map((s,i)=>s.status === "locked" ? kxTargetRow(s, i, {badge:true, sel:multi && (ui.sel || []).includes(i)}) : "").join("") + "</div>" +
      '<div class="kx-foot">Press a target\'s number on the keypad or a side button.</div>';
  } else if(m === "crack"){
    const s = sh.sectors[ui.sec], p = s.puzzle, cfg = DIFF[p.diff], range = cfg.syms === 16 ? "0 to F" : "0 to " + HEX[cfg.syms-1];
    h = '<div class="kx-head"><div><div class="kx-k">Smashing</div><div class="kx-t">Target ' + (ui.sec+1) + "</div></div>" + '<span class="kx-chip">' + kxPips(p.diff) + "</span></div>";
    h += '<div class="kx-foot" style="margin:0">' + cfg.len + "-symbol code" + (cfg.rep ? ", repeats allowed" : ", no repeats") + " · " + sh.juice + " ammo left</div>";
    h += kxSyms(cfg, F.elim ? absentSyms(p) : []);
    let slots = ""; for(let i=0;i<cfg.len;i++) slots += '<span class="kx-slot' + (i === ui.input.length ? " cur" : "") + '">' + esc(ui.input[i] || "") + "</span>";
    h += '<div class="kx-slots">' + slots + "</div>";
    const hist = p.history.slice(-5);
    h += '<div class="kx-hist">' + (hist.length ? hist.map(x=>'<div class="kx-shot">' + kxTiles(x.g, x.r, x.pos) + (x.pos ? "" : "<span>" + kxSummary(x.r) + "</span>") + "</div>").join("") : '<div class="kx-shot">No shots fired yet. Type a code and press Submit.</div>') + "</div>";
    if(Object.keys(p.hints).length){ h += '<div class="kx-panel"><span class="kx-label">Peek</span><div class="kx-tiles">' + Array.from({length:cfg.len}, (_,i)=>'<span class="kx-tile ' + (p.hints[i] ? "hit" : "blank") + '">' + (p.hints[i] || "·") + "</span>").join("") + "</div></div>"; }
    const pr = probeCfg();
    if(pr){
      const st = probeStatus(s, p, pr);
      const charging = !st.ok && pr.unlock && CAND.count > pr.unlock;
      const prog = charging ? Math.max(0, Math.min(1, (Math.log(spaceSize(cfg)) - Math.log(CAND.count)) / (Math.log(spaceSize(cfg)) - Math.log(pr.unlock)))) : 0;
      h += '<div class="kx-panel"><span class="kx-label">Assist</span>';
      if(p.probeOut) h += '<div class="kx-tiles">' + p.probeOut.replace(/ /g, "").split("").map(c=>'<span class="kx-tile ' + (c === "_" ? "blank" : "graze") + '">' + (c === "_" ? "?" : esc(c)) + "</span>").join("") + "</div>";
      if(charging) h += '<div class="kx-bar"><i style="--p:' + prog.toFixed(2) + '"></i></div><div class="kx-foot" style="margin:0">Charging. Keep shooting to narrow things down.</div>';
      else h += '<div class="kx-foot" style="margin:0">' + (st.ok ? "Ready. Fills in half a strong shot for " + pr.cost + " ammo." : esc(st.t.replace(/^\s*\w+:\s*/, "")).replace(/^./, c=>c.toUpperCase())) + "</div>";
      h += "</div>";
    }
  } else if(m === "spread"){
    const cfg = DIFF[ui.spreadDiff], live = ui.spreadCols.filter(i=>sh.sectors[i].status === "locked");
    h = '<div class="kx-head"><div><div class="kx-k">Spread shot</div><div class="kx-t">Targets ' + ui.spreadCols.map(i=>i+1).join(", ") + '</div></div><span class="kx-chip">' + kxPips(ui.spreadDiff) + "</span></div>";
    h += '<div class="kx-foot" style="margin:0">' + cfg.len + "-symbol code · 1 ammo per shot, all targets · " + sh.juice + " left</div>";
    h += kxSyms(cfg, []);
    let slots = ""; for(let i=0;i<cfg.len;i++) slots += '<span class="kx-slot' + (i === ui.input.length ? " cur" : "") + '">' + esc(ui.input[i] || "") + "</span>";
    h += '<div class="kx-slots">' + slots + "</div>";
    h += '<div class="kx-list">' + ui.spreadCols.map(i=>kxTargetRow(sh.sectors[i], i)).join("") + "</div>";
    h += '<div class="kx-foot">Each target reports in its own window.</div>';
  } else if(m === "sniff"){
    h = kxHead() + '<div class="kx-label">Recon</div><div class="kx-list">' + scansNow().map((sc,i)=>'<div class="kx-row live"><span class="kx-badge">' + (i+1) + '</span><div><div class="n">' + (KX_SCAN[sc.k] || sc.k) + '</div></div><span class="kx-status live">' + scanCost(sc) + " ammo</span></div>").join("") + "</div>";
  } else if(m === "warez"){
    h = '<div class="kx-head"><div><div class="kx-k">Loadout</div><div class="kx-t">One-shot programs</div></div></div><div class="kx-list">' +
      WARE.map((w,i)=>'<div class="kx-row ' + (S.ware[w.k] ? "live" : "lost") + '"><span class="kx-badge">' + (i+1) + '</span><div><div class="n">' + w.label + '</div><div class="s">' + KX_WARE[w.k] + '</div></div><span class="kx-status ' + (S.ware[w.k] ? "live" : "lost") + '">×' + S.ware[w.k] + "</span></div>").join("") + "</div>";
  } else if(m === "confirm"){
    h = kxCard(ui.confirm.lines) + '<div class="kx-foot" style="text-align:center">Yes or No on the side buttons.</div>';
  } else if(m === "play"){
    const s = sh.sectors[ui.play.i], open = s.status === "open";
    h = kxHead() + '<div class="kx-label">Playback · target ' + (ui.play.i+1) + " of " + sh.sectors.length + "</div>" +
      '<div class="kx-wave' + (open ? "" : " static") + '">' + Array.from({length:22}, (_,i)=>'<i style="animation-delay:' + (i * 47 % 600) + 'ms"></i>').join("") + "</div>" +
      (open ? '<div class="kx-quote">' + esc(d.sectors[ui.play.i].text) + "</div>" : '<div class="kx-foot" style="margin:0;text-align:center">' + (s.status === "burned" ? "Lost. Only static remains." : "Still encrypted. Static only.") + "</div>");
  } else if(m === "read"){
    const rd = ui.read;
    h = kxHead() + '<div class="kx-label">Document' + (rd.focus >= 0 ? " · target " + (rd.focus+1) + " only" : "") + '</div><div class="kx-doc">' + esc(docText(d, sh, rd.focus)) + "</div>";
  } else {
    h = kxCard(ui.msg || []) || kxHead();
  }
  el.innerHTML = h;
}
// ---------- HUNTIAN 浑天: cipher analysis on an armillary sphere ----------
// glyphs: the 28 lunar mansions for letters, the 10 Heavenly Stems for digits
const tkZh = ()=>S.tkLang !== "en";
const L_ = (zh, en)=>tkZh() ? zh : en;
// Each sector is its own substitution: every letter or digit in that sector always becomes the same glyph.
const TK_ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const TK_GLYPHS = "角亢氐房心尾箕斗牛女虚危室壁奎娄胃昴毕觜参井鬼柳星张翼轸";
const TK_DIGLYPHS = "甲乙丙丁戊己庚辛壬癸";
const tkIsNum = u=>u >= "0" && u <= "9";
const TK_TAP = {"2":"ABC2","3":"DEF3","4":"GHI4","5":"JKL5","6":"MNO6","7":"PQRS7","8":"TUV8","9":"WXYZ9","0":"0","1":"1"};
const TK_FONT = '"Noto Serif SC","Noto Sans SC","PingFang SC","Microsoft YaHei",serif';
const TK = {};
function tkLayout(chars, scheme, n){
  const pts = chars.filter(c=>c.ch !== " "), N = pts.length, golden = Math.PI * (3 - Math.sqrt(5));
  pts.forEach((c,k)=>{
    const y = 1 - 2 * (k + .5) / N, r = Math.sqrt(1 - y * y);
    let lon = k * golden;
    // COMB: every nth character, so each sector becomes a twisted stripe (barber pole)
    if(scheme === "B") lon = Math.max(0, c.sec) * 2 * Math.PI / n + ((k * 7) % 5 - 2) * .07 + (1 - y) * Math.PI * 1.1;
    c.p = [Math.cos(lon) * r, y, Math.sin(lon) * r];
  });
}
function tkData(d){
  if(TK[d.id]) return TK[d.id];
  const map = d.map || buildCharMap(Object.assign({}, d, {enc:"A"}));
  const n = d.sectors.length, keys = [];
  for(let i=0;i<n;i++){
    const rnd = seeded(d.id + "/tenkyu/" + i), g = TK_GLYPHS.split("");
    for(let j=g.length-1;j>0;j--){ const k = Math.floor(rnd() * (j + 1)); [g[j], g[k]] = [g[k], g[j]]; }
    const key = {}; TK_ALPH.split("").forEach((c,j)=>key[c] = g[j]); keys.push(key);
  }
  const dr = seeded(d.id + "/tenkyu/num"), dg = TK_DIGLYPHS.split("");
  for(let j=dg.length-1;j>0;j--){ const k = Math.floor(dr() * (j + 1)); [dg[j], dg[k]] = [dg[k], dg[j]]; }
  keys.forEach(key=>{ for(let k=0;k<10;k++) key[String(k)] = dg[k]; });
  const chars = map.map(c=>{
    const u = c.ch.toUpperCase(), enc = c.sec >= 0 && TK_ALPH.includes(u);
    return {ch:c.ch, u, sec:c.sec, enc, g: enc ? keys[c.sec][u] : null};
  });
  const counts = Array.from({length:n}, ()=>({})), totals = Array(n).fill(0);
  chars.forEach(c=>{ if(c.enc){ counts[c.sec][c.u] = (counts[c.sec][c.u] || 0) + 1; totals[c.sec]++; } });
  tkLayout(chars, d.enc || "A", n);
  return TK[d.id] = {chars, keys, counts, totals};
}
let TK_DEMO = null;
function tkDemo(){
  if(TK_DEMO) return TK_DEMO;
  const chars = [];
  for(let k=0;k<130;k++) chars.push({ch:"x", u:"", sec:k % 3, enc:true, g:TK_GLYPHS[(k * 17) % TK_GLYPHS.length]});
  tkLayout(chars, "A", 3);
  return TK_DEMO = {chars};
}
const TK_ORDER = "ETAOINSHRDLCUMWFGYPBVKJXQZ";
const TK_WORDS = "THAT WITH HAVE THIS WILL YOUR FROM THEY KNOW WANT BEEN GOOD MUCH SOME TIME VERY WHEN COME HERE JUST LIKE LONG MAKE MANY MORE ONLY OVER SUCH TAKE THAN THEM WELL WERE WHAT INTO YEAR THEN ALSO BACK AFTER WORK FIRST EVEN GIVE MOST TELL CALL KEEP LAST NEED FEEL SEEM LEAVE BECOME SHOW HEAR PLAY MOVE LIVE HOLD BRING BEGIN WRITE STAND TURN START HELP TALK MIGHT SHOULD COULD WOULD THERE THEIR ABOUT WHICH OTHER THESE THOSE WHERE WHILE BEING EVERY NEVER ALWAYS OFTEN AGAIN STILL BEFORE UNDER AROUND THROUGH BETWEEN AGAINST DURING WITHOUT WITHIN BECAUSE SINCE UNTIL THOUGH THING THINGS PEOPLE PLACE RIGHT GREAT SMALL LARGE LITTLE NEXT EARLY YOUNG IMPORTANT PUBLIC SAME ABLE ANOTHER OPEN CLOSE HIGH REAL SURE KIND EACH HAND PART CASE WEEK COMPANY SYSTEM PROGRAM QUESTION GOVERNMENT NUMBER NIGHT POINT HOME WATER ROOM MOTHER AREA MONEY STORY FACT MONTH STUDY BOOK WORD BUSINESS ISSUE SIDE HEAD HOUSE SERVICE FRIEND FATHER POWER HOUR GAME LINE MEMBER CITY COMMUNITY NAME PRESIDENT TEAM MINUTE IDEA BODY INFORMATION PARENT FACE LEVEL OFFICE DOOR HEALTH PERSON HISTORY PARTY RESULT CHANGE MORNING REASON RESEARCH GIRL MOMENT TEACHER FORCE EDUCATION FOOT POLICY EVERYTHING PROCESS MUSIC MARKET SENSE NATION PLAN COLLEGE INTEREST DEATH EXPERIENCE EFFECT CLASS CONTROL CARE FIELD DEVELOPMENT ROLE EFFORT RATE HEART DRUG LEADER LIGHT VOICE WIFE POLICE MIND PRICE REPORT DECISION VIEW RELATIONSHIP TOWN ROAD DIFFERENCE VALUE BUILDING ACTION MODEL SEASON SOCIETY DIRECTOR POSITION PLAYER RECORD PAPER SPACE GROUND FORM EVENT OFFICIAL MATTER CENTER COUPLE SITE PROJECT ACTIVITY STAR TABLE COURT SITUATION COST INDUSTRY FIGURE STREET IMAGE PHONE DATA PICTURE PRACTICE PIECE LAND PRODUCT DOCTOR WALL PATIENT WORKER NEWS TEST MOVIE NORTH LOVE SUPPORT TECHNOLOGY STEP BABY COMPUTER TYPE ATTENTION FILM TREE SOURCE ORGANIZATION HAIR WINDOW EVIDENCE POPULATION SECURITY BANK NETWORK FLOOR ORDER MESSAGE PACKAGE LOCKER PIER TRUCK SHIFT GUARD CAMERA LOBBY CREW CASH BADGE GATE PASSWORD LANTERN BLUE GREEN BLACK WHITE SILVER GOLD ORANGE PURPLE YELLOW BROWN GREY GRAY DARK BRIGHT COLD WARM QUIET LOUD EMPTY FULL BROKEN DEAD ALIVE SAFE FREE CLEAN DIRTY CHEAP EXPENSIVE SECRET PRIVATE HIDDEN LOST STOLEN MISSING READY LATE FAST SLOW HARD SOFT HEAVY SIMPLE NOBODY SOMEONE ANYONE EVERYONE NOTHING SOMETHING ANYTHING NEAR BEHIND ABOVE BELOW INSIDE OUTSIDE ACROSS ALONG TOWARD UPON AMONG BEYOND TONIGHT TODAY TOMORROW YESTERDAY MIDNIGHT DAWN EVENING AFTERNOON MONDAY TUESDAY WEDNESDAY THURSDAY FRIDAY SATURDAY SUNDAY JANUARY FEBRUARY MARCH APRIL JUNE JULY AUGUST SEPTEMBER OCTOBER NOVEMBER DECEMBER THREE SEVEN EIGHT NINE ELEVEN TWELVE TWENTY THIRTY FORTY FIFTY HUNDRED THOUSAND MILLION ZERO FOUR FIVE SECOND THIRD FOURTH FIFTH HALF DOUBLE SINGLE MEET MEETING DEAL PICK DROP SEND SENT BROUGHT FOUND FIND TOLD SAID ASKED CAME LEFT WENT MADE TOOK GAVE SOLD PAID OWES OWED BOUGHT KEPT KNEW SEEN HEARD SELL SALE TRADE BUYER SELLER CLIENT CONTRACT TARGET ORDERS ROUTE COURIER DELIVERY SHIPMENT CARGO DOCK DOCKS HARBOR STATION TOWER BLOCK APARTMENT BASEMENT ROOF ALLEY BRIDGE TUNNEL OVERPASS SUBWAY TRAIN PLATFORM CANAL RIVER DISTRICT SECTOR ZONE CLINIC HOSPITAL CLUB DINER CAFE NOODLE SHOP STORE WAREHOUSE FACTORY PLANT TRIAL MEMO NOTE NOTES FILE FILES LEDGER LIST AUDIT AUDITS AUDITOR REVIEW RULES RULE WARDEN CURFEW NOTICE PERMIT LICENSE PASS CARD KEYS KEYCARD CODE CODES LOCK LOCKS DOORS VAULT SERVER TERMINAL DECK SHARD CABLE SIGNAL CHANNEL FREQUENCY RADIO PAYPHONE PHONES CALLS LISTENING WATCHING WAITING RUNNING HIDING MOVING COMING GOING LEAVING STAYING WORKING SLEEPING LOOKING TALKING RECORDING MESSAGES VOICEMAIL TAPE TAPES CONTACT CONTACTS INFORMANT FIXER RUNNER HACKER CORP CORPS CORPORATE EXECUTIVE MANAGER CHIEF CAPTAIN OFFICER AGENT GUARDS SOLDIER NURSE SUBJECT SUBJECTS RESIDENT RESIDENTS CITIZEN CITIZENS WORKERS DRIVER DRIVERS PASSENGER PASSENGERS OWNER OWNERS BOSS GANG FAMILY BROTHER SISTER FRIENDS ENEMY ENEMIES STRANGER WOMAN WOMEN CHILD CHILDREN NAMES NUMBERS ADDRESS TIMES DATE DATES HOURS MINUTES DAYS WEEKS MONTHS YEARS PLANS JOBS MISSION OPERATION SWEEP RAID ATTACK STRIKE KILL KILLED MURDER BODIES BLOOD WEAPON WEAPONS GUNS KNIFE BOMB FIRE SMOKE ALARM SIREN LIGHTS GRID STREETS ROADS MARKETS NIGHTS SHUTTERS WINDOWS WALLS STAIRS ELEVATOR UPSTAIRS DOWNSTAIRS SERUM DRUGS DOSE DOSES SAMPLE SAMPLES TESTS TRIALS RESPONSE SIGNS SYMPTOMS STRONGER WEAKER ARRIVES ARRIVE ARRIVED LEAVES DESTROY DESTROYED BURN BURNED DELETE ERASE HIDE PROTECT PROTECTED WATCH WATCHED INFORMED INFORM WARNED WARNING DANGER DANGEROUS CAREFUL QUIETLY IMMEDIATELY URGENT PRIORITY CONFIDENTIAL CLASSIFIED INTERNAL EYES SPECIAL REPEATED REPEAT POSTERITY METHOD JANITOR INDEX WHOLE ENTIRE BOTH EITHER NEITHER LEAD MOVED SETTING GOES PLUS CALLING HERSELF HIMSELF THEMSELVES ITSELF CHECKSTICKS REPORTS HEADING PURSUE SLEEPS LOOPS MARKED PROJECTED RECOMMEND UNIT UNITS COVERED PLATES".split(" ");
// free frequency analysis: the three most common unresolved glyphs get a likely letter (English order, skipping known and ruled-out letters)
function tkGuesses(i){
  const st = tkS(cur().sectors[i]), used = new Set(st.known.split("").concat((cur().tkDigits || "").split(""))), out = {}, unk = tkUnknown(i);
  const guess = (u, order)=>{ const no = (st.no && st.no[u]) || "", L = order.split("").find(c=>!used.has(c) && !no.includes(c)); if(L){ out[u] = L; used.add(L); } };
  unk.filter(u=>!tkIsNum(u)).slice(0, 3).forEach(u=>guess(u, TK_ORDER));
  unk.filter(tkIsNum).slice(0, 1).forEach(u=>guess(u, "0123456789"));
  return out;
}
// pattern help: half-solved words that only a few dictionary words can fit
function tkSuggest(){
  const sh = cur(), t = tkData(curDef()), chars = t.chars, tried = sh.tkTried || [], toks = [];
  let run = [];
  chars.forEach((c,j)=>{ if(c.enc) run.push(j); else { if(run.length) toks.push(run); run = []; } });
  if(run.length) toks.push(run);
  const seen = new Set(), out = [];
  toks.forEach(r=>{
    if(r.length < 4) return;
    const cs = r.map(j=>chars[j]);
    if(cs.some(c=>sh.sectors[c.sec].status === "burned")) return;
    const kn = cs.map(c=>tkKnown(sh.sectors[c.sec], c.u) ? c.u : null), nk = kn.filter(Boolean).length;
    if(!nk || nk === cs.length) return;
    const sig = cs.map((c,k)=>kn[k] || c.sec + ":" + c.g).join("|"); if(seen.has(sig)) return; seen.add(sig);
    const cands = TK_WORDS.filter(w=>{
      if(w.length !== cs.length || tried.includes(w)) return false;
      const m = {};
      for(let k=0;k<w.length;k++){
        const c = cs[k], L = w[k];
        if(kn[k]){ if(kn[k] !== L) return false; continue; }
        const st = tkS(sh.sectors[c.sec]);
        if(st.known.includes(L) || ((st.no && st.no[c.u]) || "").includes(L)) return false;
        const id = c.sec + ":" + c.g;
        if(m[id] && m[id] !== L) return false;
        m[id] = L;
      }
      const inv = {};
      for(const id in m){ const k2 = id.split(":")[0] + ":" + m[id]; if(inv[k2]) return false; inv[k2] = 1; }
      return true;
    });
    if(cands.length && cands.length <= 4) cands.forEach(w=>out.push({w, n:cands.length, nk, frag:cs.map((c,k)=>kn[k] || c.g).join(""), rank:TK_WORDS.indexOf(w)}));
  });
  const best = {};
  out.forEach(o=>{ if(!best[o.w] || o.n < best[o.w].n) best[o.w] = o; });
  return Object.values(best).sort((a,b)=>a.n - b.n || b.nk - a.nk || a.rank - b.rank).slice(0, 5);
}
const tkS = s=>{ if(!s.tk) s.tk = {known:"", locks:{}, no:{}}; if(!s.tk.no) s.tk.no = {}; return s.tk; };
const tkKnown = (s, u)=>s.status === "open" || tkS(s).known.includes(u) || (tkIsNum(u) && (cur().tkDigits || "").includes(u));
function tkUnknown(i){
  const t = tkData(curDef()), s = cur().sectors[i];
  return Object.keys(t.counts[i]).filter(u=>!tkKnown(s, u)).sort((a,b)=>t.counts[i][b] - t.counts[i][a] || a.localeCompare(b));
}
function tkProgress(i){
  const t = tkData(curDef()), s = cur().sectors[i];
  if(s.status === "open") return 1;
  let k = 0; t.chars.forEach(c=>{ if(c.enc && c.sec === i && tkKnown(s, c.u)) k++; });
  return t.totals[i] ? k / t.totals[i] : 1;
}
function tkKnownSet(){
  const t = tkData(curDef()), sh = cur(), set = new Set();
  t.chars.forEach((c,j)=>{ if(c.enc && tkKnown(sh.sectors[c.sec], c.u)) set.add(j); });
  return set;
}
function tkFlash(before){
  const after = tkKnownSet(); ui.tkFlash = new Set([...after].filter(j=>!before.has(j)));
  const tok = ui.tkFlash; setTimeout(()=>{ if(ui.tkFlash === tok){ ui.tkFlash = null; if(guiActive()) renderArchon(); } }, 5500);
}
// resolve symbols in a sector; returns true if that opened the sector
// digits share one table across the shard, so a solved digit can finish other sectors too. Returns the sectors that opened.
function tkResolve(i, syms){
  const sh = cur(), s = sh.sectors[i]; if(s.status !== "locked") return [];
  const st = tkS(s);
  syms.forEach(u=>{
    if(tkIsNum(u)){ if(!(sh.tkDigits || "").includes(u)) sh.tkDigits = (sh.tkDigits || "") + u; }
    else if(!st.known.includes(u)) st.known += u;
    delete st.locks[u];
  });
  const out = [];
  sh.sectors.forEach((x,k)=>{ if(x.status === "locked" && !tkUnknown(k).length){ x.status = "open"; x.puzzle = null; x.trace = false; logEvt("sec " + (k+1) + " open"); out.push(k); } });
  return out;
}
const tkOpenedText = L=>L_("扇区 " + L.map(k=>k+1).join("、") + " 已完全可读。", L.length === 1 ? "Sector " + (L[0]+1) + " is fully readable." : "Sectors " + L.map(k=>k+1).join(", ") + " are fully readable.");
const tkSummary = r=>{ const b = (r.match(/●/g) || []).length, w = (r.match(/○/g) || []).length; return tkZh() ? (!b && !w ? "未命中" : [b ? "命中 " + b : "", w ? "擦中 " + w : ""].filter(Boolean).join(" · ")) : kxSummary(r); };
function tkSyms(cfg, out){
  const all = HEX.slice(0, cfg.syms).split("");
  return '<div class="kx-syms"><span class="kx-label">' + L_("有效符号 ", "Valid symbols ") + all[0] + "\u2013" + all[all.length-1] + (out.length ? L_(" · 已排除 " + out.length, " · " + out.length + " ruled out") : "") + '</span><div class="kx-tiles">' +
    all.map(c=>'<span class="kx-tile sym' + (out.includes(c) ? " out" : "") + '">' + c + "</span>").join("") + "</div></div>";
}
// lock level: how common the glyph is in its sector (short sectors are padded to 60 so one letter isn't "common")
function tkLvl(i, u){
  const t = tkData(curDef()), share = (t.counts[i][u] || 0) / Math.max(t.totals[i], 60);
  const base = share >= .12 ? 6 : share >= .09 ? 5 : share >= .06 ? 4 : share >= .04 ? 3 : share >= .02 ? 2 : 1;
  return Math.max(1, base - S.rating);
}
function tkLockFor(i, u){
  const st = tkS(cur().sectors[i]), d = tkLvl(i, u);
  let L = st.locks[u];
  if(!L || L.diff !== d){
    const cfg = DIFF[d], pool = HEX.slice(0, cfg.syms).split(""); let code = "";
    if(cfg.rep){ for(let k=0;k<cfg.len;k++) code += pool[Math.floor(Math.random() * pool.length)]; }
    else { const q = pool.slice(); for(let k=0;k<cfg.len;k++) code += q.splice(Math.floor(Math.random() * q.length), 1)[0]; }
    L = st.locks[u] = {code, diff:d, history:[]};
  }
  return L;
}

// ---------- sounds: bells and a low drone ----------
function tkBell(freqs, gap, vol){
  const a = ac(); if(!a) return;
  freqs.forEach((f,i)=>{
    const t = a.currentTime + .01 + i * (gap || .1);
    [[1, 1], [2.76, .3], [5.4, .1]].forEach(([m, v])=>{
      const o = a.createOscillator(), g = a.createGain(); o.type = "sine"; o.frequency.value = f * m;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.045 * v * (vol || 1), t + .006);
      g.gain.exponentialRampToValueAtTime(.0001, t + 1.5 / m + .25);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 2);
    });
  });
}
function tkThud(){
  const a = ac(); if(!a) return;
  const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(70, t + .3);
  g.gain.setValueAtTime(.08, t); g.gain.exponentialRampToValueAtTime(.0001, t + .4);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .45);
}
function tkBoot(){
  const a = ac(); if(!a) return;
  const t = a.currentTime;
  [[110, -4], [110, 4], [165, 0]].forEach(([f, c])=>{
    const o = a.createOscillator(), g = a.createGain(); o.type = "sine"; o.frequency.value = f; o.detune.value = c;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.03, t + .9); g.gain.exponentialRampToValueAtTime(.0001, t + 2.6);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 2.7);
  });
  setTimeout(()=>tkBell([523, 659, 784, 1047], .2, .7), 600);
}

// ---------- sphere ----------
let tkRAF = 0, tkAng = 0, tkLast = 0;
function tkStart(){ if(!tkRAF) tkRAF = requestAnimationFrame(tkFrame); }
function tkFrame(ts){
  tkRAF = 0;
  const cv = document.getElementById("tkSphere");
  if(!cv || !cv.offsetParent){ tkLast = 0; return; }
  const dt = tkLast ? Math.min(50, ts - tkLast) : 16; tkLast = ts;
  if(!reduceMotion) tkAng += dt * (ui.kxSplash ? .0012 : .00022);
  tkDraw(cv);
  if(!reduceMotion) tkRAF = requestAnimationFrame(tkFrame); else tkLast = 0;
}
function tkHi(){
  if(ui.mode === "tkPick"){ const l = tkUnknown(ui.tkSec); return {sec:ui.tkSec, sym:l[ui.tkG % Math.max(1, l.length)]}; }
  if(ui.mode === "tkLock") return {sec:ui.tkSec, sym:ui.tkSym};
  return null;
}
function tkDraw(cv){
  const d = curDef(), sh = cur(), demo = !d || ui.kxSplash, t = demo ? tkDemo() : tkData(d);
  const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
  if(!w || !h) return;
  if(cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)){ cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const x = cv.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
  const cs = getComputedStyle(cv), V_ = n=>cs.getPropertyValue(n).trim();
  const fg = V_("--tk-fg"), muted = V_("--tk-muted"), gold = V_("--tk-gold"), line = V_("--tk-line");
  const secCol = [0,1,2,3,4].map(k=>V_("--tk-s" + k));
  const R = Math.min(w, h) * .44, cx = w / 2, cy = h / 2;
  const ca = Math.cos(tkAng), sa = Math.sin(tkAng), tilt = .35, ct = Math.cos(tilt), st = Math.sin(tilt);
  x.lineWidth = 1; x.strokeStyle = line; x.globalAlpha = .9;
  x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
  x.globalAlpha = .5; x.beginPath(); x.ellipse(cx, cy, R, R * st, 0, 0, Math.PI * 2); x.stroke();
  const hi = demo ? null : tkHi(), fl = demo ? null : ui.tkFlash;
  const items = [];
  t.chars.forEach((c,j)=>{
    if(!c.p) return;
    const [px, py, pz] = c.p, rx = px * ca + pz * sa, rz = -px * sa + pz * ca;
    items.push({j, c, X: cx + rx * R, Y: cy - (py * ct - rz * st) * R, z: py * st + rz * ct});
  });
  items.sort((a,b)=>a.z - b.z);
  const k = Math.max(.5, Math.min(1, Math.sqrt(260 / Math.max(1, items.length)))) * Math.max(.8, Math.min(1.3, R / 66));
  x.textAlign = "center"; x.textBaseline = "middle";
  items.forEach(it=>{
    const c = it.c, s = !demo && c.sec >= 0 ? sh.sectors[c.sec] : null, depth = (it.z + 1) / 2;
    let txt, col, alpha = .06 + .94 * depth * depth, size = (7 + 8 * depth) * k, glow = false;
    if(demo){ txt = c.g; col = secCol[c.sec % 5]; }
    else if(!c.enc){ txt = c.ch; col = muted; alpha *= .7; }
    else if(s.status === "burned"){ txt = "·"; col = muted; alpha *= .6; }
    else if(tkKnown(s, c.u)){ txt = c.ch.toUpperCase(); col = fg; size += 1; }
    else {
      txt = c.g; col = secCol[c.sec % 5]; alpha *= .85;
      if(hi && c.sec === hi.sec && c.u === hi.sym){ col = gold; size += 4; alpha = Math.max(alpha, .75); glow = true; }
    }
    if(fl && fl.has(it.j)){ col = gold; size += 3; glow = true; }
    x.globalAlpha = Math.min(1, alpha); x.fillStyle = col;
    x.shadowColor = glow ? col : "transparent"; x.shadowBlur = glow ? 8 : 0;
    x.font = (c.enc && s && !tkKnown(s, c.u)) || demo ? size + "px " + TK_FONT : "600 " + size + "px " + TK_FONT;
    x.fillText(txt, it.X, it.Y);
  });
  x.shadowBlur = 0; x.globalAlpha = 1;
}

// ---------- screens ----------
const tkSecCol = i=>"var(--tk-s" + (i % 5) + ")";
function tkHead(){
  const sh = cur(), d = curDef();
  return '<div class="kx-head"><div><div class="kx-k">' + L_("浑天 · 数据片 ", "HUNTIAN · shard ") + d.id + '</div><div class="kx-t">' + esc(d.name) + '</div></div><span class="kx-chip">' + (d.enc ? ENC[d.enc].name : L_("无加密", "No cipher")) + "</span></div>" +
    '<div class="kx-ammo">' + kxIcon("star") + "<b>" + sh.juice + '</b><span>' + L_("次尝试", "attempts") + '</span><div class="kx-bar"><i style="--p:' + (sh.juice / Math.max(1, sh.max)).toFixed(3) + '"></i></div></div>';
}
function tkFrag(focus, hi, opt){
  opt = opt || {};
  const d = curDef(), sh = cur(), t = tkData(d);
  return '<div class="tk-frag' + (opt.tall ? " tall" : "") + '" aria-label="Partially decrypted text">' + t.chars.map((c,j)=>{
    if(c.ch === " ") return " ";
    if(opt.only && c.sec !== focus) return "";
    const s = c.sec >= 0 ? sh.sectors[c.sec] : null, cls = [];
    if(focus != null && c.sec !== focus) cls.push("o");
    if(ui.tkFlash && ui.tkFlash.has(j)) cls.push("fl");
    if(!c.enc) return '<span class="' + cls.join(" ") + '">' + esc(c.ch) + "</span>";
    if(s.status === "burned") return '<span class="b">·</span>';
    const known = tkKnown(s, c.u);
    cls.push(known ? "k" : "u s" + (c.sec % 5));
    if(!known && hi && c.sec === hi.sec && c.u === hi.sym) cls.push("hi");
    return '<span class="' + cls.join(" ") + '">' + (known ? esc(opt.natural ? c.ch : c.ch.toUpperCase()) : c.g) + "</span>";
  }).join("").replace(/ {2,}/g, " ").trim() + "</div>";
}
function tkSecRow(s, i){
  const st = s.status === "open" ? "down" : s.status === "burned" ? "lost" : "live", t = tkData(curDef());
  const p = s.status === "burned" ? 0 : tkProgress(i), left = s.status === "locked" ? tkUnknown(i).length : 0;
  const pc = Math.round(p * 100);
  const sub = st === "down" ? (s.lvl ? L_("可读", "Readable") : L_("明文", "Plain text")) : st === "lost" ? L_("已化为杂讯", "Faded to static") : L_(pc + "% 已解 · 剩 " + left + " 个字符", pc + "% resolved · " + left + (left === 1 ? " glyph" : " glyphs") + " left");
  return '<div class="kx-row ' + st + '"><span class="tk-dot" style="--c:' + tkSecCol(i) + '"></span><div><div class="n">' + L_("扇区 ", "Sector ") + (i+1) + '</div><div class="s">' + sub + "</div>" +
    (st === "live" ? '<div class="kx-bar" style="margin-top:4px"><i style="--p:' + p.toFixed(3) + ';background:' + tkSecCol(i) + '"></i></div>' : "") +
    '</div><span class="kx-status ' + st + '">' + (st === "down" ? L_("可读", "readable") : st === "lost" ? L_("丢失", "lost") : L_("加密", "sealed")) + "</span></div>";
}
function renderTK(el){
  const m = ui.mode, d = curDef(), sh = cur(), F = feat();
  let h = "";
  if(ui.kxSplash){
    h = '<div class="kx-splash"><canvas class="tk-sphere big" id="tkSphere"></canvas><h3>' + L_("浑天", "HUNTIAN") + '</h3><p>' + L_("浑天仪 · 密码分析", "浑天 · armillary cipher analysis") + '</p><div class="kx-load"><i></i></div></div>';
  } else if(!S.inserted || m === "idle"){
    h = '<div class="kx-card info">' + kxIcon("star") + "<h3>" + L_("未插入数据片", "No shard loaded") + "</h3><p>" + L_("插入数据片，浑天将为其绘制星图。", "Insert a shard and HUNTIAN will map it.") + "</p></div>";
  } else if(m === "map"){
    h = tkHead() + '<canvas class="tk-sphere' + (tkData(d).chars.length > 400 ? " lg" : "") + '" id="tkSphere" aria-label="Sphere of encrypted glyphs"></canvas><div class="kx-list">' + sh.sectors.map(tkSecRow).join("") + "</div>" +
      '<div class="kx-foot">' + (lockedIdx(sh).length ? L_("锁定一个字符以得知其字母；若能猜出单词，就试试猜词。", "Lock a glyph to learn its letter, or test a crib if you can guess a word.") : L_("所有扇区均可读。", "Every sector is readable.")) + "</div>";
  } else if(m === "tkPick"){
    const i = ui.tkSec, list = tkUnknown(i), u = list[ui.tkG % list.length], t = tkData(d), n = t.counts[i][u], lv = tkLvl(i, u), gs = tkGuesses(i), st = tkS(sh.sectors[i]);
    const no = st.no[u] || "", busy = !!st.locks[u];
    h = '<div class="kx-head"><div><div class="kx-k">' + L_("锁定字符", "Lock a glyph") + '</div><div class="kx-t">' + L_("扇区 ", "Sector ") + (i+1) + '</div></div><span class="kx-chip">' + list.length + L_(" 未解", " unresolved") + "</span></div>" +
      '<canvas class="tk-sphere sm" id="tkSphere"></canvas>' +
      '<div class="tk-glyph"><span class="big">' + t.keys[i][u] + '</span><div><div class="kx-t" style="font-size:15px">' + L_("出现 " + n + " 次", "Appears " + n + (n === 1 ? " time" : " times")) + '</div><div class="kx-foot" style="margin:0">' + kxPips(lv) + L_("锁难度 ", "lock level ") + lv + (busy ? L_(" · 进行中", " · in progress") : "") + "</div>" +
        (gs[u] ? '<div class="kx-foot" style="margin:0;color:var(--tk-gold)">' + L_("频率推测：可能是 ", "Frequency guess: probably ") + gs[u] + "</div>" : no ? '<div class="kx-foot" style="margin:0">' + L_("已排除：", "Ruled out: ") + no.split("").join(", ") + "</div>" : "") + "</div></div>" +
      '<div class="tk-freq" aria-label="Unresolved glyphs by frequency">' + list.map((g,k)=>'<span class="' + (k === ui.tkG % list.length ? "sel" : "") + '" style="--n:' + t.counts[i][g] + '"><i></i>' + t.keys[i][g] + (gs[g] ? '<em>' + gs[g] + "?</em>" : "") + "</span>").join("") + "</div>" +
      tkFrag(i, {sec:i, sym:u}) +
      '<div class="kx-foot">' + L_("开锁消耗 1 次尝试，锁内猜测免费。频率推测猜对免费，猜错消耗 1 次。", "Opening a lock costs 1 attempt and every guess inside it is free. Testing a frequency guess is free if right, 1 attempt if wrong.") + "</div>";
  } else if(m === "tkLock"){
    const i = ui.tkSec, u = ui.tkSym, L = tkLockFor(i, u), cfg = DIFF[L.diff], t = tkData(d), n = t.counts[i][u];
    h = '<div class="kx-head"><div class="tk-glyph"><span class="big" style="width:44px;height:44px;font-size:26px">' + t.keys[i][u] + '</span><div><div class="kx-k">' + L_("扇区 " + (i+1) + " · " + n + " 处", "Sector " + (i+1) + " · " + n + (n === 1 ? " spot" : " spots")) + '</div><div class="kx-t">' + L_("字符锁", "Glyph lock") + '</div></div></div><span class="kx-chip">' + kxPips(L.diff) + "</span></div>";
    h += '<div class="kx-foot" style="margin:0">' + L_(cfg.len + " 位密码" + (cfg.rep ? "，可重复" : "，不重复") + " · 猜测免费", cfg.len + "-symbol code" + (cfg.rep ? ", repeats allowed" : ", no repeats") + " · guesses are free") + "</div>";
    h += tkSyms(cfg, tkCand(i, u, L).out);
    let slots = ""; for(let k=0;k<cfg.len;k++) slots += '<span class="kx-slot' + (k === ui.input.length ? " cur" : "") + '">' + esc(ui.input[k] || "") + "</span>";
    h += '<div class="kx-slots">' + slots + "</div>";
    const cd = tkCand(i, u, L), prog = cd.count <= 1 ? 1 : Math.max(0, 1 - Math.log(cd.count) / Math.log(cd.total));
    h += '<div class="kx-panel"><div class="tk-cand"><span class="kx-label">' + L_("候选", "Candidates") + '</span><b>' + cd.count.toLocaleString("en-US") + '</b><span>' + (cd.count === 1 ? L_("已找到密码，按提交", "code found, press Submit") : L_("种可能的密码", "possible codes")) + '</span></div><div class="kx-bar"><i style="--p:' + prog.toFixed(3) + '"></i></div></div>';
    const hist = L.history.slice(-5);
    h += '<div class="kx-hist">' + (hist.length ? hist.map(x=>'<div class="kx-shot">' + kxTiles(x.g, x.r, x.pos) + (x.pos ? "" : "<span>" + tkSummary(x.r) + "</span>") + "</div>").join("") : '<div class="kx-shot">' + L_("尚未猜测。输入密码后按提交。", "No guesses yet. Type a code and press Submit.") + "</div>") + "</div>";
  } else if(m === "tkCrib"){
    const tap = ui.tkTap && Date.now() - ui.tkTap.t < 1000;
    let word = ""; for(let k=0;k<Math.max(4, ui.input.length + 1) && k < 14;k++) word += '<span class="kx-slot' + (tap && k === ui.input.length - 1 ? " tap" : k === ui.input.length ? " cur" : "") + '">' + esc(ui.input[k] || "") + "</span>";
    h = '<div class="kx-head"><div><div class="kx-k">' + L_("猜词攻击 · " + sh.juice + " 次尝试", "Crib attack · " + sh.juice + " attempts") + '</div><div class="kx-t">' + L_("猜一个此数据片中的单词", "Guess a word in this shard") + "</div></div></div>" +
      tkFrag(null, null) + '<div class="tk-word">' + word + "</div>" +
      (ui.tkSug ? '<div class="kx-label">' + L_("建议 · 用侧键选择", "Suggestions · pick one on the side keys") + '</div><div class="tk-sug">' + ui.tkSug.map(o=>"<div><b>" + o.w + "</b><span>" + esc(o.frag) + (o.n > 1 ? L_(" · " + o.n + " 选 1", " · 1 of " + o.n) : L_(" · 唯一匹配", " · only match")) + "</span></div>").join("") + "</div>" :
      '<div class="tk-legend">' + ["2","3","4","5","6","7","8","9"].map(k=>"<span><b>" + k + "</b>" + TK_TAP[k].slice(0, -1) + "</span>").join("") + "</div>") +
      '<div class="kx-foot">' + L_("再按同一键切换字母。至少 4 个字符。猜错消耗 1 次尝试，猜对免费。", "Press a key again to cycle letters. 4 or more characters. A wrong crib uses 1 attempt, a right one is free.") + "</div>";
  } else if(m === "msg" && ui.tkCard){
    const c = ui.tkCard;
    h = '<div class="kx-card good">' + (c.glyph ? '<div class="tk-reveal"><span class="tk-glyph"><span class="big">' + c.glyph + '</span></span><span class="arrow">→</span><span class="tk-glyph"><span class="big res">' + esc(c.letter) + "</span></span></div>" : kxIcon(c.icon || "star")) +
      "<h3>" + esc(c.title) + "</h3>" + c.lines.map(t=>"<p>" + esc(t) + "</p>").join("") + "</div>";
  } else if(m === "read"){
    const rd = ui.read;
    const solved = sh.sectors.every(x=>x.status !== "locked");
    h = tkHead() + '<div class="kx-label">' + L_("文档", "Document") + (rd.focus >= 0 ? L_(" · 扇区 ", " · sector ") + (rd.focus+1) : "") + (solved ? "" : L_(" · 部分解码", " · partly decoded")) + "</div>" + tkFrag(rd.focus >= 0 ? rd.focus : null, null, {tall:true, only:rd.focus >= 0}) +
      (solved ? "" : '<div class="kx-foot">' + L_("星宿字符是浑天尚未解出的字母。按扇区编号聚焦，按 0 查看全部。", "Glyphs are letters HUNTIAN hasn't resolved yet. Press a sector number to focus on it, 0 for all.") + "</div>");
  } else if(m === "play"){
    const s = sh.sectors[ui.play.i], open = s.status === "open";
    h = tkHead() + '<div class="kx-label">' + L_("回放 · 扇区 " + (ui.play.i+1) + " / " + sh.sectors.length, "Playback · sector " + (ui.play.i+1) + " of " + sh.sectors.length) + "</div>" +
      '<div class="kx-wave' + (open ? "" : " static") + '">' + Array.from({length:22}, (_,k)=>'<i style="animation-delay:' + (k * 47 % 600) + 'ms"></i>').join("") + "</div>" +
      (open ? '<div class="kx-quote">' + esc(d.sectors[ui.play.i].text) + "</div>" : s.status === "burned" ? '<div class="kx-foot" style="margin:0;text-align:center">' + L_("丢失。只剩杂讯。", "Lost. Only static remains.") + "</div>" :
        tkFrag(ui.play.i, null, {only:true}) + '<div class="kx-foot" style="margin:0">' + L_("部分解码的文字记录。扇区解开前音频仍为杂讯。", "Partly decoded transcript. The audio stays static until the sector opens.") + "</div>");
  } else return false;
  el.innerHTML = h;
  tkStart();
  return true;
}

// ---------- input ----------
function tkSoft(){
  const m = ui.mode, d = curDef(), sh = cur(), K = (label, keys, fn)=>({label, keys, fn});
  const langKey = K(L_("EN", "中文"), null, ()=>{ S.tkLang = tkZh() ? "en" : "zh"; save(); tkBell([880], 0, .4); render(); });
  if(m === "map") return [K(L_("锁定", "LOCK"), ["1"]), K(L_("猜词", "CRIB"), ["2"]), K(d.kind === "text" ? L_("阅读", "READ") : L_("播放", "PLAY"), ["4"]), langKey, K(L_("弹出", "EJECT"), ["*"])];
  if(m === "tkPick"){
    const gu = tkGuesses(ui.tkSec)[tkUnknown(ui.tkSec)[ui.tkG % Math.max(1, tkUnknown(ui.tkSec).length)]];
    const out = [K(L_("开锁", "LOCK IT"), ["#"]), K(L_("下个 ▸", "NEXT ▸"), ["6"]), K(L_("◂ 上个", "◂ PREV"), ["4"])];
    if(gu) out.push(K(L_("试 ", "TRY ") + gu, ["1"]));
    if(lockedIdx(sh).length > 1) out.push(K(L_("扇区 ▸", "SECTOR ▸"), ["2"]));
    return out.concat([K(L_("返回", "BACK"), ["*"])]);
  }
  if(m === "tkLock") return [K(L_("提交", "SUBMIT"), ["#"]), K(ui.input ? L_("删除", "DELETE") : L_("返回", "BACK"), ["*"])];
  if(m === "tkCrib"){
    if(ui.tkSug) return ui.tkSug.map(o=>K(o.w.length > 8 ? o.w.slice(0, 7) + "…" : o.w, null, ()=>{ ui.input = o.w; ui.tkSug = null; ui.tkTap = null; render(); })).concat([K(L_("返回", "BACK"), null, ()=>{ ui.tkSug = null; render(); })]);
    return [K(L_("测试", "TEST"), ["#"]), K(ui.input ? L_("删除", "DELETE") : L_("返回", "BACK"), ["*"]), K(L_("清空", "CLEAR"), null, ()=>{ ui.input = ""; ui.tkTap = null; render(); }),
      K(L_("建议", "SUGGEST"), null, ()=>{ const l = tkSuggest(); if(!l.length){ errBeep(); flash([L_("暂无建议", "No suggestions yet"), L_("先多解出几个字母。", "Resolve a few more letters first.")]); return; } ui.tkSug = l; tkBell([988], 0, .4); render(); })];
  }
  return null;
}
function tkEnterPick(){
  const L = lockedIdx(cur());
  if(!L.length){ errBeep(); return; }
  if(!L.includes(ui.tkSec)) ui.tkSec = L[0];
  ui.tkG = 0; ui.mode = "tkPick"; render();
}
function tkPress(k){
  const m = ui.mode, sh = cur();
  if(m === "map"){
    if(k === "1"){ tkEnterPick(); return true; }
    if(k === "2"){ if(!lockedIdx(sh).length){ errBeep(); return true; } ui.mode = "tkCrib"; ui.input = ""; ui.tkTap = null; render(); return true; }
    if(k === "3"){ errBeep(); return true; }
    return false;
  }
  if(m === "tkPick"){
    const n = tkUnknown(ui.tkSec).length;
    if(k === "*"){ toMap(); return true; }
    if(k === "6"){ ui.tkG = (ui.tkG + 1) % n; render(); return true; }
    if(k === "4"){ ui.tkG = (ui.tkG - 1 + n) % n; render(); return true; }
    if(k === "2"){ const L = lockedIdx(sh); if(L.length < 2){ errBeep(); return true; } ui.tkSec = L[(L.indexOf(ui.tkSec) + 1) % L.length]; ui.tkG = 0; render(); return true; }
    if(k === "#"){
      const u = tkUnknown(ui.tkSec)[ui.tkG % n], st = tkS(sh.sectors[ui.tkSec]);
      if(!st.locks[u]){
        if(sh.juice < 1){ errBeep(); return true; }
        sh.juice--; logEvt("open lock"); heatUp(.6);
      }
      ui.tkSym = u; tkLockFor(ui.tkSec, u); save(); ui.input = ""; ui.mode = "tkLock"; render(); return true;
    }
    if(k === "1"){ tkTryGuess(); return true; }
    return true;
  }
  if(m === "tkLock"){
    const cfg = DIFF[tkLockFor(ui.tkSec, ui.tkSym).diff];
    if(k === "*"){ if(ui.input){ ui.input = ui.input.slice(0, -1); render(); } else if(sh.juice <= 0){ checkDry(); } else { ui.mode = "tkPick"; render(); } return true; }
    if(k === "#"){ tkSubmitLock(); return true; }
    const v = HEX.indexOf(k);
    if(v < 0 || v >= cfg.syms || ui.input.length >= cfg.len){ errBeep(); return true; }
    ui.input += k; render(); return true;
  }
  if(m === "tkCrib"){
    if(ui.tkSug){ if(k === "*"){ ui.tkSug = null; render(); return true; } ui.tkSug = null; }
    if(TK_TAP[k]){ tkTap(k); return true; }
    if(k === "*"){ if(ui.input){ ui.input = ui.input.slice(0, -1); ui.tkTap = null; render(); } else toMap(); return true; }
    if(k === "#"){ tkTestCrib(); return true; }
    errBeep(); return true;
  }
  return false;
}
function tkTap(k){
  const now = Date.now(), set = TK_TAP[k], t = ui.tkTap;
  if(t && t.key === k && now - t.t < 1000 && ui.input.length){
    t.i = (t.i + 1) % set.length; t.t = now; ui.input = ui.input.slice(0, -1) + set[t.i];
  } else {
    if(ui.input.length >= 14){ errBeep(); return; }
    ui.tkTap = {key:k, i:0, t:now}; ui.input += set[0];
  }
  render();
  setTimeout(()=>{ if(ui.mode === "tkCrib" && ui.tkTap && Date.now() - ui.tkTap.t >= 1000){ ui.tkTap = null; render(); } }, 1050);
}
function tkType(c){
  pressFx(""); kxClick(1);
  if(ui.input.length >= 14){ errBeep(); return; }
  ui.tkTap = null; ui.input += c; render();
}
function tkAfter(next){ return ()=>{ ui.tkCard = null; if(cur().juice <= 0 && lockedIdx(cur()).length){ checkDry(); return; } next(); }; }
function tkTryGuess(){
  const sh = cur(), i = ui.tkSec, list = tkUnknown(i), u = list[ui.tkG % list.length], L = tkGuesses(i)[u];
  if(!L){ errBeep(); return; }
  const t = tkData(curDef()), glyph = t.keys[i][u], st = tkS(sh.sectors[i]);
  if(L === u){
    const n = t.counts[i][u], before = tkKnownSet(), openedL = tkResolve(i, [u]), opened = openedL.length > 0; save(); tkFlash(before);
    tkBell(opened ? [659, 880, 1175, 1568] : [880, 1319], .12);
    ui.tkCard = {glyph, letter:u, title:L_("猜对了：" + glyph + " 即 " + u, "Good guess: " + glyph + " is " + u), lines:[opened ? tkOpenedText(openedL) : L_("解出 " + n + " 个字符，未消耗尝试。", n + (n === 1 ? " character" : " characters") + " resolved, no attempt used.")]};
    showMsg([""], 2300, tkAfter(()=>{ if(!openedL.includes(i) && tkUnknown(i).length){ ui.tkG = 0; ui.mode = "tkPick"; render(); } else toMap(); }));
    return;
  }
  sh.juice--; st.no[u] = (st.no[u] || "") + L; save(); tkThud();
  ui.tkCard = {icon:"lost", title:glyph + L_(" 不是 ", " is not ") + L, lines:[L_("消耗 1 次尝试。频率推测顺延到下一个字母。", "1 attempt used. The frequency guess moves on.")]};
  showMsg([""], 1900, tkAfter(()=>{ ui.mode = "tkPick"; render(); }));
}
// candidate codes still consistent with a lock's history
let TK_CAND = {key:null};
function tkCand(i, u, L){
  const cfg = DIFF[L.diff], key = S.inserted + "|" + i + "|" + u + "|" + L.code + "|" + L.diff + "|" + L.history.length;
  if(TK_CAND.key === key) return TK_CAND;
  if(!L.history.length) return TK_CAND = {key, count:spaceSize(cfg), list:null, total:spaceSize(cfg), out:[]};
  const real = packStr(L.code), cons = L.history.map(h=>{ const g = packStr(h.g); return {g, pos:h.pos, k:fb(real, g, cfg.len, h.pos)}; });
  const list = enumerate(cfg, cons);
  let mask = 0;
  for(let k=0;k<list.length && mask !== 0xFFFF;k++){ const n = list[k]; for(let q=0;q<cfg.len;q++) mask |= 1 << ((n >>> (4*q)) & 15); }
  const out = HEX.slice(0, cfg.syms).split("").filter((c,k)=>!((mask >> k) & 1));
  return TK_CAND = {key, count:list.length, list:list.length <= 1 ? list : null, total:spaceSize(cfg), out};
}
function tkSubmitLock(){
  const sh = cur(), i = ui.tkSec, u = ui.tkSym, L = tkLockFor(i, u), cfg = DIFF[L.diff], g = ui.input, F = feat();
  if(g.length !== cfg.len){ errBeep(); flash([L_("需要 " + cfg.len + " 位", "Need " + cfg.len + " symbols"), L_("未消耗尝试。", "No attempt used.")]); return; }
  if(!cfg.rep && new Set(g).size !== g.length){ errBeep(); flash([L_("此锁不允许重复", "No repeats on this lock"), L_("未消耗尝试。", "No attempt used.")]); return; }
  const pos = !!(cfg.pos || F.analyzer), r = score(L.code, g, pos);
  L.history.push({g, r, pos}); ui.input = ""; logEvt("lock " + g); heatUp(.7);
  const auto = false;
  if(g === L.code || auto){
    const t = tkData(curDef()), glyph = t.keys[i][u], n = t.counts[i][u], before = tkKnownSet();
    const openedL = tkResolve(i, [u]), opened = openedL.length > 0; save(); tkFlash(before);
    tkBell(opened ? [659, 880, 1175, 1568] : [880, 1319], .12);
    ui.tkCard = {glyph, letter:u, title:glyph + L_(" 即 ", " is ") + u, lines:[opened ? tkOpenedText(openedL) : L_("扇区 " + (i+1) + " 中解出 " + n + " 个字符。", n + (n === 1 ? " character" : " characters") + " resolved in sector " + (i+1) + ".")]};
    showMsg([""], auto ? 3000 : 2300, tkAfter(()=>{ if(!openedL.includes(i) && tkUnknown(i).length){ ui.tkG = 0; ui.mode = "tkPick"; render(); } else toMap(); }));
    return;
  }
  tkBell([r.includes("●") ? 740 : 494], 0, .5);
  // one code left: fill it in and wait for the player to submit
  const cd = tkCand(i, u, L);
  if(cd.count === 1 && cd.list && cd.list.length){ ui.input = unpack(cd.list[0], cfg.len); setTimeout(()=>tkBell([1175, 1568], .08, .6), 250); }
  save(); render();
}
function tkTestCrib(){
  const sh = cur(), w = ui.input; ui.tkTap = null;
  if(w.length < 4){ errBeep(); flash([L_("猜词至少需要 4 个字符", "Cribs need 4 or more characters"), L_("未消耗尝试。", "No attempt used.")]); return; }
  const t = tkData(curDef()), chars = t.chars, hits = [];
  let run = [];
  const flush = ()=>{ if(run.length === w.length && run.map(j=>chars[j].u).join("") === w) hits.push(run.slice()); run = []; };
  chars.forEach((c,j)=>{ if(TK_ALPH.includes(c.u) && c.u !== "") run.push(j); else flush(); });
  flush();
  ui.input = ""; logEvt("crib " + w.slice(0, 12)); heatUp(.5);
  sh.tkTried = (sh.tkTried || []).concat([w]);
  if(!hits.length){
    sh.juice--; save(); tkThud();
    ui.tkCard = {icon:"lost", title:L_("未找到 " + w, "No match for " + w), lines:[L_("此数据片中没有这个词。消耗 1 次尝试。", "It isn't in this shard. 1 attempt used.")]};
    showMsg([""], 1900, tkAfter(()=>{ ui.mode = "tkCrib"; render(); }));
    return;
  }
  const before = tkKnownSet(), bySec = {};
  hits.forEach(run=>run.forEach(j=>{ const c = chars[j]; if(c.enc) (bySec[c.sec] = bySec[c.sec] || new Set()).add(c.u); }));
  const opened = [];
  Object.keys(bySec).forEach(k=>{ tkResolve(+k, [...bySec[k]]).forEach(x=>{ if(!opened.includes(x+1)) opened.push(x+1); }); });
  save(); tkFlash(before);
  const fresh = ui.tkFlash.size, secs = Object.keys(bySec).map(k=>+k + 1);
  tkBell(fresh ? [784, 988, 1175] : [784], .09);
  const where = (secs.length === 1 ? "sector " : "sectors ") + secs.join(", ");
  ui.tkCard = {icon:"down", title:L_("找到 " + w, "Found " + w), lines:[L_((hits.length > 1 ? "出现 " + hits.length + " 次，" : "") + "位于扇区 " + secs.join("、") + "。", (hits.length > 1 ? hits.length + " times, in " : "In ") + where + "."),
    fresh ? L_("解出 " + fresh + " 个字符。", fresh + (fresh === 1 ? " character" : " characters") + " resolved.") : L_("没有新内容，但未消耗尝试。", "Nothing new, but no attempt used."),
    opened.length ? tkOpenedText(opened.map(x=>x-1)) : ""].filter(Boolean)};
  showMsg([""], 2600, tkAfter(()=>{ if(lockedIdx(sh).length){ ui.mode = "tkCrib"; render(); } else toMap(); }));
}

// ---------- ORACLE//ZERO r10: Kestrel's Xuanji OS build ----------
const OR_BIRD = '<svg class="or-bird" viewBox="0 0 120 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
  '<path pathLength="100" d="M6 12 L30 26 L46 28 L54 22"/><path pathLength="100" d="M114 12 L90 26 L74 28 L66 22"/>' +
  '<path pathLength="100" d="M14 22 L34 33 L48 33"/><path pathLength="100" d="M106 22 L86 33 L72 33"/>' +
  '<path pathLength="100" d="M24 32 L40 39 L50 37"/><path pathLength="100" d="M96 32 L80 39 L70 37"/>' +
  '<path pathLength="100" d="M54 22 Q60 14 66 22 Q68 34 60 42 Q52 34 54 22 Z"/>' +
  '<path pathLength="100" d="M57 41 L54 58 L60 54 L66 58 L63 41"/><path pathLength="100" d="M62 19 L66 21 L62 22"/></g>' +
  '<circle class="or-eye" cx="61" cy="20" r="1.4" fill="currentColor"/></svg>';
const OR_CHECKS = [
  ["Candidate engine", "ok", "Online", 700],
  ["Residue scrubber", "ok", "Online", 700],
  ["Decision model", "ok", "Online", 700],
  ["Licence check", "bad", "Licence revoked · asset 44-0917", 1800],
  ["Field override", "warn", "Field mode engaged", 1200]
];
function orBoot(){
  const b = ui.orBoot = {view:"dark", done:[], run:null};
  const steps = [];
  steps.push({ms:450, f:()=>{ b.view = "dark"; lowSweep(48, 96, 2.6, .09); }});
  steps.push({ms:1700, f:()=>{ b.view = "bird"; }});
  steps.push({ms:2400, f:()=>{ b.view = "brand"; lowHit(98, 1.4, .08); }});
  steps.push({ms:900, f:()=>{ b.view = "head"; }});
  OR_CHECKS.forEach(([label, kind, res, hold])=>{
    steps.push({ms:950, f:()=>{ b.view = "head"; b.run = label; }});
    steps.push({ms:hold, f:()=>{
      b.run = null; b.done.push([label, kind, res]);
      if(kind === "bad") lowHit(73, .5, .07); else if(kind === "warn") lowHit(98, .35, .05); else lowHit(110, .12, .03);
    }});
  });
  steps.push({ms:2000, f:()=>{ b.view = "final"; }});
  let k = 0;
  const step = ()=>{ const s = steps[k++]; s.f(); render(); later(s.ms, k < steps.length ? step : ()=>{ ui.orBoot = null; toHome(); }); };
  ui.mode = "msg"; ui.msg = [""];
  step();
}
function orIdent(id){
  ui.mode = "msg"; ui.msg = [""]; ui.orCard = {id, phase:0}; render();
  later(1100, ()=>{
    const e = defOf(id).enc ? ENC[defOf(id).enc] : null;
    ui.orCard.phase = 1; lowHit(e && e.native ? 98 : 73, .5, .05); render();
    later(2600, ()=>{ ui.orCard = null; toMap(); });
  });
}
const orPad = i=>String(i).padStart(2, "0");
function orEst(s){
  const d = diffOf(s), e = EST[d];
  if(e === undefined){ queueEst(d); return null; }
  const done = s.puzzle && s.puzzle.diff === d ? s.puzzle.history.length : 0;
  return Math.max(1, e - done);
}
function orHead(sub){
  const sh = cur(), d = curDef(), b = twGet("budget" + S.inserted, sh.juice);
  return '<div class="or-banner">KESTREL INTERNAL <span>// NFD</span></div>' +
    '<div class="kx-head"><div><div class="kx-k">' + (sub || "Shard " + d.id) + '</div><div class="kx-t">' + esc(d.name) + '</div></div>' +
    '<div class="or-budget"><b>' + b + '</b><span>budget</span></div></div>' +
    '<div class="kx-bar or-bbar"><i style="--p:' + (sh.juice / Math.max(1, sh.max)).toFixed(3) + '"></i></div>';
}
function orCipher(){
  const d = curDef(), e = d.enc ? ENC[d.enc] : null;
  if(!e) return '<div class="or-cipher"><span class="or-dot"></span><div><b>No cipher</b><span>Plain media</span></div></div>';
  return '<div class="or-cipher' + (e.native ? " native" : "") + '"><span class="or-dot"></span><div><b>' + e.real + "</b><span>" + e.org + " · " + (e.native ? "native format" : "foreign cipher") + '</span></div><span class="kx-chip">confidence ' + e.conf + "</span></div>";
}
function orRow(s, i, opts){
  const d = curDef(), st = s.status === "open" ? "down" : s.status === "burned" ? "lost" : "live";
  const tag = typeTag(s, d.sectors[i], s.status === "open"), tagT = tag === "?????" ? "" : tag.toLowerCase();
  let sub;
  if(st === "down") sub = s.lvl ? "Declassified" + (tagT ? " · " + tagT : "") : "Plain";
  else if(st === "lost") sub = "Purged";
  else { const e = orEst(s); sub = kxPips(diffOf(s)) + (e == null ? "estimating…" : "~" + (e >= 10 ? Math.round(e) : e.toFixed(1)) + " attempts") + (tagT ? " · " + tagT : ""); }
  return '<div class="kx-row ' + st + (opts && opts.sel ? " sel" : "") + '"><span class="kx-badge">' + orPad(i+1) + '</span><div><div class="n">Block ' + orPad(i+1) + '</div><div class="s">' + sub + '</div></div><span class="kx-status ' + st + '">' + (st === "down" ? "clear" : st === "lost" ? "purged" : "sealed") + "</span></div>";
}
const OR_SCAN = {len:"Code length of a block", type:"Contents of a block", hard:"Hardest sealed block", sym:"Symbols used by a block", all:"Difficulty of every block", map:"Full survey", tags:"Tag every block"};
const OR_WARE = {probe:"Reveal one symbol and its position", bypass:"Open an easy block (difficulty 3 or less) for 2 budget", brute:"Open any block now; the rest get harder", scrap:"Purge a block into extra budget", reset:"Restore this shard's budget", insight:"One sharp, full suggestion"};
function renderOR(el){
  const m = ui.mode, d = curDef(), sh = cur(), F = feat(), b = ui.orBoot;
  let h = "";
  if(b){
    if(b.view === "dark") h = '<div class="or-boot"><span class="or-cursor">_</span></div>';
    else if(b.view === "bird" || b.view === "brand") h = '<div class="or-boot' + (b.view === "brand" ? " drawn" : "") + '">' + OR_BIRD + (b.view === "brand" ? '<div class="or-brand">KESTREL DATASYSTEMS</div><div class="or-motto">we remember.</div>' : "") + "</div>";
    else {
      h = '<div class="or-banner">KESTREL INTERNAL <span>// NFD</span></div><div class="or-title">' + OR_BIRD + '<div><div class="kx-t">ORACLE//ZERO r10</div><div class="kx-k">Counter-intrusion · Xuanji OS native</div></div></div><div class="or-checks">' +
        b.done.map(([l, k, r])=>'<div class="or-check ' + k + '"><span class="or-ic">' + (k === "ok" ? "✓" : k === "bad" ? "!" : "»") + "</span><div><b>" + l + "</b><span>" + r + "</span></div></div>").join("") +
        (b.run ? '<div class="or-check run"><span class="or-ic"></span><div><b>' + b.run + '</b><div class="or-prog"><i></i></div></div></div>' : "") + "</div>" +
        (b.view === "final" ? '<div class="kx-foot or-ready">' + (S.inserted ? "Media mounted. Analysis ready." : "Awaiting media.") + "</div>" : "");
    }
  } else if(m === "msg" && ui.orCard){
    const c = ui.orCard, dd = defOf(c.id), e = dd.enc ? ENC[dd.enc] : null;
    h = '<div class="or-banner">KESTREL INTERNAL <span>// NFD</span></div><div class="kx-head"><div><div class="kx-k">Shard ' + c.id + ' mounted</div><div class="kx-t">' + esc(dd.name) + "</div></div></div>";
    if(!c.phase) h += '<div class="kx-panel"><span class="kx-label">Identifying cipher</span><div class="or-prog long"><i></i></div></div>';
    else h += e ? '<div class="kx-panel"><span class="kx-label">Cipher identified</span>' + '<div class="or-cipher' + (e.native ? " native" : "") + '"><span class="or-dot"></span><div><b>' + e.real + "</b><span>" + e.org + '</span></div></div><div class="kx-foot" style="margin:0">' + (e.native ? "Native format" : "Foreign cipher") + ". Confidence " + e.conf + ".</div></div>"
      : '<div class="kx-panel"><span class="kx-label">No cipher detected</span><div class="kx-foot" style="margin:0">Plain media.</div></div>';
  } else if(!S.inserted || m === "idle"){
    h = '<div class="or-banner">KESTREL INTERNAL <span>// NFD</span></div><div class="kx-card info or-idle">' + OR_BIRD + "<h3>Awaiting media</h3><p>Insert a shard to begin analysis.</p></div>";
  } else if(m === "map"){
    h = orHead() + orCipher() + '<div class="kx-list">' + sh.sectors.map((s,i)=>orRow(s, i)).join("") + "</div>" +
      '<div class="kx-foot">Estimates from self-play. Zero residue on every block.</div>';
  } else if(m === "pick"){
    const what = {crack:"Solve which block?", probe:"Peek at which block?", insight:"Run Insight on which block?", bypass:"Bypass which block?", brute:"Bruteforce which block?", scrap:"Scrap which block?", len:"Measure which block?", type:"Inspect which block?", sym:"Count symbols in which block?"};
    h = orHead("Select") + '<div class="kx-t" style="font-size:15px">' + (what[ui.pickFor] || "Choose a block") + '</div><div class="kx-list">' + sh.sectors.map((s,i)=>s.status === "locked" ? orRow(s, i) : "").join("") + "</div>";
  } else if(m === "crack"){
    const s = sh.sectors[ui.sec], p = s.puzzle, cfg = DIFF[p.diff];
    h = orHead("Solving · block " + orPad(ui.sec+1));
    h += '<div class="kx-foot" style="margin:0">' + cfg.len + "-symbol code" + (cfg.rep ? ", repeats allowed" : ", no repeats") + " · difficulty " + p.diff + "</div>";
    h += kxSyms(cfg, F.elim ? absentSyms(p) : []);
    const busy = CAND.busy || CAND.key !== candKey(), lock = !busy && CAND.count === 1;
    const c = busy ? null : twGet("cand|" + CAND.key, CAND.count), tot = spaceSize(cfg);
    const prog = busy ? 0 : CAND.count <= 1 ? 1 : Math.max(0, 1 - Math.log(CAND.count) / Math.log(tot));
    h += '<div class="kx-panel or-cand' + (lock ? " lock" : "") + '"><div class="tk-cand"><span class="kx-label">Candidates</span><b>' + (busy ? "…" : c.toLocaleString("en-US")) + "</b><span>" + (lock ? "locked on · press Submit" : "possible codes") + '</span></div><div class="kx-bar"><i style="--p:' + prog.toFixed(3) + '"></i></div></div>';
    let slots = ""; for(let k=0;k<cfg.len;k++) slots += '<span class="kx-slot' + (k === ui.input.length ? " cur" : "") + '">' + esc(ui.input[k] || "") + "</span>";
    h += '<div class="kx-slots">' + slots + "</div>";
    const pr = probeCfg();
    if(pr || p.probeOut){
      h += '<div class="kx-panel"><span class="kx-label">' + (p.probeIns ? "Insight" : "Solver") + "</span>";
      if(p.probeOut) h += '<div class="kx-tiles">' + p.probeOut.replace(/ /g, "").split("").map(ch=>'<span class="kx-tile ' + (ch === "_" ? "blank" : "graze") + '">' + (ch === "_" ? "?" : esc(ch)) + "</span>").join("") + "</div>";
      if(pr){ const st = probeStatus(s, p, pr); h += '<div class="kx-foot" style="margin:0">' + (st.ok ? "Ready. A full suggested code for " + pr.cost + " budget." : esc(st.t.replace(/^\s*\w+:\s*/, "")).replace(/^./, x=>x.toUpperCase())) + "</div>"; }
      h += "</div>";
    }
    const hist = p.history.slice(-5);
    h += '<div class="kx-hist">' + (hist.length ? hist.map(x=>'<div class="kx-shot">' + kxTiles(x.g, x.r, x.pos) + (x.pos ? "" : "<span>" + kxSummary(x.r) + "</span>") + "</div>").join("") : '<div class="kx-shot">Awaiting input.</div>') + "</div>";
  } else if(m === "sniff"){
    h = orHead() + '<div class="kx-label">Scans</div><div class="kx-list">' + scansNow().map((sc,i)=>'<div class="kx-row live"><span class="kx-badge">' + (i+1) + '</span><div><div class="n">' + (OR_SCAN[sc.k] || sc.k) + '</div></div><span class="kx-status live">' + scanCost(sc) + " budget</span></div>").join("") + "</div>";
  } else if(m === "warez"){
    h = orHead("Tools") + '<div class="kx-list">' + WARE.map((w,i)=>'<div class="kx-row ' + (S.ware[w.k] ? "live" : "lost") + '"><span class="kx-badge">' + (i+1) + '</span><div><div class="n">' + w.label + '</div><div class="s">' + OR_WARE[w.k] + '</div></div><span class="kx-status ' + (S.ware[w.k] ? "live" : "lost") + '">×' + S.ware[w.k] + "</span></div>").join("") + "</div>";
  } else if(m === "confirm"){
    h = kxCard(ui.confirm.lines) + '<div class="kx-foot" style="text-align:center">Confirm or cancel on the side keys.</div>';
  } else if(m === "play"){
    const s = sh.sectors[ui.play.i], open = s.status === "open";
    h = orHead("Review · block " + orPad(ui.play.i+1) + " of " + orPad(sh.sectors.length)) +
      '<div class="kx-wave' + (open ? "" : " static") + '">' + Array.from({length:22}, (_,k)=>'<i style="animation-delay:' + (k * 47 % 600) + 'ms"></i>').join("") + "</div>" +
      (open ? '<div class="kx-quote">' + esc(d.sectors[ui.play.i].text) + "</div>" : '<div class="kx-foot" style="margin:0;text-align:center">' + (s.status === "burned" ? "Purged." : "Sealed. Static only.") + "</div>");
  } else if(m === "read"){
    const rd = ui.read;
    h = orHead("Document" + (rd.focus >= 0 ? " · block " + orPad(rd.focus+1) : "")) + '<div class="kx-doc">' + esc(docText(d, sh, rd.focus)) + "</div>";
  } else if(m === "msg"){
    const L = (ui.msg || []).map(l=>typeof l === "string" ? l : l.t);
    if(L[0] === "DECLASSIFIED") h = '<div class="kx-card good or-declass"><div class="or-stamp">DECLASSIFIED</div>' + L.slice(1).map(t=>"<p>" + esc(t) + "</p>").join("") + "</div>";
    else return false;
  } else return false;
  el.innerHTML = h;
  return true;
}

// ---------- TIANSHU DataView: the ARCHON-7's own shard reader ----------
const DV_ICON = {shard:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>', ok:'<circle cx="12" cy="12" r="9"/><path d="M7.5 12.5l3 3 6-7"/>',
  bad:'<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>', lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  warn:'<path d="M12 3l10 18H2z"/><path d="M12 10v4.5M12 17.5v.5"/>', wave:'<path d="M3 12h3l2-6 4 12 3-9 2 3h4"/>'};
const dvIcon = n=>'<svg class="kxi" viewBox="0 0 24 24" aria-hidden="true">' + DV_ICON[n] + "</svg>";
const dvBar = ()=>'<div class="dv-bar"><span class="dv-seal">天枢</span><b>DATAVIEW 数据视图</b><span>2.1</span></div>';
const dvHero = (icon, zh, en, cls)=>'<div class="dv-hero ' + (cls || "") + '">' + dvIcon(icon) + '<div class="dv-zh">' + zh + '</div><div class="dv-en">' + en + "</div></div>";
const DV_ZH = [["Thermal shutdown","过热关机","bad"],["ACCESS DENIED","拒绝访问","bad"],["Key accepted","密钥已接受","ok"],["UNKNOWN MODULE","未知模块","bad"],["Reading shard","正在读取数据片","shard"],["Unlicensed module","已移除未授权模块","ok"],["Licensed module","已移除授权模块","ok"],["GHOSTBOOT","卡带已自毁","bad"],["ORACLE//ZERO r9","不支持此模块","bad"]];
function dvActive(){
  if(S.deck !== "archon" || ui.heat) return false;
  const v = V(), m = ui.mode;
  if(["corp","corpKey","corpMsg"].includes(m) || (ui.play && ui.play.corp && m === "play") || (ui.read && ui.read.corp && m === "read")) return true;
  return !v && (m === "idle" || m === "msg");
}
function renderDV(){
  const el = document.getElementById("kxui"); if(!el) return;
  el.classList.remove("tk", "or"); el.classList.add("dv");
  const m = ui.mode, d = curDef(), sh = cur();
  let h = dvBar();
  if(m === "msg" || m === "corpMsg"){
    const paras = []; let cur_ = [];
    (ui.msg || []).forEach(l=>{
      if(l && l.hdr) return;
      const t = (typeof l === "string" ? l : l.t).trim();
      if(!t || /^[-=]+$/.test(t)){ if(cur_.length){ paras.push(cur_.join(" ")); cur_ = []; } return; }
      cur_.push(t);
    });
    if(cur_.length) paras.push(cur_.join(" "));
    const title = paras[0] || "", hit = DV_ZH.find(([k])=>title.startsWith(k));
    h += '<div class="kx-card dv-msg ' + (hit ? hit[2] : "shard") + '">' + dvIcon(hit ? hit[2] : "shard") + (hit ? '<div class="dv-zh">' + hit[1] + "</div>" : "") +
      "<h3>" + esc(/[a-z]/.test(title) ? title : title.charAt(0) + title.slice(1).toLowerCase()) + "</h3>" + paras.slice(1).map(p=>"<p>" + esc(p) + "</p>").join("") + "</div>";
  } else if(!S.inserted || m === "idle"){
    h += dvHero("shard", "请插入数据片", "Please insert a data shard.") + '<div class="kx-foot dv-foot">天枢系统 · Tianshu Systems · 深圳</div>';
  } else if(m === "corp"){
    const lockN = lockedIdx(sh).length, burnN = sh.sectors.filter(s=>s.status === "burned").length;
    h += '<div class="kx-head"><div><div class="kx-k">数据片 · Shard</div><div class="kx-t">' + d.id + '</div></div><span class="kx-chip">' + (d.kind === "text" ? "文本 · text" : "语音 · audio") + "</span></div>";
    if(lockN > 0 && !traced(sh)) h += dvHero("lock", "数据片已加密", "This shard is encrypted. An authorization key is needed.");
    else if(lockN > 0) h += dvHero("warn", "完整性错误", "This shard has been modified. Its contents cannot be displayed.", "bad");
    else {
      const info = d.kind === "text" ? ["文本文档 · Text document", "页数 · Pages: " + docPages(d, sh, -1).length]
        : ["语音记录 · Voice recording", "时长 · Length: 0:" + String(Math.round(d.sectors.reduce((a,s)=>a + s.text.length, 0) / 14)).padStart(2, "0")];
      h += dvHero(d.kind === "text" ? "shard" : "wave", "可以读取", "This shard is readable.", "ok") +
        '<div class="kx-panel"><div class="dv-line">' + info[0] + '</div><div class="dv-line">' + info[1] + '</div><div class="dv-line ' + (burnN ? "bad" : "ok") + '">' + (burnN ? "受损 · Damaged: " + burnN + "/" + sh.sectors.length + " lost" : "完整性已验证 · Integrity verified") + "</div></div>";
    }
  } else if(m === "corpKey"){
    let slots = ""; for(let k=0;k<6;k++) slots += '<span class="kx-slot' + (k === ui.input.length ? " cur" : "") + '">' + esc(ui.input[k] || "") + "</span>";
    h += '<div class="kx-head"><div><div class="kx-k">数据片 · Shard ' + d.id + '</div><div class="kx-t">输入授权密钥</div></div></div><div class="dv-en">Enter the 6-digit authorization key.</div><div class="kx-slots dv-key">' + slots + "</div>" +
      '<div class="kx-foot">每次尝试都会被记录。 Every attempt is recorded.</div>';
  } else if(m === "read"){
    h += '<div class="kx-head"><div><div class="kx-k">文档 · Document</div><div class="kx-t">Shard ' + d.id + '</div></div></div><div class="kx-doc">' + esc(docText(d, sh, -1)) + "</div>";
  } else if(m === "play"){
    const s = sh.sectors[ui.play.i], open = s.status === "open";
    h += '<div class="kx-head"><div><div class="kx-k">第 ' + (ui.play.i+1) + " / " + sh.sectors.length + " 段 · Part " + (ui.play.i+1) + " of " + sh.sectors.length + '</div><div class="kx-t">Shard ' + d.id + "</div></div></div>" +
      '<div class="kx-wave' + (open ? "" : " static") + '">' + Array.from({length:22}, (_,k)=>'<i style="animation-delay:' + (k * 47 % 600) + 'ms"></i>').join("") + "</div>" +
      (open ? '<div class="kx-quote">' + esc(d.sectors[ui.play.i].text) + "</div>" : '<div class="kx-foot" style="margin:0;text-align:center">' + (s.status === "burned" ? "已丢失 · Lost" : "已加密 · Encrypted") + "</div>");
  }
  el.innerHTML = h;
}

function renderArchon(){
  if(S.deck !== "archon") return;
  const v = V(), t = document.getElementById("wMainTitle"); if(!t) return;
  const corpScreen = !v || ["corp","corpKey"].includes(ui.mode) || (ui.play && ui.play.corp && ui.mode === "play") || (ui.read && ui.read.corp && ui.mode === "read");
  const mode = v ? compat(S.cracker, "archon") : "none";
  t.textContent = corpScreen ? "DATAVIEW 2.1 数据视图" : mode === "emu" || mode === "overheat" ? "DS-4 EMU · " + v.name : v.name + " " + v.ver;
  const nativeRazor = !corpScreen && mode === "native" && v.targetWins;
  const gui = guiActive(), dv = !gui && dvActive();
  document.getElementById("oled").hidden = gui || dv; document.getElementById("kxui").hidden = !(gui || dv);
  if(gui) renderKX(); else if(dv) renderDV();
  document.querySelector(".win.main").classList.toggle("native-razor", !!nativeRazor);
  const tw = nativeRazor && ui.inSpread && (ui.mode === "spread" || ui.mode === "msg") && ui.spreadCols;
  const tgt = document.getElementById("aTargets");
  if(tw){
    WINS.forEach(([k])=>{ const w = document.querySelector('.win[data-w="' + k + '"]'); if(w) w.hidden = true; });
    document.getElementById("aDock").hidden = true;
    document.querySelector(".a-side").hidden = false;
    document.querySelector(".a-screen").classList.remove("all-min");
    tgt.hidden = false; tgt.innerHTML = targetWins();
  } else { tgt.hidden = true; applyWins(); }
  document.getElementById("ledAux").classList.toggle("on", !!v);
  if(!["map","pick","sniff","warez"].includes(ui.mode)) ui.softPage = 0;
  archonSys(); archonMedia(); archonLog(); renderSoft();
}
// ---------- heat: every cart warms the deck with use, both decks cool toward ambient ----------
// gain: degrees per guess per heat unit. cool: share of the gap to ambient lost per second.
const THERM = {ds4:{amb:32, warn:70, off:85, resume:45, cool:.015, gain:.10}, archon:{amb:40, warn:85, off:100, resume:50, cool:.03, gain:.07}};
const HEAT = {shiv:8, veuve:10, razor:18, razorkx:16, oracle:35, oraclek:28, tenkyu:14};
function cartHeat(){
  const v = V(); if(!v) return 1.5;
  const h = v.custom ? (v.heatRating || 0) : (HEAT[S.cracker] != null ? HEAT[S.cracker] : 10);
  return compat(S.cracker, S.deck) === "emu" ? h * 1.3 : h;
}
function heatUp(mult){
  if(ui.heat) return;
  ui.temp += cartHeat() * THERM[S.deck].gain * (mult == null ? 1 : mult) * (hasBug("hotloop") ? 1.6 : 1);
  renderTherm(); if(S.deck === "archon") archonSys();
  checkHeat();
}
function checkHeat(){
  const T = THERM[S.deck];
  if(ui.heat || ui.temp < T.off) return;
  if(S.deck === "ds4") dsShutdown(); else archonShutdown();
}
// DS-4: screen dies, keys go dead, the case's cooldown bar fills, then it reboots with the cart still in
function dsShutdown(){
  ui.heat = "ds4"; cancelTimers(); ui.input = "";
  logEvt("thermal shutdown");
  noise(.5); lowHit(55, .8, .08);
  const d = document.querySelector(".deck"); if(d) d.classList.add("off");
  ui.mode = "msg"; ui.msg = [""]; render();
}
function dsReboot(){
  const d = document.querySelector(".deck"); if(d) d.classList.remove("off");
  ui.heat = false; beep(330, .08, "square", .03);
  if(S.cracker){ bootCracker(); } else toHome();
}
// ARCHON-7: the Xuanji thermal governor shuts down, cools with its animation and ejects the cart
function archonShutdown(){
  ui.heat = true; cancelTimers(); ui.input = "";
  noise(.6); lowHit(55, .9, .09); fx("shake", 500);
  playFrames([{lines:["", {t:" !! THERMAL LIMIT !! ", cls:"inv", full:true}, "", " host " + Math.round(ui.temp) + "°C", " governor shutdown"], ms:1400, raw:true}], ()=>coolDown("runtime"));
}
setInterval(()=>{
  const T = THERM[S.deck];
  if(ui.heat === true) return; // ARCHON cooldown animation drives its own temperature
  const k = ui.heat === "ds4" ? T.cool * 2.2 : T.cool;
  ui.temp += (T.amb - ui.temp) * k + (Math.random() - 0.5) * .3;
  if(ui.heat === "ds4" && ui.temp <= T.resume) dsReboot();
  renderTherm(); if(S.deck === "archon") archonSys();
}, 1000);
function renderTherm(){
  if(S.deck !== "ds4") return;
  const dg = document.getElementById("thermDigits"); if(!dg) return;
  const T = THERM.ds4, t = Math.max(0, Math.min(99, Math.round(ui.temp)));
  dg.innerHTML = String(t).padStart(2, "0").split("").map(c=>{ const on = SEGS[c] || ""; return '<svg viewBox="0 0 30 48">' + Object.keys(SEGP).map(k=>'<polygon class="' + (on.includes(k) ? "on" : "off") + '" points="' + SEGP[k] + '"/>').join("") + "</svg>"; }).join("");
  dg.setAttribute("aria-label", t + " degrees");
  const led = document.getElementById("ovhLed");
  led.className = ui.heat === "ds4" || ui.temp >= T.warn ? "on" + (ui.temp >= T.warn + 8 || ui.heat === "ds4" ? " blink" : "") : "";
  const bar = document.getElementById("coolBar"), prog = ui.heat === "ds4" ? Math.max(0, Math.min(1, (T.off - ui.temp) / (T.off - T.resume))) : 0, lit = Math.round(prog * 10);
  bar.innerHTML = Array.from({length:10}, (_,i)=>'<i class="' + (i < lit ? "on" : "") + '"></i>').join("");
}
function syncHw(){
  const d = DECKS[S.deck], used = hwUsed(S.upg);
  HW.forEach(([k])=>{ const el = document.getElementById("u_" + k); if(!el) return; el.checked = !!S.upg[k]; el.disabled = !S.upg[k] && used >= d.bays; });
  const c = document.getElementById("hwCount"); if(c) c.textContent = "· " + used + "/" + d.bays + " bays";
  document.querySelectorAll('#deckCtrl input').forEach(r=>r.checked = r.value === S.deck);
  const bl = document.getElementById("deckBlurb"); if(bl) bl.textContent = d.blurb;
}

// ---------- build controls ----------
function buildKeypad(){
  const rows = ["1","2","3","A","4","5","6","B","7","8","9","C","E","0","F","D"];
  const kp = document.getElementById("keypad");
  kp.innerHTML = rows.map(k=>'<button type="button" class="key' + (/[A-F]/.test(k) ? " hex" : "") + '" data-k="' + k + '">' + k + "</button>").join("") +
    '<button type="button" class="key wide" data-k="*">* BACK</button><button type="button" class="key wide ent" data-k="#"># ENTER</button>';
}
function buildBench(){
  syncHw();
  document.getElementById("deckMount").addEventListener("click", e=>{
    const mn = e.target.closest("[data-min]"); if(mn){ toggleWin(mn.dataset.min, true); return; }
    const rs = e.target.closest("[data-restore]"); if(rs){ toggleWin(rs.dataset.restore, false); return; }
    const sb = e.target.closest(".soft"); if(sb){ softPress(parseInt(sb.dataset.s, 10)); return; }
    const b = e.target.closest(".key"); if(b) press(b.dataset.k);
  });
  document.getElementById("tray").addEventListener("click", e=>{ const c = e.target.closest(".cart"); if(c) insert(c.dataset.id); });
  document.getElementById("crackerTray").addEventListener("click", e=>{ const c = e.target.closest(".cart"); if(c) plugCracker(c.dataset.cr); });
}
document.addEventListener("keydown", e=>{
  if(e.target.matches && e.target.matches("input, textarea") && e.target.type !== "radio" && e.target.type !== "checkbox") return;
  if(e.metaKey || e.ctrlKey || e.altKey) return;
  if(ui.mode === "tkCrib" && guiActive() && /^[a-zA-Z0-9]$/.test(e.key)){ e.preventDefault(); tkType(e.key.toUpperCase()); return; }
  let k = e.key.toUpperCase();
  if(k === "ENTER" || k === "#") k = "#";
  else if(k === "BACKSPACE" || k === "ESCAPE" || k === "*") k = "*";
  if(/^[0-9A-F#*]$/.test(k)){ if(e.target.closest && e.target.closest(".key, .cart, .btn, .wt, .dock-tab, .soft") && k === "#") return; e.preventDefault(); press(k); }
});

// theme switch
const THEME_KEY = "shrdshiv-theme";
const hostTheme = document.documentElement.getAttribute("data-theme");
function applyTheme(t){
  if(t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  else if(hostTheme) document.documentElement.setAttribute("data-theme", hostTheme);
  else document.documentElement.removeAttribute("data-theme");
  document.querySelectorAll("#themeSwitch .btn").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.t === t)));
}
let themePref = "auto";
try{ themePref = localStorage.getItem(THEME_KEY) || "auto"; }catch(e){}
applyTheme(themePref);
document.getElementById("themeSwitch").addEventListener("click", e=>{
  const b = e.target.closest(".btn"); if(!b) return;
  themePref = b.dataset.t; applyTheme(themePref);
  try{ localStorage.setItem(THEME_KEY, themePref); }catch(e){}
});


mountDeck(); buildBench();
if(S.inserted && !defOf(S.inserted)) S.inserted = null;
toHome();
// ---------- hooks for the game layer (js/game.js) ----------
window.HR_ENGINE = {
  get S(){ return S; }, save, render, renderTray, switchDeck, plugCracker, syncHw, eject, cancelTimers, toHome,
  CRACKERS, DECKS, HW, WARE, SHARDS, DIFF, defOf, freshShard,
  reset(){ cancelTimers(); S = freshState(); save(); location.reload(); }
};
})();

