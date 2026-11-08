// Havenport Shards: the game layer.
// Money, story progress, side jobs, the fixer's counter, the bookcase and saving.
// Content lives in data/shards.js, data/story.js, data/shop.js and data/jobs.js.
// The deck itself (screens, crackers, cracking) is js/engine.js.
(function(){
"use strict";
const GSTORE = "havenport-run-v1";
const SHOP = window.HR_SHOP, STORY = window.HR_STORY, JOBS = window.HR_JOBS || {tiers:{}, pool:[], lines:{}, maxOpen:0, juicePerLvl:{}};
const SHARD_DEFS = window.HR_SHARDS;
const PART = Object.assign({friedRate:0.5, forfeitMin:0.5, forfeitMax:0.85, unreadable:["B", "C", "R"]}, SHOP.partial || {});
const cur = SHOP.currency || "¥";
const money = n=>cur + " " + Math.round(n).toLocaleString("en-US");
const esc = t=>String(t).replace(/[&<>"]/g, c=>({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"})[c]);
const defOf = id=>SHARD_DEFS.find(d=>d.id === id);
const manualsOf = it=>it.manual ? [].concat(it.manual) : [];

function freshGame(){
  return {stage:-1, nuyen:SHOP.startNuyen || 0, earned:0, owned:{shard:[], cracker:["shiv"], deck:["ds4"], hw:[]}, manuals:SHOP.startManuals.slice(),
    msgs:[], paid:{}, bonus:{}, done:{}, jobs:[], jobUsed:[], pendingCopy:[], ended:false};
}
let G = null;
try{ const r = localStorage.getItem(GSTORE); if(r){ const p = JSON.parse(r); if(p && p.owned) G = Object.assign(freshGame(), p); } }catch(e){}
const firstRun = !G;
if(!G) G = freshGame();
// older saves: shards that already got their bonus are settled, and new starting manuals go on the shelf
Object.keys(G.bonus || {}).forEach(id=>{ if(!G.done[id]) G.done[id] = {how:"clean", pay:0}; });
SHOP.startManuals.slice().reverse().forEach(k=>{ if(!G.manuals.includes(k)) G.manuals.unshift(k); });
// side-job shards live in the save; hand them to the engine before it loads
G.jobs.forEach(d=>{ if(!defOf(d.id)) SHARD_DEFS.push(d); });
let ready = false, busy = false;
function gsave(){ try{ localStorage.setItem(GSTORE, JSON.stringify(G)); }catch(e){} }

// ---------- what the engine is allowed to show ----------
window.HR_owns = (kind, id)=>(G.owned[kind] || []).includes(id);
let tickQueued = false;
window.HR_onSave = ()=>{ if(!ready || busy || tickQueued) return; tickQueued = true; setTimeout(()=>{ tickQueued = false; tick(); }, 0); };

// ---------- story ----------
function finished(id){
  const E = window.HR_ENGINE, sh = E && E.S.shards[id];
  return !!sh && G.owned.shard.includes(id) && !sh.sectors.some(s=>s.status === "locked");
}
function fireStep(i){
  const step = STORY.steps[i];
  G.stage = i;
  (step.give || []).forEach(id=>{ if(!G.owned.shard.includes(id)) G.owned.shard.push(id); });
  (step.msgs || []).forEach((m, k)=>G.msgs.push({step:i, k, read:false, held:!!m.wait, at:Date.now()}));
  if(step.end) G.ended = true;
  return step;
}
function advance(){
  let fired = false;
  while(G.stage + 1 < STORY.steps.length){
    const next = STORY.steps[G.stage + 1];
    if(!(next.after || []).every(finished)) break;
    fireStep(G.stage + 1); fired = true;
  }
  return fired;
}
// a message marked "wait" shows up once everything before it has been read
let releaseTimer = null;
function releaseHeld(){
  const i = G.msgs.findIndex(m=>m.held); if(i < 0 || releaseTimer) return;
  if(G.msgs.slice(0, i).some(m=>!m.read && !m.held)) return;
  releaseTimer = setTimeout(()=>{ releaseTimer = null; const m = G.msgs[i]; if(!m || !m.held) return;
    m.held = false; m.at = Date.now(); openMsg = null; gsave(); renderAll(); toast("1 new message in your inbox.", "msg"); }, 2500);
}

// ---------- pay ----------
// Nothing is paid until a shard is settled: no sector left locked, or handed back.
function shardValue(id){
  const def = defOf(id), sh = window.HR_ENGINE.S.shards[id];
  let total = 0, open = 0, opened = 0, locked = 0, burned = 0, n = 0;
  def.sectors.forEach((s, i)=>{ if(!s.lvl) return; n++; const v = SHOP.payouts[s.lvl] || 0, st = sh.sectors[i] ? sh.sectors[i].status : "locked"; total += v;
    if(st === "open"){ open += v; opened++; } else if(st === "burned") burned++; else locked++; });
  return {def, sh, total, open, opened, locked, burned, n};
}
function readableAlone(def){ return !PART.unreadable.includes(def.enc); }
function forfeitShare(x){
  const juice = x.sh.max ? Math.max(0, Math.min(1, x.sh.juice / x.sh.max)) : 0;
  const chance = 0.5 * (x.n ? x.opened / x.n : 0) + 0.5 * juice;
  return PART.forfeitMin + (PART.forfeitMax - PART.forfeitMin) * chance;
}
function forfeitPay(id){ const x = shardValue(id); return Math.round(x.open * forfeitShare(x)); }
function alreadyPaid(id){ const def = defOf(id); return (G.paid[id] || []).reduce((a, i)=>a + (SHOP.payouts[def.sectors[i] && def.sectors[i].lvl] || 0), 0); }
function isJob(id){ return G.jobs.some(d=>d.id === id); }
function fill(t, vars){ return String(t).replace(/\{(\w+)\}/g, (m, k)=>vars[k] != null ? vars[k] : m); }
function rookSays(key, vars, extra){
  const L = JOBS.lines[key]; if(!L) return;
  G.msgs.push(Object.assign({dyn:{from:"rook", subject:fill(L.subject, vars), body:L.body.map(p=>fill(p, vars))}, read:false, at:Date.now()}, extra || {}));
  openMsg = null;
}
function settle(id, how){
  const E = window.HR_ENGINE, x = shardValue(id), def = x.def;
  let pay = 0;
  if(how === "clean") pay = x.open + Math.round(x.total * SHOP.cleanBonus);
  else if(how === "fried") pay = readableAlone(def) ? Math.round(x.open * PART.friedRate) : 0;
  else pay = Math.round(x.open * forfeitShare(x));
  pay = Math.max(0, pay - alreadyPaid(id));
  G.nuyen += pay; G.earned += pay;
  G.done[id] = {how, pay, opened:x.opened, lost:x.burned + (how === "forfeit" ? x.locked : 0), n:x.n};
  const job = isJob(id), vars = {shard:def.name, pay:pay ? money(pay) : "nothing, since what you opened can't be read on its own", client:"", brief:""};
  if(how === "clean"){
    toast("+" + money(pay) + " · " + def.name + " finished clean", "pay");
    if(job) rookSays("clean", vars);
  } else {
    toast((pay ? "+" + money(pay) + " · " : "") + def.name + (how === "fried" ? " fried" : " handed back to Rook"), pay ? "pay" : "warn");
    if(job){ rookSays(how, vars); if(how === "forfeit") dropJob(id); }
    else {
      // Rook's other runner cracked it: the player gets a readable copy once the shard is out of the deck
      if(!G.pendingCopy.includes(id)) G.pendingCopy.push(id);
      rookSays(how === "fried" ? "storyFried" : "storyForfeit", vars, {shards:[id]});
    }
  }
}
function dropJob(id){
  const E = window.HR_ENGINE;
  G.owned.shard = G.owned.shard.filter(x=>x !== id);
  G.jobs = G.jobs.filter(d=>d.id !== id);
  const i = SHARD_DEFS.findIndex(d=>d.id === id); if(i >= 0) SHARD_DEFS.splice(i, 1);
  E.dropShard(id); E.renderTray();
}
function forfeit(id){
  if(G.done[id] || !G.owned.shard.includes(id)) return;
  const E = window.HR_ENGINE; if(E.S.inserted === id) E.eject();
  busy = true; try{ settle(id, "forfeit"); } finally { busy = false; }
  gsave(); window.HR_ENGINE.renderTray(); window.HR_ENGINE.render(); tick(true);
}
function tick(force){
  const E = window.HR_ENGINE; if(!E) return;
  let changed = !!force;
  busy = true;
  try{
    G.owned.shard.slice().forEach(id=>{
      const def = defOf(id), sh = E.S.shards[id]; if(!def || !sh || G.done[id]) return;
      if(!def.sectors.some(s=>s.lvl > 0)){ G.done[id] = {how:"plain", pay:0}; changed = true; return; }
      if(sh.sectors.some(s=>s.status === "locked")) return;
      settle(id, sh.sectors.some(s=>s.status === "burned") ? "fried" : "clean"); changed = true;
    });
    // settled side jobs go back to Rook, and fried or returned story shards become Rook's copy, once they're out of the deck
    G.owned.shard.slice().forEach(id=>{ if(isJob(id) && G.done[id] && E.S.inserted !== id){ dropJob(id); changed = true; } });
    G.pendingCopy.slice().forEach(id=>{ if(E.S.inserted === id) return; const src = defOf(id); // data/shards.js entries are never changed by the engine
      if(src) E.restoreCopy(id, src); G.pendingCopy = G.pendingCopy.filter(x=>x !== id); changed = true; E.renderTray(); });
    if(advance()){ changed = true; openMsg = null; const n = G.msgs.filter(m=>!m.read && !m.held).length; toast(n + " new message" + (n === 1 ? "" : "s") + " in your inbox.", "msg"); E.renderTray(); }
  } finally { busy = false; }
  if(changed){ gsave(); renderAll(); }
  else renderJobBar();
}

// ---------- side jobs ----------
function openJobs(){ return G.jobs.filter(d=>G.owned.shard.includes(d.id) && !G.done[d.id]); }
function newJob(tierKey){
  const E = window.HR_ENGINE, tier = JOBS.tiers[tierKey];
  if(!tier || tier.stage > G.stage || openJobs().length >= JOBS.maxOpen) return;
  let pool = JOBS.pool.filter(j=>j.tier === tierKey && !G.jobUsed.includes(j.name) && !G.jobs.some(d=>d.name === j.name));
  if(!pool.length){ G.jobUsed = G.jobUsed.filter(n=>!JOBS.pool.some(j=>j.tier === tierKey && j.name === n)); pool = JOBS.pool.filter(j=>j.tier === tierKey && !G.jobs.some(d=>d.name === j.name)); }
  if(!pool.length) return;
  const job = pool[Math.floor(Math.random() * pool.length)];
  G.jobUsed.push(job.name);
  const rnd = (a, b)=>a + Math.floor(Math.random() * (b - a + 1));
  let id; do { id = String(rnd(1000, 9999)); } while(defOf(id) || E.S.shards[id]);
  const lvls = job.parts.map(()=>rnd(tier.lvls[0], tier.lvls[1])).sort((a, b)=>a - b);
  const enc = tier.enc[Math.floor(Math.random() * tier.enc.length)], oneText = ["B", "C", "R"].includes(enc);
  const juice = lvls.reduce((a, l)=>a + (JOBS.juicePerLvl[l] || 6), 0) + (tier.slack || 0);
  const colors = ["#8a9a6e", "#9a7e6e", "#6e8a9a", "#9a6e8a", "#7e9a8a", "#a08a5e"];
  const def = {id, name:job.name, color:colors[rnd(0, colors.length - 1)], kind:"text", enc, juice, key:String(rnd(100000, 999999)), job:true,
    sectors:job.parts.map((p, i)=>oneText ? {lvl:lvls[i], type:p.type} : {lvl:lvls[i], type:p.type, text:p.text})};
  if(oneText) def.text = job.parts.map(p=>p.text).join(" ");
  G.jobs.push(def); SHARD_DEFS.push(def); E.addShard(def); G.owned.shard.push(id);
  rookSays("offer", {shard:def.name, client:job.client, brief:job.brief}, {shards:[id]});
  gsave(); E.renderTray(); renderAll();
  toast("Rook sent you a job: " + def.name + ".", "msg");
}

// ---------- toasts ----------
function toast(text, kind){
  const box = document.getElementById("toasts"); if(!box) return;
  const t = document.createElement("div"); t.className = "toast " + (kind || ""); t.textContent = text; box.appendChild(t);
  while(box.children.length > 4) box.firstChild.remove();
  setTimeout(()=>{ t.classList.add("out"); setTimeout(()=>t.remove(), 400); }, 3800);
}

// ---------- rendering ----------
function renderAll(){ renderTop(); renderInbox(); renderDeck(); renderShelf(); renderShop(); renderJobBar(); releaseHeld(); }
function renderTop(){
  document.getElementById("wallet").textContent = money(G.nuyen);
  const un = G.msgs.filter(m=>!m.read && !m.held).length, b = document.getElementById("inboxBadge");
  b.textContent = un ? un + " new" : ""; b.hidden = !un;
  document.getElementById("shopBtn").hidden = G.stage < 1;
}
// the job bar under the deck: how the inserted shard is going, and the forfeit button
function renderJobBar(){
  const el = document.getElementById("jobBar"); if(!el) return;
  const armed = document.getElementById("forfeitBtn"); if(armed && armed.dataset.armed === "1") return;
  const E = window.HR_ENGINE, id = E && E.S.inserted, def = id && defOf(id), sh = id && E.S.shards[id];
  if(!def || !sh || !G.owned.shard.includes(id) || !def.sectors.some(s=>s.lvl > 0)){ el.hidden = true; el.innerHTML = ""; return; }
  const x = shardValue(id), d = G.done[id];
  let state, act = "";
  if(sh.copy) state = "Rook's copy, cracked by another runner";
  else if(d) state = d.how === "clean" ? "Finished clean · paid " + money(d.pay) : d.how === "fried" ? "Fried · paid " + money(d.pay) : d.how === "plain" ? "Not encrypted" : "Handed back · paid " + money(d.pay);
  else {
    state = x.opened + "/" + x.n + " sectors open · juice " + sh.juice + "/" + sh.max + " · worth " + money(x.total + Math.round(x.total * SHOP.cleanBonus)) + " clean";
    act = '<button type="button" class="btn small warn" id="forfeitBtn">Hand it back for ' + money(forfeitPay(id)) + "</button>";
  }
  el.hidden = false;
  el.innerHTML = '<div class="jb-l"><span class="lbl">' + (isJob(id) ? "Side job" : "Job") + " · " + esc(id) + "</span><b>" + esc(def.name) + '</b><span class="jb-s">' + esc(state) + "</span></div>" + act;
}
let openMsg = null;
function msgOf(m){ return m.dyn || STORY.steps[m.step].msgs[m.k]; }
function fillVars(t){
  const E = window.HR_ENGINE; let opened = 0, total = 0, burned = 0;
  G.owned.shard.forEach(id=>{ const d = defOf(id), sh = E.S.shards[id], dn = G.done[id]; if(!d || !sh || isJob(id)) return;
    if(dn && dn.n != null){ total += dn.n; opened += dn.opened; burned += dn.lost; return; }
    d.sectors.forEach((s, i)=>{ if(!s.lvl) return; total++; if(sh.sectors[i].status === "open") opened++; if(sh.sectors[i].status === "burned") burned++; }); });
  return t.replace(/\{opened\}/g, opened).replace(/\{total\}/g, total).replace(/\{burned\}/g, burned === 0 ? "None" : burned).replace(/\{earned\}/g, money(G.earned));
}
function attachments(m){
  const d = msgOf(m);
  if(m.dyn) return {shards:m.shards || [], docs:[]};
  const step = STORY.steps[m.step], anyOwn = step.msgs.some(x=>x.shards);
  return {shards:d.shards || (!anyOwn && m.k === 0 ? (step.give || []) : []), docs:d.docs || []};
}
function renderInbox(){
  const el = document.getElementById("inbox");
  const vis = G.msgs.map((m, i)=>({m, i})).filter(x=>!x.m.held);
  if(!vis.length){ el.innerHTML = '<div class="term"><div class="term-bar"><b>HAVENNET//MSG</b><span>0 messages</span></div><p class="term-empty">no messages. waiting for traffic...</p></div>'; return; }
  const list = vis.slice().reverse();
  if(openMsg == null || !G.msgs[openMsg] || G.msgs[openMsg].held) openMsg = list[0].i;
  const m = G.msgs[openMsg], d = msgOf(m), who = STORY.contacts[d.from] || {name:d.from, role:"", color:"#9a9d97"};
  if(!m.read){ m.read = true; gsave(); setTimeout(()=>{ renderTop(); releaseHeld(); }, 0); }
  const step = m.dyn ? null : STORY.steps[m.step], att = attachments(m);
  const un = vis.filter(x=>!x.m.read).length;
  const handle = n=>esc(n.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 10));
  el.innerHTML = '<div class="term">' +
    '<div class="term-bar"><span class="term-dots" aria-hidden="true"><i></i><i></i><i></i></span><b>HAVENNET//MSG 2.1</b><span>' + vis.length + " msg · " + un + " unread</span></div>" +
    '<div class="term-main"><ul class="term-list" role="list">' + list.map(({m, i}, n)=>{ const x = msgOf(m), c = STORY.contacts[x.from] || {name:x.from, color:"#9a9d97"};
      return '<li><button type="button" class="term-row' + (i === openMsg ? " on" : "") + (m.read ? "" : " unread") + '" data-msg="' + i + '" style="--who:' + c.color + '"><span class="tr-n">' + String(vis.length - n).padStart(2, "0") + '</span><span class="tr-m" aria-hidden="true">' + (m.read ? " " : "*") + '</span><span class="tr-from">' + handle(x.from) + '</span><span class="tr-subj">' + esc(x.subject) + "</span></button></li>"; }).join("") + "</ul>" +
    '<article class="term-body" style="--who:' + who.color + '">' +
      '<div class="th"><span class="k">FROM</span><span><b>' + esc(who.name) + "</b> " + (who.role ? '<span class="dim">&lt;' + esc(who.role) + "&gt;</span>" : "") + "</span></div>" +
      '<div class="th"><span class="k">SUBJ</span><span>' + esc(d.subject) + "</span></div>" +
      '<div class="term-rule" aria-hidden="true"></div>' +
      d.body.map(p=>"<p>" + esc(fillVars(p)) + "</p>").join("") +
      (att.shards.length || att.docs.length ? '<div class="term-att"><span class="k">ATTACHED</span><span class="atts">' +
        att.docs.map(k=>{ const b = SHOP.manuals[k]; return b ? '<button type="button" class="att doc" data-book="' + k + '">[' + esc(b.file.replace(/\.html$/, ".doc")) + "] " + esc(b.title) + "</button>" : ""; }).join("") +
        att.shards.map(id=>{ const s = defOf(id); return '<span class="att">[' + esc(id) + ".shard] " + esc(s ? s.name : "") + "</span>"; }).join("") + "</span></div>" : "") +
      (d.hint ? '<p class="term-hint"><span>SYS&gt;</span> ' + esc(d.hint) + "</p>" : "") +
      (step && step.end && m.k === step.msgs.length - 1 ? '<p class="term-hint end"><span>END&gt;</span> The story is over, but your stash and gear stay. Rook still has side jobs. Start a new game from Settings to play again.</p>' : "") +
    "</article></div>" +
    '<div class="term-prompt" aria-hidden="true">you@havennet:~/inbox$ <span class="t-cur"></span></div></div>';
}
function renderDeck(){
  const E = window.HR_ENGINE, S = E.S, el = document.getElementById("deckPanel");
  const decks = G.owned.deck.map(id=>'<button type="button" class="btn" data-deck="' + id + '" aria-pressed="' + (S.deck === id) + '">' + esc(E.DECKS[id].short) + "</button>").join("");
  const d = E.DECKS[S.deck], inst = E.HW.filter(([k])=>S.deckUpg[S.deck][k]);
  const bays = Array.from({length:d.bays}, (_, i)=>inst[i] ? '<button type="button" class="bayslot full" data-unhw="' + inst[i][0] + '" title="Remove">' + esc(inst[i][1]) + "</button>" : '<span class="bayslot">empty</span>').join("");
  const spare = G.owned.hw.filter(k=>!S.deckUpg[S.deck][k]);
  el.innerHTML = '<div class="deckrow">' + (G.owned.deck.length > 1 ? '<div class="seg-btns" role="group" aria-label="Deck">' + decks + "</div>" : "") + '<p class="deck-blurb">' + esc(d.blurb) + "</p></div>" +
    (G.owned.hw.length || G.stage >= 3 ? '<div class="bays-row"><span class="lbl">Hardware bays · ' + inst.length + "/" + d.bays + '</span><div class="bayline">' + bays + "</div>" +
      (spare.length ? '<span class="lbl">Not installed</span><div class="bayline">' + spare.map(k=>{ const n = (E.HW.find(h=>h[0] === k) || [k, k])[1]; return '<button type="button" class="btn small" data-inhw="' + k + '"' + (inst.length >= d.bays ? " disabled" : "") + ">Install " + esc(n) + "</button>"; }).join("") + "</div>" : "") +
      (!G.owned.hw.length ? '<p class="empty-note">No hardware yet. Rook sometimes has modules at her counter.</p>' : "") + "</div>" : "") +
    (warezLine(S) ? '<div class="bays-row"><span class="lbl">Warez charges</span><p class="warez">' + warezLine(S) + "</p></div>" : "");
}
function warezLine(S){ const E = window.HR_ENGINE; return E.WARE.filter(w=>S.ware[w.k] > 0).map(w=>esc(w.name) + ' <b class="mono">×' + S.ware[w.k] + "</b>").join(" · "); }
function renderShelf(){
  const el = document.getElementById("shelf");
  el.innerHTML = '<div class="bookcase">' + G.manuals.map(k=>{ const m = SHOP.manuals[k]; if(!m) return "";
    return '<button type="button" class="book" data-book="' + k + '" style="--sp:' + m.spine + ";--si:" + m.ink + '" title="' + esc(m.title) + '"><span>' + esc(m.title) + "</span></button>"; }).join("") + '<span class="shelf-board" aria-hidden="true"></span></div>';
}

// ---------- the fixer's counter ----------
let shopTab = "cracker";
const TABS = [["jobs","Jobs"],["cracker","Crackers"],["deck","Decks"],["hardware","Hardware"],["warez","Warez"]];
function ownedItem(it){ const g = it.gives; return g.cracker ? G.owned.cracker.includes(g.cracker) : g.deck ? G.owned.deck.includes(g.deck) : g.hw ? G.owned.hw.includes(g.hw) : false; }
function jobTiers(){ return Object.keys(JOBS.tiers).filter(k=>JOBS.tiers[k].stage <= G.stage); }
function renderJobs(){
  const E = window.HR_ENGINE, open = openJobs(), full = open.length >= JOBS.maxOpen;
  const ENCN = {A:"SEGLOCK", X:"XORPAD", B:"COMB", C:"CHAFF", R:"ROOKCRYPT"};
  return '<p class="jobs-intro">Small work that has nothing to do with the bag. Rook pays by the sector like any other shard. You can hold ' + JOBS.maxOpen + " side jobs at a time" + (open.length ? ", and you have " + open.length + "." : ".") + "</p>" +
    '<div class="goods">' + jobTiers().map(k=>{ const t = JOBS.tiers[k];
      const lo = SHOP.payouts[t.lvls[0]] || 0, hi = SHOP.payouts[t.lvls[1]] || 0;
      return '<article class="good job"><header><b>' + esc(t.name) + "</b><span>Locks d" + t.lvls[0] + " to d" + t.lvls[1] + " · " + t.enc.map(e=>ENCN[e] || e).join(", ") + "</span></header>" +
        "<p>About " + money(lo * 2) + " to " + money(hi * 5) + " a shard if you finish it clean.</p>" +
        '<footer><span class="lbl">from Mama Rook</span><button type="button" class="btn buy" data-job="' + k + '"' + (full ? " disabled" : "") + ">" + (full ? "Finish one first" : "Ask for a job") + "</button></footer></article>"; }).join("") + "</div>" +
    (open.length ? '<div class="jobs-open"><span class="lbl">Your side jobs</span><ul>' + open.map(d=>{ const sh = E.S.shards[d.id], o = sh ? sh.sectors.filter(s=>s.status === "open").length : 0;
      return "<li><b>" + esc(d.id) + "</b> " + esc(d.name) + ' <span class="dim">· ' + o + "/" + d.sectors.length + " open</span></li>"; }).join("") + "</ul></div>" : "");
}
function renderShop(){
  const el = document.getElementById("shop"); if(el.hidden) return;
  const E = window.HR_ENGINE, S = E.S;
  const tabs = TABS.filter(([c])=>c === "jobs" ? jobTiers().length > 0 : SHOP.items.some(it=>it.cat === c && it.stock <= G.stage));
  if(!tabs.some(([c])=>c === shopTab) && tabs.length) shopTab = tabs[0][0];
  const items = SHOP.items.filter(it=>it.cat === shopTab && it.stock <= G.stage);
  const soon = SHOP.items.filter(it=>it.stock > G.stage).length;
  el.innerHTML = '<div class="shop-in"><div class="shop-h"><div><div class="lbl">Eighth Street, under the noodle bar</div><h2 class="shop-title">' + CART + 'Mama Rook\'s counter</h2></div><div class="shop-r"><div><span class="lbl">Your nuyen</span><b class="shop-cash">' + money(G.nuyen) + '</b></div><button type="button" class="btn" id="shopClose">Close</button></div></div>' +
    '<div class="seg-btns" role="group" aria-label="Shelf">' + tabs.map(([c, t])=>'<button type="button" class="btn" data-tab="' + c + '" aria-pressed="' + (c === shopTab) + '">' + t + "</button>").join("") + "</div>" +
    (shopTab === "jobs" ? renderJobs() :
    '<div class="goods">' + items.map(it=>{
      const own = ownedItem(it), needs = it.needs && it.needs.deck && !G.owned.deck.includes(it.needs.deck), poor = G.nuyen < it.price;
      const have = it.gives.ware ? (S.ware[it.gives.ware] || 0) : null;
      const books = manualsOf(it).filter(k=>SHOP.manuals[k]).map(k=>SHOP.manuals[k].title);
      return '<article class="good' + (own ? " owned" : "") + '"><header><b>' + esc(it.name) + "</b><span>" + esc(it.maker) + "</span></header><p>" + esc(it.blurb) + "</p>" +
        (needs ? '<p class="needs">Needs the ' + esc(E.DECKS[it.needs.deck].short) + ".</p>" : "") +
        (books.length ? '<p class="comes">Comes with: ' + esc(books.join(" and ")) + "</p>" : "") +
        '<footer><span class="price">' + money(it.price) + "</span>" + (have != null ? '<span class="lbl">you have ' + have + "</span>" : "") +
        (own ? '<span class="owned-tag">Owned</span>' : '<button type="button" class="btn buy" data-buy="' + it.id + '"' + (poor || needs ? " disabled" : "") + ">" + (needs ? "Needs a new deck" : poor ? "Not enough nuyen" : "Buy") + "</button>") + "</footer></article>"; }).join("") + "</div>" +
    (soon ? '<p class="empty-note">Rook has more coming as the job goes on.</p>' : "")) + "</div>";
}
const CART = '<svg class="cart-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 3h3l2.6 11.2a1.5 1.5 0 0 0 1.5 1.1h8.4a1.5 1.5 0 0 0 1.4-1l2.1-6.3H6.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19.5" r="1.6" fill="currentColor"/><circle cx="17" cy="19.5" r="1.6" fill="currentColor"/></svg>';
function buy(id){
  const E = window.HR_ENGINE, S = E.S, it = SHOP.items.find(x=>x.id === id);
  if(!it || it.stock > G.stage || ownedItem(it)) return;
  if(it.needs && it.needs.deck && !G.owned.deck.includes(it.needs.deck)){ toast("That needs the " + E.DECKS[it.needs.deck].short + ".", "warn"); return; }
  if(G.nuyen < it.price){ toast("Not enough nuyen.", "warn"); return; }
  G.nuyen -= it.price;
  const g = it.gives;
  if(g.cracker) G.owned.cracker.push(g.cracker);
  if(g.deck) G.owned.deck.push(g.deck);
  if(g.hw){ G.owned.hw.push(g.hw); const d = E.DECKS[S.deck], used = E.HW.filter(([k])=>S.deckUpg[S.deck][k]).length; if(used < d.bays){ S.deckUpg[S.deck][g.hw] = true; E.syncHw(); } }
  if(g.ware){ S.ware[g.ware] = (S.ware[g.ware] || 0) + (g.n || 1); }
  const add = manualsOf(it).filter(k=>SHOP.manuals[k] && !G.manuals.includes(k));
  add.forEach(k=>G.manuals.push(k));
  const extra = add.length === 1 ? " Its manual is on your bookcase." : add.length ? " Its manuals are on your bookcase." : "";
  gsave(); E.save(); E.renderTray(); E.render(); renderAll();
  toast("Bought " + it.name + "." + extra, "buy");
}

// ---------- manual reader ----------
function openBook(k){
  const m = SHOP.manuals[k]; if(!m) return;
  const el = document.getElementById("reader");
  el.innerHTML = '<div class="reader-in"><div class="reader-h"><b>' + esc(m.title) + '</b><span><a class="btn" href="manuals/' + esc(m.file) + '" target="_blank" rel="noopener">Open in a new tab</a> <button type="button" class="btn" id="readerClose">Close</button></span></div><iframe title="' + esc(m.title) + '" src="manuals/' + esc(m.file) + '"></iframe></div>';
  el.hidden = false; document.body.style.overflow = "hidden";
}
function closeOverlay(id){ const el = document.getElementById(id); el.hidden = true; el.innerHTML = ""; document.body.style.overflow = ""; }

// ---------- events ----------
document.addEventListener("click", e=>{
  const t = e.target.closest("button"); if(!t) return;
  const E = window.HR_ENGINE, S = E.S;
  if(t.dataset.msg != null){ openMsg = +t.dataset.msg; renderInbox(); }
  else if(t.id === "shopBtn"){ const el = document.getElementById("shop"); el.hidden = false; document.body.style.overflow = "hidden"; renderShop(); }
  else if(t.id === "shopClose"){ document.getElementById("shop").hidden = true; document.body.style.overflow = ""; }
  else if(t.dataset.tab){ shopTab = t.dataset.tab; renderShop(); }
  else if(t.dataset.buy) buy(t.dataset.buy);
  else if(t.dataset.job) newJob(t.dataset.job);
  else if(t.dataset.book) openBook(t.dataset.book);
  else if(t.id === "readerClose") closeOverlay("reader");
  else if(t.id === "forfeitBtn"){
    if(t.dataset.armed !== "1"){ t.dataset.armed = "1"; t.textContent = "Sure? Click again to hand it back"; setTimeout(()=>{ if(t.isConnected){ t.dataset.armed = ""; renderJobBar(); } }, 3500); return; }
    forfeit(S.inserted);
  }
  else if(t.dataset.deck){ if(t.dataset.deck !== S.deck){ E.switchDeck(t.dataset.deck); renderDeck(); } }
  else if(t.dataset.inhw){ const k = t.dataset.inhw, d = E.DECKS[S.deck]; if(E.HW.filter(([x])=>S.deckUpg[S.deck][x]).length >= d.bays) return;
    Object.keys(S.deckUpg).forEach(dk=>{ S.deckUpg[dk][k] = false; }); S.deckUpg[S.deck][k] = true; S.upg = S.deckUpg[S.deck]; E.syncHw(); E.save(); E.render(); renderDeck(); }
  else if(t.dataset.unhw){ S.deckUpg[S.deck][t.dataset.unhw] = false; S.upg = S.deckUpg[S.deck]; E.syncHw(); E.save(); E.render(); renderDeck(); }
  else if(t.id === "voiceTog"){ S.voice = !S.voice; E.save(); t.setAttribute("aria-pressed", String(S.voice)); t.textContent = S.voice ? "Voice playback: on" : "Voice playback: off"; }
  else if(t.id === "newGame"){
    if(t.dataset.armed !== "1"){ t.dataset.armed = "1"; t.textContent = "Click again to wipe your save"; setTimeout(()=>{ t.dataset.armed = ""; t.textContent = "New game"; }, 3500); return; }
    try{ localStorage.removeItem(GSTORE); }catch(err){}
    E.reset();
  }
});
// while the counter or a manual is open, keys belong to them, not to the deck
document.addEventListener("keydown", e=>{
  const reader = !document.getElementById("reader").hidden, shop = !document.getElementById("shop").hidden;
  if(!reader && !shop) return;
  if(e.key === "Escape"){ if(reader) closeOverlay("reader"); else { document.getElementById("shop").hidden = true; document.body.style.overflow = ""; } }
  e.stopImmediatePropagation();
}, true);

// ---------- start (called by index.html once the engine has loaded) ----------
window.HR_GAME_START = function(){
  const E = window.HR_ENGINE, S = E.S;
  const sb = document.getElementById("shopBtn"); if(sb && !sb.querySelector("svg")) sb.insertAdjacentHTML("afterbegin", CART);
  if(firstRun || G.stage < 0){ fireStep(0); gsave(); }
  // keep the engine's state inside what the player owns
  if(!G.owned.deck.includes(S.deck)) E.switchDeck("ds4");
  if(S.cracker && !G.owned.cracker.includes(S.cracker)){ S.cracker = null; }
  Object.keys(S.deckUpg).forEach(dk=>Object.keys(S.deckUpg[dk]).forEach(k=>{ if(!G.owned.hw.includes(k)) S.deckUpg[dk][k] = false; }));
  S.upg = S.deckUpg[S.deck]; E.syncHw();
  if(S.inserted && !G.owned.shard.includes(S.inserted)) S.inserted = null;
  const vt = document.getElementById("voiceTog"); vt.setAttribute("aria-pressed", String(!!S.voice)); vt.textContent = S.voice ? "Voice playback: on" : "Voice playback: off";
  ready = true;
  E.save(); E.renderTray(); E.render();
  advance(); gsave();
  renderAll();
  // the job bar follows whatever is in the deck
  document.getElementById("tray").addEventListener("click", ()=>setTimeout(renderJobBar, 0));
  setInterval(renderJobBar, 1500);
};
})();
