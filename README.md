# Havenport Shards

A single-player cracking game. You start with a Kestrel DS-4, the SHRDSHIV cartridge and a lead. Crack shards, earn nuyen, buy better gear at Mama Rook's counter and follow the story to the end.

No build step. Open `index.html` from disk, or upload the folder to GitHub Pages as is.

## Files

```
index.html          the page: header, deck, side panels, shop and reader overlays
css/engine.css      the deck and cracker look (shared with the bench)
css/game.css        inbox, bookcase, shop, toasts
js/engine.js        the cracking engine (decks, crackers, hardware, warez, ICE)
js/game.js          wallet, story progress, shop, bookcase, saves
data/shards.js      every shard: text, audio, ciphers, ICE
data/story.js       contacts and the story steps (messages and what each step unlocks)
data/shop.js        prices, payouts and the manual list
manuals/*.html      one standalone page per manual on the bookcase
```

The `data/` files are plain JavaScript so the game works from `file://` too. Each one starts with a comment that explains its fields. Keep the commas and quotes valid: if the page goes blank, open the browser console and it will name the file and line.

## Common edits

**Change a price or payout.** `data/shop.js`. `payouts` is nuyen per sector by difficulty level, `cleanBonus` is the extra share for a shard cracked with nothing burned.

**Add a shard.** Copy an entry in `data/shards.js` and give it a new `id`. Then give it to the player in a story step in `data/story.js` by adding its id to that step's `give` list, for example `give: ["0042", "<id>"]`.

**Write or change a message.** `data/story.js`. A step fires once everything in its `after` list is cracked. `{opened}`, `{total}`, `{burned}` and `{earned}` in a message are filled in from the player's run.

**Add an item to the shop.** Add a line to `items` in `data/shop.js`. `stock` is the story stage it appears at, `needs` hides it until the player owns something (for example the ARCHON-7), `manual` is the bookcase entry it comes with.

**Add or edit a manual.** Each file in `manuals/` is a normal web page, so edit it like any HTML. To add a new one, put the file in `manuals/`, add an entry to `manuals` in `data/shop.js` (title, file, spine and ink colours), and point an item's `manual` at it.

## Saves

Progress is saved in the browser (`havenport-run-v1` and `havenport-engine-v1` in localStorage). Settings has a New game button. Saves are per browser and per site, so a game started from disk does not carry over to the GitHub Pages copy.

## GitHub Pages

1. Make a repository and upload the whole `havenport` folder contents (keep the folders).
2. Settings, Pages, deploy from the main branch, root folder.
3. The game is at `https://<you>.github.io/<repo>/`. Edits to any data file or manual show up after the next push.
