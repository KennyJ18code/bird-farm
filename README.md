# Backyard Bird Farm 🐔

A cozy bird-farming game for iPad. Raise chickens, ducks, quail, turkeys,
flamingos and peacocks across four farms, collect their eggs, and decorate
the coop.

**Play:** https://kennyj18code.github.io/bird-farm/

On an iPad, open the link in Safari and tap **Share → Add to Home Screen**
to install it like an app. It works offline once installed.

## How it's built

Plain HTML, CSS and JavaScript. No frameworks, no build step.

- `index.html` — the page and its buttons
- `style.css` — how the floating buttons and panels look
- `game.js` — the game itself: the birds' brains, the drawings, the sounds
- `sw.js` — keeps a copy on the device so it works offline

Want to change something? Open `game.js` and look at `SETTINGS`, `FARMS`,
`SPECIES` and `BREEDS` near the top. When you change the game, bump the
`VERSION` in `sw.js` so installed copies pick up the update.
