/*
  ================================================================
   BACKYARD BIRD FARM — game.js
  ================================================================
  Hi! This file is the game's BRAIN and its PAINTBRUSH.

  How it works, in one breath:
    • About 60 times a second, update() moves every bird a tiny bit,
      and render() paints the whole picture again.
    • You own up to FOUR FARMS: the Backyard, the Duck Pond, the
      Wildflower Meadow and the Flamingo Lagoon. Tap the map button
      at the top to travel between them.
    • Birds make their OWN choices: wander, peck, swim, wade, show off
      their fancy tails, lay eggs, and put themselves to bed at sunset.
    • Birds on the farms you're NOT visiting keep living too — they eat,
      grow up and lay eggs while you're away.
    • You play by TOUCHING things:
        tap the grass ........ toss a treat
        tap an egg ........... put it in your basket
        slide across a bird .. pet it
        press & hold a bird .. pick it up
        tap a bird house ..... collect the eggs inside (or go into the coop)

  Want to change the game? Start with SETTINGS, FARMS, SPECIES and
  BREEDS right below. Try a new duck color, or give flamingos a
  different price!

  Map of this file
    1.  Settings
    2.  Farms, species, breeds, coops, decorations, names
    3.  Helper tools (math, colors, shapes)
    4.  Sound (every sound is made from scratch — no sound files!)
    5.  The farms' memory
    6.  Screen size & where things go
    7.  Time of day
    8.  Making birds
    9.  The bird brain
    10. Farms you're not visiting
    11. Everything else that moves (treats, butterflies, sparkles...)
    12. Painting: sky, farms, houses, trees, water
    13. Painting: the birds
    14. Painting: inside the coop, little pictures
    15. Touch controls
    16. Buttons, sheets, the map, hints and messages
    17. Saving & loading
    18. The game loop — the heartbeat
  ================================================================
*/
"use strict";


/* ================================================================
   1. SETTINGS — numbers you can change
   ================================================================ */
const SETTINGS = {
  dayLengthSeconds: 480,     // one whole day + night, in real seconds (8 minutes)
  hungerSeconds: 150,        // a full tummy lasts about this long
  thirstSeconds: 120,        // a full drink lasts about this long
  feederMeals: 20,           // full meals in the smallest feeder
  watererDrinks: 18,         // full drinks in the smallest waterer
  eggEverySeconds: 70,       // a happy bird lays about this often
  goldenEggChance: 1 / 30,   // about 1 egg in 30 is GOLDEN...
  goldenEggValue: 10,        // ...and it's worth this many eggs
  growUpSeconds: 210,        // how long a baby takes to grow up
  henSpeed: 34,              // walking speed
  runSpeed: 115,             // running-to-treats speed
  chickSpeed: 46,
  treatBites: 8,             // pecks in one handful of scratch
  maxTreatPiles: 3,          // handfuls on the ground at once
  nestBoxHolds: 3,           // eggs that fit in one nest box
  maxDecor: 40,              // decorations allowed in the coop
  maxYardEggs: 14,           // hidden eggs allowed on one farm's ground
};


/* ================================================================
   2. FARMS, SPECIES, BREEDS
   ================================================================ */

// The places you can own. "price" is how many eggs it costs to unlock.
// "starter" are the grown-up birds you get as a welcome present.
const FARMS = {
  backyard: {
    name: "Backyard", emoji: "🐔", price: 0, house: "coop",
    water: "waterer", trough: 1, blurb: "Where it all began",
    mascots: ["rir", "buff"], starter: [],
  },
  pond: {
    name: "Duck Pond", emoji: "🦆", price: 40, house: "duck house",
    water: "pond", trough: 2, capacity: 10, nests: 3, blurb: "Ducks, geese and swans",
    mascots: ["mallard", "pekin"], starter: ["pekin", "pekin"],
    welcome: "Welcome to the Duck Pond! Ducks love to swim 🦆",
  },
  meadow: {
    name: "Wildflower Meadow", emoji: "🌼", price: 100, house: "hutch",
    water: "waterer", trough: 2.5, capacity: 12, nests: 4, blurb: "Quail, pheasants and turkeys",
    mascots: ["ringneck", "coturnix"], starter: ["coturnix", "coturnix", "coturnix"],
    welcome: "Welcome to the Wildflower Meadow! 🌼 Watch the tiny quail scurry",
  },
  lagoon: {
    name: "Flamingo Lagoon", emoji: "🦩", price: 250, house: "pavilion",
    water: "lagoon", trough: 2, capacity: 8, nests: 3, blurb: "Flamingos and peacocks!",
    mascots: ["flamingo", "peacock"], starter: ["flamingo", "flamingo"],
    welcome: "Welcome to the Flamingo Lagoon! 🦩 Tap a peacock to see its fan",
  },
};
const FARM_ORDER = ["backyard", "pond", "meadow", "lagoon"];

// Each KIND of bird. The painting functions (drawHen, drawDuck...) are
// further down. "acts" are how often each bird likes to do each thing.
// "eggValue" is how many eggs one of its eggs is worth in your basket.
const SPECIES = {
  chicken: {
    farm: "backyard", draw: drawHen, adult: "hen", baby: "chick", icon: "🐔",
    size: 1, height: 86, body: 32, hitR: 36, eggValue: 1, egg: [9, 11], voice: "cluck",
    chase: true, acts: { peck: 24, scratch: 16, dust: 6, idle: 20, wander: 34 },
    portrait: { w: 112, h: 96, x: 2 },
  },
  duck: {
    farm: "pond", draw: drawDuck, adult: "duck", baby: "duckling", icon: "🦆", bill: "flat",
    size: 0.95, height: 64, body: 24, hitR: 34, eggValue: 2, egg: [10, 12.5], voice: "quack",
    swim: true, sink: 12, layBoost: 1.1, acts: { peck: 18, preen: 12, idle: 18, wander: 18, swim: 44 },
    portrait: { w: 104, h: 78, x: 4 },
  },
  goose: {
    farm: "pond", draw: drawGoose, adult: "goose", baby: "gosling", icon: "🦢", bill: "flat",
    size: 1.2, height: 98, body: 30, hitR: 38, eggValue: 4, egg: [12.5, 15.5], voice: "honk",
    swim: true, sink: 14, layBoost: 0.7, acts: { peck: 24, preen: 10, idle: 16, wander: 18, swim: 40 },
    portrait: { w: 140, h: 132, x: 8 },
  },
  quail: {
    farm: "meadow", draw: drawQuail, adult: "quail", baby: "quail chick", icon: "🐦",
    size: 0.62, height: 46, body: 19, hitR: 28, eggValue: 1, egg: [6, 7.5], voice: "quail",
    chase: true, layBoost: 1.7, speedK: 1.3, acts: { peck: 26, scratch: 18, dust: 10, idle: 12, wander: 38 },
    portrait: { w: 50, h: 40, x: 3 },
  },
  guinea: {
    farm: "meadow", draw: drawGuinea, adult: "guinea fowl", baby: "keet", icon: "🐦",
    size: 0.9, height: 64, body: 27, hitR: 32, eggValue: 2, egg: [8.5, 10.5], voice: "guinea",
    chase: true, layBoost: 0.9, speedK: 1.15, acts: { peck: 26, scratch: 14, idle: 14, wander: 46 },
    portrait: { w: 86, h: 72, x: 2 },
  },
  pheasant: {
    farm: "meadow", draw: drawPheasant, adult: "pheasant", baby: "pheasant chick", icon: "🐦",
    size: 1, height: 70, body: 28, hitR: 32, eggValue: 3, egg: [8.5, 10.5], voice: "pheasant",
    chase: true, layBoost: 0.8, acts: { peck: 28, scratch: 14, idle: 22, wander: 36 },
    portrait: { w: 152, h: 88, x: 28 },
  },
  turkey: {
    farm: "meadow", draw: drawTurkey, adult: "turkey", baby: "poult", icon: "🦃",
    size: 1.25, height: 96, body: 40, hitR: 42, eggValue: 4, egg: [11, 13.5], voice: "gobble",
    chase: true, layBoost: 0.8, acts: { peck: 26, scratch: 10, idle: 16, wander: 30, display: 18 },
    portrait: { w: 190, h: 160, x: 10 },
  },
  flamingo: {
    farm: "lagoon", draw: drawFlamingo, adult: "flamingo", baby: "flamingo chick", icon: "🦩",
    size: 1, height: 150, body: 78, hitR: 34, eggValue: 8, egg: [12, 15], voice: "flamingo",
    wade: true, sink: 30, layBoost: 0.6, acts: { peck: 26, idle: 28, wander: 14, wade: 32 },
    portrait: { w: 96, h: 170, x: 0 },
  },
  peafowl: {
    farm: "lagoon", draw: drawPeacock, adult: "peacock", baby: "peachick", icon: "🦚",
    size: 1.05, height: 108, body: 38, hitR: 38, eggValue: 10, egg: [11.5, 14], voice: "peacock",
    layBoost: 0.6, acts: { peck: 26, idle: 20, wander: 32, display: 22 },
    portrait: { w: 250, h: 176, x: 8 },
  },
};

// Every breed you can raise. "species" says which kind of bird it is
// (and so which farm it lives on). "egg" is the egg it lays.
const BREEDS = {
  // ---------- Chickens (Backyard) ----------
  rir: {
    species: "chicken", name: "Rhode Island Red", price: 8,
    body: "#A13D22", shade: "#6E2412", light: "#C9603A", wing: "#7A2C16",
    tail: "#2E1B12", tail2: "#4A2716", neck: "#B24A26",
    comb: "#E03A2F", beak: "#E8A33A", legs: "#E8B84A", chick: "#E9B86A",
    egg: { name: "Brown", color: "#B98256", speckle: true }, pitch: 1,
  },
  buff: {
    species: "chicken", name: "Buff Orpington", price: 10,
    body: "#E7B454", shade: "#C98E2E", light: "#F7D98E", wing: "#D49B3A",
    tail: "#D49B3A", tail2: "#C98E2E", tailK: 0.75, fluffy: 0.18,
    comb: "#E03A2F", beak: "#EEC06A", legs: "#E9CFA0", chick: "#FBE08B",
    egg: { name: "Tan", color: "#E2C497" }, pitch: 0.92,
  },
  barred: {
    species: "chicken", name: "Barred Rock", price: 12, pattern: "barred",
    body: "#E9E7E2", shade: "#9A978F", light: "#FFFFFF", wing: "#B9B6AE",
    tail: "#3A3A3E", tail2: "#5A5A5E", neck: "#D6D3CB",
    comb: "#E03A2F", beak: "#E7C04A", legs: "#E7C04A", chick: "#34343A", chickSpot: "#F4F1E6",
    egg: { name: "Brown", color: "#C79A6B", speckle: true }, pitch: 1.02,
  },
  leghorn: {
    species: "chicken", name: "White Leghorn", price: 12, combType: "big", layBoost: 1.15,
    body: "#FBFAF6", shade: "#D8D4CB", light: "#FFFFFF", wing: "#E8E4DB",
    tail: "#EDEAE3", tail2: "#E0DCD2", earlobe: "#F3EFE6",
    comb: "#E8352C", beak: "#F2C94C", legs: "#F2C94C", chick: "#FFF1A8",
    egg: { name: "White", color: "#F8F4EA" }, pitch: 1.08,
  },
  australorp: {
    species: "chicken", name: "Black Australorp", price: 14,
    body: "#2A2B31", shade: "#141418", light: "#4F6663", wing: "#1E2025",
    tail: "#16171B", tail2: "#2F3D3E", neck: "#30343A",
    comb: "#E03A2F", beak: "#3D3B3A", legs: "#43434A", chick: "#2C2C31", chickSpot: "#EDE8DA",
    egg: { name: "Brown", color: "#BF8F60" }, pitch: 0.95,
  },
  wyandotte: {
    species: "chicken", name: "Silver Laced Wyandotte", price: 16, pattern: "laced", combType: "rose",
    body: "#F3F1EC", shade: "#A9A69E", light: "#FFFFFF", wing: "#DAD7D0",
    tail: "#2A2A2F", tail2: "#44444A", neck: "#E6E3DC",
    comb: "#E03A2F", beak: "#E3BC4E", legs: "#E6C24E", chick: "#BDB8AC", chickStripe: "#7C776D",
    egg: { name: "Light brown", color: "#D4AE84" }, pitch: 1,
  },
  sussex: {
    species: "chicken", name: "Speckled Sussex", price: 16, pattern: "dots",
    body: "#8E3E1E", shade: "#5A2310", light: "#B6603A", wing: "#6E2E16",
    tail: "#2A1A12", tail2: "#5A2F1A", neck: "#A24E28",
    comb: "#E03A2F", beak: "#E8C38A", legs: "#F0D9B0", chick: "#C98E5A", chickStripe: "#7A4A28",
    egg: { name: "Light brown", color: "#D8B58C" }, pitch: 1,
  },
  cochin: {
    species: "chicken", name: "Blue Cochin", price: 18, fluffy: 0.3, featherFeet: true, tailK: 0.6,
    body: "#6F7F95", shade: "#4B586B", light: "#A2B1C4", wing: "#5E6C80",
    tail: "#4B586B", tail2: "#3F4A5B", neck: "#7B8BA0",
    comb: "#E03A2F", beak: "#E8C87A", legs: "#E8C87A", chick: "#8E96A2",
    egg: { name: "Brown", color: "#C79C70" }, pitch: 0.9,
  },
  easter: {
    species: "chicken", name: "Easter Egger", price: 20, pattern: "speckle", combType: "pea",
    body: "#9C7650", shade: "#6F5236", light: "#C9A27A", wing: "#7E5E3E",
    tail: "#3A2C22", tail2: "#5A4330", muffs: "#DCC7A8",
    comb: "#D8473A", beak: "#8F8676", legs: "#7F8C74", chick: "#D8B27A", chickStripe: "#8A6440",
    egg: { name: "Blue", color: "#9FD3CE" }, pitch: 0.97,
  },
  polish: {
    species: "chicken", name: "Polish", price: 22, crest: "#FFFFFF", combType: "tiny",
    body: "#26272D", shade: "#121317", light: "#44474F", wing: "#1D1E23",
    tail: "#15161A", tail2: "#2A2B31", neck: "#2A2B31",
    comb: "#D8473A", beak: "#8E8A84", legs: "#6E6C74", chick: "#2C2C31", chickSpot: "#FFFFFF",
    egg: { name: "White", color: "#F8F4EA" }, pitch: 1.1,
  },
  marans: {
    species: "chicken", name: "Cuckoo Marans", price: 24, pattern: "cuckoo",
    body: "#C9C6BF", shade: "#7B7872", light: "#ECEAE4", wing: "#A6A39C",
    tail: "#55534F", tail2: "#77746E", neck: "#BDBAB3",
    comb: "#E03A2F", beak: "#E3D2A6", legs: "#EDE0BC", chick: "#3A3A3F", chickSpot: "#E8E2D2",
    egg: { name: "Chocolate", color: "#6B3E23", speckle: true }, pitch: 0.98,
  },
  olive: {
    species: "chicken", name: "Olive Egger", price: 26, pattern: "speckle", combType: "pea",
    body: "#6E5A44", shade: "#46382A", light: "#9C8266", wing: "#56463A",
    tail: "#2A2420", tail2: "#43372C", muffs: "#BFA48A",
    comb: "#D8473A", beak: "#7F7A70", legs: "#6F7C66", chick: "#8E7A5E", chickStripe: "#4E3E2C",
    egg: { name: "Olive", color: "#8E9A5C" }, pitch: 0.97,
  },
  silkie: {
    species: "chicken", name: "Silkie", price: 30, silkie: true,
    body: "#FFFDF6", shade: "#E6DFCF", light: "#FFFFFF", wing: "#EFE9DB",
    tail: "#FFFDF6", face: "#4B3F63",
    comb: "#5B4E6E", beak: "#6E6A7A", legs: "#5E5870", chick: "#FFF6DC",
    egg: { name: "Cream", color: "#F3E6CC" }, pitch: 1.15,
  },

  // ---------- Ducks, geese & swans (Duck Pond) ----------
  pekin: {
    species: "duck", name: "Pekin Duck", price: 14,
    body: "#FFFDF4", shade: "#E4DCC8", light: "#FFFFFF", wing: "#F2ECDD", tail: "#EFE8D6",
    neck: "#FFFDF4", head: "#FFFDF4", bill: "#F2A93B", feet: "#F2A93B", chick: "#FFE27A",
    egg: { name: "Duck", color: "#F6F2E6" },
  },
  mallard: {
    species: "duck", name: "Mallard", price: 16,
    body: "#BDB8AF", shade: "#8E8980", light: "#E2DED6", wing: "#8C8378", chest: "#7A4A2E",
    tail: "#2C2C30", curl: "#1E1E22", neck: "#1F6B3A", head: "#1B5E34", headLight: "#3FA36A", ring: "#FFFFFF",
    bill: "#D9CB4A", feet: "#F09A3A", speculum: "#3F5FD8", chick: "#E6C766", chickStripe: "#6E5530",
    egg: { name: "Pale green", color: "#D9E8CF" },
  },
  runner: {
    species: "duck", name: "Indian Runner", price: 18, upright: true,
    body: "#D8C2A0", shade: "#A88F6C", light: "#F2E4CC", wing: "#BCA37F", tail: "#A88F6C",
    neck: "#F4F0E6", head: "#C9B08A", bill: "#B8C050", feet: "#F09A3A", chick: "#F0D48A",
    egg: { name: "Blue-green", color: "#C3E3D6" },
  },
  swedish: {
    species: "duck", name: "Swedish Blue", price: 18,
    body: "#5E7189", shade: "#3F4E62", light: "#8A9DB4", wing: "#4E5F75", tail: "#3F4E62",
    neck: "#5E7189", head: "#4A5B70", bib: "#F4F2EC", bill: "#6F7F8E", feet: "#5B4A3E",
    chick: "#4D5566", chickSpot: "#F0E9D8", egg: { name: "Duck", color: "#E9EFEA" },
  },
  call: {
    species: "duck", name: "Call Duck", price: 20, small: 0.72,
    body: "#FFFDF4", shade: "#E6DECB", light: "#FFFFFF", wing: "#F2ECDD", tail: "#EFE8D6",
    neck: "#FFFDF4", head: "#FFFDF4", bill: "#F2B23B", feet: "#F2A93B", chick: "#FFE680",
    egg: { name: "Tiny duck", color: "#F4F0E4" },
  },
  embden: {
    species: "goose", name: "Embden Goose", price: 34,
    body: "#FBFAF4", shade: "#DCD6C8", light: "#FFFFFF", wing: "#EDE8DC", tail: "#E7E1D3",
    neck: "#FBFAF4", head: "#FBFAF4", bill: "#F2913B", feet: "#F2913B", chick: "#EFD98A",
    egg: { name: "Goose", color: "#FBF9F1" },
  },
  muteSwan: {
    species: "goose", swan: true, name: "Mute Swan", price: 60, baby: "cygnet",
    body: "#FFFFFF", shade: "#DCDDE2", light: "#FFFFFF", wing: "#F3F3F6", tail: "#E8E8EC",
    neck: "#FFFFFF", head: "#FFFFFF", bill: "#F07A2E", knob: "#1E1E22", feet: "#3A3A40", chick: "#B9BCC4",
    egg: { name: "Swan", color: "#E3EBDD" },
  },
  blackSwan: {
    species: "goose", swan: true, name: "Black Swan", price: 80, baby: "cygnet",
    body: "#26262C", shade: "#101014", light: "#4A4A54", wing: "#1C1C22", wingTip: "#F4F4F6", tail: "#18181D",
    neck: "#26262C", head: "#26262C", bill: "#D8303A", band: "#FFFFFF", feet: "#2A2A30", chick: "#8E8E96",
    egg: { name: "Swan", color: "#D4E2CE" },
  },

  // ---------- Game birds (Wildflower Meadow) ----------
  coturnix: {
    species: "quail", name: "Coturnix Quail", price: 6, pattern: "streak",
    body: "#9C7A55", shade: "#6A4E34", light: "#C9A77E", wing: "#7E6044", head: "#8A6A48",
    breast: "#C9A77E", brow: "#F2E6CC", legs: "#E8B8A0", chick: "#C9A77E", chickStripe: "#6A4E34",
    egg: { name: "Speckled", color: "#EFE3C8", blotch: true },
  },
  california: {
    species: "quail", name: "California Quail", price: 12, pattern: "scaled",
    body: "#7C8A9C", shade: "#55606E", light: "#A6B2C0", wing: "#8C7658", head: "#7E6B56",
    breast: "#6F8096", belly: "#E8D6B0", face: "#1E1E22", plume: "#1E1E22", legs: "#8E8C94",
    chick: "#C9B08A", chickStripe: "#6E5530", egg: { name: "Speckled", color: "#EFE6CF", blotch: true },
  },
  guinea: {
    species: "guinea", name: "Guinea Fowl", price: 16,
    body: "#4B4F5C", shade: "#2E313A", light: "#6E7384", dot: "#FFFFFF",
    face: "#DCEAF5", wattle: "#D8473A", casque: "#9C6A3E", beak: "#E9D8B4", legs: "#6E6A6E",
    chick: "#B89868", chickStripe: "#6E5530", egg: { name: "Speckled tan", color: "#DCC39C", speckle: true },
  },
  ringneck: {
    species: "pheasant", name: "Ring-necked Pheasant", price: 24,
    body: "#B8642E", shade: "#7A3A18", light: "#E08A48", wing: "#8E6A4A", tail: "#9C7A50", bars: "#4A3420",
    neck: "#1E5A4A", head: "#2A3A7A", headLight: "#4A6AB4", ring: "#FFFFFF", wattle: "#D8303A", ear: "#1E5A4A",
    beak: "#E6D6A8", legs: "#9A9086", chick: "#C9A77E", chickStripe: "#6A4E34",
    egg: { name: "Olive-brown", color: "#A5956C" },
  },
  goldenPh: {
    species: "pheasant", name: "Golden Pheasant", price: 40,
    body: "#D8342A", shade: "#9C1E18", light: "#FF5A40", wing: "#2F4FA8", tail: "#B89048", bars: "#4A3420",
    neck: "#F2A33A", head: "#F2C14E", headLight: "#FFE27A", crest: "#FFD23A", cape: "#F28A2E", capeBar: "#1E1E22",
    beak: "#F2C14E", legs: "#C9A87A", chick: "#C9A77E", chickStripe: "#6A4E34",
    egg: { name: "Cream", color: "#EEDDB8" },
  },
  turkey: {
    species: "turkey", name: "Bronze Turkey", price: 36,
    body: "#5A4432", shade: "#2E2218", light: "#8A6A48", sheen: "#4E7A5E", wing: "#6E5A46", wingBar: "#F4EFE6",
    tail: "#5A4432", tailBand: "#E6D6B8", neck: "#B89CA0", head: "#9CC8E8", wattle: "#D8303A", beard: "#1E1A16",
    beak: "#E6D8B8", legs: "#D9A89A", chick: "#D8C29A",
    egg: { name: "Speckled", color: "#E8D6B8", speckle: true },
  },

  // ---------- Fancy birds (Flamingo Lagoon) ----------
  flamingo: {
    species: "flamingo", name: "American Flamingo", price: 60,
    body: "#F47FA0", shade: "#D8557A", light: "#FFB3C6", wing: "#F68AA8", wingTip: "#1E1E22",
    neck: "#F58AA8", head: "#F58AA8", bill: "#FCE3E8", billTip: "#1E1E22", legs: "#E86A8A", eye: "#F2C14E",
    chick: "#C9C9CF", egg: { name: "Flamingo", color: "#FBF8F0" },
  },
  peacock: {
    species: "peafowl", name: "Indian Peacock", price: 80,
    body: "#1D5FB4", shade: "#123D7A", light: "#3E86D8", neck: "#1F6FCC", head: "#1F6FCC", back: "#3F9A6A",
    train: "#2F8A5A", trainDark: "#1D5A3A", eyeRing: "#C9A04A", eyeMid: "#2AB0A0", eyeCore: "#1E3A9C",
    wing: "#C8A27A", wingBar: "#5A4030", crest: "#1F6FCC", legs: "#8E8478", chick: "#C9AE82",
    egg: { name: "Peafowl", color: "#EAD4A8" },
  },
  whitePeacock: {
    species: "peafowl", name: "White Peacock", price: 120, noStripes: true,
    body: "#FAFAF7", shade: "#DDDCD6", light: "#FFFFFF", neck: "#FAFAF7", head: "#FAFAF7", back: "#F2F1EC",
    train: "#F2F1EC", trainDark: "#DEDCD4", eyeRing: "#E9E4D6", eyeMid: "#F4F1E8", eyeCore: "#E2DDCF",
    wing: "#F2F1EC", wingBar: "#E2DFD6", crest: "#FAFAF7", legs: "#B8AFA4", chick: "#F4EEDD",
    egg: { name: "Peafowl", color: "#EAD4A8" },
  },
};
const farmOfBreed = (key) => SPECIES[BREEDS[key].species].farm;

// Coops you can build in the Backyard. Bigger coops hold more chickens.
const COOP_TIERS = [
  null,
  { name: "Cozy Coop",      price: 0,  capacity: 4,  nestBoxes: 2, troughSize: 1 },
  { name: "Farmhouse Coop", price: 25, capacity: 8,  nestBoxes: 3, troughSize: 2 },
  { name: "Chicken Palace", price: 90, capacity: 14, nestBoxes: 4, troughSize: 3.5 },
];

// Decorations for inside the Backyard coop. "tier" is the coop you need first.
// "toy" decorations do something when you tap them!
const DECOR = [
  { id: "plant",    emoji: "🪴", name: "Potted Plant",   price: 3,  tier: 1 },
  { id: "sunflower",emoji: "🌻", name: "Sunflower",      price: 4,  tier: 1 },
  { id: "basket",   emoji: "🧺", name: "Straw Basket",   price: 4,  tier: 1 },
  { id: "balloon",  emoji: "🎈", name: "Balloon",        price: 5,  tier: 1, wall: true },
  { id: "lantern",  emoji: "🏮", name: "Paper Lantern",  price: 6,  tier: 1, wall: true, glow: true },
  { id: "picture",  emoji: "🖼️", name: "Painting",       price: 6,  tier: 1, wall: true },
  { id: "teddy",    emoji: "🧸", name: "Teddy Bear",     price: 9,  tier: 1 },
  { id: "clock",    emoji: "🕰️", name: "Mantel Clock",   price: 12, tier: 2 },
  { id: "chime",    emoji: "🎐", name: "Wind Chime",     price: 12, tier: 2, wall: true, toy: "chime" },
  { id: "radio",    emoji: "📻", name: "Chicken Radio",  price: 14, tier: 2, toy: "radio" },
  { id: "rainbow",  emoji: "🌈", name: "Rainbow",        price: 16, tier: 2, wall: true },
  { id: "couch",    emoji: "🛋️", name: "Comfy Couch",    price: 18, tier: 2, big: 1.2 },
  { id: "fountain", emoji: "⛲", name: "Fountain",       price: 30, tier: 3, big: 1.25, sparkle: true },
  { id: "trophy",   emoji: "🏆", name: "Golden Trophy",  price: 35, tier: 3, sparkle: true },
  { id: "crown",    emoji: "👑", name: "Royal Crown",    price: 40, tier: 3, sparkle: true },
  { id: "disco",    emoji: "🪩", name: "Disco Ball",     price: 45, tier: 3, wall: true, toy: "disco" },
  { id: "diamond",  emoji: "💎", name: "Giant Diamond",  price: 50, tier: 3, sparkle: true },
  { id: "unicorn",  emoji: "🦄", name: "Unicorn",        price: 60, tier: 3, big: 1.2 },
  { id: "carousel", emoji: "🎠", name: "Carousel",       price: 80, tier: 3, big: 1.45 },
];
const DECOR_BY_ID = Object.fromEntries(DECOR.map((d) => [d.id, d]));

const NAMES = [
  "Nugget", "Waffle", "Pumpkin", "Daisy", "Marshmallow", "Pepper", "Biscuit",
  "Clementine", "Sunny", "Poppy", "Butter", "Cinnamon", "Peaches", "Coco",
  "Noodle", "Olive", "Ginger", "Dot", "Hazel", "Maple", "Pancake", "Tater",
  "Buttercup", "Pickles", "Jellybean", "Mabel", "Henrietta", "Rosie",
  "Sprinkles", "Toffee", "Muffin", "Bean", "Puddles", "Waddles", "Bubbles",
  "Pippin", "Rosebud", "Twinkle", "Flora", "Mango", "Kiwi", "Sapphire",
  "Duchess", "Captain", "Sprout", "Juniper", "Lulu", "Zinnia", "Taffy", "Fig",
];

const CANVAS_FONT = 'ui-rounded, "SF Pro Rounded", Nunito, system-ui, -apple-system, sans-serif';
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const SILKIE_PUFFS = [[-18, -4, 13], [-6, -12, 15], [8, -8, 14], [-10, 6, 13], [6, 6, 13], [16, 0, 11], [-22, 6, 10]];


/* ================================================================
   3. HELPER TOOLS
   ================================================================ */
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const easeIn = (t) => t * t * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const bez = (a, b, c, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;

// A random-number maker that gives the SAME numbers every time for the
// same seed — so the grass and hills look identical each time we repaint.
function seeded(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Colors: "#RRGGBB" -> [r, g, b], and blending two colors together.
const _rgbCache = {};
function rgb(hex) {
  let c = _rgbCache[hex];
  if (c) return c;
  const n = parseInt(hex.slice(1), 16);
  c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  _rgbCache[hex] = c;
  return c;
}
function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
}
function rgba(hex, a) { const c = rgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

// Shape helpers (they refuse to draw negative sizes, which would crash).
function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0.01, r), 0, TAU); }
function ellipse(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); }
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  if (w <= 0 || h <= 0) return;
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function drawStar(g, x, y, r) {
  r = Math.max(0.01, r);
  g.beginPath();
  g.moveTo(x, y - r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.quadraticCurveTo(x, y, x, y + r);
  g.quadraticCurveTo(x, y, x - r, y);
  g.quadraticCurveTo(x, y, x, y - r);
  g.fill();
}
function drawHeart(g, x, y, s) {
  g.beginPath();
  g.moveTo(x, y + s);
  g.bezierCurveTo(x - s * 1.4, y + s * 0.1, x - s * 0.9, y - s * 0.95, x, y - s * 0.3);
  g.bezierCurveTo(x + s * 0.9, y - s * 0.95, x + s * 1.4, y + s * 0.1, x, y + s);
  g.fill();
}
function glow(g, x, y, r, color) {
  const gr = g.createRadialGradient(x, y, 0, x, y, Math.max(1, r));
  gr.addColorStop(0, color);
  gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr;
  circle(g, x, y, r);
  g.fill();
}
function inRect(p, r) { return !!r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }


/* ================================================================
   4. SOUND — every sound is built from simple waves, like a synthesizer
   ================================================================
   Browsers only allow sound after the first tap, so unlock() runs then.
*/
const Sound = {
  ctx: null, master: null, noiseBuf: null, muted: false, primed: false,

  unlock() {
    try {
      // iPhones mute web pages when the silent switch is on. Asking for
      // "playback" sound (like a music app) lets the game be heard anyway.
      // The game's own sound button still mutes it.
      if (navigator.audioSession && navigator.audioSession.type !== "playback") navigator.audioSession.type = "playback";
    } catch (e) { /* older devices don't have this — that's okay */ }
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.85;
        this.master.connect(this.ctx.destination);
        // One second of "shhhh" noise, reused for scratchy sounds
        const len = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state !== "running") {
        const p = this.ctx.resume();
        if (p && p.catch) p.catch(() => {});
      }
      // Playing one silent blip during a tap fully wakes up sound on iPhones
      if (!this.primed) {
        const blip = this.ctx.createBufferSource();
        blip.buffer = this.ctx.createBuffer(1, 1, 22050);
        blip.connect(this.ctx.destination);
        blip.start(0);
        this.primed = true;
      }
    } catch (e) { /* no sound on this device — the game still works */ }
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.85, this.ctx.currentTime, 0.04);
  },
  get ready() { return !!this.ctx && this.ctx.state === "running" && !this.muted; },

  out(node, pan) {
    if (pan && this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = clamp(pan, -1, 1);
      node.connect(p);
      p.connect(this.master);
    } else node.connect(this.master);
  },
  // A single musical beep that can slide from one pitch to another
  tone(o) {
    if (!this.ready) return;
    const c = this.ctx, t0 = c.currentTime + (o.t || 0), dur = Math.max(0.02, o.dur || 0.1);
    const osc = c.createOscillator();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.f0, t0);
    if (o.f1 && o.f1 !== o.f0) osc.frequency.exponentialRampToValueAtTime(o.f1, t0 + dur);
    const g = c.createGain();
    const atk = Math.min(o.attack || 0.006, dur * 0.5);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain == null ? 0.2 : o.gain), t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = osc;
    if (o.filter) {
      const f = c.createBiquadFilter();
      f.type = o.filter; f.frequency.value = o.ff || 1200; f.Q.value = o.q || 1;
      osc.connect(f); node = f;
    }
    node.connect(g);
    this.out(g, o.pan);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  },
  // A burst of filtered noise (grain, water, rustling)
  noise(o) {
    if (!this.ready) return;
    const c = this.ctx, t0 = c.currentTime + (o.t || 0), dur = Math.max(0.02, o.dur || 0.1);
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = o.type || "bandpass";
    f.frequency.setValueAtTime(o.f || 1000, t0);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t0 + dur);
    f.Q.value = o.q || 1;
    const g = c.createGain();
    const atk = Math.min(o.attack || 0.005, dur * 0.5);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain || 0.2), t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g);
    this.out(g, o.pan);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.05);
  },

  // ----- bird voices -----
  bawk(t, f, dur, gain, pan) {
    this.tone({ type: "sawtooth", t, f0: f, f1: f * 0.72, dur, gain, filter: "bandpass", ff: 1500, q: 2.2, pan });
    this.noise({ t, dur: dur * 0.7, gain: gain * 0.3, type: "bandpass", f: 2300, q: 1.5, pan });
  },
  cluck(pitch = 1, pan = 0, v = 1) {
    this.bawk(0, 380 * pitch, 0.09, 0.2 * v, pan);
    this.bawk(0.11, 330 * pitch, 0.12, 0.18 * v, pan);
  },
  peep(pan = 0, v = 1, pitch = 1) {
    this.tone({ f0: 2600 * pitch, f1: 3500 * pitch, dur: 0.07, gain: 0.11 * v, pan });
    this.tone({ t: 0.1, f0: 2750 * pitch, f1: 3700 * pitch, dur: 0.07, gain: 0.09 * v, pan });
  },
  quack(pan = 0, v = 1) {
    [0, 0.17].forEach((t, i) => {
      this.tone({ type: "square", t, f0: 340 - i * 30, f1: 250 - i * 20, dur: 0.15, gain: 0.1 * v, filter: "bandpass", ff: 1000, q: 5, pan });
      this.noise({ t, dur: 0.1, gain: 0.05 * v, type: "bandpass", f: 1600, q: 3, pan });
    });
  },
  honk(pan = 0, v = 1) {
    this.tone({ type: "sawtooth", f0: 300, f1: 330, dur: 0.22, gain: 0.15 * v, filter: "bandpass", ff: 850, q: 4, pan });
    this.tone({ type: "sawtooth", t: 0.26, f0: 280, f1: 250, dur: 0.2, gain: 0.12 * v, filter: "bandpass", ff: 800, q: 4, pan });
  },
  quail(pan = 0, v = 1) {   // a quick three-note whistle
    this.tone({ f0: 1500, f1: 2100, dur: 0.07, gain: 0.07 * v, pan });
    this.tone({ t: 0.14, f0: 2000, f1: 2800, dur: 0.12, gain: 0.08 * v, pan });
    this.tone({ t: 0.32, f0: 2400, f1: 1700, dur: 0.1, gain: 0.06 * v, pan });
  },
  guinea(pan = 0, v = 1) {  // guinea fowl are noisy chatterboxes!
    for (let i = 0; i < 6; i++) this.tone({ type: "square", t: i * 0.09, f0: i % 2 ? 780 : 980, f1: i % 2 ? 700 : 900, dur: 0.06, gain: 0.06 * v, filter: "bandpass", ff: 1400, q: 3, pan });
  },
  pheasant(pan = 0, v = 1) { // "KOK-kok!" and a whirr of wings
    this.tone({ type: "sawtooth", f0: 760, f1: 560, dur: 0.14, gain: 0.15 * v, filter: "bandpass", ff: 1500, q: 2, pan });
    this.tone({ type: "sawtooth", t: 0.18, f0: 700, f1: 480, dur: 0.16, gain: 0.13 * v, filter: "bandpass", ff: 1400, q: 2, pan });
    this.noise({ t: 0.4, dur: 0.35, gain: 0.08 * v, type: "lowpass", f: 400, pan });
  },
  gobble(pan = 0, v = 1) {
    for (let i = 0; i < 12; i++) this.tone({ type: "sawtooth", t: i * 0.035, f0: i % 2 ? 360 : 520, f1: i % 2 ? 330 : 470, dur: 0.04, gain: 0.12 * v, filter: "bandpass", ff: 1100, q: 2.5, pan });
  },
  flamingo(pan = 0, v = 1) {
    [0, 0.2].forEach((t) => this.tone({ type: "square", t, f0: 520, f1: 470, dur: 0.12, gain: 0.08 * v, filter: "bandpass", ff: 1200, q: 3, pan }));
  },
  peacock(pan = 0, v = 1) { // "may-AWE!"
    this.tone({ type: "sawtooth", f0: 650, f1: 1100, dur: 0.28, gain: 0.12 * v, filter: "bandpass", ff: 1700, q: 2, pan });
    this.tone({ type: "sawtooth", t: 0.3, f0: 1150, f1: 780, dur: 0.4, gain: 0.12 * v, filter: "bandpass", ff: 1600, q: 2, pan });
  },
  rattle(pan = 0, t0 = 0) { // a peacock shaking its tail feathers
    for (let i = 0; i < 16; i++) this.noise({ t: t0 + i * 0.03, dur: 0.02, gain: 0.05, type: "highpass", f: 4500, pan });
  },
  // The right voice for any bird
  call(c, pan = 0, v = 1) {
    const S = SP(c);
    if (c.growth < 0.55) { this.peep(pan, v * 0.9, S.bill === "flat" ? 0.8 : S.size < 0.8 ? 1.2 : 1); return; }
    switch (S.voice) {
      case "cluck": this.cluck(BREEDS[c.breed].pitch || 1, pan, v); break;
      case "quack": this.quack(pan, v); break;
      case "honk": this.honk(pan, v); break;
      case "quail": this.quail(pan, v); break;
      case "guinea": this.guinea(pan, v); break;
      case "pheasant": this.pheasant(pan, v); break;
      case "gobble": this.gobble(pan, v); break;
      case "flamingo": this.flamingo(pan, v); break;
      case "peacock": this.peacock(pan, v); break;
    }
  },
  // "buk buk buk buk... ba-GAWK!" — the real song hens sing after laying
  eggSong(pan = 0, v = 1) {
    [0, 0.17, 0.34, 0.51].forEach((t, i) => this.bawk(t, 360 + i * 10, 0.08, 0.16 * v, pan));
    this.tone({ type: "sawtooth", t: 0.72, f0: 470, f1: 700, dur: 0.16, gain: 0.2 * v, filter: "bandpass", ff: 1600, q: 2, pan });
    this.tone({ type: "sawtooth", t: 0.88, f0: 690, f1: 430, dur: 0.3, gain: 0.18 * v, filter: "bandpass", ff: 1500, q: 2, pan });
  },
  squawk(pan = 0) {
    this.tone({ type: "sawtooth", f0: 700, f1: 1050, dur: 0.12, gain: 0.2, filter: "bandpass", ff: 1800, q: 1.6, pan });
    this.tone({ type: "sawtooth", t: 0.12, f0: 980, f1: 520, dur: 0.22, gain: 0.18, filter: "bandpass", ff: 1600, q: 1.6, pan });
  },
  purr(pan = 0) {
    for (let i = 0; i < 5; i++) this.tone({ type: "triangle", t: i * 0.05, f0: 230, f1: 200, dur: 0.045, gain: 0.07, pan });
  },
  sleepy(pan = 0) { this.tone({ type: "triangle", f0: 280, f1: 200, dur: 0.4, gain: 0.07, pan }); },

  // ----- everything else -----
  pop(t = 0) { this.tone({ t, f0: 620, f1: 1300, dur: 0.07, gain: 0.15 }); },
  chime() {
    this.tone({ type: "triangle", f0: 1046.5, dur: 0.3, gain: 0.1 });
    this.tone({ type: "triangle", t: 0.07, f0: 1568, dur: 0.36, gain: 0.08 });
  },
  golden() { [1046.5, 1318.5, 1568, 2093].forEach((f, i) => this.tone({ type: "triangle", t: i * 0.08, f0: f, dur: 0.5, gain: 0.09 })); },
  sparkle() { [1568, 2093, 2637, 3136].forEach((f, i) => this.tone({ t: i * 0.06, f0: f, dur: 0.3, gain: 0.055 })); },
  fanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone({ type: "triangle", t: i * 0.11, f0: f, dur: 0.4, gain: 0.1 }));
    this.tone({ type: "triangle", t: 0.46, f0: 1318.5, dur: 0.9, gain: 0.1 });
  },
  windChime() { [1760, 2217, 2637, 1975, 2349].forEach((f, i) => this.tone({ t: i * 0.13 + Math.random() * 0.04, f0: f, dur: 1.3, gain: 0.05 })); },
  scatter(pan = 0) {
    for (let i = 0; i < 10; i++) this.noise({ t: Math.random() * 0.25, dur: 0.03, gain: 0.11, type: "highpass", f: 3600, q: 0.7, pan });
  },
  pour(pan = 0, water = false) {
    this.noise({ dur: 0.7, gain: 0.13, type: water ? "bandpass" : "lowpass", f: water ? 700 : 600, f1: water ? 2400 : 1800, q: 1.2, pan });
    if (water) for (let i = 0; i < 6; i++) this.tone({ t: rand(0.05, 0.6), f0: rand(500, 900), f1: rand(1000, 1500), dur: 0.05, gain: 0.05, pan });
  },
  splash(pan = 0) {
    this.noise({ dur: 0.35, gain: 0.18, type: "bandpass", f: 900, f1: 300, q: 0.8, pan });
    for (let i = 0; i < 5; i++) this.tone({ t: rand(0, 0.25), f0: rand(600, 1000), f1: rand(1200, 1800), dur: 0.05, gain: 0.05, pan });
  },
  whoosh() { this.noise({ dur: 0.6, gain: 0.09, type: "lowpass", f: 300, f1: 1800, q: 0.8 }); },
  tick() { this.tone({ f0: 1500, f1: 1150, dur: 0.035, gain: 0.05 }); },
  door() { this.tone({ type: "sawtooth", f0: 140, f1: 230, dur: 0.35, gain: 0.035, filter: "lowpass", ff: 900 }); },
  thunk() {
    this.noise({ dur: 0.18, gain: 0.28, type: "lowpass", f: 380 });
    this.tone({ f0: 120, f1: 60, dur: 0.22, gain: 0.22 });
  },
  tweet() {
    const pan = rand(-0.8, 0.8), base = rand(2800, 4200), n = randInt(2, 5);
    for (let i = 0; i < n; i++) this.tone({ t: i * 0.09, f0: base * rand(0.9, 1.1), f1: base * rand(1.1, 1.4), dur: 0.06, gain: 0.03, pan });
  },
  cricket() {
    const pan = rand(-0.9, 0.9);
    for (let i = 0; i < 3; i++) this.tone({ t: i * 0.035, f0: 4300, dur: 0.022, gain: 0.02, pan, attack: 0.003 });
  },
};

// Little songs for the Chicken Radio and the Disco Ball
const Music = {
  radioOn: false, discoOn: false, next: 0, step: 0,
  melody: [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1046, 988, 784, 659, 587],
  bass: [131, 110, 98, 123],
  update() {
    if (!Sound.ready || (!this.radioOn && !this.discoOn)) { this.next = 0; return; }
    const c = Sound.ctx;
    if (this.next < c.currentTime) this.next = c.currentTime + 0.05;
    while (this.next < c.currentTime + 0.15) {
      const t = this.next - c.currentTime, i = this.step % 16;
      if (this.radioOn) Sound.tone({ type: "square", t, f0: this.melody[i], dur: 0.19, gain: 0.045, filter: "lowpass", ff: 1800 });
      if (this.discoOn) {
        if (i % 2 === 0) Sound.tone({ t, f0: 140, f1: 48, dur: 0.18, gain: 0.32 });
        else Sound.noise({ t, dur: 0.04, gain: 0.07, type: "highpass", f: 7000 });
        if (i % 4 === 2) Sound.tone({ type: "sawtooth", t, f0: this.bass[(this.step >> 2) % 4], dur: 0.2, gain: 0.07, filter: "lowpass", ff: 600 });
      }
      this.step++;
      this.next += 60 / 112 / 2;
    }
  },
};


/* ================================================================
   5. THE FARMS' MEMORY — everything we save between visits
   ================================================================ */
const game = {
  eggs: 0,              // eggs in your basket (your money!)
  farm: "backyard",     // which farm you're visiting right now
  time: 0.1,            // time of day: 0 = midnight-ish, 0.1 = morning, 0.75 = sunset
  day: 1,
  totalEggs: 0,         // every egg ever laid on your farms
  hints: {},            // which tips you've already seen
  muted: false,
};

// Each farm remembers its own birds, eggs, feeder and waterer.
function newFarmState(id) {
  return {
    unlocked: id === "backyard",
    tier: 1,              // only the Backyard coop can be upgraded
    feeder: 1,            // how full the feeder is (0 to 1)
    water: 1,             // how full the waterer is (0 to 1)
    doorClosed: false,    // did you tuck the chickens in tonight?
    decor: [],            // decorations in the coop: { uid, id, x, y }
    birds: [],
    yardEggs: [],         // eggs hidden in the grass { id, x, y, breed, golden, glint }
    nestEggs: [],         // eggs in the nest boxes { id, box, breed, golden }
  };
}
const farms = {};
for (const id of FARM_ORDER) farms[id] = newFarmState(id);
let F = farms.backyard;   // "F" is always the farm you're looking at
let nextId = 1;

// Things that only matter while the game is open (never saved)
const fx = {
  particles: [], grains: [], butterflies: [], fireflies: [], clouds: [],
  stars: [], flyers: [], crates: [], blades: [], cloudSprites: [],
};
const shown = { feeder: 1, water: 1 };   // what the troughs LOOK like (they fill up smoothly)
let scene = "yard";     // "yard" (outside on a farm) or "coop" (inside the Backyard coop)
let clock = 0;          // seconds since the page opened (for animations)
let started = false;    // true after the first tap
let welcomeMsg = "";


/* ================================================================
   6. SCREEN SIZE & WHERE THINGS GO
   ================================================================
   The game uses its own measuring units: the screen is always about
   768 units tall. That way it looks the same on every iPad.
*/
const $ = (id) => document.getElementById(id);
const skyCanvas = $("sky");
const worldCanvas = $("world");
const skyCtx = skyCanvas.getContext("2d");
const ctx = worldCanvas.getContext("2d");
const bgCanvas = document.createElement("canvas");    // the farm's grass & hills, painted once
const bgCtx = bgCanvas.getContext("2d");
const roomCanvas = document.createElement("canvas");  // the coop's walls & floor, painted once
const roomCtx = roomCanvas.getContext("2d");
const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

const view = { w: 0, h: 0, dpr: 1, s: 1, W: 1024, H: 768, horizon: 290 };
let places = {};
const placesCache = {};
const room = { floorY: 0, window: {}, door: {}, boxes: [], bars: [], slots: [], lantern: {} };

// How each bird house is shaped (in its own little measuring units)
const COOP_GEO = [
  null,
  { halfW: 106, floorH: 38, doorX: 24, rampLen: 28, roofTop: -182, glows: [[-35, -92, 34], [24, -62, 30]] },
  { halfW: 138, floorH: 46, doorX: 46, rampLen: 32, roofTop: -286, glows: [[-73, -111, 38], [-19, -111, 38], [46, -83, 36]] },
  { halfW: 186, floorH: 44, doorX: 0,  rampLen: 42, roofTop: -338, glows: [[-81, -118, 40], [81, -118, 40], [-44, -212, 36], [44, -212, 36], [0, -83, 40]] },
];
const HOUSE_GEO = {
  pond:   { halfW: 74,  floorH: 20, doorX: 0,  rampLen: 22, roofTop: -122, glows: [[0, -66, 18], [0, -38, 24]] },
  meadow: { halfW: 126, floorH: 24, doorX: 62, rampLen: 22, roofTop: -128, glows: [[-40, -62, 40], [62, -48, 24]] },
  lagoon: { halfW: 110, floorH: 26, doorX: 0,  rampLen: 20, roofTop: -214, glows: [[0, -84, 40], [-64, -128, 14], [64, -128, 14]] },
};
const houseGeo = (id = game.farm) => (id === "backyard" ? COOP_GEO[farms.backyard.tier] : HOUSE_GEO[id]);

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
  view.w = w; view.h = h; view.dpr = dpr;
  view.s = Math.min(h / 768, w / 1000);
  view.W = w / view.s;
  view.H = h / view.s;
  view.horizon = view.H * 0.38;
  for (const cv of [skyCanvas, worldCanvas]) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
  }
  spriteCache.clear();
  for (const k in placesCache) delete placesCache[k];
  places = computePlaces(game.farm);
  layoutInterior();
  buildStars();
  buildBlades();
  buildClouds();
  buildBackground();
  buildRoomBg();
  for (const c of F.birds) if (c.loc === "yard") { c.x = clampX(c.x); c.y = clampY(c.y); }
  for (const e of F.yardEggs) { e.x = clampX(e.x); e.y = clampY(e.y); }
}

// Where everything sits on each farm
function computePlaces(id) {
  const W = view.W, H = view.H, hz = view.horizon, g = H - hz, P = {};
  if (id === "backyard") {
    P.coop = { x: W * 0.2, y: hz + g * 0.36 };
    P.feeder = { x: W * 0.57, y: hz + g * 0.74 };
    P.waterer = { x: W * 0.79, y: hz + g * 0.64 };
    P.tree = { x: W * 0.9, y: hz + g * 0.16, kind: "oak" };
    P.dust = { x: W * 0.8, y: hz + g * 0.26 };
    P.fountain = { x: W * 0.43, y: hz + g * 0.22 };
  } else if (id === "pond") {
    P.coop = { x: W * 0.17, y: hz + g * 0.32 };
    P.feeder = { x: W * 0.2, y: hz + g * 0.8 };
    P.water = { x: W * 0.6, y: hz + g * 0.56, rx: W * 0.27, ry: g * 0.24 };
    P.tree = { x: W * 0.93, y: hz + g * 0.12, kind: "willow" };
  } else if (id === "meadow") {
    P.coop = { x: W * 0.2, y: hz + g * 0.34 };
    P.feeder = { x: W * 0.55, y: hz + g * 0.76 };
    P.waterer = { x: W * 0.77, y: hz + g * 0.66 };
    P.tree = { x: W * 0.9, y: hz + g * 0.15, kind: "apple" };
    P.dust = { x: W * 0.6, y: hz + g * 0.3 };
    P.windmill = { x: W * 0.7, y: hz - 30 };
  } else {
    P.coop = { x: W * 0.19, y: hz + g * 0.3 };
    P.feeder = { x: W * 0.22, y: hz + g * 0.8 };
    P.water = { x: W * 0.62, y: hz + g * 0.55, rx: W * 0.28, ry: g * 0.22 };
    P.tree = { x: W * 0.93, y: hz + g * 0.22, kind: "palm" };
    P.tree2 = { x: W * 0.36, y: hz + g * 0.1, kind: "palm" };
  }
  return P;
}
function placesFor(id) {
  if (id === game.farm) return places;
  return placesCache[id] || (placesCache[id] = computePlaces(id));
}

function layoutInterior() {
  const W = view.W, H = view.H, fy = H * 0.62, tier = farms.backyard.tier;
  room.floorY = fy;
  room.window = { x: W * 0.5 - 100, y: H * 0.12, w: 200, h: 136 };
  room.door = { x: W * 0.03, y: fy - 150, w: 108, h: 190 };
  const n = COOP_TIERS[tier].nestBoxes;
  const bw = 100, bh = 84, gap = 16, startX = room.door.x + room.door.w + 34;
  room.boxes = [];
  for (let i = 0; i < n; i++) room.boxes.push({ x: startX + i * (bw + gap), y: fy - 40 - bh, w: bw, h: bh });
  const x1 = Math.max(startX + n * (bw + gap) + 30, W * 0.6), x2 = W - 30;
  room.bars = [];
  room.slots = [];
  for (let i = 0; i < tier; i++) room.bars.push({ x1: x1 + i * 18, x2: x2 - i * 10, y: fy - 20 - i * 92 });
  for (const b of room.bars) {
    const count = Math.max(1, Math.floor((b.x2 - b.x1 - 40) / 64) + 1);
    for (let j = 0; j < count; j++) {
      room.slots.push({ x: b.x1 + 30 + (count > 1 ? j * ((b.x2 - b.x1 - 60) / (count - 1)) : (b.x2 - b.x1 - 60) / 2), y: b.y });
    }
  }
  const R = seeded(99);
  while (room.slots.length < COOP_TIERS[tier].capacity + 2) {
    room.slots.push({ x: lerp(W * 0.45, W * 0.9, R()), y: lerp(fy + 70, H - 40, R()) });
  }
  room.lantern = { x: W * 0.36, y: H * 0.26 };
}

const groundTop = () => view.horizon + 36;
const groundBottom = () => view.H - 26;
const depth = (y) => clamp((y - view.horizon) / (view.H - view.horizon));
const scaleAt = (y) => lerp(0.52, 1.12, depth(y));   // far away = small, close = big
const clampX = (x) => clamp(x, 30, view.W - 30);
const clampY = (y) => clamp(y, groundTop(), groundBottom());
const capacityOf = (id) => (id === "backyard" ? COOP_TIERS[farms.backyard.tier].capacity : FARMS[id].capacity);
const capacity = () => capacityOf(game.farm);
const nestCount = (id = game.farm) => (id === "backyard" ? COOP_TIERS[farms.backyard.tier].nestBoxes : FARMS[id].nests);
const troughSize = (id) => (id === "backyard" ? COOP_TIERS[farms.backyard.tier].troughSize : FARMS[id].trough);
const feederUse = (id = game.farm) => 1 / (SETTINGS.feederMeals * troughSize(id));
const watererUse = (id = game.farm) => 1 / (SETTINGS.watererDrinks * troughSize(id));
const naturalWater = (id = game.farm) => FARMS[id].water !== "waterer";
const houseName = (id = game.farm) => FARMS[id].house;
const w2s = (x, y) => ({ x: x * view.s, y: y * view.s });                     // game units -> screen
const panX = (x) => clamp((x / view.W) * 2 - 1, -1, 1) * 0.7;                // left/right speaker

// Where birds stand to walk up the ramp, and the house door itself
function rampFoot() {
  const c = places.coop, sc = scaleAt(c.y), geo = houseGeo();
  return { x: c.x + geo.doorX * sc, y: c.y + (geo.rampLen + 4) * sc };
}
function coopDoorPt() {
  const c = places.coop, sc = scaleAt(c.y), geo = houseGeo();
  return { x: c.x + geo.doorX * sc, y: c.y + 2 * sc };
}
function badgePos() {
  const c = places.coop, sc = scaleAt(c.y);
  return { x: c.x, y: c.y + houseGeo().roofTop * sc - 22 + Math.sin(clock * 2.4) * 3 };
}

// ---------- Ponds & lagoons ----------
function inWaterPt(x, y, k = 1, P = places) {
  const w = P.water;
  if (!w) return false;
  const dx = (x - w.x) / w.rx, dy = (y - w.y) / w.ry;
  return dx * dx + dy * dy < k * k;
}
function waterSpot() {
  const w = places.water, a = rand(TAU), r = Math.sqrt(Math.random()) * 0.75;
  return { x: w.x + Math.cos(a) * r * w.rx, y: w.y + Math.sin(a) * r * w.ry };
}
function shorePoint(x, y, P = places) {
  const w = P.water;
  let dx = (x - w.x) / w.rx, dy = (y - w.y) / w.ry;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  return { x: w.x + dx * w.rx * 1.18, y: w.y + dy * w.ry * 1.18 };
}

// Keep walking targets out from under houses, troughs and (for most birds) water
function avoidSpots(x, y, allowWater = false) {
  const c = places.coop, sc = scaleAt(c.y), geo = houseGeo();
  if (Math.abs(x - c.x) < geo.halfW * sc + 12 && y > c.y - 30 * sc && y < c.y + (geo.rampLen + 12) * sc) {
    y = c.y + (geo.rampLen + 16) * sc;
  }
  for (const p of [places.feeder, places.waterer]) {
    if (!p) continue;
    const s = scaleAt(p.y);
    if (Math.abs(x - p.x) < 44 * s && Math.abs(y - p.y) < 14 * s) y = p.y + 20 * s;
  }
  if (!allowWater && inWaterPt(x, y, 1.12)) { const s = shorePoint(x, y); x = s.x; y = s.y; }
  return [clampX(x), clampY(y)];
}


/* ================================================================
   7. TIME OF DAY
   ================================================================ */
// Sky colors through the day: [time, color at the top, color near the ground]
const SKY_KEYS = [
  [0.00, "#1B2448", "#3E4A7A"],
  [0.035, "#56679F", "#E8A58A"],
  [0.08, "#7EC3EE", "#FDE9C9"],
  [0.2, "#62BDF0", "#DDF2FB"],
  [0.62, "#62BDF0", "#DDF2FB"],
  [0.71, "#7C8CCB", "#FFC08A"],
  [0.77, "#3B3F7A", "#E08A78"],
  [0.84, "#141A3A", "#2E3766"],
  [1.00, "#1B2448", "#3E4A7A"],
];
function skyAt(t) {
  for (let i = 0; i < SKY_KEYS.length - 1; i++) {
    const a = SKY_KEYS[i], b = SKY_KEYS[i + 1];
    if (t >= a[0] && t <= b[0]) {
      const u = (t - a[0]) / (b[0] - a[0]);
      return [mix(a[1], b[1], u), mix(a[2], b[2], u)];
    }
  }
  return [SKY_KEYS[0][1], SKY_KEYS[0][2]];
}
// 0 = bright day, 1 = dark night
function darkness(t = game.time) {
  if (t < 0.07) return 1 - smooth(0, 0.07, t);
  if (t < 0.7) return 0;
  if (t < 0.8) return smooth(0.7, 0.8, t);
  return 1;
}
// How orange the light is (sunrise & sunset)
function warmth(t = game.time) {
  const bump = (c, r) => Math.max(0, 1 - Math.abs(t - c) / r);
  return Math.min(1, bump(0.745, 0.055) + bump(0.04, 0.04));
}
// Birds go in when the sun starts to set, and come out after sunrise
const isBedtime = (t = game.time) => t >= 0.72 || t < 0.015;


/* ================================================================
   8. MAKING BIRDS
   ================================================================ */
const SP = (c) => SPECIES[BREEDS[c.breed].species];       // what kind of bird is this?

function freshName() {
  const used = new Set();
  for (const id of FARM_ORDER) for (const c of farms[id].birds) used.add(c.name);
  const free = NAMES.filter((n) => !used.has(n));
  return free.length ? pick(free) : pick(NAMES) + " " + randInt(2, 99);
}

function makeBird(o = {}) {
  return {
    id: nextId++,
    breed: BREEDS[o.breed] ? o.breed : "rir",
    name: o.name || freshName(),
    x: o.x == null ? view.W * 0.5 : o.x,
    y: o.y == null ? view.horizon + (view.H - view.horizon) * 0.6 : o.y,
    z: 0, vz: 0,                       // height above the ground, and up/down speed
    growth: o.growth == null ? 1 : o.growth,   // 1 = grown up
    food: o.food == null ? rand(0.7, 1) : o.food,
    water: o.water == null ? rand(0.7, 1) : o.water,
    joy: o.joy == null ? 0.5 : o.joy,  // goes up with treats and petting
    laid: o.laid || 0,
    eggClock: o.eggClock == null ? rand(15, SETTINGS.eggEverySeconds) : o.eggClock,
    loc: "yard",                       // "yard", "coop" (sleeping inside) or "nest" (laying inside)
    nestBox: -1, nestClaim: -1, roostSlot: -1, wakeAt: 0.03,
    state: "idle", goal: null, t: rand(0.3, 1.5),
    tx: 0, ty: 0, speed: SETTINGS.henSpeed, moving: false,
    dir: Math.random() < 0.5 ? -1 : 1, // 1 = facing right, -1 = facing left
    walkPhase: rand(TAU), peckT: 0, biteT: 0, kicked: false,
    headDown: 0, headUp: 0, legKick: 0, beakOpen: 0, beakOpenT: 0,
    look: 0, lookT: rand(1, 3), blink: 0, blinkT: rand(1, 5),
    flapT: 0, tagT: 0, petGlow: 0, petAcc: 0, lastPurr: 0,
    sit: 0, sleep: 0, dance: false, popIn: 0, alpha: 1,
    wet: 0, tip: 0, preen: 0, fan: 0, oneLeg: 0,   // swimming, bottoms-up, preening, tail fan, one leg
    enterT: 0, ex0: 0, ey0: 0, pendingYardLay: false, needsSpot: false,
    pile: null, bfly: null, tagRect: null,
  };
}

const isBaby = (c) => c.growth < 0.55;
const growK = (c) => (isBaby(c) ? 0.6 : lerp(0.66, 1, (c.growth - 0.55) / 0.45));
const smallK = (c) => BREEDS[c.breed].small || 1;
const bodyH = (c) => (isBaby(c) ? 16 : SP(c).body * growK(c)) * SP(c).size * smallK(c);
const headH = (c) => (isBaby(c) ? 38 : SP(c).height * growK(c)) * SP(c).size * smallK(c);
const sinkOf = (c) => (SP(c).sink || 10) * c.wet * SP(c).size * (isBaby(c) ? 0.5 : 1);
const canWater = (c) => !!(SP(c).swim || SP(c).wade);
const speedOf = (c) => (isBaby(c) ? SETTINGS.chickSpeed : SETTINGS.henSpeed) * (SP(c).speedK || 1);
const rollGolden = () => Math.random() < SETTINGS.goldenEggChance;
const eggInterval = () => SETTINGS.eggEverySeconds * rand(0.8, 1.25);
const eggValueOf = (breed, golden) => (golden ? SETTINGS.goldenEggValue : SPECIES[BREEDS[breed].species].eggValue);
const babyWord = (key) => BREEDS[key].baby || SPECIES[BREEDS[key].species].baby;
const layBoostOf = (c) => (BREEDS[c.breed].layBoost || 1) * (SP(c).layBoost || 1);

// How a bird feels, from 0 (grumpy) to 1 (very happy)
function mood(c) {
  const need = Math.min(c.food, c.water);
  return clamp(0.72 * smooth(0.12, 0.55, need) + 0.28 * c.joy + 0.05);
}
function moodText(c) {
  if (c.loc !== "yard" && isBedtime()) return ["Fast asleep", "💤"];
  if (c.water < 0.2) return ["Thirsty", "💧"];
  if (c.food < 0.2) return ["Hungry", "🌽"];
  const m = mood(c);
  if (m > 0.72) return ["Happy", "😊"];
  if (m > 0.45) return ["Doing fine", "🙂"];
  return ["A bit grumpy", "😕"];
}


/* ================================================================
   9. THE BIRD BRAIN
   ================================================================
   Every bird has a "state" (what it's doing right now) and a "goal"
   (where it's headed). When it finishes something, think() picks
   what to do next — using that species' favorite activities ("acts").
*/
const INTERRUPTIBLE = new Set(["idle", "walk", "peck", "scratch", "dust", "treatPeck", "chase", "eat", "drink", "preen", "dabble", "display"]);
const TREAT_BUSY = new Set(["carried", "fall", "enter", "exit", "layYard", "song", "petted"]);

function updateNeeds(c, dt) {
  const rate = c.loc === "yard" ? 1 : 0.35;          // sleeping birds need less
  c.food = clamp(c.food - (dt / SETTINGS.hungerSeconds) * rate);
  if (naturalWater()) c.water = 1;                     // ponds and lagoons never run dry
  else c.water = clamp(c.water - (dt / SETTINGS.thirstSeconds) * rate);
  c.joy = clamp(c.joy - dt / 300);
  if (c.growth < 1 && c.food > 0.15 && c.water > 0.15) {
    c.growth = Math.min(1, c.growth + dt / SETTINGS.growUpSeconds);
    if (c.growth >= 1) grewUp(c);
  }
}

function grewUp(c) {
  toast(`${c.name} is all grown up! ${SP(c).icon}`);
  const sc = scaleAt(c.y);
  if (c.loc === "yard") sparkles(c.x, c.y, 50 * sc, 10, sc);
  Sound.sparkle();
}

// Pick an activity, using the species' favorite "acts" like a weighted spinner
function pickAct(c) {
  const acts = SP(c).acts, ok = [];
  let total = 0;
  for (const k in acts) {
    if (isBaby(c) && (k === "dust" || k === "display" || k === "preen")) continue;
    if ((k === "swim" || k === "wade") && !places.water) continue;
    if (k === "dust" && !places.dust) continue;
    ok.push(k);
    total += acts[k];
  }
  let r = Math.random() * total;
  for (const k of ok) { r -= acts[k]; if (r <= 0) return k; }
  return "idle";
}

function think(c) {
  c.pile = null;
  c.bfly = null;
  const S = SP(c);
  // Chickens, quail and friends don't like getting wet — back to shore!
  if (!canWater(c) && inWaterPt(c.x, c.y)) {
    const s = shorePoint(c.x, c.y);
    c.goal = "shore"; c.flapT = 0.6;
    walkTo(c, s.x, s.y, speedOf(c) * 1.3);
    return;
  }
  if (isBedtime()) {
    c.goal = "bed";
    const f = rampFoot();
    walkTo(c, f.x + rand(-8, 8), f.y + rand(0, 10), speedOf(c) * 1.3);
    return;
  }
  if (c.growth >= 1 && c.eggClock <= 0) { startLaying(c); return; }
  if (!naturalWater() && places.waterer && c.water < 0.45 && F.water > 0.02) { goToTrough(c, "drink"); return; }
  if (c.food < 0.45 && F.feeder > 0.02) { goToTrough(c, "eat"); return; }
  if (isBaby(c) && Math.random() < 0.55) {      // babies love to follow a grown-up around
    const mom = nearestAdult(c);
    if (mom) {
      c.goal = "follow";
      walkTo(c, mom.x - mom.dir * rand(18, 40) * scaleAt(mom.y), mom.y + rand(-10, 14), speedOf(c));
      return;
    }
  }
  if (S.chase) {
    const b = nearestButterfly(c, 260);
    if (b && Math.random() < 0.2) { c.goal = "chase"; c.bfly = b; c.state = "chase"; c.t = rand(2, 3.5); return; }
  }
  const act = pickAct(c);
  c.goal = null;
  switch (act) {
    case "wander": c.goal = "wander"; wanderNear(c); break;
    case "swim":
    case "wade": { c.goal = "swim"; const p = waterSpot(); walkTo(c, p.x, p.y, speedOf(c)); break; }
    case "peck":
      if (S.swim && c.wet > 0.5) { c.state = "dabble"; c.t = rand(1.5, 3); }   // bottoms up!
      else { c.state = "peck"; c.t = rand(1.2, 3); c.peckT = 0; }
      break;
    case "scratch": c.state = "scratch"; c.t = rand(1, 2.2); c.peckT = 0; break;
    case "dust": {
      c.goal = "dust";
      const s = places.dust, ss = scaleAt(s.y);
      walkTo(c, s.x + rand(-40, 40) * ss, s.y + rand(-8, 10), speedOf(c));
      break;
    }
    case "preen": c.state = "preen"; c.t = rand(1.5, 3.5); break;
    case "display": startDisplay(c); break;
    default: c.state = "idle"; c.t = rand(1, 2.6);
  }
}

// Turkeys and peacocks show off their tail fans
function startDisplay(c) {
  c.state = "display"; c.t = rand(3.5, 6); c.goal = null;
  const pan = panX(c.x);
  Sound.call(c, pan, 0.8);
  if (SP(c).voice === "peacock") Sound.rattle(pan, 0.9);
}

function walkTo(c, x, y, speed, allowWater = canWater(c)) {
  const [tx, ty] = avoidSpots(x, y, allowWater);
  c.tx = tx; c.ty = ty; c.speed = speed || speedOf(c);
  c.state = "walk";
}
function wanderNear(c) {
  const sc = scaleAt(c.y);
  let x = c.x, y = c.y;
  for (let i = 0; i < 6; i++) {
    x = c.x + rand(-200, 200) * sc;
    y = c.y + rand(-90, 90);
    // birds that don't swim pick walks that don't cut across the water
    if (canWater(c) || !places.water || !inWaterPt((x + c.x) / 2, (y + c.y) / 2, 1.05)) break;
  }
  walkTo(c, x, y, speedOf(c));
}
function goToTrough(c, kind) {
  const P = kind === "eat" ? places.feeder : places.waterer, sc = scaleAt(P.y);
  c.goal = kind;
  c.tx = clampX(P.x + rand(-1, 1) * 46 * sc);
  c.ty = clampY(P.y + rand(8, 22) * sc);
  c.speed = speedOf(c) * 1.15;
  c.state = "walk";
}
function nearestAdult(c) {
  let best = null, bd = 1e9;
  const sp = BREEDS[c.breed].species;
  for (const o of F.birds) {
    if (o === c || o.loc !== "yard" || isBaby(o) || BREEDS[o.breed].species !== sp) continue;
    if (o.state === "enter" || o.state === "exit" || o.state === "carried") continue;
    const d = Math.hypot(o.x - c.x, o.y - c.y);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}
function nearestButterfly(c, range) {
  let best = null, bd = range;
  for (const b of fx.butterflies) {
    const d = Math.hypot(b.x - c.x, b.y - c.y);
    if (d < bd && b.flee <= 0) { bd = d; best = b; }
  }
  return best;
}

// Step toward the target. Returns true when we've arrived.
function moveToward(c, dt) {
  const dx = c.tx - c.x, dy = c.ty - c.y;
  const d = Math.hypot(dx, dy);
  if (d < 3) return true;
  const persp = lerp(0.62, 1.08, depth(c.y));   // far away things move slower on screen
  const swimK = c.wet > 0.5 ? 0.8 : 1;
  const step = Math.min(d, c.speed * persp * swimK * dt);
  c.x += (dx / d) * step;
  c.y += (dy / d) * step;
  c.walkPhase += (step * (isBaby(c) ? 0.45 : 0.3)) / persp;
  if (Math.abs(dx) > 0.6) c.dir = dx > 0 ? 1 : -1;
  c.moving = true;
  return false;
}

function arrive(c) {
  switch (c.goal) {
    case "eat":
    case "drink": {
      const P = c.goal === "eat" ? places.feeder : places.waterer;
      c.state = c.goal; c.peckT = 0; c.t = 0;
      c.dir = P.x >= c.x ? 1 : -1;
      return;
    }
    case "treat":
      if (c.pile && c.pile.bites > 0) { c.state = "treatPeck"; c.peckT = 0; c.biteT = rand(0, 0.3); c.dir = c.pile.x >= c.x ? 1 : -1; }
      else think(c);
      return;
    case "lay":
      if (!F.doorClosed) startEnter(c);
      else { c.goal = "layYard"; c.state = "layYard"; c.t = rand(4, 6); }
      return;
    case "bed": startEnter(c); return;
    case "layYard": c.state = "layYard"; c.t = rand(4, 6); return;
    case "dust": c.state = "dust"; c.t = rand(4, 7); return;
    default: {
      const r = Math.random();
      c.goal = null;
      if (SP(c).swim && inWaterPt(c.x, c.y)) {        // floating on the pond
        if (r < 0.4) { c.state = "dabble"; c.t = rand(1.5, 3); }
        else { c.state = "idle"; c.t = rand(1.5, 3.5); }
      } else if (r < 0.5) { c.state = "peck"; c.t = rand(1, 2.5); c.peckT = 0; }
      else if (r < 0.7 && SP(c).acts.scratch) { c.state = "scratch"; c.t = rand(1, 2); c.peckT = 0; }
      else { c.state = "idle"; c.t = rand(0.8, 2.2); }
    }
  }
}

// ---------- Laying eggs ----------
function nestBusy(b, self) {
  return F.birds.some((o) => o !== self && ((o.loc === "nest" && o.nestBox === b) || (o.goal === "lay" && o.nestClaim === b)))
    || F.nestEggs.filter((e) => e.box === b).length >= SETTINGS.nestBoxHolds;
}
function freeNestBox(self) {
  for (let b = 0; b < nestCount(); b++) if (!nestBusy(b, self)) return b;
  return -1;
}
function startLaying(c) {
  const b = F.doorClosed ? -1 : freeNestBox(c);
  if (b >= 0 && Math.random() < 0.88) {
    c.goal = "lay"; c.nestClaim = b;
    const f = rampFoot();
    walkTo(c, f.x + rand(-6, 6), f.y + rand(0, 8), speedOf(c) * 1.1);
  } else {
    // Sometimes a bird picks a secret spot in the grass instead. Egg hunt!
    c.goal = "layYard";
    const sc = scaleAt(c.y);
    walkTo(c, c.x + rand(-140, 140) * sc, c.y + rand(-50, 50), speedOf(c), false);
  }
}
function finishLaying(c) {
  c.laid++;
  game.totalEggs++;
  c.eggClock = eggInterval();
  c.goal = null;
  c.nestClaim = -1;
}
function layerSong(c, pan, v) {
  if (SP(c).voice === "cluck") Sound.eggSong(pan, v); else Sound.call(c, pan, v);
}
function layEggInYard(c) {
  const sc = scaleAt(c.y);
  if (F.yardEggs.length < SETTINGS.maxYardEggs) {
    const [x, y] = avoidSpots(c.x - c.dir * 16 * sc, c.y + 2, false);
    F.yardEggs.push({ id: nextId++, x, y, breed: c.breed, golden: rollGolden(), glint: rand(0, 3) });
  }
  finishLaying(c);
  c.state = "song"; c.t = 1.6;
  layerSong(c, panX(c.x), 0.85);
  notes(c.x, c.y, headH(c) * sc, 4, sc);
}
function layEggInNest(c) {
  F.nestEggs.push({ id: nextId++, box: c.nestBox, breed: c.breed, golden: rollGolden() });
  finishLaying(c);
  c.state = "nestSong"; c.t = 1.6;
  if (scene === "coop") {
    const box = room.boxes[c.nestBox] || room.boxes[0];
    layerSong(c, panX(box.x), 1);
    notes(box.x + box.w / 2, box.y + 10, 40, 4, 1);
  } else {
    layerSong(c, panX(places.coop.x), 0.7);
    const sc = scaleAt(places.coop.y);
    notes(places.coop.x, places.coop.y, -houseGeo().roofTop * sc * 0.8, 4, sc);
  }
}

// ---------- Going in and out of the bird house ----------
function startEnter(c) {
  c.state = "enter"; c.enterT = 0; c.ex0 = c.x; c.ey0 = c.y;
}
function updateEnter(c, dt) {
  c.enterT = Math.min(1, c.enterT + dt / 0.9);
  const e = easeInOut(c.enterT), d = coopDoorPt(), sc = scaleAt(places.coop.y);
  c.x = lerp(c.ex0, d.x, e);
  c.y = lerp(c.ey0, d.y, e);
  c.z = e * houseGeo().floorH * sc;
  c.walkPhase += dt * 9;
  c.moving = true;
  c.alpha = 1 - smooth(0.55, 1, c.enterT);
  if (c.enterT >= 1) {
    c.alpha = 1; c.z = 0; c.moving = false;
    if (c.goal === "lay" && !isBedtime()) goNest(c);
    else goRoost(c);
  }
}
function goNest(c) {
  let b = c.nestClaim;
  if (b < 0 || nestBusy(b, c)) b = freeNestBox(c);
  c.nestClaim = -1;
  if (b < 0) { c.pendingYardLay = true; exitCoop(c); return; }
  c.loc = "nest"; c.nestBox = b;
  c.state = "nesting"; c.t = rand(6, 9);
  c.popIn = 1; c.sit = 1;
}
function goRoost(c) {
  c.loc = "coop"; c.nestBox = -1;
  c.roostSlot = freeRoostSlot(c);
  c.state = "roost"; c.goal = null;
  c.wakeAt = rand(0.018, 0.09);
  c.popIn = 1; c.sit = 1; c.wet = 0;
}
function freeRoostSlot(c) {
  const used = new Set(F.birds.filter((o) => o !== c && o.loc === "coop").map((o) => o.roostSlot));
  const n = game.farm === "backyard" ? room.slots.length : 99;
  for (let i = 0; i < n; i++) if (!used.has(i)) return i;
  return 0;
}
function exitCoop(c) {
  const d = coopDoorPt(), f = rampFoot();
  c.loc = "yard"; c.nestBox = -1; c.roostSlot = -1;
  c.state = "exit"; c.enterT = 1;
  c.ex0 = f.x + rand(-8, 8); c.ey0 = f.y + rand(0, 10);
  c.x = d.x; c.y = d.y; c.alpha = 0;
  c.sit = 0; c.sleep = 0; c.dance = false;
  if (!c.pendingYardLay) c.goal = null;
}
function updateExit(c, dt) {
  c.enterT = Math.max(0, c.enterT - dt / 0.9);
  const e = easeInOut(c.enterT), d = coopDoorPt(), sc = scaleAt(places.coop.y);
  c.x = lerp(c.ex0, d.x, e);
  c.y = lerp(c.ey0, d.y, e);
  c.z = e * houseGeo().floorH * sc;
  c.walkPhase += dt * 9;
  c.moving = true;
  c.dir = c.ex0 >= d.x ? 1 : -1;
  c.alpha = 1 - smooth(0.55, 1, c.enterT);
  if (c.enterT <= 0) {
    c.alpha = 1; c.z = 0;
    if (c.pendingYardLay) {
      c.pendingYardLay = false;
      c.goal = "layYard";
      walkTo(c, c.x + rand(40, 200) * sc, c.y + rand(20, 90), speedOf(c), false);
    } else {
      c.goal = "wander";
      walkTo(c, c.x + rand(60, 220) * sc, c.y + rand(20, 90) * sc, speedOf(c));
    }
  }
}

// ---------- One bird, out on the farm ----------
function updateYardBird(c, dt) {
  c.moving = false;
  const bedtime = isBedtime();

  // Is it standing in the water?
  const inW = !!places.water && inWaterPt(c.x, c.y);
  const wantWet = inW && c.z < 1 && c.state !== "carried" && c.state !== "enter" && c.state !== "exit" ? 1 : 0;
  c.wet += (wantWet - c.wet) * Math.min(1, dt * 5);
  if (inW && !canWater(c) && INTERRUPTIBLE.has(c.state) && c.goal !== "shore") think(c);

  // The egg clock: happy grown-ups get ready to lay
  if (c.growth >= 1 && !bedtime && c.goal !== "lay" && c.goal !== "layYard" && c.state !== "carried") {
    const m = mood(c);
    if (m > 0.35) c.eggClock -= dt * (0.6 + 0.8 * m) * layBoostOf(c);
    if (c.eggClock <= 0 && INTERRUPTIBLE.has(c.state) && c.goal !== "bed" && c.goal !== "shore") startLaying(c);
  }
  // Sunset: time to head for the house
  if (bedtime && c.goal !== "bed" && c.goal !== "shore" && INTERRUPTIBLE.has(c.state)) think(c);

  switch (c.state) {
    case "idle":
      c.t -= dt;
      c.lookT -= dt;
      if (c.lookT <= 0) { c.lookT = rand(0.8, 2.4); if (Math.random() < 0.35) c.dir *= -1; c.look = rand(-1, 1); }
      if (Math.random() < dt * 0.025) c.flapT = 0.5;
      if (c.t <= 0) think(c);
      break;
    case "walk":
      if (moveToward(c, dt)) arrive(c);
      break;
    case "peck":
      c.peckT += dt; c.t -= dt;
      if (c.t <= 0) think(c);
      break;
    case "scratch":
      c.peckT += dt; c.t -= dt;
      if (c.legKick > 0.85 && !c.kicked) { c.kicked = true; const sc = scaleAt(c.y); puffDust(c.x - c.dir * 18 * sc, c.y, sc, 2); }
      if (c.legKick < 0.2) c.kicked = false;
      if (c.t <= 0) { c.state = "peck"; c.t = rand(0.8, 1.6); c.peckT = 0; }
      break;
    case "dust":
      c.t -= dt;
      c.joy = clamp(c.joy + dt * 0.01);
      if (Math.random() < dt * 5) { const sc = scaleAt(c.y); puffDust(c.x + rand(-14, 14) * sc, c.y, sc, 1); }
      if (c.t <= 0) { c.flapT = 0.7; puffDust(c.x, c.y, scaleAt(c.y), 6); c.goal = null; think(c); }
      break;
    case "preen":
      c.t -= dt;
      if (c.t <= 0) think(c);
      break;
    case "dabble":
      c.t -= dt;
      c.food = clamp(c.food + dt * 0.01);
      if (Math.random() < dt * 2) { const sc = scaleAt(c.y); emit("drop", c.x + c.dir * 10 * sc, c.y, 4 * sc, { vz: rand(40, 80) * sc, vx: rand(-20, 20) * sc, life: 0.6, size: sc * 0.8 }); }
      if (c.t <= 0) think(c);
      break;
    case "display":
      c.t -= dt;
      if (c.t <= 0) think(c);
      break;
    case "eat":
      c.peckT += dt;
      if (F.feeder > 0.001) {
        const amt = Math.min(0.26 * dt, 1 - c.food);
        c.food += amt;
        F.feeder = Math.max(0, F.feeder - amt * feederUse());
        if (c.food >= 0.97) { c.goal = null; think(c); }
      } else {
        c.t += dt;
        if (c.t > 1.2) { c.goal = null; c.state = "idle"; c.t = rand(1, 2); }
      }
      break;
    case "drink":
      c.peckT += dt;
      if (F.water > 0.001) {
        const amt = Math.min(0.3 * dt, 1 - c.water);
        c.water += amt;
        F.water = Math.max(0, F.water - amt * watererUse());
        if (c.water >= 0.97) { c.goal = null; think(c); }
      } else {
        c.t += dt;
        if (c.t > 1.2) { c.goal = null; c.state = "idle"; c.t = rand(1, 2); }
      }
      break;
    case "treatPeck": {
      const pile = c.pile;
      c.peckT += dt;
      if (!pile || pile.bites <= 0) { c.pile = null; c.goal = null; c.state = "idle"; c.t = rand(0.3, 0.9); break; }
      c.biteT += dt;
      if (c.biteT > 0.55) { c.biteT = 0; pile.bites--; c.food = clamp(c.food + 0.04); c.joy = clamp(c.joy + 0.07); }
      break;
    }
    case "chase": {
      const b = c.bfly;
      c.t -= dt;
      if (!b || fx.butterflies.indexOf(b) < 0 || c.t <= 0) { c.bfly = null; c.goal = null; c.state = "idle"; c.t = rand(0.4, 1); break; }
      [c.tx, c.ty] = avoidSpots(b.x, b.y, canWater(c));
      c.speed = SETTINGS.runSpeed * 0.85;
      if (Math.hypot(c.tx - c.x, c.ty - c.y) > 18) moveToward(c, dt);
      else if (c.z <= 0 && b.z < 120 && b.flee <= 0) {
        const sc = scaleAt(c.y);
        c.vz = 250 * sc; c.flapT = 0.5;
        b.flee = 1.4; b.vx = (Math.random() < 0.5 ? -1 : 1) * 80;
        c.t = Math.min(c.t, 0.7);
        if (Math.random() < 0.5) Sound.call(c, panX(c.x), 0.5);
      }
      break;
    }
    case "layYard":
      c.t -= dt;
      if (c.t <= 0) layEggInYard(c);
      break;
    case "song":
      c.t -= dt;
      if (c.t <= 0) { c.goal = null; think(c); }
      break;
    case "petted":
      c.t -= dt;
      if (c.t <= 0) { c.state = "idle"; c.t = rand(0.4, 1.2); }
      break;
    case "enter": updateEnter(c, dt); break;
    case "exit": updateExit(c, dt); break;
    // "carried" follows your finger, and "fall" is handled just below
  }

  // Hopping & fluttering down (z = height above the grass)
  if (c.state !== "carried" && c.state !== "enter" && c.state !== "exit" && (c.z > 0 || c.vz > 0)) {
    const falling = c.state === "fall";
    c.vz -= (falling ? 320 : 1000) * dt;
    if (falling) c.vz = Math.max(c.vz, -170);
    c.z += c.vz * dt;
    if (c.z <= 0) { c.z = 0; c.vz = 0; if (falling) landed(c); }
  }
}

// ---------- One bird, inside its house ----------
function updateInsideBird(c, dt) {
  c.moving = false;
  c.z = 0;
  c.wet = 0;
  c.dance = Music.discoOn && scene === "coop";
  if (c.state === "nesting") {
    c.t -= dt;
    c.lookT -= dt;
    if (c.lookT <= 0) { c.lookT = rand(1, 3); c.look = rand(-1, 1); }
    if (c.t <= 0) layEggInNest(c);
  } else if (c.state === "nestSong") {
    c.t -= dt;
    if (c.t <= 0) { if (isBedtime()) goRoost(c); else exitCoop(c); }
  } else if (c.state === "roost") {
    if (!isBedtime() && game.time >= c.wakeAt && !F.doorClosed) exitCoop(c);
  } else {
    goRoost(c);
  }
}

// ---------- Poses: where the head, legs and tail are right now ----------
function peckCurve(t) {
  const x = t % 0.6;
  return x < 0.15 ? x / 0.15 : x < 0.25 ? 1 : x < 0.45 ? 1 - (x - 0.25) / 0.2 : 0;
}
function updatePose(c, dt) {
  let hd = 0, hu = 0, kick = 0;
  const s = c.state;
  if (s === "peck" || s === "treatPeck" || s === "eat") hd = peckCurve(c.peckT);
  else if (s === "drink") {
    // Dip the beak, then tip the head back to swallow — just like real chickens!
    const x = c.peckT % 1.4;
    hd = x < 0.3 ? x / 0.3 : x < 0.55 ? 1 : x < 0.7 ? 1 - (x - 0.55) / 0.15 : 0;
    hu = x > 0.62 && x < 1.1 ? Math.sin(((x - 0.62) / 0.48) * Math.PI) : 0;
  } else if (s === "scratch") {
    const x = c.peckT % 0.9;
    kick = x < 0.18 ? x / 0.18 : x < 0.34 ? 1 - (x - 0.18) / 0.16 : 0;
    hd = x > 0.45 && x < 0.8 ? 0.6 : 0;
  } else if (s === "song" || s === "nestSong") hu = 0.8;
  else if (s === "chase") hu = 0.35;
  // Flamingos feed with their heads upside-down in the water — slowly
  if (SP(c).wade && s === "peck") hd = 0.85 + Math.sin(c.peckT * 3) * 0.15;

  const k = Math.min(1, dt * 16);
  c.headDown += (hd - c.headDown) * k;
  c.headUp += (hu - c.headUp) * k;
  c.legKick += (kick - c.legKick) * Math.min(1, dt * 22);
  c.tip += ((s === "dabble" ? 1 : 0) - c.tip) * Math.min(1, dt * 5);
  c.preen += ((s === "preen" ? 1 : 0) - c.preen) * Math.min(1, dt * 5);
  c.fan += ((s === "display" ? 1 : 0) - c.fan) * Math.min(1, dt * (s === "display" ? 3 : 2));
  const restLeg = SP(c).wade && !isBaby(c) && (s === "idle" || s === "roost" || s === "nesting");
  c.oneLeg += ((restLeg ? 1 : 0) - c.oneLeg) * Math.min(1, dt * 3);

  if (c.beakOpenT > 0) c.beakOpenT -= dt;
  c.beakOpen = s === "song" || s === "nestSong" ? 0.5 + 0.5 * Math.sin(clock * 18) : c.beakOpenT > 0 ? 0.8 : 0;

  const wantSit = s === "nesting" || s === "nestSong" || s === "dust" || s === "roost" || s === "layYard" ? 1 : 0;
  c.sit += (wantSit - c.sit) * Math.min(1, dt * 5);
  c.sleep += ((s === "roost" && darkness() > 0.35 ? 1 : 0) - c.sleep) * Math.min(1, dt * 3);

  if (c.flapT > 0) c.flapT -= dt;
  if (c.tagT > 0) c.tagT -= dt;
  c.petGlow = Math.max(0, c.petGlow - dt * 0.7);
  c.blinkT -= dt;
  if (c.blinkT <= 0) { c.blink = 0.13; c.blinkT = rand(2, 6); }
  if (c.blink > 0) c.blink -= dt;
  if (c.popIn > 0) c.popIn = Math.max(0, c.popIn - dt * 3);
}

// Gently push birds apart so they don't stand inside each other
function separate(dt) {
  const list = F.birds.filter((c) => c.loc === "yard" && c.sit < 0.5 && c.state !== "carried" && c.state !== "enter" && c.state !== "exit" && c.state !== "fall");
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      const dx = b.x - a.x, dy = (b.y - a.y) * 1.8;
      const d = Math.hypot(dx, dy) || 0.01;
      const min = 24 * scaleAt((a.y + b.y) / 2) * Math.max(SP(a).size, SP(b).size);
      if (d < min) {
        const push = (min - d) * 0.5 * Math.min(1, dt * 8);
        const ux = dx / d, uy = dy / d / 1.8;
        a.x -= ux * push; a.y -= uy * push;
        b.x += ux * push; b.y += uy * push;
      }
    }
  }
}

function landed(c) {
  c.state = "idle"; c.t = rand(0.6, 1.4);
  c.flapT = 0.4;
  const sc = scaleAt(c.y);
  if (inWaterPt(c.x, c.y)) {
    Sound.splash(panX(c.x));
    for (let i = 0; i < 10; i++) emit("drop", c.x + rand(-10, 10) * sc, c.y, 6 * sc, { vz: rand(80, 160) * sc, vx: rand(-50, 50) * sc, life: 0.8, size: sc });
  } else {
    feathers(c, 2);
    puffDust(c.x, c.y, sc, 4);
  }
  Sound.call(c, panX(c.x), 0.6);
}


/* ================================================================
   10. FARMS YOU'RE NOT VISITING
   ================================================================
   Birds on other farms keep living: they eat from their feeder,
   grow up, and lay eggs into their house. We don't need to draw
   them, so this is much simpler than the full brain above.
*/
function simulateFarm(id, dt) {
  const st = farms[id], natural = naturalWater(id), bed = isBedtime();
  for (const c of st.birds) {
    c.food = clamp(c.food - (dt / SETTINGS.hungerSeconds) * 0.6);
    if (c.food < 0.5 && st.feeder > 0) {
      const amt = Math.min(1 - c.food, st.feeder / feederUse(id));
      c.food += amt;
      st.feeder = Math.max(0, st.feeder - amt * feederUse(id));
    }
    if (natural) c.water = 1;
    else {
      c.water = clamp(c.water - (dt / SETTINGS.thirstSeconds) * 0.6);
      if (c.water < 0.5 && st.water > 0) {
        const amt = Math.min(1 - c.water, st.water / watererUse(id));
        c.water += amt;
        st.water = Math.max(0, st.water - amt * watererUse(id));
      }
    }
    if (c.growth < 1 && c.food > 0.15 && c.water > 0.15) c.growth = Math.min(1, c.growth + dt / SETTINGS.growUpSeconds);
    c.loc = bed ? "coop" : "yard";
    if (c.growth >= 1 && !bed) {
      const m = mood(c);
      if (m > 0.35) c.eggClock -= dt * (0.6 + 0.8 * m) * layBoostOf(c);
      if (c.eggClock <= 0) {
        c.eggClock = eggInterval();
        c.laid++;
        game.totalEggs++;
        if (!addNestEggTo(id, c.breed, rollGolden())) addYardEggTo(id, c.breed, rollGolden());
      }
    }
  }
}
function addNestEggTo(id, breed, golden) {
  const st = farms[id];
  for (let b = 0; b < nestCount(id); b++) {
    if (st.nestEggs.filter((e) => e.box === b).length < SETTINGS.nestBoxHolds) {
      st.nestEggs.push({ id: nextId++, box: b, breed, golden });
      return true;
    }
  }
  return false;
}
function addYardEggTo(id, breed, golden) {
  const st = farms[id], P = placesFor(id);
  if (st.yardEggs.length >= SETTINGS.maxYardEggs) return false;
  let x = 0, y = 0;
  for (let i = 0; i < 8; i++) {
    x = rand(80, view.W - 80);
    y = rand(groundTop() + 30, groundBottom() - 20);
    if (!inWaterPt(x, y, 1.15, P)) break;
  }
  st.yardEggs.push({ id: nextId++, x, y, breed, golden, glint: rand(0, 3) });
  return true;
}
// Put a new bird on any farm (a chick you bought, or a welcome present)
function addBirdToFarm(id, breed, growth) {
  const st = farms[id], P = placesFor(id), sc = scaleAt(P.coop.y), geo = houseGeo(id);
  const c = makeBird({
    breed, growth, food: 0.9, water: 0.9, joy: 0.8,
    x: clampX(P.coop.x + (geo.halfW + rand(20, 120)) * sc), y: clampY(P.coop.y + rand(40, 100) * sc),
  });
  c.loc = isBedtime() ? "coop" : "yard";
  st.birds.push(c);
  return c;
}


/* ================================================================
   11. EVERYTHING ELSE THAT MOVES
   ================================================================ */
// ---------- Particles: hearts, feathers, dust, sparkles, music notes ----------
function emit(kind, x, y, z, o = {}) {
  if (fx.particles.length > (reduceMotion ? 80 : 260)) return null;
  const p = Object.assign({ kind, x, y, z, vx: 0, vy: 0, vz: 0, life: 1, size: 1, rot: 0, vr: 0, color: null, scene }, o);
  p.max = p.life;
  fx.particles.push(p);
  return p;
}
function puffDust(x, y, sc, n) {
  for (let i = 0; i < n; i++) emit("dust", x + rand(-8, 8) * sc, y + rand(-3, 3) * sc, rand(0, 6) * sc, { vz: rand(10, 30) * sc, vx: rand(-20, 20) * sc, life: rand(0.5, 0.9), size: rand(4, 8) * sc });
}
function hearts(x, y, z, sc) {
  emit("heart", x + rand(-10, 10) * sc, y, z, { vz: 45 * sc, vx: rand(-15, 15) * sc, life: 1.1, size: rand(7, 10) * sc });
}
function feathers(c, n) {
  const sc = c.loc === "yard" ? scaleAt(c.y) : 1;
  const col = isBaby(c) ? BREEDS[c.breed].chick : BREEDS[c.breed].body;
  for (let i = 0; i < n; i++) emit("feather", c.x + rand(-10, 10) * sc, c.y, c.z + 30 * sc, { vz: rand(20, 60) * sc, vx: rand(-40, 40) * sc, life: 1.6, rot: rand(TAU), vr: rand(-4, 4), size: 6 * sc, color: col });
}
function sparkles(x, y, z, n, sc, color) {
  for (let i = 0; i < n; i++) emit("sparkle", x + rand(-30, 30) * sc, y, z + rand(-20, 30) * sc, { vz: rand(-10, 30) * sc, vx: rand(-30, 30) * sc, life: rand(0.5, 1), size: rand(4, 8) * sc, color: color || "#FFF6C8" });
}
function notes(x, y, z, n, sc) {
  for (let i = 0; i < n; i++) emit("note", x + rand(-18, 18) * sc, y, z + i * 6 * sc, { vz: rand(30, 50) * sc, vx: rand(-15, 15) * sc, life: 1.3 + i * 0.1, size: sc, text: pick(["♪", "♫"]) });
}
function confetti(x, y, z, n, sc) {
  const cols = ["#F2C14E", "#C8452D", "#7FB54A", "#8FD3F4", "#F5BFCB", "#FFFFFF"];
  for (let i = 0; i < n; i++) emit("confetti", x, y, z, { vz: rand(120, 260) * sc, vx: rand(-90, 90) * sc, vy: rand(-12, 12) * sc, life: rand(1.2, 1.8), rot: rand(TAU), vr: rand(-8, 8), size: rand(3, 5) * sc, color: pick(cols) });
}
function plusText(x, y, z, text, sc) {
  emit("plus", x, y, z, { vz: 55 * sc, life: 1.2, size: sc, text });
}

function updateParticles(dt) {
  for (const p of fx.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.rot += p.vr * dt;
    switch (p.kind) {
      case "heart": p.vx *= 0.98; break;
      case "note": p.vx = Math.sin(p.life * 6) * 12 * p.size; break;
      case "zzz": p.vx = Math.sin(p.life * 3) * 8; break;
      case "plus": p.vz *= 0.97; break;
      case "feather":
        p.vz = Math.max(-18, p.vz - 120 * dt); p.vx *= 0.97;
        if (p.z < 0) { p.z = 0; p.vz = 0; p.vx = 0; p.vr = 0; }
        break;
      case "dust": p.size += dt * 8; p.vz *= 0.95; break;
      case "grain": case "drop": case "confetti":
        p.vz -= 500 * dt;
        if (p.z < 0) { p.z = 0; p.vz *= -0.25; p.vx *= 0.5; p.vy *= 0.5; }
        break;
    }
  }
  fx.particles = fx.particles.filter((p) => p.life > 0);
}

// ---------- Treats (scratch grains) ----------
function updateGrains(dt) {
  for (const p of fx.grains) p.t += dt;
  fx.grains = fx.grains.filter((p) => p.bites > 0 && p.t < 60);
}

// ---------- Butterflies (day) ----------
function newButterfly() {
  const left = Math.random() < 0.5;
  return {
    x: left ? -30 : view.W + 30, y: rand(groundTop() + 40, groundBottom() - 60),
    z: rand(40, 90), alt: rand(40, 90), speed: rand(40, 70), turn: left ? 0 : Math.PI,
    vx: 0, vy: 0, dir: left ? 1 : -1, t: rand(10), ph: rand(TAU), flapSpeed: rand(14, 20),
    rest: 0, flee: 0, color: pick(["#FFB84C", "#FF7EB6", "#7FB8FF", "#FFFFFF", "#FFE066"]),
  };
}
function updateButterflies(dt) {
  const day = darkness() < 0.3;
  if (day && scene === "yard" && fx.butterflies.length < 2 && Math.random() < dt * 0.3) fx.butterflies.push(newButterfly());
  for (const b of fx.butterflies) {
    b.t += dt;
    if (b.flee > 0) {
      b.flee -= dt;
      b.z += 90 * dt;
      b.x += b.vx * 2 * dt;
    } else if (b.rest > 0) {
      b.rest -= dt;
      b.z = Math.max(0, b.z - 45 * dt);
    } else {
      b.turn += rand(-1, 1) * dt * 2.2;
      if (b.y < groundTop() + 20) b.turn = Math.PI / 2 + rand(-0.5, 0.5);
      if (b.y > groundBottom() - 30) b.turn = -Math.PI / 2 + rand(-0.5, 0.5);
      if (!day) b.turn = b.x < view.W / 2 ? Math.PI : 0;      // head home at night
      b.vx = Math.cos(b.turn) * b.speed;
      b.vy = Math.sin(b.turn) * b.speed * 0.35;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z = lerp(b.z, b.alt + Math.sin(b.t * 2.2) * 10, Math.min(1, dt * 2));
      if (day && Math.random() < dt * 0.04 && !inWaterPt(b.x, b.y)) b.rest = rand(2, 4);
    }
    if (Math.abs(b.vx) > 1) b.dir = b.vx > 0 ? 1 : -1;
  }
  fx.butterflies = fx.butterflies.filter((b) => b.x > -60 && b.x < view.W + 60 && b.z < 360);
}

// ---------- Fireflies (night) ----------
function updateFireflies(dt) {
  const want = darkness() > 0.55 && scene === "yard" ? 16 : 0;
  if (fx.fireflies.length < want && Math.random() < dt * 4) {
    fx.fireflies.push({ x: rand(view.W), y: rand(groundTop(), view.H - 20), z: rand(20, 90), ph: rand(TAU), vx: rand(-12, 12), vy: rand(-6, 6), life: 1, boost: 0 });
  }
  for (const f of fx.fireflies) {
    f.ph += dt;
    f.vx = clamp(f.vx + rand(-20, 20) * dt, -20, 20);
    f.vy = clamp(f.vy + rand(-10, 10) * dt, -8, 8);
    f.x += f.vx * dt;
    f.y = clamp(f.y + f.vy * dt, groundTop() - 40, view.H - 10);
    f.z = clamp(f.z + Math.sin(f.ph * 1.3) * 8 * dt, 10, 120);
    if (f.boost > 0) f.boost -= dt;
    if (want === 0) f.life -= dt * 0.5;
  }
  fx.fireflies = fx.fireflies.filter((f) => f.life > 0 && f.x > -40 && f.x < view.W + 40);
}

function updateClouds(dt) {
  for (const c of fx.clouds) {
    c.x += c.v * dt;
    if (c.x > view.W + 40) c.x = -c.w - 40;
  }
}

// ---------- New babies arrive in a little crate ----------
function updateCrates(dt) {
  for (const cr of fx.crates) {
    cr.t += dt;
    if (!cr.opened && cr.t >= 1.1) {
      cr.opened = true;
      const sc = scaleAt(cr.y);
      const c = makeBird({ breed: cr.breed, x: cr.x + 18 * sc, y: cr.y + 6, growth: 0.12, food: 0.9, water: 0.9, joy: 0.8 });
      c.vz = 190 * sc; c.tagT = 3.5; c.state = "idle"; c.t = 1;
      F.birds.push(c);
      Sound.call(c, panX(cr.x));
      confetti(cr.x, cr.y, 40 * sc, 16, sc);
      save();
    }
  }
  fx.crates = fx.crates.filter((cr) => cr.t < 3.4);
}

// ---------- Eggs flying into your basket ----------
function updateFlyers(dt) {
  for (const f of fx.flyers) {
    f.t += dt;
    if (f.t >= f.dur && !f.done) {
      f.done = true;
      Sound.chime();
      if (f.golden) Sound.golden();
    }
  }
  if (fx.flyers.some((f) => f.done)) {
    fx.flyers = fx.flyers.filter((f) => !f.done);
    updateHud();
    bumpBasket();
  }
}

// ---------- Sparkly decorations, music notes, sleepy Zzz's ----------
function updateSceneFx(dt) {
  if (scene === "coop") {
    for (const d of F.decor) {
      if (d.bounce > 0) d.bounce = Math.max(0, d.bounce - dt);
      const def = DECOR_BY_ID[d.id], r = decorRect(d);
      if (def.sparkle && Math.random() < dt * 0.9) emit("sparkle", r.cx + rand(-0.4, 0.4) * r.size, r.cy + rand(-0.4, 0.4) * r.size, 0, { life: 0.8, size: rand(4, 7), color: "#FFF4C2" });
      if (def.toy === "radio" && Music.radioOn && Math.random() < dt * 2) emit("note", r.cx + rand(-10, 10), r.cy, r.size * 0.4, { vz: 40, life: 1.4, size: 1.1, text: pick(["♪", "♫"]) });
    }
    for (const e of F.nestEggs) if (e.golden && Math.random() < dt * 1.5) { const p = nestEggPos(e); emit("sparkle", p.x + rand(-12, 12), p.y, rand(8, 30), { life: 0.7, size: rand(3, 6), color: "#FFF1A8" }); }
    for (const c of F.birds) {
      if (c.loc === "coop" && c.sleep > 0.8 && Math.random() < dt * 0.6) { const p = insidePos(c); emit("zzz", p.x + 8, p.y, 44, { vz: 22, life: 2.2, size: 1 }); }
    }
  } else if (darkness() > 0.5 && F.birds.some((c) => c.loc === "coop") && Math.random() < dt * 0.7) {
    const sc = scaleAt(places.coop.y), g0 = houseGeo().glows[0];
    emit("zzz", places.coop.x + g0[0] * sc, places.coop.y, -g0[1] * sc + 10, { vz: 18 * sc, life: 2.4, size: sc });
  }
}

// ---------- Background sounds: birds by day, crickets by night ----------
let ambientT = 2, callT = 5;
function updateAmbient(dt) {
  if (!Sound.ready) return;
  ambientT -= dt;
  if (ambientT <= 0) {
    const d = darkness();
    if (scene === "yard" && d < 0.5) { Sound.tweet(); ambientT = rand(2.5, 7); }
    else if (d > 0.6) { Sound.cricket(); ambientT = rand(0.35, 1.1); }
    else ambientT = 1;
  }
  callT -= dt;
  if (callT <= 0) {
    callT = rand(3.5, 9);
    const awake = F.birds.filter((c) => c.loc === "yard" && c.state !== "enter" && c.state !== "exit");
    if (scene === "yard" && awake.length) {
      const c = pick(awake);
      Sound.call(c, panX(c.x), 0.45);
      c.beakOpenT = 0.25;
    }
  }
}

// ---------- Big moments in the day ----------
function timeEvents(prev, t) {
  const B = farms.backyard;
  if (B.doorClosed && !isBedtime(t)) {
    B.doorClosed = false;
    if (game.farm === "backyard") Sound.thunk();
    const hens = B.birds.filter((c) => c.growth >= 1);
    if (hens.length && addNestEggTo("backyard", pick(hens).breed, false)) {
      if (started) toast("Good morning! 🌅 A thank-you egg is waiting in the coop.", 3200);
    } else if (started) toast("Good morning! 🌅");
  } else if (prev < 0.03 && t >= 0.03 && started) {
    toast("Good morning! 🌅");
  }
  if (prev < 0.7 && t >= 0.7 && started) toast("🌇 The sun is setting. The birds will head to bed soon.", 3200);
}


/* ================================================================
   12. PAINTING: SKY, FARMS, HOUSES, TREES, WATER
   ================================================================ */

// Each farm's colors and scenery
const SCENERY = {
  backyard: {
    hill1: "#B6D99C", hill2: "#9FCB7C", trees: "#79AE59", treeHi: "#93C46E",
    g: ["#AAD56F", "#8DC455", "#6BAA3B"], tuft: ["#6FA84A", "#7DB957", "#5E9A3C", "#8BC663"],
    flowers: ["#FFFFFF", "#FFF3A6", "#FFD1E3"], flowerCount: 70, tufts: 900,
    dirt: "#C9A36B", fence: "wood", far: "barn",
  },
  pond: {
    hill1: "#B3D6A6", hill2: "#96C68A", trees: "#6FA768", treeHi: "#8CBF7E",
    g: ["#A5D47A", "#86C05A", "#64A63E"], tuft: ["#5E9E40", "#71B04E", "#4E8E36", "#85C35E"],
    flowers: ["#FFFFFF", "#FFE680"], flowerCount: 50, tufts: 800,
    dirt: "#B8A06E", fence: null, far: "birches",
    water: { deep: "#3D8FC0", shallow: "#7CC7E6", rim: "#B99C6A", rimW: 0.08 },
  },
  meadow: {
    hill1: "#C9DE9A", hill2: "#AFD07A", trees: "#86B45A", treeHi: "#A2C972",
    g: ["#C8DC7C", "#A9CD5E", "#84B443"], tuft: ["#8DB64E", "#A2C55C", "#7AA543", "#C2C86A"],
    flowers: ["#FFFFFF", "#FFD84C", "#F28AB0", "#A98CF2", "#FF8A5C", "#7FB8FF"], flowerCount: 320, tufts: 1200,
    dirt: "#C9A36B", fence: "rail", far: "bales",
  },
  lagoon: {
    hill1: "#9FD6C0", hill2: "#7CC4A6", trees: "#4FA67A", treeHi: "#6DBE92",
    g: ["#A9DB84", "#86C766", "#5DAE4A"], tuft: ["#5FA848", "#7BC158", "#4E9A3C", "#8FD06A"],
    flowers: ["#FF5A6E", "#FF8FB1", "#FFD166"], flowerCount: 60, tufts: 700,
    dirt: "#E6D2A0", fence: null, far: "mountains",
    water: { deep: "#1FB5B8", shallow: "#A6EDE3", rim: "#EBD8A4", rimW: 0.16 },
  },
};

// ---------- Things we paint once and reuse ----------
function buildStars() {
  const R = seeded(7);
  fx.stars = [];
  for (let i = 0; i < 120; i++) fx.stars.push({ x: R() * view.W, y: R() * view.horizon * 0.95, r: 0.5 + R() * 1.3, tw: 1 + R() * 2.5, ph: R() * TAU });
}
function buildBlades() {
  const R = seeded(11);
  fx.blades = [];
  const cols = game.farm === "meadow" ? ["#8DB64E", "#A2C55C", "#C2B45A", "#7AA543"] : ["#5E9E34", "#6FAE3E", "#78B847", "#4F8E2C"];
  const tall = game.farm === "meadow" ? 1.6 : 1;
  for (let x = -10; x < view.W + 10; x += 14 + R() * 16) {
    fx.blades.push({ x, h: (16 + R() * 34) * tall, w: 2.5 + R() * 2.5, ph: R() * TAU, lean: (R() - 0.5) * 12, col: cols[Math.floor(R() * cols.length)], seed: game.farm === "meadow" && R() < 0.3 });
  }
}
function makeCloudSprite(w, seed) {
  const R = seeded(seed), h = w * 0.5, px = view.dpr * view.s;
  const cv = document.createElement("canvas");
  cv.width = Math.ceil(w * px);
  cv.height = Math.ceil(h * px);
  const g = cv.getContext("2d");
  g.scale(px, px);
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, "#FFFFFF");
  gr.addColorStop(1, "#DFEAF3");
  g.fillStyle = gr;
  for (let i = 0; i < 7; i++) {
    const x = w * (0.18 + 0.64 * (i / 6)) + (R() - 0.5) * 12;
    const r = h * (0.22 + R() * 0.2) * (1 - (Math.abs(i - 3) / 6) * 0.6);
    circle(g, x, h * 0.62 - r * 0.45, r);
    g.fill();
  }
  ellipse(g, w / 2, h * 0.7, w * 0.4, h * 0.16);
  g.fill();
  return cv;
}
function buildClouds() {
  fx.cloudSprites = [makeCloudSprite(240, 3), makeCloudSprite(200, 5), makeCloudSprite(280, 9)];
  if (!fx.clouds.length) {
    for (let i = 0; i < 5; i++) {
      const w = rand(170, 280);
      fx.clouds.push({ x: rand(-100, view.W), y: rand(24, view.horizon * 0.5), w, h: w * 0.5, v: rand(4, 10), a: rand(0.8, 1), sprite: i % 3 });
    }
  } else for (const c of fx.clouds) c.y = Math.min(c.y, view.horizon * 0.55);
}

// A pond or lagoon: a muddy/sandy rim, then water that's deeper in the middle
function paintWater(g, w, colors) {
  g.save();
  g.translate(w.x, w.y);
  g.scale(1, w.ry / w.rx);
  const R = w.rx;
  const rg = g.createRadialGradient(0, 0, R * 0.92, 0, 0, R * (1 + colors.rimW));
  rg.addColorStop(0, rgba(colors.rim, 1));
  rg.addColorStop(1, rgba(colors.rim, 0));
  g.fillStyle = rg;
  circle(g, 0, 0, R * (1 + colors.rimW));
  g.fill();
  const wg = g.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.1, 0, 0, R);
  wg.addColorStop(0, colors.deep);
  wg.addColorStop(0.7, mix(colors.deep, colors.shallow, 0.55));
  wg.addColorStop(1, colors.shallow);
  g.fillStyle = wg;
  circle(g, 0, 0, R);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,.35)";
  g.lineWidth = 2.5;
  circle(g, 0, 0, R * 0.985);
  g.stroke();
  g.restore();
}

// The farm's ground, hills, fence and grass — painted once into bgCanvas
function buildBackground() {
  const id = game.farm, SC = SCENERY[id], P = places;
  const W = view.W, H = view.H, hz = view.horizon;
  bgCanvas.width = worldCanvas.width;
  bgCanvas.height = worldCanvas.height;
  const g = bgCtx;
  g.setTransform(view.dpr * view.s, 0, 0, view.dpr * view.s, 0, 0);
  g.clearRect(0, 0, W, H);
  const R = seeded(20240521 + FARM_ORDER.indexOf(id) * 7);
  const hillY = (x, base, amp, f, ph) => base - amp * (0.55 + 0.3 * Math.sin(x * f + ph) + 0.15 * Math.sin(x * f * 2.7 + ph * 2));
  const hill = (base, amp, f, ph, color) => {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(0, hz + 40);
    for (let x = 0; x <= W + 20; x += 16) g.lineTo(x, hillY(x, base, amp, f, ph));
    g.lineTo(W + 20, hz + 40);
    g.closePath();
    g.fill();
  };

  // Faraway things
  if (SC.far === "mountains") {       // tropical mountains behind the lagoon
    g.fillStyle = "#9CC9C8";
    for (const [x, h, w] of [[0.1, 170, 260], [0.34, 120, 200], [0.78, 190, 300]]) {
      g.beginPath(); g.moveTo(W * x - w, hz); g.quadraticCurveTo(W * x, hz - h * 1.9, W * x + w, hz); g.closePath(); g.fill();
    }
  }
  hill(hz + 2, 84, 0.0045, 1.3 + FARM_ORDER.indexOf(id), SC.hill1);
  hill(hz + 6, 46, 0.0075, 4.1 + FARM_ORDER.indexOf(id) * 0.7, SC.hill2);
  const h2 = (x) => hillY(x, hz + 6, 46, 0.0075, 4.1 + FARM_ORDER.indexOf(id) * 0.7);
  for (let i = 0; i < 16; i++) {
    const x = R() * W, y = h2(x) + 6, r = 9 + R() * 9;
    if (SC.far === "birches" && i % 3 === 0) {           // white birch trunks
      g.strokeStyle = "#F2F0EA"; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - r * 2.2); g.stroke();
    }
    g.fillStyle = SC.trees;
    circle(g, x, y - r * 0.6, r); g.fill();
    circle(g, x + r * 0.8, y - r * 0.3, r * 0.75); g.fill();
    g.fillStyle = SC.treeHi;
    circle(g, x - r * 0.25, y - r * 0.95, r * 0.45); g.fill();
  }
  if (SC.far === "barn") {            // a little red farm on the hill
    const bx = W * 0.64, by = h2(bx) + 4;
    g.fillStyle = "#B8402C"; g.fillRect(bx - 14, by - 14, 28, 14);
    g.fillStyle = "#6E3A2E"; g.beginPath(); g.moveTo(bx - 17, by - 13); g.lineTo(bx, by - 25); g.lineTo(bx + 17, by - 13); g.closePath(); g.fill();
    g.fillStyle = "#F4EFE6"; g.fillRect(bx - 4, by - 9, 8, 9);
    g.fillStyle = "#C9CED2"; g.fillRect(bx + 19, by - 26, 9, 26);
    g.fillStyle = "#AEB5BA"; ellipse(g, bx + 23.5, by - 26, 4.5, 3.5); g.fill();
  }

  // The grass
  const gg = g.createLinearGradient(0, hz, 0, H);
  gg.addColorStop(0, SC.g[0]);
  gg.addColorStop(0.45, SC.g[1]);
  gg.addColorStop(1, SC.g[2]);
  g.fillStyle = gg;
  g.fillRect(0, hz, W, H - hz);
  for (let i = 0; i < 28; i++) {
    const y = hz + 20 + R() * (H - hz), sc = scaleAt(y), rx = (60 + R() * 110) * sc;
    g.fillStyle = R() < 0.5 ? "rgba(255,255,255,.05)" : "rgba(40,90,20,.06)";
    ellipse(g, R() * W, y, rx, rx * 0.22);
    g.fill();
  }
  // Sand all around the lagoon (painted first so the grass tufts sit on top of the edges)
  if (id === "lagoon") {
    const w = P.water;
    g.save(); g.translate(w.x, w.y + 6); g.scale(1, w.ry / w.rx);
    const sg = g.createRadialGradient(0, 0, w.rx * 0.9, 0, 0, w.rx * 1.45);
    sg.addColorStop(0, rgba("#EFDDAA", 1)); sg.addColorStop(0.75, rgba("#EFDDAA", 0.85)); sg.addColorStop(1, rgba("#EFDDAA", 0));
    g.fillStyle = sg; circle(g, 0, 0, w.rx * 1.45); g.fill();
    g.restore();
  }
  // Grass tufts and little flowers (none in the water)
  g.lineCap = "round";
  for (let i = 0; i < SC.tufts; i++) {
    const y = hz + 22 + Math.pow(R(), 0.85) * (H - hz - 22), x = R() * W, sc = scaleAt(y);
    const tuft = SC.tuft[Math.floor(R() * 4)], h = (6 + R() * 5) * (id === "meadow" ? 1.5 : 1);
    if (inWaterPt(x, y, id === "lagoon" ? 1.35 : 1.05)) continue;
    g.strokeStyle = tuft;
    g.lineWidth = 1.4 * sc;
    g.beginPath();
    for (let k = -1; k <= 1; k++) { g.moveTo(x + k * 2 * sc, y); g.lineTo(x + k * 4 * sc, y - h * sc); }
    g.stroke();
  }
  for (let i = 0; i < SC.flowerCount; i++) {
    const y = hz + 40 + R() * (H - hz - 40), x = R() * W, sc = scaleAt(y);
    if (inWaterPt(x, y, 1.2)) continue;
    const big = id === "meadow" ? 1.3 : id === "lagoon" ? 1.8 : 1;
    g.fillStyle = SC.flowers[Math.floor(R() * SC.flowers.length)];
    for (let k = 0; k < 5; k++) { circle(g, x + Math.cos(k * 1.26) * 2.6 * sc * big, y + Math.sin(k * 1.26) * 1.6 * sc * big, 1.7 * sc * big); g.fill(); }
    g.fillStyle = "#F2C14E"; circle(g, x, y, 1.3 * sc * big); g.fill();
  }
  // Bare, scratched-up dirt by the house and troughs — birds wear out the grass!
  const dirt = (x, y, rx, col) => {
    g.save();
    g.translate(x, y);
    g.scale(1, 0.3);
    const gr = g.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx);
    gr.addColorStop(0, rgba(col, 0.92));
    gr.addColorStop(0.6, rgba(col, 0.55));
    gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr;
    circle(g, 0, 0, rx);
    g.fill();
    g.restore();
    g.fillStyle = "rgba(110,75,40,.3)";
    for (let k = 0; k < 30; k++) { const a = R() * TAU, d = Math.sqrt(R()) * rx * 0.7; circle(g, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.3, 1.2 * scaleAt(y)); g.fill(); }
  };
  const c = P.coop, csc = scaleAt(c.y), geo = houseGeo(id);
  dirt(c.x + 10 * csc, c.y + (geo.rampLen + 14) * csc, (geo.halfW + 80) * csc, SC.dirt);
  dirt(P.feeder.x, P.feeder.y + 6, 96 * scaleAt(P.feeder.y), SC.dirt);
  if (P.waterer) dirt(P.waterer.x, P.waterer.y + 6, 84 * scaleAt(P.waterer.y), SC.dirt);
  if (P.dust) dirt(P.dust.x, P.dust.y + 4, 90 * scaleAt(P.dust.y), "#B38A55");

  // The water, and what grows around it
  if (P.water) {
    const w = P.water;
    paintWater(g, w, SC.water);
    if (id === "pond") {
      // lily pads, some with pink flowers
      for (let i = 0; i < 12; i++) {
        const a = R() * TAU, d = 0.35 + R() * 0.5;
        const x = w.x + Math.cos(a) * d * w.rx, y = w.y + Math.sin(a) * d * w.ry, sc = scaleAt(y), r = (9 + R() * 7) * sc;
        g.fillStyle = "#4F9A45";
        g.beginPath(); g.moveTo(x, y); g.ellipse(x, y, r, r * 0.42, 0, 0.35, TAU - 0.05); g.closePath(); g.fill();
        g.fillStyle = "rgba(255,255,255,.18)"; ellipse(g, x - r * 0.25, y - r * 0.12, r * 0.4, r * 0.14); g.fill();
        if (R() < 0.35) { g.fillStyle = "#F7A8C4"; for (let k = 0; k < 5; k++) { circle(g, x + Math.cos(k * 1.26) * 2.6 * sc, y - 2 * sc + Math.sin(k * 1.26) * 1.4 * sc, 2 * sc); g.fill(); } g.fillStyle = "#F2C14E"; circle(g, x, y - 2 * sc, 1.3 * sc); g.fill(); }
      }
      // cattails along the far bank
      for (let i = 0; i < 26; i++) {
        const a = Math.PI + 0.25 + R() * (Math.PI - 0.5);
        const x = w.x + Math.cos(a) * w.rx * 1.02, y = w.y + Math.sin(a) * w.ry * 1.02, sc = scaleAt(y);
        const h = (24 + R() * 22) * sc;
        g.strokeStyle = "#5E8E3A"; g.lineWidth = 1.6 * sc;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3 * sc, y - h * 0.5, x + (R() - 0.5) * 8 * sc, y - h); g.stroke();
        if (R() < 0.6) { g.fillStyle = "#7A4E2A"; ellipse(g, x + 1 * sc, y - h * 0.85, 2.2 * sc, 5.5 * sc); g.fill(); }
      }
      // a little wooden dock
      const a = Math.PI * 0.72, sx = w.x + Math.cos(a) * w.rx, sy = w.y + Math.sin(a) * w.ry;
      const ex = lerp(sx, w.x, 0.35), ey = lerp(sy, w.y, 0.35), s1 = scaleAt(sy), s2 = scaleAt(ey);
      g.fillStyle = "#8A6038";
      for (const t of [0.2, 0.6, 0.95]) { const px = lerp(sx, ex, t), py = lerp(sy, ey, t), s = scaleAt(py); g.fillRect(px - 16 * s, py, 3 * s, 12 * s); g.fillRect(px + 13 * s, py, 3 * s, 12 * s); }
      g.fillStyle = "#B98555";
      g.beginPath(); g.moveTo(sx - 18 * s1, sy); g.lineTo(sx + 18 * s1, sy); g.lineTo(ex + 18 * s2, ey); g.lineTo(ex - 18 * s2, ey); g.closePath(); g.fill();
      g.strokeStyle = "rgba(90,55,30,.5)"; g.lineWidth = 1.4;
      for (let k = 1; k < 8; k++) { const t = k / 8, px = lerp(sx, ex, t), py = lerp(sy, ey, t), s = scaleAt(py); g.beginPath(); g.moveTo(px - 18 * s, py); g.lineTo(px + 18 * s, py); g.stroke(); }
    } else {
      // smooth grey rocks at the lagoon's edge
      for (let i = 0; i < 9; i++) {
        const a = R() * TAU, x = w.x + Math.cos(a) * w.rx * 1.05, y = w.y + Math.sin(a) * w.ry * 1.05, sc = scaleAt(y), r = (7 + R() * 9) * sc;
        g.fillStyle = "#A7A6A0"; ellipse(g, x, y, r, r * 0.6); g.fill();
        g.fillStyle = "rgba(255,255,255,.3)"; ellipse(g, x - r * 0.3, y - r * 0.25, r * 0.4, r * 0.2); g.fill();
      }
    }
  }
  // Hibiscus bushes on the lagoon, round hay bales in the meadow
  if (id === "lagoon") {
    for (let i = 0; i < 9; i++) {
      const y = hz + 40 + R() * (H - hz - 60), x = R() * W, sc = scaleAt(y);
      if (inWaterPt(x, y, 1.5) || Math.abs(x - P.coop.x) < 150 * sc) continue;
      g.fillStyle = "#3E8E4A";
      for (let k = 0; k < 5; k++) { circle(g, x + (k - 2) * 9 * sc, y - (8 + (k % 2) * 6) * sc, 10 * sc); g.fill(); }
      for (let k = 0; k < 4; k++) {
        const fx0 = x + (k - 1.5) * 11 * sc, fy0 = y - (12 + (k % 2) * 7) * sc;
        g.fillStyle = k % 2 ? "#FF5A6E" : "#FF8FB1";
        for (let p = 0; p < 5; p++) { circle(g, fx0 + Math.cos(p * 1.26) * 3 * sc, fy0 + Math.sin(p * 1.26) * 3 * sc, 2.6 * sc); g.fill(); }
        g.fillStyle = "#FFE08A"; circle(g, fx0, fy0, 1.2 * sc); g.fill();
      }
    }
  }
  if (SC.far === "bales") {
    for (const [fxr, dy] of [[0.33, 14], [0.4, 22], [0.86, 18], [0.08, 26]]) {
      const x = W * fxr, y = hz + dy, sc = scaleAt(y);
      g.fillStyle = "#D8B25E"; roundRect(g, x - 18 * sc, y - 24 * sc, 36 * sc, 24 * sc, 6 * sc); g.fill();
      g.fillStyle = "#C49A48"; ellipse(g, x + 16 * sc, y - 12 * sc, 7 * sc, 12 * sc); g.fill();
      g.strokeStyle = "rgba(120,85,30,.5)"; g.lineWidth = 1;
      g.beginPath(); g.arc(x + 16 * sc, y - 12 * sc, 5 * sc, 0, 4.5); g.stroke();
    }
  }

  // Fences at the back of the farm
  const fy = hz + 22, fsc = scaleAt(fy);
  if (SC.fence === "wood") {
    g.fillStyle = "#B8895A";
    g.fillRect(0, fy - 21 * fsc, W, 3.5 * fsc);
    g.fillRect(0, fy - 11 * fsc, W, 3.5 * fsc);
    for (let x = 6; x < W; x += 34) {
      g.fillStyle = "#A77B4E"; g.fillRect(x - 2.6 * fsc, fy - 27 * fsc, 5.2 * fsc, 28 * fsc);
      g.fillStyle = "#C79C6C"; g.fillRect(x - 2.6 * fsc, fy - 27 * fsc, 1.8 * fsc, 28 * fsc);
    }
  } else if (SC.fence === "rail") {   // a zig-zag split-rail fence
    g.strokeStyle = "#9C7A50"; g.lineWidth = 3 * fsc; g.lineCap = "round";
    for (const off of [8, 17]) {
      g.beginPath();
      for (let x = 0, k = 0; x <= W + 30; x += 30, k++) { const y = fy - off * fsc + (k % 2 ? 4 : -2) * fsc; if (k === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
    }
    g.fillStyle = "#8A6A44";
    for (let x = 0; x <= W + 30; x += 60) g.fillRect(x - 2 * fsc, fy - 24 * fsc, 4 * fsc, 26 * fsc);
  }
}

// ---------- The sky (its own canvas, behind the farm) ----------
function drawSky() {
  const g = skyCtx, W = view.W, H = view.H, hz = view.horizon, t = game.time, d = darkness();
  g.setTransform(view.dpr * view.s, 0, 0, view.dpr * view.s, 0, 0);
  const [top, bot] = skyAt(t);
  const gr = g.createLinearGradient(0, 0, 0, hz + 30);
  gr.addColorStop(0, top);
  gr.addColorStop(1, bot);
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);

  if (d > 0.05) {
    for (const s of fx.stars) {
      g.fillStyle = `rgba(255,255,240,${d * (0.55 + 0.45 * Math.sin(clock * s.tw + s.ph))})`;
      circle(g, s.x, s.y, s.r);
      g.fill();
    }
  }
  // The sun rises on the left and sets on the right
  const sp = (t - 0.01) / 0.76;
  if (sp > 0 && sp < 1) {
    const x = lerp(-0.06, 1.06, sp) * W, y = hz + 10 - Math.sin(sp * Math.PI) * hz * 0.72;
    const low = 1 - Math.sin(sp * Math.PI);
    glow(g, x, y, 120, `rgba(255,236,190,${0.5 - 0.2 * low})`);
    g.fillStyle = mix("#FFF7DC", "#FFB066", low * 0.85);
    circle(g, x, y, 30);
    g.fill();
  }
  // The moon
  const mp = t >= 0.72 ? (t - 0.72) / 0.36 : t < 0.08 ? (t + 0.28) / 0.36 : -1;
  if (mp > 0 && mp < 1) {
    const x = lerp(-0.06, 1.06, mp) * W, y = hz + 10 - Math.sin(mp * Math.PI) * hz * 0.68;
    glow(g, x, y, 90, "rgba(210,225,255,.22)");
    g.fillStyle = "#F4F1E4"; circle(g, x, y, 22); g.fill();
    g.fillStyle = "rgba(200,194,178,.55)";
    circle(g, x - 7, y - 4, 4.5); g.fill();
    circle(g, x + 6, y + 6, 3.2); g.fill();
    circle(g, x + 5, y - 8, 2.2); g.fill();
  }
  for (const c of fx.clouds) {
    g.globalAlpha = lerp(0.95, 0.2, d) * c.a;
    g.drawImage(fx.cloudSprites[c.sprite], c.x, c.y, c.w, c.h);
  }
  g.globalAlpha = 1;
}


// ---------- The farm you're visiting ----------
function drawYard(g) {
  g.drawImage(bgCanvas, 0, 0, view.W, view.H);
  if (places.water) drawWaterFx(g);
  if (places.windmill) drawAt(g, places.windmill, drawWindmill);
  drawShadows(g);

  // Everything is drawn back-to-front, so closer things cover farther things
  const list = [];
  list.push({ y: places.coop.y, f: drawHouseAt });
  list.push({ y: places.feeder.y, f: () => drawAt(g, places.feeder, drawFeeder, shown.feeder) });
  if (places.waterer) list.push({ y: places.waterer.y, f: () => drawAt(g, places.waterer, drawWaterer, shown.water) });
  for (const t of [places.tree, places.tree2]) if (t) list.push({ y: t.y, f: () => drawAt(g, t, drawTreeKind, t.kind) });
  if (game.farm === "backyard" && F.tier >= 3) list.push({ y: places.fountain.y, f: () => drawAt(g, places.fountain, drawFountain) });
  for (const p of fx.grains) list.push({ y: p.y - 1, f: () => drawGrain(g, p) });
  for (const e of F.yardEggs) list.push({ y: e.y, f: () => drawYardEgg(g, e) });
  for (const cr of fx.crates) list.push({ y: cr.y, f: () => drawCrate(g, cr) });
  for (const c of F.birds) if (c.loc === "yard") list.push({ y: c.y + 0.01, f: () => drawBirdAt(g, c, c.x, c.y, scaleAt(c.y)) });
  for (const b of fx.butterflies) list.push({ y: b.y, f: () => drawButterfly(g, b) });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) it.f(g);

  drawParticles(g);
  drawForeground(g);
  lightYard(g);
  drawYardUI(g);
}

function drawAt(g, place, fn, arg) {
  const sc = scaleAt(place.y);
  g.save();
  g.translate(place.x, place.y);
  g.scale(sc, sc);
  fn(g, arg);
  g.restore();
}

function drawShadows(g) {
  const fade = 1 - 0.6 * darkness();
  const sh = (x, y, rx, ry, a) => { g.fillStyle = `rgba(46,70,20,${a * fade})`; ellipse(g, x, y, rx, ry); g.fill(); };
  const c = places.coop, sc = scaleAt(c.y), geo = houseGeo();
  sh(c.x + 10 * sc, c.y + 4 * sc, geo.halfW * 1.05 * sc, 20 * sc, 0.22);
  for (const t of [places.tree, places.tree2]) {
    if (!t) continue;
    const st = scaleAt(t.y), k = t.kind === "palm" ? 0.55 : 1;
    sh(t.x - 10 * st, t.y + 6 * st, 160 * st * k, 36 * st * k, 0.2);
  }
  for (const p of [places.feeder, places.waterer]) { if (!p) continue; const s = scaleAt(p.y); sh(p.x, p.y + 2, 42 * s, 10 * s, 0.24); }
  for (const ch of F.birds) {
    if (ch.loc !== "yard" || ch.wet > 0.5) continue;
    const s = scaleAt(ch.y) * growK(ch) * SP(ch).size * smallK(ch), lift = clamp(1 - ch.z / 200, 0.3, 1);
    sh(ch.x, ch.y + 1, (22 * lift + 4) * s, (6 * lift + 1) * s, 0.24 * ch.alpha);
  }
  for (const b of fx.butterflies) { const s = scaleAt(b.y); sh(b.x, b.y, 7 * s, 2 * s, 0.12); }
}

// Little sparkly ripples moving across the water
function drawWaterFx(g) {
  const w = places.water, lagoon = game.farm === "lagoon";
  g.save();
  ellipse(g, w.x, w.y, w.rx * 0.98, w.ry * 0.98);
  g.clip();
  g.strokeStyle = lagoon ? "rgba(255,255,255,.4)" : "rgba(255,255,255,.28)";
  g.lineCap = "round";
  for (let i = 0; i < 18; i++) {
    const row = i / 18, y = w.y - w.ry * 0.85 + row * w.ry * 1.7, sc = scaleAt(y);
    const span = w.rx * 2;
    const x = w.x - w.rx + ((i * 97 + clock * 12 * (i % 2 ? 1 : -1)) % span + span) % span;
    const len = (10 + (i % 4) * 5) * sc;
    g.lineWidth = 1.6 * sc;
    g.beginPath(); g.moveTo(x - len, y); g.quadraticCurveTo(x, y - 2 * sc, x + len, y); g.stroke();
  }
  g.restore();
}

function drawHouseAt(g) {
  const c = places.coop, sc = scaleAt(c.y);
  g.save();
  g.translate(c.x, c.y);
  g.scale(sc, sc);
  drawHouse(g, game.farm, F.tier, darkness(), F.doorClosed);
  g.restore();
}

// ---------- Bird houses ----------
function drawHouse(g, id, tier, d, closed) {
  if (id === "pond") duckHouse(g, d);
  else if (id === "meadow") hutch(g, d);
  else if (id === "lagoon") pavilion(g, d);
  else if (tier === 1) coopT1(g, d, closed);
  else if (tier === 2) coopT2(g, d, closed);
  else coopT3(g, d, closed);
}
function drawCoopWindow(g, x, y, w, h, d, frame) {
  const lit = d > 0.3;
  g.fillStyle = lit ? mix("#BFE3F2", "#FFD27A", clamp((d - 0.3) / 0.4)) : "#BFE3F2";
  roundRect(g, x, y, w, h, 3); g.fill();
  if (!lit) {
    g.fillStyle = "rgba(255,255,255,.55)";
    g.beginPath(); g.moveTo(x + 3, y + h - 3); g.lineTo(x + w * 0.55, y + 3); g.lineTo(x + w * 0.8, y + 3); g.lineTo(x + w * 0.25, y + h - 3); g.closePath(); g.fill();
  }
  g.strokeStyle = frame || "#F4EADB";
  g.lineWidth = 3.5;
  roundRect(g, x, y, w, h, 3); g.stroke();
  g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke();
}
function archWindow(g, cx, top, w, h, d) {
  const x = cx - w / 2;
  const path = () => { g.beginPath(); g.moveTo(x, top + h); g.lineTo(x, top + w / 2); g.arc(cx, top + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, top + h); g.closePath(); };
  path();
  g.fillStyle = d > 0.3 ? mix("#CFE9F7", "#FFD98A", clamp((d - 0.3) / 0.4)) : "#CFE9F7";
  g.fill();
  g.strokeStyle = "#E6B23A"; g.lineWidth = 3.5; path(); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.moveTo(cx, top + 2); g.lineTo(cx, top + h); g.stroke();
}
function drawCoopDoor(g, cx, bottom, w, h, d, closed, arch, frame) {
  const x = cx - w / 2, y = bottom - h;
  const path = () => {
    if (arch) { g.beginPath(); g.moveTo(x, bottom); g.lineTo(x, y + w / 2); g.arc(cx, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, bottom); g.closePath(); }
    else roundRect(g, x, y, w, h, 5);
  };
  path();
  if (closed) {
    g.fillStyle = "#8A5A36"; g.fill();
    g.save(); path(); g.clip();
    g.strokeStyle = "rgba(60,35,15,.4)"; g.lineWidth = 1.5;
    for (let k = x + 8; k < x + w; k += 8) { g.beginPath(); g.moveTo(k, y); g.lineTo(k, bottom); g.stroke(); }
    g.strokeStyle = "#F4EADB"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x + 3, y + 8); g.lineTo(x + w - 3, bottom - 4); g.moveTo(x + w - 3, y + 8); g.lineTo(x + 3, bottom - 4); g.stroke();
    g.restore();
  } else {
    const gr = g.createLinearGradient(0, y, 0, bottom);
    gr.addColorStop(0, "#23150C");
    gr.addColorStop(1, "#4A2E1A");
    g.fillStyle = gr; g.fill();
    if (d > 0.3) { g.fillStyle = `rgba(255,170,80,${0.4 * d})`; path(); g.fill(); }
  }
  g.strokeStyle = frame || "#F4EADB"; g.lineWidth = 3; path(); g.stroke();
}
function drawRamp(g, cx, top, len, fancy) {
  g.fillStyle = fancy ? "#D8354A" : "#B98555";
  g.beginPath(); g.moveTo(cx - 12, top); g.lineTo(cx + 12, top); g.lineTo(cx + 19, len); g.lineTo(cx - 19, len); g.closePath(); g.fill();
  if (fancy) {
    g.strokeStyle = "#E6B23A"; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(cx - 12, top); g.lineTo(cx - 19, len); g.moveTo(cx + 12, top); g.lineTo(cx + 19, len); g.stroke();
  } else {
    g.strokeStyle = "rgba(90,55,30,.55)"; g.lineWidth = 2;
    for (let k = 1; k < 6; k++) { const y = lerp(top, len, k / 6), hw = lerp(12, 19, k / 6); g.beginPath(); g.moveTo(cx - hw, y); g.lineTo(cx + hw, y); g.stroke(); }
  }
}
function flowerBox(g, x, y, w) {
  g.fillStyle = "#3E7A2E";
  for (let k = 0; k < w; k += 7) { circle(g, x + 4 + k, y - 2, 3.2); g.fill(); }
  const cols = ["#F2C14E", "#F28AB0", "#FFFFFF"];
  for (let k = 0; k < w - 4; k += 8) { g.fillStyle = cols[(k / 8) % 3]; circle(g, x + 6 + k, y - 5, 2.6); g.fill(); }
  g.fillStyle = "#7A5134"; g.fillRect(x, y, w, 9);
}
function gableLines(g, x0, x1, bottom, topAt, color) {
  g.strokeStyle = color; g.lineWidth = 1.5;
  for (let x = x0; x < x1; x += 14) { g.beginPath(); g.moveTo(x, bottom); g.lineTo(x, topAt(x)); g.stroke(); }
}

function coopT1(g, d, closed) {
  const wall = "#D9A066", wallDark = "#B97F48";
  g.fillStyle = "#5E4029"; g.fillRect(-64, -38, 8, 38); g.fillRect(56, -38, 8, 38);
  g.fillStyle = "#7A5134"; g.fillRect(-80, -42, 160, 9);
  const wg = g.createLinearGradient(-76, 0, 76, 0);
  wg.addColorStop(0, wallDark); wg.addColorStop(0.5, wall); wg.addColorStop(1, "#E6B47C");
  g.fillStyle = wg;
  g.fillRect(-76, -124, 152, 84);
  g.beginPath(); g.moveTo(-76, -123); g.lineTo(0, -168); g.lineTo(76, -123); g.closePath(); g.fill();
  gableLines(g, -62, 76, -40, (x) => -123 - 45 * (1 - Math.abs(x) / 76), "rgba(110,70,35,.28)");
  g.fillStyle = "#F4EADB"; g.fillRect(-79, -126, 6, 88); g.fillRect(73, -126, 6, 88); g.fillRect(-79, -44, 158, 5);
  g.lineJoin = "round"; g.lineCap = "round";
  g.strokeStyle = "#7E2A1C"; g.lineWidth = 18;
  g.beginPath(); g.moveTo(-92, -113); g.lineTo(0, -176); g.lineTo(92, -113); g.stroke();
  g.strokeStyle = "#C24A33"; g.lineWidth = 13;
  g.beginPath(); g.moveTo(-92, -116); g.lineTo(0, -179); g.lineTo(92, -116); g.stroke();
  g.fillStyle = "#5B3A24"; circle(g, 0, -142, 8); g.fill();
  g.strokeStyle = "#F4EADB"; g.lineWidth = 2.5; g.stroke();
  drawCoopWindow(g, -50, -106, 30, 28, d);
  // the little nest box sticking out the side (real coops have these!)
  g.fillStyle = wallDark; g.fillRect(76, -106, 28, 46);
  g.fillStyle = "#C24A33";
  g.beginPath(); g.moveTo(74, -104); g.lineTo(108, -114); g.lineTo(108, -104); g.closePath(); g.fill();
  drawCoopDoor(g, 24, -42, 32, 50, d, closed);
  drawRamp(g, 24, -42, 28, false);
}

function coopT2(g, d, closed) {
  g.fillStyle = "#5E4029"; g.fillRect(-104, -46, 9, 46); g.fillRect(96, -46, 9, 46);
  g.fillStyle = "#6E4A2E"; g.fillRect(-126, -50, 252, 10);
  const wg = g.createLinearGradient(-120, 0, 120, 0);
  wg.addColorStop(0, "#9C2F22"); wg.addColorStop(0.55, "#B83B2C"); wg.addColorStop(1, "#C94B3A");
  g.fillStyle = wg;
  g.fillRect(-120, -164, 240, 118);
  g.beginPath(); g.moveTo(-120, -163); g.lineTo(-96, -207); g.lineTo(0, -232); g.lineTo(96, -207); g.lineTo(120, -163); g.closePath(); g.fill();
  gableLines(g, -108, 120, -48, (x) => {
    const ax = Math.abs(x);
    return ax > 96 ? -163 - (120 - ax) / 24 * 44 : -207 - (96 - ax) / 96 * 25;
  }, "rgba(60,15,10,.22)");
  g.strokeStyle = "#F4EFE6"; g.lineWidth = 6; g.strokeRect(-120, -164, 240, 116);
  g.lineJoin = "round"; g.lineCap = "round";
  const roof = (off) => { g.beginPath(); g.moveTo(-136, -154 + off); g.lineTo(-102, -212 + off); g.lineTo(0, -240 + off); g.lineTo(102, -212 + off); g.lineTo(136, -154 + off); g.stroke(); };
  g.strokeStyle = "#3F3B3A"; g.lineWidth = 20; roof(3);
  g.strokeStyle = "#5E5856"; g.lineWidth = 14; roof(0);
  g.fillStyle = "#8E2A1F"; g.fillRect(-24, -208, 48, 38);
  g.strokeStyle = "#F4EFE6"; g.lineWidth = 3;
  g.strokeRect(-24, -208, 48, 38);
  g.beginPath(); g.moveTo(-24, -208); g.lineTo(24, -170); g.moveTo(24, -208); g.lineTo(-24, -170); g.stroke();
  g.strokeStyle = "#F2CD6B"; g.lineWidth = 2;
  g.beginPath(); for (let k = -18; k <= 18; k += 5) { g.moveTo(k, -170); g.lineTo(k + 3, -163); } g.stroke();
  drawCoopWindow(g, -92, -130, 38, 34, d);
  drawCoopWindow(g, -38, -130, 38, 34, d);
  flowerBox(g, -95, -94, 44);
  flowerBox(g, -41, -94, 44);
  drawCoopDoor(g, 46, -50, 46, 74, d, closed);
  drawRamp(g, 46, -50, 32, false);
  g.strokeStyle = "#2F2A24"; g.fillStyle = "#2F2A24"; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(0, -240); g.lineTo(0, -268); g.moveTo(-14, -258); g.lineTo(14, -258); g.stroke();
  ellipse(g, 0, -274, 9, 6); g.fill();
  circle(g, 8, -281, 3.6); g.fill();
  g.beginPath(); g.moveTo(-8, -276); g.lineTo(-16, -286); g.lineTo(-5, -280); g.closePath(); g.fill();
}

function coopT3(g, d, closed) {
  const gold = "#E6B23A", blue = "#7C9BE6";
  g.fillStyle = "#C9971F"; g.fillRect(-132, -44, 9, 44); g.fillRect(124, -44, 9, 44);
  g.fillStyle = gold; g.fillRect(-156, -48, 312, 9);
  turret(g, -158, d); turret(g, 158, d);
  const wg = g.createLinearGradient(0, -160, 0, -44);
  wg.addColorStop(0, "#FFF8EA"); wg.addColorStop(1, "#F7E6C8");
  g.fillStyle = wg; g.fillRect(-130, -164, 260, 118);
  g.fillStyle = "#F5BFCB"; g.fillRect(-130, -86, 260, 40);
  g.fillStyle = gold; g.fillRect(-130, -88, 260, 4); g.fillRect(-134, -168, 268, 7);
  archWindow(g, -81, -142, 30, 46, d);
  archWindow(g, 81, -142, 30, 46, d);
  drawCoopDoor(g, 0, -48, 48, 80, d, closed, true, gold);
  g.fillStyle = wg; g.fillRect(-88, -250, 176, 84);
  archWindow(g, -44, -238, 28, 42, d);
  archWindow(g, 44, -238, 28, 42, d);
  g.fillStyle = "#F28AB0"; drawHeart(g, 0, -222, 9);
  g.strokeStyle = gold; g.lineWidth = 3;
  g.beginPath(); g.moveTo(-104, -168); g.lineTo(104, -168); g.moveTo(-104, -184); g.lineTo(104, -184);
  for (let x = -100; x <= 100; x += 12) { g.moveTo(x, -168); g.lineTo(x, -184); }
  g.stroke();
  g.fillStyle = blue; g.beginPath(); g.ellipse(0, -250, 96, 54, 0, Math.PI, 0); g.fill();
  g.fillStyle = "rgba(255,255,255,.25)"; ellipse(g, -32, -276, 26, 13, -0.4); g.fill();
  g.strokeStyle = gold; g.lineWidth = 5; g.beginPath(); g.moveTo(-98, -250); g.lineTo(98, -250); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.moveTo(0, -304); g.lineTo(0, -336); g.stroke();
  g.fillStyle = gold; circle(g, 0, -304, 5); g.fill();
  flag(g, 0, -336, "#E8445A");
  drawRamp(g, 0, -48, 42, true);
}
function turret(g, x, d) {
  const gold = "#E6B23A";
  g.fillStyle = "#FFF3DC"; g.fillRect(x - 23, -224, 46, 176);
  g.fillStyle = gold;
  for (const y of [-224, -152, -88]) g.fillRect(x - 25, y, 50, 5);
  archWindow(g, x, -200, 16, 30, d);
  g.fillStyle = "#7C9BE6";
  g.beginPath(); g.moveTo(x - 31, -220); g.lineTo(x, -288); g.lineTo(x + 31, -220); g.closePath(); g.fill();
  g.strokeStyle = gold; g.lineWidth = 3;
  g.beginPath(); g.moveTo(x - 31, -220); g.lineTo(x + 31, -220); g.moveTo(x, -288); g.lineTo(x, -308); g.stroke();
  flag(g, x, -308, x < 0 ? "#F2C14E" : "#7FB54A");
}
function flag(g, x, y, color) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x, y);
  for (let i = 0; i <= 6; i++) { const t = i / 6; g.lineTo(x + t * 26, y + Math.sin(clock * 5 - t * 4) * 3 * t); }
  for (let i = 6; i >= 0; i--) { const t = i / 6; g.lineTo(x + t * 26, y + 12 + Math.sin(clock * 5 - t * 4) * 3 * t); }
  g.closePath();
  g.fill();
}

// A little blue A-frame duck house by the pond
function duckHouse(g, d) {
  g.fillStyle = "#5E4029"; g.fillRect(-52, -20, 7, 20); g.fillRect(45, -20, 7, 20);
  g.fillStyle = "#7A5134"; g.fillRect(-64, -24, 128, 7);
  const wg = g.createLinearGradient(-60, 0, 60, 0);
  wg.addColorStop(0, "#6FA8CC"); wg.addColorStop(1, "#A9D6EC");
  g.fillStyle = wg;
  g.beginPath(); g.moveTo(-60, -22); g.lineTo(0, -110); g.lineTo(60, -22); g.closePath(); g.fill();
  g.strokeStyle = "rgba(40,80,110,.25)"; g.lineWidth = 1.4;
  for (let y = -34; y > -104; y -= 10) { const hw = 60 * (1 - (-22 - y) / 88); g.beginPath(); g.moveTo(-hw, y); g.lineTo(hw, y); g.stroke(); }
  g.lineJoin = "round"; g.lineCap = "round";
  g.strokeStyle = "#35607E"; g.lineWidth = 13;
  g.beginPath(); g.moveTo(-72, -16); g.lineTo(0, -120); g.lineTo(72, -16); g.stroke();
  g.strokeStyle = "#F4EFE6"; g.lineWidth = 3;
  g.beginPath(); g.moveTo(-66, -18); g.lineTo(0, -112); g.lineTo(66, -18); g.stroke();
  // round window like a boat porthole
  g.fillStyle = d > 0.3 ? mix("#CFE9F7", "#FFD98A", clamp((d - 0.3) / 0.4)) : "#CFE9F7";
  circle(g, 0, -70, 9); g.fill();
  g.strokeStyle = "#F4EFE6"; g.lineWidth = 3; circle(g, 0, -70, 9); g.stroke();
  drawCoopDoor(g, 0, -24, 30, 34, d, false, true);
  drawRamp(g, 0, -24, 22, false);
}

// A long wooden hutch with a wire-mesh front, for the meadow birds
function hutch(g, d) {
  g.fillStyle = "#5E4029"; for (const x of [-108, -2, 100]) g.fillRect(x, -26, 8, 26);
  g.fillStyle = "#7A5134"; g.fillRect(-116, -30, 232, 8);
  const wg = g.createLinearGradient(0, -104, 0, -30);
  wg.addColorStop(0, "#D6A970"); wg.addColorStop(1, "#B98755");
  g.fillStyle = wg; g.fillRect(-110, -104, 220, 76);
  g.strokeStyle = "rgba(100,60,30,.3)"; g.lineWidth = 1.5;
  for (let y = -94; y < -30; y += 11) { g.beginPath(); g.moveTo(-110, y); g.lineTo(110, y); g.stroke(); }
  // the wire-mesh run
  g.fillStyle = d > 0.3 ? `rgba(90,60,30,${0.5 + 0.3 * d})` : "rgba(60,45,30,.55)";
  g.fillRect(-100, -94, 124, 56);
  g.strokeStyle = "rgba(220,225,230,.55)"; g.lineWidth = 1;
  for (let x = -100; x <= 24; x += 8) { g.beginPath(); g.moveTo(x, -94); g.lineTo(x, -38); g.stroke(); }
  for (let y = -94; y <= -38; y += 8) { g.beginPath(); g.moveTo(-100, y); g.lineTo(24, y); g.stroke(); }
  g.strokeStyle = "#8A6038"; g.lineWidth = 4; g.strokeRect(-100, -94, 124, 56);
  g.strokeStyle = "#F2CD6B"; g.lineWidth = 2;
  g.beginPath(); for (let x = -96; x < 22; x += 6) { g.moveTo(x, -38); g.lineTo(x + 3, -44); } g.stroke();
  // green metal roof
  g.fillStyle = "#4F8A5B";
  g.beginPath(); g.moveTo(-124, -100); g.lineTo(124, -100); g.lineTo(112, -128); g.lineTo(-112, -128); g.closePath(); g.fill();
  g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 2;
  for (let x = -110; x < 120; x += 14) { g.beginPath(); g.moveTo(x, -100); g.lineTo(x * 0.93, -128); g.stroke(); }
  drawCoopDoor(g, 62, -30, 30, 44, d, false);
  drawRamp(g, 62, -30, 22, false);
}

// A white garden pavilion with a pink striped roof, for the lagoon
function pavilion(g, d) {
  g.fillStyle = "#E2D9C6"; g.fillRect(-100, -14, 200, 14);
  g.fillStyle = "#EFE8DA"; g.fillRect(-90, -26, 180, 12);
  // the shady back wall (so birds can go "inside")
  g.fillStyle = d > 0.3 ? `rgba(120,70,40,${0.5 + 0.3 * d})` : "rgba(90,70,60,.35)";
  g.fillRect(-78, -150, 156, 124);
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.2;
  for (let x = -70; x < 78; x += 12) { g.beginPath(); g.moveTo(x, -150); g.lineTo(x + 30, -30); g.moveTo(x + 30, -150); g.lineTo(x, -30); g.stroke(); }
  // white columns
  for (const x of [-82, -28, 28, 82]) {
    g.fillStyle = "#FBF8F1"; g.fillRect(x - 6, -152, 12, 126);
    g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(x + 2, -152, 4, 126);
    g.fillStyle = "#EFE8DA"; g.fillRect(x - 9, -30, 18, 5); g.fillRect(x - 9, -156, 18, 6);
  }
  // pink and white striped dome with a scalloped edge
  g.save();
  g.beginPath(); g.ellipse(0, -154, 104, 56, 0, Math.PI, 0); g.closePath(); g.clip();
  for (let i = -6; i < 6; i++) { g.fillStyle = i % 2 ? "#FFFFFF" : "#F58AA8"; g.beginPath(); g.moveTo(0, -214); g.lineTo(i * 20, -150); g.lineTo(i * 20 + 20, -150); g.closePath(); g.fill(); }
  g.restore();
  for (let x = -96; x <= 96; x += 16) { g.fillStyle = (x / 16) % 2 ? "#FFFFFF" : "#F58AA8"; g.beginPath(); g.arc(x, -154, 8, 0, Math.PI); g.fill(); }
  g.fillStyle = "#E6B23A"; circle(g, 0, -212, 6); g.fill();
  g.strokeStyle = "#E6B23A"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, -212); g.lineTo(0, -232); g.stroke();
  flag(g, 0, -232, "#F58AA8");
  // two hanging lanterns
  for (const x of [-60, 60]) {
    g.strokeStyle = "#8E7A5E"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, -146); g.lineTo(x, -134); g.stroke();
    g.fillStyle = d > 0.3 ? "#FFD27A" : "#F7C6A0"; ellipse(g, x, -127, 6, 8); g.fill();
  }
  drawCoopDoor(g, 0, -26, 34, 50, d, false, true, "#FBF8F1");
  // wide shallow steps down to the sand
  g.fillStyle = "#EFE8DA";
  g.beginPath(); g.moveTo(-18, -26); g.lineTo(18, -26); g.lineTo(26, 20); g.lineTo(-26, 20); g.closePath(); g.fill();
  g.strokeStyle = "rgba(0,0,0,.08)"; g.lineWidth = 2;
  for (const y of [-10, 6]) { g.beginPath(); g.moveTo(-24, y); g.lineTo(24, y); g.stroke(); }
}

// ---------- Feeder & waterer (the classic red ones from the farm store) ----------
function drawFeeder(g, level) {
  g.fillStyle = "#A82C27"; ellipse(g, 0, -6, 38, 10); g.fill();
  g.fillStyle = "#D9423A"; ellipse(g, 0, -9, 38, 10); g.fill();
  g.fillStyle = level > 0.02 ? "#D8A94F" : "#8E2A24"; ellipse(g, 0, -10, 31, 6.5); g.fill();
  if (level > 0.02) {
    g.fillStyle = "#B8872F";
    for (let k = 0; k < 14; k++) { circle(g, -24 + k * 3.7, -10 + Math.sin(k * 2.3) * 2.5, 1.2); g.fill(); }
  }
  const tg = g.createLinearGradient(-17, 0, 17, 0);
  tg.addColorStop(0, "#9AA6AE"); tg.addColorStop(0.45, "#E4EAEE"); tg.addColorStop(1, "#8C98A0");
  g.fillStyle = tg; roundRect(g, -17, -74, 34, 64, 5); g.fill();
  // a little window so you can see how much feed is left
  g.fillStyle = "rgba(40,50,60,.28)"; roundRect(g, -5, -68, 10, 52, 4); g.fill();
  const fh = 52 * clamp(level);
  g.fillStyle = "#E0B35A"; roundRect(g, -5, -16 - fh, 10, fh, 3); g.fill();
  g.fillStyle = "#D9423A"; ellipse(g, 0, -74, 21, 7); g.fill();
  g.fillStyle = "#E85A4F"; g.beginPath(); g.ellipse(0, -76, 17, 7, 0, Math.PI, 0); g.fill();
  g.strokeStyle = "#6E7A82"; g.lineWidth = 2.5; g.beginPath(); g.arc(0, -82, 8, Math.PI, 0); g.stroke();
}
function drawWaterer(g, level) {
  g.fillStyle = "#A82C27"; ellipse(g, 0, -5, 36, 10); g.fill();
  g.fillStyle = "#D9423A"; ellipse(g, 0, -8, 36, 10); g.fill();
  g.fillStyle = level > 0.02 ? "#5DBBE8" : "#8E2A24"; ellipse(g, 0, -9, 29, 6); g.fill();
  if (level > 0.02) { g.fillStyle = "rgba(255,255,255,.5)"; ellipse(g, -8, -10, 9, 1.6); g.fill(); }
  const jug = () => roundRect(g, -22, -80, 44, 68, 15);
  g.save(); jug(); g.clip();
  g.fillStyle = "rgba(232,244,250,.62)"; g.fillRect(-24, -82, 48, 72);
  const wh = 64 * clamp(level);
  const wg = g.createLinearGradient(0, -12 - wh, 0, -12);
  wg.addColorStop(0, "#7FD0F2"); wg.addColorStop(1, "#3A9FD8");
  g.fillStyle = wg; g.fillRect(-24, -12 - wh, 48, wh + 2);
  g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(-24, -13 - wh, 48, 2);
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 2; jug(); g.stroke();
  g.fillStyle = "rgba(255,255,255,.45)"; roundRect(g, -16, -72, 5, 48, 3); g.fill();
  g.fillStyle = "#D9423A"; roundRect(g, -25, -16, 50, 9, 3); g.fill();
  g.strokeStyle = "#D9423A"; g.lineWidth = 4; g.beginPath(); g.arc(0, -82, 9, Math.PI, 0); g.stroke();
}

// ---------- Trees ----------
function drawTreeKind(g, kind) {
  if (kind === "willow") drawWillow(g);
  else if (kind === "palm") drawPalm(g);
  else drawTree(g, kind === "apple");
}
function drawTree(g, apples) {
  const sway = Math.sin(clock * 0.7) * 2;
  g.fillStyle = "#7A5334";
  g.beginPath(); g.moveTo(-18, 0); g.quadraticCurveTo(-12, -60, -14, -120); g.lineTo(12, -120); g.quadraticCurveTo(10, -60, 20, 0); g.closePath(); g.fill();
  g.strokeStyle = "#7A5334"; g.lineWidth = 9; g.lineCap = "round";
  g.beginPath(); g.moveTo(-6, -100); g.lineTo(-44, -150); g.moveTo(4, -110); g.lineTo(40, -160); g.stroke();
  g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(4, -118, 6, 116);
  const clusters = [[-78, -160, 58], [0, -205, 74], [72, -158, 58], [-40, -238, 54], [44, -240, 52], [0, -140, 58], [-96, -196, 40], [96, -194, 40]];
  const layer = (col, dx, dy, k) => {
    g.fillStyle = col;
    for (const [x, y, r] of clusters) { circle(g, x + dx + sway * (y / -240), y + dy, r * k); g.fill(); }
  };
  layer("#4C8A37", 0, 0, 1);
  layer("#5FA244", -6, -7, 0.82);
  layer("#7DBB55", -14, -16, 0.45);
  if (apples) {
    const R = seeded(5);
    for (let i = 0; i < 16; i++) {
      const [x, y, r] = clusters[i % clusters.length], a = R() * TAU, d = R() * r * 0.8;
      g.fillStyle = "#D8352A"; circle(g, x + Math.cos(a) * d + sway * (y / -240), y + Math.sin(a) * d, 5.5); g.fill();
      g.fillStyle = "rgba(255,255,255,.45)"; circle(g, x + Math.cos(a) * d - 1.5 + sway * (y / -240), y + Math.sin(a) * d - 1.5, 1.6); g.fill();
    }
  }
}
function drawWillow(g) {
  const sway = Math.sin(clock * 0.6) * 3;
  g.fillStyle = "#6E5034";
  g.beginPath(); g.moveTo(-16, 0); g.quadraticCurveTo(-4, -80, -20, -150); g.lineTo(4, -150); g.quadraticCurveTo(12, -80, 18, 0); g.closePath(); g.fill();
  g.fillStyle = "#6AA34C";
  for (const [x, y, r] of [[-60, -170, 60], [10, -200, 70], [70, -165, 56], [-10, -150, 60]]) { circle(g, x, y, r); g.fill(); }
  g.fillStyle = "#86BD5E";
  for (const [x, y, r] of [[-66, -180, 30], [2, -218, 36], [60, -178, 28]]) { circle(g, x, y, r); g.fill(); }
  // long drooping branches that sway in the breeze
  g.lineCap = "round";
  for (let i = 0; i < 34; i++) {
    const x = -120 + i * 7.3, top = -180 + Math.pow((x - 5) / 120, 2) * 70, len = 90 + ((i * 37) % 40);
    const s = sway * (0.6 + (i % 3) * 0.2);
    g.strokeStyle = i % 2 ? "#7DB35A" : "#5E9A44"; g.lineWidth = 3.2;
    g.beginPath(); g.moveTo(x, top); g.quadraticCurveTo(x + s * 0.5, top + len * 0.5, x + s, top + len); g.stroke();
  }
}
function drawPalm(g) {
  const sway = Math.sin(clock * 0.9) * 5;
  // curved trunk made of little stacked segments
  const tx = 30 + sway * 0.4, ty = -200;
  for (let i = 0; i < 14; i++) {
    const t = i / 14, t2 = (i + 1) / 14;
    const x1 = bez(0, 26, tx, t), y1 = bez(0, -110, ty, t), x2 = bez(0, 26, tx, t2), y2 = bez(0, -110, ty, t2);
    const w = lerp(13, 8, t);
    g.fillStyle = i % 2 ? "#A07850" : "#8E6A44";
    g.beginPath(); g.moveTo(x1 - w, y1); g.lineTo(x1 + w, y1); g.lineTo(x2 + w * 0.92, y2 - 2); g.lineTo(x2 - w * 0.92, y2 - 2); g.closePath(); g.fill();
  }
  // coconuts
  g.fillStyle = "#6B4A2A";
  for (const [x, y] of [[-6, 6], [5, 8], [0, 1]]) { circle(g, tx + x, ty + y, 6); g.fill(); }
  // big feathery leaves
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i / 7 - 0.5) * 3.6 + Math.sin(clock * 1.1 + i) * 0.04;
    const len = 92 + (i % 2) * 14, droop = 34;
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + droop;
    const mx = tx + Math.cos(a) * len * 0.5, my = ty + Math.sin(a) * len * 0.5 - 12;
    g.fillStyle = i % 2 ? "#3E9A4A" : "#4FAE58";
    g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(mx, my - 12, ex, ey); g.quadraticCurveTo(mx, my + 14, tx, ty + 4); g.closePath(); g.fill();
    g.strokeStyle = "rgba(20,70,30,.4)"; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
  }
}
// A windmill far away on the meadow hill, turning slowly
function drawWindmill(g) {
  g.fillStyle = "#EFE8DA";
  g.beginPath(); g.moveTo(-9, 0); g.lineTo(9, 0); g.lineTo(5, -54); g.lineTo(-5, -54); g.closePath(); g.fill();
  g.fillStyle = "#B8402C"; g.beginPath(); g.moveTo(-8, -52); g.lineTo(0, -62); g.lineTo(8, -52); g.closePath(); g.fill();
  g.save(); g.translate(0, -56); g.rotate(clock * 0.6);
  g.strokeStyle = "#8E7A5E"; g.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    g.save(); g.rotate((i * Math.PI) / 2);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -30); g.stroke();
    g.fillStyle = "rgba(250,246,236,.9)"; g.fillRect(1, -30, 7, 22);
    g.restore();
  }
  g.fillStyle = "#6E5A44"; circle(g, 0, 0, 3); g.fill();
  g.restore();
}
function drawFountain(g) {
  g.fillStyle = "#CFC8BE"; ellipse(g, 0, -8, 62, 16); g.fill();
  g.fillStyle = "#7FC9EE"; ellipse(g, 0, -11, 52, 11); g.fill();
  g.fillStyle = "#E6DFD4"; g.fillRect(-8, -60, 16, 50);
  g.fillStyle = "#CFC8BE"; ellipse(g, 0, -60, 24, 6); g.fill();
  g.fillStyle = "#9ED8F4";
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    for (let k = 0; k < 8; k++) {
      const t = ((clock * 0.9 + k / 8) % 1);
      const x = Math.cos(a) * t * 40, y = -64 - Math.sin(t * Math.PI) * 30 + t * 50 + Math.sin(a) * t * 6;
      circle(g, x, y, 2.2); g.fill();
    }
  }
}
function drawCrate(g, cr) {
  const sc = scaleAt(cr.y), a = cr.t > 2.6 ? clamp(1 - (cr.t - 2.6) / 0.8) : 1;
  g.save();
  g.translate(cr.x, cr.y);
  g.scale(sc, sc);
  g.globalAlpha = a;
  const pop = cr.t < 0.3 ? easeOut(cr.t / 0.3) : 1;
  g.scale(pop, pop);
  g.fillStyle = "#C8955C"; g.fillRect(-24, -34, 48, 34);
  g.strokeStyle = "#946638"; g.lineWidth = 3;
  for (const y of [-26, -14, -3]) { g.beginPath(); g.moveTo(-24, y); g.lineTo(24, y); g.stroke(); }
  g.fillStyle = "#946638"; g.fillRect(-24, -34, 5, 34); g.fillRect(19, -34, 5, 34);
  if (cr.t < 1.1) { g.fillStyle = "#B7844D"; g.fillRect(-27, -40, 54, 7); }
  else {
    const k = Math.min(1, (cr.t - 1.1) / 0.4);
    g.save(); g.translate(20 + k * 20, -40 - k * 26); g.rotate(k * 1.2); g.fillStyle = "#B7844D"; g.fillRect(-27, 0, 54, 7); g.restore();
  }
  g.restore();
}

// ---------- Treats & eggs ----------
function drawGrain(g, p) {
  const sc = scaleAt(p.y), n = Math.ceil((p.dots.length * p.bites) / SETTINGS.treatBites);
  g.fillStyle = "#E7C35C";
  for (let i = 0; i < n; i++) { const d = p.dots[i]; ellipse(g, p.x + d.x * sc, p.y + d.y * sc, 2.3 * sc, 1.6 * sc); g.fill(); }
  g.fillStyle = "#C99A3A";
  for (let i = 0; i < n; i += 3) { const d = p.dots[i]; circle(g, p.x + d.x * sc + 1, p.y + d.y * sc, 1.1 * sc); g.fill(); }
}
function eggPath(g, rx, ry) {
  g.beginPath();
  g.ellipse(0, -ry * 0.9, rx, ry * 1.1, 0, Math.PI, 0);
  g.ellipse(0, -ry * 0.9, rx, ry * 0.9, 0, 0, Math.PI);
  g.closePath();
}
// Every species lays its own size of egg. k makes it bigger or smaller.
function drawEgg(g, breed, golden, k = 1) {
  const E = BREEDS[breed].egg, sz = SPECIES[BREEDS[breed].species].egg;
  const rx = sz[0] * k, ry = sz[1] * k;
  const col = golden ? "#F4C542" : E.color;
  const gr = g.createRadialGradient(-rx * 0.35, -ry * 1.35, 1, 0, -ry * 0.9, ry * 1.3);
  gr.addColorStop(0, golden ? "#FFF6C2" : "#FFFFFF");
  gr.addColorStop(0.35, col);
  gr.addColorStop(1, golden ? "#C9931A" : mix(col, "#5A3A1A", 0.22));
  eggPath(g, rx, ry);
  g.fillStyle = gr; g.fill();
  g.lineWidth = 0.8; g.strokeStyle = "rgba(90,60,30,.25)"; g.stroke();
  if (golden) return;
  if (E.speckle) {
    g.fillStyle = "rgba(110,70,40,.35)";
    for (const [x, y] of [[-3, -14], [3, -9], [-4, -6], [2, -17], [4, -4]]) { circle(g, (x * rx) / 9, (y * ry) / 11, 0.8 * k); g.fill(); }
  }
  if (E.blotch) {       // quail eggs are covered in dark blotches
    g.fillStyle = "rgba(70,50,35,.75)";
    for (const [x, y, r] of [[-3, -12, 1.6], [2, -8, 2], [-2, -4, 1.3], [3, -13, 1.1], [0, -10, 0.9], [-4, -8, 1], [1, -3, 1.2]]) { circle(g, (x * rx) / 6, (y * ry) / 7.5 * 0.75, r * k); g.fill(); }
  }
}
function drawYardEgg(g, e) {
  const sc = scaleAt(e.y);
  g.save();
  g.translate(e.x, e.y);
  g.scale(sc, sc);
  drawEgg(g, e.breed, e.golden);
  // a few blades of grass in front, like it's hiding
  g.strokeStyle = "#6FA84A"; g.lineWidth = 2; g.lineCap = "round";
  g.beginPath();
  for (const [x, h] of [[-9, 9], [-4, 12], [3, 10], [8, 8]]) { g.moveTo(x, 2); g.lineTo(x + (x > 0 ? 2 : -2), 2 - h); }
  g.stroke();
  // a twinkle every few seconds helps you find it
  const gl = (clock + e.glint) % 3.2;
  if (gl < 0.45 || e.golden) {
    const a = e.golden ? 0.6 + 0.4 * Math.sin(clock * 5) : Math.sin((gl / 0.45) * Math.PI);
    g.fillStyle = `rgba(255,255,255,${a})`;
    drawStar(g, 5, -19, 6 * a + 2);
  }
  g.restore();
}


/* ================================================================
   13. PAINTING: THE BIRDS
   ================================================================
   Every bird is drawn facing RIGHT with its feet at (0, 0).
   Then we flip it (dir = -1) to face left.
*/
function drawBirdAt(g, c, x, y, sc) {
  const size = SP(c).size, sink = sinkOf(c);
  g.save();
  g.translate(x, y - c.z);
  g.scale(sc * size, sc * size);
  if (c.wet > 0.02) {           // hide the part of the bird that's under the water
    g.beginPath(); g.rect(-500, -700, 1000, 700); g.clip();
    g.translate(0, sink / size);
  }
  if (c.state === "dust") g.rotate(Math.sin(clock * 16) * 0.07);
  if (c.state === "petted") g.rotate(c.dir * -0.06);
  if (c.z > 0 && c.state !== "enter" && c.state !== "exit") {   // stretch when jumping
    const st = clamp(c.vz / 900, -0.1, 0.12);
    g.scale(1 - st * 0.5, 1 + st);
  }
  if (c.alpha < 1) g.globalAlpha = c.alpha;
  drawBird(g, c, clock);
  g.restore();
  if (c.wet > 0.05) {           // ripples on the water around it
    const r = 24 * sc * size * smallK(c), ph = (clock * 0.7 + c.id * 0.37) % 1;
    g.lineWidth = 1.4 * sc;
    g.strokeStyle = `rgba(255,255,255,${0.5 * c.wet})`;
    ellipse(g, x, y, r, r * 0.26); g.stroke();
    g.strokeStyle = `rgba(255,255,255,${0.35 * (1 - ph) * c.wet})`;
    ellipse(g, x, y, r * (1 + ph * 1.1), r * 0.26 * (1 + ph * 0.9)); g.stroke();
  }
}
function drawBird(g, c, now) {
  if (isBaby(c)) { drawBaby(g, c, now); return; }
  const S = SP(c);
  if (S.draw === drawHen) { drawHen(g, c, now); return; }
  const k = growK(c);
  g.save();
  g.scale(k, k);
  S.draw(g, c, BREEDS[c.breed], now);
  g.restore();
}
const isFlapping = (c) => c.flapT > 0 || c.state === "carried" || c.state === "fall";

// Two legs that walk, kick, dangle, or (for flamingos) tuck one leg up
function drawLegPair(g, c, now, o) {
  g.strokeStyle = o.color; g.fillStyle = o.color; g.lineCap = "round"; g.lineJoin = "round";
  o.hips.forEach((hx, i) => {
    const ph = i ? Math.PI : 0;
    let fx = hx, fy = 0;
    if (c.state === "carried" || c.state === "fall") { fx = hx + Math.sin(now * 7 + ph) * 2.5; fy = o.hipY + o.dangle; }
    else if (c.moving) { fx = hx + Math.sin(c.walkPhase + ph) * o.stride; fy = -Math.max(0, Math.cos(c.walkPhase + ph)) * o.lift; }
    if (i === 0 && c.legKick > 0.01) { fx -= c.legKick * o.stride * 2; fy -= c.legKick * 5; }
    g.lineWidth = o.width;
    if (o.oneLeg && i === 1) {   // leg folded up under the body
      const len = -o.hipY;
      g.beginPath(); g.moveTo(hx, o.hipY); g.lineTo(hx + 10, o.hipY + len * 0.32); g.lineTo(hx - 2, o.hipY + len * 0.46); g.stroke();
      return;
    }
    g.beginPath(); g.moveTo(hx, o.hipY);
    if (o.knee) g.lineTo((hx + fx) / 2 - o.knee, (o.hipY + fy) / 2);   // birds' "knees" bend backward!
    g.lineTo(fx, fy);
    g.stroke();
    if (o.web) { g.beginPath(); g.moveTo(fx - 3, fy); g.lineTo(fx + 9, fy + 1); g.lineTo(fx + 2, fy - 3); g.closePath(); g.fill(); }
    else { g.lineWidth = o.width * 0.68; g.beginPath(); g.moveTo(fx - 3.5, fy); g.lineTo(fx + 7, fy + 0.4); g.stroke(); }
  });
}

// ---------- Chickens ----------
function drawHen(g, c, now) {
  const B = BREEDS[c.breed];
  const grow = clamp((c.growth - 0.55) / 0.45);
  const k = lerp(0.66, 1, grow), combK = lerp(0.2, 1, grow);
  g.save();
  g.scale(c.dir * k, k);
  const sy = c.sit * 15;
  const bob = c.moving ? Math.sin(c.walkPhase * 2) * 1.6 : Math.sin(now * 2.1 + c.id) * 0.5;
  const dance = c.dance ? Math.sin(now * 11.7 + c.id) * 3 : 0;
  const by = -34 + sy + bob + dance;       // the middle of her body
  const fluff = B.fluffy || 0;

  if (c.sit < 0.6) drawLegs(g, c, B, by, now);

  // tail feathers
  g.save();
  g.translate(-21 - fluff * 6, by - 6);
  g.rotate(Math.sin(now * 1.6 + c.id) * 0.05 + (c.moving ? Math.sin(c.walkPhase * 2) * 0.07 : 0) - c.headDown * 0.12 + (c.dance ? Math.sin(now * 11.7) * 0.15 : 0));
  drawTail(g, B);
  g.restore();

  // body
  const rx = 27 + fluff * 16, ry = 20.5 + fluff * 8;
  const bodyGrad = g.createRadialGradient(6, by - 12, 3, -2, by, rx + 8);
  bodyGrad.addColorStop(0, B.light);
  bodyGrad.addColorStop(0.55, B.body);
  bodyGrad.addColorStop(1, B.shade);
  g.fillStyle = bodyGrad;
  if (B.silkie) {
    for (const [px, py, r] of SILKIE_PUFFS) { circle(g, px, by + py, r); g.fill(); }
  } else {
    ellipse(g, -2, by, rx, ry, -0.1); g.fill();
    if (B.pattern) { g.save(); ellipse(g, -2, by, rx, ry, -0.1); g.clip(); drawPattern(g, B, by, c.id); g.restore(); }
    ellipse(g, -2, by, rx, ry, -0.1);
    g.lineWidth = 1.2; g.strokeStyle = "rgba(70,40,20,.2)"; g.stroke();
  }

  // wing (it flaps when she's excited, carried, or falling)
  const flap = isFlapping(c) ? (Math.sin(now * 38) * 0.5 + 0.5) * 1.1 : 0;
  g.save();
  g.translate(4, by - 8);
  g.rotate(-0.12 - flap);
  g.fillStyle = B.wing || B.shade;
  ellipse(g, -10, 3, 15, 9.5, -0.08); g.fill();
  if (B.pattern === "barred" || B.pattern === "laced") {
    g.save(); ellipse(g, -10, 3, 15, 9.5, -0.08); g.clip();
    g.fillStyle = "rgba(38,38,44,.6)";
    for (let x = -26; x < 6; x += 5.5) g.fillRect(x, -8, 2.4, 22);
    g.restore();
  }
  g.strokeStyle = rgba(B.light, 0.55); g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(-22, 5); g.quadraticCurveTo(-12, 10, -1, 6); g.moveTo(-19, 9); g.quadraticCurveTo(-11, 13, -3, 10); g.stroke();
  g.restore();

  // neck and head (the head moves: pecking, drinking, singing, sleeping)
  const thrust = c.moving ? Math.sin(c.walkPhase * 2 + 1) * 2.6 : 0;
  let hx = 17 + thrust + (c.look || 0) * 1.5, hy = by - 21;
  if (c.sleep > 0.01) { hx = lerp(hx, 11, c.sleep); hy = lerp(hy, by - 13, c.sleep); }
  hx = lerp(hx, 29, c.headDown);
  hy = lerp(hy, -9 + sy * 0.4, c.headDown);
  hx -= c.headUp * 3;
  hy -= c.headUp * 7;
  g.strokeStyle = B.neck || B.body; g.lineCap = "round"; g.lineWidth = 15;
  g.beginPath(); g.moveTo(7, by - 8); g.lineTo(hx - 3, hy + 4); g.stroke();
  if (B.silkie) { g.fillStyle = B.body; circle(g, (7 + hx) / 2, (by - 8 + hy) / 2, 10); g.fill(); }

  g.save();
  g.translate(hx, hy);
  g.rotate(c.headDown * 0.85 - c.headUp * 0.5 + (c.look || 0) * 0.12 + c.sleep * 0.35);
  drawComb(g, B, combK);
  const hg = g.createRadialGradient(3, -5, 1, 0, 0, 13);
  hg.addColorStop(0, B.light);
  hg.addColorStop(1, B.neck || B.body);
  g.fillStyle = hg; circle(g, 0, 0, 11.5); g.fill();
  if (B.silkie) { g.fillStyle = B.face; ellipse(g, 5, 1, 6.5, 5.5); g.fill(); }
  const open = c.beakOpen || 0;
  g.fillStyle = B.beak;
  g.beginPath(); g.moveTo(8, -3.5); g.lineTo(19, 0.5 - open * 2); g.lineTo(8, 1.8); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(8, 2); g.lineTo(15.5, 2.6 + open * 5); g.lineTo(8, 4.6); g.closePath(); g.fill();
  if (B.muffs) {           // Easter & Olive Eggers have fluffy cheeks and a beard!
    g.fillStyle = B.muffs;
    circle(g, -1, 6, 5.2); g.fill(); circle(g, 5, 8.5, 5.4); g.fill(); circle(g, 10, 7, 4); g.fill();
  } else if (!B.silkie && !B.crest) {  // wattles
    g.fillStyle = B.comb;
    ellipse(g, 9.5, 8, 2.6 * combK + 1, 4.6 * combK + 1.2, 0.15); g.fill();
    ellipse(g, 6, 8.5, 2.2 * combK + 1, 4 * combK + 1); g.fill();
  }
  if (!B.silkie) { g.fillStyle = B.earlobe || B.comb; ellipse(g, -3.5, 3, 2.3, 2.9); g.fill(); }
  drawEye(g, c, 4.6, -3, 1);
  if (B.silkie) {          // the silkie's pom-pom hairdo
    g.fillStyle = B.body;
    circle(g, -4, -11, 7); g.fill(); circle(g, 2, -13, 7); g.fill(); circle(g, -10, -6, 6); g.fill(); circle(g, 7, -11, 4.5); g.fill();
    g.fillStyle = "rgba(255,255,255,.55)"; circle(g, -1, -15, 3.5); g.fill();
  }
  if (B.crest) {           // the Polish chicken's giant wobbly pom-pom!
    const w = c.moving ? Math.sin(c.walkPhase * 2) * 1.2 : Math.sin(now * 2) * 0.4;
    g.fillStyle = B.crest;
    for (const [x, y, r] of [[-6, -12, 8], [1, -15, 8.5], [7, -12, 6], [-11, -6, 6], [-2, -8, 6.5]]) { circle(g, x + w, y, r * combK); g.fill(); }
    g.fillStyle = "rgba(0,0,0,.06)"; circle(g, -2 + w, -9, 5 * combK); g.fill();
  }
  g.restore();
  g.restore();
}
function drawTail(g, B) {
  if (B.silkie) { g.fillStyle = B.body; circle(g, 2, -10, 11); g.fill(); circle(g, -5, -16, 9); g.fill(); return; }
  const L = B.tailK || 1;
  const f = (ang, len, w, col) => { g.save(); g.rotate(ang); g.fillStyle = col; ellipse(g, -len * 0.5, 0, len * 0.55, w); g.fill(); g.restore(); };
  f(0.55, 28 * L, 7.5, B.tail2 || B.tail);
  f(0.9, 32 * L, 7, B.tail);
  f(1.25, 28 * L, 6.5, B.tail2 || B.tail);
}
function drawPattern(g, B, by, seed) {
  if (B.pattern === "barred" || B.pattern === "cuckoo") {
    g.save();
    g.translate(-2, by);
    g.rotate(B.pattern === "cuckoo" ? -0.3 : -0.35);
    g.fillStyle = B.pattern === "cuckoo" ? "rgba(60,58,56,.42)" : "rgba(38,38,44,.78)";
    const step = B.pattern === "cuckoo" ? 7 : 6.2, w = B.pattern === "cuckoo" ? 3.6 : 2.8;
    for (let y = -34; y < 34; y += step) g.fillRect(-44, y, 88, w);
    g.restore();
  } else if (B.pattern === "speckle") {
    const R = seeded(seed * 97 + 3);
    for (let i = 0; i < 26; i++) {
      const a = R() * TAU, dd = Math.sqrt(R());
      g.fillStyle = R() < 0.5 ? rgba(B.shade, 0.8) : rgba(B.light, 0.8);
      circle(g, -2 + Math.cos(a) * dd * 25, by + Math.sin(a) * dd * 18, 1.3 + R() * 1.2);
      g.fill();
    }
  } else if (B.pattern === "laced") {    // every feather outlined in black
    g.strokeStyle = "rgba(30,30,36,.72)"; g.lineWidth = 1.5;
    for (let row = 0; row < 7; row++) {
      const y = by - 20 + row * 6.5;
      for (let x = -30 + (row % 2) * 4; x < 28; x += 8) { g.beginPath(); g.arc(x, y, 4.2, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); }
    }
  } else if (B.pattern === "dots") {     // speckled: a white dot on every feather
    const R = seeded(seed * 31 + 7);
    for (let i = 0; i < 34; i++) {
      const a = R() * TAU, dd = Math.sqrt(R()), x = -2 + Math.cos(a) * dd * 25, y = by + Math.sin(a) * dd * 18;
      g.fillStyle = "rgba(20,14,10,.55)"; g.fillRect(x - 2, y - 0.6, 4, 1.3);
      g.fillStyle = "#FFF8EC"; circle(g, x + 1.5, y + 1.4, 1.3); g.fill();
    }
  }
}
function drawLegs(g, c, B, by, now) {
  const hipY = by + 14;
  g.strokeStyle = B.legs; g.lineCap = "round"; g.lineJoin = "round";
  for (const [hx, ph] of [[-5, 0], [6, Math.PI]]) {
    let fx = hx, fy = 0;
    if (c.state === "carried" || c.state === "fall") { fx = hx + Math.sin(now * 7 + ph) * 2.5; fy = hipY + 17; }
    else if (c.moving) { fx = hx + Math.sin(c.walkPhase + ph) * 7; fy = -Math.max(0, Math.cos(c.walkPhase + ph)) * 4.5; }
    if (ph === 0 && c.legKick > 0.01) { fx -= c.legKick * 14; fy -= c.legKick * 5; }
    g.lineWidth = 3.4; g.beginPath(); g.moveTo(hx, hipY); g.lineTo(fx, fy); g.stroke();
    g.lineWidth = 2.3; g.beginPath(); g.moveTo(fx - 3.5, fy); g.lineTo(fx + 7, fy + 0.4); g.stroke();
    if (B.silkie || B.featherFeet) {   // fluffy feathered feet
      g.fillStyle = B.silkie ? B.body : B.shade;
      circle(g, hx + (fx - hx) * 0.6, hipY + (fy - hipY) * 0.6, 3.2); g.fill();
      circle(g, fx + 2, fy - 2, 3); g.fill();
    }
  }
}
function drawComb(g, B, k) {
  if (B.silkie) return;
  g.fillStyle = B.comb;
  if (B.combType === "pea") {
    for (const [x, y, r] of [[-3, -10.5, 2.6], [1, -11.5, 3], [5, -10.5, 2.6]]) { circle(g, x * (0.6 + 0.4 * k), -8 + (y + 8) * k, r * (0.5 + 0.5 * k)); g.fill(); }
    return;
  }
  if (B.combType === "rose") { ellipse(g, 1, -10.5, 7 * k + 1, 3 * k + 0.8); g.fill(); circle(g, -6 * k, -11 * k - 1, 1.8 * k); g.fill(); return; }
  if (B.combType === "tiny") { circle(g, 2, -11, 2.2 * k + 0.5); g.fill(); circle(g, 6, -10, 1.8 * k + 0.4); g.fill(); return; }
  const big = B.combType === "big" ? 1.4 : 1, s = k * big;
  g.save();
  if (big > 1) g.rotate(-0.1);
  for (const [x, y, r] of [[-7, -9, 4], [-2, -12, 5], [4, -11.5, 4.6], [9, -8, 3.6]]) { circle(g, x * (0.7 + 0.3 * s), -6 + (y + 6) * s, r * s); g.fill(); }
  g.restore();
}
function drawEye(g, c, x, y, s) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.strokeStyle = "#2A1D16"; g.lineWidth = 1.7; g.lineCap = "round";
  if (c.sleep > 0.5) { g.beginPath(); g.arc(0, -0.8, 2.6, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }          // asleep
  else if (c.petGlow > 0.25) { g.beginPath(); g.arc(0, 1.6, 2.8, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); } // happy ^^
  else {
    g.scale(1, c.blink > 0 ? 0.15 : 1);
    g.fillStyle = "#2A1D16"; circle(g, 0, 0, 2.8); g.fill();
    g.fillStyle = "#FFFFFF"; circle(g, 0.9, -1, 0.95); g.fill();
  }
  g.restore();
}

// ---------- Babies: chicks, ducklings, keets, poults, peachicks... ----------
function drawBaby(g, c, now) {
  const B = BREEDS[c.breed], S = SP(c), flat = S.bill === "flat";
  const k = lerp(0.8, 1.15, clamp(c.growth / 0.55));
  g.save();
  g.scale(c.dir * k, k);
  const bob = c.moving ? -Math.abs(Math.sin(c.walkPhase * 2.4)) * 2.2 : Math.sin(now * 3 + c.id) * 0.6;
  const by = -14 + bob + c.sit * 5 + (c.dance ? Math.sin(now * 11.7 + c.id) * 2 : 0);
  const legCol = flat ? "#F2A23B" : S.wade ? "#8E8E96" : "#E9A640";
  if (c.sit < 0.6 && c.wet < 0.5) {
    g.strokeStyle = legCol; g.fillStyle = legCol; g.lineWidth = 2.2; g.lineCap = "round";
    for (const [x, ph] of [[-3, 0], [4, Math.PI]]) {
      let fx = x + (c.moving ? Math.sin(c.walkPhase * 1.3 + ph) * 4 : 0), fy = 0;
      if (c.state === "carried" || c.state === "fall") { fx = x; fy = by + 17; }
      g.beginPath(); g.moveTo(x, by + 9); g.lineTo(fx, fy); g.stroke();
      if (flat) { g.beginPath(); g.moveTo(fx - 2, fy); g.lineTo(fx + 6, fy + 0.5); g.lineTo(fx + 1, fy - 2); g.closePath(); g.fill(); }
      else { g.beginPath(); g.moveTo(fx - 2, fy); g.lineTo(fx + 4, fy); g.stroke(); }
    }
  }
  const col = B.chick;
  g.fillStyle = col; ellipse(g, -1, by, 13, 11.5); g.fill();
  if (B.chickStripe) { g.strokeStyle = B.chickStripe; g.lineWidth = 2.4; g.beginPath(); g.ellipse(-3, by - 2, 9, 6, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  if (B.silkie) { g.fillStyle = col; circle(g, -9, by - 4, 6); g.fill(); circle(g, 5, by + 4, 6); g.fill(); }
  g.fillStyle = "rgba(0,0,0,.09)";
  ellipse(g, -4, by + 1, 6.5, 4.2, -0.3 - (isFlapping(c) ? Math.abs(Math.sin(now * 30)) * 0.8 : 0)); g.fill();
  const hx = 8 + c.headDown * 5, hy = by - 10 + c.headDown * 9 - c.headUp * 3;
  g.fillStyle = col; circle(g, hx, hy, 8.2); g.fill();
  if (B.chickSpot) { g.fillStyle = B.chickSpot; circle(g, hx - 1, hy - 4, 3); g.fill(); }
  g.fillStyle = "rgba(255,255,255,.28)"; ellipse(g, hx + 1, hy - 3, 4, 2.5); g.fill();
  g.strokeStyle = col; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(hx - 2, hy - 7.5); g.quadraticCurveTo(hx - 1, hy - 12, hx + 1, hy - 10); g.stroke();
  if (flat) {        // a little flat duckling bill
    g.fillStyle = "#F2A23B";
    g.beginPath(); g.moveTo(hx + 5, hy - 2); g.quadraticCurveTo(hx + 13, hy - 2, hx + 13, hy + 0.8); g.quadraticCurveTo(hx + 12, hy + 3, hx + 5, hy + 2.5); g.closePath(); g.fill();
  } else {
    g.fillStyle = S.wade ? "#3A3A40" : "#F2B24A";
    g.beginPath(); g.moveTo(hx + 6, hy - 1.5); g.lineTo(hx + 11.5, hy + 0.5 - (c.beakOpen || 0)); g.lineTo(hx + 6, hy + 2.5); g.closePath(); g.fill();
  }
  drawEye(g, c, hx + 3.5, hy - 2, 0.8);
  g.restore();
}

// ---------- Ducks (Pekin, Mallard, Runner, Swedish Blue, Call duck) ----------
function drawDuck(g, c, B, now) {
  const swim = c.wet > 0.5, up = B.upright ? 1 : 0, small = B.small || 1;
  const bob = swim ? Math.sin(now * 2 + c.id) : c.moving ? -Math.abs(Math.sin(c.walkPhase)) * 1.6 : Math.sin(now * 2 + c.id) * 0.4;
  const by = -24 - up * 12 + bob + c.sit * 8;
  g.save();
  g.scale(c.dir * small, small);
  if (!swim && c.sit < 0.6) drawLegPair(g, c, now, { hips: [-3, 5], hipY: by + 11 + up * 6, color: B.feet, width: 3.6, stride: 6, lift: 3, web: true, dangle: 12 });
  if (c.moving && !swim) g.rotate(Math.sin(c.walkPhase) * 0.08);            // the waddle!
  if (c.tip > 0.01) { g.translate(12, -4); g.rotate(c.tip * 1.25); g.translate(-12, 4); }   // bottoms up!
  if (up) { g.translate(0, by); g.rotate(-0.9); g.translate(0, -by); }       // runners stand tall like bowling pins
  // tail
  g.fillStyle = B.tail || B.shade;
  g.beginPath(); g.moveTo(-25, by - 3); g.quadraticCurveTo(-37, by - 8, -40, by - 17); g.quadraticCurveTo(-31, by - 12, -21, by - 11); g.closePath(); g.fill();
  if (B.curl) { g.strokeStyle = B.curl; g.lineWidth = 2.2; g.beginPath(); g.arc(-33, by - 17, 3.4, 0.3 * Math.PI, 1.7 * Math.PI); g.stroke(); }
  // body
  const gr = g.createRadialGradient(6, by - 8, 3, -2, by, 34);
  gr.addColorStop(0, B.light); gr.addColorStop(0.55, B.body); gr.addColorStop(1, B.shade);
  g.fillStyle = gr; ellipse(g, -3, by, 30, 16.5, -0.05); g.fill();
  if (B.chest) { g.save(); ellipse(g, -3, by, 30, 16.5, -0.05); g.clip(); g.fillStyle = B.chest; ellipse(g, 22, by + 1, 15, 17); g.fill(); g.restore(); }
  if (B.bib) { g.fillStyle = B.bib; ellipse(g, 20, by - 1, 8, 10); g.fill(); }
  ellipse(g, -3, by, 30, 16.5, -0.05); g.lineWidth = 1.1; g.strokeStyle = "rgba(60,40,20,.18)"; g.stroke();
  // wing
  g.save(); g.translate(4, by - 6); g.rotate(-0.06 - (isFlapping(c) ? Math.sin(now * 34) * 0.5 + 0.5 : 0));
  g.fillStyle = B.wing || B.shade; ellipse(g, -12, 2, 18, 8, -0.04); g.fill();
  if (B.speculum) { g.fillStyle = B.speculum; roundRect(g, -25, 2, 10, 4, 2); g.fill(); }
  g.restore();
  // neck & head
  let hx = 18 + (c.moving && !swim ? Math.sin(c.walkPhase * 2) * 1.5 : 0), hy = by - 17;
  if (c.sleep > 0.01) { hx = lerp(hx, 2, c.sleep); hy = lerp(hy, by - 12, c.sleep); }
  hx = lerp(hx, 27, c.headDown); hy = lerp(hy, by + (swim ? 4 : 18), c.headDown);
  hx = lerp(hx, -6, c.preen); hy = lerp(hy, by - 11, c.preen);
  hy -= c.headUp * 5;
  g.strokeStyle = B.neck || B.body; g.lineWidth = 13; g.lineCap = "round";
  g.beginPath(); g.moveTo(12, by - 5); g.lineTo(hx - 2, hy + 3); g.stroke();
  if (B.ring) { const mx = lerp(12, hx, 0.62), my = lerp(by - 5, hy + 3, 0.62); g.strokeStyle = B.ring; g.lineWidth = 2.6; g.beginPath(); g.moveTo(mx - 6, my - 1); g.lineTo(mx + 6, my + 1); g.stroke(); }
  g.save(); g.translate(hx, hy);
  g.rotate(c.headDown * 0.7 - c.headUp * 0.3 + c.preen * 2.6 + c.sleep * 2.4);
  const hg = g.createRadialGradient(2, -4, 1, 0, 0, 12); hg.addColorStop(0, B.headLight || B.light); hg.addColorStop(1, B.head || B.body);
  g.fillStyle = hg; circle(g, 0, 0, 10); g.fill();
  g.fillStyle = B.bill;
  g.beginPath(); g.moveTo(6, -3.5); g.quadraticCurveTo(20, -3.5, 21.5, 1); g.quadraticCurveTo(20, 4.2 + c.beakOpen * 3, 6.5, 3.8); g.closePath(); g.fill();
  g.fillStyle = "rgba(0,0,0,.3)"; circle(g, 19, -0.6, 1.1); g.fill();
  drawEye(g, c, 3, -3, 0.9);
  g.restore();
  g.restore();
}

// ---------- Geese & swans (long necks!) ----------
function drawGoose(g, c, B, now) {
  const swim = c.wet > 0.5, swan = !!B.swan;
  const bob = swim ? Math.sin(now * 1.8 + c.id) : c.moving ? -Math.abs(Math.sin(c.walkPhase)) * 1.5 : Math.sin(now * 1.8 + c.id) * 0.4;
  const by = -30 + bob + c.sit * 10;
  const flap = isFlapping(c) ? Math.sin(now * 30) * 0.5 + 0.5 : 0;
  g.save();
  g.scale(c.dir, 1);
  if (!swim && c.sit < 0.6) drawLegPair(g, c, now, { hips: [-5, 7], hipY: by + 14, color: B.feet, width: 4.2, stride: 7, lift: 3, web: true, dangle: 16 });
  if (c.moving && !swim) g.rotate(Math.sin(c.walkPhase) * 0.06);
  if (c.tip > 0.01) { g.translate(16, -6); g.rotate(c.tip * 1.15); g.translate(-16, 6); }
  g.fillStyle = B.tail || B.shade;
  g.beginPath(); g.moveTo(-32, by - 3); g.lineTo(-46, by - 13); g.lineTo(-30, by - 12); g.closePath(); g.fill();
  const gr = g.createRadialGradient(6, by - 10, 3, -4, by, 40);
  gr.addColorStop(0, B.light); gr.addColorStop(0.55, B.body); gr.addColorStop(1, B.shade);
  g.fillStyle = gr; ellipse(g, -4, by, 37, 19.5, -0.04); g.fill();
  ellipse(g, -4, by, 37, 19.5, -0.04); g.lineWidth = 1.1; g.strokeStyle = "rgba(60,40,20,.15)"; g.stroke();
  // wings (swans hold theirs up a little, like sails)
  g.save(); g.translate(2, by - 8); g.rotate(-0.08 - (swan ? 0.22 : 0) - flap);
  g.fillStyle = B.wing; ellipse(g, -15, 1, 23, 10, -0.08); g.fill();
  if (B.wingTip) { g.fillStyle = B.wingTip; ellipse(g, -32, 4, 7, 3.2, 0.2); g.fill(); ellipse(g, -26, 7, 6, 2.8, 0.2); g.fill(); }
  g.strokeStyle = rgba(B.light, 0.5); g.lineWidth = 1.3; g.beginPath(); g.moveTo(-34, 3); g.quadraticCurveTo(-18, 9, 0, 4); g.stroke();
  g.restore();
  // the long neck
  let hx = swan ? 15 : 22, hy = by - (swan ? 54 : 46);
  if (c.sleep > 0.01) { hx = lerp(hx, -4, c.sleep); hy = lerp(hy, by - 14, c.sleep); }
  hx = lerp(hx, 36, c.headDown); hy = lerp(hy, by + (swim ? 6 : 22), c.headDown);
  hx = lerp(hx, -10, c.preen); hy = lerp(hy, by - 16, c.preen);
  hy -= c.headUp * 5;
  g.strokeStyle = B.neck || B.body; g.lineWidth = swan ? 9 : 11; g.lineCap = "round";
  g.beginPath(); g.moveTo(16, by - 6); g.quadraticCurveTo(swan ? 36 : 28, by - (swan ? 26 : 22), hx - 2, hy + 4); g.stroke();
  g.save(); g.translate(hx, hy);
  g.rotate(c.headDown * 0.8 - c.headUp * 0.3 + c.preen * 2.6 + (swan ? 0.25 : 0));
  const hg = g.createRadialGradient(2, -3, 1, 0, 0, 10); hg.addColorStop(0, B.light); hg.addColorStop(1, B.head || B.body);
  g.fillStyle = hg; circle(g, 0, 0, 8.5); g.fill();
  g.fillStyle = B.bill;
  g.beginPath(); g.moveTo(5, -3); g.lineTo(18, -0.5); g.quadraticCurveTo(20, 1.5, 18, 3); g.lineTo(5, 4); g.closePath(); g.fill();
  if (B.knob) { g.fillStyle = B.knob; circle(g, 6, -3.5, 3.2); g.fill(); ellipse(g, 5, 0.5, 2.5, 3.2); g.fill(); }
  if (B.band) { g.fillStyle = B.band; g.fillRect(14.5, -1.5, 2, 4.5); }
  drawEye(g, c, 1.5, -2.5, 0.85);
  g.restore();
  g.restore();
}


// ---------- Quail (tiny and round) ----------
function drawQuail(g, c, B, now) {
  const bob = c.moving ? -Math.abs(Math.sin(c.walkPhase * 1.5)) * 1.6 : Math.sin(now * 3 + c.id) * 0.5;
  const by = -19 + bob + c.sit * 7;
  const flap = isFlapping(c) ? Math.sin(now * 40) * 0.5 + 0.5 : 0;
  g.save();
  g.scale(c.dir, 1);
  if (c.sit < 0.6) drawLegPair(g, c, now, { hips: [-3, 4], hipY: by + 8, color: B.legs, width: 2.4, stride: 5, lift: 2.5, dangle: 10 });
  g.fillStyle = B.shade;
  g.beginPath(); g.moveTo(-16, by - 1); g.lineTo(-24, by - 6); g.lineTo(-15, by - 6); g.closePath(); g.fill();
  const gr = g.createRadialGradient(4, by - 6, 2, -1, by, 22);
  gr.addColorStop(0, B.light); gr.addColorStop(0.6, B.body); gr.addColorStop(1, B.shade);
  g.fillStyle = gr; ellipse(g, -1, by, 18, 13.5, -0.1); g.fill();
  g.save(); ellipse(g, -1, by, 18, 13.5, -0.1); g.clip();
  if (B.breast) { g.fillStyle = B.breast; ellipse(g, 11, by - 1, 11, 11); g.fill(); }
  if (B.belly) { g.fillStyle = B.belly; ellipse(g, 6, by + 9, 12, 7); g.fill(); }
  const R = seeded(c.id * 13 + 5);
  if (B.pattern === "streak") {
    g.strokeStyle = rgba(B.light, 0.9); g.lineWidth = 1.3;
    for (let i = 0; i < 14; i++) { const x = -16 + R() * 28, y = by - 10 + R() * 18; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y + 0.6); g.stroke(); }
    g.fillStyle = rgba(B.shade, 0.7);
    for (let i = 0; i < 10; i++) { circle(g, -14 + R() * 26, by - 8 + R() * 16, 1); g.fill(); }
  } else if (B.pattern === "scaled") {
    g.strokeStyle = "rgba(40,30,20,.45)"; g.lineWidth = 1;
    for (let row = 0; row < 3; row++) for (let x = 0; x < 16; x += 4) { g.beginPath(); g.arc(x + row * 2, by + 4 + row * 3.5, 2, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); }
  }
  g.restore();
  g.save(); g.translate(0, by - 3); g.rotate(-0.05 - flap * 0.9);
  g.fillStyle = B.wing; ellipse(g, -6, 1, 11, 6.5, -0.05); g.fill();
  g.strokeStyle = rgba(B.light, 0.8); g.lineWidth = 1.1;
  g.beginPath(); g.moveTo(-15, 0); g.lineTo(0, -1); g.moveTo(-14, 3); g.lineTo(-1, 3); g.stroke();
  g.restore();
  let hx = lerp(12, 17, c.headDown), hy = lerp(by - 10, by + 10, c.headDown) - c.headUp * 3;
  if (c.sleep > 0.01) { hx = lerp(hx, 8, c.sleep); hy = lerp(hy, by - 6, c.sleep); }
  g.save(); g.translate(hx, hy); g.rotate(c.headDown * 0.8 - c.headUp * 0.3);
  if (B.plume) {      // the California quail's bouncy topknot
    const w = c.moving ? Math.sin(c.walkPhase * 2) * 0.15 : Math.sin(now * 2) * 0.05;
    g.save(); g.translate(1, -6); g.rotate(0.35 + w);
    g.fillStyle = B.plume;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-2, -8, 3, -11); g.quadraticCurveTo(8, -10, 5, -6); g.quadraticCurveTo(3, -3, 0, 0); g.fill();
    g.restore();
  }
  g.fillStyle = B.head; circle(g, 0, 0, 6.8); g.fill();
  if (B.face) {
    g.fillStyle = B.face; ellipse(g, 4, 2.5, 4.2, 3.6); g.fill();
    g.strokeStyle = "#FFFFFF"; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(-3, -2.5); g.quadraticCurveTo(2, -5, 7, -3); g.moveTo(0, 5.5); g.quadraticCurveTo(4, 7, 7, 4); g.stroke();
  }
  if (B.brow) { g.strokeStyle = B.brow; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-4, -2); g.quadraticCurveTo(1, -4.5, 6, -2.5); g.stroke(); }
  g.fillStyle = "#3A3230";
  g.beginPath(); g.moveTo(5, -1.2); g.lineTo(10.5, 0.6 - c.beakOpen); g.lineTo(5, 2.4); g.closePath(); g.fill();
  drawEye(g, c, 3, -1.4, 0.62);
  g.restore();
  g.restore();
}

// ---------- Guinea fowl (polka dots and a funny helmet) ----------
function drawGuinea(g, c, B, now) {
  const bob = c.moving ? -Math.abs(Math.sin(c.walkPhase * 1.4)) * 1.8 : Math.sin(now * 2.4 + c.id) * 0.5;
  const by = -27 + bob + c.sit * 10;
  g.save();
  g.scale(c.dir, 1);
  if (c.sit < 0.6) drawLegPair(g, c, now, { hips: [-4, 5], hipY: by + 13, color: B.legs, width: 3, stride: 6, lift: 3.5, dangle: 12 });
  const gr = g.createRadialGradient(4, by - 10, 3, -3, by, 30);
  gr.addColorStop(0, B.light); gr.addColorStop(0.6, B.body); gr.addColorStop(1, B.shade);
  g.fillStyle = gr; ellipse(g, -3, by, 26, 20, -0.28); g.fill();
  g.save(); ellipse(g, -3, by, 26, 20, -0.28); g.clip();
  g.fillStyle = B.dot;
  let row = 0;
  for (let y = by - 24; y < by + 24; y += 4.6, row++) for (let x = -32 + (row % 2) * 2.3; x < 26; x += 4.6) { circle(g, x, y, 0.95); g.fill(); }
  g.restore();
  g.save(); g.translate(0, by - 4); g.rotate(-0.1 - (isFlapping(c) ? Math.sin(now * 34) * 0.5 + 0.5 : 0));
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(-20, 4); g.quadraticCurveTo(-8, 10, 4, 5); g.stroke();
  g.restore();
  let hx = 19, hy = by - 24;
  hx = lerp(hx, 27, c.headDown); hy = lerp(hy, -8, c.headDown); hy -= c.headUp * 4;
  if (c.sleep > 0.01) { hx = lerp(hx, 10, c.sleep); hy = lerp(hy, by - 16, c.sleep); }
  g.strokeStyle = B.shade; g.lineWidth = 5.5; g.lineCap = "round";
  g.beginPath(); g.moveTo(12, by - 10); g.quadraticCurveTo(20, by - 14, hx - 1, hy + 3); g.stroke();
  g.save(); g.translate(hx, hy); g.rotate(c.headDown * 0.8 - c.headUp * 0.3);
  g.fillStyle = B.casque; g.beginPath(); g.moveTo(-3, -4); g.lineTo(0, -13); g.lineTo(3, -4); g.closePath(); g.fill();
  g.fillStyle = B.face; circle(g, 0, 0, 6.2); g.fill();
  g.fillStyle = "#5E88C8"; ellipse(g, -1, 2, 3, 3.4); g.fill();
  g.fillStyle = B.wattle; ellipse(g, 4, 6.5, 1.8, 3); g.fill();
  g.fillStyle = B.beak; g.beginPath(); g.moveTo(4.5, -1.5); g.lineTo(10, 0.5 - c.beakOpen); g.lineTo(4.5, 2.5); g.closePath(); g.fill();
  drawEye(g, c, 2, -1.5, 0.7);
  g.restore();
  g.restore();
}

// ---------- Pheasants (super long tails) ----------
function drawPheasant(g, c, B, now) {
  const bob = c.moving ? Math.sin(c.walkPhase * 2) * 1.4 : Math.sin(now * 2 + c.id) * 0.5;
  const by = -30 + bob + c.sit * 12;
  const flap = isFlapping(c) ? Math.sin(now * 36) * 0.5 + 0.5 : 0;
  g.save();
  g.scale(c.dir, 1);
  if (c.sit < 0.6) drawLegPair(g, c, now, { hips: [-3, 5], hipY: by + 12, color: B.legs, width: 2.8, stride: 7, lift: 4, dangle: 14 });
  g.save(); g.translate(-20, by - 2);
  g.rotate(-0.1 + Math.sin(now * 1.3 + c.id) * 0.03 + (c.moving ? Math.sin(c.walkPhase * 2) * 0.04 : 0) - c.headDown * 0.1);
  for (const [len, w, ang] of [[62, 3.4, 0.02], [54, 3, 0.1], [46, 2.6, -0.06]]) {
    g.save(); g.rotate(ang);
    g.fillStyle = B.tail; ellipse(g, -len / 2, 0, len / 2, w); g.fill();
    g.strokeStyle = rgba(B.bars, 0.65); g.lineWidth = 1;
    for (let x = -len + 6; x < -4; x += 5) { g.beginPath(); g.moveTo(x, -w); g.lineTo(x + 1, w); g.stroke(); }
    g.restore();
  }
  g.restore();
  const gr = g.createRadialGradient(6, by - 6, 2, -2, by, 28);
  gr.addColorStop(0, B.light); gr.addColorStop(0.6, B.body); gr.addColorStop(1, B.shade);
  g.fillStyle = gr; ellipse(g, -2, by, 24, 13.5, -0.12); g.fill();
  g.save(); ellipse(g, -2, by, 24, 13.5, -0.12); g.clip();
  g.strokeStyle = "rgba(40,20,10,.35)"; g.lineWidth = 1;
  for (let row = 0; row < 4; row++) for (let x = -18 + (row % 2) * 3; x < 20; x += 6) { g.beginPath(); g.arc(x, by - 8 + row * 5, 2.6, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); }
  g.restore();
  if (B.cape) {       // the golden pheasant's striped cape
    g.save(); g.translate(12, by - 12);
    for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? B.capeBar : B.cape; ellipse(g, -2 - i * 1.2, 2 + i * 2.4, 10 - i, 4, -0.5); g.fill(); }
    g.restore();
  }
  g.save(); g.translate(0, by - 3); g.rotate(-0.08 - flap);
  g.fillStyle = B.wing; ellipse(g, -6, 1, 14, 7.5, -0.08); g.fill();
  g.restore();
  let hx = 17, hy = by - 20;
  hx = lerp(hx, 26, c.headDown); hy = lerp(hy, -8, c.headDown); hy -= c.headUp * 5;
  if (c.sleep > 0.01) { hx = lerp(hx, 10, c.sleep); hy = lerp(hy, by - 12, c.sleep); }
  g.strokeStyle = B.neck; g.lineWidth = 8.5; g.lineCap = "round";
  g.beginPath(); g.moveTo(9, by - 6); g.lineTo(hx - 2, hy + 3); g.stroke();
  if (B.ring) { const mx = lerp(9, hx, 0.35), my = lerp(by - 6, hy, 0.35); g.strokeStyle = B.ring; g.lineWidth = 2.4; g.beginPath(); g.moveTo(mx - 5, my - 1); g.lineTo(mx + 5, my + 1); g.stroke(); }
  g.save(); g.translate(hx, hy); g.rotate(c.headDown * 0.8 - c.headUp * 0.3);
  if (B.crest) { g.fillStyle = B.crest; g.beginPath(); g.moveTo(3, -6); g.quadraticCurveTo(-10, -10, -18, -2); g.quadraticCurveTo(-8, -4, -2, -1); g.closePath(); g.fill(); }
  const hg = g.createRadialGradient(2, -3, 1, 0, 0, 9); hg.addColorStop(0, B.headLight || B.head); hg.addColorStop(1, B.head);
  g.fillStyle = hg; circle(g, 0, 0, 7.5); g.fill();
  if (B.ear) { g.fillStyle = B.ear; g.beginPath(); g.moveTo(-4, -5); g.lineTo(-2, -12); g.lineTo(0, -5); g.closePath(); g.fill(); }
  if (B.wattle) { g.fillStyle = B.wattle; ellipse(g, 3.5, 0, 4.5, 4.4); g.fill(); }
  g.fillStyle = B.beak; g.beginPath(); g.moveTo(5.5, -1); g.lineTo(11.5, 1 - c.beakOpen); g.lineTo(5.5, 3); g.closePath(); g.fill();
  drawEye(g, c, 3.2, -1.2, 0.7);
  g.restore();
  g.restore();
}

// ---------- Turkeys (tap one to see its fan!) ----------
function drawTurkey(g, c, B, now) {
  const fan = c.fan || 0;
  const bob = c.moving ? Math.sin(c.walkPhase * 2) * 1.8 : Math.sin(now * 1.8 + c.id) * 0.5;
  const by = -40 + bob + c.sit * 16;
  g.save();
  g.scale(c.dir, 1);
  if (fan > 0.03) {     // the big fan tail stands up behind
    g.save(); g.translate(-12, by - 8);
    const R = lerp(26, 64, fan), spread = fan * 1.45, shake = fan > 0.8 ? Math.sin(now * 30) * 0.015 : 0;
    for (let i = 0; i < 13; i++) {
      const a = -Math.PI / 2 - 0.35 + (i / 12 - 0.5) * 2 * spread + shake;
      g.save(); g.rotate(a);
      g.fillStyle = B.tail; ellipse(g, R * 0.55, 0, R * 0.5, 7); g.fill();
      g.fillStyle = B.tailBand; ellipse(g, R * 0.97, 0, Math.max(1, R * 0.08), 6.2); g.fill();
      g.strokeStyle = "rgba(20,14,10,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(R, 0); g.stroke();
      g.restore();
    }
    g.restore();
  }
  if (fan < 0.5) { g.save(); g.globalAlpha *= 1 - fan * 2; g.fillStyle = B.tail; ellipse(g, -30, by + 6, 18, 7, 0.55); g.fill(); g.restore(); }
  if (c.sit < 0.6) drawLegPair(g, c, now, { hips: [-6, 7], hipY: by + 18, color: B.legs, width: 4, stride: 7, lift: 4, dangle: 16 });
  g.save(); g.translate(-2, by); g.scale(1 + fan * 0.08, 1 + fan * 0.08);
  const gr = g.createRadialGradient(6, -10, 3, 0, 0, 34);
  gr.addColorStop(0, B.light); gr.addColorStop(0.55, B.body); gr.addColorStop(1, B.shade);
  g.fillStyle = gr; ellipse(g, 0, 0, 31, 24, -0.18); g.fill();
  g.fillStyle = rgba(B.sheen, 0.35); ellipse(g, 6, -10, 16, 8, -0.3); g.fill();
  g.save(); ellipse(g, 0, 0, 31, 24, -0.18); g.clip();
  g.strokeStyle = "rgba(230,200,150,.25)"; g.lineWidth = 1.2;
  for (let row = 0; row < 6; row++) for (let x = -26 + (row % 2) * 3; x < 28; x += 6) { g.beginPath(); g.arc(x, -16 + row * 6, 2.8, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); }
  g.restore();
  g.restore();
  g.strokeStyle = B.beard; g.lineWidth = 1.4;
  g.beginPath(); for (let i = 0; i < 5; i++) { g.moveTo(22 + i * 0.5, by - 4); g.lineTo(22 + i * 0.8, by + 8); } g.stroke();
  g.save(); g.translate(0, by - 4); g.rotate(-0.1 - (isFlapping(c) ? Math.sin(now * 30) * 0.5 + 0.5 : 0) + fan * 0.25);
  g.fillStyle = B.wing; ellipse(g, -8, 2, 17, 9, -0.1); g.fill();
  g.strokeStyle = rgba(B.wingBar, 0.8); g.lineWidth = 1.4;
  for (let x = -20; x < 6; x += 5) { g.beginPath(); g.moveTo(x, -3); g.lineTo(x + 2, 8); g.stroke(); }
  g.restore();
  let hx = lerp(22, 14, fan), hy = lerp(by - 34, by - 26, fan);
  hx = lerp(hx, 30, c.headDown); hy = lerp(hy, -8, c.headDown); hy -= c.headUp * 4;
  if (c.sleep > 0.01) { hx = lerp(hx, 10, c.sleep); hy = lerp(hy, by - 16, c.sleep); }
  g.strokeStyle = B.neck; g.lineWidth = 7; g.lineCap = "round";
  g.beginPath(); g.moveTo(16, by - 12); g.quadraticCurveTo(26, by - 22, hx - 1, hy + 3); g.stroke();
  g.save(); g.translate(hx, hy); g.rotate(c.headDown * 0.8 - c.headUp * 0.3);
  g.fillStyle = B.head; circle(g, 0, 0, 6.5); g.fill();
  if (fan > 0.05) { g.fillStyle = `rgba(216,48,58,${0.5 * fan})`; circle(g, 0, 1, 6.4); g.fill(); }   // blushing while showing off
  const sn = lerp(4, 9, fan);
  g.fillStyle = B.wattle;
  g.beginPath(); g.moveTo(3, -4); g.quadraticCurveTo(9, -3, 8, sn); g.lineTo(6, sn); g.quadraticCurveTo(7, -1, 2, -2); g.closePath(); g.fill();   // the snood
  ellipse(g, 1, 7, 3.2, 5.5 * lerp(1, 1.3, fan)); g.fill();
  g.fillStyle = B.beak; g.beginPath(); g.moveTo(4.5, -1); g.lineTo(9.5, 1 - c.beakOpen); g.lineTo(4.5, 3); g.closePath(); g.fill();
  drawEye(g, c, 1.5, -2, 0.62);
  g.restore();
  g.restore();
}

// ---------- Flamingos (long legs, S-shaped neck, upside-down feeding) ----------
function drawFlamingo(g, c, B, now) {
  const bob = c.moving ? Math.sin(c.walkPhase * 2) * 1.2 : Math.sin(now * 1.6 + c.id) * 0.5;
  const by = -74 + bob + c.sit * 44;
  const flap = isFlapping(c) ? Math.sin(now * 26) * 0.5 + 0.5 : 0;
  g.save();
  g.scale(c.dir, 1);
  if (c.sit < 0.6) drawLegPair(g, c, now, { hips: [-3, 2], hipY: by + 8, color: B.legs, width: 2.6, stride: 10, lift: 6, web: true, knee: 5, dangle: 36, oneLeg: c.oneLeg > 0.5 });
  const gr = g.createRadialGradient(4, by - 6, 2, -4, by, 28);
  gr.addColorStop(0, B.light); gr.addColorStop(0.6, B.body); gr.addColorStop(1, B.shade);
  g.fillStyle = gr; ellipse(g, -4, by, 24, 13.5, -0.12); g.fill();
  g.save(); g.translate(-2, by - 3); g.rotate(-0.08 - flap);
  g.fillStyle = B.wingTip; ellipse(g, -20, 3, 9, 4, -0.1); g.fill();
  g.fillStyle = B.wing; ellipse(g, -6, 0, 17, 8, -0.08); g.fill();
  g.restore();
  let hx = 16, hy = by - 62;
  if (c.sleep > 0.01) { hx = lerp(hx, -8, c.sleep); hy = lerp(hy, by - 12, c.sleep); }
  hx = lerp(hx, 30, c.headDown); hy = lerp(hy, -4, c.headDown);
  hy -= c.headUp * 4;
  const d = c.headDown;
  g.strokeStyle = B.neck; g.lineWidth = 6.5; g.lineCap = "round";
  g.beginPath(); g.moveTo(14, by - 5);
  g.bezierCurveTo(lerp(34, 30, d), lerp(by - 22, by - 10, d), lerp(2, 40, d), lerp(by - 44, by - 4, d), hx - 1, hy + 3);
  g.stroke();
  g.save(); g.translate(hx, hy); g.rotate(d * 2.4 - c.headUp * 0.3 + c.sleep * 2.2);
  g.fillStyle = B.head; circle(g, 0, 0, 6.5); g.fill();
  g.fillStyle = B.bill;
  g.beginPath(); g.moveTo(4, -3); g.quadraticCurveTo(12, -3, 13, 1); g.quadraticCurveTo(13.5, 6, 11, 10); g.lineTo(9, 9.5); g.quadraticCurveTo(10, 5, 8, 3.5); g.quadraticCurveTo(6, 3, 4, 3); g.closePath(); g.fill();
  g.fillStyle = B.billTip;
  g.beginPath(); g.moveTo(13, 4); g.quadraticCurveTo(13.5, 7, 11, 10); g.lineTo(9, 9.5); g.quadraticCurveTo(10.5, 7, 10.5, 4.5); g.closePath(); g.fill();
  if (c.sleep > 0.5 || c.blink > 0) drawEye(g, c, 1.5, -1.5, 0.6);
  else { g.fillStyle = B.eye; circle(g, 1.5, -1.5, 1.8); g.fill(); g.fillStyle = "#1E1E22"; circle(g, 1.7, -1.5, 0.9); g.fill(); }
  g.restore();
  g.restore();
}

// ---------- Peacocks (the famous fan!) ----------
function drawPeacock(g, c, B, now) {
  const fan = c.fan || 0;
  const bob = c.moving ? Math.sin(c.walkPhase * 2) * 1.5 : Math.sin(now * 1.8 + c.id) * 0.5;
  const by = -36 + bob + c.sit * 14;
  g.save();
  g.scale(c.dir, 1);
  if (fan > 0.03) {
    g.save(); g.translate(-10, by - 6);
    const R = lerp(44, 112, fan), spread = fan * 1.5, shake = fan > 0.85 ? Math.sin(now * 34) * 0.012 : 0, N = 23;
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 - 0.18 + (i / (N - 1) - 0.5) * 2 * spread + shake * (i % 2 ? 1 : -1);
      g.save(); g.rotate(a);
      g.strokeStyle = rgba(B.trainDark, 0.9); g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(R, 0); g.stroke();
      g.fillStyle = B.train; ellipse(g, R * 0.62, 0, R * 0.4, 8); g.fill();
      g.fillStyle = B.eyeRing; ellipse(g, R * 0.9, 0, 9, 7.5); g.fill();
      g.fillStyle = B.eyeMid; ellipse(g, R * 0.9, 0, 6.5, 5.4); g.fill();
      g.fillStyle = B.eyeCore; ellipse(g, R * 0.91, 0, 3.8, 3.4); g.fill();
      g.restore();
    }
    for (let i = 0; i < N - 6; i++) {
      const a = -Math.PI / 2 - 0.18 + (i / (N - 7) - 0.5) * 2 * spread * 0.85;
      g.save(); g.rotate(a);
      g.fillStyle = B.eyeRing; ellipse(g, R * 0.58, 0, 7, 6); g.fill();
      g.fillStyle = B.eyeMid; ellipse(g, R * 0.58, 0, 5, 4.2); g.fill();
      g.fillStyle = B.eyeCore; ellipse(g, R * 0.59, 0, 2.8, 2.6); g.fill();
      g.restore();
    }
    g.restore();
  }
  if (fan < 0.95) {     // the long train, folded and dragging behind
    g.save(); g.globalAlpha *= clamp(1 - fan * 1.4);
    const L = 86, sway = Math.sin(now * 1.2 + c.id) * 2;
    g.fillStyle = B.train;
    g.beginPath(); g.moveTo(-18, by - 4); g.quadraticCurveTo(-50, by + 4 + sway, -18 - L, -3); g.lineTo(-16 - L, 1); g.quadraticCurveTo(-46, by + 18, -14, by + 10); g.closePath(); g.fill();
    for (let k = 0; k < 4; k++) {
      const t = 0.35 + k * 0.18, x = lerp(-18, -18 - L, t), y = lerp(by + 2, -1, t * t);
      g.fillStyle = B.eyeRing; ellipse(g, x, y, 4.5, 3); g.fill();
      g.fillStyle = B.eyeCore; ellipse(g, x, y, 2.2, 1.6); g.fill();
    }
    g.restore();
  }
  if (c.sit < 0.6) drawLegPair(g, c, now, { hips: [-4, 5], hipY: by + 13, color: B.legs, width: 3.2, stride: 7, lift: 4, dangle: 14 });
  const gr = g.createRadialGradient(6, by - 6, 2, -2, by, 26);
  gr.addColorStop(0, B.light); gr.addColorStop(0.6, B.body); gr.addColorStop(1, B.shade);
  g.fillStyle = gr; ellipse(g, -2, by, 22, 16, -0.2); g.fill();
  g.save(); ellipse(g, -2, by, 22, 16, -0.2); g.clip();
  g.fillStyle = B.back; ellipse(g, -14, by - 2, 14, 12); g.fill();
  g.restore();
  g.save(); g.translate(0, by - 3); g.rotate(-0.1 - (isFlapping(c) ? Math.sin(now * 30) * 0.5 + 0.5 : 0));
  g.fillStyle = B.wing; ellipse(g, -7, 1, 13, 7.5, -0.1); g.fill();
  g.strokeStyle = rgba(B.wingBar, 0.8); g.lineWidth = 1.2;
  for (let x = -17; x < 3; x += 4) { g.beginPath(); g.moveTo(x, -4); g.lineTo(x + 1, 6); g.stroke(); }
  g.restore();
  let hx = 15, hy = by - 36;
  hx = lerp(hx, 24, c.headDown); hy = lerp(hy, -8, c.headDown); hy -= c.headUp * 4;
  if (c.sleep > 0.01) { hx = lerp(hx, 6, c.sleep); hy = lerp(hy, by - 16, c.sleep); }
  g.strokeStyle = B.neck; g.lineWidth = 8; g.lineCap = "round";
  g.beginPath(); g.moveTo(8, by - 8); g.lineTo(hx - 1, hy + 3); g.stroke();
  g.save(); g.translate(hx, hy); g.rotate(c.headDown * 0.8 - c.headUp * 0.3);
  g.strokeStyle = B.crest; g.fillStyle = B.crest; g.lineWidth = 0.9;
  for (let i = -2; i <= 2; i++) { const tx = i * 2.4 - 1, ty = -15 + Math.abs(i) * 0.8; g.beginPath(); g.moveTo(0, -5); g.lineTo(tx, ty); g.stroke(); circle(g, tx, ty, 1.6); g.fill(); }
  g.fillStyle = B.head; circle(g, 0, 0, 6.8); g.fill();
  if (!B.noStripes) {
    g.strokeStyle = "#FFFFFF"; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-1, -4); g.quadraticCurveTo(3, -5.5, 6, -3.5); g.moveTo(-1, 1.5); g.quadraticCurveTo(3, 3, 6, 1); g.stroke();
  }
  g.fillStyle = "#C9BBA8"; g.beginPath(); g.moveTo(5, -1); g.lineTo(10.5, 0.8 - c.beakOpen); g.lineTo(5, 2.6); g.closePath(); g.fill();
  drawEye(g, c, 2.2, -1.2, 0.65);
  g.restore();
  g.restore();
}

// ---------- Butterflies ----------
function drawButterfly(g, b) {
  const sc = scaleAt(b.y);
  const fl = b.rest > 0 ? 0.35 + 0.25 * Math.sin(clock * 3) : Math.abs(Math.sin(clock * b.flapSpeed + b.ph));
  g.save();
  g.translate(b.x, b.y - b.z * sc);
  g.scale(sc * b.dir, sc);
  g.fillStyle = b.color;
  ellipse(g, -7 * fl, -3, 7 * fl + 0.6, 8, -0.35); g.fill();
  ellipse(g, 7 * fl, -3, 7 * fl + 0.6, 8, 0.35); g.fill();
  g.fillStyle = rgba(b.color === "#FFFFFF" ? "#DDE6F0" : b.color, 0.85);
  ellipse(g, -5 * fl, 5, 5 * fl + 0.5, 5); g.fill();
  ellipse(g, 5 * fl, 5, 5 * fl + 0.5, 5); g.fill();
  g.fillStyle = "#3A2E2A"; ellipse(g, 0, 0, 1.6, 7); g.fill();
  g.restore();
}

// ---------- Particles ----------
function drawParticles(g) {
  for (const p of fx.particles) {
    if (p.scene !== scene) continue;
    const a = clamp((p.life / p.max) * 1.6);
    const x = p.x, y = p.y - p.z;
    g.globalAlpha = a;
    switch (p.kind) {
      case "heart": g.fillStyle = "#FF5E7E"; drawHeart(g, x, y, p.size); break;
      case "feather":
        g.save(); g.translate(x, y); g.rotate(p.rot);
        g.fillStyle = p.color || "#FFFFFF"; ellipse(g, 0, 0, p.size, p.size * 0.35); g.fill();
        g.restore(); break;
      case "dust": g.fillStyle = "rgba(196,158,104,.5)"; circle(g, x, y, p.size); g.fill(); break;
      case "grain": g.fillStyle = "#E7C35C"; circle(g, x, y, 1.9 * p.size); g.fill(); break;
      case "drop": g.fillStyle = "#8ED6F5"; circle(g, x, y, 2.2 * p.size); g.fill(); break;
      case "sparkle": g.fillStyle = p.color || "#FFFFFF"; drawStar(g, x, y, p.size * (0.6 + 0.4 * Math.sin(p.life * 20))); break;
      case "confetti":
        g.save(); g.translate(x, y); g.rotate(p.rot);
        g.fillStyle = p.color; g.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
        g.restore(); break;
      case "note":
        g.fillStyle = "#5E4A8C"; g.font = `800 ${Math.round(18 * p.size)}px ${CANVAS_FONT}`;
        g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(p.text || "♪", x, y); break;
      case "plus":
        g.font = `900 ${Math.round(22 * p.size)}px ${CANVAS_FONT}`;
        g.textAlign = "center"; g.textBaseline = "middle";
        g.lineWidth = 4 * p.size; g.strokeStyle = "rgba(255,255,255,.95)"; g.strokeText(p.text, x, y);
        g.fillStyle = "#C8452D"; g.fillText(p.text, x, y); break;
      case "zzz":
        g.fillStyle = scene === "coop" ? "#5E6A9E" : "#FFFFFF";
        g.font = `900 ${Math.round((11 + (1 - p.life / p.max) * 9) * p.size)}px ${CANVAS_FONT}`;
        g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("z", x, y); break;
    }
  }
  g.globalAlpha = 1;
}

function drawForeground(g) {
  const H = view.H;
  g.lineCap = "round";
  const calm = reduceMotion ? 0.2 : 1;
  for (const b of fx.blades) {
    const sway = Math.sin(clock * 1.4 + b.ph) * b.h * 0.08 * calm;
    g.strokeStyle = b.col; g.lineWidth = b.w;
    g.beginPath(); g.moveTo(b.x, H + 6); g.quadraticCurveTo(b.x + sway * 0.3, H - b.h * 0.5, b.x + sway + b.lean, H - b.h); g.stroke();
    if (b.seed) { g.fillStyle = "#D8C27A"; ellipse(g, b.x + sway + b.lean, H - b.h - 3, 2.4, 5, 0.2); g.fill(); }   // wheat heads in the meadow
  }
}

// Sunset glow, night darkness, and warm lights in the house windows
function lightYard(g) {
  const d = darkness(), w = warmth();
  g.save();
  if (w > 0.01) { g.globalCompositeOperation = "source-atop"; g.fillStyle = `rgba(255,150,80,${0.16 * w})`; g.fillRect(-100, -100, view.W + 200, view.H + 200); }
  if (d > 0.01) { g.globalCompositeOperation = "source-atop"; g.fillStyle = `rgba(16,24,62,${0.6 * d})`; g.fillRect(-100, -100, view.W + 200, view.H + 200); }
  g.globalCompositeOperation = "lighter";
  if (d > 0.05) {
    const c = places.coop, sc = scaleAt(c.y);
    for (const [x, y, r] of houseGeo().glows) glow(g, c.x + x * sc, c.y + y * sc, r * sc * 2.2, `rgba(255,196,110,${0.5 * d})`);
  }
  for (const f of fx.fireflies) {
    const sc = scaleAt(f.y), pulse = 0.5 + 0.5 * Math.sin(f.ph * 3.1);
    const a = clamp((0.25 + 0.75 * pulse) * f.life * d + (f.boost > 0 ? 0.5 : 0));
    const r = (12 + (f.boost > 0 ? 10 : 0)) * sc, x = f.x, y = f.y - f.z * sc;
    glow(g, x, y, r, `rgba(225,255,140,${a})`);
    g.fillStyle = `rgba(250,255,210,${a})`; circle(g, x, y, 1.6 * sc); g.fill();
  }
  g.restore();
}

// Name tags, the egg badge on the house, and "fill me!" bubbles
let badgeRect = null;
function drawYardUI(g) {
  for (const c of F.birds) {
    if (c.loc === "yard" && c.tagT > 0 && c.state !== "enter" && c.state !== "exit") {
      const sc = scaleAt(c.y);
      drawTag(g, c, c.x, c.y - c.z - (headH(c) - sinkOf(c)) * sc - 8);
    } else c.tagRect = null;
  }
  badgeRect = null;
  if (F.nestEggs.length) {
    const p = badgePos();
    g.font = `900 19px ${CANVAS_FONT}`;
    const label = String(F.nestEggs.length), w = g.measureText(label).width + 50, h = 38;
    g.fillStyle = "rgba(255,251,242,.95)";
    roundRect(g, p.x - w / 2, p.y - h, w, h, h / 2); g.fill();
    g.beginPath(); g.moveTo(p.x - 7, p.y); g.lineTo(p.x, p.y + 8); g.lineTo(p.x + 7, p.y); g.fill();
    const last = F.nestEggs[F.nestEggs.length - 1], esz = SPECIES[BREEDS[last.breed].species].egg[1];
    g.save(); g.translate(p.x - w / 2 + 19, p.y - 7); drawEgg(g, last.breed, F.nestEggs.some((e) => e.golden), 10 / esz); g.restore();
    g.fillStyle = "#2F2A24"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(label, p.x + 11, p.y - h / 2 + 1);
    badgeRect = { x: p.x - w / 2 - 8, y: p.y - h - 8, w: w + 16, h: h + 18 };
  }
  bubble(g, places.feeder, 108, F.feeder, "🌽");
  if (places.waterer) bubble(g, places.waterer, 108, F.water, "💧");
}
function bubble(g, place, up, level, emoji) {
  if (level >= 0.25) return;
  const sc = scaleAt(place.y), x = place.x, y = place.y - up * sc - 16 + Math.sin(clock * 3) * 3;
  const pulse = 1 + Math.sin(clock * 4) * 0.06;
  g.save();
  g.translate(x, y); g.scale(pulse, pulse);
  g.fillStyle = "rgba(255,251,242,.95)"; circle(g, 0, 0, 21); g.fill();
  g.beginPath(); g.moveTo(-6, 18); g.lineTo(0, 27); g.lineTo(6, 18); g.fill();
  g.drawImage(emojiSprite(emoji, 24), -15, -15, 30, 30);
  g.restore();
}
function drawTag(g, c, x, y) {
  const [, emo] = moodText(c);
  const label = `${c.name}  ${emo}  ›`;
  g.font = `800 15px ${CANVAS_FONT}`;
  const w = g.measureText(label).width + 26, h = 30, a = Math.min(1, c.tagT * 3);
  const rx = x - w / 2, ry = y - h;
  g.save();
  g.globalAlpha = a;
  g.fillStyle = "rgba(255,251,242,.95)";
  roundRect(g, rx, ry, w, h, 15); g.fill();
  g.beginPath(); g.moveTo(x - 6, ry + h); g.lineTo(x, ry + h + 6); g.lineTo(x + 6, ry + h); g.fill();
  g.fillStyle = "#2F2A24"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(label, x, ry + h / 2 + 1);
  g.restore();
  c.tagRect = { x: rx - 6, y: ry - 6, w: w + 12, h: h + 14 };
}

// Emoji drawn once into a tiny canvas, then reused (much faster)
const spriteCache = new Map();
function emojiSprite(emoji, size) {
  const q = Math.max(8, Math.round(size / 4) * 4), key = emoji + "@" + q;
  let cv = spriteCache.get(key);
  if (cv) return cv;
  const px = Math.max(8, Math.ceil(q * view.s * view.dpr * 1.25));
  cv = document.createElement("canvas");
  cv.width = cv.height = px;
  const g = cv.getContext("2d");
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `${Math.round(px * 0.78)}px ${EMOJI_FONT}`;
  g.fillText(emoji, px / 2, px / 2 + px * 0.04);
  spriteCache.set(key, cv);
  return cv;
}


/* ================================================================
   14. PAINTING: INSIDE THE COOP, LITTLE PICTURES
   ================================================================ */
function buildRoomBg() {
  const W = view.W, H = view.H, fy = room.floorY, t = farms.backyard.tier;
  roomCanvas.width = worldCanvas.width;
  roomCanvas.height = worldCanvas.height;
  const g = roomCtx;
  g.setTransform(view.dpr * view.s, 0, 0, view.dpr * view.s, 0, 0);
  const R = seeded(77 + t);
  // walls
  if (t === 1) {
    const gr = g.createLinearGradient(0, 0, 0, fy);
    gr.addColorStop(0, "#A87649"); gr.addColorStop(1, "#C8935F");
    g.fillStyle = gr; g.fillRect(0, 0, W, fy);
    for (let x = 0; x < W; x += 38) {
      g.fillStyle = `rgba(80,45,20,${0.04 + R() * 0.08})`; g.fillRect(x, 0, 38, fy);
      g.fillStyle = "rgba(70,40,18,.35)"; g.fillRect(x, 0, 2, fy);
      g.fillStyle = "rgba(60,40,30,.5)";
      circle(g, x + 19, fy * 0.3, 1.6); g.fill();
      circle(g, x + 19, fy * 0.75, 1.6); g.fill();
    }
  } else if (t === 2) {
    g.fillStyle = "#EFE5D3"; g.fillRect(0, 0, W, fy);
    for (let x = 0; x < W; x += 34) { g.fillStyle = "rgba(150,120,90,.16)"; g.fillRect(x, 0, 1.5, fy); }
    g.fillStyle = "#E2D2B6"; g.fillRect(0, fy - 70, W, 70);
    g.fillStyle = "#B83B2C"; g.fillRect(0, fy - 76, W, 10);
  } else {
    g.fillStyle = "#FFF1E6"; g.fillRect(0, 0, W, fy);
    g.fillStyle = "rgba(230,178,58,.35)";
    for (let y = 40; y < fy - 110; y += 40) for (let x = (y / 40) % 2 ? 22 : 0; x < W; x += 44) {
      g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 5, y); g.lineTo(x, y + 5); g.lineTo(x - 5, y); g.closePath(); g.fill();
    }
    g.fillStyle = "#F5BFCB"; g.fillRect(0, fy - 110, W, 110);
    g.fillStyle = "#E6B23A"; g.fillRect(0, fy - 114, W, 5); g.fillRect(0, 34, W, 6);
  }
  g.fillStyle = t === 3 ? "#E6B23A" : "#6E4A2E"; g.fillRect(0, 0, W, 34);
  g.fillStyle = "rgba(0,0,0,.15)"; g.fillRect(0, 34, W, 6);
  // floor
  if (t === 3) {
    for (let y = fy; y < H; y += 48) for (let x = 0; x < W; x += 48) {
      g.fillStyle = ((x + y) / 48) % 2 ? "#FFF4EC" : "#F8D9E0"; g.fillRect(x, y, 48, 48);
    }
    g.fillStyle = "rgba(230,178,58,.5)";
    for (let y = fy; y < H; y += 48) g.fillRect(0, y, W, 1.5);
    for (let x = 0; x < W; x += 48) g.fillRect(x, fy, 1.5, H - fy);
  } else {
    const gr = g.createLinearGradient(0, fy, 0, H);
    gr.addColorStop(0, "#DDBD78"); gr.addColorStop(1, "#CFA95C");
    g.fillStyle = gr; g.fillRect(0, fy, W, H - fy);
  }
  const straw = ["#F0D48A", "#D9B56A", "#C79B4E", "#F6E1A0"];
  g.lineCap = "round";
  for (let i = 0; i < (t === 3 ? 160 : 800); i++) {
    const x = R() * W, y = fy + 6 + R() * (H - fy), a = R() * TAU, l = 6 + R() * 10;
    g.strokeStyle = straw[Math.floor(R() * 4)]; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.4); g.stroke();
  }
  const sg = g.createLinearGradient(0, fy, 0, fy + 34);
  sg.addColorStop(0, "rgba(0,0,0,.2)"); sg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = sg; g.fillRect(0, fy, W, 34);
  if (room.boxes.length) {
    const b0 = room.boxes[0], last = room.boxes[room.boxes.length - 1];
    g.fillStyle = "#7A5134"; g.fillRect(b0.x - 12, fy - 42, last.x + last.w - b0.x + 24, 10);
    g.fillRect(b0.x - 4, fy - 34, 8, 40); g.fillRect(last.x + last.w - 4, fy - 34, 8, 40);
  }
  for (const b of room.boxes) {
    g.fillStyle = t === 3 ? "#F5BFCB" : "#6B4428"; roundRect(g, b.x, b.y, b.w, b.h, 6); g.fill();
    g.fillStyle = t === 3 ? "#B35C78" : "#3E2716"; roundRect(g, b.x + 8, b.y + 10, b.w - 16, b.h - 22, 5); g.fill();
    g.fillStyle = t === 3 ? "#E6B23A" : "#8C5C36";
    g.beginPath(); g.moveTo(b.x - 6, b.y + 4); g.lineTo(b.x + b.w / 2, b.y - 14); g.lineTo(b.x + b.w + 6, b.y + 4); g.closePath(); g.fill();
    g.strokeStyle = "#E9C872"; g.lineWidth = 2;
    for (let k = 0; k < 14; k++) { const x = b.x + 12 + R() * (b.w - 24), y = b.y + b.h - 34 + R() * 10; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 16, y - 2 - R() * 6); g.stroke(); }
  }
  for (const b of room.bars) {
    g.fillStyle = t === 3 ? "#C9971F" : "#6E4A2E";
    g.fillRect(b.x1 - 6, b.y, 10, fy + 40 - b.y);
    g.fillRect(b.x2 - 4, b.y, 10, fy + 40 - b.y);
    const bg = g.createLinearGradient(0, b.y - 7, 0, b.y + 7);
    bg.addColorStop(0, t === 3 ? "#F7DC82" : "#A87447"); bg.addColorStop(1, t === 3 ? "#C9971F" : "#7A4F2A");
    g.fillStyle = bg; roundRect(g, b.x1 - 12, b.y - 7, b.x2 - b.x1 + 24, 14, 7); g.fill();
  }
  const d = room.door;
  g.fillStyle = t === 3 ? "#E6B23A" : "#5E4029";
  roundRect(g, d.x - 10, d.y - 10, d.w + 20, d.h + 10, 8); g.fill();
}

function insidePos(c) {
  if (c.loc === "nest") { const b = room.boxes[c.nestBox] || room.boxes[0]; return { x: b.x + b.w / 2, y: b.y + b.h - 12 }; }
  const s = room.slots[c.roostSlot] || room.slots[0];
  return { x: s.x, y: s.y + 1 };
}
function nestEggPos(e) {
  const box = room.boxes[e.box] || room.boxes[0];
  const idx = F.nestEggs.filter((x) => x.box === e.box).indexOf(e);
  return { x: box.x + box.w / 2 + (idx - 1) * 26, y: box.y + box.h - 16 };
}
function decorRect(d) {
  const def = DECOR_BY_ID[d.id], x = d.x * view.W, y = d.y * view.H;
  const floorN = room.floorY / view.H;
  let size = y > room.floorY ? lerp(58, 88, clamp((d.y - floorN) / (1 - floorN))) : 60;
  size *= def.big || 1;
  const bounce = d.bounce > 0 ? 1 + Math.sin((d.bounce / 0.5) * Math.PI) * 0.15 : 1;
  return { cx: x, cy: y - size * 0.5, by: y, size, draw: size * bounce };
}

function drawRoom(g) {
  const d = darkness();
  g.drawImage(roomCanvas, 0, 0, view.W, view.H);
  drawRoomWindow(g, d);
  drawRoomDoor(g, d);
  for (let b = 0; b < room.boxes.length; b++) drawNestBox(g, b);
  const items = [];
  for (const dc of F.decor) items.push({ y: dc.y * view.H, f: () => drawDecor(g, dc) });
  for (const c of F.birds) if (c.loc === "coop") { const p = insidePos(c); items.push({ y: p.y, f: () => drawInsideBird(g, c, p) }); }
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.f();
  drawLantern(g, d);
  drawParticles(g);
  if (d < 0.7) {   // a soft beam of sunlight from the window
    const w = room.window, a = 0.16 * (1 - d / 0.7), shift = (clamp((game.time - 0.01) / 0.76) - 0.5) * -260;
    g.save();
    g.globalCompositeOperation = "lighter";
    const gr = g.createLinearGradient(0, w.y + w.h, 0, view.H);
    gr.addColorStop(0, `rgba(255,240,200,${a})`); gr.addColorStop(1, "rgba(255,240,200,0)");
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(w.x + 8, w.y + w.h); g.lineTo(w.x + w.w - 8, w.y + w.h); g.lineTo(w.x + w.w + 60 + shift, view.H); g.lineTo(w.x - 60 + shift, view.H); g.closePath(); g.fill();
    g.restore();
  }
  lightRoom(g, d);
  for (const c of F.birds) {
    if (c.loc !== "yard" && c.tagT > 0) { const p = insidePos(c); drawTag(g, c, p.x, p.y - (isBaby(c) ? 44 : 80) + c.sit * 14); }
    else if (c.loc !== "yard") c.tagRect = null;
  }
}
function drawRoomWindow(g, d) {
  const w = room.window, [top, bot] = skyAt(game.time);
  g.save();
  roundRect(g, w.x, w.y, w.w, w.h, 10); g.clip();
  const gr = g.createLinearGradient(0, w.y, 0, w.y + w.h);
  gr.addColorStop(0, top); gr.addColorStop(1, bot);
  g.fillStyle = gr; g.fillRect(w.x, w.y, w.w, w.h);
  if (d < 0.6) {
    const p = clamp((game.time - 0.01) / 0.76);
    g.fillStyle = "rgba(255,244,210,.95)";
    circle(g, w.x + w.w * p, w.y + w.h * 0.75 - Math.sin(p * Math.PI) * w.h * 0.55, 13); g.fill();
  } else {
    g.fillStyle = "rgba(255,255,240,.8)";
    for (const [sx, sy] of [[0.15, 0.2], [0.35, 0.4], [0.55, 0.15], [0.85, 0.3], [0.25, 0.6]]) { circle(g, w.x + w.w * sx, w.y + w.h * sy, 1.3); g.fill(); }
    g.fillStyle = "#F3F0E2"; circle(g, w.x + w.w * 0.7, w.y + w.h * 0.35, 12); g.fill();
  }
  g.fillStyle = mix("#8DC06A", "#23392A", d);
  g.beginPath(); g.moveTo(w.x, w.y + w.h);
  for (let x = 0; x <= w.w; x += 10) g.lineTo(w.x + x, w.y + w.h * 0.78 - Math.sin(x * 0.04 + 1) * 8 - Math.sin(x * 0.09) * 4);
  g.lineTo(w.x + w.w, w.y + w.h); g.closePath(); g.fill();
  g.restore();
  const tier = farms.backyard.tier;
  const frame = tier === 3 ? "#E6B23A" : tier === 2 ? "#5F7F96" : "#7A5134";
  g.strokeStyle = frame; g.lineWidth = 10; roundRect(g, w.x, w.y, w.w, w.h, 10); g.stroke();
  g.lineWidth = 6;
  g.beginPath(); g.moveTo(w.x + w.w / 2, w.y); g.lineTo(w.x + w.w / 2, w.y + w.h); g.moveTo(w.x, w.y + w.h / 2); g.lineTo(w.x + w.w, w.y + w.h / 2); g.stroke();
  g.fillStyle = frame; roundRect(g, w.x - 14, w.y + w.h + 4, w.w + 28, 10, 4); g.fill();
}
function drawRoomDoor(g, d) {
  const r = room.door, [top, bot] = skyAt(game.time);
  g.save();
  roundRect(g, r.x, r.y, r.w, r.h, 8); g.clip();
  const gr = g.createLinearGradient(0, r.y, 0, r.y + r.h);
  gr.addColorStop(0, top); gr.addColorStop(0.45, bot);
  gr.addColorStop(0.46, mix("#8CC45A", "#22381F", d)); gr.addColorStop(1, mix("#6FAE3E", "#1A2C18", d));
  g.fillStyle = gr; g.fillRect(r.x, r.y, r.w, r.h);
  if (F.doorClosed) {
    g.fillStyle = "#8A5A36"; g.fillRect(r.x, r.y, r.w, r.h);
    g.strokeStyle = "rgba(60,35,15,.4)"; g.lineWidth = 2;
    for (let x = r.x + 14; x < r.x + r.w; x += 14) { g.beginPath(); g.moveTo(x, r.y); g.lineTo(x, r.y + r.h); g.stroke(); }
  }
  g.restore();
  if (!F.doorClosed && d < 0.6) {   // daylight spilling in across the floor
    g.fillStyle = `rgba(255,245,200,${0.14 * (1 - d)})`;
    g.beginPath(); g.moveTo(r.x, r.y + r.h); g.lineTo(r.x + r.w, r.y + r.h); g.lineTo(r.x + r.w + 110, view.H); g.lineTo(r.x - 10, view.H); g.closePath(); g.fill();
  }
  const lx = r.x + r.w / 2, ly = r.y - 24;
  g.font = `800 15px ${CANVAS_FONT}`;
  const label = "‹ Yard", w = g.measureText(label).width + 24;
  g.fillStyle = "rgba(255,251,242,.92)"; roundRect(g, lx - w / 2, ly - 14, w, 28, 14); g.fill();
  g.fillStyle = "#2F2A24"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(label, lx, ly + 1);
}
function drawNestBox(g, b) {
  const box = room.boxes[b], t = farms.backyard.tier;
  const hen = F.birds.find((c) => c.loc === "nest" && c.nestBox === b);
  if (hen) drawInsideBird(g, hen, insidePos(hen));
  const ly = box.y + box.h - 30;
  const lg = g.createLinearGradient(0, ly, 0, box.y + box.h);
  lg.addColorStop(0, t === 3 ? "#F7C6D2" : "#B07A4C"); lg.addColorStop(1, t === 3 ? "#E9A7B8" : "#8C5C36");
  g.fillStyle = lg; roundRect(g, box.x - 2, ly, box.w + 4, 30, 6); g.fill();
  g.strokeStyle = "#F0CF7A"; g.lineWidth = 2;
  g.beginPath();
  for (let i = 0; i < 9; i++) { const x = box.x + 8 + (i * (box.w - 16)) / 8; g.moveTo(x, ly + 2); g.lineTo(x + (i % 2 ? 5 : -5), ly - 6 - (i % 3) * 2); }
  g.stroke();
  if (t === 3) { g.strokeStyle = "#E6B23A"; g.lineWidth = 3; roundRect(g, box.x - 2, ly, box.w + 4, 30, 6); g.stroke(); }
  for (const e of F.nestEggs) {
    if (e.box !== b) continue;
    const p = nestEggPos(e);
    g.save(); g.translate(p.x, p.y); drawEgg(g, e.breed, e.golden, 1.25); g.restore();
  }
}
function drawInsideBird(g, c, p) {
  g.save();
  g.translate(p.x, p.y);
  const s = 1 - c.popIn * 0.3;
  g.globalAlpha = 1 - c.popIn;
  g.scale(s, s);
  drawBird(g, c, clock);
  g.restore();
}
function drawDecor(g, dc) {
  const def = DECOR_BY_ID[dc.id], r = decorRect(dc);
  if (r.by > room.floorY) { g.fillStyle = "rgba(60,40,20,.2)"; ellipse(g, r.cx, r.by - 2, r.size * 0.36, r.size * 0.08); g.fill(); }
  if (def.toy === "disco") { g.strokeStyle = "rgba(60,50,40,.6)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(r.cx, 34); g.lineTo(r.cx, r.cy - r.size * 0.45); g.stroke(); }
  const s = emojiSprite(def.emoji, r.size), dw = r.draw * 1.25;
  g.save();
  g.translate(r.cx, r.cy);
  if (def.toy === "chime") g.rotate(Math.sin(clock * 1.7) * 0.05);
  if (def.toy === "disco" && Music.discoOn) g.rotate(Math.sin(clock * 3) * 0.08);
  g.drawImage(s, -dw / 2, -dw / 2, dw, dw);
  g.restore();
}
function drawLantern(g, d) {
  const L = room.lantern, flick = 0.9 + 0.1 * Math.sin(clock * 13) + 0.05 * Math.sin(clock * 7.3), lit = 0.25 + 0.75 * d;
  g.strokeStyle = "#4A3A2A"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(L.x, 34); g.lineTo(L.x, L.y - 28); g.stroke();
  g.fillStyle = "#3E3A36";
  g.beginPath(); g.moveTo(L.x - 16, L.y - 18); g.lineTo(L.x, L.y - 30); g.lineTo(L.x + 16, L.y - 18); g.closePath(); g.fill();
  g.fillStyle = `rgba(255,${Math.round(200 + 30 * lit)},120,${0.35 + 0.6 * lit * flick})`;
  roundRect(g, L.x - 12, L.y - 18, 24, 30, 5); g.fill();
  g.strokeStyle = "#3E3A36"; g.lineWidth = 2.5; g.stroke();
  g.fillStyle = "#FFF3C4"; ellipse(g, L.x, L.y - 2, 3, 6 * flick); g.fill();
  g.fillStyle = "#3E3A36"; g.fillRect(L.x - 14, L.y + 12, 28, 5);
}
function lightRoom(g, d) {
  g.save();
  if (d > 0.01) { g.globalCompositeOperation = "source-atop"; g.fillStyle = `rgba(14,20,54,${0.62 * d})`; g.fillRect(-100, -100, view.W + 200, view.H + 200); }
  g.globalCompositeOperation = "lighter";
  const L = room.lantern, flick = 0.92 + 0.08 * Math.sin(clock * 13) + 0.04 * Math.sin(clock * 7.1);
  glow(g, L.x, L.y, 300, `rgba(255,180,100,${(0.1 + 0.45 * d) * flick})`);
  const w = room.window;
  glow(g, w.x + w.w / 2, w.y + w.h / 2, 190, d > 0.5 ? `rgba(160,180,255,${0.12 * d})` : `rgba(255,250,220,${0.1 * (1 - d)})`);
  for (const dc of F.decor) {
    if (DECOR_BY_ID[dc.id].glow) { const r = decorRect(dc); glow(g, r.cx, r.cy, 120, `rgba(255,120,80,${0.08 + 0.35 * d})`); }
  }
  if (Music.discoOn) {
    for (let i = 0; i < 7; i++) {
      const hue = (i * 51 + clock * 70) % 360;
      const x = view.W * 0.5 + Math.cos(clock * 0.9 + i * 0.9) * view.W * 0.42;
      const y = view.H * 0.46 + Math.sin(clock * 1.3 + i * 1.7) * view.H * 0.34;
      glow(g, x, y, 95, `hsla(${hue},95%,62%,.38)`);
    }
  }
  g.restore();
}

// ---------- Eggs flying to your basket (drawn in screen pixels) ----------
function drawFlyers(g) {
  if (!fx.flyers.length) return;
  g.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  for (const f of fx.flyers) {
    if (f.t < 0) continue;
    const t = easeInOut(clamp(f.t / f.dur));
    const cx = (f.sx + f.ex) / 2, cy = Math.min(f.sy, f.ey) - 120;
    const x = bez(f.sx, cx, f.ex, t), y = bez(f.sy, cy, f.ey, t), s = lerp(1.7, 0.9, t);
    g.save();
    g.translate(x, y + 11 * s);
    g.scale(s, s);
    g.rotate(t * 6);
    drawEgg(g, f.breed, f.golden, 11 / SPECIES[BREEDS[f.breed].species].egg[1]);
    g.restore();
  }
}

// ---------- Little pictures in the Market, the Map, and the name card ----------
function portraitBird(breed) {
  const c = makeBird({ breed, growth: 1 });
  nextId--;
  c.id = 3; c.dir = 1; c.state = "idle";
  if (SPECIES[BREEDS[breed].species].acts.display) c.fan = 1;   // show off that tail!
  return c;
}
function prepCanvas(cv, cssW, cssH) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.round(cssW * dpr), H = Math.round(cssH * dpr);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const g = cv.getContext("2d");
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, W, H);
  return { g, dpr };
}
function drawPortrait(cv, c, cssW, cssH) {
  const { g, dpr } = prepCanvas(cv, cssW, cssH);
  const S = SP(c), P = S.portrait, size = S.size * smallK(c);
  let s = Math.min(cssW / P.w, cssH / P.h) * dpr;
  if (isBaby(c)) s *= 1.8;
  g.setTransform(s, 0, 0, s, cv.width / 2 + P.x * s, cv.height * 0.9);
  g.fillStyle = "rgba(60,50,20,.14)"; ellipse(g, 0, 0, 30 * size, 7 * size); g.fill();
  g.scale(S.size, S.size);
  drawBird(g, c, clock);
}
function drawCoopMini(cv, tier, cssW, cssH) {
  const { g, dpr } = prepCanvas(cv, cssW, cssH);
  const geo = COOP_GEO[tier];
  const s = Math.min(cssW / (geo.halfW * 2 + 40), cssH / (-geo.roofTop + 60)) * dpr;
  g.setTransform(s, 0, 0, s, cv.width / 2, cv.height - (geo.rampLen + 12) * s);
  g.fillStyle = "#9CCB63"; ellipse(g, 0, geo.rampLen - 4, geo.halfW + 20, 18); g.fill();
  drawHouse(g, "backyard", tier, 0, false);
}
// A tiny postcard of a farm, for the map
function drawFarmMini(cv, id) {
  const { g, dpr } = prepCanvas(cv, 260, 130);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const SC = SCENERY[id];
  const [top, bot] = skyAt(0.3);
  let gr = g.createLinearGradient(0, 0, 0, 56);
  gr.addColorStop(0, top); gr.addColorStop(1, bot);
  g.fillStyle = gr; g.fillRect(0, 0, 260, 60);
  g.fillStyle = SC.hill1;
  g.beginPath(); g.moveTo(0, 60); for (let x = 0; x <= 260; x += 10) g.lineTo(x, 46 - Math.sin(x * 0.03 + id.length) * 8); g.lineTo(260, 60); g.closePath(); g.fill();
  gr = g.createLinearGradient(0, 52, 0, 130);
  gr.addColorStop(0, SC.g[0]); gr.addColorStop(1, SC.g[2]);
  g.fillStyle = gr; g.fillRect(0, 52, 260, 78);
  if (SC.water) {
    if (id === "lagoon") { g.fillStyle = "#EFDDAA"; ellipse(g, 170, 92, 84, 28); g.fill(); }
    const wg = g.createRadialGradient(165, 88, 6, 170, 92, 72);
    wg.addColorStop(0, SC.water.deep); wg.addColorStop(1, SC.water.shallow);
    g.fillStyle = wg; ellipse(g, 170, 92, 70, 21); g.fill();
  }
  const tier = id === "backyard" ? farms.backyard.tier : 1, geo = houseGeo(id);
  const hs = Math.min(0.42, 88 / -geo.roofTop);
  g.save(); g.translate(58, 104); g.scale(hs, hs); drawHouse(g, id, tier, 0, false); g.restore();
  FARMS[id].mascots.forEach((breed, i) => {
    const c = portraitBird(breed), S = SP(c);
    const k = Math.min(0.42, 62 / (S.height * S.size));
    g.save(); g.translate(i ? 214 : 162, i ? 118 : 110); g.scale(k * S.size, k * S.size); drawBird(g, c, clock); g.restore();
  });
}


/* ================================================================
   15. TOUCH CONTROLS
   ================================================================
   One finger can do four things:
     TAP ............ a quick touch
     SLIDE .......... move your finger (pets a bird)
     PRESS & HOLD ... keep your finger still (picks up a bird)
     DRAG ........... move a decoration inside the coop
*/
const gestures = new Map();

function toWorld(e) {
  const r = worldCanvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / view.s, y: (e.clientY - r.top) / view.s };
}

worldCanvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  Sound.unlock();
  if (!started) { begin(); return; }
  if (trans.on || openSheet) return;
  const p = toWorld(e);
  const hit = scene === "yard" ? hitYard(p) : hitRoom(p);
  const gst = { start: p, last: p, hit, mode: null, holdTimer: 0 };
  gestures.set(e.pointerId, gst);
  try { worldCanvas.setPointerCapture(e.pointerId); } catch (_) { /* fine */ }
  if (hit.kind === "bird" && scene === "yard" && canPickUp(hit.c)) {
    gst.holdTimer = setTimeout(() => { if (gst.mode === null) { gst.mode = "carry"; pickUp(hit.c, gst.last); } }, 360);
  }
});
window.addEventListener("pointermove", (e) => {
  const gst = gestures.get(e.pointerId);
  if (!gst) return;
  e.preventDefault();
  const p = toWorld(e), prev = gst.last;
  gst.last = p;
  const moved = Math.hypot(p.x - gst.start.x, p.y - gst.start.y) * view.s;   // in screen pixels
  if (gst.mode === null && moved > 10) {
    clearTimeout(gst.holdTimer);
    if (gst.hit.kind === "bird") gst.mode = "pet";
    else if (gst.hit.kind === "decor") { gst.mode = "drag"; dismissCoach("decorate"); }
    else gst.mode = "swipe";
  }
  if (gst.mode === "carry") carryTo(gst.hit.c, p);
  else if (gst.mode === "drag") dragDecor(gst.hit.d, p);
  else if (gst.mode === "pet") {
    const h = scene === "yard" ? hitYard(p) : hitRoom(p);
    if (h.kind === "bird") petBird(h.c, Math.hypot(p.x - prev.x, p.y - prev.y));
  }
}, { passive: false });
function endGesture(e) {
  const gst = gestures.get(e.pointerId);
  if (!gst) return;
  gestures.delete(e.pointerId);
  clearTimeout(gst.holdTimer);
  if (gst.mode === "carry") dropBird(gst.hit.c);
  else if (gst.mode === "drag") { Sound.tick(); save(); }
  else if (gst.mode === null && e.type === "pointerup" && !trans.on) {
    if (scene === "yard") tapYard(gst.hit, gst.start); else tapRoom(gst.hit);
  }
}
window.addEventListener("pointerup", endGesture);
window.addEventListener("pointercancel", endGesture);

// ---------- What did your finger touch? ----------
function hitYard(p) {
  for (const c of F.birds) if (c.loc === "yard" && c.tagT > 0 && inRect(p, c.tagRect)) return { kind: "tag", c };
  let best = null, bd = 1e9;
  for (const e of F.yardEggs) {
    const sc = scaleAt(e.y), d = Math.hypot(p.x - e.x, p.y - (e.y - 12 * sc));
    if (d < Math.max(28, 30 * sc) && d < bd) { bd = d; best = e; }
  }
  if (best) return { kind: "egg", e: best };
  const list = F.birds.filter((c) => c.loc === "yard" && c.state !== "enter" && c.state !== "exit").sort((a, b) => b.y - a.y);
  for (const c of list) {
    const S = SP(c), sc = scaleAt(c.y), k = S.size * smallK(c);
    let r = Math.max(26, (isBaby(c) ? 24 : S.hitR * growK(c)) * k * sc);
    if (c.fan > 0.5) r *= 1.8;
    const cy = c.y - c.z - (bodyH(c) - sinkOf(c)) * sc;
    if (Math.hypot(p.x - c.x, (p.y - cy) * 1.1) < r) return { kind: "bird", c };
  }
  for (const b of fx.butterflies) { const sc = scaleAt(b.y); if (Math.hypot(p.x - b.x, p.y - (b.y - b.z * sc)) < 28) return { kind: "butterfly", b }; }
  const inBox = (place, halfW, up, extraUp) => {
    const sc = scaleAt(place.y);
    return Math.abs(p.x - place.x) < halfW * sc && p.y < place.y + 12 * sc && p.y > place.y - (up + extraUp) * sc;
  };
  if (inBox(places.feeder, 44, 92, F.feeder < 0.25 ? 50 : 0)) return { kind: "feeder" };
  if (places.waterer && inBox(places.waterer, 40, 92, F.water < 0.25 ? 50 : 0)) return { kind: "waterer" };
  const geo = houseGeo(), f = rampFoot();
  if (inRect(p, badgeRect) || inBox(places.coop, geo.halfW, -geo.roofTop, 0) || (Math.abs(p.x - f.x) < 30 && Math.abs(p.y - f.y) < 30)) return { kind: "house" };
  return { kind: "ground" };
}
function hitRoom(p) {
  for (const c of F.birds) if (c.loc !== "yard" && c.tagT > 0 && inRect(p, c.tagRect)) return { kind: "tag", c };
  for (const e of F.nestEggs) { const q = nestEggPos(e); if (Math.hypot(p.x - q.x, p.y - (q.y - 14)) < 28) return { kind: "nestEgg", e }; }
  for (const c of F.birds) { if (c.loc === "yard") continue; const q = insidePos(c); if (Math.hypot(p.x - q.x, p.y - (q.y - 26)) < 32) return { kind: "bird", c }; }
  const ds = [...F.decor].sort((a, b) => b.y - a.y);
  for (const d of ds) { const r = decorRect(d); if (Math.hypot(p.x - r.cx, p.y - r.cy) < r.size * 0.55) return { kind: "decor", d }; }
  if (inRect(p, { x: room.door.x - 10, y: room.door.y - 40, w: room.door.w + 20, h: room.door.h + 50 })) return { kind: "door" };
  return { kind: "floor" };
}

// ---------- Taps ----------
function tapYard(hit, p) {
  switch (hit.kind) {
    case "tag": openCard(hit.c); break;
    case "egg": collectYardEgg(hit.e); break;
    case "bird": pokeBird(hit.c); break;
    case "butterfly": shooButterfly(hit.b); break;
    case "feeder": fillFeeder(); break;
    case "waterer": fillWaterer(); break;
    case "house": tapHouse(); break;
    default: tapGround(p);
  }
}
function tapRoom(hit) {
  switch (hit.kind) {
    case "tag": openCard(hit.c); break;
    case "nestEgg": collectNestEgg(hit.e); break;
    case "bird": {
      const c = hit.c, pan = panX(insidePos(c).x);
      c.tagT = 3.2;
      c.petGlow = 0.6;
      if (c.sleep > 0.5) Sound.sleepy(pan);
      else { Sound.call(c, pan, 0.7); c.beakOpenT = 0.3; }
      break;
    }
    case "decor": tapDecor(hit.d); break;
    case "door": goToScene("yard"); break;
  }
}
function pokeBird(c) {
  const sc = scaleAt(c.y);
  c.tagT = 3.2;
  c.joy = clamp(c.joy + 0.02);
  c.beakOpenT = 0.3;
  // Turkeys and peacocks show off their fans when you tap them!
  if (SP(c).acts.display && !isBaby(c) && INTERRUPTIBLE.has(c.state) && c.goal !== "lay" && c.goal !== "bed" && c.state !== "display") {
    c.goal = null; startDisplay(c);
    return;
  }
  if (c.z <= 0 && c.state !== "carried" && c.wet < 0.5) c.vz = 170 * sc;
  c.flapT = Math.max(c.flapT, 0.35);
  Sound.call(c, panX(c.x));
}
function petBird(c, dist) {
  if (c.loc === "yard" && INTERRUPTIBLE.has(c.state) && c.state !== "display" && c.goal !== "lay" && c.goal !== "bed" && c.goal !== "layYard") {
    c.state = "petted"; c.goal = null; c.pile = null;
  }
  if (c.state === "petted") c.t = 0.8;
  c.petGlow = Math.min(1, c.petGlow + dist * 0.02);
  c.joy = clamp(c.joy + dist * 0.0009);
  c.petAcc += dist;
  if (c.petAcc > 26) {
    c.petAcc = 0;
    if (c.loc === "yard") { const sc = scaleAt(c.y); hearts(c.x, c.y, c.z + (bodyH(c) + 26) * sc, sc); }
    else { const q = insidePos(c); hearts(q.x, q.y, 56, 1); }
    dismissCoach("pet");
  }
  if (clock - c.lastPurr > 1.1) { c.lastPurr = clock; Sound.purr(panX(c.loc === "yard" ? c.x : insidePos(c).x)); }
}
function canPickUp(c) {
  return c.loc === "yard" && (INTERRUPTIBLE.has(c.state) || c.state === "petted" || c.state === "song");
}
function pickUp(c, p) {
  c.state = "carried"; c.goal = null; c.pile = null; c.bfly = null; c.nestClaim = -1; c.tagT = 0;
  Sound.squawk(panX(c.x));
  feathers(c, 3);
  dismissCoach("hold");
  carryTo(c, p);
}
function carryTo(c, p) {
  const land = clamp(p.y + 55, groundTop(), groundBottom()), sc = scaleAt(land);
  const nx = clampX(p.x);
  if (nx - c.x > 1) c.dir = 1; else if (nx - c.x < -1) c.dir = -1;
  c.x = nx;
  c.y = land;
  c.z = Math.max(0, land - (p.y + bodyH(c) * sc));
  c.vz = 0;
}
function dropBird(c) {
  if (c.state !== "carried") return;
  c.state = "fall"; c.vz = 30; c.flapT = 0.8;
  if (c.z <= 0) { c.z = 0; c.vz = 0; landed(c); }
}
function dragDecor(d, p) {
  d.x = clamp(p.x / view.W, 0.05, 0.95);
  d.y = clamp((p.y + decorRect(d).size * 0.5) / view.H, 0.14, 0.98);
}
function tapDecor(d) {
  const def = DECOR_BY_ID[d.id];
  d.bounce = 0.5;
  if (def.toy === "radio") { Music.radioOn = !Music.radioOn; toast(Music.radioOn ? "📻 The chicken radio is on" : "📻 Radio off", 1600); }
  else if (def.toy === "disco") { Music.discoOn = !Music.discoOn; toast(Music.discoOn ? "🪩 Dance party!" : "🪩 Party's over", 1600); }
  else if (def.toy === "chime") Sound.windChime();
  else { Sound.tick(); const r = decorRect(d); sparkles(r.cx, r.by, r.size * 0.6, 5, 1); }
}
function tapGround(p) {
  if (p.y < view.horizon + 10) return;
  if (darkness() > 0.5) { spawnFireflies(p); return; }
  if (inWaterPt(p.x, p.y)) {       // a little splash
    const sc = scaleAt(p.y);
    for (let i = 0; i < 8; i++) emit("drop", p.x, p.y, 4 * sc, { vz: rand(80, 140) * sc, vx: rand(-40, 40) * sc, life: 0.7, size: sc });
    Sound.splash(panX(p.x));
    return;
  }
  scatter(p);
}
function scatter(p) {
  if (fx.grains.length >= SETTINGS.maxTreatPiles) fx.grains.shift();
  const y = clampY(p.y), sc = scaleAt(y);
  const pile = { x: clampX(p.x), y, bites: SETTINGS.treatBites, t: 0, dots: [] };
  for (let i = 0; i < 24; i++) { const a = rand(TAU), r = Math.sqrt(Math.random()); pile.dots.push({ x: Math.cos(a) * r * 22, y: Math.sin(a) * r * 8 }); }
  fx.grains.push(pile);
  for (let i = 0; i < 14; i++) emit("grain", pile.x, pile.y, 20 * sc, { vz: rand(80, 150) * sc, vx: rand(-60, 60) * sc, vy: rand(-18, 18) * sc, life: 0.7, size: sc });
  Sound.scatter(panX(pile.x));
  dismissCoach("treat");
  let called = 0;
  for (const c of F.birds) {
    if (c.loc !== "yard" || TREAT_BUSY.has(c.state) || c.goal === "lay" || c.goal === "bed" || c.goal === "layYard") continue;
    if (Math.hypot(c.x - pile.x, (c.y - pile.y) * 1.4) > 460) continue;
    const a = rand(TAU), r = rand(16, 28) * sc;
    c.goal = "treat"; c.pile = pile;
    walkTo(c, pile.x + Math.cos(a) * r * 1.2, pile.y + Math.sin(a) * r * 0.5, isBaby(c) ? SETTINGS.chickSpeed * 1.7 : SETTINGS.runSpeed, false);
    c.flapT = 0.3;
    if (called++ === 0) Sound.call(c, panX(c.x), 0.8);
  }
}
function spawnFireflies(p) {
  for (let i = 0; i < 3; i++) fx.fireflies.push({ x: p.x + rand(-20, 20), y: clampY(p.y + 40), z: rand(30, 70), ph: rand(TAU), vx: rand(-12, 12), vy: rand(-6, 6), life: 1, boost: 1.2 });
  Sound.tone({ f0: 1800, f1: 2400, dur: 0.12, gain: 0.04 });
}
function shooButterfly(b) {
  b.flee = 1.6;
  b.vx = (b.x < view.W / 2 ? -1 : 1) * 70;
  const sc = scaleAt(b.y);
  sparkles(b.x, b.y, b.z * sc, 4, sc);
  Sound.sparkle();
}
function fillFeeder() {
  if (F.feeder > 0.96) { toast("The feeder is already full", 1500); Sound.tick(); return; }
  F.feeder = 1;
  const f = places.feeder, sc = scaleAt(f.y);
  for (let i = 0; i < 16; i++) emit("grain", f.x + rand(-10, 10) * sc, f.y, (100 + rand(0, 40)) * sc, { vz: -rand(0, 40), vx: rand(-10, 10), life: 0.9, size: sc });
  Sound.pour(panX(f.x), false);
  dismissCoach("feeder");
  save();
}
function fillWaterer() {
  if (F.water > 0.96) { toast("The waterer is already full", 1500); Sound.tick(); return; }
  F.water = 1;
  const f = places.waterer, sc = scaleAt(f.y);
  for (let i = 0; i < 16; i++) emit("drop", f.x + rand(-10, 10) * sc, f.y, (100 + rand(0, 40)) * sc, { vz: -rand(0, 40), vx: rand(-10, 10), life: 0.9, size: sc });
  Sound.pour(panX(f.x), true);
  dismissCoach("water");
  save();
}
function allInside() {
  return F.birds.length > 0 && fx.crates.length === 0 && F.birds.every((c) => c.loc !== "yard");
}
function tapHouse() {
  if (game.farm !== "backyard") { collectHouseEggs(); return; }
  if (isBedtime() && !F.doorClosed && allInside()) {
    F.doorClosed = true;
    Sound.thunk();
    toast("Door closed. Goodnight, chickens! 💤");
    dismissCoach("door");
    save();
    return;
  }
  goToScene("coop");
}
// On the other farms, tapping the house gathers up every egg inside
function collectHouseEggs() {
  dismissCoach("coopEggs");
  if (!F.nestEggs.length) {
    toast(isBedtime() ? `Shh, everyone's asleep in the ${houseName()} 💤` : `No eggs in the ${houseName()} yet`, 1800);
    Sound.tick();
    return;
  }
  const p = badgePos(), from = w2s(p.x, p.y - 18);
  F.nestEggs.forEach((e, i) => sendEggToBasket(from, e.breed, e.golden, -i * 0.09, p.x, p.y - 30));
  F.nestEggs = [];
  save();
}
function collectYardEgg(e) {
  F.yardEggs = F.yardEggs.filter((x) => x !== e);
  const sc = scaleAt(e.y);
  sparkles(e.x, e.y, 14 * sc, 6, sc, e.golden ? "#FFE58A" : "#FFFFFF");
  sendEggToBasket(w2s(e.x, e.y - 12 * sc), e.breed, e.golden, 0, e.x, e.y);
}
function collectNestEgg(e) {
  const p = nestEggPos(e);
  F.nestEggs = F.nestEggs.filter((x) => x !== e);
  sparkles(p.x, p.y, 14, 6, 1, e.golden ? "#FFE58A" : "#FFFFFF");
  sendEggToBasket(w2s(p.x, p.y - 14), e.breed, e.golden, 0, p.x, p.y);
  dismissCoach("collect");
}
function sendEggToBasket(from, breed, golden, delay = 0, wx, wy) {
  const r = basketEgg.getBoundingClientRect();
  const value = eggValueOf(breed, golden);
  game.eggs += value;
  fx.flyers.push({ sx: from.x, sy: from.y, ex: r.left + r.width / 2, ey: r.top + r.height / 2, t: delay, dur: 0.72, breed, golden, value, done: false });
  Sound.pop(-delay);
  if (value > 1 && wx != null) {
    const sc = scene === "yard" ? scaleAt(wy) : 1;
    plusText(wx + rand(-6, 6), wy, 30 * sc - delay * 60, `+${value}`, sc);
  }
  if (golden) toast(`A GOLDEN egg! It's worth ${SETTINGS.goldenEggValue} eggs ✨`, 3000);
  save();
}


/* ================================================================
   16. BUTTONS, SHEETS, THE MAP, HINTS AND MESSAGES
   ================================================================ */
const titleEl = $("title");
const basketEl = $("basket");
const basketEgg = $("basketEgg");
const eggCountEl = $("eggCount");
const backBtn = $("backBtn");
const farmBtn = $("farmBtn");
const farmNameEl = $("farmName");
const marketBtn = $("marketBtn");
const soundBtn = $("soundBtn");
const toastEl = $("toast");
const coachEl = $("coach");
const coachText = $("coachText");
const scrim = $("scrim");
const marketSheet = $("market");
const marketGrid = $("marketGrid");
const marketNote = $("marketNote");
const tabBirds = $("tabChickens");
const tabCoop = $("tabCoop");
const mapSheet = $("map");
const mapGrid = $("mapGrid");
const cardSheet = $("card");
const portraitEl = $("portrait");
const nameInput = $("nameInput");
const cardBreed = $("cardBreed");
const cardMood = $("cardMood");
const cardStats = $("cardStats");
const growBar = $("growBar");
const growFill = $("growFill");

function updateHud() {
  let flying = 0;
  for (const f of fx.flyers) if (!f.done) flying += f.value;
  eggCountEl.textContent = String(Math.max(0, game.eggs - flying));
}
function updateFarmBtn() {
  farmNameEl.textContent = FARMS[game.farm].name;
  const waiting = FARM_ORDER.some((id) => id !== game.farm && farms[id].unlocked && farms[id].nestEggs.length + farms[id].yardEggs.length > 0);
  farmBtn.classList.toggle("has-eggs", waiting);
}
function bumpBasket() {
  basketEl.classList.remove("bump");
  void basketEl.offsetWidth;   // restart the animation
  basketEl.classList.add("bump");
}

let toastTimer = 0;
function toast(msg, ms = 2600) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  toastEl.classList.remove("show");
  void toastEl.offsetWidth;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
    setTimeout(() => { if (!toastEl.classList.contains("show")) toastEl.hidden = true; }, 400);
  }, ms);
}

// ---------- Sheets that slide up from the bottom ----------
let openSheet = null;
function showSheet(el) {
  if (openSheet && openSheet !== el) hideSheet(openSheet, true);
  openSheet = el;
  scrim.hidden = false;
  el.hidden = false;
  el.style.transform = "";
  void el.offsetWidth;
  scrim.classList.add("show");
  el.classList.add("open");
  hideCoachNow();
}
function hideSheet(el = openSheet, instant = false) {
  if (!el) return;
  el.classList.remove("open");
  el.style.transform = "";
  if (openSheet === el) openSheet = null;
  if (el === cardSheet) { if (document.activeElement === nameInput) nameInput.blur(); cardBird = null; }
  if (!openSheet) scrim.classList.remove("show");
  const done = () => {
    if (!el.classList.contains("open")) el.hidden = true;
    if (!openSheet) scrim.hidden = true;
  };
  if (instant) done(); else setTimeout(done, 450);
}
scrim.addEventListener("click", () => hideSheet());
for (const b of document.querySelectorAll("[data-close]")) b.addEventListener("click", () => hideSheet());
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && openSheet) hideSheet();
  if (!started && (e.key === "Enter" || e.key === " ")) begin();
});
// Pull a sheet down to close it, like on an iPhone
for (const sheet of [marketSheet, mapSheet, cardSheet]) {
  let startY = null, dy = 0;
  const grab = (e) => {
    if (e.target.closest("button, input")) return;
    startY = e.clientY; dy = 0;
    sheet.style.transition = "none";
    try { sheet.setPointerCapture(e.pointerId); } catch (_) { /* fine */ }
  };
  for (const h of sheet.querySelectorAll(".grabber, .sheet-head")) h.addEventListener("pointerdown", grab);
  sheet.addEventListener("pointermove", (e) => {
    if (startY === null) return;
    dy = Math.max(0, e.clientY - startY);
    sheet.style.transform = `translate(-50%, ${dy}px)`;
  });
  const release = () => {
    if (startY === null) return;
    startY = null;
    sheet.style.transition = "";
    if (dy > 110) hideSheet(sheet); else sheet.style.transform = "";
  };
  sheet.addEventListener("pointerup", release);
  sheet.addEventListener("pointercancel", release);
}

// ---------- The Market ----------
let marketTab = "birds";
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function priceButton(price, label, enabled, onClick) {
  const b = el("button", "buy");
  b.type = "button";
  b.append(el("i", "egg-dot"), document.createTextNode(String(price)));
  b.setAttribute("aria-label", label);
  b.disabled = !enabled;
  b.addEventListener("click", () => { if (!b.disabled) onClick(); });
  return b;
}
function openMarket() {
  renderMarket();
  showSheet(marketSheet);
  marketGrid.scrollTop = 0;
  dismissCoach("market");
  Sound.tick();
}
const birdCount = (id) => farms[id].birds.length + (id === game.farm ? fx.crates.length : 0);
function renderMarket() {
  const onBirds = marketTab === "birds";
  tabBirds.classList.toggle("on", onBirds);
  tabCoop.classList.toggle("on", !onBirds);
  tabBirds.setAttribute("aria-selected", String(onBirds));
  tabCoop.setAttribute("aria-selected", String(!onBirds));
  marketGrid.textContent = "";
  if (onBirds) {
    marketNote.textContent = "New birds arrive as babies at their own farm and grow up in a few minutes. Fancier birds lay eggs worth more!";
    const order = [game.farm, ...FARM_ORDER.filter((id) => id !== game.farm)];
    for (const id of order) {
      const st = farms[id], cap = capacityOf(id), n = birdCount(id), full = n >= cap;
      const head = el("div", "grid-head", FARMS[id].name);
      head.append(el("span", null, st.unlocked ? (full ? `Full · ${n} of ${cap}` : `${n} of ${cap} spots`) : `Unlock for ${FARMS[id].price} eggs`));
      marketGrid.append(head);
      for (const key of Object.keys(BREEDS)) {
        if (farmOfBreed(key) !== id) continue;
        const B = BREEDS[key], S = SPECIES[B.species], t = el("div", "tile" + (st.unlocked ? "" : " locked"));
        const cv = el("canvas", "portrait-sm");
        drawPortrait(cv, portraitBird(key), 120, 96);
        const sub = el("div", "tile-sub");
        const dot = el("i", "egg-dot");
        dot.style.background = B.egg.color;
        sub.append(dot, document.createTextNode(S.eggValue > 1 ? `${B.egg.name} eggs · worth ${S.eggValue}` : `${B.egg.name} eggs`));
        t.append(cv, el("div", "tile-name", B.name), sub);
        if (!st.unlocked) {
          const b = el("button", "buy unlock", "See the map");
          b.type = "button";
          b.addEventListener("click", openMap);
          t.append(b);
        } else {
          t.append(priceButton(B.price, `Buy a ${B.name} ${babyWord(key)} for ${B.price} eggs`, !full && game.eggs >= B.price, () => buyBird(key)));
        }
        marketGrid.append(t);
      }
    }
  } else {
    const BY = farms.backyard, tierName = COOP_TIERS[BY.tier].name;
    marketNote.textContent = "Make the Backyard coop cozy. Inside the coop, drag decorations to wherever you like.";
    const next = COOP_TIERS[BY.tier + 1];
    const t = el("div", "tile wide");
    const cv = el("canvas", "coop-mini");
    drawCoopMini(cv, next ? BY.tier + 1 : BY.tier, 132, 104);
    const text = el("div", "tile-text");
    text.append(
      el("div", "tile-name", next ? next.name : tierName),
      el("div", "tile-sub", next ? `Room for ${next.capacity} chickens, ${next.nestBoxes} nest boxes, bigger feeders and fancier decorations` : "You built the grandest coop on the farm! 👑"));
    t.append(cv, text);
    if (next) t.append(priceButton(next.price, `Build the ${next.name} for ${next.price} eggs`, game.eggs >= next.price, buyTier));
    marketGrid.append(t);
    const roomLeft = BY.decor.length < SETTINGS.maxDecor;
    for (const d of DECOR) {
      const locked = d.tier > BY.tier;
      const tile = el("div", "tile" + (locked ? " locked" : ""));
      const owned = BY.decor.filter((x) => x.id === d.id).length;
      const note = locked ? `Needs the ${COOP_TIERS[d.tier].name}` : owned ? `${owned} in your coop` : d.toy ? "Tap it to play" : " ";
      tile.append(el("div", "tile-emoji", d.emoji), el("div", "tile-name", d.name), el("div", "tile-sub", note));
      if (locked) {
        const b = el("button", "buy", "Locked");
        b.type = "button"; b.disabled = true;
        tile.append(b);
      } else tile.append(priceButton(d.price, `Buy ${d.name} for ${d.price} eggs`, roomLeft && game.eggs >= d.price, () => buyDecor(d.id)));
      marketGrid.append(tile);
    }
  }
}
tabBirds.addEventListener("click", () => { marketTab = "birds"; renderMarket(); marketGrid.scrollTop = 0; Sound.tick(); });
tabCoop.addEventListener("click", () => { marketTab = "coop"; renderMarket(); marketGrid.scrollTop = 0; Sound.tick(); });

function spend(n) { game.eggs -= n; updateHud(); }
function buyBird(key) {
  const B = BREEDS[key], id = farmOfBreed(key), st = farms[id];
  if (!st.unlocked || game.eggs < B.price || birdCount(id) >= capacityOf(id)) return;
  spend(B.price);
  Sound.sparkle();
  const word = babyWord(key);
  if (id === game.farm) {
    const c = places.coop, sc = scaleAt(c.y), geo = houseGeo();
    fx.crates.push({ x: clampX(c.x + (geo.halfW + 40 + rand(0, 50)) * sc), y: clampY(c.y + rand(46, 90) * sc), t: 0, breed: key, opened: false });
    hideSheet();
    toast(scene === "yard" ? `A ${B.name} ${word} is here! ${SPECIES[B.species].icon}` : `A ${B.name} ${word} is waiting in the yard!`);
  } else {
    const c = addBirdToFarm(id, key, 0.12);
    c.needsSpot = true;
    renderMarket();
    toast(`A ${B.name} ${word} is waiting at the ${FARMS[id].name}! Tap the map to visit`, 3200);
  }
  save();
}
function buyTier() {
  const BY = farms.backyard, next = COOP_TIERS[BY.tier + 1];
  if (!next || game.eggs < next.price) return;
  spend(next.price);
  BY.tier++;
  layoutInterior();
  buildRoomBg();
  if (game.farm === "backyard") {
    buildBackground();
    for (const c of F.birds) if (c.loc === "coop") c.roostSlot = freeRoostSlot(c);
    const c = places.coop, sc = scaleAt(c.y);
    if (scene === "yard") confetti(c.x, c.y, -houseGeo().roofTop * sc * 0.6, 40, sc);
  }
  Sound.fanfare();
  hideSheet();
  toast(`Your ${next.name} is ready! 🎉`, 3000);
  save();
}
function buyDecor(id) {
  const BY = farms.backyard, d = DECOR_BY_ID[id];
  if (!d || d.tier > BY.tier || game.eggs < d.price || BY.decor.length >= SETTINGS.maxDecor) return;
  spend(d.price);
  const floorN = room.floorY / view.H;
  const x = rand(0.34, 0.9);
  const y = d.wall ? rand(0.3, floorN - 0.08) : rand(floorN + 0.1, 0.95);
  BY.decor.push({ uid: nextId++, id, x, y, bounce: 0.5 });
  Sound.sparkle();
  toast(scene === "coop" ? `${d.emoji} ${d.name} added. Drag it anywhere!` : `${d.emoji} ${d.name} is in your Backyard coop. Go take a look!`, 2400);
  renderMarket();
  save();
}

// ---------- The Map: travel between your farms ----------
function openMap() {
  renderMap();
  showSheet(mapSheet);
  mapGrid.scrollTop = 0;
  dismissCoach("map");
  Sound.tick();
}
function renderMap() {
  mapGrid.textContent = "";
  for (const id of FARM_ORDER) {
    const Fm = FARMS[id], st = farms[id], here = id === game.farm;
    const card = el("div", "farm-card" + (st.unlocked ? "" : " locked") + (here ? " here" : ""));
    const cv = el("canvas", "farm-mini");
    drawFarmMini(cv, id);
    const waiting = st.nestEggs.length + st.yardEggs.length;
    const n = birdCount(id);
    const sub = st.unlocked
      ? `${n} ${n === 1 ? "bird" : "birds"}${waiting ? ` · ${waiting} ${waiting === 1 ? "egg" : "eggs"} waiting` : ""}`
      : Fm.blurb;
    card.append(cv, el("div", "farm-name", `${Fm.emoji} ${Fm.name}`), el("div", "farm-sub", sub));
    let b;
    if (here) { b = el("button", "buy here-btn", "You're here"); b.type = "button"; b.disabled = true; }
    else if (st.unlocked) { b = el("button", "buy visit", "Visit"); b.type = "button"; b.addEventListener("click", () => travelTo(id)); }
    else {
      b = el("button", "buy");
      b.type = "button";
      b.append(document.createTextNode("Unlock · "), el("i", "egg-dot"), document.createTextNode(String(Fm.price)));
      b.setAttribute("aria-label", `Unlock the ${Fm.name} for ${Fm.price} eggs`);
      b.disabled = game.eggs < Fm.price;
      b.addEventListener("click", () => { if (!b.disabled) unlockFarm(id); });
    }
    card.append(b);
    mapGrid.append(card);
  }
}
function unlockFarm(id) {
  const Fm = FARMS[id], st = farms[id];
  if (st.unlocked || game.eggs < Fm.price) return;
  spend(Fm.price);
  st.unlocked = true;
  for (const key of Fm.starter) { const c = addBirdToFarm(id, key, 1); c.eggClock = rand(10, 30); c.needsSpot = true; }
  Sound.fanfare();
  save();
  travelTo(id, true);
}
function travelTo(id, firstVisit) {
  if (trans.on || id === game.farm || !farms[id].unlocked) return;
  hideSheet();
  const mid = { x: view.W / 2, y: view.H * 0.55 };
  Object.assign(trans, { on: true, t: 0, to: "yard", kind: "travel", farmTo: id, firstVisit: !!firstVisit, switched: false, f1: mid, f2: mid });
  hideCoachNow();
  for (const c of F.birds) c.tagT = 0;
  Sound.whoosh();
}
// Tidy up the birds on the farm we're leaving, so they keep living on their own
function leaveFarm() {
  for (const c of F.birds) {
    c.goal = null; c.nestClaim = -1; c.pile = null; c.bfly = null;
    c.z = 0; c.vz = 0; c.alpha = 1; c.enterT = 0; c.pendingYardLay = false;
    c.wet = 0; c.tip = 0; c.fan = 0; c.nestBox = -1;
    c.loc = isBedtime() ? "coop" : "yard";
    c.state = "idle"; c.t = rand(0.3, 1.5);
  }
  for (const cr of fx.crates) if (!cr.opened) addBirdToFarm(game.farm, cr.breed, 0.12).needsSpot = true;
  fx.crates = []; fx.grains = []; fx.butterflies = []; fx.fireflies = []; fx.particles = []; fx.flyers.forEach((f) => { f.t = f.dur; });
  Music.radioOn = false; Music.discoOn = false;
}
// Wake up the birds on the farm we've arrived at
function arriveFarm() {
  const P = places;
  for (const c of F.birds) {
    c.goal = null; c.nestClaim = -1; c.z = 0; c.vz = 0; c.alpha = 1; c.wet = 0;
    if (c.needsSpot) {
      const sc = scaleAt(P.coop.y);
      c.x = P.coop.x + (houseGeo().halfW + rand(20, 160)) * sc;
      c.y = P.coop.y + rand(40, 110) * sc;
      c.needsSpot = false;
    }
    c.x = clampX(c.x); c.y = clampY(c.y);
    if (isBedtime()) { goRoost(c); c.popIn = 0; }
    else { c.loc = "yard"; c.state = "idle"; c.t = rand(0.2, 1.5); c.sit = 0; c.sleep = 0; }
  }
  shown.feeder = F.feeder; shown.water = F.water;
}

// ---------- A bird's name card ----------
let cardBird = null, cardTimer = 0;
function openCard(c) {
  cardBird = c;
  nameInput.value = c.name;
  updateCardText();
  showSheet(cardSheet);
  Sound.tick();
}
function updateCardText() {
  const c = cardBird;
  if (!c) return;
  const B = BREEDS[c.breed], S = SP(c);
  cardBreed.textContent = `${B.name} · lays ${B.egg.name.toLowerCase()} eggs`;
  const [mt, me] = moodText(c);
  cardMood.textContent = `${me} ${mt}`;
  if (c.growth < 1) {
    cardStats.textContent = `A baby ${babyWord(c.breed)}, growing up. ${Math.round(c.growth * 100)}% of the way to a grown-up ${S.adult}!`;
    growBar.hidden = false;
    growFill.style.width = `${Math.round(c.growth * 100)}%`;
  } else {
    cardStats.textContent = c.laid ? `Has laid ${c.laid} ${c.laid === 1 ? "egg" : "eggs"} on your farm` : "Hasn't laid an egg here yet";
    growBar.hidden = true;
  }
}
nameInput.addEventListener("input", () => {
  if (!cardBird) return;
  const v = nameInput.value.replace(/\s+/g, " ").trim().slice(0, 16);
  if (v) cardBird.name = v;
});
nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") nameInput.blur(); });
nameInput.addEventListener("blur", () => { if (cardBird) nameInput.value = cardBird.name; save(); });

// ---------- Hints (coach marks) ----------
let coach = null, coachTimer = 0;
function showCoach(key, text, anchor, below, valid) {
  if (game.hints[key]) return;
  coach = { key, anchor, below: !!below, valid };
  coachText.textContent = text;
  coachEl.classList.toggle("below", !!below);
  coachEl.hidden = false;
  positionCoach();
}
function dismissCoach(key) {
  game.hints[key] = true;
  if (coach && coach.key === key) { coach = null; coachEl.hidden = true; }
}
function hideCoachNow() { coach = null; coachEl.hidden = true; }
function positionCoach() {
  if (!coach) return;
  const a = coach.anchor();
  if (!a) { hideCoachNow(); return; }
  coachEl.style.left = `${clamp(a.x, 150, view.w - 150)}px`;
  coachEl.style.top = `${clamp(a.y, 70, view.h - 20)}px`;
}
function pickCoach() {
  if (!started || trans.on || openSheet) { if (coach) hideCoachNow(); return; }
  if (coach) { if (coach.valid && !coach.valid()) hideCoachNow(); return; }
  const H = game.hints;
  const at = (x, y) => () => w2s(x, y);
  const below = (btn, dx = 0) => () => { const r = btn.getBoundingClientRect(); return { x: r.left + r.width / 2 + dx, y: r.bottom }; };
  if (scene === "yard") {
    const ground = view.horizon + (view.H - view.horizon) * 0.5;
    if (!H.treat && !isBedtime()) return showCoach("treat", "Tap the grass to toss the birds a treat", at(view.W * 0.44, ground), false, () => !isBedtime());
    if (!H.coopEggs && F.nestEggs.length) return showCoach("coopEggs", `Eggs in the ${houseName()}! Tap it to collect them`, () => { const p = badgePos(); return w2s(p.x, p.y - 44); }, false, () => F.nestEggs.length > 0);
    if (!H.feeder && F.feeder < 0.25) return showCoach("feeder", "The feeder is almost empty. Tap it to fill it up", at(places.feeder.x, places.feeder.y - 150 * scaleAt(places.feeder.y)), false, () => F.feeder < 0.25);
    if (!H.water && places.waterer && F.water < 0.25) return showCoach("water", "The waterer is almost empty. Tap it to fill it up", at(places.waterer.x, places.waterer.y - 150 * scaleAt(places.waterer.y)), false, () => F.water < 0.25);
    if (!H.map && !farms.pond.unlocked && game.eggs >= FARMS.pond.price) return showCoach("map", "You can unlock the Duck Pond! Tap here", below(farmBtn), true, () => !farms.pond.unlocked);
    if (!H.market && game.eggs >= 8 && F.birds.length < capacity()) return showCoach("market", "You have enough eggs for a new baby bird!", below(marketBtn, -110), true);
    if (!H.door && game.farm === "backyard" && isBedtime() && allInside() && !F.doorClosed) return showCoach("door", "Everyone's inside. Tap the coop to close the door", () => { const p = badgePos(); return w2s(p.x, p.y - (F.nestEggs.length ? 44 : 0)); }, false, () => isBedtime() && !F.doorClosed);
    const someone = F.birds.find((o) => o.loc === "yard" && !isBaby(o) && o.state !== "enter" && o.state !== "exit");
    const over = (c) => () => (c.loc === "yard" ? w2s(c.x, c.y - c.z - (headH(c) + 14) * scaleAt(c.y)) : null);
    if (!H.pet && H.treat && game.totalEggs >= 2 && !isBedtime() && someone) return showCoach("pet", "Slide your finger across a bird to pet it", over(someone), false, () => someone.loc === "yard");
    if (!H.hold && H.pet && !isBedtime() && someone) return showCoach("hold", "Press and hold a bird to pick it up", over(someone), false, () => someone.loc === "yard");
  } else {
    if (!H.collect && F.nestEggs.length) return showCoach("collect", "Tap each egg to put it in your basket", () => { const p = nestEggPos(F.nestEggs[0]); return w2s(p.x, p.y - 40); }, false, () => F.nestEggs.length > 0);
    if (!H.decorate && F.decor.length) return showCoach("decorate", "Drag decorations to move them around", () => { const r = decorRect(F.decor[F.decor.length - 1]); return w2s(r.cx, r.cy - r.size * 0.6); });
  }
}

// ---------- HUD buttons ----------
marketBtn.addEventListener("click", () => { Sound.unlock(); if (!started) begin(); openMarket(); });
farmBtn.addEventListener("click", () => { Sound.unlock(); if (!started) begin(); openMap(); });
backBtn.addEventListener("click", () => goToScene("yard"));
soundBtn.addEventListener("click", () => {
  Sound.unlock();
  if (!started) begin();
  game.muted = !game.muted;
  Sound.setMuted(game.muted);
  setMuteUI();
  save();
});
function setMuteUI() {
  $("soundOn").hidden = game.muted;
  $("soundOff").hidden = !game.muted;
  soundBtn.setAttribute("aria-label", game.muted ? "Turn sound on" : "Turn sound off");
  soundBtn.setAttribute("aria-pressed", String(!game.muted));
}

// ---------- Moving between the yard, the coop, and other farms ----------
const trans = { on: false, t: 0, dur: 0.8, to: "yard", kind: "scene", farmTo: null, firstVisit: false, f1: { x: 0, y: 0 }, f2: { x: 0, y: 0 }, switched: false };
function goToScene(to) {
  if (trans.on || scene === to) return;
  if (to === "coop" && game.farm !== "backyard") return;
  const toCoop = to === "coop";
  const door = coopDoorPt(), sc = scaleAt(places.coop.y);
  const coopFocus = { x: door.x, y: places.coop.y - (houseGeo().floorH + 30) * sc };
  const roomFocus = { x: room.door.x + room.door.w / 2, y: room.door.y + room.door.h * 0.45 };
  Object.assign(trans, { on: true, t: 0, to, kind: "scene", switched: false, f1: toCoop ? coopFocus : roomFocus, f2: toCoop ? roomFocus : coopFocus });
  hideCoachNow();
  for (const c of F.birds) c.tagT = 0;
  Sound.door();
}
function updateTransition(dt) {
  if (!trans.on) return;
  trans.t += dt;
  if (!trans.switched && trans.t >= trans.dur * 0.5) {
    trans.switched = true;
    if (trans.kind === "travel") {
      leaveFarm();
      game.farm = trans.farmTo;
      F = farms[game.farm];
      places = computePlaces(game.farm);
      buildBlades();
      buildBackground();
      scene = "yard";
      onSceneChanged();
      arriveFarm();
      updateFarmBtn();
      const Fm = FARMS[game.farm];
      toast(trans.firstVisit && Fm.welcome ? Fm.welcome : `${Fm.emoji} ${Fm.name}`, trans.firstVisit ? 3400 : 1800);
      save();
    } else {
      scene = trans.to;
      onSceneChanged();
    }
  }
  if (trans.t >= trans.dur) trans.on = false;
}
function onSceneChanged() {
  const inCoop = scene === "coop";
  document.body.classList.toggle("in-coop", inCoop);
  backBtn.hidden = !inCoop;
  fx.particles.length = 0;
  if (inCoop) { dismissCoach("coopEggs"); for (const c of F.birds) if (c.loc !== "yard") c.popIn = 0; }
  else { Music.radioOn = false; Music.discoOn = false; }
}

// ---------- Start ----------
let wakeLock = null;
async function keepAwake() {
  try {
    if ("wakeLock" in navigator && document.visibilityState === "visible" && !wakeLock) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    }
  } catch (e) { /* the screen may dim; that's okay */ }
}
// On the website, explain how to keep the game for offline play.
// (Hidden when it's already installed, or when it's the downloaded file.)
function setupOfflineHint() {
  const hint = $("offlineHint");
  const installed = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  if (!hint || installed || location.protocol !== "https:") return;
  const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const shareIcon = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 10H5.5v10h13V10H17" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  hint.innerHTML = apple
    ? `To play without internet, tap <b>Share</b> ${shareIcon} then <b>Add to Home Screen</b>`
    : `<a href="download/BackyardBirdFarm.html" download="BackyardBirdFarm.html">⬇ Download to play offline</a>`;
  hint.hidden = false;
}

function begin() {
  if (started) return;
  started = true;
  Sound.unlock();
  titleEl.classList.add("gone");
  setTimeout(() => { titleEl.hidden = true; }, 950);
  keepAwake();
  if (welcomeMsg) setTimeout(() => toast(welcomeMsg, 3600), 400);
}
for (const type of ["pointerup", "touchend", "click", "keydown"]) {
  window.addEventListener(type, () => { if (!Sound.ctx || Sound.ctx.state !== "running") Sound.unlock(); }, { capture: true, passive: true });
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") { if (started) { keepAwake(); Sound.unlock(); } lastFrame = performance.now(); }
  else save();
});
window.addEventListener("pagehide", () => save());


/* ================================================================
   17. SAVING & LOADING
   ================================================================
   Your farms are saved on this device (in the browser's storage), so
   they're still here next time. Older saves from before there were
   several farms get moved into the Backyard automatically.
*/
const SAVE_KEY = "backyardBirdFarm.v5";
const OLD_SAVE_KEY = "backyardBirdFarm.v4";

function serializeFarm(id) {
  const st = farms[id];
  return {
    unlocked: st.unlocked, tier: st.tier, feeder: st.feeder, water: st.water, doorClosed: st.doorClosed,
    decor: st.decor.map((d) => ({ id: d.id, x: d.x, y: d.y })),
    birds: st.birds.map((c) => ({
      breed: c.breed, name: c.name, x: c.x, y: c.y, growth: c.growth, food: c.food, water: c.water,
      joy: c.joy, laid: c.laid, eggClock: c.eggClock, loc: c.loc === "yard" ? "yard" : "coop", needsSpot: c.needsSpot,
    })),
    yardEggs: st.yardEggs.map((e) => ({ x: e.x, y: e.y, breed: e.breed, golden: e.golden })),
    nestEggs: st.nestEggs.map((e) => ({ box: e.box, breed: e.breed, golden: e.golden })),
    crates: id === game.farm ? fx.crates.filter((cr) => !cr.opened).map((cr) => cr.breed) : [],
  };
}
function serialize() {
  const out = {
    v: 5, savedAt: Date.now(), eggs: game.eggs, farm: game.farm, time: game.time, day: game.day,
    totalEggs: game.totalEggs, hints: game.hints, muted: game.muted, farms: {},
  };
  for (const id of FARM_ORDER) out.farms[id] = serializeFarm(id);
  return out;
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(serialize())); } catch (e) { /* storage unavailable */ }
}
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
    const old = localStorage.getItem(OLD_SAVE_KEY);
    if (old) return migrateV4(JSON.parse(old));
  } catch (e) { /* fall through to a fresh farm */ }
  return null;
}
// A save from the one-farm version becomes the Backyard
function migrateV4(d) {
  if (!d || d.v !== 4) return null;
  return {
    v: 5, savedAt: d.savedAt, eggs: d.eggs, farm: "backyard", time: d.time, day: d.day,
    totalEggs: d.totalEggs, hints: d.hints, muted: d.muted,
    farms: {
      backyard: {
        unlocked: true, tier: d.tier, feeder: d.feeder, water: d.water, doorClosed: d.doorClosed,
        decor: d.decor, birds: d.chickens, yardEggs: d.yardEggs, nestEggs: d.nestEggs, crates: d.crates,
      },
    },
  };
}
const num = (v, def, min = -Infinity, max = Infinity) => (typeof v === "number" && isFinite(v) ? clamp(v, min, max) : def);
const arr = (v) => (Array.isArray(v) ? v : []);

function applyFarm(id, s) {
  const st = newFarmState(id);
  farms[id] = st;
  if (!s || typeof s !== "object") return;
  st.unlocked = id === "backyard" || !!s.unlocked;
  if (id === "backyard") {
    st.tier = Math.floor(num(s.tier, 1, 1, 3));
    st.doorClosed = !!s.doorClosed;
    st.decor = arr(s.decor).filter((x) => x && DECOR_BY_ID[x.id]).slice(0, SETTINGS.maxDecor)
      .map((x) => ({ uid: nextId++, id: x.id, x: num(x.x, 0.5, 0.05, 0.95), y: num(x.y, 0.8, 0.14, 0.98), bounce: 0 }));
  }
  st.feeder = num(s.feeder, 1, 0, 1);
  st.water = num(s.water, 1, 0, 1);
  for (const b of arr(s.birds)) {
    if (st.birds.length >= capacityOf(id)) break;
    if (!b || !BREEDS[b.breed] || farmOfBreed(b.breed) !== id) continue;
    const c = makeBird({
      breed: b.breed,
      name: typeof b.name === "string" && b.name.trim() ? b.name.trim().slice(0, 16) : undefined,
      x: clampX(num(b.x, view.W * 0.5)), y: clampY(num(b.y, view.H * 0.7)),
      growth: num(b.growth, 1, 0.1, 1), food: num(b.food, 0.8, 0, 1), water: num(b.water, 0.8, 0, 1),
      joy: num(b.joy, 0.5, 0, 1), laid: Math.floor(num(b.laid, 0, 0, 1e6)), eggClock: num(b.eggClock, 30, 0, 600),
    });
    c.needsSpot = !!b.needsSpot;
    c.loc = b.loc === "coop" && isBedtime() ? "coop" : "yard";
    st.birds.push(c);
  }
  for (const breed of arr(s.crates)) {
    if (BREEDS[breed] && farmOfBreed(breed) === id && st.birds.length < capacityOf(id)) {
      const c = addBirdToFarm(id, breed, 0.12);
      c.needsSpot = true;
    }
  }
  const boxes = nestCount(id);
  st.yardEggs = arr(s.yardEggs).filter((e) => e && BREEDS[e.breed]).slice(0, SETTINGS.maxYardEggs)
    .map((e) => ({ id: nextId++, x: clampX(num(e.x, view.W / 2)), y: clampY(num(e.y, view.H * 0.7)), breed: e.breed, golden: !!e.golden, glint: rand(0, 3) }));
  st.nestEggs = arr(s.nestEggs).filter((e) => e && BREEDS[e.breed] && e.box >= 0 && e.box < boxes).slice(0, boxes * SETTINGS.nestBoxHolds)
    .map((e) => ({ id: nextId++, box: Math.floor(e.box), breed: e.breed, golden: !!e.golden }));
}

function applySave(d) {
  game.eggs = Math.floor(num(d.eggs, 0, 0, 1e7));
  game.time = num(d.time, 0.1, 0, 0.9999);
  game.day = Math.floor(num(d.day, 1, 1, 1e6));
  game.totalEggs = Math.floor(num(d.totalEggs, 0, 0, 1e9));
  game.hints = d.hints && typeof d.hints === "object" ? d.hints : {};
  game.muted = !!d.muted;
  const saved = d.farms && typeof d.farms === "object" ? d.farms : {};
  applyFarm("backyard", saved.backyard);    // first, so the coop size is known
  layoutInterior();
  for (const id of FARM_ORDER) if (id !== "backyard") applyFarm(id, saved[id]);
  game.farm = FARMS[d.farm] && farms[d.farm].unlocked ? d.farm : "backyard";
  F = farms[game.farm];
  places = computePlaces(game.farm);
  buildBlades();
  buildBackground();
  buildRoomBg();
  if (!farms.backyard.birds.length && game.farm === "backyard") starterFlock();

  // While you were away...
  const away = (Date.now() - num(d.savedAt, Date.now())) / 1000;
  if (away > 90) {
    const t = Math.min(away, 3 * 3600);
    let laid = 0;
    for (const id of FARM_ORDER) {
      const st = farms[id];
      if (!st.unlocked) continue;
      const grown = st.birds.filter((c) => c.growth >= 1);
      for (const c of grown) {
        const n = Math.floor((t / 150) * 0.5 * layBoostOf(c));
        for (let i = 0; i < n; i++) if (addNestEggTo(id, c.breed, rollGolden())) { laid++; c.laid++; game.totalEggs++; }
      }
      for (const c of st.birds) if (c.growth < 1) c.growth = Math.min(1, c.growth + (t / SETTINGS.growUpSeconds) * 0.5);
      st.feeder = Math.max(Math.min(st.feeder, 0.15), st.feeder - t / 3600);
      st.water = Math.max(Math.min(st.water, 0.15), st.water - t / 3600);
    }
    if (laid) welcomeMsg = `Welcome back! Your birds laid ${laid} ${laid === 1 ? "egg" : "eggs"} while you were away 🥚`;
    else if (away > 600) welcomeMsg = "Welcome back! The birds missed you 🐔";
  }
  arriveFarm();
}
function starterFlock() {
  const c = places.coop, sc = scaleAt(c.y), g = view.H - view.horizon;
  ["rir", "buff", "barred"].forEach((breed, i) => {
    const ch = makeBird({ breed, x: c.x + (150 + i * 95) * sc, y: c.y + (46 + i * 34) * sc, growth: 1, eggClock: rand(20, 45) });
    ch.t = rand(0.3, 1.5);
    farms.backyard.birds.push(ch);
  });
  // A surprise egg hidden by the tree, so there's something to find right away
  farms.backyard.yardEggs.push({ id: nextId++, x: clampX(places.tree.x - 70 * scaleAt(places.tree.y)), y: clampY(view.horizon + g * 0.3), breed: "buff", golden: false, glint: 0 });
}


/* ================================================================
   18. THE GAME LOOP — the heartbeat
   ================================================================
   We move the game forward in small, equal steps (1/60th of a second)
   so it runs the same speed on every device, then paint one picture.
*/
const STEP = 1 / 60;
let lastFrame = performance.now(), acc = 0, saveT = 4, awayT = 0, hudT = 0;

function update(dt) {
  clock += dt;
  const prev = game.time;
  game.time += dt / SETTINGS.dayLengthSeconds;
  if (game.time >= 1) { game.time -= 1; game.day++; }
  timeEvents(prev <= game.time ? prev : prev - 1, game.time);
  updateTransition(dt);
  for (const c of F.birds) {
    updateNeeds(c, dt);
    if (c.loc === "yard") updateYardBird(c, dt); else updateInsideBird(c, dt);
    updatePose(c, dt);
  }
  separate(dt);
  // The farms you're not visiting tick along a few times a second
  awayT += dt;
  if (awayT >= 0.25) {
    for (const id of FARM_ORDER) if (id !== game.farm && farms[id].unlocked) simulateFarm(id, awayT);
    awayT = 0;
  }
  shown.feeder += (F.feeder - shown.feeder) * Math.min(1, dt * 3);
  shown.water += (F.water - shown.water) * Math.min(1, dt * 3);
  updateGrains(dt);
  updateButterflies(dt);
  updateFireflies(dt);
  updateClouds(dt);
  updateParticles(dt);
  updateFlyers(dt);
  updateCrates(dt);
  updateSceneFx(dt);
  updateAmbient(dt);
  Music.update();
  coachTimer -= dt;
  if (coachTimer <= 0) { coachTimer = 0.4; pickCoach(); }
  hudT -= dt;
  if (hudT <= 0) { hudT = 0.5; updateFarmBtn(); }
  if (cardBird) { cardTimer -= dt; if (cardTimer <= 0) { cardTimer = 0.5; updateCardText(); } }
  saveT -= dt;
  if (saveT <= 0) { saveT = 4; save(); }
}

function render() {
  if (scene === "yard" || trans.on) drawSky();
  const g = ctx;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, worldCanvas.width, worldCanvas.height);
  // During a scene change we zoom toward the door (or gently pull back
  // when traveling to another farm) and fade through dark
  let z = 1, fx0 = 0, fy0 = 0, dim = 0;
  if (trans.on) {
    const p = clamp(trans.t / trans.dur), travel = trans.kind === "travel";
    const zoomIn = reduceMotion ? 0 : travel ? -0.06 : 1.5, zoomOut = reduceMotion ? 0 : travel ? 0.06 : 0.3;
    if (p < 0.5) { const q = easeIn(p * 2); z = 1 + q * zoomIn; fx0 = trans.f1.x; fy0 = trans.f1.y; dim = q; }
    else { const q = easeOut((p - 0.5) * 2); z = 1 + (1 - q) * zoomOut; fx0 = trans.f2.x; fy0 = trans.f2.y; dim = 1 - q; }
  }
  const k = view.dpr * view.s;
  g.setTransform(k * z, 0, 0, k * z, k * fx0 * (1 - z), k * fy0 * (1 - z));
  if (scene === "yard") drawYard(g); else drawRoom(g);
  if (dim > 0) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = `rgba(34,24,16,${dim})`;
    g.fillRect(0, 0, worldCanvas.width, worldCanvas.height);
  }
  drawFlyers(g);
  if (cardBird) drawPortrait(portraitEl, Object.assign({}, cardBird, { dir: 1, z: 0, alpha: 1, popIn: 0, wet: 0 }), 190, 160);
  positionCoach();
}

function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  acc += dt;
  let steps = 0;
  while (acc >= STEP && steps < 6) { update(STEP); acc -= STEP; steps++; }
  if (steps === 6) acc = 0;
  render();
  requestAnimationFrame(frame);
}

let resizeQueued = false;
window.addEventListener("resize", () => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => { resizeQueued = false; resize(); });
});

function start() {
  resize();
  const data = loadSave();
  if (data && data.v === 5) applySave(data);
  else { starterFlock(); arriveFarm(); }
  Sound.muted = game.muted;
  setMuteUI();
  setupOfflineHint();
  updateHud();
  updateFarmBtn();
  if (window.location.hash === "#coop" && game.farm === "backyard") { scene = "coop"; onSceneChanged(); }
  requestAnimationFrame((t) => { lastFrame = t; frame(t); });
}
start();
