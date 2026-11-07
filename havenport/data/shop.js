// Havenport Shards: money, the fixer's stock, and the bookcase.
//
// How to edit:
//   payouts      nuyen paid for each sector opened, by its difficulty (lvl in data/shards.js).
//   cleanBonus   extra share of a shard's payout when it is finished with no sector burned (0.2 = +20%).
//   startNuyen   money at the start of a new game.
//
// Each shop item:
//   id        unique id.
//   cat       "cracker", "deck", "hardware" or "warez".
//   name      what the shop calls it.     maker   who made it.
//   price     in nuyen.
//   gives     what the player gets: {cracker:"..."}, {deck:"..."}, {hw:"..."} or {ware:"...", n:1}.
//             Engine ids: crackers shiv, veuve, razor, oracle, razorkx, tenkyu, oraclek.
//             Decks ds4, archon. Hardware auto, map, tags, cheap, coproc.
//             Warez probe, bypass, brute, scrap, reset, insight.
//   needs     optional: {deck:"archon"} means it only runs on that deck (shown in the shop).
//   stock     the story stage (see data/story.js) when the fixer starts selling it. 0 = from the start.
//   manual    optional: a file in manuals/ added to the bookcase when bought.
//   blurb     the shop description.

window.HR_SHOP = {
  currency: "¥",
  startNuyen: 0,
  payouts: {1:40, 2:70, 3:120, 4:180, 5:260, 6:360},
  cleanBonus: 0.2,

  // Manuals the player starts with.
  startManuals: ["ds4-owners-manual", "shrdshiv-readme"],

  // Every manual in the game. file is in manuals/, spine is the colour on the bookcase.
  manuals: {
    "ds4-owners-manual":        {title:"KESTREL DS-4 Owner's Manual", file:"ds4-owners-manual.html", spine:"#c8c2ad", ink:"#2b2b2b"},
    "shrdshiv-readme":          {title:"SHRDSHIV README", file:"shrdshiv-readme.html", spine:"#1f2a24", ink:"#9fe0b0"},
    "la-veuve-pamphlet":        {title:"LA VEUVE Pamphlet", file:"la-veuve-pamphlet.html", spine:"#26408f", ink:"#f6f2e8"},
    "razorback-manual":         {title:"RAZORBACK PRO 5 Manual", file:"razorback-manual.html", spine:"#d9b21b", ink:"#141414"},
    "oracle-zero-field-manual": {title:"ORACLE//ZERO r9 Field Manual", file:"oracle-zero-field-manual.html", spine:"#20262c", ink:"#e8eef2"},
    "archon-7-manual":          {title:"TIANSHU ARCHON-7 User Guide", file:"archon-7-manual.html", spine:"#8a1f1f", ink:"#f3d27a"},
    "razorback-kx-manual":      {title:"RAZORBACK KX Addendum", file:"razorback-kx-manual.html", spine:"#b3121b", ink:"#ffe14d"},
    "huntian-manual":           {title:"HUNTIAN 浑天 Handbook", file:"huntian-manual.html", spine:"#1d2a4a", ink:"#e6c46b"},
    "oracle-r10-manual":        {title:"ORACLE//ZERO r10 XJ Manual", file:"oracle-r10-manual.html", spine:"#e9eef2", ink:"#1b2a38"}
  },

  items: [
    // ---- crackers
    {id:"veuve", cat:"cracker", name:"LA VEUVE v1.0", maker:"Collectif Bastille", price:300, stock:1, gives:{cracker:"veuve"}, manual:"la-veuve-pamphlet",
      blurb:"Reads feedback by position on every lock and keeps a log of symbols you've ruled out. Its probe suggests symbols worth testing."},
    {id:"razor", cat:"cracker", name:"RAZORBACK PRO 5", maker:"CrackWorks Ltd", price:900, stock:3, gives:{cracker:"razor"}, manual:"razorback-manual",
      blurb:"Loud and cheap to run. Spread shot fires one guess at up to 3 locks of the same difficulty for 1 juice. Cheap scans and a half-code probe."},
    {id:"oracle", cat:"cracker", name:"ORACLE//ZERO r9", maker:"ex-Kestrel", price:2000, stock:5, gives:{cracker:"oracle"}, manual:"oracle-zero-field-manual",
      blurb:"Kestrel's own counter-intrusion suite. Counts every possible code, suggests full guesses and leaves no trace. Runs very hot on a DS-4."},
    {id:"razorkx", cat:"cracker", name:"RAZORBACK KX", maker:"CrackWorks Ltd", price:1600, stock:8, needs:{deck:"archon"}, gives:{cracker:"razorkx"}, manual:"razorback-kx-manual",
      blurb:"The Tianshu-native RAZORBACK. Full colour, and a window per target during spread shots."},
    {id:"tenkyu", cat:"cracker", name:"HUNTIAN 浑天 1.0", maker:"Lin Yuhan", price:1800, stock:8, needs:{deck:"archon"}, gives:{cracker:"tenkyu"}, manual:"huntian-manual",
      blurb:"Ignores the locks and breaks the cipher instead. Best on long text shards with many sectors. Chinese or English."},
    {id:"oraclek", cat:"cracker", name:"ORACLE//ZERO r10 XJ", maker:"Kestrel DataSystems", price:2800, stock:8, needs:{deck:"archon"}, gives:{cracker:"oraclek"}, manual:"oracle-r10-manual",
      blurb:"ORACLE rebuilt for the ARCHON-7: the same engine with a full graphical interface and none of the overheating."},

    // ---- decks
    {id:"archon", cat:"deck", name:"TIANSHU ARCHON-7 天枢", maker:"Tianshu Systems", price:3500, stock:6, gives:{deck:"archon"}, manual:"archon-7-manual",
      blurb:"A runner-grade deck from Shenzhen. 5 hardware bays instead of 2, a multi-window screen, and it runs ORACLE without melting. DS-4 carts still work through its emulator."},

    // ---- deck hardware (one of each; install it in a deck's bays)
    {id:"hw-tags", cat:"hardware", name:"INDEXER module", maker:"Kestrel parts bin", price:200, stock:3, gives:{hw:"tags"},
      blurb:"Shows what every sector holds on the map, for free."},
    {id:"hw-auto", cat:"hardware", name:"AUTO-SCAN module", maker:"Kestrel parts bin", price:250, stock:3, gives:{hw:"auto"},
      blurb:"Marks the hardest locked sector on the map, for free."},
    {id:"hw-cheap", cat:"hardware", name:"EFFICIENCY module", maker:"night market", price:350, stock:5, gives:{hw:"cheap"},
      blurb:"Every scan costs 1 juice less. Stacks with cheap-scan software."},
    {id:"hw-map", cat:"hardware", name:"SURVEY module", maker:"night market", price:400, stock:5, gives:{hw:"map"},
      blurb:"Shows every sector's difficulty on the map, for free."},
    {id:"hw-coproc", cat:"hardware", name:"CO-PROC module", maker:"Tianshu surplus", price:700, stock:6, gives:{hw:"coproc"},
      blurb:"A co-processor that makes probe suggestions one step smarter."},

    // ---- warez (single-use charges)
    {id:"w-probe", cat:"warez", name:"peek.exe", maker:"Mama Rook", price:40, stock:1, gives:{ware:"probe", n:1},
      blurb:"Reveals one symbol of a sector's code."},
    {id:"w-bypass", cat:"warez", name:"bypass.exe", maker:"Mama Rook", price:90, stock:1, gives:{ware:"bypass", n:1},
      blurb:"Opens an easy sector (d1 or d2) for 2 juice."},
    {id:"w-scrap", cat:"warez", name:"scrapper.exe", maker:"Mama Rook", price:60, stock:3, gives:{ware:"scrap", n:1},
      blurb:"Burns a sector you don't need for extra juice. That sector pays nothing."},
    {id:"w-insight", cat:"warez", name:"insight.exe", maker:"Mama Rook", price:120, stock:3, gives:{ware:"insight", n:1},
      blurb:"One very good guess for a sector of your choice."},
    {id:"w-brute", cat:"warez", name:"bruteforce.exe", maker:"Mama Rook", price:160, stock:5, gives:{ware:"brute", n:1},
      blurb:"Opens any sector, but every other locked sector re-encrypts one level harder."},
    {id:"w-reset", cat:"warez", name:"reset.exe", maker:"Mama Rook", price:250, stock:5, gives:{ware:"reset", n:1},
      blurb:"Refills a shard's juice. Doesn't bring back burned sectors."}
  ]
};
