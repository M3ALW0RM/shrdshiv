// Havenport Shards: the story.
//
// The game moves through stages. Stage 0 is the start. Each step below fires once,
// when every shard in "after" is finished (no sector still locked), and moves the game
// to the next stage. The fixer's stock in data/shop.js unlocks by stage.
//
// Each step:
//   after   shard ids that must be finished first (the start step has none).
//   give    shard ids added to the player's stash.
//   msgs    messages that arrive. from / subject / body (paragraphs as a list).
//           hint is an optional gameplay tip shown under the message.
//           shards: optional list of shard ids shown as attachments on this message.
//             (Without it, the step's first message shows the step's "give" list.)
//           docs: optional list of manual ids (data/shop.js) attached to the message.
//             The player can open them from the message, and they sit on the bookcase.
//           wait: true holds the message back until every earlier message has been read.
//   end     true on the last step: the game shows its ending.
//
// In bodies, {opened} {total} {burned} and {earned} are filled in with the player's results.

window.HR_STORY = {
  title: "Havenport Shards",
  contacts: {
    heron: {name:"Heron", role:"retired netrunner", color:"#9fc7b8"},
    rook: {name:"Mama Rook", role:"fixer, Eighth Street", color:"#c7a35a"},
    nightjar: {name:"Nightjar", role:"cracker author", color:"#d08c4a"},
    lin: {name:"Lin Yuhan", role:"ex-Tianshu engineer", color:"#d24a3a"},
    unknown: {name:"no sender", role:"dead drop", color:"#7a8fb8"},
    ines: {name:"Ines Marchetti", role:"City Auditor", color:"#3f7f9f"}
  },

  steps: [
    // ===== stage 0: the start =====
    {after:[], give:["0042", "0588"], msgs:[
      {from:"heron", subject:"So you want to run shards", docs:["heron-tutorial"],
        body:["Kid. You kept asking, so here it is. I'm done with this life, my hands shake too much for the keys now. You aren't.",
          "That DS-4 of yours is a toy, but it's a toy nobody looks at twice. I left you a SHRDSHIV cartridge for the AUX port. Some street kid called Nightjar wrote it. It's rude and it's buggy and it works.",
          "I gave your comcode to a fixer I trust. Mama Rook, Eighth Street, under the noodle bar. She'll get you started in the biz. Be polite. She remembers everything.",
          "My notes are attached. Read them before you touch a locked shard. Every runner I buried skipped the notes."],
        hint:"Click the attached notes to read them. They also sit on your bookcase, with your deck's manual and SHRDSHIV's README."},
      {from:"rook", subject:"Heron says you're good", wait:true, shards:["0042", "0588"],
        body:["Heron gave me your comcode. Heron doesn't give me anything, so I'm curious.",
          "A courier dropped a bag of shards at my counter last night and never came back for it. Shards are information, and information is money. I pay for every shard you finish.",
          "Start easy. The curfew notice isn't even locked: stick it in your deck with no cracker plugged in and read it. Then plug in SHRDSHIV and crack the night market flyer."],
        hint:"Click a shard in your stash to insert it, and click a cartridge to plug it in. Rook pays once a shard is done. If one is going bad, the job bar under your deck lets you hand it back for part of the pay."}
    ]},

    // ===== stage 1 =====
    {after:["0588"], give:["4410"], msgs:[
      {from:"rook", subject:"Not bad",
        body:["Blue lantern. Ha. That flyer was worth more than it looked.",
          "My counter is open to you now. I've got a Paris cart called LA VEUVE that reads feedback by position, and a few warez if you get stuck.",
          "Here's another one from the bag. The Halloran crew's orders. Their cipher scatters whole words across the sectors, so you'll read it in pieces until it's open."],
        hint:"Mama Rook's counter is open, top right. Every cracker you buy comes with its manual on your bookcase. Ask her for side jobs on the Jobs shelf if you want extra nuyen. Opening every sector of a shard without losing any pays a clean-job bonus."}
    ]},

    // ===== stage 2 =====
    {after:["4410"], give:["0417"], msgs:[
      {from:"rook", subject:"Someone's setting up the Hallorans",
        body:["Dex Halloran thinks someone's framing his crew. Dex thinks a lot of things.",
          "This one's a voicemail. Audio shards play out loud once they're open, so turn your sound on.",
          "It's for a Mister Oyelaran. Never heard of him. That's what worries me."],
        hint:"Sniffing (2 on the cracker map) costs juice but tells you things: a sector's code length, what it holds, how many symbols it uses."}
    ]},

    // ===== stage 3: Pier 9 =====
    {after:["0417"], give:["3306", "0031"], msgs:[
      {from:"rook", subject:"Locker 31 was empty",
        body:["I sent a kid down to Pier 9. Locker 31 was empty and the lock was cut.",
          "My friend at the harbor patrol slipped me their dispatch log from that night. It uses COMB: every few characters belong to the same sector.",
          "New stock too. RAZORBACK just came in, and some hardware for your deck."],
        hint:"Harder locks (d3 and up) only tell you how many symbols are right, not which ones. Deck hardware goes in bays: the DS-4 has 2. Install it in the Deck panel."},
      {from:"nightjar", subject:"you don't know me",
        body:["you're the one running my SHRDSHIV. cute.",
          "before you trust your fixer, read her ledger. it's on the shard i'm sending you. no hard feelings, rook.",
          "- nj"]}
    ]},

    // ===== stage 4 =====
    {after:["3306", "0031"], give:["2265"], msgs:[
      {from:"nightjar", subject:"want to see real work?",
        body:["the hallorans owe rook money. so what. everyone owes rook money.",
          "the van on canal road matters more. two passengers, plates covered, and a harbor captain telling patrol to look away.",
          "here's how i got into aurelius-kade. i recorded it for posterity. don't laugh at the voice."]}
    ]},

    // ===== stage 5 =====
    {after:["2265"], give:["1193"], msgs:[
      {from:"rook", subject:"Aurelius-Kade",
        body:["Nightjar always did talk too much. But floor 41 is real.",
          "Somebody walked a memo out of Sato's office this morning and sold it to me for a song. They didn't know what they had. Neither do I, yet.",
          "If you can afford it, I've got something special under the counter. ORACLE//ZERO. Kestrel's own suite. It runs hot on a DS-4, so keep an eye on the heat."],
        hint:"Warez are single-use: buy them at the Fixer and use them from 3 on the cracker map. Reset refills juice. Brute force opens any sector, but the others get harder."}
    ]},

    // ===== stage 6: Building C =====
    {after:["1193"], give:["9014"], msgs:[
      {from:"rook", subject:"Building C is my block",
        body:["Building C. That's three doors down from my shop. Those are my people.",
          "A cleaner found these notes in Sato's shredder bin, half-shredded and still on a shard. CHAFF again.",
          "One more thing. A Tianshu importer has an ARCHON-7 at the night market. Five bays, a real screen, and it doesn't cook ORACLE. It isn't cheap."],
        hint:"Buying the ARCHON-7 adds its manual to your bookcase. Switch decks in the Deck panel. Hardware moves with you: install it in whichever deck you're using."}
    ]},

    // ===== stage 7 =====
    {after:["9014"], give:["5151"], msgs:[
      {from:"rook", subject:"The Sweep",
        body:["\"Begin the Sweep before the auditor arrives on Sunday.\" I don't like that word.",
          "If they're going to move people out of building C, they'll do it quietly. The Spire's security roster came across my counter. Find out who's watching the doors."]}
    ]},

    // ===== stage 8 =====
    {after:["5151"], give:["7720"], msgs:[
      {from:"unknown", subject:"(no subject)",
        body:["[a shard in an unmarked envelope, slid under your door]",
          "[a note in block capitals: YOUR FIXER IS ON A LIST.]"]},
      {from:"lin", subject:"ARCHON-7 software",
        body:["Rook says you're good. I used to write software for Tianshu. Now I write it for people who pay.",
          "If you have an ARCHON-7, I have carts for it: HUNTIAN, which I wrote, a RAZORBACK built for the Tianshu screen, and Kestrel's ORACLE r10. They're at Rook's counter."],
        hint:"Carts made for the ARCHON-7 won't run on the DS-4. DS-4 carts still run on the ARCHON-7 through its emulator."}
    ]},

    // ===== stage 9: the Sweep =====
    {after:["7720"], give:["7731", "6610"], msgs:[
      {from:"rook", subject:"I'm going dark",
        body:["Friday at two. Above the noodle bar. They wanted it to look like Dex did it.",
          "I'm not sleeping there anymore. The counter stays open, Lin will run it.",
          "Two more. A bank transcript that's mostly noise, and Captain Reyes' burner phone. Follow the money, kid."],
        hint:"Long text shards with many sectors are where HUNTIAN shines: it breaks the cipher instead of each lock."}
    ]},

    // ===== stage 10 =====
    {after:["7731", "6610"], give:["8820"], msgs:[
      {from:"lin", subject:"The protocol",
        body:["Meridian paid Reyes, Aurelius-Kade paid Meridian, and the Hallorans were set up to take the blame. The bank clerk saw it.",
          "Reyes is holding the auditor's ferry. This is the plan itself: the Sweep protocol, lifted from an Aurelius-Kade terminal. It's long, and it's CHAFF."]}
    ]},

    // ===== stage 11 =====
    {after:["8820"], give:["3141"], msgs:[
      {from:"rook", subject:"Get it to the auditor",
        body:["Sunday at four. Buses to the Pier 9 warehouse. Anyone who says no is 'relocated'.",
          "There's one person they're scared of: the City Auditor. Her inspection file is on a Halden & Pryce shard. That means real ICE, not a lock on a door.",
          "Go slow on this one."],
        hint:"This shard is guarded by ICE. Each sector has its own juice. Repeating a guess or guessing within 3 seconds raises the alert. At full alert the sector locks for 20 seconds and your deck gets traced."}
    ]},

    // ===== stage 12 =====
    {after:["3141"], give:["0001"], msgs:[
      {from:"rook", subject:"One more voice",
        body:["Locker 31 again. So that's what the courier was carrying: a copy for the auditor. Reyes' people took it.",
          "Teodora from the fourth floor recorded this before they cut the power. She gave it to me herself.",
          "Open it, and we send everything to Marchetti."]}
    ]},

    // ===== stage 13: the end =====
    {after:["0001"], give:[], end:true, msgs:[
      {from:"ines", subject:"Received",
        body:["This is Ines Marchetti, Office of the City Auditor.",
          "I took the early ferry from the north side instead of the one Reyes was holding. Your package was waiting for me.",
          "The buses never left building C. Dr. Sato is talking to my office. Captain Reyes is not answering his phone, on either line.",
          "Whoever you are, thank you."]},
      {from:"rook", subject:"Back at the counter",
        body:["The shutters are up again on Eighth Street.",
          "You opened {opened} of {total} sectors and made {earned} doing it. {burned} went to static. Not bad for a kid with a DS-4.",
          "Come by any time. There's always another shard."]}
    ]}
  ]
};
