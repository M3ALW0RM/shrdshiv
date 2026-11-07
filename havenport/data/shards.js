// Havenport Shards: every shard in the game.
//
// How to edit:
//   id      4 digits, shown on the shard label. Must be unique.
//   name    the label on the shard.
//   color   the shard's colour in your stash.
//   kind    "text" is read on screen, "audio" plays as a voice message.
//   enc     the cipher. "A" SEGLOCK and "X" XORPAD take text per sector.
//           "B" COMB, "C" CHAFF and "R" ROOKCRYPT take one text, spread across the sectors.
//           Leave enc out (and set juice:0, key:null) for a plain, unencrypted shard.
//   juice   how many guesses the shard tolerates before its locked sectors burn.
//   key     the owner's 6-digit key. Players never see it.
//   lvl     each sector's difficulty, 1 (easy) to 6 (brutal). 0 means the sector is not locked.
//   type    a short tag for what a sector holds (shown by content scans).
//   ice     optional. Protects the shard with ICE (see shard 3141 for an example).
//
// Which shards the player gets, and when, is set in data/story.js.
// How much each sector pays is set in data/shop.js (payouts).

window.HR_SHARDS = [

  // ===== Act 1: the Stacks =====
  {id:"0042", name:"Curfew notice", color:"#6c8fa8", kind:"text", juice:0, key:null, sectors:[
    {lvl:0, type:"NOTICE", text:"CITY OF HAVENPORT. Curfew in the Stacks from 2200 to 0500."},
    {lvl:0, type:"NOTICE", text:"Report unregistered decks to your block warden. Kestrel. We remember."}]},

  {id:"0588", name:"Night market flyer", color:"#5fa3a0", kind:"text", enc:"A", juice:12, key:"058814", sectors:[
    {lvl:1, type:"WHERE", text:"NIGHT MARKET under the Eighth Street overpass, Fridays after curfew."},
    {lvl:1, type:"RULES", text:"Cash only. No corp badges past the gate."},
    {lvl:2, type:"PASS", text:"Gate password: blue lantern."}]},

  {id:"4410", name:"Halloran crew orders", color:"#9c7a5e", kind:"text", enc:"C", juice:14, key:"441022",
    text:"Lay low until Friday. Nobody goes near the noodle bar. Someone is setting us up and I want to know who.",
    sectors:[{lvl:1}, {lvl:2}, {lvl:2}]},

  {id:"0417", name:"Courier voicemail", color:"#7fb08a", kind:"audio", enc:"A", juice:16, key:"417290", sectors:[
    {lvl:1, type:"HEADER", text:"This is Vasquez. Message for Mister Oyelaran."},
    {lvl:2, type:"PLACE", text:"The package is in locker 31 at Pier 9."},
    {lvl:3, type:"TIME", text:"Pick it up at three in the morning. Stay off the payphones, they're listening."}]},

  // ===== Act 2: Pier 9 =====
  {id:"0031", name:"Mama Rook's ledger", color:"#c7a35a", kind:"text", enc:"B", juice:18, key:"003118",
    text:"Dex Halloran owes 4200 plus interest. Sold one cracker cartridge to a buyer calling herself Nightjar. Paid in checksticks.",
    sectors:[{lvl:2}, {lvl:3}, {lvl:3}]},

  {id:"3306", name:"Dispatch log", color:"#a3a35f", kind:"text", enc:"B", juice:22, key:"330699",
    text:"Unit 9 reports the courier van left Pier 9 at 0312 heading north on Canal Road. Two passengers. Plates covered. Do not pursue, on orders of Captain Reyes.",
    sectors:[{lvl:3}, {lvl:3}, {lvl:4}, {lvl:4}]},

  {id:"2265", name:"Nightjar's brag tape", color:"#d08c4a", kind:"audio", enc:"A", juice:22, key:"226511", sectors:[
    {lvl:2, type:"HEADER", text:"Nightjar here, recording this for posterity."},
    {lvl:3, type:"METHOD", text:"Got into the Aurelius-Kade mail server through a janitor's deck."},
    {lvl:3, type:"PLACE", text:"Their whole project index sits on a shard in Sato's office."},
    {lvl:4, type:"NUMBER", text:"Floor 41. The door code starts with seven seven."}]},

  {id:"1193", name:"Aurelius-Kade memo", color:"#b86f5c", kind:"text", enc:"A", juice:26, key:"119355", sectors:[
    {lvl:3, type:"HEADER", text:"INTERNAL MEMO. AURELIUS-KADE. EYES ONLY."},
    {lvl:4, type:"NAME", text:"Project lead: Dr. Imogen Sato."},
    {lvl:4, type:"PLACE", text:"Trial site moved to the Stacks, building C."},
    {lvl:5, type:"NOTE", text:"Residents have not been informed. Keep it that way."}]},

  // ===== Act 3: Building C =====
  {id:"9014", name:"Sato's field notes", color:"#b0627f", kind:"text", enc:"C", juice:24, key:"901447",
    text:"Response to the serum is stronger than projected. Three residents of building C show early signs. Recommend we begin the Sweep before the auditor arrives on Sunday. Destroy this note.",
    sectors:[{lvl:3}, {lvl:3}, {lvl:4}, {lvl:4}]},

  {id:"5151", name:"Spire night roster", color:"#7a8fb8", kind:"text", enc:"B", juice:34, key:"515163",
    text:"Night shift, Spire lobby. Guard Okafor sleeps at 0300. Camera 4 loops every eleven minutes. The service door keycard is in the locker marked M.",
    sectors:[{lvl:4}, {lvl:4}, {lvl:5}, {lvl:5}, {lvl:6}]},

  {id:"7720", name:"Meridian contract", color:"#8a6fb3", kind:"audio", enc:"A", juice:32, key:"772001", sectors:[
    {lvl:4, type:"HEADER", text:"Meridian Synthetics, special contracts. This message will not be repeated."},
    {lvl:5, type:"NAME", text:"Target: the fixer known as Mama Rook."},
    {lvl:6, type:"PLACE", text:"She sleeps above the noodle bar on Eighth Street."},
    {lvl:6, type:"TIME", text:"Friday at two, after the shutters close."},
    {lvl:5, type:"NOTE", text:"Make it look like the Halloran crew did it."}]},

  // ===== Act 4: the Sweep =====
  {id:"7731", name:"Overnight transfers", color:"#4f9e8f", kind:"text", enc:"C", juice:30, key:"773108",
    text:"Canal Road Credit Union. Overnight transfer transcript, account 7731, registered to Meridian Synthetics special contracts. 0105 outgoing 40000 to Captain Reyes. Memo: harbor patrol consulting. 0122 outgoing 12000 to a numbered account at Pier 9. Memo: storage fees. 0140 outgoing 8000 in checksticks, collected in person by a courier calling herself Vasquez. 0203 incoming 90000 from Aurelius-Kade. Memo: trial site cleanup, building C. 0219 outgoing 5000 to Guard Okafor. Memo: overtime. 0247 outgoing 20000 to the Halloran crew, flagged and reversed within the minute. 0301 outgoing 200 to the noodle bar on Eighth Street. Memo: dinner, thank you. Note from the night clerk: the reversal at 0247 was ordered from a Meridian terminal, not by the bank. Someone wanted a paper trail that points at the Halloran crew.",
    sectors:[{lvl:4}, {lvl:5}, {lvl:4}, {lvl:6}, {lvl:5}, {lvl:5}, {lvl:6}, {lvl:4}]},

  {id:"6610", name:"Reyes' burner", color:"#a85a5a", kind:"audio", enc:"A", juice:28, key:"661044", sectors:[
    {lvl:4, type:"HEADER", text:"Reyes. Don't say my name on this line."},
    {lvl:5, type:"CARGO", text:"The Pier 9 van is ours. Two passengers, both from building C."},
    {lvl:5, type:"ORDER", text:"Meridian pays double if the auditor never makes it to Sunday."},
    {lvl:6, type:"METHOD", text:"Hold her ferry at the harbor inspection. Nobody asks questions at Pier 9."}]},

  {id:"8820", name:"Sweep protocol", color:"#5c6f8f", kind:"text", enc:"C", juice:34, key:"882015",
    text:"AURELIUS-KADE. SWEEP PROTOCOL, building C. Sunday 0400: power and water to building C cut for maintenance. 0430: residents moved by bus to the Pier 9 warehouse for health screening. Wipe every record of the serum trial from the Stacks clinic terminals. The auditor's ferry is held at the Pier 9 harbor inspection, arranged through Captain Reyes. Dr. Sato signs off on the cleanup. Any resident who refuses screening is listed as relocated. Blame any disturbance on the Halloran crew.",
    sectors:[{lvl:4}, {lvl:5}, {lvl:5}, {lvl:6}, {lvl:4}, {lvl:5}, {lvl:6}, {lvl:5}]},

  // An ICE-protected shard: Halden & Pryce Warden-4 controller with key vaults.
  // Each sector has its own 10 juice. Repeating a guess or guessing fast raises the alert;
  // at full alert the sector locks down for 20 s and the deck gets traced.
  {id:"3141", name:"Auditor's dossier", color:"#3f7f9f", kind:"text", enc:"A", juice:40, key:"314159",
    ice:{kind:"ice", n:4, d:[4,5,5,6], ctrl:"ksc4", cipher:"A", fb:"sparse", rekey:0,
      juice:{mode:"vault", per:[10,10,10,10]}, rules:["repeat","rate"], sentries:["lockdown","trace"], black:false,
      honeypot:false, logger:true, poison:false, mirror:false, legit:40, lockout:2, reports:false, bugs:[], watermark:[]},
    iceName:"WARDEN-4 AUDIT SEAL",
    sectors:[
      {lvl:4, type:"HEADER", text:"OFFICE OF THE CITY AUDITOR. Inspection file, Stacks building C."},
      {lvl:5, type:"NAME", text:"Lead auditor: Ines Marchetti. Arrives Sunday at six by the harbor ferry."},
      {lvl:5, type:"TIP", text:"Anonymous tip: residents of building C were given an unregistered serum."},
      {lvl:6, type:"NOTE", text:"If the inspection is blocked, send everything to the Havenport Courier. A copy waits in locker 31, Pier 9."}]},

  {id:"0001", name:"Building C voices", color:"#c06a8a", kind:"audio", enc:"A", juice:34, key:"000177", sectors:[
    {lvl:5, type:"NAME", text:"My name is Teodora Vance. Building C, fourth floor."},
    {lvl:5, type:"WHAT", text:"They gave us shots at the clinic and called it a flu vaccine."},
    {lvl:6, type:"HARM", text:"My son hasn't slept in three days. His hands won't stop shaking."},
    {lvl:6, type:"PLEA", text:"If you're hearing this, get it to the auditor before Sunday."}]}
];
