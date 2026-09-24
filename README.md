# Backyard Bird Farm 🐔

A cozy bird-farming game for iPad. Raise chickens, ducks, quail, turkeys,
flamingos and peacocks across four farms, collect their eggs, and decorate
the coop.

**Play:** https://kennyj18code.github.io/bird-farm/

## Play without internet

- **iPad or iPhone:** open the link in Safari, tap **Share**, then
  **Add to Home Screen**. Open the new Bird Farm icon once while you still
  have internet; after that it works with no internet at all.
- **Computer:** download
  [BackyardBirdFarm.html](https://kennyj18code.github.io/bird-farm/download/BackyardBirdFarm.html)
  and double-click it. The whole game is in that one file.

## How it's built

Plain HTML, CSS and JavaScript. No frameworks, no build step.

- `index.html` — the page and its buttons
- `style.css` — how the floating buttons and panels look
- `game.js` — the game itself: the birds' brains, the drawings, the sounds
- `sw.js` — keeps a copy on the device so it works offline
- `download/BackyardBirdFarm.html` — the whole game in one file, for offline play
- `tools/build_offline.py` — rebuilds that file (`python tools/build_offline.py`)

Want to change something? Open `game.js` and look at `SETTINGS`, `FARMS`,
`SPECIES` and `BREEDS` near the top. When you change the game, bump the
`VERSION` in `sw.js` so installed copies pick up the update, and run
`python tools/build_offline.py` to refresh the download.
