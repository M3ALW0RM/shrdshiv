// Havenport Shards: side jobs from Mama Rook.
//
// Side jobs are small shards that have nothing to do with the main story. The player asks
// for them at Rook's counter (the Jobs shelf). Each request builds a new shard from a job
// below, with locks and juice set by its tier, and puts it in the player's stash.
// When the job is settled (finished, fried or forfeited) Rook takes the shard back.
//
// tiers
//   name      shown at the counter.
//   stage     story stage when Rook starts offering this tier (see data/story.js).
//   lvls      the lowest and highest lock difficulty, 1 to 6.
//   enc       ciphers a job of this tier can use: "A" SEGLOCK, "X" XORPAD, "B" COMB, "C" CHAFF.
//   slack     extra juice on top of what the locks need. More slack = more forgiving.
//
// maxOpen     how many side jobs the player can hold at once.
// juicePerLvl juice each lock adds to the shard, by difficulty.
//
// pool: the jobs. Add as many as you like.
//   tier      which tier it belongs to.
//   name      the shard label.
//   client    who wants it cracked (Rook's message says this).
//   brief     one line from Rook about the job.
//   parts     one per sector, 2 to 5. type is the content tag, text is what the sector holds.
//             Keep each text short: the deck screen is 22 characters wide.
//
// lines: what Rook says. {client} {brief} {shard} {pay} are filled in by the game.

window.HR_JOBS = {
  maxOpen: 3,
  juicePerLvl: {1:4, 2:5, 3:7, 4:9, 5:11, 6:14},
  tiers: {
    easy:     {name:"Easy work",     stage:1, lvls:[1, 2], enc:["A"],           slack:4},
    standard: {name:"Standard work", stage:4, lvls:[2, 3], enc:["A", "X", "B"], slack:3},
    hard:     {name:"Heavy work",    stage:8, lvls:[3, 5], enc:["A", "X", "C"], slack:2}
  },

  lines: {
    offer:   {subject:"Job: {shard}", body:["{client}. {brief}", "It's in your stash. Crack it and I pay when it's done. Can't finish it? Hand it back before you fry it and I'll still pay for what you opened."]},
    clean:   {subject:"{shard}: paid", body:["Clean work. Client's happy, I'm happy. {pay} is in your account."]},
    fried:   {subject:"You fried {shard}", body:["I got another copy of that shard you fried. Thankfully one of my other netrunners DID manage to crack it.", "Client got what they paid for, no thanks to you. For the sectors you opened that were still readable: {pay}."]},
    forfeit: {subject:"{shard}: handed back", body:["Smart, giving it back before you cooked it. One of my other netrunners is finishing the job.", "Your cut for what you opened: {pay}."]},
    storyFried:   {subject:"You fried {shard}", body:["I got another copy of that shard you fried. Thankfully one of my other netrunners DID manage to crack it.", "Their copy is in your stash so you can read it. For the sectors you opened that were still readable: {pay}."]},
    storyForfeit: {subject:"{shard}: handed back", body:["Good call, handing that one back while it still had juice. One of my other netrunners finished it.", "Their copy is in your stash so you can read it. Your cut for what you opened: {pay}."]}
  },

  pool: [
    // ---- easy
    {tier:"easy", name:"Laundry ledger", client:"Mrs. Okafor at the Eighth Street laundromat", brief:"Her nephew locked the till records and moved to Lagos.", parts:[
      {type:"LEDGER", text:"Monday 412 nuyen. Tuesday 380. Wednesday the dryer broke again."},
      {type:"NOTE", text:"Spare key to the coin box is taped under machine 6."}]},
    {tier:"easy", name:"Love letter", client:"A kid from the Stacks", brief:"Wants to know what his girlfriend wrote before she left. Be gentle with it.", parts:[
      {type:"LETTER", text:"Dear Tomas. I took the night ferry to the Spire. Not because of you."},
      {type:"LETTER", text:"They offered me a real job. I will write when I have a real address."},
      {type:"PS", text:"Feed the cat. Her name is Biscuit, not Cat."}]},
    {tier:"easy", name:"Noodle bar recipe", client:"Uncle Bao from the noodle bar", brief:"Forgot the key to his own recipe shard. Says it's the broth.", parts:[
      {type:"RECIPE", text:"Pork bones, twelve hours. Never let it boil, only shiver."},
      {type:"SECRET", text:"One dried scallop per pot and a spoon of the old stock."}]},
    {tier:"easy", name:"Gym membership", client:"The owner of Iron Mike's", brief:"A member died and left a locked locker list. She wants the locker back.", parts:[
      {type:"LIST", text:"Locker 14: Ruiz. Locker 15: empty. Locker 16: Vasquez."},
      {type:"CODES", text:"Locker 16 combination 2 7 4. Do not give it to his brother."},
      {type:"NOTE", text:"Vasquez paid until December. Refund to his mother."}]},
    {tier:"easy", name:"Pigeon race results", client:"Old Petrov on the roof of Block 9", brief:"Claims the race club is cheating him. Probably right.", parts:[
      {type:"RESULTS", text:"First: Silver Dash, 41 minutes. Second: Petrov's Comet, 42."},
      {type:"MEMO", text:"Silver Dash was trucked halfway. Keep this between us."}]},
    {tier:"easy", name:"Bus driver's log", client:"A transit union rep", brief:"Wants proof of the route cuts before the meeting.", parts:[
      {type:"LOG", text:"Route 22 cut after 2100. Route 31 cut on Sundays."},
      {type:"MEMO", text:"Do not announce until after the union vote."},
      {type:"SIGNED", text:"Havenport Transit, operations office."}]},
    {tier:"easy", name:"Karaoke playlist", client:"The manager at Neon Lotus", brief:"Her DJ quit and took the password with him. It's just songs, kid.", parts:[
      {type:"LIST", text:"Friday: ballads, then disco after midnight."},
      {type:"NOTE", text:"Never let table 4 pick the songs. Never again."}]},
    {tier:"easy", name:"Clinic schedule", client:"A street clinic nurse", brief:"The scheduling shard locked itself after a power cut.", parts:[
      {type:"SCHED", text:"Dr. Amadi Monday and Thursday. Dr. Kim on Saturdays."},
      {type:"STOCK", text:"Bandages low. Order from the Pier 3 supplier."},
      {type:"NOTE", text:"Free vaccines on the first Sunday of the month."}]},

    // ---- standard
    {tier:"standard", name:"Bookie's slip", client:"A bookie who lost his key", brief:"Wants his own book back before someone else reads it.", parts:[
      {type:"BETS", text:"Ferraro owes 900 on the dog races. Due Friday."},
      {type:"BETS", text:"Lin from Pier 2 owes 300. Paid half."},
      {type:"ODDS", text:"Fight on the 12th: the kid at 4 to 1."},
      {type:"NOTE", text:"The kid is going down in round 3. Bet against."}]},
    {tier:"standard", name:"Insurance claim", client:"A woman whose shop burned down", brief:"The insurer says it was arson. She wants their file.", parts:[
      {type:"CLAIM", text:"Claim 7731-B. Fire at 14 Canal Street. Cause pending."},
      {type:"MEMO", text:"Adjuster recommends denial. Reason to be found later."},
      {type:"FIRE", text:"Fire report: faulty wiring in the building next door."}]},
    {tier:"standard", name:"Talent agency list", client:"A singer from the Neon Lotus", brief:"Her agency keeps a list about her. She wants to know what's on it.", parts:[
      {type:"TALENT", text:"Mira Sol. Good voice, bad attitude. Contract until 2084."},
      {type:"NOTE", text:"Do not renew. Replace with the twins from Spire 4."},
      {type:"MONEY", text:"Owed to Mira: 6 200 nuyen in unpaid shows."}]},
    {tier:"standard", name:"Landlord's book", client:"The tenants' committee of Block 12", brief:"The landlord says the repairs are done. They want his notes.", parts:[
      {type:"REPAIRS", text:"Elevator: not fixed. Heating: not fixed. Mold: painted over."},
      {type:"PLAN", text:"Raise rent 15 percent in spring. Evict the loud ones first."},
      {type:"CONTACT", text:"Inspector Varga takes 200 nuyen a visit."},
      {type:"NOTE", text:"Sell the building to Meridian before the inspection."}]},
    {tier:"standard", name:"Pharmacy order", client:"A pharmacist on Canal Street", brief:"Her supplier is shorting her and lying about it.", parts:[
      {type:"ORDER", text:"Ordered 400 units. Delivered 280. Billed for 400."},
      {type:"MEMO", text:"Sell the missing 120 at the night market."},
      {type:"SIGNED", text:"Driver Dobbs, Halcyon Pharma Logistics."}]},
    {tier:"standard", name:"Lost dog file", client:"A courier", brief:"Someone stole his dog for the fighting pits. He wants the address.", parts:[
      {type:"DOGS", text:"New intake: grey bull terrier, collar says Pepper."},
      {type:"WHERE", text:"Kennels behind the old cannery on Pier 7."},
      {type:"WHEN", text:"Fight night is Saturday at 0100."}]},

    // ---- hard
    {tier:"hard", name:"Casino ledger", client:"A dealer at the Golden Carp", brief:"She thinks the house is rigging her table to get her fired.", parts:[
      {type:"TABLES", text:"Table 9 rigged. Blame the dealer when the audit comes."},
      {type:"MONEY", text:"Skim 4 percent nightly. Split with floor manager Ito."},
      {type:"AUDIT", text:"Auditors arrive on the 20th. Clean up by the 18th."},
      {type:"NOTE", text:"Fire the dealer on table 9 on the 19th."}]},
    {tier:"hard", name:"Harbor manifest", client:"A dockworker", brief:"Something on the night barge is making people sick.", parts:[
      {type:"CARGO", text:"Barge 44: 30 drums marked solvent. Not solvent."},
      {type:"ROUTE", text:"Dump past the breakwater at 0300 when patrol changes."},
      {type:"PAY", text:"Crew bonus 500 each to keep quiet."},
      {type:"CLIENT", text:"Paid by a shell company out of the Spire."},
      {type:"NOTE", text:"Two crew are sick. Replace them, don't send them to the clinic."}]},
    {tier:"hard", name:"Precinct roster", client:"Someone who didn't give a name", brief:"Paid up front. Don't ask questions on this one.", parts:[
      {type:"ROSTER", text:"Night shift, Precinct 6: Sgt. Hale and four officers."},
      {type:"GAPS", text:"No patrol on Canal Street from 0200 to 0300."},
      {type:"NOTE", text:"Hale is paid to look away on Thursdays."},
      {type:"CAMS", text:"Cameras on Canal down for maintenance all month."}]},
    {tier:"hard", name:"Clinic trial data", client:"A doctor at the street clinic", brief:"A corp ran a free 'vitamin' program in the Stacks. She wants their data.", parts:[
      {type:"TRIAL", text:"Program VITA-3. 200 subjects from Blocks 9 to 14."},
      {type:"RESULT", text:"Side effects in 31 subjects. Program continues."},
      {type:"MEMO", text:"Do not report to the city. Subjects are not registered."},
      {type:"SIGNED", text:"Meridian BioServices, field division."}]},
    {tier:"hard", name:"Smuggler's routes", client:"A smuggler who doesn't trust his partner", brief:"Wants to know if his partner is selling him out.", parts:[
      {type:"ROUTE", text:"Tuesday run: Pier 3 to the old lighthouse."},
      {type:"ROUTE", text:"Friday run: Pier 9 to the north bridge."},
      {type:"DEAL", text:"Tip the harbor patrol about Friday. Keep the boat."},
      {type:"NOTE", text:"After Friday, the whole route is mine."}]}
  ]
};
