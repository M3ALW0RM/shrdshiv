// Havenport Shards: the game layer.
// Money, story progress, the fixer's counter, the bookcase and saving.
// Content lives in data/shards.js, data/story.js and data/shop.js.
// The deck itself (screens, crackers, cracking) is js/engine.js.
(function(){
"use strict";
const GSTORE = "havenport-run-v1";
const SHOP = window.HR_SHOP, STORY = window.HR_STORY, SHARD_DEFS = window.HR_SHARDS;
const cur = SHOP.currency || "¥";
const money = n=>cur + " " + Math.round(n).toLocaleString("en-US");
const esc = t=>String(t).replace(/[&<>"]/g, c=>({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"})[c]);
const defOf = id=>SHARD_DEFS.find(d=>d.id === id);

function freshGame(){
  return {stage:-1, nuyen:SHOP.startNuyen || 0, earned:0, owned:{shard:[], cracker:["shiv"], deck:["ds4"], hw:[]}, manuals:SHOP.startManuals.slice(),
    msgs:[], paid:{}, bonus:{}, ended:false};
}
let G = null;
try{ const r = localStorage.getItem(GSTORE); if(r){ const p = JSON.parse(r); if(p && p.owned) G = Object.assign(freshGame(), p); } }catch(e){}
const firstRun = !G;
if(!G) G = freshGame();
let ready = false;
function gsave(){ try{ localStorage.setItem(GSTORE, JSON.stringify(G)); }catch(e){} }

// ---------- what the engine is allowed to show ----------
window.HR_owns = (kind, id)=>(G.owned[kind] || []).includes(id);
window.HR_onSave = ()=>{ if(ready) tick(); };

// ---------- story ----------
function finished(id){
  const E = window.HR_ENGINE, sh = E && E.S.shards[id];
  return !!sh && G.owned.shard.includes(id) && !sh.sectors.some(s=>s.status === "locked");
}
function fireStep(i){
  const step = STORY.steps[i];
  G.stage = i;
  (step.give || []).forEach(id=>{ if(!G.owned.shard.includes(id)) G.owned.shard.push(id); });
  (step.msgs || []).forEach((m, k)=>G.msgs.push({step:i, k, read:false, at:Date.now()}));
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
// ---------- payouts ----------
function tick(){
  const E = window.HR_ENGINE; if(!E) return;
  let changed = false;
  G.owned.shard.forEach(id=>{
    const def = defOf(id), sh = E.S.shards[id]; if(!def || !sh) return;
    const paid = G.paid[id] || (G.paid[id] = []);
    def.sectors.forEach((s, i)=>{
      if(!s.lvl || paid.includes(i) || !sh.sectors[i] || sh.sectors[i].status !== "open") return;
      paid.push(i); const v = SHOP.payouts[s.lvl] || 0; G.nuyen += v; G.earned += v; changed = true;
      toast("+" + money(v) + " · " + def.name + ", sector " + (i + 1), "pay");
    });
    const locked = def.sectors.some((s, i)=>sh.sectors[i] && sh.sectors[i].status === "locked");
    if(!locked && !G.bonus[id] && def.sectors.some(s=>s.lvl > 0)){
      G.bonus[id] = true; changed = true;
      const clean = def.sectors.every((s, i)=>!s.lvl || sh.sectors[i].status === "open");
      if(clean){ const total = def.sectors.reduce((a, s)=>a + (SHOP.payouts[s.lvl] || 0), 0), b = Math.round(total * SHOP.cleanBonus); G.nuyen += b; G.earned += b; toast("+" + money(b) + " · clean job bonus, " + def.name, "pay"); }
      else toast(def.name + " is finished. Burned sectors pay nothing.", "warn");
    }
  });
  if(advance()){ changed = true; openMsg = null; const n = G.msgs.filter(m=>!m.read).length; toast(n + " new message" + (n === 1 ? "" : "s") + " in your inbox.", "msg"); E.renderTray(); }
  if(changed){ gsave(); renderAll(); }
}
// ---------- toasts ----------
function toast(text, kind){
  const box = document.getElementById("toasts"); if(!box) return;
  const t = document.createElement("div"); t.className = "toast " + (kind || ""); t.textContent = text; box.appendChild(t);
  setTimeout(()=>{ t.classList.add("out"); setTimeout(()=>t.remove(), 400); }, 3800);
}
// ---------- rendering ----------
function renderAll(){ renderTop(); renderInbox(); renderDeck(); renderShelf(); renderShop(); }
function renderTop(){
  document.getElementById("wallet").textContent = money(G.nuyen);
  const un = G.msgs.filter(m=>!m.read).length, b = document.getElementById("inboxBadge");
  b.textContent = un ? un + " new" : ""; b.hidden = !un;
  document.getElementById("shopBtn").hidden = G.stage < 1;
}
let openMsg = null;
function msgOf(m){ return STORY.steps[m.step].msgs[m.k]; }
function fillVars(t){
  const E = window.HR_ENGINE; let opened = 0, total = 0, burned = 0;
  G.owned.shard.forEach(id=>{ const d = defOf(id), sh = E.S.shards[id]; if(!d || !sh) return; d.sectors.forEach((s, i)=>{ if(!s.lvl) return; total++; if(sh.sectors[i].status === "open") opened++; if(sh.sectors[i].status === "burned") burned++; }); });
  return t.replace(/\{opened\}/g, opened).replace(/\{total\}/g, total).replace(/\{burned\}/g, burned === 0 ? "None" : burned).replace(/\{earned\}/g, money(G.earned));
}
function renderInbox(){
  const el = document.getElementById("inbox");
  if(!G.msgs.length){ el.innerHTML = '<p class="empty-note">No messages.</p>'; return; }
  const list = G.msgs.map((m, i)=>({m, i})).reverse();
  if(openMsg == null || !G.msgs[openMsg]) openMsg = list[0].i;
  const m = G.msgs[openMsg], d = msgOf(m), who = STORY.contacts[d.from] || {name:d.from, role:"", color:"var(--muted)"};
  if(!m.read){ m.read = true; gsave(); setTimeout(renderTop, 0); }
  const step = STORY.steps[m.step], gave = m.k === 0 ? (step.give || []) : [];
  el.innerHTML = '<div class="inbox"><ul class="msg-list" role="list">' + list.map(({m, i})=>{ const x = msgOf(m), c = STORY.contacts[x.from] || {name:x.from, color:"var(--muted)"};
      return '<li><button type="button" class="msg-row' + (i === openMsg ? " on" : "") + (m.read ? "" : " unread") + '" data-msg="' + i + '" style="--who:' + c.color + '"><b>' + esc(c.name) + "</b><span>" + esc(x.subject) + "</span></button></li>"; }).join("") + "</ul>" +
    '<article class="msg-body" style="--who:' + who.color + '"><header><b>' + esc(who.name) + "</b><span>" + esc(who.role) + "</span></header><h3>" + esc(d.subject) + "</h3>" +
    d.body.map(p=>"<p>" + esc(fillVars(p)) + "</p>").join("") +
    (gave.length ? '<p class="attach">Attached: ' + gave.map(id=>{ const s = defOf(id); return '<span class="chip">' + esc(id + " · " + (s ? s.name : "")) + "</span>"; }).join(" ") + "</p>" : "") +
    (d.hint ? '<p class="hint">' + esc(d.hint) + "</p>" : "") +
    (step.end && m.k === step.msgs.length - 1 ? '<p class="hint end">The story is over, but your stash and gear stay. Start a new game from Settings to play again.</p>' : "") + "</article></div>";
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
      (!G.owned.hw.length ? '<p class="empty-note">No hardware yet. Rook sells modules at her counter.</p>' : "") + "</div>" : "") +
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
const TABS = [["cracker","Crackers"],["deck","Decks"],["hardware","Hardware"],["warez","Warez"]];
function ownedItem(it){ const g = it.gives; return g.cracker ? G.owned.cracker.includes(g.cracker) : g.deck ? G.owned.deck.includes(g.deck) : g.hw ? G.owned.hw.includes(g.hw) : false; }
function renderShop(){
  const el = document.getElementById("shop"); if(el.hidden) return;
  const E = window.HR_ENGINE, S = E.S;
  const tabs = TABS.filter(([c])=>SHOP.items.some(it=>it.cat === c && it.stock <= G.stage));
  if(!tabs.some(([c])=>c === shopTab) && tabs.length) shopTab = tabs[0][0];
  const items = SHOP.items.filter(it=>it.cat === shopTab && it.stock <= G.stage);
  const soon = SHOP.items.filter(it=>it.stock > G.stage).length;
  el.innerHTML = '<div class="shop-in"><div class="shop-h"><div><div class="lbl">Eighth Street, under the noodle bar</div><h2 class="shop-title">Mama Rook\'s counter</h2></div><div class="shop-r"><div><span class="lbl">Your nuyen</span><b class="shop-cash">' + money(G.nuyen) + '</b></div><button type="button" class="btn" id="shopClose">Close</button></div></div>' +
    '<div class="seg-btns" role="group" aria-label="Shelf">' + tabs.map(([c, t])=>'<button type="button" class="btn" data-tab="' + c + '" aria-pressed="' + (c === shopTab) + '">' + t + "</button>").join("") + "</div>" +
    '<div class="goods">' + items.map(it=>{
      const own = ownedItem(it), needs = it.needs && it.needs.deck && !G.owned.deck.includes(it.needs.deck), poor = G.nuyen < it.price;
      const have = it.gives.ware ? (S.ware[it.gives.ware] || 0) : null;
      return '<article class="good' + (own ? " owned" : "") + '"><header><b>' + esc(it.name) + "</b><span>" + esc(it.maker) + "</span></header><p>" + esc(it.blurb) + "</p>" +
        (needs ? '<p class="needs">Needs the ' + esc(E.DECKS[it.needs.deck].short) + ".</p>" : "") +
        (it.manual && SHOP.manuals[it.manual] ? '<p class="comes">Comes with: ' + esc(SHOP.manuals[it.manual].title) + "</p>" : "") +
        '<footer><span class="price">' + money(it.price) + "</span>" + (have != null ? '<span class="lbl">you have ' + have + "</span>" : "") +
        (own ? '<span class="owned-tag">Owned</span>' : '<button type="button" class="btn buy" data-buy="' + it.id + '"' + (poor || needs ? " disabled" : "") + ">" + (needs ? "Needs a new deck" : poor ? "Not enough nuyen" : "Buy") + "</button>") + "</footer></article>"; }).join("") + "</div>" +
    (soon ? '<p class="empty-note">Rook has more coming as the job goes on.</p>' : "") + "</div>";
}
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
  let extra = "";
  if(it.manual && !G.manuals.includes(it.manual)){ G.manuals.push(it.manual); extra = " Its manual is on your bookcase."; }
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
  else if(t.dataset.book) openBook(t.dataset.book);
  else if(t.id === "readerClose") closeOverlay("reader");
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
};
})();
