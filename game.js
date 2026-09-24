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
  dayLengthSeconds: 1200,    // one whole day + night while you play, in real seconds (20 minutes)
  awayHoursPerDay: 2,        // when the game is closed, one farm day takes this many real hours
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
  secondsPerIncubationDay: 7, // how long one "day" in the incubator takes
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
    water: "pond", trough: 3, capacity: 24, nests: 5, blurb: "Ducks, geese and swans",
    mascots: ["mallard", "pekin"], starter: ["pekin", "pekin"],
    welcome: "Welcome to the Duck Pond! Ducks love to swim 🦆",
  },
  meadow: {
    name: "Wildflower Meadow", emoji: "🌼", price: 100, house: "hutch",
    water: "waterer", trough: 4, capacity: 30, nests: 6, blurb: "Quail, pheasants and turkeys",
    mascots: ["ringneck", "coturnix"], starter: ["coturnix", "coturnix", "coturnix"],
    welcome: "Welcome to the Wildflower Meadow! 🌼 Watch the tiny quail scurry",
  },
  lagoon: {
    name: "Flamingo Lagoon", emoji: "🦩", price: 250, house: "pavilion",
    water: "lagoon", trough: 3, capacity: 16, nests: 4, blurb: "Flamingos and peacocks!",
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

// Every breed you can raise, written as its GENES. (What each gene does
// is explained in section 25, "BOYS, GIRLS & GENES".) Any gene a breed
// doesn't list is the ordinary "wild" kind.
//   species: which kind of animal (and so which farm it lives on)
//   kind:    which birds it can have babies with (if not the same as species)
//   tier:    for chickens, which coop you need before the Market sells it
//   [a, b]:  two different copies of a gene (these breeds don't "breed true"!)
const BREEDS = {
  // ---------- Chickens (Backyard) ----------
  // Cozy Coop
  rir:          { species: "chicken", name: "Rhode Island Red", short: "Rhode Island Red", price: 8, tier: 1, genes: { base: "R", tone: "Mh", brownEgg: 3, lay: 1.1 } },
  newHampshire: { species: "chicken", name: "New Hampshire", price: 8, tier: 1, genes: { base: "R", tone: "n", brownEgg: 3, lay: 1.05 } },
  buff:         { species: "chicken", name: "Buff Orpington", short: "Orpington", price: 10, tier: 1, genes: { base: "R", tone: "di", skinY: "W", fluff: 0.18, size: 1.1 } },
  barred:       { species: "chicken", name: "Barred Rock", short: "Rock", price: 10, tier: 1, genes: { base: "E", bar: "B", brownEgg: 2.5 } },
  whiteRock:    { species: "chicken", name: "White Rock", short: "Rock", price: 10, tier: 1, genes: { base: "R", recW: "c", silver: "S", brownEgg: 2.5 } },
  leghorn:      { species: "chicken", name: "White Leghorn", short: "Leghorn", price: 12, tier: 1, genes: { base: "E", domW: "I", lobe: "Wl", brownEgg: 0, combSize: 1.4, lay: 1.25 } },
  australorp:   { species: "chicken", name: "Black Australorp", short: "Australorp", price: 12, tier: 1, genes: { base: "E", skinY: "W", brownEgg: 2.5, lay: 1.2, fluff: 0.08 } },
  wyandotte:    { species: "chicken", name: "Silver Laced Wyandotte", short: "Wyandotte", price: 14, tier: 1, genes: { base: "R", silver: "S", pat: "lace", rose: "Rc", fluff: 0.1 } },
  sussex:       { species: "chicken", name: "Speckled Sussex", short: "Sussex", price: 14, tier: 1, genes: { base: "R", tone: "Mh", pat: "mot", skinY: "W" } },
  easter:       { species: "chicken", name: "Easter Egger", price: 16, tier: 1, genes: { base: "p", blueEgg: "O", pea: "Pc", beard: "Mb", brownEgg: 0.5 } },
  delaware:     { species: "chicken", name: "Delaware", price: 14, tier: 1, genes: { base: "R", silver: "S", pat: "col", bar: "B", brownEgg: 2.5 } },
  dominique:    { species: "chicken", name: "Dominique", price: 14, tier: 1, genes: { base: "E", bar: "B", rose: "Rc", brownEgg: 2 } },
  // Farmhouse Coop
  brownLeghorn: { species: "chicken", name: "Brown Leghorn", short: "Leghorn", price: 14, tier: 2, genes: { base: "p", lobe: "Wl", brownEgg: 0, combSize: 1.4, lay: 1.2 } },
  goldWyandotte:{ species: "chicken", name: "Gold Laced Wyandotte", short: "Wyandotte", price: 16, tier: 2, genes: { base: "R", tone: "n", pat: "lace", rose: "Rc", fluff: 0.1 } },
  blueLacedRed: { species: "chicken", name: "Blue Laced Red Wyandotte", short: "Wyandotte", price: 20, tier: 2, genes: { base: "R", tone: "Mh", pat: "lace", blue: ["Bl", "bl"], rose: "Rc", fluff: 0.1 } },
  lightSussex:  { species: "chicken", name: "Light Sussex", short: "Sussex", price: 16, tier: 2, genes: { base: "R", silver: "S", pat: "col", skinY: "W" } },
  cochin:       { species: "chicken", name: "Blue Cochin", short: "Cochin", price: 18, tier: 2, genes: { base: "E", blue: ["Bl", "bl"], feet: "Pti", fluff: 0.3, size: 1.1 } },
  buffCochin:   { species: "chicken", name: "Buff Cochin", short: "Cochin", price: 18, tier: 2, genes: { base: "R", tone: "di", feet: "Pti", fluff: 0.3, size: 1.1 } },
  lightBrahma:  { species: "chicken", name: "Light Brahma", short: "Brahma", price: 20, tier: 2, genes: { base: "R", silver: "S", pat: "col", feet: "Pti", pea: "Pc", size: 1.25, fluff: 0.12 } },
  jerseyGiant:  { species: "chicken", name: "Jersey Giant", price: 18, tier: 2, genes: { base: "E", size: 1.3, brownEgg: 2.5 } },
  marans:       { species: "chicken", name: "Cuckoo Marans", short: "Marans", price: 20, tier: 2, genes: { base: "E", bar: "B", brownEgg: 4, skinY: "W" } },
  bcMarans:     { species: "chicken", name: "Black Copper Marans", short: "Marans", price: 24, tier: 2, genes: { base: "ER", tone: "Mh", brownEgg: 4, feet: "Pti", skinY: "W" } },
  welsummer:    { species: "chicken", name: "Welsummer", price: 20, tier: 2, genes: { base: "p", tone: "Mh", brownEgg: 3.5, speckEgg: "Sp" } },
  barnevelder:  { species: "chicken", name: "Barnevelder", price: 22, tier: 2, genes: { base: "p", tone: "Mh", pat: "dlace", brownEgg: 3.5 } },
  ameraucana:   { species: "chicken", name: "Blue Ameraucana", short: "Ameraucana", price: 24, tier: 2, genes: { base: "E", blue: ["Bl", "bl"], blueEgg: "O", pea: "Pc", beard: "Mb", brownEgg: 0 } },
  creamLegbar:  { species: "chicken", name: "Cream Legbar", short: "Legbar", price: 26, tier: 2, genes: { base: "p", tone: "di", bar: "B", crest: ["Cr", "cr"], blueEgg: "O", lobe: "Wl", brownEgg: 0 } },
  blueAndalusian:{ species: "chicken", name: "Blue Andalusian", short: "Andalusian", price: 20, tier: 2, genes: { base: "E", blue: ["Bl", "bl"], lobe: "Wl", brownEgg: 0, combSize: 1.3 } },
  olive:        { species: "chicken", name: "Olive Egger", price: 26, tier: 2, genes: { base: "ER", tone: "Mh", blueEgg: "O", brownEgg: 3.5, pea: "Pc" } },
  lavenderOrp:  { species: "chicken", name: "Lavender Orpington", short: "Orpington", price: 24, tier: 2, genes: { base: "E", lav: "lav", skinY: "W", fluff: 0.2, size: 1.1 } },
  chocolateOrp: { species: "chicken", name: "Chocolate Orpington", short: "Orpington", price: 26, tier: 2, genes: { base: "E", choc: "ch", skinY: "W", fluff: 0.2, size: 1.1 } },
  ancona:       { species: "chicken", name: "Ancona", price: 16, tier: 2, genes: { base: "E", pat: "mot", lobe: "Wl", brownEgg: 0, combSize: 1.25 } },
  hamburg:      { species: "chicken", name: "Silver Spangled Hamburg", short: "Hamburg", price: 18, tier: 2, genes: { base: "R", silver: "S", pat: "spang", rose: "Rc", lobe: "Wl", brownEgg: 0, size: 0.9 } },
  turken:       { species: "chicken", name: "Naked Neck", short: "Naked Neck", price: 18, tier: 2, genes: { base: "R", tone: "Mh", naked: "Na", brownEgg: 2.5 } },
  // Chicken Palace
  polish:       { species: "chicken", name: "Polish", price: 26, tier: 3, genes: { base: "E", crest: "Cr", wcrest: "Wc", vcomb: "D", lobe: "Wl", brownEgg: 0 } },
  silkie:       { species: "chicken", name: "Silkie", price: 30, tier: 3, genes: { recW: "c", silkie: "h", skin: "Fm", crest: "Cr", feet: "Pti", toes: "Po", rose: "Rc", pea: "Pc", brownEgg: 0.5, size: 0.75 } },
  frizzle:      { species: "chicken", name: "Frizzle", price: 28, tier: 3, genes: { base: "R", tone: "di", frizzle: ["F", "f"], skinY: "W", fluff: 0.1 } },
  faverolles:   { species: "chicken", name: "Salmon Faverolles", short: "Faverolles", price: 26, tier: 3, genes: { base: "p", silver: "S", tone: "di", beard: "Mb", feet: "Pti", toes: "Po", skinY: "W", fluff: 0.15, brownEgg: 1 } },
  houdan:       { species: "chicken", name: "Houdan", price: 28, tier: 3, genes: { base: "E", pat: "mot", crest: "Cr", vcomb: "D", toes: "Po", beard: "Mb", lobe: "Wl", skinY: "W", brownEgg: 0 } },
  sultan:       { species: "chicken", name: "Sultan", price: 32, tier: 3, genes: { recW: "c", crest: "Cr", beard: "Mb", vcomb: "D", feet: "Pti", toes: "Po", lobe: "Wl", skinY: "W", brownEgg: 0, size: 0.85 } },
  araucana:     { species: "chicken", name: "Araucana", price: 30, tier: 3, genes: { base: "E", blueEgg: "O", pea: "Pc", rump: "Rp", tufts: "Et", brownEgg: 0 } },
  ayamCemani:   { species: "chicken", name: "Ayam Cemani", price: 40, tier: 3, genes: { base: "E", skin: "Fm", brownEgg: 1, size: 0.9 } },
  sebright:     { species: "chicken", name: "Golden Sebright", short: "Sebright", price: 30, tier: 3, genes: { base: "R", tone: "n", pat: "lace", rose: "Rc", henny: "Hf", size: 0.5, brownEgg: 0.5 } },
  serama:       { species: "chicken", name: "Serama", price: 34, tier: 3, genes: { base: "p", size: 0.4, brownEgg: 1.5 } },
  phoenix:      { species: "chicken", name: "Silver Phoenix", short: "Phoenix", price: 32, tier: 3, genes: { base: "p", silver: "S", longTail: "gt", lobe: "Wl", brownEgg: 1, size: 0.85 } },
  spitzhauben:  { species: "chicken", name: "Appenzeller Spitzhauben", short: "Spitzhauben", price: 28, tier: 3, genes: { base: "R", silver: "S", pat: "spang", crest: "Cr", vcomb: "D", lobe: "Wl", brownEgg: 0 } },
  // hatched only
  mix:          { species: "chicken", name: "Barnyard Mix", price: 0, cross: true },

  // ---------- Ducks & Muscovies (Duck Pond) ----------
  pekin:        { species: "duck", name: "Pekin Duck", short: "Pekin", price: 14, genes: { white: "c", size: 1.1, lay: 1.1 } },
  mallard:      { species: "duck", name: "Mallard", price: 16, genes: { base: "M", size: 0.85, blueEgg: "O" } },
  rouen:        { species: "duck", name: "Rouen", price: 20, genes: { base: "M", size: 1.3, lay: 0.85 } },
  runner:       { species: "duck", name: "Indian Runner", short: "Runner", price: 18, genes: { base: "md", brown: "d", bib: "mag", upright: 1, blueEgg: "O", lay: 1.2 } },
  swedish:      { species: "duck", name: "Swedish Blue", short: "Swedish", price: 18, genes: { base: "E", blue: ["Bl", "bl"], bib: "bib" } },
  call:         { species: "duck", name: "Call Duck", short: "Call Duck", price: 20, genes: { white: "c", size: 0.62 } },
  cayuga:       { species: "duck", name: "Cayuga", price: 20, genes: { base: "E", darkEgg: "Cu" } },
  khakiCampbell:{ species: "duck", name: "Khaki Campbell", short: "Campbell", price: 18, genes: { base: "md", brown: "d", lay: 1.35 } },
  crestedDuck:  { species: "duck", name: "Crested Duck", short: "Crested", price: 22, genes: { white: "c", crest: ["Cr", "cr"] } },
  magpieDuck:   { species: "duck", name: "Magpie Duck", short: "Magpie", price: 20, genes: { base: "E", bib: "mag" } },
  welshHarlequin:{ species: "duck", name: "Welsh Harlequin", short: "Harlequin", price: 22, genes: { base: "M", brown: "d", harl: "hq", lay: 1.2 } },
  appleyard:    { species: "duck", name: "Silver Appleyard", short: "Appleyard", price: 24, genes: { base: "M", harl: "hq", size: 1.15 } },
  buffDuck:     { species: "duck", name: "Buff Orpington Duck", short: "Buff Duck", price: 20, genes: { base: "md", brown: "d", blue: ["Bl", "bl"] } },
  muscovy:      { species: "duck", kind: "muscovy", name: "Muscovy", price: 22, incubate: 35, genes: { pied: ["Pi", "pi"] } },
  whiteMuscovy: { species: "duck", kind: "muscovy", name: "White Muscovy", short: "Muscovy", price: 24, incubate: 35, genes: { white: "c" } },
  blueMuscovy:  { species: "duck", kind: "muscovy", name: "Blue Muscovy", short: "Muscovy", price: 26, incubate: 35, genes: { blue: ["Bl", "bl"], pied: ["Pi", "pi"] } },
  mixDuck:      { species: "duck", name: "Duck Mix", price: 0, cross: true },
  mixMuscovy:   { species: "duck", kind: "muscovy", name: "Muscovy Mix", price: 0, cross: true, incubate: 35 },
  mulard:       { species: "duck", kind: "mule", name: "Mulard", price: 0, cross: true, incubate: 32 },

  // ---------- Geese & swans (Duck Pond) ----------
  embden:       { species: "goose", name: "Embden Goose", short: "Embden", price: 34, genes: { white: "c", size: 1.25 } },
  toulouse:     { species: "goose", name: "Toulouse Goose", short: "Toulouse", price: 36, genes: { dewlap: "Dw", size: 1.3 } },
  african:      { species: "goose", name: "African Goose", short: "African", price: 40, genes: { knob: "K", dewlap: "Dw", size: 1.25 } },
  chinese:      { species: "goose", name: "Brown Chinese Goose", short: "Chinese", price: 30, genes: { knob: "K", size: 0.9, lay: 1.3 } },
  whiteChinese: { species: "goose", name: "White Chinese Goose", short: "Chinese", price: 32, genes: { knob: "K", white: "c", size: 0.9, lay: 1.3 } },
  sebastopol:   { species: "goose", name: "Sebastopol Goose", short: "Sebastopol", price: 44, genes: { white: "c", curl: "Cu" } },
  pilgrim:      { species: "goose", name: "Pilgrim Goose", short: "Pilgrim", price: 36, genes: { sd: "Sd" } },
  americanBuff: { species: "goose", name: "American Buff Goose", short: "Buff Goose", price: 38, genes: { buff: "g", size: 1.1 } },
  pomeranian:   { species: "goose", name: "Pomeranian Goose", short: "Pomeranian", price: 38, genes: { saddle: "sb" } },
  mixGoose:     { species: "goose", name: "Goose Mix", price: 0, cross: true },
  muteSwan:     { species: "goose", kind: "swan", name: "Mute Swan", price: 60, baby: "cygnet", incubate: 36, genes: { bill: "or", knob: "Kn" } },
  polishSwan:   { species: "goose", kind: "swan", name: "Polish Mute Swan", short: "Mute Swan", price: 70, baby: "cygnet", incubate: 36, genes: { bill: "or", knob: "Kn", polish: "pl" } },
  blackSwan:    { species: "goose", kind: "swan", name: "Black Swan", price: 80, baby: "cygnet", incubate: 36, genes: { black: "Bk", bill: "rd" } },
  trumpeter:    { species: "goose", kind: "swan", name: "Trumpeter Swan", price: 90, baby: "cygnet", incubate: 33, genes: { bill: "bk", size: 1.15 } },
  mixSwan:      { species: "goose", kind: "swan", name: "Swan Mix", price: 0, cross: true, baby: "cygnet", incubate: 36 },

  // ---------- Game birds (Wildflower Meadow) ----------
  coturnix:     { species: "quail", name: "Coturnix Quail", short: "Coturnix", price: 6, genes: {} },
  goldenQuail:  { species: "quail", name: "Golden Coturnix", short: "Coturnix", price: 8, genes: { gold: "Y" } },
  englishWhite: { species: "quail", name: "English White Quail", short: "Coturnix", price: 8, genes: { white: "wh" } },
  tibetan:      { species: "quail", name: "Tibetan Quail", short: "Coturnix", price: 8, genes: { dark: "Tb" } },
  tuxedoQuail:  { species: "quail", name: "Tuxedo Quail", short: "Coturnix", price: 10, genes: { dark: "Tb", tux: "s" } },
  celadonQuail: { species: "quail", name: "Celadon Quail", short: "Coturnix", price: 10, genes: { celadon: "ce" } },
  jumboQuail:   { species: "quail", name: "Jumbo Coturnix", short: "Coturnix", price: 10, genes: { size: 1.35 } },
  mixQuail:     { species: "quail", name: "Quail Mix", price: 0, cross: true },
  california:   { species: "quail", kind: "calQuail", name: "California Quail", price: 12, incubate: 22, genes: {} },
  bobwhite:     { species: "quail", kind: "bobwhite", name: "Bobwhite Quail", short: "Bobwhite", price: 14, incubate: 23, genes: {} },
  snowflake:    { species: "quail", kind: "bobwhite", name: "Snowflake Bobwhite", short: "Bobwhite", price: 16, incubate: 23, genes: { snow: "sn" } },
  mixBobwhite:  { species: "quail", kind: "bobwhite", name: "Bobwhite Mix", price: 0, cross: true, incubate: 23 },
  guinea:       { species: "guinea", name: "Pearl Guinea", short: "Guinea", price: 16, genes: {} },
  lavenderGuinea:{ species: "guinea", name: "Lavender Guinea", short: "Guinea", price: 18, genes: { lav: "lv" } },
  whiteGuinea:  { species: "guinea", name: "White Guinea", short: "Guinea", price: 18, genes: { white: "c" } },
  royalPurple:  { species: "guinea", name: "Royal Purple Guinea", short: "Guinea", price: 20, genes: { pearl: "pt" } },
  buffGuinea:   { species: "guinea", name: "Buff Guinea", short: "Guinea", price: 20, genes: { buff: "br" } },
  piedGuinea:   { species: "guinea", name: "Pied Guinea", short: "Guinea", price: 20, genes: { pied: ["Pi", "pi"] } },
  mixGuinea:    { species: "guinea", name: "Guinea Mix", price: 0, cross: true },
  ringneck:     { species: "pheasant", name: "Ring-necked Pheasant", short: "Pheasant", price: 24, genes: {} },
  blackneck:    { species: "pheasant", name: "Blackneck Pheasant", short: "Pheasant", price: 24, genes: { ring: "rg" } },
  melanistic:   { species: "pheasant", name: "Melanistic Mutant Pheasant", short: "Pheasant", price: 30, genes: { mel: "Mel" } },
  whitePheasant:{ species: "pheasant", name: "White Pheasant", short: "Pheasant", price: 30, genes: { white: "c" } },
  buffPheasant: { species: "pheasant", name: "Buff Pheasant", short: "Pheasant", price: 30, genes: { fawn: "fw" } },
  mixPheasant:  { species: "pheasant", name: "Pheasant Mix", price: 0, cross: true },
  goldenPh:     { species: "pheasant", kind: "ruffed", name: "Golden Pheasant", short: "Golden Pheasant", price: 40, incubate: 23, genes: {} },
  yellowGolden: { species: "pheasant", kind: "ruffed", name: "Yellow Golden Pheasant", short: "Golden Pheasant", price: 50, incubate: 23, genes: { yellow: "yg" } },
  darkThroated: { species: "pheasant", kind: "ruffed", name: "Dark-throated Golden Pheasant", short: "Golden Pheasant", price: 50, incubate: 23, genes: { dark: "Dt" } },
  ladyAmherst:  { species: "pheasant", kind: "ruffed", name: "Lady Amherst's Pheasant", short: "Lady Amherst", price: 50, incubate: 23, genes: { amherst: "A" } },
  mixRuffed:    { species: "pheasant", kind: "ruffed", name: "Ruffed Pheasant Mix", price: 0, cross: true, incubate: 23 },
  silverPh:     { species: "pheasant", kind: "silverPh", name: "Silver Pheasant", price: 50, incubate: 25, genes: {} },
  reeves:       { species: "pheasant", kind: "reeves", name: "Reeves's Pheasant", price: 60, incubate: 25, genes: {} },
  turkey:       { species: "turkey", name: "Bronze Turkey", short: "Turkey", price: 36, genes: {} },
  blackSpanish: { species: "turkey", name: "Black Spanish Turkey", short: "Turkey", price: 36, genes: { base: "B" } },
  bourbonRed:   { species: "turkey", name: "Bourbon Red Turkey", short: "Turkey", price: 38, genes: { base: "b" } },
  narragansett: { species: "turkey", name: "Narragansett Turkey", short: "Turkey", price: 38, genes: { narr: "n" } },
  royalPalm:    { species: "turkey", name: "Royal Palm Turkey", short: "Turkey", price: 42, genes: { palm: "cp" } },
  blueSlate:    { species: "turkey", name: "Blue Slate Turkey", short: "Turkey", price: 42, genes: { slate: ["Sl", "sl"] } },
  whiteHolland: { species: "turkey", name: "White Holland Turkey", short: "Turkey", price: 34, genes: { white: "c" } },
  midgetWhite:  { species: "turkey", name: "Midget White Turkey", short: "Turkey", price: 32, genes: { white: "c", size: 0.75 } },
  mixTurkey:    { species: "turkey", name: "Turkey Mix", price: 0, cross: true },

  // ---------- Fancy birds (Flamingo Lagoon) ----------
  flamingo:     { species: "flamingo", name: "American Flamingo", short: "Flamingo", price: 60, genes: { pink: 1, legs: "pk", bill: "pb" } },
  chilean:      { species: "flamingo", name: "Chilean Flamingo", short: "Flamingo", price: 60, genes: { pink: 0.55, legs: "gy", bill: "cb" } },
  greater:      { species: "flamingo", name: "Greater Flamingo", short: "Flamingo", price: 70, genes: { pink: 0.35, legs: "pk", bill: "pp", size: 1.15 } },
  lesser:       { species: "flamingo", name: "Lesser Flamingo", short: "Flamingo", price: 70, genes: { pink: 0.85, legs: "rd", bill: "db", size: 0.78 } },
  andean:       { species: "flamingo", name: "Andean Flamingo", short: "Flamingo", price: 90, genes: { pink: 0.6, legs: "yl", bill: "yb" } },
  james:        { species: "flamingo", name: "James's Flamingo", short: "Flamingo", price: 90, genes: { pink: 0.45, legs: "rd", bill: "yb", size: 0.85 } },
  mixFlamingo:  { species: "flamingo", name: "Hybrid Flamingo", price: 0, cross: true },
  peacock:      { species: "peafowl", name: "India Blue Peafowl", short: "Peafowl", price: 80, genes: {} },
  greenPeafowl: { species: "peafowl", name: "Green Peafowl", short: "Peafowl", price: 120, genes: { green: "Pm", size: 1.1 } },
  whitePeacock: { species: "peafowl", name: "White Peafowl", short: "Peafowl", price: 120, genes: { white: "w" } },
  piedPeacock:  { species: "peafowl", name: "Pied Peafowl", short: "Peafowl", price: 110, genes: { white: ["w", "W"] } },
  cameoPeacock: { species: "peafowl", name: "Cameo Peafowl", short: "Peafowl", price: 110, genes: { cameo: "ca" } },
  purplePeacock:{ species: "peafowl", name: "Purple Peafowl", short: "Peafowl", price: 120, genes: { purple: "pu" } },
  blackShoulder:{ species: "peafowl", name: "Black Shoulder Peafowl", short: "Peafowl", price: 110, genes: { bs: "bs" } },
  opalPeacock:  { species: "peafowl", name: "Opal Peafowl", short: "Peafowl", price: 130, genes: { opal: "op" } },
  mixPeafowl:   { species: "peafowl", name: "Peafowl Mix", price: 0, cross: true },
};
const farmOfBreed = (key) => SPECIES[BREEDS[key].species].farm;

// Coops you can build in the Backyard. Bigger coops hold more chickens.
const COOP_TIERS = [
  null,
  { name: "Cozy Coop",      price: 0,  capacity: 10, nestBoxes: 3, troughSize: 1.5 },
  { name: "Farmhouse Coop", price: 25, capacity: 20, nestBoxes: 4, troughSize: 3 },
  { name: "Chicken Palace", price: 90, capacity: 50, nestBoxes: 6, troughSize: 7 },
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
    const boy = isRooster(c);
    switch (S.voice) {
      case "cluck": this.cluck((lookOf(c).pitch || 1) * (roosterLook(c) > 0.5 ? 0.82 : 1), pan, v); break;
      case "quack": if (boy) this.rasp(pan, v); else this.quack(pan, v); break;   // only girl ducks really quack!
      case "honk": this.honk(pan, v); break;
      case "quail": this.quail(pan, v); break;
      case "guinea": if (boy) this.guinea(pan, v); else this.buckwheat(pan, v); break;
      case "pheasant": this.pheasant(pan, v); break;
      case "gobble": if (boy) this.gobble(pan, v); else this.yelp(pan, v); break;
      case "flamingo": this.flamingo(pan, v); break;
      case "peacock": if (boy) this.peacock(pan, v); else this.peahen(pan, v); break;
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
  stickers: {},         // sticker book: which birds you've raised
  special: {},          // sticker book: special stickers
  stats: freshStats(),  // things we count for the special stickers
  bookNew: false,       // a new sticker you haven't looked at yet
};
function freshStats() {
  return { collected: 0, hatched: 0, golden: 0, dressed: 0, rainbows: 0, visitors: 0, seasons: {} };
}

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
    incubator: [],        // eggs keeping warm until they hatch { breed, startedAt, crack }
  };
}
const farms = {};
for (const id of FARM_ORDER) farms[id] = newFarmState(id);
let F = farms.backyard;   // "F" is always the farm you're looking at
let nextId = 1;

// Things that only matter while the game is open (never saved)
const fx = {
  particles: [], grains: [], butterflies: [], fireflies: [], clouds: [],
  stars: [], flyers: [], crates: [], blades: [], cloudSprites: [], weather: [],
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
  const before = { W: view.W, H: view.H, hz: view.horizon, ready: view.w > 0 };
  view.w = w; view.h = h; view.dpr = dpr;
  view.s = Math.min(h / 768, w / 1000);
  view.W = w / view.s;
  view.H = h / view.s;
  view.horizon = view.H * 0.38;
  if (before.ready && (before.W !== view.W || before.H !== view.H)) remapWorld(before);
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

// When the screen turns (portrait <-> landscape) the farm changes shape.
// Move every bird, egg and treat to the SAME spot relative to the ground,
// so nothing ends up floating in the sky or lost below the screen.
function remapWorld(o) {
  const mx = (x) => (x / o.W) * view.W;
  const my = (y) => view.horizon + ((y - o.hz) / (o.H - o.hz)) * (view.H - view.horizon);
  for (const id of FARM_ORDER) {
    const st = farms[id];
    for (const c of st.birds) {
      c.x = mx(c.x); c.y = my(c.y);
      c.tx = mx(c.tx); c.ty = my(c.ty);
      c.ex0 = mx(c.ex0); c.ey0 = my(c.ey0);
    }
    for (const e of st.yardEggs) { e.x = mx(e.x); e.y = my(e.y); }
  }
  for (const p of fx.grains) { p.x = mx(p.x); p.y = my(p.y); }
  for (const cr of fx.crates) { cr.x = mx(cr.x); cr.y = my(cr.y); }
  for (const b of fx.butterflies) { b.x = mx(b.x); b.y = my(b.y); }
  fx.fireflies = [];
  fx.particles = [];
  fx.weather = [];
  hawk = null;
  if (visitor) { visitor.x = mx(visitor.x); visitor.y = my(visitor.y); visitor.tx = mx(visitor.tx); visitor.ty = my(visitor.ty); }
  // a bird you were carrying gets set down gently
  for (const c of F.birds) if (c.state === "carried") { c.state = "fall"; c.vz = 0; }
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
    P.incubator = { x: W * 0.36, y: hz + g * 0.54 };
  } else if (id === "pond") {
    P.coop = { x: W * 0.17, y: hz + g * 0.32 };
    P.feeder = { x: W * 0.2, y: hz + g * 0.8 };
    P.water = { x: W * 0.6, y: hz + g * 0.56, rx: W * 0.27, ry: g * 0.24 };
    P.tree = { x: W * 0.93, y: hz + g * 0.12, kind: "willow" };
    P.incubator = { x: W * 0.08, y: hz + g * 0.58 };
  } else if (id === "meadow") {
    P.coop = { x: W * 0.2, y: hz + g * 0.34 };
    P.feeder = { x: W * 0.55, y: hz + g * 0.76 };
    P.waterer = { x: W * 0.77, y: hz + g * 0.66 };
    P.tree = { x: W * 0.9, y: hz + g * 0.15, kind: "apple" };
    P.dust = { x: W * 0.6, y: hz + g * 0.3 };
    P.windmill = { x: W * 0.7, y: hz - 30 };
    P.incubator = { x: W * 0.37, y: hz + g * 0.56 };
  } else {
    P.coop = { x: W * 0.19, y: hz + g * 0.3 };
    P.feeder = { x: W * 0.22, y: hz + g * 0.8 };
    P.water = { x: W * 0.62, y: hz + g * 0.55, rx: W * 0.28, ry: g * 0.22 };
    P.tree = { x: W * 0.93, y: hz + g * 0.22, kind: "palm" };
    P.tree2 = { x: W * 0.36, y: hz + g * 0.1, kind: "palm" };
    P.incubator = { x: W * 0.08, y: hz + g * 0.6 };
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
  const bw = n > 4 ? 84 : 100, bh = 84, gap = n > 4 ? 12 : 16, startX = room.door.x + room.door.w + 34;
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
  // Not enough room on the roosts? The rest snuggle down on the straw,
  // spread out in rows across the floor.
  const R = seeded(99), need = COOP_TIERS[tier].capacity + 2 - room.slots.length;
  if (need > 0) {
    const cols = Math.ceil(Math.sqrt(need * 2.4)), rows = Math.ceil(need / cols);
    for (let i = 0; i < need; i++) {
      const cx = (i % cols + 0.5) / cols, cy = rows > 1 ? Math.floor(i / cols) / (rows - 1) : 0.5;
      room.slots.push({ x: lerp(W * 0.3, W * 0.95, cx) + (R() - 0.5) * 20, y: lerp(fy + 60, H - 34, cy) + (R() - 0.5) * 12 });
    }
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
  if (places.incubator) {
    const p = places.incubator, s = scaleAt(p.y);
    if (Math.abs(x - p.x) < 40 * s && Math.abs(y - p.y) < 16 * s) y = p.y + 22 * s;
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
    name: o.name || (o.sex === "rooster" ? roosterName() : freshName()),
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
    hat: o.hat || null,               // dress-up: "bow", "tophat", "crown"...
    sex: o.sex === "rooster" ? "rooster" : "hen",   // only hens lay eggs
    sexKnown: o.sexKnown !== false,   // hatched chicks keep it a surprise until they grow up
    geno: o.geno || null,             // its genes (see BOYS, GIRLS & GENES)
    cross: o.cross || null,           // a name for a hatched cross or mix, like "Black Star"
    mom: o.mom || null, dad: o.dad || null,   // the breeds of its parents, if it hatched here
    kids: o.kids || 0,                // how many chicks this bird is the mom or dad of
    crowT: rand(20, 70), crowed: false, rival: null,
  };
}

const isBaby = (c) => c.growth < 0.55;
const growK = (c) => (isBaby(c) ? 0.6 : lerp(0.66, 1, (c.growth - 0.55) / 0.45));
const smallK = (c) => (lookOf(c).size || 1) * maleK(c) * (1 + 0.1 * roosterLook(c));   // size genes; boys are a bit bigger
const bodyH = (c) => (isBaby(c) ? 16 : SP(c).body * growK(c)) * SP(c).size * smallK(c);
const headH = (c) => (isBaby(c) ? 38 : SP(c).height * growK(c)) * SP(c).size * smallK(c);
const sinkOf = (c) => (SP(c).sink || 10) * c.wet * SP(c).size * (isBaby(c) ? 0.5 : 1);
const canWater = (c) => !!(SP(c).swim || SP(c).wade);
const speedOf = (c) => (isBaby(c) ? SETTINGS.chickSpeed : SETTINGS.henSpeed) * (SP(c).speedK || 1);
const rollGolden = () => Math.random() < SETTINGS.goldenEggChance;
const eggInterval = () => SETTINGS.eggEverySeconds * rand(0.8, 1.25);
const eggValueOf = (breed, golden) => (golden ? SETTINGS.goldenEggValue : SPECIES[BREEDS[breed].species].eggValue);
const babyWord = (key) => BREEDS[key].baby || SPECIES[BREEDS[key].species].baby;
const layBoostOf = (c) => (lookOf(c).layBoost || 1) * (SP(c).layBoost || 1) * flockBoostOf(c);

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
  if (SP(c).swim && isRaining()) c.joy = clamp(c.joy + dt * 0.02);   // ducks LOVE rain
  if (c.growth < 1 && c.food > 0.15 && c.water > 0.15) {
    c.growth = Math.min(1, c.growth + dt / SETTINGS.growUpSeconds);
    if (c.growth >= 1) grewUp(c);
  }
}

function grewUp(c) {
  let msg = `${c.name} is all grown up! ${SP(c).icon}`;
  // Nobody can tell a chick's a boy or a girl until it grows up. Surprise!
  if (!c.sexKnown && !KINDS[kindOf(c)].sterile) {
    const icon = isChicken(c) ? (isRooster(c) ? "🐓" : "🐔") : SP(c).icon;
    msg = isRooster(c) ? `${c.name} grew up, and he's a ${sexWord(c)}! ${icon}` : `${c.name} grew up, and she's a ${sexWord(c)}! ${icon}`;
  }
  c.sexKnown = true;
  toast(msg, 3000);
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
    if (k === "display" && !isRooster(c)) continue;   // only the boys show off their tails
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
  if (c.growth >= 1 && c.eggClock <= 0 && canLay(c)) { startLaying(c); return; }
  // Most birds don't like rain, so they go stand under the house or the tree
  if (isRaining() && dislikesRain(c) && Math.random() < 0.75) {
    const s = shelterSpot(c);
    c.goal = "shelter";
    walkTo(c, s.x, s.y, speedOf(c) * 1.2, false);
    return;
  }
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
      if (isRooster(c) && isChicken(c) && c.growth >= 1 && Math.random() < 0.2) { startTidbit(c, true); break; }   // "Ladies! A snack!"
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
      if (c.pile && c.pile.bites > 0) {
        c.state = "treatPeck"; c.peckT = 0; c.biteT = rand(0, 0.3); c.dir = c.pile.x >= c.x ? 1 : -1;
        if (isRooster(c) && isChicken(c) && c.growth >= 1 && Math.random() < 0.7) startTidbit(c, false);   // he calls the hens first
      } else think(c);
      return;
    case "squabble": {
      const r = c.rival;
      c.rival = null;
      if (r && r.loc === "yard" && Math.hypot(r.x - c.x, r.y - c.y) < 90 * scaleAt(c.y) && (r.state === "idle" || canShow(r))) {
        puffUp(c, r); puffUp(r, c);
        Sound.squawk(panX(c.x));
      } else think(c);
      return;
    }
    case "lay":
      if (!F.doorClosed) startEnter(c);
      else { c.goal = "layYard"; c.state = "layYard"; c.t = rand(4, 6); }
      return;
    case "bed": startEnter(c); return;
    case "layYard": c.state = "layYard"; c.t = rand(4, 6); return;
    case "dust": c.state = "dust"; c.t = rand(4, 7); return;
    case "hide":
    case "shelter": c.goal = null; c.state = "idle"; c.t = rand(3, 6); c.flapT = 0.3; return;
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
    F.yardEggs.push({ id: nextId++, x, y, breed: c.breed, egg: eggLookOf(c), golden: rollGolden(), glint: rand(0, 3) });
  }
  finishLaying(c);
  c.state = "song"; c.t = 1.6;
  layerSong(c, panX(c.x), 0.85);
  notes(c.x, c.y, headH(c) * sc, 4, sc);
}
function layEggInNest(c) {
  F.nestEggs.push({ id: nextId++, box: c.nestBox, breed: c.breed, egg: eggLookOf(c), golden: rollGolden() });
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
  if (c.growth >= 1 && canLay(c) && !bedtime && c.goal !== "lay" && c.goal !== "layYard" && c.state !== "carried") {
    const m = mood(c);
    if (m > 0.35) c.eggClock -= dt * (0.6 + 0.8 * m) * layBoostOf(c);
    if (c.eggClock <= 0 && INTERRUPTIBLE.has(c.state) && c.goal !== "bed" && c.goal !== "shore") startLaying(c);
  }
  // Sunset: time to head for the house
  if (bedtime && c.goal !== "bed" && c.goal !== "shore" && INTERRUPTIBLE.has(c.state)) think(c);

  if (!updateRoosterState(c, dt)) switch (c.state) {
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
  else if (s === "crow") hu = c.peckT < 0.45 ? 0.3 : 1;
  else if (s === "guard") hu = 0.9;
  else if (s === "tidbit") hd = 0.45 + 0.45 * Math.sin(c.peckT * 15);
  else if (s === "puff") hd = 0.4;
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
  c.beakOpen = s === "song" || s === "nestSong" ? 0.5 + 0.5 * Math.sin(clock * 18)
    : s === "crow" && c.peckT > 0.45 && c.peckT < 1.9 ? 0.85 : c.beakOpenT > 0 ? 0.8 : 0;

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
  flockCache = {};
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
    if (c.growth >= 1 && !bed && canLay(c)) {
      const m = mood(c);
      if (m > 0.35) c.eggClock -= dt * (0.6 + 0.8 * m) * layBoostOf(c);
      if (c.eggClock <= 0) {
        c.eggClock = eggInterval();
        c.laid++;
        game.totalEggs++;
        const egg = eggLookOf(c);
        if (!addNestEggTo(id, c.breed, rollGolden(), egg)) addYardEggTo(id, c.breed, rollGolden(), egg);
      }
    }
  }
}
function addNestEggTo(id, breed, golden, egg) {
  const st = farms[id];
  for (let b = 0; b < nestCount(id); b++) {
    if (st.nestEggs.filter((e) => e.box === b).length < SETTINGS.nestBoxHolds) {
      st.nestEggs.push({ id: nextId++, box: b, breed, egg, golden });
      return true;
    }
  }
  return false;
}
function addYardEggTo(id, breed, golden, egg) {
  const st = farms[id], P = placesFor(id);
  if (st.yardEggs.length >= SETTINGS.maxYardEggs) return false;
  let x = 0, y = 0;
  for (let i = 0; i < 8; i++) {
    x = rand(80, view.W - 80);
    y = rand(groundTop() + 30, groundBottom() - 20);
    if (!inWaterPt(x, y, 1.15, P)) break;
  }
  st.yardEggs.push({ id: nextId++, x, y, breed, egg, golden, glint: rand(0, 3) });
  return true;
}
// Put a new bird on any farm (a chick you bought, or a welcome present)
function addBirdToFarm(id, breed, growth, sex) {
  const st = farms[id], P = placesFor(id), sc = scaleAt(P.coop.y), geo = houseGeo(id);
  const c = makeBird({
    breed, growth, sex, food: 0.9, water: 0.9, joy: 0.8,
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
  const col = isBaby(c) ? lookOf(c).chick : lookOf(c).body;
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
      const c = makeBird({ breed: cr.breed, sex: cr.sex, x: cr.x + 18 * sc, y: cr.y + 6, growth: 0.12, food: 0.9, water: 0.9, joy: 0.8 });
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
    const hens = B.birds.filter((c) => c.growth >= 1 && canLay(c));
    const hen = hens.length ? pick(hens) : null;
    if (game.farm === "backyard") dawnChorus();
    if (hen && addNestEggTo("backyard", hen.breed, false, eggLookOf(hen))) {
      if (started) toast("Good morning! 🌅 A thank-you egg is waiting in the coop.", 3200);
    } else if (started) toast("Good morning! 🌅");
  } else if (prev < 0.03 && t >= 0.03 && started) {
    toast("Good morning! 🌅");
    dawnChorus();
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
  const id = game.farm, SC = seasonalScenery(id), P = places;
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
  if (weather.amount > 0.01) { g.fillStyle = `rgba(120,130,145,${0.5 * weather.amount})`; g.fillRect(0, 0, W, H); }   // gray rainy sky

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
  drawRainbow(g);
}


// ---------- The farm you're visiting ----------
function drawYard(g) {
  g.drawImage(bgCanvas, 0, 0, view.W, view.H);
  if (places.water) drawWaterFx(g);
  if (places.windmill) drawAt(g, places.windmill, drawWindmill);
  drawShadows(g);
  drawHawkShadow(g);

  // Everything is drawn back-to-front, so closer things cover farther things
  const list = [];
  list.push({ y: places.coop.y, f: drawHouseAt });
  list.push({ y: places.feeder.y, f: () => drawAt(g, places.feeder, drawFeeder, shown.feeder) });
  if (places.waterer) list.push({ y: places.waterer.y, f: () => drawAt(g, places.waterer, drawWaterer, shown.water) });
  for (const t of [places.tree, places.tree2]) if (t) list.push({ y: t.y, f: () => drawAt(g, t, drawTreeKind, t.kind) });
  if (game.farm === "backyard" && F.tier >= 3) list.push({ y: places.fountain.y, f: () => drawAt(g, places.fountain, drawFountain) });
  list.push({ y: places.incubator.y, f: () => drawAt(g, places.incubator, drawIncubator) });
  if (visitor) list.push({ y: visitor.y, f: () => drawVisitor(g, visitor) });
  for (const p of fx.grains) list.push({ y: p.y - 1, f: () => drawGrain(g, p) });
  for (const e of F.yardEggs) list.push({ y: e.y, f: () => drawYardEgg(g, e) });
  for (const cr of fx.crates) list.push({ y: cr.y, f: () => drawCrate(g, cr) });
  for (const c of F.birds) if (c.loc === "yard") list.push({ y: c.y + 0.01, f: () => drawBirdAt(g, c, c.x, c.y, scaleAt(c.y)) });
  for (const b of fx.butterflies) list.push({ y: b.y, f: () => drawButterfly(g, b) });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) it.f(g);

  drawParticles(g);
  drawWeather(g);
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
  const season = seasonOf();
  if (season === "winter") {        // bare branches with snow on top
    g.strokeStyle = "#7A5334"; g.lineWidth = 5;
    g.beginPath();
    for (const [x0, y0, x1, y1] of [[-44, -150, -80, -190], [-44, -150, -30, -205], [40, -160, 76, -200], [40, -160, 20, -225], [-2, -118, 4, -240]]) { g.moveTo(x0, y0); g.lineTo(x1, y1); }
    g.stroke();
    g.fillStyle = "#FFFFFF";
    for (const [x, y, r] of [[-80, -192, 9], [-30, -207, 8], [76, -202, 9], [20, -227, 8], [4, -242, 9], [-44, -152, 10], [40, -162, 10]]) { ellipse(g, x, y, r, r * 0.5); g.fill(); }
    return;
  }
  const leaves = season === "fall" ? ["#B8561E", "#D9822B", "#F2B84A"] : season === "spring" ? ["#5FA244", "#7DBB55", "#A6D67A"] : ["#4C8A37", "#5FA244", "#7DBB55"];
  layer(leaves[0], 0, 0, 1);
  layer(leaves[1], -6, -7, 0.82);
  layer(leaves[2], -14, -16, 0.45);
  if (season === "spring") {        // pink blossoms
    const R = seeded(9);
    for (let i = 0; i < 26; i++) {
      const [x, y, r] = clusters[i % clusters.length], a = R() * TAU, d = R() * r * 0.85;
      g.fillStyle = i % 3 ? "#F7B8CF" : "#FFFFFF"; circle(g, x + Math.cos(a) * d + sway * (y / -240), y + Math.sin(a) * d, 4.5); g.fill();
    }
  }
  if (apples && season !== "spring") {
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
  const season = seasonOf(), bare = season === "winter";
  const pal = season === "fall" ? ["#C9A43A", "#E6C45A", "#D8B448", "#B8902E"] : season === "spring" ? ["#7DBB55", "#A6D67A", "#95CC68", "#7DB35A"] : ["#6AA34C", "#86BD5E", "#7DB35A", "#5E9A44"];
  if (!bare) {
    g.fillStyle = pal[0];
    for (const [x, y, r] of [[-60, -170, 60], [10, -200, 70], [70, -165, 56], [-10, -150, 60]]) { circle(g, x, y, r); g.fill(); }
    g.fillStyle = pal[1];
    for (const [x, y, r] of [[-66, -180, 30], [2, -218, 36], [60, -178, 28]]) { circle(g, x, y, r); g.fill(); }
  }
  // long drooping branches that sway in the breeze
  g.lineCap = "round";
  for (let i = 0; i < 34; i++) {
    const x = -120 + i * 7.3, top = -180 + Math.pow((x - 5) / 120, 2) * 70, len = 90 + ((i * 37) % 40);
    const s = sway * (0.6 + (i % 3) * 0.2);
    g.strokeStyle = bare ? "#9C8C70" : i % 2 ? pal[2] : pal[3]; g.lineWidth = bare ? 1.6 : 3.2;
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
function drawEgg(g, breed, golden, k = 1, look) {
  const E = look || BREEDS[breed].egg, sz = SPECIES[BREEDS[breed].species].egg;
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
  drawEgg(g, e.breed, e.golden, 1, e.egg);
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
  // Size genes (and bigger boys): a Serama is tiny, a Jersey Giant is huge
  let z = (lookOf(c).size || 1) * maleK(c);
  if (c.portrait) z = clamp(z, 0.8, 1);
  const S = SP(c);
  g.save();
  g.scale(z, z);
  if (isBaby(c)) drawBaby(g, c, now);
  else if (S.draw === drawHen) drawHen(g, c, now);
  else { const k = growK(c); g.scale(k, k); S.draw(g, c, lookOf(c), now); }
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
    if (o.kneeColor && o.knee) { g.fillStyle = o.kneeColor; circle(g, (hx + fx) / 2 - o.knee, (o.hipY + fy) / 2, o.width * 1.1); g.fill(); g.fillStyle = o.color; }   // pink "knees"
    if (o.web) { g.beginPath(); g.moveTo(fx - 3, fy); g.lineTo(fx + 9, fy + 1); g.lineTo(fx + 2, fy - 3); g.closePath(); g.fill(); }
    else { g.lineWidth = o.width * 0.68; g.beginPath(); g.moveTo(fx - 3.5, fy); g.lineTo(fx + 7, fy + 0.4); g.stroke(); }
  });
}

// ---------- Chickens ----------
function drawHen(g, c, now) {
  const B = lookOf(c);
  const grow = clamp((c.growth - 0.55) / 0.45);
  const R = roosterLook(c);                 // 0 for hens, up to 1 for a grown-up rooster
  const k = lerp(0.66, 1, grow) * (1 + 0.1 * R), combK = lerp(0.2, 1, grow) * (1 + 0.45 * R);
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
  if (!B.rumpless) {                       // rumpless chickens have no tail at all!
    drawTail(g, B);
    if (R > 0.05 && !B.silkie && !B.henny) drawSickles(g, B, R, now, c);   // a rooster's long, curvy tail
  }
  g.restore();

  // body (a rooster puffs out his chest)
  const rx = 27 + fluff * 16 + 2 * R, ry = 20.5 + fluff * 8 + R;
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
  if (B.frizzle) drawFrizzle(g, B, rx, ry, by, B.frizzle, c.id);

  // wing (it flaps when she's excited, carried, or falling)
  const flap = isFlapping(c) ? (Math.sin(now * 38) * 0.5 + 0.5) * 1.1 : 0;
  g.save();
  g.translate(4, by - 8);
  g.rotate(-0.12 - flap);
  g.fillStyle = B.wing || B.shade;
  ellipse(g, -10, 3, 15, 9.5, -0.08); g.fill();
  if (B.pattern === "barred" || B.pattern === "laced") {
    g.save(); ellipse(g, -10, 3, 15, 9.5, -0.08); g.clip();
    g.fillStyle = rgba(B.mark || "#26262C", 0.6);
    for (let x = -26; x < 6; x += 5.5) g.fillRect(x, -8, 2.4, 22);
    g.restore();
  }
  g.strokeStyle = rgba(B.light, 0.55); g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(-22, 5); g.quadraticCurveTo(-12, 10, -1, 6); g.moveTo(-19, 9); g.quadraticCurveTo(-11, 13, -3, 10); g.stroke();
  g.restore();

  // neck and head (the head moves: pecking, drinking, singing, sleeping)
  const thrust = c.moving ? Math.sin(c.walkPhase * 2 + 1) * 2.6 : 0;
  let hx = 17 + thrust + (c.look || 0) * 1.5, hy = by - 21 - 5 * R;   // roosters stand tall
  if (c.sleep > 0.01) { hx = lerp(hx, 11, c.sleep); hy = lerp(hy, by - 13, c.sleep); }
  hx = lerp(hx, 29, c.headDown);
  hy = lerp(hy, -9 + sy * 0.4, c.headDown);
  hx -= c.headUp * 3;
  hy -= c.headUp * 7;
  const skin = "#F28E80";
  g.strokeStyle = B.naked === 2 ? skin : B.neck || B.body; g.lineCap = "round"; g.lineWidth = B.naked === 2 ? 10 : 15;
  g.beginPath(); g.moveTo(7, by - 8); g.lineTo(hx - 3, hy + 4); g.stroke();
  if (B.naked === 1) {         // one naked-neck gene: a bare patch on the front of the neck
    g.strokeStyle = skin; g.lineWidth = 6;
    g.beginPath(); g.moveTo(lerp(7, hx - 3, 0.35) + 3, lerp(by - 8, hy + 4, 0.35) + 2); g.lineTo(lerp(7, hx - 3, 0.75) + 3, lerp(by - 8, hy + 4, 0.75) + 2); g.stroke();
  } else if (B.naked === 2) {  // two: a bare neck with a little "bow tie" of feathers
    const bx = lerp(7, hx - 3, 0.45), bny = lerp(by - 8, hy + 4, 0.45);
    g.fillStyle = B.neck || B.body;
    ellipse(g, bx + 3, bny + 2, 5, 4); g.fill(); ellipse(g, bx - 2, bny + 1, 4, 3.4); g.fill();
  }
  if (B.silkie) { g.fillStyle = B.body; circle(g, (7 + hx) / 2, (by - 8 + hy) / 2, 10); g.fill(); }
  if (R > 0.05 && !B.silkie && !B.henny && B.naked !== 2) drawHackles(g, B, R, hx, hy, by, c.state === "puff" ? 1 : 0);

  g.save();
  g.translate(hx, hy);
  g.rotate(c.headDown * 0.85 - c.headUp * 0.5 + (c.look || 0) * 0.12 + c.sleep * 0.35);
  drawComb(g, B, combK);
  const hg = g.createRadialGradient(3, -5, 1, 0, 0, 13);
  hg.addColorStop(0, B.light);
  hg.addColorStop(1, B.neck || B.body);
  g.fillStyle = hg; circle(g, 0, 0, 11.5); g.fill();
  if (B.face) { g.fillStyle = B.face; ellipse(g, 5, 1, 6.5, 5.5); g.fill(); }     // dark faces (Silkies, Ayam Cemanis)
  const open = c.beakOpen || 0;
  g.fillStyle = B.beak;
  g.beginPath(); g.moveTo(8, -3.5); g.lineTo(19, 0.5 - open * 2); g.lineTo(8, 1.8); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(8, 2); g.lineTo(15.5, 2.6 + open * 5); g.lineTo(8, 4.6); g.closePath(); g.fill();
  if (B.muffs) {           // Easter & Olive Eggers have fluffy cheeks and a beard!
    g.fillStyle = B.muffs;
    circle(g, -1, 6, 5.2); g.fill(); circle(g, 5, 8.5, 5.4); g.fill(); circle(g, 10, 7, 4); g.fill();
  } else if (!B.silkie) {  // wattles
    g.fillStyle = B.comb;
    ellipse(g, 9.5, 8, 2.6 * combK + 1, 4.6 * combK + 1.2, 0.15); g.fill();
    ellipse(g, 6, 8.5, 2.2 * combK + 1, 4 * combK + 1); g.fill();
  }
  g.fillStyle = B.earlobe || B.comb; ellipse(g, -3.5, 3, 2.3, 2.9); g.fill();
  if (B.tufts) {           // Araucana ear tufts
    g.fillStyle = B.tufts;
    g.beginPath(); g.moveTo(-5, 4); g.quadraticCurveTo(-14, 2, -17, 9); g.quadraticCurveTo(-10, 8, -4, 7); g.closePath(); g.fill();
  }
  drawEye(g, c, 4.6, -3, 1);
  if (B.silkie && B.crest) {   // the silkie's pom-pom hairdo
    g.fillStyle = B.body;
    circle(g, -4, -11, 7); g.fill(); circle(g, 2, -13, 7); g.fill(); circle(g, -10, -6, 6); g.fill(); circle(g, 7, -11, 4.5); g.fill();
    g.fillStyle = "rgba(255,255,255,.55)"; circle(g, -1, -15, 3.5); g.fill();
  }
  if (B.crest && !B.silkie) {  // a crest: one gene makes a little one, two make a giant wobbly pom-pom!
    const w = c.moving ? Math.sin(c.walkPhase * 2) * 1.2 : Math.sin(now * 2) * 0.4;
    const ck = combK * (B.crest === 2 ? 1.3 : 0.66);
    g.fillStyle = B.crestColor;
    for (const [x, y, r] of [[-6, -12, 8], [1, -15, 8.5], [7, -12, 6], [-11, -6, 6], [-2, -8, 6.5]]) { circle(g, x + w, y * (B.crest === 2 ? 1 : 0.85), r * ck); g.fill(); }
    g.fillStyle = "rgba(0,0,0,.06)"; circle(g, -2 + w, -9, 5 * ck); g.fill();
  }
  drawAccessory(g, c, 11.5, 4.6, -3);
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
  const mark = B.mark || "#26262C", a = B.markA || 0.78, R = seeded(seed * 97 + 3);
  const spot = (fn, n) => { for (let i = 0; i < n; i++) { const ang = R() * TAU, d = Math.sqrt(R()); fn(-2 + Math.cos(ang) * d * 25, by + Math.sin(ang) * d * 18); } };
  switch (B.pattern) {
    case "barred": case "cuckoo":   // black and white stripes
      g.save(); g.translate(-2, by); g.rotate(-0.35);
      g.fillStyle = rgba(mark, a);
      for (let y = -34; y < 34; y += 6.2) g.fillRect(-44, y, 88, 2.8);
      g.restore();
      break;
    case "speckle":
      spot((x, y) => { g.fillStyle = R() < 0.5 ? rgba(B.shade, 0.8) : rgba(B.light, 0.8); circle(g, x, y, 1.3 + R() * 1.2); g.fill(); }, 26);
      break;
    case "laced": case "dlaced":    // every feather outlined (twice, for double-laced!)
      g.strokeStyle = rgba(mark, a); g.lineWidth = 1.5;
      for (let row = 0; row < 7; row++) {
        const y = by - 20 + row * 6.5;
        for (let x = -30 + (row % 2) * 4; x < 28; x += 8) {
          g.beginPath(); g.arc(x, y, 4.2, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
          if (B.pattern === "dlaced") { g.beginPath(); g.arc(x, y - 1, 2, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
        }
      }
      break;
    case "spangled":                // a round black spot at the tip of each feather
      g.fillStyle = rgba(mark, 0.85);
      for (let row = 0; row < 6; row++) for (let x = -28 + (row % 2) * 4; x < 26; x += 8) { ellipse(g, x, by - 17 + row * 7, 2.6, 2); g.fill(); }
      break;
    case "dots":                    // speckled: dark bar + white dot on every feather
      spot((x, y) => { g.fillStyle = rgba(mark, 0.55); g.fillRect(x - 2, y - 0.6, 4, 1.3); g.fillStyle = "#FFF8EC"; circle(g, x + 1.5, y + 1.4, 1.3); g.fill(); }, 34);
      break;
    case "mottled":                 // white tips on dark feathers
      spot((x, y) => { g.fillStyle = "rgba(255,255,255,.9)"; circle(g, x, y, 1.2 + R() * 0.7); g.fill(); }, 30);
      break;
    case "pencil":                  // fine wavy lines, like wild hens
      g.strokeStyle = rgba(mark, a); g.lineWidth = 0.9;
      for (let row = 0; row < 8; row++) {
        const y = by - 18 + row * 5;
        g.beginPath();
        for (let x = -30; x <= 26; x += 4) g.lineTo(x, y + Math.sin(x * 0.6 + row) * 1.2);
        g.stroke();
      }
      break;
    case "flecks":                  // one dominant-white gene: little specks
      g.fillStyle = rgba(mark, a);
      spot((x, y) => { ellipse(g, x, y, 2.2, 1.1, -0.3); g.fill(); }, 14);
      break;
    case "splash":                  // splash: blue blotches on white
      g.fillStyle = rgba(mark, 0.55);
      spot((x, y) => { circle(g, x, y, 2 + R() * 2.5); g.fill(); }, 16);
      break;
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
    if (B.toes5) { g.lineWidth = 1.8; g.beginPath(); g.moveTo(fx - 3, fy - 0.6); g.lineTo(fx - 7, fy - 3); g.stroke(); }   // a fifth toe!
    if (roosterLook(c) > 0.6) {        // a rooster's spur, on the back of each leg
      const sx = lerp(fx, hx, 0.3), sy = lerp(fy, hipY, 0.3);
      g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx - 5, sy - 1.5); g.stroke();
    }
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
  const t = B.combType;
  if (t === "pea") {
    for (const [x, y, r] of [[-3, -10.5, 2.6], [1, -11.5, 3], [5, -10.5, 2.6]]) { circle(g, x * (0.6 + 0.4 * k), -8 + (y + 8) * k, r * (0.5 + 0.5 * k)); g.fill(); }
    return;
  }
  if (t === "rose") { ellipse(g, 1, -10.5, 7 * k + 1, 3 * k + 0.8); g.fill(); circle(g, -6 * k, -11 * k - 1, 1.8 * k); g.fill(); return; }
  if (t === "walnut") {     // rose + pea together: a lumpy little walnut
    ellipse(g, 1.5, -10, 5.2 * k + 1, 3.6 * k + 0.8); g.fill();
    g.fillStyle = "rgba(0,0,0,.14)"; circle(g, 0, -10.5, 1.1 * k); g.fill(); circle(g, 3.2, -9.6, 1 * k); g.fill();
    return;
  }
  if (t === "v") {          // V comb: two little horns
    g.beginPath(); g.moveTo(-1, -8); g.quadraticCurveTo(-6, -11 * k - 2, -3, -14 * k - 2); g.quadraticCurveTo(0, -11 * k, 1.5, -8); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(2, -8); g.quadraticCurveTo(3, -12 * k - 2, 7, -13 * k - 2); g.quadraticCurveTo(5, -10 * k, 4.5, -7.5); g.closePath(); g.fill();
    return;
  }
  const size = B.combSize || 1, s = k * size;
  g.save();
  if (size > 1.25) g.rotate(-0.1);    // big combs flop over a little
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
  const B = lookOf(c), S = SP(c), flat = S.bill === "flat";
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
  if (B.chickSpot) { g.fillStyle = B.chickSpot; circle(g, hx - 1, hy - 4, B.chickSpotBig ? 4.2 : 3); g.fill(); }
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
  g.save(); g.translate(hx, hy); drawAccessory(g, c, 8.2, 3.5, -2); g.restore();
  g.restore();
}

// ---------- Ducks (Pekin, Mallard, Runner, Swedish Blue, Call duck) ----------
function drawDuck(g, c, B, now) {
  const swim = c.wet > 0.5, up = B.upright || 0, small = 1;
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
  if (B.back || B.scallop) {
    g.save(); ellipse(g, -3, by, 30, 16.5, -0.05); g.clip();
    if (B.back) { g.fillStyle = B.back; ellipse(g, -8, by - 12, 26, 10); g.fill(); }   // magpie: colored back
    if (B.scallop) {       // girl ducks are speckled brown, so they're hard to see on a nest
      g.strokeStyle = rgba(B.scallop, 0.45); g.lineWidth = 1;
      for (let row = 0; row < 4; row++) for (let x = -28 + (row % 2) * 3; x < 24; x += 6) { g.beginPath(); g.arc(x, by - 9 + row * 5, 2.6, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); }
    }
    g.restore();
  }
  ellipse(g, -3, by, 30, 16.5, -0.05); g.lineWidth = 1.1; g.strokeStyle = "rgba(60,40,20,.18)"; g.stroke();
  // wing
  g.save(); g.translate(4, by - 6); g.rotate(-0.06 - (isFlapping(c) ? Math.sin(now * 34) * 0.5 + 0.5 : 0));
  g.fillStyle = B.wing || B.shade; ellipse(g, -12, 2, 18, 8, -0.04); g.fill();
  if (B.speculum) { g.fillStyle = B.speculum; roundRect(g, -25, 2, 10, 4, 2); g.fill(); }
  if (B.wingPatch) { g.fillStyle = B.wingPatch; ellipse(g, -4, 1, 8, 4.5); g.fill(); }
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
  if (B.cap) { g.save(); circle(g, 0, 0, 10); g.clip(); g.fillStyle = B.cap; ellipse(g, -2, -6, 11, 7); g.fill(); g.restore(); }
  if (B.stripe) { g.strokeStyle = rgba(B.stripe, 0.7); g.lineWidth = 1.4; g.beginPath(); g.moveTo(-7, -2); g.lineTo(8, -3); g.stroke(); }
  if (B.caruncle) {        // a Muscovy's red, bumpy face
    const k = B.caruncleK || 1;
    g.fillStyle = B.caruncle; circle(g, 3, -2, 5 * k); g.fill(); circle(g, 7, 0, 3.4 * k); g.fill(); circle(g, 5.5, -5, 2.4 * k); g.fill();
  }
  if (B.crest) {           // a crested duck's puffball
    const k = B.crest === 2 ? 1 : 0.75;
    g.fillStyle = B.crestColor || B.head;
    circle(g, -3, -10 * k, 6 * k); g.fill(); circle(g, 1, -11 * k, 5 * k); g.fill(); circle(g, -7, -8 * k, 4.5 * k); g.fill();
    g.strokeStyle = "rgba(90,80,60,.25)"; g.lineWidth = 0.8;
    circle(g, -3, -10 * k, 6 * k); g.stroke(); circle(g, 1, -11 * k, 5 * k); g.stroke();
  }
  g.fillStyle = B.bill;
  g.beginPath(); g.moveTo(6, -3.5); g.quadraticCurveTo(20, -3.5, 21.5, 1); g.quadraticCurveTo(20, 4.2 + c.beakOpen * 3, 6.5, 3.8); g.closePath(); g.fill();
  g.fillStyle = "rgba(0,0,0,.3)"; circle(g, 19, -0.6, 1.1); g.fill();
  drawEye(g, c, 3, -3, 0.9);
  drawAccessory(g, c, 10, 3, -3);
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
  if (B.back) { g.save(); ellipse(g, -4, by, 37, 19.5, -0.04); g.clip(); g.fillStyle = B.back; ellipse(g, -10, by - 14, 32, 11); g.fill(); g.restore(); }   // saddleback
  ellipse(g, -4, by, 37, 19.5, -0.04); g.lineWidth = 1.1; g.strokeStyle = "rgba(60,40,20,.15)"; g.stroke();
  // wings (swans hold theirs up a little, like sails)
  g.save(); g.translate(2, by - 8); g.rotate(-0.08 - (swan ? 0.22 : 0) - flap);
  g.fillStyle = B.wing; ellipse(g, -15, 1, 23, 10, -0.08); g.fill();
  if (B.wingTip) { g.fillStyle = B.wingTip; ellipse(g, -32, 4, 7, 3.2, 0.2); g.fill(); ellipse(g, -26, 7, 6, 2.8, 0.2); g.fill(); }
  g.strokeStyle = rgba(B.light, 0.5); g.lineWidth = 1.3; g.beginPath(); g.moveTo(-34, 3); g.quadraticCurveTo(-18, 9, 0, 4); g.stroke();
  if (B.curly) {           // Sebastopol geese have long curly feathers
    g.strokeStyle = rgba(B.light, 0.95); g.lineWidth = 1.6;
    for (let i = 0; i < (B.curly === 2 ? 7 : 4); i++) { g.beginPath(); g.arc(-32 + i * 5, 8 + (i % 2) * 2, 3.2, 0.2 * Math.PI, 1.6 * Math.PI); g.stroke(); }
  }
  g.restore();
  // the long neck
  let hx = swan ? 15 : 22, hy = by - (swan ? 54 : 46);
  if (c.sleep > 0.01) { hx = lerp(hx, -4, c.sleep); hy = lerp(hy, by - 14, c.sleep); }
  hx = lerp(hx, 36, c.headDown); hy = lerp(hy, by + (swim ? 6 : 22), c.headDown);
  hx = lerp(hx, -10, c.preen); hy = lerp(hy, by - 16, c.preen);
  hy -= c.headUp * 5;
  g.strokeStyle = B.neck || B.body; g.lineWidth = swan ? 9 : 11; g.lineCap = "round";
  g.beginPath(); g.moveTo(16, by - 6); g.quadraticCurveTo(swan ? 36 : 28, by - (swan ? 26 : 22), hx - 2, hy + 4); g.stroke();
  if (B.neckStripe) { g.strokeStyle = B.neckStripe; g.lineWidth = 3; g.beginPath(); g.moveTo(12, by - 8); g.quadraticCurveTo(23, by - 24, hx - 6, hy + 2); g.stroke(); }
  g.save(); g.translate(hx, hy);
  g.rotate(c.headDown * 0.8 - c.headUp * 0.3 + c.preen * 2.6 + (swan ? 0.25 : 0));
  const hg = g.createRadialGradient(2, -3, 1, 0, 0, 10); hg.addColorStop(0, B.light); hg.addColorStop(1, B.head || B.body);
  g.fillStyle = hg; circle(g, 0, 0, 8.5); g.fill();
  if (B.face) { g.fillStyle = B.face; ellipse(g, 3.5, 1, 4.5, 4); g.fill(); }
  g.fillStyle = B.bill;
  g.beginPath(); g.moveTo(5, -3); g.lineTo(18, -0.5); g.quadraticCurveTo(20, 1.5, 18, 3); g.lineTo(5, 4); g.closePath(); g.fill();
  if (B.knob) { const k = B.knobK || 1; g.fillStyle = B.knob; circle(g, 6, -3.5 - k, 3.2 * k + 0.6); g.fill(); ellipse(g, 5, 0.5, 2.5 * k, 3.2 * k); g.fill(); }
  if (B.dewlap) { g.fillStyle = B.dewlap; ellipse(g, 4, 8, 4.5, 5.5); g.fill(); }   // a floppy chin pouch
  if (B.band) { g.fillStyle = B.band; g.fillRect(14.5, -1.5, 2, 4.5); }
  drawEye(g, c, 1.5, -2.5, 0.85);
  drawAccessory(g, c, 8.5, 1.5, -2.5);
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
  if (B.breastSpots) { const Rb = seeded(c.id * 7 + 1); g.fillStyle = rgba(B.breastSpots, 0.8); for (let i = 0; i < 12; i++) { circle(g, 6 + Rb() * 12, by - 6 + Rb() * 12, 0.9); g.fill(); } }
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
    g.save(); g.translate(1, -6); g.rotate(0.35 + w); g.scale(B.plumeK || 1, B.plumeK || 1);
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
  drawAccessory(g, c, 6.8, 3, -1.4);
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
  if (B.pied) { g.fillStyle = "#F6F4EE"; ellipse(g, 12, by + 6, B.pied === 2 ? 30 : 14, B.pied === 2 ? 22 : 13); g.fill(); }   // pied: white chest
  g.fillStyle = B.dot || "rgba(0,0,0,0)";
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
  g.fillStyle = B.casque; g.beginPath(); g.moveTo(-3, -4); g.lineTo(0, -4 - 9 * (B.casqueK || 1)); g.lineTo(3, -4); g.closePath(); g.fill();
  g.fillStyle = B.face; circle(g, 0, 0, 6.2); g.fill();
  g.fillStyle = "#5E88C8"; ellipse(g, -1, 2, 3, 3.4); g.fill();
  g.fillStyle = B.wattle; ellipse(g, 4, 6.5, 1.8 * (B.wattleK || 1), 3 * (B.wattleK || 1)); g.fill();
  g.fillStyle = B.beak; g.beginPath(); g.moveTo(4.5, -1.5); g.lineTo(10, 0.5 - c.beakOpen); g.lineTo(4.5, 2.5); g.closePath(); g.fill();
  drawEye(g, c, 2, -1.5, 0.7);
  drawAccessory(g, c, 6.2, 2, -1.5);
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
  for (const [len0, w, ang] of [[62, 3.4, 0.02], [54, 3, 0.1], [46, 2.6, -0.06]]) {
    const len = len0 * (B.tailK || 1);   // girls have shorter tails; a Reeves's is enormous!
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
  g.strokeStyle = B.scallop ? rgba(B.scallop, 0.5) : "rgba(40,20,10,.35)"; g.lineWidth = 1;
  for (let row = 0; row < 4; row++) for (let x = -18 + (row % 2) * 3; x < 20; x += 6) { g.beginPath(); g.arc(x, by - 8 + row * 5, 2.6, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); }
  if (B.breast) { g.fillStyle = B.breast; ellipse(g, 16, by + 3, 12, 12); g.fill(); }
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
  if (B.mask) { g.save(); circle(g, 0, 0, 7.5); g.clip(); g.fillStyle = B.mask; g.fillRect(-8, -3, 16, 4.4); g.restore(); }
  if (B.ear) { g.fillStyle = B.ear; g.beginPath(); g.moveTo(-4, -5); g.lineTo(-2, -12); g.lineTo(0, -5); g.closePath(); g.fill(); }
  if (B.wattle) { g.fillStyle = B.wattle; ellipse(g, 3.5, 0, 4.5, 4.4); g.fill(); }
  g.fillStyle = B.beak; g.beginPath(); g.moveTo(5.5, -1); g.lineTo(11.5, 1 - c.beakOpen); g.lineTo(5.5, 3); g.closePath(); g.fill();
  drawEye(g, c, 3.2, -1.2, 0.7);
  drawAccessory(g, c, 7.5, 3.2, -1.2);
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
  g.fillStyle = rgba(B.sheen, B.sheenA == null ? 0.35 : B.sheenA); ellipse(g, 6, -10, 16, 8, -0.3); g.fill();
  g.save(); ellipse(g, 0, 0, 31, 24, -0.18); g.clip();
  g.strokeStyle = "rgba(230,200,150,.25)"; g.lineWidth = 1.2;
  for (let row = 0; row < 6; row++) for (let x = -26 + (row % 2) * 3; x < 28; x += 6) { g.beginPath(); g.arc(x, -16 + row * 6, 2.8, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); }
  if (B.palm) { g.strokeStyle = rgba(B.palm, 0.8); g.lineWidth = 2.2; for (let row = 0; row < 4; row++) { g.beginPath(); g.arc(0, -8 + row * 8, 30, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); } }   // royal palm stripes
  g.restore();
  g.restore();
  if (B.beard) {           // only toms have a beard
    g.strokeStyle = B.beard; g.lineWidth = 1.4;
    g.beginPath(); for (let i = 0; i < 5; i++) { g.moveTo(22 + i * 0.5, by - 4); g.lineTo(22 + i * 0.8, by + 8); } g.stroke();
  }
  g.save(); g.translate(0, by - 4); g.rotate(-0.1 - (isFlapping(c) ? Math.sin(now * 30) * 0.5 + 0.5 : 0) + fan * 0.25);
  g.fillStyle = B.wing; ellipse(g, -8, 2, 17, 9, -0.1); g.fill();
  if (B.wingBar) {
    g.strokeStyle = rgba(B.wingBar, 0.8); g.lineWidth = 1.4;
    for (let x = -20; x < 6; x += 5) { g.beginPath(); g.moveTo(x, -3); g.lineTo(x + 2, 8); g.stroke(); }
  }
  g.restore();
  let hx = lerp(22, 14, fan), hy = lerp(by - 34, by - 26, fan);
  hx = lerp(hx, 30, c.headDown); hy = lerp(hy, -8, c.headDown); hy -= c.headUp * 4;
  if (c.sleep > 0.01) { hx = lerp(hx, 10, c.sleep); hy = lerp(hy, by - 16, c.sleep); }
  g.strokeStyle = B.neck; g.lineWidth = 7; g.lineCap = "round";
  g.beginPath(); g.moveTo(16, by - 12); g.quadraticCurveTo(26, by - 22, hx - 1, hy + 3); g.stroke();
  g.save(); g.translate(hx, hy); g.rotate(c.headDown * 0.8 - c.headUp * 0.3);
  g.fillStyle = B.head; circle(g, 0, 0, 6.5); g.fill();
  if (fan > 0.05) { g.fillStyle = `rgba(216,48,58,${0.5 * fan})`; circle(g, 0, 1, 6.4); g.fill(); }   // blushing while showing off
  const sn = lerp(4, 9, fan) * (B.snoodK == null ? 1 : B.snoodK);
  g.fillStyle = B.wattle;
  g.beginPath(); g.moveTo(3, -4); g.quadraticCurveTo(9, -3, 8, sn); g.lineTo(6, sn); g.quadraticCurveTo(7, -1, 2, -2); g.closePath(); g.fill();   // the snood
  ellipse(g, 1, 7, 3.2, 5.5 * lerp(1, 1.3, fan)); g.fill();
  g.fillStyle = B.beak; g.beginPath(); g.moveTo(4.5, -1); g.lineTo(9.5, 1 - c.beakOpen); g.lineTo(4.5, 3); g.closePath(); g.fill();
  drawEye(g, c, 1.5, -2, 0.62);
  drawAccessory(g, c, 6.5, 1.5, -2);
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
  if (c.sit < 0.6) drawLegPair(g, c, now, { hips: [-3, 2], hipY: by + 8, color: B.legs, width: 2.6, stride: 10, lift: 6, web: true, knee: 5, dangle: 36, oneLeg: c.oneLeg > 0.5, kneeColor: B.knee });
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
  g.save(); g.translate(10, 9.5); const tk = (B.billTipK || 0.45) / 0.45; g.scale(tk, tk); g.translate(-10, -9.5);   // some kinds have more black on the bill
  g.fillStyle = B.billTip;
  g.beginPath(); g.moveTo(13, 4); g.quadraticCurveTo(13.5, 7, 11, 10); g.lineTo(9, 9.5); g.quadraticCurveTo(10.5, 7, 10.5, 4.5); g.closePath(); g.fill();
  g.restore();
  if (c.sleep > 0.5 || c.blink > 0) drawEye(g, c, 1.5, -1.5, 0.6);
  else { g.fillStyle = B.eye; circle(g, 1.5, -1.5, 1.8); g.fill(); g.fillStyle = "#1E1E22"; circle(g, 1.7, -1.5, 0.9); g.fill(); }
  drawAccessory(g, c, 6.5, 1.5, -1.5);
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
  if (fan > 0.03 && B.train) {
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
  if (fan < 0.95 && B.train) {     // the long train, folded and dragging behind
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
  if (!B.train) { g.fillStyle = B.back || B.body; ellipse(g, -26, by + 2, 14, 6, 0.3); g.fill(); }   // peahens have a short tail
  if (c.sit < 0.6) drawLegPair(g, c, now, { hips: [-4, 5], hipY: by + 13, color: B.legs, width: 3.2, stride: 7, lift: 4, dangle: 14 });
  const gr = g.createRadialGradient(6, by - 6, 2, -2, by, 26);
  gr.addColorStop(0, B.light); gr.addColorStop(0.6, B.body); gr.addColorStop(1, B.shade);
  g.fillStyle = gr; ellipse(g, -2, by, 22, 16, -0.2); g.fill();
  g.save(); ellipse(g, -2, by, 22, 16, -0.2); g.clip();
  g.fillStyle = B.back; ellipse(g, -14, by - 2, 14, 12); g.fill();
  if (B.pied) { g.fillStyle = B.pied; ellipse(g, 6, by + 4, 9, 7); g.fill(); ellipse(g, -8, by + 8, 6, 4); g.fill(); }   // pied: white patches
  g.restore();
  g.save(); g.translate(0, by - 3); g.rotate(-0.1 - (isFlapping(c) ? Math.sin(now * 30) * 0.5 + 0.5 : 0));
  g.fillStyle = B.wing; ellipse(g, -7, 1, 13, 7.5, -0.1); g.fill();
  if (B.wingBar) {
    g.strokeStyle = rgba(B.wingBar, 0.8); g.lineWidth = 1.2;
    for (let x = -17; x < 3; x += 4) { g.beginPath(); g.moveTo(x, -4); g.lineTo(x + 1, 6); g.stroke(); }
  }
  g.restore();
  let hx = 15, hy = by - 36;
  hx = lerp(hx, 24, c.headDown); hy = lerp(hy, -8, c.headDown); hy -= c.headUp * 4;
  if (c.sleep > 0.01) { hx = lerp(hx, 6, c.sleep); hy = lerp(hy, by - 16, c.sleep); }
  g.strokeStyle = B.neck; g.lineWidth = 8; g.lineCap = "round";
  g.beginPath(); g.moveTo(8, by - 8); g.lineTo(hx - 1, hy + 3); g.stroke();
  g.save(); g.translate(hx, hy); g.rotate(c.headDown * 0.8 - c.headUp * 0.3);
  g.strokeStyle = B.crest; g.fillStyle = B.crest; g.lineWidth = 0.9;
  // (green peafowl have a tall, narrow crest)
  for (let i = -2; i <= 2; i++) { const tall = B.crestTall ? 1.35 : 1, tx = i * (B.crestTall ? 1.2 : 2.4) - 1, ty = (-15 + Math.abs(i) * 0.8) * tall; g.beginPath(); g.moveTo(0, -5); g.lineTo(tx, ty); g.stroke(); circle(g, tx, ty, 1.6); g.fill(); }
  g.fillStyle = B.head; circle(g, 0, 0, 6.8); g.fill();
  if (!B.noStripes) {
    g.strokeStyle = "#FFFFFF"; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-1, -4); g.quadraticCurveTo(3, -5.5, 6, -3.5); g.moveTo(-1, 1.5); g.quadraticCurveTo(3, 3, 6, 1); g.stroke();
  }
  g.fillStyle = "#C9BBA8"; g.beginPath(); g.moveTo(5, -1); g.lineTo(10.5, 0.8 - c.beakOpen); g.lineTo(5, 2.6); g.closePath(); g.fill();
  drawEye(g, c, 2.2, -1.2, 0.65);
  drawAccessory(g, c, 6.8, 2.2, -1.2);
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
  if (weather.amount > 0.01) { g.globalCompositeOperation = "source-atop"; g.fillStyle = `rgba(70,80,100,${0.24 * weather.amount})`; g.fillRect(-100, -100, view.W + 200, view.H + 200); }
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
    g.save(); g.translate(p.x - w / 2 + 19, p.y - 7); drawEgg(g, last.breed, F.nestEggs.some((e) => e.golden), 10 / esz, last.egg); g.restore();
    g.fillStyle = "#2F2A24"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(label, p.x + 11, p.y - h / 2 + 1);
    badgeRect = { x: p.x - w / 2 - 8, y: p.y - h - 8, w: w + 16, h: h + 18 };
  }
  if (F.incubator.some((e) => eggReady(e) && !e.baby)) bubble(g, places.incubator, 72, 0, "🐣");
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
    g.save(); g.translate(p.x, p.y); drawEgg(g, e.breed, e.golden, 1.25, e.egg); g.restore();
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
    drawEgg(g, f.breed, f.golden, 11 / SPECIES[BREEDS[f.breed].species].egg[1], f.egg);
    g.restore();
  }
}

// ---------- Little pictures in the Market, the Map, and the name card ----------
function portraitBird(breed, sex) {
  const c = makeBird({ breed, growth: 1, sex: sex || (SHOW_MALES.has(kindOfBreed(breed)) ? "rooster" : "hen"), name: "Portrait" });
  c.portrait = true;
  nextId--;
  c.id = 3; c.dir = 1; c.state = "idle";
  if (SPECIES[BREEDS[breed].species].acts.display && isRooster(c)) c.fan = 1;   // show off that tail!
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
  const list = F.birds.filter((c) => c.loc === "yard" && c.state !== "enter" && c.state !== "exit" && !c.leaving).sort((a, b) => b.y - a.y);
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
  if (visitorHit(p)) return { kind: "visitor" };
  if (inBox(places.incubator, 38, 64, F.incubator.some((e) => eggReady(e) && !e.baby) ? 50 : 0)) return { kind: "incubator" };
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
    case "incubator": openIncubator(); break;
    case "visitor": tapVisitor(visitor); break;
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
  if (SP(c).acts.display && isRooster(c) && !isBaby(c) && INTERRUPTIBLE.has(c.state) && c.goal !== "lay" && c.goal !== "bed" && c.state !== "display") {
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
  F.nestEggs.forEach((e, i) => sendEggToBasket(from, e.breed, e.golden, -i * 0.09, p.x, p.y - 30, e.egg));
  F.nestEggs = [];
  save();
}
function collectYardEgg(e) {
  F.yardEggs = F.yardEggs.filter((x) => x !== e);
  const sc = scaleAt(e.y);
  sparkles(e.x, e.y, 14 * sc, 6, sc, e.golden ? "#FFE58A" : "#FFFFFF");
  sendEggToBasket(w2s(e.x, e.y - 12 * sc), e.breed, e.golden, 0, e.x, e.y, e.egg);
}
function collectNestEgg(e) {
  const p = nestEggPos(e);
  F.nestEggs = F.nestEggs.filter((x) => x !== e);
  sparkles(p.x, p.y, 14, 6, 1, e.golden ? "#FFE58A" : "#FFFFFF");
  sendEggToBasket(w2s(p.x, p.y - 14), e.breed, e.golden, 0, p.x, p.y, e.egg);
  dismissCoach("collect");
}
function sendEggToBasket(from, breed, golden, delay = 0, wx, wy, egg) {
  const r = basketEgg.getBoundingClientRect();
  const value = eggValueOf(breed, golden);
  game.eggs += value;
  game.stats.collected++;
  if (golden) game.stats.golden++;
  fx.flyers.push({ sx: from.x, sy: from.y, ex: r.left + r.width / 2, ey: r.top + r.height / 2, t: delay, dur: 0.72, breed, egg, golden, value, done: false });
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
  const waiting = FARM_ORDER.some((id) => id !== game.farm && farms[id].unlocked &&
    (farms[id].nestEggs.length + farms[id].yardEggs.length > 0 || farms[id].incubator.some(eggReady)));
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
for (const sheet of document.querySelectorAll(".sheet")) {
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
    marketNote.textContent = "Babies arrive at their own farm and grow up in a few minutes. Pick girls or boys: girls lay eggs, and boys are the dads!";
    const order = [game.farm, ...FARM_ORDER.filter((id) => id !== game.farm)];
    for (const id of order) {
      const st = farms[id], cap = capacityOf(id), n = birdCount(id), full = n >= cap;
      const head = el("div", "grid-head", FARMS[id].name);
      head.append(el("span", null, st.unlocked ? (full ? `Full · ${n} of ${cap}` : `${n} of ${cap} spots`) : `Unlock for ${FARMS[id].price} eggs`));
      marketGrid.append(head);
      if (st.unlocked) marketGrid.append(sexPicker(id));
      let lastGroup = null;
      for (const key of Object.keys(BREEDS)) {
        if (farmOfBreed(key) !== id || BREEDS[key].cross) continue;
        const sex = marketSex, kind = kindOfBreed(key);
        // Fancier chickens need a bigger coop first
        const tierLocked = id === "backyard" && (BREEDS[key].tier || 1) > farms.backyard.tier;
        const group = id === "backyard" ? `${COOP_TIERS[BREEDS[key].tier || 1].name} breeds` : KIND_TITLE[kind];
        if (group !== lastGroup) { lastGroup = group; marketGrid.append(el("div", "grid-sub", group + (tierLocked ? " 🔒" : ""))); }
        const B = BREEDS[key], S = SPECIES[B.species], t = el("div", "tile" + (st.unlocked && !tierLocked ? "" : " locked"));
        const cv = el("canvas", "portrait-sm");
        drawPortrait(cv, portraitBird(key, sex), 120, 96);
        const sub = el("div", "tile-sub");
        const dot = el("i", "egg-dot");
        dot.style.background = B.egg.color;
        sub.append(dot, document.createTextNode(S.eggValue > 1 ? `${B.egg.name} eggs · worth ${S.eggValue}` : `${B.egg.name} eggs`));
        if (sex === "rooster") { sub.textContent = ""; sub.append(document.createTextNode(`Dad of ${B.egg.name.toLowerCase()}-egg ${plural(babyWord(key))}`)); }
        t.append(cv, el("div", "tile-name", sex === "rooster" ? boyName(key) : B.name), sub);
        if (!st.unlocked) {
          const b = el("button", "buy unlock", "See the map");
          b.type = "button";
          b.addEventListener("click", openMap);
          t.append(b);
        } else if (tierLocked) {
          const b = el("button", "buy", "🔒 Bigger coop");
          b.type = "button"; b.disabled = true;
          b.setAttribute("aria-label", `Build the ${COOP_TIERS[B.tier].name} to unlock the ${B.name}`);
          t.append(b);
        } else {
          t.append(priceButton(B.price, `Buy a ${sex === "rooster" ? "boy" : "girl"} ${B.name} ${babyWord(key)} for ${B.price} eggs`, !full && game.eggs >= B.price, () => buyBird(key, sex)));
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
// The Girls / Boys switch in the Market
let marketSex = "hen";
function sexPicker(id) {
  const wrap = el("div", "sex-picker");
  const seg = el("div", "segmented small");
  const labels = id === "backyard" ? [["hen", "🐔 Hens"], ["rooster", "🐓 Roosters"]] : [["hen", "♀ Girls"], ["rooster", "♂ Boys"]];
  for (const [sex, label] of labels) {
    const b = el("button", "seg" + (marketSex === sex ? " on" : ""), label);
    b.type = "button";
    b.setAttribute("aria-pressed", String(marketSex === sex));
    b.addEventListener("click", () => { marketSex = sex; Sound.tick(); const y = marketGrid.scrollTop; renderMarket(); marketGrid.scrollTop = y; });
    seg.append(b);
  }
  const note = el("div", "sex-note"), f = mainFlock(id);
  if (f) {
    const W = KINDS[f.kind], dot = el("i", "flock-dot");
    dot.style.background = f.color;
    note.append(dot, document.createTextNode(`${KIND_TITLE[f.kind]}: ${f.males} ${f.males === 1 ? W.male : plural(W.male)}, ${f.females} ${f.females === 1 ? W.female : plural(W.female)}. ${f.label} Best: ${W.ideal}.`));
  }
  wrap.append(seg, note);
  return wrap;
}
// "Pekin Duck" + boy = "Pekin drake"
function boyName(key) {
  const B = BREEDS[key], W = KINDS[kindOfBreed(key)];
  if (/ Duck$/.test(B.name)) return B.name.replace(/ Duck$/, " drake");
  if (/ Goose$/.test(B.name)) return B.name.replace(/ Goose$/, " gander");
  return `${B.name} ${W.male}`;
}
function buyBird(key, sex = "hen") {
  const B = BREEDS[key], id = farmOfBreed(key), st = farms[id];
  if (!st.unlocked || game.eggs < B.price || birdCount(id) >= capacityOf(id)) return;
  if (id === "backyard" && (B.tier || 1) > farms.backyard.tier) return;
  spend(B.price);
  Sound.sparkle();
  const word = sex === "rooster" ? `boy ${babyWord(key)}` : babyWord(key);
  if (id === game.farm) {
    const c = places.coop, sc = scaleAt(c.y), geo = houseGeo();
    fx.crates.push({ x: clampX(c.x + (geo.halfW + 40 + rand(0, 50)) * sc), y: clampY(c.y + rand(46, 90) * sc), t: 0, breed: key, sex, opened: false });
    hideSheet();
    toast(scene === "yard" ? `A ${B.name} ${word} is here! ${SPECIES[B.species].icon}` : `A ${B.name} ${word} is waiting in the yard!`);
  } else {
    const c = addBirdToFarm(id, key, 0.12, sex);
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
  Fm.starter.forEach((key, i) => {   // a boy and some girls, so they can have babies
    const c = addBirdToFarm(id, key, 1, i === 0 && Fm.starter.length > 1 ? "rooster" : "hen");
    c.eggClock = rand(10, 30); c.needsSpot = true;
    game.maleGift[kindOfBreed(key)] = true;
  });
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
  for (const cr of fx.crates) if (!cr.opened) addBirdToFarm(game.farm, cr.breed, 0.12, cr.sex).needsSpot = true;
  fx.crates = []; fx.grains = []; fx.butterflies = []; fx.fireflies = []; fx.particles = []; fx.weather = [];
  visitor = null; hawk = null; fx.flyers.forEach((f) => { f.t = f.dur; });
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
  renderDress();
  renderGenes();
  resetRehome();
  nameClear.hidden = true;
  nameDone.hidden = true;
  updateCardText();
  showSheet(cardSheet);
  Sound.tick();
}
function updateCardText() {
  const c = cardBird;
  if (!c) return;
  const B = lookOf(c), S = SP(c), grown = c.growth >= 1, W = KINDS[kindOf(c)];
  const who = grown || (c.sexKnown && isRooster(c)) ? sexWord(c) : babyWord(c.breed);
  if (W.sterile) cardBreed.textContent = `${B.name} · a mule duck`;
  else if (isRooster(c) && (grown || c.sexKnown)) cardBreed.textContent = `${B.name} ${who}${grown ? " · a dad" : ""}`;
  else cardBreed.textContent = `${B.name} ${who} · lays ${B.egg.name.toLowerCase()} eggs`;
  const [mt, me] = moodText(c);
  cardMood.textContent = `${me} ${mt}`;
  if (c.growth < 1) {
    cardStats.textContent = `A baby ${babyWord(c.breed)}, growing up. ${Math.round(c.growth * 100)}% of the way to a grown-up ${S.adult}!`;
    growBar.hidden = false;
    growFill.style.width = `${Math.round(c.growth * 100)}%`;
  } else {
    if (W.sterile) cardStats.textContent = "Mule ducks are big and friendly, but they can't lay eggs or have babies";
    else if (isRooster(c)) {
      const s = flockStats(farmOfBreed(c.breed))[kindOf(c)], per = s && s.males ? Math.round(s.females / s.males) : 0;
      cardStats.textContent = W.pairs ? "Looks after his partner" : `Keeps watch over ${per} ${per === 1 ? W.female : plural(W.female)}`;
    } else cardStats.textContent = c.laid ? `Has laid ${c.laid} ${c.laid === 1 ? "egg" : "eggs"} on your farm` : "Hasn't laid an egg here yet";
    if (c.kids) cardStats.textContent += `. ${isRooster(c) ? "Dad" : "Mom"} of ${c.kids} ${c.kids === 1 ? "baby" : "babies"}!`;
    growBar.hidden = true;
  }
  if (c.mom && c.dad) cardStats.textContent += ` (Mom: ${c.mom} · Dad: ${c.dad})`;
}
// The genes this bird shows, and the ones it's secretly carrying
function renderGenes() {
  const box = $("cardGenes");
  box.textContent = "";
  if (!cardBird) return;
  const chips = geneChips(cardBird);
  if (!chips.length) { box.append(el("span", "gene-chip plain", "Plain wild genes")); return; }
  for (const ch of chips) box.append(el("span", "gene-chip" + (ch.shows ? "" : " carried"), ch.text));
}
// Renaming a bird. Tapping the name highlights it, so you can just type a
// new one. The × clears it. If you leave it empty, the old name comes back.
const nameClear = $("nameClear");
const nameDone = $("nameDone");
let nameBefore = "";
const cleanName = (v) => v.replace(/\s+/g, " ").trim().slice(0, 16);
nameInput.addEventListener("focus", () => {
  nameBefore = cardBird ? cardBird.name : "";
  cardSheet.classList.add("editing");
  nameClear.hidden = !nameInput.value;
  nameDone.hidden = false;
  setTimeout(() => { try { nameInput.setSelectionRange(0, nameInput.value.length); } catch (e) { /* fine */ } }, 30);
  followKeyboard();
});
nameInput.addEventListener("input", () => {
  nameClear.hidden = !nameInput.value;
  const v = cleanName(nameInput.value);
  if (cardBird && v) cardBird.name = v;
});
nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") nameInput.blur(); });
nameInput.addEventListener("blur", () => {
  if (cardBird) {
    cardBird.name = cleanName(nameInput.value) || nameBefore || cardBird.name;
    nameInput.value = cardBird.name;
    save();
  }
  cardSheet.classList.remove("editing");
  cardSheet.style.bottom = "";
  cardSheet.style.maxHeight = "";
  nameClear.hidden = true;
  nameDone.hidden = true;
  window.scrollTo(0, 0);
  if (resizePending) { resizePending = false; queueResize(); }
});
// pressing × shouldn't close the keyboard, so we stop the tap from stealing focus
nameClear.addEventListener("pointerdown", (e) => e.preventDefault());
nameClear.addEventListener("click", () => { nameInput.value = ""; nameClear.hidden = true; nameInput.focus(); });
nameDone.addEventListener("pointerdown", (e) => e.preventDefault());
nameDone.addEventListener("click", () => nameInput.blur());

// Keep the name card sitting right on top of the on-screen keyboard
function followKeyboard() {
  const vv = window.visualViewport;
  if (!vv || !cardSheet.classList.contains("editing")) return;
  const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  cardSheet.style.bottom = `${covered}px`;
  cardSheet.style.maxHeight = `${Math.max(150, vv.height - 12)}px`;
}
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", followKeyboard);
  window.visualViewport.addEventListener("scroll", followKeyboard);
}

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
    if (!H.incubator && H.treat && game.totalEggs >= 3 && F.birds.some((c) => c.growth >= 1) && game.eggs >= 1 && !isBedtime())
      return showCoach("incubator", "Try hatching an egg! Tap the incubator", at(places.incubator.x, places.incubator.y - 70 * scaleAt(places.incubator.y)));
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
  if (document.visibilityState === "visible") {
    if (started) { keepAwake(); Sound.unlock(); }
    lastFrame = performance.now();
    catchUpAfterBackground();
  } else {
    hiddenAt = Date.now();
    save();
  }
});
window.addEventListener("pagehide", () => save());


// How many days each kind of egg really takes to hatch
const INCUBATION_DAYS = { chicken: 21, duck: 28, goose: 30, quail: 17, guinea: 27, pheasant: 24, turkey: 28, flamingo: 28, peafowl: 28 };
for (const k in INCUBATION_DAYS) SPECIES[k].incubate = INCUBATION_DAYS[k];
BREEDS.muteSwan.incubate = 36; BREEDS.blackSwan.incubate = 36; BREEDS.california.incubate = 22; BREEDS.goldenPh.incubate = 23;
window.addEventListener("keydown", (e) => { if (e.key === "Escape" && candleEgg) closeCandle(); });
let stickerT = 1;

/* ================================================================
   19. HATCHING EGGS (the incubator)
   ================================================================
   Every farm has a little incubator: a warm box that keeps eggs cozy
   until they hatch. Put in an egg from one of your grown-up birds,
   wait for it to grow (each kind of egg takes its real number of
   days: 21 for chickens, 28 for ducks...), peek inside with a light
   ("candling"), then tap the egg to help the baby hatch!
*/
const INCUBATOR_SLOTS = 3;
const hatchSheet = $("hatch");
const hatchSlotsEl = $("hatchSlots");
const hatchPickEl = $("hatchPick");
const hatchNote = $("hatchNote");
const candleEl = $("candle");
const candleCanvas = $("candleCanvas");
const candleText = $("candleText");

const incubateDays = (breed) => BREEDS[breed].incubate || SPECIES[BREEDS[breed].species].incubate || 21;
const incubateSeconds = (breed) => incubateDays(breed) * SETTINGS.secondsPerIncubationDay;
const eggProgress = (e) => clamp((Date.now() - e.startedAt) / 1000 / incubateSeconds(e.breed));
const eggDay = (e) => Math.min(incubateDays(e.breed), Math.floor(eggProgress(e) * incubateDays(e.breed)) + 1);
const eggReady = (e) => eggProgress(e) >= 1;
const roomToHatch = () => capacity() - birdCount(game.farm) - F.incubator.filter((e) => !e.baby).length;

let slotViews = [];    // the picture + words for each incubator slot
let candleEgg = null;  // the egg you're peeking into

function openIncubator() {
  renderHatch();
  showSheet(hatchSheet);
  dismissCoach("incubator");
  Sound.tick();
}
function renderHatch() {
  const kinds = [...new Set(F.birds.filter((c) => c.growth >= 1 && !isRooster(c)).map((c) => c.breed))];
  // e.g. "Chicks take 21 days and ducklings take 28" (just like on a real farm)
  const seen = new Set(), parts = [];
  for (const k of kinds) {
    const words = `${babyWord(k)}s take ${incubateDays(k)} days`;
    if (!seen.has(words)) { seen.add(words); parts.push(words); }
  }
  const list = parts.slice(0, 3);
  const said = list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0] || "";
  hatchNote.textContent = `Eggs have to stay warm until they hatch.${said ? " " + said.charAt(0).toUpperCase() + said.slice(1) + "." : ""} Each day goes by in just a few seconds here. Babies get one copy of every gene from Mom and one from Dad!`;
  hatchSlotsEl.textContent = "";
  slotViews = [];
  for (let i = 0; i < INCUBATOR_SLOTS; i++) {
    const e = F.incubator[i];
    const card = el("div", "slot" + (e ? "" : " empty"));
    const cv = el("canvas", "slot-egg");
    const label = el("div", "slot-label");
    const bar = el("div", "slot-bar"), fill = el("span");
    bar.append(fill);
    const row = el("div", "slot-actions");
    card.append(cv, label, bar, row);
    if (e) {
      cv.addEventListener("click", () => tapSlotEgg(e));
      const look = el("button", "slot-btn", "🔦 Look inside");
      look.type = "button";
      look.addEventListener("click", () => openCandle(e));
      row.append(look);
    }
    hatchSlotsEl.append(card);
    slotViews.push({ e, cv, card, label, fill, row, idx: i });
  }
  renderPick();
  updateSlotText();
}
function updateSlotText() {
  for (const v of slotViews) {
    const e = v.e;
    if (!e) { v.label.textContent = "Empty"; continue; }
    const ready = eggReady(e) || e.baby;
    v.card.classList.toggle("ready", !!ready);
    v.fill.style.width = `${Math.round(eggProgress(e) * 100)}%`;
    if (e.baby) v.label.textContent = `Welcome, ${e.baby.name}! 🐣`;
    else if (ready) v.label.textContent = e.crack ? "Keep tapping!" : "Ready! Tap the egg to help";
    else v.label.textContent = `Day ${eggDay(e)} of ${incubateDays(e.breed)}`;
    v.row.hidden = !!ready;
  }
}
// Pick a mom and a dad, see what the babies might look like, then keep the egg warm
let hatchMom = null, hatchDad = null;
function chipRow(label, birds, chosen, onPick) {
  const row = el("div", "dad-row");
  row.append(el("span", "dad-label", label));
  const list = el("div", "chip-list");
  for (const b of birds) {
    const chip = el("button", "dad-chip" + (b === chosen ? " on" : ""));
    chip.type = "button";
    const dot = el("i", "egg-dot");
    dot.style.background = lookOf(b).body;
    chip.append(dot, document.createTextNode(b.name));
    chip.title = `${lookOf(b).name} ${sexWord(b)}`;
    chip.setAttribute("aria-pressed", String(b === chosen));
    chip.setAttribute("aria-label", `${b.name} the ${lookOf(b).name} ${sexWord(b)}`);
    chip.addEventListener("click", () => { onPick(b); Sound.tick(); renderPick(); });
    list.append(chip);
  }
  row.append(list);
  return row;
}
function renderPick() {
  hatchPickEl.textContent = "";
  const free = F.incubator.length < INCUBATOR_SLOTS, room = roomToHatch();
  const moms = F.birds.filter((c) => c.growth >= 1 && canLay(c));
  hatchPickEl.append(el("div", "pick-head", free ? "Pick a mom and a dad" : "All three spots are full"));
  if (!moms.length) { hatchPickEl.append(el("p", "pick-empty", "When your girls grow up, you can hatch their eggs here.")); return; }
  if (!moms.includes(hatchMom)) hatchMom = moms[0];
  hatchPickEl.append(chipRow("Mom", moms, hatchMom, (b) => { hatchMom = b; }));
  const mk = kindOf(hatchMom), W = KINDS[mk];
  const dads = F.birds.filter((c) => c.growth >= 1 && isRooster(c) && canMate(mk, kindOf(c)) !== "no");
  if (!dads.length) {
    hatchPickEl.append(el("p", "pick-empty", `${cap1(W.female)} eggs need a ${W.male} dad to hatch. Get a ${W.male} at the Market!`));
    return;
  }
  if (!dads.includes(hatchDad)) hatchDad = dads.find((d) => kindOf(d) === mk) || dads[0];
  hatchPickEl.append(chipRow("Dad", dads, hatchDad, (b) => { hatchDad = b; }));
  // What might hatch? We "pretend-hatch" 400 eggs to find out!
  const odds = hatchOdds(hatchMom, hatchDad), box = el("div", "odds");
  box.append(el("div", "odds-head", "What might hatch?"));
  if (odds.names.length) box.append(el("p", "odds-name", `${odds.names.length > 1 ? "Names" : "Name"}: ${odds.names.join(" · ")}`));
  for (const o of odds.list) {
    const r = el("div", "odds-row"), bar = el("span", "odds-bar"), fill = el("i");
    fill.style.width = `${o.pct}%`;
    bar.append(fill);
    r.append(el("span", "odds-pct", `${o.pct}%`), bar, el("span", "odds-label", o.label));
    box.append(r);
  }
  if (canMate(mk, kindOf(hatchDad)) === "mule") box.append(el("p", "odds-note", "🫏 A duck and a Muscovy make a \"mule\" duck. Mules can't have babies of their own."));
  if (odds.autosex) box.append(el("p", "odds-note", "🎀 You'll be able to tell the boys from the girls the day they hatch!"));
  hatchPickEl.append(box);
  if (room <= 0) hatchPickEl.append(el("p", "pick-empty", `There's no room in the ${houseName()} for another baby right now.`));
  const cost = eggValueOf(hatchMom.breed, false);
  const go = el("button", "pick-egg go");
  go.type = "button";
  const dot = el("i", "egg-dot");
  dot.style.background = eggLookOf(hatchMom).color;
  const price = el("span", "pick-cost");
  price.append(el("i", "egg-dot"), document.createTextNode(String(cost)));
  go.append(dot, el("span", "pick-name", `Keep ${hatchMom.name}'s egg warm`), price);
  go.setAttribute("aria-label", `Put ${hatchMom.name}'s egg in the incubator for ${cost} ${cost === 1 ? "egg" : "eggs"}`);
  go.disabled = !free || room <= 0 || game.eggs < cost;
  go.addEventListener("click", addToIncubator);
  hatchPickEl.append(go);
}
function addToIncubator() {
  const mom = hatchMom, dad = hatchDad;
  if (!mom || !dad || !F.birds.includes(mom) || !F.birds.includes(dad)) return;
  const cost = eggValueOf(mom.breed, false);
  if (F.incubator.length >= INCUBATOR_SLOTS || roomToHatch() <= 0 || game.eggs < cost) return;
  spend(cost);
  F.incubator.push({ breed: mom.breed, mom: parentRec(mom), dad: parentRec(dad), egg: eggLookOf(mom), startedAt: Date.now(), crack: 0, wobble: 0.8 });
  Sound.chime();
  renderHatch();
  save();
}
// Tapping an egg: a gentle wiggle, or (when it's ready) a crack!
function tapSlotEgg(e) {
  if (e.baby) return;
  if (!eggReady(e)) { e.wobble = 0.7; Sound.tick(); return; }
  e.crack = (e.crack || 0) + 1;
  e.wobble = 1;
  Sound.crack(e.crack);
  if (e.crack >= 3) hatchBaby(e);
  updateSlotText();
}
function hatchBaby(e) {
  const P = places.incubator, sc = scaleAt(P.y), mom = e.mom, dad = e.dad, kind = kindOfBreed(e.breed);
  const sex = Math.random() < 0.5 ? "rooster" : "hen";
  let breed = e.breed, cross = null, geno = null, sexKnown = false, hidden = false, mule = false;
  if (mom && dad && canMate(kindOfBreed(mom.breed), kindOfBreed(dad.breed)) === "mule") {
    mule = true; breed = "mulard";
    game.crossesSeen.Mulard = true;
  } else if (mom && dad) {
    // Mom and Dad each pass on one copy of every gene
    const momG = genoOfRec(mom), dadG = genoOfRec(dad);
    geno = inheritGenes(kind, momG, dadG, sex);
    const L = LOOKS[kind](geno, isMaleSex(sex));
    ({ breed, cross } = nameChick(kind, mom, dad, geno, sex, L));
    if (cross && NAMED_CROSSES.some((x) => x.name === cross)) game.crossesSeen[cross] = true;
    sexKnown = isAutosexing(kind, momG, dadG);
    hidden = showedHiddenGene(kind, momG, dadG, geno);
    if (sexKnown) game.stats.autosex = (game.stats.autosex || 0) + 1;
    if (hidden) game.stats.hidden = (game.stats.hidden || 0) + 1;
  }
  const c = makeBird({
    breed, geno, cross, sex, sexKnown,
    mom: mom && dad ? recName(mom) : null, dad: mom && dad ? recName(dad) : null,
    growth: 0.12, food: 0.95, water: 0.95, joy: 0.95, x: clampX(P.x + rand(40, 80) * sc), y: clampY(P.y + rand(16, 44) * sc),
  });
  c.tagT = 5; c.vz = 170 * sc; c.state = "idle"; c.t = 1.5;
  F.birds.push(c);
  for (const par of [mom, dad]) { const b = par && F.birds.find((x) => x.id === par.id); if (b) b.kids++; }
  e.baby = c;
  e.popAt = clock;
  game.stats.hatched++;
  Sound.call(c, panX(P.x));
  Sound.fanfare();
  confetti(P.x, P.y, 50 * sc, 24, sc);
  let msg = `Welcome, ${c.name}! A brand-new ${lookOf(c).name} ${babyWord(breed)} 🐣`;
  if (mule) msg = `Welcome, ${c.name}! A Mulard duckling 🐣 Mule ducks can't have babies of their own.`;
  else if (cross && NAMED_CROSSES.some((x) => x.name === cross)) msg = `Welcome, ${c.name}! It's ${/^[AEIOU]/.test(cross) ? "an" : "a"} ${cross}! 🐣`;
  if (sexKnown) msg += ` It's a ${isRooster(c) ? "boy" : "girl"}. You can tell by the fuzz!`;
  else if (hidden) msg += " It's showing a hidden gene! 🎁";
  toast(msg, 4200);
  save();
  const farm = F;   // remember which farm, in case you travel in the next second
  setTimeout(() => {
    farm.incubator = farm.incubator.filter((x) => x !== e);
    if (openSheet === hatchSheet && farm === F) renderHatch();
    save();
  }, 1800);
}
function updateIncubators(dt) {
  for (const e of F.incubator) if (e.wobble > 0) e.wobble = Math.max(0, e.wobble - dt * 1.5);
}

// ---------- Drawing an egg in its incubator spot ----------
function drawHatchSlots() {
  for (const v of slotViews) drawSlotEgg(v);
}
function drawSlotEgg(v) {
  const { g, dpr } = prepCanvas(v.cv, 150, 120);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const e = v.e;
  if (e) glow(g, 75, 78, 80, "rgba(255,180,90,.5)");            // the warm lamp
  g.fillStyle = "#E9C872"; ellipse(g, 75, 106, 50, 11); g.fill();  // straw
  g.strokeStyle = "#D4AC4E"; g.lineWidth = 1.6; g.lineCap = "round";
  for (let i = 0; i < 12; i++) { const x = 32 + i * 7.5; g.beginPath(); g.moveTo(x, 106); g.lineTo(x + (i % 2 ? 6 : -6), 99 - (i % 3) * 2); g.stroke(); }
  if (!e) {       // an empty spot: a dotted outline of an egg
    g.save(); g.translate(75, 104); g.setLineDash([5, 5]); eggPath(g, 22, 30);
    g.strokeStyle = "rgba(120,100,70,.4)"; g.lineWidth = 2; g.stroke(); g.restore();
    return;
  }
  const sz = SPECIES[BREEDS[e.breed].species].egg, k = 30 / sz[1];
  if (e.baby) {   // POP! The shell falls apart and the baby appears
    const t = clock - e.popAt;
    g.save(); g.translate(75, 104);
    for (const side of [-1, 1]) {
      g.save(); g.translate(side * (8 + t * 60), -30 + t * t * 140); g.rotate(side * t * 3);
      g.fillStyle = (e.egg || BREEDS[e.breed].egg).color;
      g.beginPath(); g.moveTo(-sz[0] * k * 0.5 * side, 0); g.lineTo(sz[0] * k * side * 0.5, -6); g.lineTo(sz[0] * k * side * 0.5, 8); g.closePath(); g.fill();
      g.restore();
    }
    const pop = easeOut(clamp(t / 0.4));
    g.scale(2.2 * pop, 2.2 * pop);
    drawBaby(g, Object.assign({}, e.baby, { dir: 1, z: 0, moving: false, headUp: 0.4 }), clock);
    g.restore();
    return;
  }
  const ready = eggReady(e);
  const rock = ready ? Math.sin(clock * 9) * 0.1 * (Math.sin(clock * 1.7) > 0.2 ? 1 : 0) : Math.sin(clock * 0.8 + v.idx) * 0.05;
  const wob = e.wobble > 0 ? Math.sin(clock * 34) * 0.16 * e.wobble : 0;
  g.save();
  g.translate(75, 104);
  g.rotate(rock + wob);
  drawEgg(g, e.breed, false, k, e.egg);
  const rx = sz[0] * k, ry = sz[1] * k;
  // cracks
  g.strokeStyle = "rgba(60,40,20,.8)"; g.lineWidth = 1.6; g.lineJoin = "round";
  if (e.crack >= 1) { g.beginPath(); g.moveTo(-rx * 0.8, -ry * 1.15); g.lineTo(-rx * 0.4, -ry * 1.25); g.lineTo(-rx * 0.1, -ry * 1.1); g.lineTo(rx * 0.25, -ry * 1.28); g.stroke(); }
  if (e.crack >= 2) {
    g.beginPath(); g.moveTo(rx * 0.25, -ry * 1.28); g.lineTo(rx * 0.55, -ry * 1.12); g.lineTo(rx * 0.85, -ry * 1.22); g.stroke();
    g.fillStyle = "#2A1D16"; ellipse(g, rx * 0.1, -ry * 1.3, rx * 0.22, ry * 0.12); g.fill();       // a little hole...
    g.fillStyle = "#F2B24A"; g.beginPath(); g.moveTo(rx * 0.02, -ry * 1.34); g.lineTo(rx * 0.28, -ry * 1.3); g.lineTo(rx * 0.04, -ry * 1.24); g.closePath(); g.fill(); // ...and a tiny beak!
  }
  g.restore();
  if (ready && !e.crack) { g.fillStyle = `rgba(255,236,160,${0.6 + 0.4 * Math.sin(clock * 5)})`; drawStar(g, 108, 36, 8); drawStar(g, 44, 50, 5); }
}

// ---------- Candling: shine a light through the egg to see inside ----------
const CANDLE_WORDS = [
  "Tiny red veins are spreading out. The heart is already beating!",
  "See the dark spot? That's the baby, and its little eye!",
  "The baby fills most of the egg now. Watch it wiggle!",
  "Almost ready! The baby is getting set to peck its way out.",
];
function candleStage(p) { return p < 0.25 ? 0 : p < 0.55 ? 1 : p < 0.85 ? 2 : 3; }
function openCandle(e) {
  candleEgg = e;
  candleEl.hidden = false;
  updateCandleText();
  Sound.tick();
}
function closeCandle() { candleEgg = null; candleEl.hidden = true; }
function updateCandleText() {
  if (!candleEgg) return;
  const e = candleEgg;
  candleText.textContent = `Day ${eggDay(e)} of ${incubateDays(e.breed)}. ${CANDLE_WORDS[candleStage(eggProgress(e))]}`;
}
$("candleDone").addEventListener("click", closeCandle);
candleEl.addEventListener("click", (ev) => { if (ev.target === candleEl) closeCandle(); });
function drawCandle() {
  if (!candleEgg) return;
  const { g, dpr } = prepCanvas(candleCanvas, 240, 280);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const e = candleEgg, p = eggProgress(e), st = candleStage(p);
  const sz = SPECIES[BREEDS[e.breed].species].egg, k = 108 / sz[1], rx = sz[0] * k, ry = sz[1] * k;
  const beat = 1 + 0.18 * Math.max(0, Math.sin(clock * 8));
  glow(g, 120, 262, 170, "rgba(255,170,70,.4)");
  g.save();
  g.translate(120, 262);
  eggPath(g, rx, ry);
  g.save();
  g.clip();
  const gr = g.createRadialGradient(0, -ry * 0.7, 6, 0, -ry * 0.9, ry * 1.3);
  gr.addColorStop(0, "#FFE9B8"); gr.addColorStop(0.55, "#F7A94A"); gr.addColorStop(1, "#B8581C");
  g.fillStyle = gr; g.fillRect(-rx - 4, -ry * 2 - 4, rx * 2 + 8, ry * 2 + 8);
  g.fillStyle = "rgba(255,248,225,.55)";                     // the air pocket at the top
  ellipse(g, 0, -ry * 1.86, rx * 0.72, ry * 0.2); g.fill();
  const cx = 0, cy = -ry * 0.95;
  g.strokeStyle = `rgba(170,30,25,${st === 3 ? 0.25 : 0.55})`; g.lineWidth = 2; g.lineCap = "round";
  const R = seeded(7);
  for (let i = 0; i < 10; i++) {                             // veins
    const a = (i / 10) * TAU + R() * 0.3, len = ry * (0.5 + R() * 0.35) * clamp(0.4 + p * 2);
    g.beginPath(); g.moveTo(cx, cy);
    g.quadraticCurveTo(cx + Math.cos(a + 0.5) * len * 0.5, cy + Math.sin(a + 0.5) * len * 0.5, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    g.stroke();
  }
  g.fillStyle = "rgba(60,25,10,.85)";                        // the baby
  if (st === 0) { g.fillStyle = "#C8261E"; circle(g, cx, cy, 5 * beat); g.fill(); }
  else if (st === 1) { circle(g, cx, cy, 18); g.fill(); g.fillStyle = "rgba(20,8,4,.9)"; circle(g, cx + 6, cy - 4, 4); g.fill(); }
  else if (st === 2) { ellipse(g, cx, cy, rx * 0.5, ry * 0.5, 0.4); g.fill(); g.fillStyle = "rgba(20,8,4,.9)"; circle(g, cx + rx * 0.2, cy - ry * 0.2, 6); g.fill(); }
  else {
    ellipse(g, cx, cy + ry * 0.05, rx * 0.8, ry * 0.78, 0.3); g.fill();
    g.fillStyle = "rgba(20,8,4,.9)"; circle(g, cx + rx * 0.25, cy - ry * 0.35, 7); g.fill();
    g.beginPath(); g.moveTo(cx + rx * 0.45, cy - ry * 0.4); g.lineTo(cx + rx * 0.62, cy - ry * 0.34); g.lineTo(cx + rx * 0.45, cy - ry * 0.28); g.closePath(); g.fill();
  }
  if (st >= 1) { g.fillStyle = `rgba(200,30,25,${0.7 * (beat - 1) / 0.18})`; circle(g, cx - 4, cy + 10, 4); g.fill(); }  // heartbeat
  g.restore();
  g.lineWidth = 3; g.strokeStyle = "rgba(255,236,190,.7)"; eggPath(g, rx, ry); g.stroke();
  g.restore();
}

// ---------- The incubator out on the farm ----------
function drawIncubator(g) {
  const eggs = F.incubator, warm = eggs.length > 0;
  g.fillStyle = "#8A5A36"; roundRect(g, -30, -20, 60, 20, 5); g.fill();                 // wooden base
  g.fillStyle = "#A87447"; roundRect(g, -30, -20, 60, 6, 3); g.fill();
  g.fillStyle = "#E9C872"; ellipse(g, 0, -20, 26, 5); g.fill();                         // straw
  eggs.slice(0, 3).forEach((e, i) => {
    const sz = SPECIES[BREEDS[e.breed].species].egg[1];
    g.save(); g.translate((i - 1) * 14, -18);
    g.rotate(eggReady(e) ? Math.sin(clock * 9 + i) * 0.12 : Math.sin(clock * 0.8 + i) * 0.06);
    drawEgg(g, e.breed, false, 8 / sz, e.egg); g.restore();
  });
  // glass dome
  g.fillStyle = warm ? "rgba(255,214,150,.3)" : "rgba(220,238,250,.35)";
  g.beginPath(); g.ellipse(0, -20, 28, 30, 0, Math.PI, 0); g.closePath(); g.fill();
  g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 2;
  g.beginPath(); g.ellipse(0, -20, 28, 30, 0, Math.PI, 0); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 2.5;
  g.beginPath(); g.arc(0, -20, 20, Math.PI * 1.15, Math.PI * 1.45); g.stroke();
  // the little heat lamp on top
  g.fillStyle = "#6E6A66"; g.fillRect(-2, -56, 4, 8);
  g.fillStyle = warm ? "#FF7A3A" : "#B9B2AA"; ellipse(g, 0, -58, 8, 5); g.fill();
  if (warm) { g.save(); g.globalCompositeOperation = "lighter"; glow(g, 0, -30, 34, "rgba(255,150,70,.35)"); g.restore(); }
}


/* ================================================================
   20. THE STICKER BOOK
   ================================================================
   Every kind of bird you raise earns a sticker with a true fact about
   it. There are special stickers too, for things like your first
   hatch or spotting a rainbow.
*/
const FACTS = {
  rir: "The Rhode Island Red is the official state bird of Rhode Island!",
  buff: "Buff Orpingtons are so gentle, people call them the golden retrievers of chickens.",
  barred: "Barred Rock chicks are black with a little white spot on top of their heads.",
  leghorn: "A White Leghorn can lay about 280 eggs in a year. That's almost one a day!",
  australorp: "A Black Australorp once laid 364 eggs in 365 days!",
  wyandotte: "Every Wyandotte feather is outlined in black, like someone drew it with a pen.",
  sussex: "Speckled Sussex get MORE white speckles every time they grow new feathers.",
  cochin: "Cochins have fluffy feathers all the way down their feet, like fuzzy slippers.",
  easter: "Easter Eggers lay blue or green eggs, and the color goes all the way through the shell!",
  polish: "Polish chickens have such big pom-poms that they can't see very well above them.",
  marans: "Marans lay some of the darkest eggs of any chicken, as brown as chocolate.",
  olive: "Olive Eggers get their green eggs from a blue-egg parent and a dark-brown-egg parent.",
  silkie: "Silkies have black skin, fur-like feathers, and five toes instead of four!",
  pekin: "Pekin ducks came from China, and they're the most common farm duck in America.",
  mallard: "Almost every farm duck in the world comes from wild Mallards.",
  runner: "Indian Runners can't fly, so they run everywhere standing straight up!",
  swedish: "Swedish Blue ducks wear a white bib on their chest.",
  call: "Call ducks are tiny but LOUD. Hunters used them to call wild ducks.",
  embden: "Geese make great guards. They honk loudly when strangers come near!",
  muteSwan: "Mute swans aren't really quiet. They hiss, snort and grunt!",
  blackSwan: "Black swans come from Australia, and their babies are fluffy and gray.",
  coturnix: "Quail eggs are so small that five of them weigh about the same as one chicken egg.",
  california: "The California Quail is the state bird of California. Look at that bouncy topknot!",
  guinea: "Guinea fowl love eating bugs and ticks, and they shout when anything surprises them.",
  ringneck: "Boy pheasants are colorful, but girl pheasants are brown so they can hide in the grass.",
  goldenPh: "Golden Pheasants come from the mountain forests of China.",
  turkey: "A turkey's head can turn red, white or blue when it gets excited!",
  flamingo: "Flamingos are pink from the shrimp and algae they eat. Their babies are gray!",
  peacock: "Only the boys are peacocks. Girls are peahens, and the babies are peachicks!",
  whitePeacock: "White peacocks aren't albinos. Their feathers just have no color at all.",
};

const SPECIAL_STICKERS = [
  { id: "firstEgg", emoji: "🥚", name: "First Egg", how: "Collect your very first egg", done: () => game.stats.collected >= 1 },
  { id: "hatch", emoji: "🐣", name: "First Hatch", how: "Hatch an egg in the incubator", done: () => game.stats.hatched >= 1 },
  { id: "golden", emoji: "✨", name: "Golden Egg", how: "Find a golden egg", done: () => game.stats.golden >= 1 },
  { id: "fashion", emoji: "🎀", name: "Fashion Show", how: "Dress up one of your birds", done: () => game.stats.dressed >= 1 },
  { id: "rainbow", emoji: "🌈", name: "Rainbow Chaser", how: "See a rainbow after the rain", done: () => game.stats.rainbows >= 1 },
  { id: "friend", emoji: "🐈", name: "Farm Friend", how: "Say hi to a visiting animal", done: () => game.stats.visitors >= 1 },
  { id: "eggs100", emoji: "💯", name: "Egg Champion", how: "Collect 100 eggs", done: () => game.stats.collected >= 100 },
  { id: "seasons", emoji: "❄️", name: "All Year Round", how: "Play through all four seasons", done: () => Object.keys(game.stats.seasons).length >= 4 },
  { id: "explorer", emoji: "🗺️", name: "Explorer", how: "Unlock all four farms", done: () => FARM_ORDER.every((id) => farms[id].unlocked) },
  { id: "palace", emoji: "👑", name: "Palace Builder", how: "Build the Chicken Palace", done: () => farms.backyard.tier >= 3 },
];

const bookSheet = $("book");
const bookGrid = $("bookGrid");
const bookCount = $("bookCount");
const bookBtn = $("bookBtn");

// Award any stickers you've earned. The first time the game loads, it
// quietly gives you stickers for the birds you already have.
function checkStickers(quiet) {
  let fresh = null;
  for (const id of FARM_ORDER) for (const c of farms[id].birds) {
    if (!BREEDS[c.breed].cross && !game.stickers[c.breed]) { game.stickers[c.breed] = true; fresh = fresh || BREEDS[c.breed].name; }
  }
  for (const s of SPECIAL_STICKERS) {
    if (!game.special[s.id] && s.done()) { game.special[s.id] = true; fresh = fresh || s.name; }
  }
  if (fresh && !quiet) {
    game.bookNew = true;
    bookBtn.classList.add("new");
    bookBtn.classList.remove("wiggle"); void bookBtn.offsetWidth; bookBtn.classList.add("wiggle");
    Sound.sparkle();
    toast(`🌟 New sticker: ${fresh}! Look in your Sticker Book`, 2800);
    save();
  }
}
function openBook() {
  setBookTab(bookTab);
  showSheet(bookSheet);
  bookGrid.scrollTop = 0;
  game.bookNew = false;
  bookBtn.classList.remove("new");
  Sound.tick();
}
function renderBook() {
  bookGrid.textContent = "";
  const keys = Object.keys(BREEDS).filter((k) => !BREEDS[k].cross);
  const specials = SPECIAL_STICKERS.filter((s) => !s.id.startsWith("g_") && !s.id.startsWith("x_"));
  const genes = SPECIAL_STICKERS.filter((s) => s.id.startsWith("g_"));
  const crosses = SPECIAL_STICKERS.filter((s) => s.id.startsWith("x_"));
  const got = keys.filter((k) => game.stickers[k]).length + SPECIAL_STICKERS.filter((s) => game.special[s.id]).length;
  bookCount.textContent = `${got} of ${keys.length + SPECIAL_STICKERS.length}`;
  const head = (text, list, have) => {
    const h = el("div", "grid-head", text);
    h.append(el("span", null, `${list.filter(have).length} of ${list.length}`));
    bookGrid.append(h);
  };
  const emojiSticker = (s) => {
    const have = !!game.special[s.id];
    const t = el("div", "sticker" + (have ? "" : " missing"));
    t.append(el("div", "sticker-emoji", s.emoji), el("div", "sticker-name", s.name), el("div", "sticker-fact", have && s.fact ? s.fact : s.how));
    bookGrid.append(t);
  };
  head("Special stickers", specials, (s) => game.special[s.id]);
  specials.forEach(emojiSticker);
  for (const id of FARM_ORDER) {
    const breeds = keys.filter((k) => farmOfBreed(k) === id);
    head(`${FARMS[id].emoji} ${FARMS[id].name}`, breeds, (k) => game.stickers[k]);
    for (const k of breeds) {
      const have = !!game.stickers[k];
      const t = el("div", "sticker" + (have ? "" : " missing"));
      const cv = el("canvas", "portrait-sm");
      drawPortrait(cv, portraitBird(k), 120, 96);
      t.append(cv, el("div", "sticker-name", BREEDS[k].name), el("div", "sticker-fact", have ? FACTS[k] || "" : "Raise one to earn this sticker"));
      bookGrid.append(t);
    }
  }
  head("🧬 Genes", genes, (s) => game.special[s.id]);
  genes.forEach(emojiSticker);
  head("🥚 Famous crosses", crosses, (s) => game.special[s.id]);
  crosses.forEach(emojiSticker);
}
bookBtn.addEventListener("click", () => { Sound.unlock(); if (!started) begin(); openBook(); });


/* ================================================================
   21. DRESS-UP
   ================================================================
   Hats, bows and sunglasses! Each bird's drawing calls drawAccessory
   while it's drawing the head, so the hat moves along when the bird
   pecks, sings or looks around.
*/
const HATS = [
  { id: null, label: "No hat", text: "None" },
  { id: "bow", label: "Bow", emoji: "🎀" },
  { id: "tophat", label: "Top hat", emoji: "🎩" },
  { id: "crown", label: "Crown", emoji: "👑" },
  { id: "flower", label: "Flower", emoji: "🌸" },
  { id: "party", label: "Party hat", emoji: "🎉" },
  { id: "shades", label: "Sunglasses", emoji: "🕶️" },
];
const dressRow = $("dressRow");

// r = the head's size; (ex, ey) = where the eye is, in the head's own measurements
function drawAccessory(g, c, r, ex, ey) {
  const h = c.hat;
  if (!h) return;
  const put = (emoji, x, y, size, rot) => {
    const s = emojiSprite(emoji, size * 3);
    g.save(); g.translate(x, y); if (rot) g.rotate(rot);
    g.drawImage(s, -size * 0.625, -size * 0.625, size * 1.25, size * 1.25);
    g.restore();
  };
  switch (h) {
    case "tophat": put("🎩", 0, -r * 1.3, r * 2.1, -0.08); break;
    case "crown": put("👑", 0, -r * 1.2, r * 1.8, 0); break;
    case "bow": put("🎀", -r * 0.55, -r * 0.8, r * 1.4, -0.3); break;
    case "flower": put("🌸", -r * 0.45, -r * 0.9, r * 1.25, 0); break;
    case "shades": put("🕶️", ex + r * 0.12, ey + r * 0.05, r * 1.35, 0); break;
    case "party": {       // a striped paper party hat with a pom-pom
      g.save(); g.translate(0, -r * 0.85); g.rotate(-0.15);
      g.beginPath(); g.moveTo(-r * 0.62, 0); g.lineTo(0, -r * 1.9); g.lineTo(r * 0.62, 0); g.closePath();
      g.fillStyle = "#7FB8FF"; g.fill();
      g.save(); g.clip();
      g.fillStyle = "#FF7EB6";
      for (let y = -r * 0.35; y > -r * 1.9; y -= r * 0.55) g.fillRect(-r, y, r * 2, r * 0.22);
      g.restore();
      g.fillStyle = "#F2C14E"; circle(g, 0, -r * 1.9, r * 0.3); g.fill();
      g.restore();
      break;
    }
  }
}
function renderDress() {
  dressRow.textContent = "";
  if (!cardBird) return;
  for (const h of HATS) {
    const b = el("button", "dress-btn" + (h.id ? "" : " none") + (cardBird.hat === h.id || (!cardBird.hat && !h.id) ? " on" : ""), h.emoji || h.text);
    b.type = "button";
    b.setAttribute("aria-label", h.label);
    b.setAttribute("aria-pressed", String(cardBird.hat === h.id));
    b.addEventListener("click", () => {
      const c = cardBird;
      if (!c) return;
      c.hat = h.id;
      if (h.id) {
        game.stats.dressed++;
        Sound.sparkle();
        if (c.loc === "yard" && scene === "yard") { const sc = scaleAt(c.y); sparkles(c.x, c.y, headH(c) * sc, 6, sc); }
      } else Sound.tick();
      renderDress();
      save();
    });
    dressRow.append(b);
  }
}


/* ================================================================
   22. SEASONS & WEATHER
   ================================================================
   Every few game days the season changes: spring blossoms, summer,
   fall leaves, and winter snow. (It's always summer at the lagoon!)
   Sometimes it rains: chickens run for cover, ducks love it, and when
   the rain stops there might be a rainbow.
*/
const SEASONS = [
  { id: "spring", name: "Spring", msg: "🌸 Spring is here! Everything is blooming" },
  { id: "summer", name: "Summer", msg: "☀️ Summer is here! Long sunny days" },
  { id: "fall",   name: "Fall",   msg: "🍂 Fall is here! The leaves are changing" },
  { id: "winter", name: "Winter", msg: "❄️ Winter is here! Bundle up, birds" },
];
const DAYS_PER_SEASON = 3;
const seasonIndex = (day = game.day) => Math.floor((day - 1) / DAYS_PER_SEASON) % 4;
const seasonOf = (id = game.farm) => (id === "lagoon" ? "summer" : SEASONS[seasonIndex()].id);

function mixHex(a, b, t) {
  const A = rgb(a), B = rgb(b), h = (v) => Math.round(v).toString(16).padStart(2, "0");
  return "#" + h(lerp(A[0], B[0], t)) + h(lerp(A[1], B[1], t)) + h(lerp(A[2], B[2], t));
}
// The farm's colors, changed a little for the season
function seasonalScenery(id) {
  const base = SCENERY[id], s = seasonOf(id), out = Object.assign({}, base);
  const tint = (list, to, t) => list.map((c, i) => mixHex(c, Array.isArray(to) ? to[i % to.length] : to, t));
  if (s === "spring") {
    out.g = tint(base.g, "#B8E07A", 0.18);
    out.flowers = ["#FFFFFF", "#FFD1E3", "#F7A8C4", "#FFF3A6"];
    out.flowerCount = Math.round(base.flowerCount * 1.6);
  } else if (s === "fall") {
    out.g = tint(base.g, ["#D9C063", "#C9A64A", "#A8863A"], 0.42);
    out.tuft = tint(base.tuft, "#B89A4A", 0.4);
    out.hill1 = mixHex(base.hill1, "#D8B070", 0.35);
    out.hill2 = mixHex(base.hill2, "#C99A58", 0.35);
    out.trees = mixHex(base.trees, "#D9822B", 0.6);
    out.treeHi = mixHex(base.treeHi, "#F2B84A", 0.6);
    out.flowers = ["#F28A2E", "#E0B040", "#C8452D"];
    out.flowerCount = Math.round(base.flowerCount * 0.4);
  } else if (s === "winter") {
    out.g = tint(base.g, ["#F4F7FA", "#E6EEF3", "#D5E0E8"], 0.85);
    out.tuft = tint(base.tuft, "#C8D4DC", 0.65);
    out.hill1 = mixHex(base.hill1, "#EEF3F7", 0.78);
    out.hill2 = mixHex(base.hill2, "#E4ECF2", 0.72);
    out.trees = mixHex(base.trees, "#DDE6EC", 0.6);
    out.treeHi = "#FFFFFF";
    out.dirt = mixHex(base.dirt, "#E2E9EE", 0.6);
    out.flowerCount = 0;
    if (base.water) out.water = Object.assign({}, base.water, { shallow: mixHex(base.water.shallow, "#DCEBF4", 0.45) });
  }
  return out;
}

// ---------- Weather ----------
const weather = { kind: "clear", left: 0, next: rand(80, 160), amount: 0, rainbow: 0 };
const weatherNow = () => {
  if (weather.left <= 0) return "clear";
  if (weather.kind === "snow" && seasonOf() !== "winter") return "rain";   // no snow at the lagoon
  return weather.kind;
};
const isRaining = () => weatherNow() === "rain" && weather.amount > 0.4;
function updateWeather(dt) {
  const w = weather;
  if (w.left > 0) {
    w.left -= dt;
    if (w.left <= 0 && w.kind === "rain" && darkness() < 0.3 && scene === "yard") {
      w.rainbow = 45;
      game.stats.rainbows++;
      if (started) toast("🌈 Look, a rainbow!", 2600);
    }
  } else {
    w.next -= dt;
    if (w.next <= 0) {
      w.next = rand(110, 240);
      if (Math.random() < 0.35) {
        w.kind = seasonIndex() === 3 ? "snow" : "rain";
        w.left = rand(45, 100);
        if (started) toast(w.kind === "snow" ? "❄️ It's snowing!" : "🌧️ Here comes the rain!", 2200);
      }
    }
  }
  const now = weatherNow();
  w.amount += ((now === "clear" ? 0 : 1) - w.amount) * Math.min(1, dt * 0.5);
  if (w.rainbow > 0) w.rainbow -= dt;
  Sound.setRain(now === "rain" && scene === "yard" ? w.amount : scene === "coop" && now === "rain" ? w.amount * 0.4 : 0);
  if (scene !== "yard" || reduceMotion) return;
  spawnWeather(now, dt);
  for (const p of fx.weather) {
    p.life -= dt;
    if (p.landed) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === "leaf" || p.kind === "petal" || p.kind === "snow") { p.vx += Math.sin(clock * 2 + p.ph) * 12 * dt; p.rot += p.vr * dt; }
    if (p.y >= p.ground) {
      p.y = p.ground;
      if (p.kind === "rain") { p.life = 0; if (inWaterPt(p.x, p.y)) fx.weather.push({ kind: "ripple", x: p.x, y: p.y, life: 0.8, max: 0.8 }); }
      else { p.landed = true; p.life = Math.min(p.life, p.kind === "snow" ? 2.5 : 4); }
    }
  }
  fx.weather = fx.weather.filter((p) => p.life > 0);
}
function spawnWeather(kind, dt) {
  if (fx.weather.length > 220) return;
  const drop = (k, extra) => {
    const ground = rand(groundTop(), view.H + 10);
    fx.weather.push(Object.assign({ kind: k, x: rand(-40, view.W + 40), y: rand(-40, view.horizon), vx: 0, vy: 0, life: 12, ground, rot: rand(TAU), vr: rand(-3, 3), ph: rand(TAU), landed: false }, extra));
  };
  if (kind === "rain") { const n = Math.floor(weather.amount * 110 * dt + Math.random()); for (let i = 0; i < n; i++) drop("rain", { vx: -60, vy: rand(820, 980) }); }
  if (kind === "snow") { const n = Math.floor(weather.amount * 22 * dt + Math.random()); for (let i = 0; i < n; i++) drop("snow", { vx: rand(-10, 10), vy: rand(38, 70), size: rand(1.6, 3.4) }); }
  const s = seasonOf();
  const tree = places.tree;
  if (s === "fall" && Math.random() < dt * 1.4) {
    const st = scaleAt(tree.y);
    fx.weather.push({ kind: "leaf", x: tree.x + rand(-110, 110) * st, y: tree.y - rand(120, 240) * st, vx: rand(-20, 10), vy: rand(30, 50), life: 14, ground: tree.y + rand(0, 90), rot: rand(TAU), vr: rand(-3, 3), ph: rand(TAU), color: pick(["#E0782A", "#C8452D", "#E8B040", "#B8642E"]), size: st, landed: false });
  }
  if (s === "spring" && Math.random() < dt * 1.1) drop("petal", { vx: rand(-15, 15), vy: rand(24, 40), size: rand(2.2, 3.6), color: pick(["#F7A8C4", "#FFD1E3", "#FFFFFF"]) });
}
function drawWeather(g) {
  for (const p of fx.weather) {
    const fade = clamp(p.life / 1.2);
    switch (p.kind) {
      case "rain":
        g.strokeStyle = "rgba(210,228,245,.55)"; g.lineWidth = 1.3;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + 1.1, p.y - 16); g.stroke(); break;
      case "ripple": {
        const t = 1 - p.life / p.max, sc = scaleAt(p.y);
        g.strokeStyle = `rgba(255,255,255,${0.5 * (1 - t)})`; g.lineWidth = 1;
        ellipse(g, p.x, p.y, (2 + t * 10) * sc, (0.8 + t * 3) * sc); g.stroke(); break;
      }
      case "snow":
        g.fillStyle = `rgba(255,255,255,${0.9 * fade})`; circle(g, p.x, p.y, p.size); g.fill(); break;
      case "leaf":
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = fade;
        g.fillStyle = p.color; ellipse(g, 0, 0, 5 * p.size + 1, 2.6 * p.size + 0.6); g.fill(); g.restore(); break;
      case "petal":
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = fade;
        g.fillStyle = p.color; ellipse(g, 0, 0, p.size, p.size * 0.6); g.fill(); g.restore(); break;
    }
  }
  g.globalAlpha = 1;
}
// A rainbow across the sky after the rain
function drawRainbow(g) {
  if (weather.rainbow <= 0) return;
  const a = clamp(weather.rainbow / 6) * clamp((45 - weather.rainbow) / 6) * 0.42;
  const cx = view.W * 0.62, cy = view.horizon + 70, cols = ["#FF4D4D", "#FF9A3C", "#FFE14D", "#5CD65C", "#4DA6FF", "#7A5CFF"];
  g.save();
  g.lineWidth = 12;
  cols.forEach((c, i) => { g.strokeStyle = rgba(c, a); g.beginPath(); g.arc(cx, cy, 330 - i * 12, Math.PI, 0); g.stroke(); });
  g.restore();
}
// Birds that don't like getting wet head for the house or the tree
function shelterSpot(c) {
  const opts = [];
  const h = places.coop, hs = scaleAt(h.y), geo = houseGeo();
  opts.push({ x: h.x + rand(-geo.halfW, geo.halfW) * hs * 0.8, y: h.y + (geo.rampLen + rand(8, 26)) * hs });
  if (places.tree && places.tree.kind !== "palm") { const t = places.tree, ts = scaleAt(t.y); opts.push({ x: t.x + rand(-90, 90) * ts, y: t.y + rand(4, 26) * ts }); }
  let best = opts[0], bd = 1e9;
  for (const o of opts) { const d = Math.hypot(o.x - c.x, o.y - c.y); if (d < bd) { bd = d; best = o; } }
  return best;
}
const dislikesRain = (c) => !SP(c).swim && !SP(c).wade;


/* ================================================================
   23. VISITORS
   ================================================================
   Now and then a friendly animal drops by: a barn cat or a dog in the
   Backyard, a frog at the pond, a bunny in the meadow, a crab at the
   lagoon. Tap them to say hi! And sometimes a hawk's shadow sweeps
   across the ground, and the chickens run for cover (real chickens
   do this too). The hawk never catches anyone.
*/
const VISITORS = { backyard: ["cat", "dog"], pond: ["frog"], meadow: ["bunny"], lagoon: ["crab"] };
const VISITOR_SPEED = { cat: 40, dog: 70, frog: 44, bunny: 60, crab: 42 };
let visitor = null, visitorT = rand(30, 60), hawk = null, hawkT = rand(160, 280);

// Extra sounds for the visitors (added onto the Sound toolbox)
Object.assign(Sound, {
  meow(pan = 0) { this.tone({ type: "triangle", f0: 620, f1: 820, dur: 0.18, gain: 0.08, pan }); this.tone({ type: "triangle", t: 0.18, f0: 820, f1: 480, dur: 0.3, gain: 0.08, pan }); },
  woof(pan = 0) { [0, 0.22].forEach((t) => { this.tone({ type: "sawtooth", t, f0: 330, f1: 180, dur: 0.14, gain: 0.14, filter: "lowpass", ff: 900, pan }); this.noise({ t, dur: 0.08, gain: 0.08, type: "bandpass", f: 700, pan }); }); },
  ribbit(pan = 0) { for (let i = 0; i < 4; i++) this.tone({ type: "square", t: i * 0.035, f0: 220, f1: 170, dur: 0.03, gain: 0.07, filter: "lowpass", ff: 800, pan }); this.tone({ type: "square", t: 0.2, f0: 260, f1: 190, dur: 0.12, gain: 0.07, filter: "lowpass", ff: 800, pan }); },
  thump(pan = 0) { this.tone({ f0: 140, f1: 70, dur: 0.12, gain: 0.14, pan }); },
  click(pan = 0) { for (let i = 0; i < 3; i++) this.noise({ t: i * 0.09, dur: 0.02, gain: 0.1, type: "highpass", f: 3000, pan }); },
  hawk() { this.tone({ f0: 2300, f1: 1500, dur: 0.9, gain: 0.07, filter: "bandpass", ff: 2000, q: 2 }); this.tone({ type: "triangle", f0: 2350, f1: 1550, dur: 0.9, gain: 0.03 }); },
  crack(n) { this.noise({ dur: 0.07, gain: 0.16 + n * 0.04, type: "highpass", f: 2500 - n * 400 }); this.tone({ f0: 900 + n * 120, f1: 500, dur: 0.05, gain: 0.05 }); },
  // Soft, steady rain. Turned up and down as the rain comes and goes.
  setRain(v) {
    if (!this.ctx || !this.noiseBuf) return;
    if (!this.rainGain) {
      if (v < 0.01 || this.ctx.state !== "running") return;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf; src.loop = true;
      const f = this.ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1400; f.Q.value = 0.6;
      this.rainGain = this.ctx.createGain(); this.rainGain.gain.value = 0;
      src.connect(f); f.connect(this.rainGain); this.rainGain.connect(this.master);
      src.start();
    }
    this.rainGain.gain.setTargetAtTime(v * 0.1, this.ctx.currentTime, 0.4);
  },
});

function updateVisitors(dt) {
  if (scene !== "yard") return;
  const nice = darkness() < 0.3 && !isRaining();
  if (!visitor) {
    visitorT -= dt;
    if (visitorT <= 0 && nice && started) { visitorT = rand(70, 140); spawnVisitor(pick(VISITORS[game.farm])); }
  } else updateVisitor(visitor, dt);
  if (!hawk) {
    hawkT -= dt;
    if (hawkT <= 0 && nice && started && game.farm !== "lagoon") { hawkT = rand(220, 380); startHawk(); }
  } else {
    hawk.t += dt;
    if (hawk.t >= hawk.dur) hawk = null;
  }
}
// Pick a nice spot for a visitor to sit (on land, away from the house)
function visitorSpot(kind) {
  if (kind === "frog" && places.water) { const w = places.water, a = rand(0.2, 0.8) * Math.PI; return { x: w.x + Math.cos(a) * w.rx * 1.02, y: w.y + Math.sin(a) * w.ry * 1.02 }; }
  if (kind === "crab" && places.water) { const w = places.water, a = rand(0.15, 0.85) * Math.PI; return { x: w.x + Math.cos(a) * w.rx * 1.2, y: w.y + Math.sin(a) * w.ry * 1.2 }; }
  for (let i = 0; i < 10; i++) {
    const [x, y] = avoidSpots(rand(view.W * 0.3, view.W * 0.9), rand(groundTop() + 40, groundBottom() - 30), false);
    if (Math.hypot(x - places.coop.x, y - places.coop.y) > 160) return { x, y };
  }
  return { x: view.W * 0.6, y: groundTop() + (groundBottom() - groundTop()) * 0.6 };
}
function spawnVisitor(kind) {
  const spot = visitorSpot(kind), fromLeft = spot.x > view.W / 2 ? Math.random() < 0.3 : Math.random() < 0.7;
  visitor = {
    kind, x: fromLeft ? -50 : view.W + 50, y: spot.y, tx: spot.x, ty: spot.y, z: 0, vz: 0,
    state: "in", t: 0, dir: fromLeft ? 1 : -1, phase: 0, wag: 0, tapT: 0, id: nextId++,
  };
}
function updateVisitor(v, dt) {
  v.t += dt;
  if (v.tapT > 0) v.tapT -= dt;
  if (v.z > 0 || v.vz > 0) { v.vz -= 700 * dt; v.z = Math.max(0, v.z + v.vz * dt); if (v.z === 0) v.vz = 0; }
  const speed = VISITOR_SPEED[v.kind] * lerp(0.62, 1.08, depth(v.y));
  const walkTo = (tx, ty) => {
    const dx = tx - v.x, dy = ty - v.y, d = Math.hypot(dx, dy);
    if (d < 4) return true;
    const step = Math.min(d, speed * dt);
    v.x += (dx / d) * step; v.y += (dy / d) * step;
    if (v.kind !== "crab" && Math.abs(dx) > 1) v.dir = dx > 0 ? 1 : -1;
    v.phase += step * 0.25;
    if ((v.kind === "bunny" || v.kind === "frog") && v.z <= 0) v.vz = v.kind === "bunny" ? 150 : 120;   // hop, hop!
    return false;
  };
  if (v.kind === "cat" && v.state === "rest" && v.tapT <= 0 && Math.random() < dt * 0.5) {   // a sleepy cat snores
    const sc = scaleAt(v.y); emit("zzz", v.x + 12 * sc * v.dir, v.y, 26 * sc, { vz: 16 * sc, life: 2, size: 0.8 * sc });
  }
  if (v.state === "in") { if (walkTo(v.tx, v.ty)) { v.state = "rest"; v.t = 0; v.rest = rand(22, 38); } }
  else if (v.state === "rest") { if (v.t > v.rest) { v.state = "out"; v.tx = v.x < view.W / 2 ? -60 : view.W + 60; } }
  else if (walkTo(v.tx, v.ty)) visitor = null;
}
function tapVisitor(v) {
  const sc = scaleAt(v.y), pan = panX(v.x);
  v.tapT = 1.2;
  hearts(v.x, v.y, 30 * sc, sc);
  game.stats.visitors++;
  switch (v.kind) {
    case "cat": Sound.meow(pan); Sound.purr(pan); break;
    case "dog": Sound.woof(pan); v.vz = 120; break;
    case "frog": Sound.ribbit(pan); v.vz = 220; if (v.state === "rest" && v.t > 3) { v.state = "out"; v.tx = v.x < view.W / 2 ? -60 : view.W + 60; } break;
    case "bunny": Sound.thump(pan); v.vz = 200; break;
    case "crab": Sound.click(pan); break;
  }
}
function visitorHit(p) {
  const v = visitor;
  if (!v) return false;
  const sc = scaleAt(v.y);
  return Math.hypot(p.x - v.x, p.y - (v.y - v.z - 14 * sc)) < Math.max(30, 34 * sc);
}

// ---------- The hawk's shadow ----------
function startHawk() {
  const y0 = groundTop() + rand(30, 120), y1 = groundBottom() - rand(40, 160);
  hawk = { t: 0, dur: 4.6, x0: -220, y0, x1: view.W + 220, y1 };
  Sound.hawk();
  let called = false;
  for (const c of F.birds) {
    if (c.loc !== "yard" || !INTERRUPTIBLE.has(c.state) || c.goal === "lay" || c.goal === "bed") continue;
    if (isRooster(c) && c.growth >= 1 && GUARD_KINDS.has(kindOf(c))) {   // roosters, ganders, toms and guineas keep watch!
      c.state = "guard"; c.goal = null; c.t = hawk.dur + 0.6; c.lookT = 0.5; c.flapT = 0.5;
      Sound.alarm(panX(c.x));
      continue;
    }
    const S = SP(c);
    if (S.swim || S.wade) { c.flapT = 0.6; continue; }   // ducks and flamingos just flap
    const s = shelterSpot(c);
    c.goal = "hide"; c.flapT = 0.8;
    walkTo(c, s.x, s.y, SETTINGS.runSpeed * 1.2, false);
    if (!called) { called = true; Sound.cluck(1.3, panX(c.x), 0.8); }
  }
}
function drawHawkShadow(g) {
  if (!hawk) return;
  const t = hawk.t / hawk.dur, x = lerp(hawk.x0, hawk.x1, t), y = lerp(hawk.y0, hawk.y1, t), sc = scaleAt(y) * 1.4;
  const flap = Math.sin(hawk.t * 5) * 0.15, fade = clamp(Math.min(t, 1 - t) * 6);
  g.save();
  g.translate(x, y); g.rotate(Math.atan2(hawk.y1 - hawk.y0, hawk.x1 - hawk.x0)); g.scale(sc, sc * 0.45);
  g.fillStyle = `rgba(30,40,20,${0.26 * fade})`;
  g.beginPath();
  g.moveTo(30, 0); g.quadraticCurveTo(10, -6, 0, -8 - flap * 20);
  g.lineTo(-18, -60 - flap * 40); g.lineTo(-30, -50); g.lineTo(-20, -8);
  g.lineTo(-40, -6); g.lineTo(-52, 0); g.lineTo(-40, 6); g.lineTo(-20, 8);
  g.lineTo(-30, 50); g.lineTo(-18, 60 + flap * 40); g.lineTo(0, 8 + flap * 20); g.quadraticCurveTo(10, 6, 30, 0);
  g.fill();
  g.restore();
}

// ---------- Drawing the visitors (facing right, feet at 0,0) ----------
function drawVisitor(g, v) {
  const sc = scaleAt(v.y);
  g.fillStyle = "rgba(46,70,20,.2)"; ellipse(g, v.x, v.y + 1, 18 * sc, 5 * sc); g.fill();
  g.save();
  g.translate(v.x, v.y - v.z);
  g.scale(sc * v.dir, sc);
  const moving = v.state !== "rest", step = Math.sin(v.phase * 3);
  switch (v.kind) {
    case "cat": drawCat(g, v, moving, step); break;
    case "dog": drawDog(g, v, moving, step); break;
    case "frog": drawFrog(g, v); break;
    case "bunny": drawBunny(g, v); break;
    case "crab": drawCrab(g, v, moving, step); break;
  }
  g.restore();
}
function drawCat(g, v, moving, step) {
  const fur = "#E89A4A", dark = "#C27428", napping = !moving && v.tapT <= 0;
  if (napping) {       // curled up asleep in the sun
    g.fillStyle = fur; ellipse(g, 0, -9, 19, 10); g.fill();
    g.strokeStyle = dark; g.lineWidth = 2.2;
    for (const x of [-8, -1, 6]) { g.beginPath(); g.moveTo(x, -18); g.quadraticCurveTo(x + 2, -12, x, -6); g.stroke(); }
    g.strokeStyle = fur; g.lineWidth = 5; g.lineCap = "round";
    g.beginPath(); g.moveTo(-17, -6); g.quadraticCurveTo(-4, 2, 12, -2); g.stroke();
    g.fillStyle = fur; circle(g, 14, -12, 8); g.fill();
    g.beginPath(); g.moveTo(9, -17); g.lineTo(11, -25); g.lineTo(15, -19); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(16, -19); g.lineTo(21, -24); g.lineTo(21, -15); g.closePath(); g.fill();
    g.strokeStyle = "#5A3A20"; g.lineWidth = 1.3;
    g.beginPath(); g.arc(15, -12, 2, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    return;
  }
  g.strokeStyle = fur; g.lineWidth = 4; g.lineCap = "round";
  for (const [x, ph] of [[-11, 0], [-5, Math.PI], [8, Math.PI], [14, 0]]) { g.beginPath(); g.moveTo(x, -10); g.lineTo(x + (moving ? Math.sin(v.phase * 3 + ph) * 4 : 0), 0); g.stroke(); }
  g.beginPath(); g.moveTo(-18, -14); g.quadraticCurveTo(-30, -20 + Math.sin(clock * 3) * 4, -26, -34); g.stroke();   // tail
  g.fillStyle = fur; ellipse(g, 0, -14, 20, 8.5); g.fill();
  g.strokeStyle = dark; g.lineWidth = 2;
  for (const x of [-10, -3, 4]) { g.beginPath(); g.moveTo(x, -21); g.lineTo(x + 2, -14); g.stroke(); }
  g.fillStyle = fur; circle(g, 19, -22, 8); g.fill();
  g.beginPath(); g.moveTo(13, -27); g.lineTo(14, -36); g.lineTo(19, -29); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(20, -29); g.lineTo(26, -35); g.lineTo(26, -25); g.closePath(); g.fill();
  g.fillStyle = "#2A1D16"; circle(g, 22, -23, 1.5); g.fill();
  g.fillStyle = "#F28AB0"; circle(g, 26.5, -20, 1.2); g.fill();
}
function drawDog(g, v, moving, step) {
  const fur = "#D9A45A", dark = "#B07E38", wag = Math.sin(clock * (v.tapT > 0 ? 26 : 12)) * 0.5;
  g.strokeStyle = fur; g.lineWidth = 5; g.lineCap = "round";
  if (moving) {
    for (const [x, ph] of [[-14, 0], [-8, Math.PI], [10, Math.PI], [16, 0]]) { g.beginPath(); g.moveTo(x, -14); g.lineTo(x + Math.sin(v.phase * 3 + ph) * 5, 0); g.stroke(); }
    g.save(); g.translate(-22, -22); g.rotate(-0.6 + wag); g.beginPath(); g.moveTo(0, 0); g.lineTo(-12, -8); g.stroke(); g.restore();
    g.fillStyle = fur; ellipse(g, 0, -22, 24, 11); g.fill();
    g.fillStyle = fur; circle(g, 24, -32, 10); g.fill();
    ellipse(g, 32, -29, 7, 5); g.fill();
    g.fillStyle = dark; ellipse(g, 19, -30, 4, 8, 0.3); g.fill();
    g.fillStyle = "#2A1D16"; circle(g, 27, -35, 1.6); g.fill(); circle(g, 38, -30, 2); g.fill();
    if (v.tapT > 0) { g.fillStyle = "#F28AB0"; ellipse(g, 34, -24, 2.5, 4); g.fill(); }
  } else {             // sitting nicely, tail wagging
    g.save(); g.translate(-10, -4); g.rotate(-1.2 + wag); g.beginPath(); g.moveTo(0, 0); g.lineTo(-14, -2); g.stroke(); g.restore();
    g.fillStyle = fur; ellipse(g, 0, -20, 14, 18); g.fill();
    g.strokeStyle = fur; g.lineWidth = 5;
    g.beginPath(); g.moveTo(6, -12); g.lineTo(8, 0); g.moveTo(-2, -10); g.lineTo(-2, 0); g.stroke();
    g.fillStyle = fur; circle(g, 8, -42, 10); g.fill();
    ellipse(g, 16, -39, 7, 5); g.fill();
    g.fillStyle = dark; ellipse(g, 3, -40, 4, 8, 0.3); g.fill();
    g.fillStyle = "#2A1D16"; circle(g, 11, -45, 1.6); g.fill(); circle(g, 22, -40, 2); g.fill();
    g.fillStyle = "#F28AB0"; ellipse(g, 18, -33, 2.5, 3.5 + Math.abs(Math.sin(clock * 6))); g.fill();   // panting
  }
}
function drawFrog(g, v) {
  const green = "#6DB84A", dark = "#4E8E34";
  g.fillStyle = dark; ellipse(g, -8, -3, 7, 3.5); g.fill(); ellipse(g, 8, -3, 7, 3.5); g.fill();
  g.fillStyle = green; ellipse(g, 0, -8, 12, 8); g.fill();
  g.fillStyle = "#CFE8A0"; ellipse(g, 3, -5, 7, 4); g.fill();
  for (const x of [-5, 5]) { g.fillStyle = green; circle(g, x, -15, 4.5); g.fill(); g.fillStyle = "#FFFFFF"; circle(g, x + 0.5, -15.5, 2.8); g.fill(); g.fillStyle = "#1E1E22"; circle(g, x + 1, -15.5, 1.5); g.fill(); }
  g.strokeStyle = "#2E5A20"; g.lineWidth = 1.2;
  const croak = v.tapT > 0.8 ? 1 : 0;
  g.beginPath(); g.arc(3, -10, 5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  if (croak) { g.fillStyle = "rgba(230,240,190,.9)"; circle(g, 6, -4, 5); g.fill(); }   // puffed-up throat
}
function drawBunny(g, v) {
  const fur = "#B5A08A", light = "#E8DCCB", tw = Math.sin(clock * 9) > 0.7 ? 1 : 0;
  g.fillStyle = light; circle(g, -12, -12, 5); g.fill();                       // cotton tail
  g.fillStyle = fur; ellipse(g, 0, -11, 13, 10); g.fill();
  ellipse(g, 6, -3, 7, 3); g.fill();                                            // back foot
  g.save(); g.translate(8, -22); g.rotate(-0.2 + (v.tapT > 0 ? Math.sin(clock * 20) * 0.1 : 0));
  g.fillStyle = fur; ellipse(g, -2, -12, 3.5, 10); g.fill(); ellipse(g, 3, -12, 3.5, 10, 0.25); g.fill();
  g.fillStyle = "#F2C4C4"; ellipse(g, -2, -12, 1.6, 7); g.fill();
  g.restore();
  g.fillStyle = fur; circle(g, 11, -18, 7); g.fill();
  g.fillStyle = "#2A1D16"; circle(g, 14, -20, 1.4); g.fill();
  g.fillStyle = "#F28AB0"; circle(g, 17.5, -17 + tw * 0.5, 1.2); g.fill();
}
function drawCrab(g, v, moving, step) {
  const red = "#E0503A", dark = "#B8382A", clack = v.tapT > 0 ? Math.abs(Math.sin(clock * 18)) : 0;
  g.strokeStyle = dark; g.lineWidth = 2; g.lineCap = "round";
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const x = s * (7 + i * 3), lift = moving ? Math.sin(v.phase * 4 + i + (s > 0 ? 1 : 0)) * 2 : 0;
    g.beginPath(); g.moveTo(x * 0.6, -6); g.lineTo(x * 1.2, -8 + lift); g.lineTo(x * 1.4, 0); g.stroke();
  }
  g.fillStyle = red; ellipse(g, 0, -8, 11, 6.5); g.fill();
  for (const s of [-1, 1]) {           // claws, which clack when you tap!
    g.save(); g.translate(s * 12, -14 - clack * 3); g.rotate(s * (0.4 + clack * 0.4));
    g.fillStyle = red; ellipse(g, 0, -3, 4.5, 5); g.fill(); g.fillStyle = "#F6E7DC"; g.fillRect(-0.6, -8, 1.2, 5);
    g.restore();
  }
  for (const s of [-1, 1]) { g.strokeStyle = dark; g.lineWidth = 1.4; g.beginPath(); g.moveTo(s * 3, -13); g.lineTo(s * 4, -18); g.stroke(); g.fillStyle = "#1E1E22"; circle(g, s * 4, -19, 1.7); g.fill(); }
}

// A new day! Maybe a new season, too.
function onNewDay() {
  if (seasonIndex(game.day) === seasonIndex(game.day - 1)) return;
  const sn = SEASONS[seasonIndex()];
  game.stats.seasons[sn.id] = true;
  if (game.farm !== "lagoon") { buildBackground(); buildBlades(); }
  if (started) toast(sn.msg, 3200);
}

/* ================================================================
   24. TIME KEEPS GOING WHILE YOU'RE AWAY
   ================================================================
   When you close the game (or switch to another app), the farms don't
   stop. They just go slower: one farm day takes 2 real hours (see
   awayHoursPerDay in SETTINGS). When you come back, we replay the time
   you were gone, a few seconds at a time: the sun goes around, seasons change, birds eat
   from the feeders, grow up, and lay eggs in their nests. Incubator
   eggs use the real clock, so they keep warming too.

   Just like a real farm, if you're gone a long time the feeders run
   empty and the nests fill up. Nothing bad happens to the birds; they
   just stop laying until you fill the feeders again.
*/
const MAX_REPLAY_DAYS = 10;   // replay up to 10 farm days; any more just moves the clock

function catchUpWhileAway(awaySeconds) {
  const daysBefore = game.day, eggsBefore = game.totalEggs;
  const babies = [];
  for (const id of FARM_ORDER) for (const c of farms[id].birds) if (c.growth < 1) babies.push(c);
  // While you're away, time runs slower: one farm day takes awayHoursPerDay
  // real hours instead of 20 minutes. So we squeeze the time you were gone
  // into the same amount of farm time (2 hours away = 1 farm day).
  const farmSeconds = awaySeconds * SETTINGS.dayLengthSeconds / (SETTINGS.awayHoursPerDay * 3600);
  const replay = Math.min(farmSeconds, MAX_REPLAY_DAYS * SETTINGS.dayLengthSeconds);
  const tick = (dt) => {
    game.time += dt / SETTINGS.dayLengthSeconds;
    while (game.time >= 1) {
      game.time -= 1;
      game.day++;
      game.stats.seasons[SEASONS[seasonIndex()].id] = true;
    }
  };
  for (let t = 0; t < replay; t += 5) {
    const dt = Math.min(5, replay - t);
    tick(dt);
    for (const id of FARM_ORDER) if (farms[id].unlocked) simulateFarm(id, dt);
  }
  if (farmSeconds > replay) tick(farmSeconds - replay);
  if (awaySeconds > 120) { weather.kind = "clear"; weather.left = 0; weather.amount = 0; weather.rainbow = 0; }
  if (seasonIndex(daysBefore) !== seasonIndex()) { buildBackground(); buildBlades(); }

  // Tell the player what happened
  if (awaySeconds < 60) return "";
  const days = game.day - daysBefore, laid = game.totalEggs - eggsBefore;
  const grown = babies.filter((c) => c.growth >= 1).map((c) => c.name);
  const bits = [];
  if (days > 0) bits.push(`${days} ${days === 1 ? "day" : "days"} went by`);
  if (laid > 0) bits.push(`your birds laid ${laid} ${laid === 1 ? "egg" : "eggs"} 🥚`);
  if (grown.length) bits.push(grown.length === 1 ? `${grown[0]} grew up` : `${grown.length} babies grew up`);
  const hungry = FARM_ORDER.some((id) => farms[id].unlocked && farms[id].birds.length && farms[id].feeder < 0.05);
  // "a, b and c"
  const list = bits.length > 1 ? `${bits.slice(0, -1).join(", ")} and ${bits[bits.length - 1]}` : bits[0];
  let msg = bits.length ? `While you were away, ${list}!` : "Welcome back! The birds missed you 🐔";
  if (seasonIndex(daysBefore) !== seasonIndex()) msg += ` It's ${SEASONS[seasonIndex()].name.toLowerCase()} now!`;
  if (hungry) msg += " The feeders are empty, time to fill them!";
  return msg;
}

// Switching to another app and back: catch up on the time you missed
let hiddenAt = 0;
function catchUpAfterBackground() {
  if (!hiddenAt) return;
  const away = (Date.now() - hiddenAt) / 1000;
  hiddenAt = 0;
  if (away < 3) return;
  const msg = catchUpWhileAway(away);
  arriveFarm();
  shown.feeder = F.feeder; shown.water = F.water;
  updateHud();
  if (msg && started) toast(msg, 4200);
  save();
}

/* ================================================================
   25. BOYS, GIRLS & GENES
   ================================================================
   Every bird is a boy or a girl, and every bird carries GENES: tiny
   instructions that say what it looks like. A bird has TWO copies of
   each gene, one from Mom and one from Dad. When it has babies, it
   passes on ONE of its two copies, picked at random, like a coin flip.

   Some genes are "dominant": one copy is enough to show (like the
   blue-egg gene). Some are "recessive": they only show with two
   copies, so a bird can secretly CARRY a gene without showing it
   (like white feathers). And some are "in-between": one copy shows a
   little, two copies show a lot (one blue gene makes a blue chicken,
   two make a "splash" chicken!).

   A few genes ride on the "Z" chromosome, which decides boy or girl.
   Boy birds have two Z's, girl birds have only one. That's why some
   crosses make boy chicks and girl chicks that look different on the
   very day they hatch ("sex-links").

   Every breed below (in BREEDS, near the top of this file) is just a
   list of genes. Change a breed's genes and it changes how it looks!
*/

// ---------- Kinds of birds that can have babies together ----------
// "ratio" is how many girls per boy makes the happiest flock.
const KINDS = {
  chicken:  { species: "chicken",  male: "rooster", female: "hen",  ratio: [6, 12], ideal: "about 1 rooster for every 10 hens", mix: "mix" },
  duck:     { species: "duck",     male: "drake",   female: "duck", ratio: [3, 6],  ideal: "about 1 drake for every 5 ducks", mix: "mixDuck", maleSize: 1.05 },
  muscovy:  { species: "duck",     male: "drake",   female: "duck", ratio: [3, 6],  ideal: "about 1 drake for every 5 ducks", mix: "mixMuscovy", maleSize: 1.3 },
  mule:     { species: "duck",     male: "drake",   female: "duck", ratio: [0, 99], ideal: "", mix: "mulard", sterile: true },
  goose:    { species: "goose",    male: "gander",  female: "goose", ratio: [1, 4], ideal: "about 1 gander for every 3 geese", mix: "mixGoose", maleSize: 1.08 },
  swan:     { species: "goose",    male: "cob",     female: "pen",  ratio: [1, 1],  ideal: "swans live in pairs: 1 cob and 1 pen", mix: "mixSwan", maleSize: 1.08, pairs: true },
  quail:    { species: "quail",    male: "cock",    female: "hen",  ratio: [3, 5],  ideal: "about 1 cock for every 4 hens", mix: "mixQuail", maleSize: 0.95 },
  calQuail: { species: "quail",    male: "cock",    female: "hen",  ratio: [1, 3],  ideal: "about 1 cock for every 2 hens", mix: "calQuail" },
  bobwhite: { species: "quail",    male: "cock",    female: "hen",  ratio: [1, 3],  ideal: "about 1 cock for every 2 hens", mix: "mixBobwhite" },
  guinea:   { species: "guinea",   male: "cock",    female: "hen",  ratio: [1, 4],  ideal: "about 1 cock for every 3 hens", mix: "mixGuinea", maleSize: 1.05 },
  pheasant: { species: "pheasant", male: "cock",    female: "hen",  ratio: [4, 8],  ideal: "about 1 cock for every 6 hens", mix: "mixPheasant", maleSize: 1.1 },
  ruffed:   { species: "pheasant", male: "cock",    female: "hen",  ratio: [2, 5],  ideal: "about 1 cock for every 4 hens", mix: "mixRuffed", maleSize: 1.05 },
  silverPh: { species: "pheasant", male: "cock",    female: "hen",  ratio: [2, 5],  ideal: "about 1 cock for every 4 hens", mix: "silverPh", maleSize: 1.1 },
  reeves:   { species: "pheasant", male: "cock",    female: "hen",  ratio: [2, 5],  ideal: "about 1 cock for every 4 hens", mix: "reeves", maleSize: 1.1 },
  turkey:   { species: "turkey",   male: "tom",     female: "hen",  ratio: [5, 10], ideal: "about 1 tom for every 8 hens", mix: "mixTurkey", maleSize: 1.25 },
  flamingo: { species: "flamingo", male: "male",    female: "female", ratio: [1, 1], ideal: "flamingos pair up: 1 male and 1 female", mix: "mixFlamingo", maleSize: 1.1, pairs: true },
  peafowl:  { species: "peafowl",  male: "peacock", female: "peahen", ratio: [3, 5], ideal: "about 1 peacock for every 4 peahens", mix: "mixPeafowl", maleSize: 1.05 },
};
const kindOfBreed = (key) => BREEDS[key].kind || BREEDS[key].species;
const kindOf = (c) => kindOfBreed(c.breed);
// Can these two have babies together? "yes", "mule" (babies can't have babies), or "no"
function canMate(momKind, dadKind) {
  if (momKind === dadKind) return KINDS[momKind].sterile ? "no" : "yes";
  const pair = [momKind, dadKind].sort().join("+");
  if (pair === "duck+muscovy") return "mule";
  return "no";
}

// ---------- Every gene each kind of bird has ----------
// type "dom": the first allele in the list wins over the ones after it
// type "inc": in-between; one copy shows a little, two copies show a lot
// type "num": a number; the chick gets the average of its two copies
// type "blend": the two copies mix together (like paint)
// z: true means the gene rides on the Z chromosome (girls have just one copy)
const LOCI = {
  chicken: [
    { id: "base", name: "Main color", type: "dom", alleles: ["E", "ER", "R", "p"], wild: "p", say: { E: "Black", ER: "Black with a colored neck", R: "Red / buff", p: "Wild colors" }, always: true },
    { id: "tone", name: "Red shade", type: "dom", alleles: ["Mh", "n", "di"], wild: "n", say: { Mh: "Deep red", n: "Gold", di: "Buff" } },
    { id: "silver", name: "Silver", type: "dom", z: true, alleles: ["S", "s"], wild: "s", say: { S: "Silver", s: "Gold" }, always: true },
    { id: "bar", name: "Barring", type: "dom", z: true, alleles: ["B", "b"], wild: "b", say: { B: "Barred stripes" } },
    { id: "domW", name: "Dominant white", type: "inc", alleles: ["I", "i"], wild: "i", say: { 1: "White with specks", 2: "White" } },
    { id: "recW", name: "Recessive white", type: "dom", alleles: ["C", "c"], wild: "C", say: { c: "White" } },
    { id: "blue", name: "Blue", type: "inc", alleles: ["Bl", "bl"], wild: "bl", say: { 1: "Blue", 2: "Splash" } },
    { id: "lav", name: "Lavender", type: "dom", alleles: ["L", "lav"], wild: "L", say: { lav: "Lavender" } },
    { id: "choc", name: "Chocolate", type: "dom", z: true, alleles: ["Ch", "ch"], wild: "Ch", say: { ch: "Chocolate" } },
    { id: "pat", name: "Pattern", type: "dom", alleles: ["col", "lace", "dlace", "spang", "n", "mot"], wild: "n", say: { col: "Black neck & tail", lace: "Laced", dlace: "Double laced", spang: "Spangled", mot: "Mottled" } },
    { id: "silkie", name: "Silkie feathers", type: "dom", alleles: ["H", "h"], wild: "H", say: { h: "Silkie fluff" } },
    { id: "frizzle", name: "Frizzle", type: "inc", alleles: ["F", "f"], wild: "f", say: { 1: "Frizzle", 2: "Frazzle" } },
    { id: "naked", name: "Naked neck", type: "inc", alleles: ["Na", "na"], wild: "na", say: { 1: "Half-naked neck", 2: "Naked neck" } },
    { id: "crest", name: "Crest", type: "inc", alleles: ["Cr", "cr"], wild: "cr", say: { 1: "Small crest", 2: "Big crest" } },
    { id: "wcrest", name: "White crest", type: "dom", alleles: ["Wc", "wc"], wild: "wc", say: { Wc: "White crest" } },
    { id: "beard", name: "Beard", type: "dom", alleles: ["Mb", "mb"], wild: "mb", say: { Mb: "Beard & muffs" } },
    { id: "feet", name: "Feathered feet", type: "dom", alleles: ["Pti", "pti"], wild: "pti", say: { Pti: "Feathery feet" } },
    { id: "toes", name: "Five toes", type: "dom", alleles: ["Po", "po"], wild: "po", say: { Po: "Five toes" } },
    { id: "rose", name: "Rose comb", type: "dom", alleles: ["Rc", "rc"], wild: "rc", say: { Rc: "Rose comb" } },
    { id: "pea", name: "Pea comb", type: "dom", alleles: ["Pc", "pc"], wild: "pc", say: { Pc: "Pea comb" } },
    { id: "vcomb", name: "V comb", type: "dom", alleles: ["D", "d"], wild: "d", say: { D: "V comb (little horns)" } },
    { id: "blueEgg", name: "Blue eggs", type: "dom", alleles: ["O", "o"], wild: "o", say: { O: "Blue eggs" } },
    { id: "speckEgg", name: "Speckled eggs", type: "dom", alleles: ["Sp", "sp"], wild: "sp", say: { Sp: "Speckled eggs" } },
    { id: "skin", name: "Black skin", type: "dom", alleles: ["Fm", "fm"], wild: "fm", say: { Fm: "Black skin" } },
    { id: "skinY", name: "Leg color", type: "dom", alleles: ["W", "w"], wild: "w", say: { W: "White legs", w: "Yellow legs" } },
    { id: "lobe", name: "Earlobes", type: "inc", alleles: ["Wl", "wl"], wild: "wl", say: { 1: "Pinkish earlobes", 2: "White earlobes" } },
    { id: "rump", name: "Rumpless", type: "dom", alleles: ["Rp", "rp"], wild: "rp", say: { Rp: "No tail" } },
    { id: "tufts", name: "Ear tufts", type: "dom", alleles: ["Et", "et"], wild: "et", say: { Et: "Ear tufts" } },
    { id: "henny", name: "Hen-feathering", type: "dom", alleles: ["Hf", "hf"], wild: "hf", say: { Hf: "Boys look like girls" } },
    { id: "longTail", name: "Long tail", type: "dom", alleles: ["Gt", "gt"], wild: "Gt", say: { gt: "Super long tail" } },
    { id: "brownEgg", name: "Brown eggs", type: "num", wild: 2 },
    { id: "combSize", name: "Comb size", type: "num", wild: 1 },
    { id: "size", name: "Size", type: "num", wild: 1 },
    { id: "fluff", name: "Fluffiness", type: "num", wild: 0 },
    { id: "lay", name: "Laying", type: "num", wild: 1 },
  ],
  duck: [
    { id: "base", name: "Main color", type: "dom", alleles: ["E", "M", "md"], wild: "M", say: { E: "Black", M: "Mallard colors", md: "Dusky" }, always: true },
    { id: "blue", name: "Blue", type: "inc", alleles: ["Bl", "bl"], wild: "bl", say: { 1: "Blue", 2: "Silver-splash" } },
    { id: "brown", name: "Brown", type: "dom", alleles: ["D", "d"], wild: "D", say: { d: "Brown (khaki)" } },
    { id: "white", name: "White", type: "dom", alleles: ["C", "c"], wild: "C", say: { c: "White" } },
    { id: "bib", name: "White patches", type: "dom", alleles: ["n", "bib", "mag"], wild: "n", say: { bib: "White bib", mag: "Magpie" } },
    { id: "harl", name: "Harlequin", type: "dom", alleles: ["Hq", "hq"], wild: "Hq", say: { hq: "Harlequin (frosty)" } },
    { id: "crest", name: "Crest", type: "inc", alleles: ["Cr", "cr"], wild: "cr", say: { 1: "Crest", 2: "Big crest" } },
    { id: "blueEgg", name: "Green eggs", type: "dom", alleles: ["O", "o"], wild: "o", say: { O: "Blue-green eggs" } },
    { id: "darkEgg", name: "Dark eggs", type: "dom", alleles: ["Cu", "cu"], wild: "cu", say: { Cu: "Dark gray eggs" } },
    { id: "upright", name: "Stands tall", type: "num", wild: 0 },
    { id: "size", name: "Size", type: "num", wild: 1 },
    { id: "lay", name: "Laying", type: "num", wild: 1 },
  ],
  muscovy: [
    { id: "blue", name: "Blue", type: "inc", alleles: ["Bl", "bl"], wild: "bl", say: { 1: "Blue", 2: "Splash" } },
    { id: "choc", name: "Chocolate", type: "dom", z: true, alleles: ["Ch", "ch"], wild: "Ch", say: { ch: "Chocolate" } },
    { id: "white", name: "White", type: "dom", alleles: ["C", "c"], wild: "C", say: { c: "White" } },
    { id: "pied", name: "Pied", type: "inc", alleles: ["Pi", "pi"], wild: "pi", say: { 1: "White patches", 2: "Mostly white" } },
    { id: "size", name: "Size", type: "num", wild: 1 },
    { id: "lay", name: "Laying", type: "num", wild: 1 },
  ],
  mule: [{ id: "size", name: "Size", type: "num", wild: 1.15 }],
  goose: [
    { id: "sd", name: "Pilgrim gray", type: "inc", z: true, alleles: ["Sd", "sd"], wild: "sd", say: { 1: "Light gray", 2: "White" } },
    { id: "white", name: "White", type: "dom", alleles: ["C", "c"], wild: "C", say: { c: "White" } },
    { id: "buff", name: "Buff", type: "dom", alleles: ["G", "g"], wild: "G", say: { g: "Buff" } },
    { id: "saddle", name: "Saddleback", type: "dom", alleles: ["Sb", "sb"], wild: "Sb", say: { sb: "Saddleback" } },
    { id: "knob", name: "Knob", type: "inc", alleles: ["K", "k"], wild: "k", say: { 1: "Small knob", 2: "Big knob" } },
    { id: "dewlap", name: "Dewlap", type: "dom", alleles: ["Dw", "dw"], wild: "dw", say: { Dw: "Chin pouch (dewlap)" } },
    { id: "curl", name: "Curly feathers", type: "inc", alleles: ["Cu", "cu"], wild: "cu", say: { 1: "Curly wings", 2: "Curly feathers" } },
    { id: "size", name: "Size", type: "num", wild: 1 },
    { id: "lay", name: "Laying", type: "num", wild: 1 },
  ],
  swan: [
    { id: "black", name: "Black feathers", type: "inc", alleles: ["Bk", "bk"], wild: "bk", say: { 1: "Gray", 2: "Black" } },
    { id: "bill", name: "Bill color", type: "blend", alleles: ["or", "rd", "bk"], wild: "or", say: { or: "Orange bill", rd: "Red bill", bk: "Black bill" } },
    { id: "knob", name: "Knob", type: "inc", alleles: ["Kn", "kn"], wild: "kn", say: { 1: "Small knob", 2: "Big knob" } },
    { id: "polish", name: "Polish", type: "dom", z: true, alleles: ["Pl", "pl"], wild: "Pl", say: { pl: "White babies (Polish)" } },
    { id: "size", name: "Size", type: "num", wild: 1 },
  ],
  quail: [
    { id: "gold", name: "Golden", type: "inc", alleles: ["Y", "y"], wild: "y", say: { 1: "Italian", 2: "Golden" } },
    { id: "dark", name: "Dark", type: "inc", alleles: ["Tb", "tb"], wild: "tb", say: { 1: "Rosetta (reddish)", 2: "Tibetan (dark)" } },
    { id: "white", name: "White", type: "dom", alleles: ["Wh", "wh"], wild: "Wh", say: { wh: "English white" } },
    { id: "tux", name: "Tuxedo", type: "dom", alleles: ["S", "s"], wild: "S", say: { s: "Tuxedo (white chest)" } },
    { id: "celadon", name: "Celadon eggs", type: "dom", alleles: ["Ce", "ce"], wild: "Ce", say: { ce: "Blue eggs" } },
    { id: "size", name: "Size", type: "num", wild: 1 },
    { id: "lay", name: "Laying", type: "num", wild: 1 },
  ],
  calQuail: [{ id: "size", name: "Size", type: "num", wild: 1 }],
  bobwhite: [
    { id: "snow", name: "Snowflake", type: "dom", alleles: ["Sn", "sn"], wild: "Sn", say: { sn: "Snowflake (white)" } },
    { id: "size", name: "Size", type: "num", wild: 1 },
  ],
  guinea: [
    { id: "pearl", name: "Polka dots", type: "dom", alleles: ["P", "pt"], wild: "P", say: { pt: "No polka dots" } },
    { id: "lav", name: "Lavender", type: "dom", alleles: ["L", "lv"], wild: "L", say: { lv: "Lavender" } },
    { id: "white", name: "White", type: "dom", alleles: ["C", "c"], wild: "C", say: { c: "White" } },
    { id: "buff", name: "Buff", type: "dom", alleles: ["Br", "br"], wild: "Br", say: { br: "Buff" } },
    { id: "pied", name: "Pied", type: "inc", alleles: ["Pi", "pi"], wild: "pi", say: { 1: "White chest", 2: "Mostly white" } },
    { id: "size", name: "Size", type: "num", wild: 1 },
  ],
  pheasant: [
    { id: "mel", name: "Melanistic", type: "inc", alleles: ["Mel", "n"], wild: "n", say: { 1: "Half dark", 2: "Melanistic (very dark)" } },
    { id: "white", name: "White", type: "dom", alleles: ["C", "c"], wild: "C", say: { c: "White" } },
    { id: "fawn", name: "Buff", type: "dom", alleles: ["F", "fw"], wild: "F", say: { fw: "Buff" } },
    { id: "ring", name: "Neck ring", type: "dom", alleles: ["Rg", "rg"], wild: "Rg", say: { rg: "No neck ring" } },
    { id: "size", name: "Size", type: "num", wild: 1 },
  ],
  ruffed: [
    { id: "amherst", name: "Lady Amherst", type: "inc", alleles: ["A", "G"], wild: "G", say: { 1: "Half Lady Amherst", 2: "Lady Amherst" } },
    { id: "yellow", name: "Yellow", type: "dom", alleles: ["Yg", "yg"], wild: "Yg", say: { yg: "Yellow" } },
    { id: "dark", name: "Dark throat", type: "dom", alleles: ["Dt", "dt"], wild: "dt", say: { Dt: "Dark throat" } },
    { id: "size", name: "Size", type: "num", wild: 1 },
  ],
  silverPh: [{ id: "size", name: "Size", type: "num", wild: 1 }],
  reeves: [{ id: "size", name: "Size", type: "num", wild: 1 }],
  turkey: [
    { id: "base", name: "Main color", type: "dom", alleles: ["B", "b+", "b"], wild: "b+", say: { B: "Black", "b+": "Bronze", b: "Red" }, always: true },
    { id: "narr", name: "Narragansett", type: "dom", alleles: ["N", "n"], wild: "N", say: { n: "Steel gray" } },
    { id: "white", name: "White", type: "dom", alleles: ["C", "c"], wild: "C", say: { c: "White" } },
    { id: "slate", name: "Slate blue", type: "inc", alleles: ["Sl", "sl"], wild: "sl", say: { 1: "Blue slate", 2: "Pale slate" } },
    { id: "palm", name: "Royal palm", type: "dom", alleles: ["Cp", "cp"], wild: "Cp", say: { cp: "Royal palm stripes" } },
    { id: "size", name: "Size", type: "num", wild: 1 },
  ],
  flamingo: [
    { id: "pink", name: "Pinkness", type: "num", wild: 0.8 },
    { id: "legs", name: "Leg color", type: "blend", alleles: ["pk", "gy", "yl", "rd"], wild: "pk", say: { pk: "Pink legs", gy: "Gray legs, pink knees", yl: "Yellow legs", rd: "Red legs" } },
    { id: "bill", name: "Bill", type: "blend", alleles: ["pb", "pp", "cb", "db", "yb"], wild: "pb", say: { pb: "Pale bill", pp: "Pink bill", cb: "Half-black bill", db: "Dark bill", yb: "Yellow & black bill" } },
    { id: "size", name: "Size", type: "num", wild: 1 },
  ],
  peafowl: [
    { id: "green", name: "Green peafowl", type: "inc", alleles: ["Pm", "Pc"], wild: "Pc", say: { 1: "Half green (Spalding)", 2: "Green" } },
    { id: "white", name: "White", type: "inc", alleles: ["w", "W"], wild: "W", say: { 1: "Pied", 2: "White" } },
    { id: "cameo", name: "Cameo", type: "dom", z: true, alleles: ["Ca", "ca"], wild: "Ca", say: { ca: "Cameo (brown)" } },
    { id: "purple", name: "Purple", type: "dom", z: true, alleles: ["Pu", "pu"], wild: "Pu", say: { pu: "Purple" } },
    { id: "bs", name: "Black shoulder", type: "dom", alleles: ["Bs", "bs"], wild: "Bs", say: { bs: "Black shoulders" } },
    { id: "opal", name: "Opal", type: "dom", alleles: ["Op", "op"], wild: "Op", say: { op: "Opal (gray)" } },
    { id: "size", name: "Size", type: "num", wild: 1 },
  ],
};

// ---------- Making and mixing genes ----------
const lociOf = (kind) => LOCI[kind] || [];
const isMaleSex = (sex) => sex === "rooster";   // (every boy bird is stored as "rooster"; see KINDS for its real name)

// Genes for a bird of a breed. "spec" lists the breed's genes; any gene
// not listed is the ordinary "wild" kind.
function genesFor(kind, spec, sex) {
  const G = {};
  for (const L of lociOf(kind)) {
    let v = spec && spec[L.id];
    if (v == null) v = L.wild;
    let pair = Array.isArray(v) ? v.slice(0, 2) : [v, v];
    if (L.type === "num") pair = pair.map((x) => (typeof x === "number" ? x : L.wild));
    if (L.z && !isMaleSex(sex)) pair = [pick(pair)];   // girls have one Z
    G[L.id] = pair;
  }
  return G;
}
// Mom + Dad = baby! One copy of each gene from each parent.
function inheritGenes(kind, momG, dadG, sex) {
  const G = {};
  for (const L of lociOf(kind)) {
    const m = (momG && momG[L.id]) || [L.wild], d = (dadG && dadG[L.id]) || [L.wild, L.wild];
    const fromDad = pick(d);
    if (L.z) G[L.id] = isMaleSex(sex) ? [fromDad, m[0]] : [fromDad];   // Mom gives her Z to sons only
    else G[L.id] = [pick(m), fromDad];
    if (L.type === "num") G[L.id] = G[L.id].map((x) => x * rand(0.98, 1.02));   // tiny natural differences
  }
  return G;
}
// Check genes from a save: fill in anything missing, drop anything odd
function cleanGeno(kind, G, sex) {
  const out = {}, wildG = genesFor(kind, null, sex);
  for (const L of lociOf(kind)) {
    let v = G && G[L.id];
    const need = L.z && !isMaleSex(sex) ? 1 : 2;
    const ok = Array.isArray(v) && v.length >= 1 && v.length <= 2 &&
      v.every((a) => (L.type === "num" ? typeof a === "number" && isFinite(a) : L.alleles.includes(a)));
    if (ok && v.length !== need) v = need === 1 ? [v[0]] : [v[0], v[0]];
    out[L.id] = ok ? (L.type === "num" ? v.map((a) => clamp(a, 0, 5)) : v.slice()) : wildG[L.id];
  }
  return out;
}

// Reading genes
const locusOf = (kind, id) => lociOf(kind).find((L) => L.id === id);
function gDom(kind, G, id) {             // the allele that shows
  const L = locusOf(kind, id), v = G[id];
  for (const a of L.alleles) if (v.includes(a)) return a;
  return L.wild;
}
const gCount = (kind, G, id) => G[id].filter((a) => a !== locusOf(kind, id).wild).length;   // copies of the special one
const gNum = (G, id) => G[id].reduce((s, x) => s + x, 0) / G[id].length;
const gHas = (G, id, a) => G[id].includes(a);
const gAll = (G, id, a) => G[id].every((x) => x === a);

// Kid-friendly list of a bird's special genes: what shows, and what it secretly carries
function geneChips(c) {
  const kind = kindOf(c), G = genoOf(c), out = [];
  // e.g. "Blue · Bl/bl⁺" (a girl's Z-chromosome genes show as "S/–")
  const code = (L, v) => (L.sym && v.every((a) => L.sym[a]) ? ` · ${v.map((a) => L.sym[a]).join("/")}${v.length === 1 ? "/–" : ""}` : "");
  for (const L of lociOf(kind)) {
    if (L.type === "num" || L.type === "blend") continue;
    const v = G[L.id];
    if (L.type === "inc") {
      const n = gCount(kind, G, L.id);
      if (n) out.push({ text: L.say[n] + code(L, v), shows: true });
      continue;
    }
    const shown = gDom(kind, G, L.id);
    if ((shown !== L.wild || L.always) && L.say[shown]) out.push({ text: L.say[shown] + code(L, v), shows: true });
    for (const a of new Set(v)) {
      if (a === shown || !L.say[a] || (a === L.wild && !L.always)) continue;
      out.push({ text: `carries ${L.say[a]}${L.sym && L.sym[a] ? ` · ${L.sym[a]}` : ""}`, shows: false });
    }
  }
  const size = gNum(G, "size");
  if (size < 0.7) out.push({ text: "Bantam (tiny)", shows: true });
  else if (size > 1.18) out.push({ text: "Extra big", shows: true });
  if (G.lay && gNum(G, "lay") > 1.18) out.push({ text: "Super layer", shows: true });
  if (G.upright && gNum(G, "upright") > 0.6) out.push({ text: "Stands tall", shows: true });
  return out;
}

// ---------- From genes to looks ----------
// Each kind of bird has a "look" function: give it genes, and it says
// what colors and features the bird has. The painting code (section 13)
// then draws exactly that.
const dk = (c, t = 0.3) => mixHex(c, "#000000", t);   // a darker version of a color
const lt = (c, t = 0.35) => mixHex(c, "#FFFFFF", t);  // a lighter version

function chickenLook(G, male) {
  const K = "chicken";
  const base = gDom(K, G, "base"), tone = gDom(K, G, "tone");
  const silver = gHas(G, "silver", "S"), barN = gCount(K, G, "bar");
  const domW = gCount(K, G, "domW"), recWhite = gAll(G, "recW", "c");
  const blueN = gCount(K, G, "blue"), lav = gAll(G, "lav", "lav"), choc = gAll(G, "choc", "ch");
  const pat = gDom(K, G, "pat"), dark = base === "E" || base === "ER";
  const white = domW === 2 || recWhite, splash = blueN === 2;

  // A chicken has two kinds of color: "black" and "red".
  // Other genes change what those two colors look like.
  let blk = choc ? "#5B3A29" : "#26272D";
  if (lav) blk = choc ? "#CDBBA8" : "#B9B4C4";
  if (blueN === 1) blk = lav ? "#D3D0DA" : choc ? "#9C8474" : "#6F7F95";
  const blkShow = splash ? "#8494AA" : blk;           // what the black parts look like
  let red = { Mh: "#9A3A1E", n: "#C1662E", di: "#E7B454" }[tone];
  if (silver) red = "#F3F1EC";                         // silver turns red into white
  if (lav) red = mixHex(red, "#FFF4DC", 0.55);

  let body, wing, neck, hackle, tail, pattern = null, mark = blkShow, markA = 0.78;
  if (white) {
    body = wing = neck = hackle = tail = "#FBFAF6";
  } else if (dark) {
    body = wing = tail = neck = hackle = splash ? "#ECEBEF" : blk;
    if (base === "ER") { hackle = silver ? "#F0EEE8" : lt(red, 0.1); neck = male ? hackle : mixHex(body, hackle, 0.6); }
    if (barN && !splash) {
      body = wing = "#E9E7E2"; tail = mixHex(blk, "#FFFFFF", 0.45);
      if (base !== "ER") neck = hackle = "#DAD7D0";
      pattern = "barred"; mark = blk; markA = barN === 2 ? 0.6 : 0.8;   // boys have 2 copies, so they're lighter
    } else if (splash) pattern = "splash";
    else if (pat === "mot") { pattern = "mottled"; mark = "#FFFFFF"; }
    else if (blueN === 1) { pattern = "laced"; mark = dk(blk, 0.35); markA = 0.55; }   // blue birds have darker edges
    // black birds hiding a red gene often "leak" a little red on the neck (like Black Stars)
    if (base === "E" && !barN && !splash && !silver && G.base.some((a) => a === "R" || a === "p")) { neck = mixHex(neck, red, 0.35); hackle = mixHex(hackle, red, 0.5); }
  } else {
    if (base === "R") { body = wing = neck = red; hackle = lt(red, 0.12); tail = blkShow; }
    else if (male) {        // wild colors: black chest, red back, golden neck
      body = splash ? "#ECEBEF" : blk; wing = silver ? "#E9E7E2" : dk(red, 0.05);
      hackle = neck = silver ? "#F3F1EC" : lt(red, 0.25); tail = blkShow;
    } else {                // wild-colored hens are brown with fine lines ("pencilling")
      body = wing = silver ? (tone === "di" ? "#E8C4AE" : "#A9A6A0") : mixHex(red, "#5A3A22", 0.4);
      neck = hackle = silver ? "#F0EEE8" : lt(red, 0.2); tail = blkShow;
      pattern = "pencil"; mark = dk(body, 0.35); markA = 0.5;
    }
    if (pat === "col") {    // Columbian: light body, black-striped neck, black tail
      body = wing = red; pattern = null;
      neck = mixHex(blkShow, red, 0.35); hackle = mixHex(blkShow, lt(red, 0.1), 0.45); tail = blkShow;
    } else if (pat === "lace") { pattern = "laced"; mark = blkShow; markA = 0.72; }
    else if (pat === "dlace") { pattern = "dlaced"; mark = blkShow; }
    else if (pat === "spang") { pattern = "spangled"; mark = blkShow; }
    else if (pat === "mot") { pattern = "dots"; mark = blkShow; }
    if (barN) { pattern = "barred"; mark = blkShow; markA = barN === 2 ? 0.42 : 0.58; body = lt(body, 0.35); wing = lt(wing, 0.35); }
  }
  if (domW === 1 && !recWhite) {     // one dominant-white gene: white with little specks
    body = wing = neck = "#F6F4EE"; hackle = dark ? "#F6F4EE" : lt(red, 0.55); tail = "#EDEAE3";
    pattern = "flecks"; mark = dark ? blkShow : mixHex(red, "#FFFFFF", 0.2); markA = 0.7;
  }
  const L = {
    species: "chicken", body, shade: dk(body, 0.28), light: lt(body, 0.4), wing, neck, hackle, tail, tail2: lt(tail, 0.14),
    pattern, mark, markA,
  };

  // Face, comb, beak and legs
  const skinDark = gHas(G, "skin", "Fm");
  const rose = gHas(G, "rose", "Rc"), pea = gHas(G, "pea", "Pc");
  L.combType = rose && pea ? "walnut" : rose ? "rose" : pea ? "pea" : gHas(G, "vcomb", "D") ? "v" : "single";
  L.combSize = clamp(gNum(G, "combSize"), 0.6, 1.6);
  L.comb = skinDark ? (dark && !white ? "#2A2230" : "#5B4E6E") : "#E03A2F";
  const lobeN = gCount(K, G, "lobe");
  L.earlobe = lobeN === 2 ? "#F3EFE6" : lobeN === 1 ? "#F2C8C0" : skinDark ? "#6FA8C8" : L.comb;
  if (skinDark) L.face = dark && !white ? "#1E1A22" : "#4B3F63";
  const yellow = gAll(G, "skinY", "w");
  const darkShank = dark && !barN && !white && domW === 0;
  L.legs = skinDark ? "#3E3A48" : darkShank ? (yellow ? "#4E5A3E" : "#4F4E55") : yellow ? "#E8B84A" : "#E9D6C0";
  L.beak = skinDark ? "#3A3642" : darkShank ? "#3D3B3A" : yellow ? "#E8B84A" : "#E3D2A6";

  // Feathers and fancy features
  L.silkie = gAll(G, "silkie", "h");
  L.frizzle = gCount(K, G, "frizzle");
  L.naked = gCount(K, G, "naked");
  L.crest = gCount(K, G, "crest");
  L.crestColor = gHas(G, "wcrest", "Wc") ? "#FFFFFF" : L.silkie ? body : lt(neck, 0.05);
  L.muffs = gHas(G, "beard", "Mb") ? lt(neck, 0.15) : null;
  L.featherFeet = gHas(G, "feet", "Pti");
  L.toes5 = gHas(G, "toes", "Po");
  L.rumpless = gHas(G, "rump", "Rp");
  L.tufts = gHas(G, "tufts", "Et") ? lt(neck, 0.1) : null;
  L.henny = gHas(G, "henny", "Hf");
  L.longTail = gAll(G, "longTail", "gt");
  L.tailK = L.longTail ? 1.9 : 1;
  L.fluffy = clamp(gNum(G, "fluff"), 0, 0.35);
  L.size = clamp(gNum(G, "size"), 0.35, 1.4);
  L.layBoost = clamp(gNum(G, "lay"), 0.7, 1.4);
  L.pitch = clamp(1.25 - L.size * 0.25, 0.85, 1.2);   // little bantams have squeaky voices

  // Chick fuzz (sex-link chicks show boy or girl right here!)
  let chick, spot = null, stripe = null;
  if (white) chick = recWhite ? "#FFF1A8" : "#FFF6C8";
  else if (domW === 1) chick = "#FFF6D0";
  else if (dark) {
    chick = splash ? "#E6E6EA" : blueN ? "#8E96A2" : lav ? "#C9C4D0" : choc ? "#6B4A38" : "#2C2C31";
    if (barN || pat === "mot") spot = "#F4F1E6";
    if (base === "ER") stripe = "#C9A06A";
  } else if (base === "R" || pat === "col") chick = silver ? "#FFF6DC" : tone === "Mh" ? "#E3A060" : tone === "n" ? "#E9B86A" : "#FBE08B";
  else { chick = silver ? "#CFC8B8" : "#C9A06A"; stripe = silver ? "#7C776D" : "#6E4A2A"; }
  if (barN && !dark) { chick = lt(chick, 0.25); spot = "#F4F1E6"; }
  L.chick = chick;
  if (stripe) L.chickStripe = stripe; else if (spot) L.chickSpot = spot;
  L.chickSpotBig = barN === 2;
  L.egg = chickenEgg(G);
  return L;
}
// Egg color: the blue gene makes the shell blue all the way through, and
// brown genes paint brown on the outside. Blue + brown = green or olive!
function chickenEgg(G) {
  const blue = gHas(G, "blueEgg", "O");
  const lv = clamp(gNum(G, "brownEgg"), 0, 4);
  const plain = [["White", "#F8F4EA"], ["Cream", "#F1E4CC"], ["Light brown", "#D8B58C"], ["Brown", "#B98256"], ["Chocolate", "#6B3E23"]];
  const blues = [["Blue", "#9FD3CE"], ["Mint", "#BFE0C4"], ["Green", "#A9BF7E"], ["Olive", "#8E9A5C"], ["Dark olive", "#6E7A44"]];
  // a little brown on a blue egg goes a long way toward green and olive
  const i = blue ? (lv < 0.6 ? 0 : lv < 1.3 ? 1 : lv < 1.9 ? 2 : lv < 3.1 ? 3 : 4) : Math.round(lv);
  const [name, color] = (blue ? blues : plain)[i];
  return { name, color, speckle: gHas(G, "speckEgg", "Sp") || (!blue && lv > 3.4) };
}

function duckLook(G, male) {
  const K = "duck", base = gDom(K, G, "base"), blueN = gCount(K, G, "blue");
  const brown = gAll(G, "brown", "d"), white = gAll(G, "white", "c"), bib = gDom(K, G, "bib"), harl = gAll(G, "harl", "hq");
  // brown, blue and harlequin genes all change the colors a little
  const dil = (col) => {
    let x = col;
    if (brown && blueN === 1) return mixHex(x, "#D9B27C", 0.8);   // brown + blue together make buff!
    if (brown) x = mixHex(x, "#B08A5A", 0.55);
    if (blueN === 1) x = mixHex(x, "#6E7F96", 0.6);
    if (blueN === 2) x = mixHex(x, "#DCE2EA", 0.8);
    if (harl) x = mixHex(x, "#F2EEE4", 0.45);
    return x;
  };
  let L;
  if (base === "E") {
    const b = dil("#23272A");
    L = { body: b, wing: b, tail: b, neck: b, head: male ? dil("#1E4A34") : b, headLight: male ? dil("#3A7A5A") : lt(b, 0.2), bill: male ? "#3A4A32" : "#3A3A3A", feet: "#2E2E30" };
  } else if (base === "M" && male) {      // a mallard drake: green head, white ring, chestnut chest
    L = { body: dil("#BDB8AF"), wing: dil("#8C8378"), tail: "#2C2C30", neck: dil("#1F6B3A"), head: dil("#1B5E34"), headLight: dil("#3FA36A"),
      ring: "#FFFFFF", chest: dil("#7A4A2E"), bill: brown ? "#B8B85A" : "#D9CB4A", feet: "#F09A3A" };
  } else if (base === "M") {              // mallard ducks (girls) are brown and speckly, to hide on nests
    L = { body: dil("#A4815A"), wing: dil("#8C6A48"), tail: dil("#7A5A3A"), neck: dil("#9C7A56"), head: dil("#8E6E4E"), headLight: dil("#B89A76"),
      bill: "#C98A3A", feet: "#F09A3A", scallop: dil("#5A3E26"), stripe: dil("#4A3420") };
  } else if (male) {                      // dusky drakes
    L = { body: dil("#6E6254"), wing: dil("#5E5448"), tail: dil("#3A3430"), neck: dil("#3A3A2E"), head: dil("#3A3A2E"), headLight: dil("#5A5A44"),
      chest: dil("#5A4232"), bill: "#6E7A3A", feet: "#D8883A" };
  } else {
    L = { body: dil("#5E4E3E"), wing: dil("#4E4234"), tail: dil("#4A3E32"), neck: dil("#5E4E3E"), head: dil("#54463A"), headLight: dil("#6E5E4E"),
      bill: "#4E4A3A", feet: "#B8783A", scallop: dil("#3A2E22") };
  }
  if (base !== "E") L.speculum = brown ? "#6A7FB8" : "#3F5FD8";
  L.shade = dk(L.body, 0.25); L.light = lt(L.body, 0.3);
  if (male) L.curl = dk(L.tail, 0.4);      // only drakes have the little curly tail feather!
  if (bib === "bib") L.bib = "#F4F2EC";
  if (bib === "mag") {                     // magpie & runner pattern: white with a colored cap and back
    L.cap = L.head; L.back = L.body;
    L.body = L.neck = L.head = L.headLight = "#F6F4EE"; L.wing = "#EEEAE0"; L.chest = null; L.ring = null; L.scallop = null;
    L.shade = "#DCD8D0"; L.light = "#FFFFFF";
  }
  if (white) {
    Object.assign(L, { body: "#FFFDF4", shade: "#E4DCC8", light: "#FFFFFF", wing: "#F2ECDD", tail: "#EFE8D6", neck: "#FFFDF4", head: "#FFFDF4", headLight: "#FFFFFF",
      bill: "#F2A93B", feet: "#F2A93B", chest: null, ring: null, speculum: null, scallop: null, stripe: null, cap: null, back: null, bib: null });
    if (male) L.curl = "#E4DCC8";
  }
  const cr = gCount(K, G, "crest");
  if (cr) { L.crest = cr; L.crestColor = L.cap || L.head; }
  L.species = "duck";
  L.upright = clamp(gNum(G, "upright"), 0, 1);
  L.size = clamp(gNum(G, "size"), 0.5, 1.4);
  L.layBoost = clamp(gNum(G, "lay"), 0.6, 1.5);
  L.chick = white ? "#FFE27A" : base === "E" ? "#2A2B2E" : blueN ? "#4D5566" : brown ? "#C9B07A" : "#E6C766";
  if (base === "E" || blueN) L.chickSpot = "#F2D56A"; else if (!white) L.chickStripe = "#6E5530";
  L.egg = gHas(G, "darkEgg", "Cu") ? { name: "Gray", color: "#6E7478" } : gHas(G, "blueEgg", "O") ? { name: "Blue-green", color: "#C3E3D6" } : { name: "Duck", color: "#F6F2E6" };
  return L;
}

function muscovyLook(G, male) {
  const K = "muscovy", blueN = gCount(K, G, "blue"), choc = gAll(G, "choc", "ch"), white = gAll(G, "white", "c"), pied = gCount(K, G, "pied");
  let d = choc ? "#5A3E2E" : "#1E2624";
  if (blueN === 1) d = "#5E6A7A";
  if (blueN === 2) d = "#C8CED8";
  const col = white ? "#FAF8F2" : d;
  const L = {
    species: "duck", body: col, shade: dk(col, 0.3), light: lt(col, 0.3), wing: col, tail: col, neck: col, head: col, headLight: lt(col, 0.25),
    bill: "#F2C8B8", feet: white ? "#F2B880" : "#3A3A3A", caruncle: "#C8322E", caruncleK: male ? 1.3 : 0.7,
    size: clamp(gNum(G, "size"), 0.7, 1.4), layBoost: clamp(gNum(G, "lay"), 0.6, 1.4),
  };
  if (!white && pied === 1) L.wingPatch = "#FFFFFF";
  if (!white && pied === 2) { L.cap = col; L.back = col; L.body = L.neck = L.head = L.headLight = "#F6F4EE"; L.wing = "#EEEAE0"; L.shade = "#DCD8D0"; L.light = "#FFFFFF"; }
  L.chick = white ? "#F4E68A" : "#E6D06A";
  if (!white) L.chickSpot = dk(col, 0.1);
  L.egg = { name: "Duck", color: "#F4F0E4" };
  return L;
}
// A mule duck (Mulard): half duck, half Muscovy. Big and friendly, but it can't have babies.
function muleLook(G, male) {
  return {
    species: "duck", body: "#F6F4EE", shade: "#DCD8D0", light: "#FFFFFF", wing: "#EEEAE0", tail: "#E8E4DA", neck: "#F6F4EE", head: "#F6F4EE", headLight: "#FFFFFF",
    cap: "#2A2E2C", back: "#3A3E3A", bill: "#E8B060", feet: "#E8A050", caruncle: "#D8604A", caruncleK: 0.4, curl: male ? "#DCD8D0" : null,
    size: clamp(gNum(G, "size"), 0.9, 1.4), layBoost: 1, chick: "#F2DC7A", chickSpot: "#3A3E3A", egg: { name: "Duck", color: "#F4F0E4" },
  };
}

function gooseLook(G, male) {
  const K = "goose", sdN = gCount(K, G, "sd"), white = gAll(G, "white", "c"), buff = gAll(G, "buff", "g");
  const saddle = gAll(G, "saddle", "sb"), knob = gCount(K, G, "knob");
  let base = buff ? "#C9A06A" : knob ? "#9C8A70" : "#8E8C86";   // gray; brown if it has knob (swan goose) genes
  if (sdN === 1) base = lt(base, 0.5);
  if (sdN >= 2) base = "#F4F3EE";
  const L = { species: "goose", body: base, shade: dk(base, 0.25), light: lt(base, 0.35), wing: dk(base, 0.12), tail: dk(base, 0.2), neck: base, head: dk(base, 0.1), bill: "#E0823B", feet: "#E0823B" };
  if (knob) {
    L.neck = lt(base, 0.4); L.neckStripe = dk(base, 0.35);
    L.bill = "#2A2A2E"; L.knob = "#2A2A2E"; L.knobK = knob === 2 ? 1 : 0.55;
  }
  if (sdN === 1) L.face = "#FFFFFF";          // Pilgrim geese (girls) have a white face
  if (saddle && !white) {
    L.back = base; L.body = "#FBFAF4"; L.shade = "#DCD6C8"; L.light = "#FFFFFF";
  }
  if (white) {
    Object.assign(L, { body: "#FBFAF4", shade: "#DCD6C8", light: "#FFFFFF", wing: "#EDE8DC", tail: "#E7E1D3", neck: "#FBFAF4", head: "#FBFAF4",
      bill: "#F2913B", feet: "#F2913B", neckStripe: null, face: null, back: null });
    if (knob) L.knob = "#F2913B";
  }
  if (gHas(G, "dewlap", "Dw")) L.dewlap = L.neck;
  L.curly = gCount(K, G, "curl");
  L.size = clamp(gNum(G, "size"), 0.7, 1.45);
  L.layBoost = clamp(gNum(G, "lay"), 0.5, 1.5);
  L.chick = white ? "#EFD98A" : buff ? "#D8C08A" : knob ? "#B8A46A" : sdN === 2 ? "#EFE8C0" : sdN ? "#B8B49A" : "#8E8A66";   // Pilgrim boys hatch yellow, girls gray
  L.egg = { name: "Goose", color: "#FBF9F1" };
  return L;
}

function swanLook(G, male) {
  const K = "swan", bN = gCount(K, G, "black"), kn = gCount(K, G, "knob"), polish = gAll(G, "polish", "pl");
  const col = bN === 2 ? "#26262C" : bN === 1 ? "#8A8580" : "#FFFFFF";
  const L = {
    species: "goose", swan: true, body: col, shade: bN ? dk(col, 0.3) : "#DCDDE2", light: bN ? lt(col, 0.25) : "#FFFFFF",
    wing: bN ? lt(col, 0.05) : "#F3F3F6", tail: bN ? col : "#E8E8EC", neck: col, head: col, feet: polish ? "#C8B8B0" : bN === 2 ? "#2A2A30" : "#3A3A40",
  };
  if (bN) L.wingTip = "#F4F4F6";
  const BILL = { or: "#F07A2E", rd: "#D8303A", bk: "#26262A" };
  L.bill = mixHex(BILL[G.bill[0]], BILL[G.bill[1]], 0.5);
  if (G.bill.includes("rd")) L.band = "#FFFFFF";
  if (kn) { L.knob = "#1E1E22"; L.knobK = kn === 2 ? (male ? 1.15 : 0.9) : 0.5; }
  L.size = clamp(gNum(G, "size"), 0.8, 1.3);
  L.chick = polish ? "#F6F4EE" : bN === 2 ? "#8E8E96" : "#B9BCC4";
  L.egg = { name: "Swan", color: bN ? "#D4E2CE" : "#E3EBDD" };
  return L;
}

function quailLook(G, male) {
  const K = "quail", gold = gCount(K, G, "gold"), darkN = gCount(K, G, "dark"), white = gAll(G, "white", "wh"), tux = gAll(G, "tux", "s");
  let body = "#9C7A55", shade = "#6A4E34", light = "#C9A77E", wing = "#7E6044", head = "#8A6A48";
  const shift = (to, t) => { body = mixHex(body, to, t); shade = mixHex(shade, dk(to, 0.3), t); light = mixHex(light, lt(to, 0.3), t); wing = mixHex(wing, to, t); head = mixHex(head, to, t); };
  if (gold) shift("#D8B070", gold === 2 ? 0.85 : 0.5);
  if (darkN) shift(darkN === 2 ? "#4A3226" : "#8E4A2E", darkN === 2 ? 0.8 : 0.55);
  const L = {
    species: "quail", body, shade, light, wing, head, brow: "#F2E6CC", legs: "#E8B8A0", pattern: "streak",
    breast: male ? mixHex(body, "#C4622A", 0.55) : lt(body, 0.35), breastSpots: male ? null : dk(body, 0.45),   // girls have a spotty chest
    chick: gold ? "#F0D48A" : darkN ? "#6E4A36" : "#C9A77E",
  };
  if (darkN < 2) L.chickStripe = "#6A4E34";
  if (tux) { L.belly = "#F6F2EA"; L.breast = "#F6F2EA"; L.breastSpots = null; }
  if (white) Object.assign(L, { body: "#F6F2EA", shade: "#DAD4C8", light: "#FFFFFF", wing: "#EEE8DC", head: "#F6F2EA", pattern: null, brow: null,
    breast: null, breastSpots: null, belly: null, legs: "#F2C8B8", chick: "#FFF1C8", chickStripe: null });
  L.size = clamp(gNum(G, "size"), 0.7, 1.45);
  L.layBoost = clamp(gNum(G, "lay"), 0.7, 1.3);
  L.egg = gAll(G, "celadon", "ce") ? { name: "Blue", color: "#BFDCE0" } : { name: "Speckled", color: "#EFE3C8", blotch: true };
  return L;
}
function calQuailLook(G, male) {
  const L = male
    ? { body: "#7C8A9C", shade: "#55606E", light: "#A6B2C0", wing: "#8C7658", head: "#7E6B56", breast: "#6F8096", belly: "#E8D6B0", face: "#1E1E22", plume: "#1E1E22", plumeK: 1 }
    : { body: "#8C8478", shade: "#5E574E", light: "#B0A89C", wing: "#8C7658", head: "#8C8070", breast: "#8C8478", belly: "#E0D2B4", plume: "#5E5046", plumeK: 0.6 };
  return Object.assign(L, { species: "quail", legs: "#8E8C94", pattern: "scaled", chick: "#C9B08A", chickStripe: "#6E5530",
    size: clamp(gNum(G, "size"), 0.8, 1.2), egg: { name: "Speckled", color: "#EFE6CF", blotch: true } });
}
function bobwhiteLook(G, male) {
  const L = { species: "quail", body: "#9C6A42", shade: "#6A4428", light: "#C99A6A", wing: "#8A6E4E", head: "#6E4A30", breast: "#C98A5A", belly: "#F2E8D6",
    face: male ? "#1E1E22" : "#D8B888", brow: male ? "#FFFFFF" : "#E8D0A0", legs: "#C9A48A", pattern: "scaled", chick: "#B89868", chickStripe: "#6E5530" };
  if (gAll(G, "snow", "sn")) Object.assign(L, { body: "#F4F2EE", shade: "#D8D4CC", light: "#FFFFFF", wing: "#ECE8E0", head: "#F4F2EE", breast: "#F4F2EE", belly: "#FFFFFF",
    face: male ? "#8E8E96" : "#E8E4DC", brow: "#FFFFFF", chick: "#F4EEDA", chickStripe: null });
  L.size = clamp(gNum(G, "size"), 0.8, 1.2);
  L.egg = { name: "White", color: "#F8F6F0" };
  return L;
}

function guineaLook(G, male) {
  const K = "guinea", pearl = gHas(G, "pearl", "P"), lav = gAll(G, "lav", "lv"), white = gAll(G, "white", "c"), buff = gAll(G, "buff", "br");
  let body = "#4B4F5C";                                  // "pearl" gray, the wild color
  if (lav) body = "#8E94A8";
  if (buff) body = lav ? "#D8C8B0" : "#B8946A";
  if (!pearl) body = lav ? "#6A5E7E" : "#3A2E48";        // "royal purple": no polka dots
  const L = {
    species: "guinea", body, shade: dk(body, 0.3), light: lt(body, 0.25), dot: pearl ? "#FFFFFF" : null,
    face: "#DCEAF5", wattle: "#D8473A", casque: "#9C6A3E", beak: "#E9D8B4", legs: "#6E6A6E",
    wattleK: male ? 1.5 : 0.9, casqueK: male ? 1.15 : 0.95, pied: gCount(K, G, "pied"),
  };
  if (white) Object.assign(L, { body: "#F6F4EE", shade: "#DCD8D0", light: "#FFFFFF", dot: null, legs: "#E8B880", beak: "#F2D8A8", pied: 0 });
  L.chick = white ? "#FFF0D0" : buff ? "#E0C090" : !pearl ? "#6E5A48" : lav ? "#C8B8A8" : "#B89868";
  if (!white) L.chickStripe = "#6E5530";
  L.size = clamp(gNum(G, "size"), 0.8, 1.2);
  L.egg = { name: "Speckled tan", color: "#DCC39C", speckle: true };
  return L;
}

function pheasantLook(G, male) {
  const K = "pheasant", mel = gCount(K, G, "mel"), white = gAll(G, "white", "c"), fawn = gAll(G, "fawn", "fw"), ring = gHas(G, "ring", "Rg");
  let L;
  if (male) {   // cock pheasants are the colorful ones
    L = { body: "#B8642E", shade: "#7A3A18", light: "#E08A48", wing: "#8E6A4A", tail: "#9C7A50", bars: "#4A3420", neck: "#1E5A4A", head: "#2A3A7A", headLight: "#4A6AB4",
      ring: ring ? "#FFFFFF" : null, wattle: "#D8303A", ear: "#1E5A4A", beak: "#E6D6A8", legs: "#9A9086", tailK: 1 };
    if (fawn) Object.assign(L, { body: "#D8B888", shade: "#A88A5E", light: "#F2DDB8", wing: "#C8B08A", tail: "#C8B08A", head: "#6E8A7A", headLight: "#9AB0A0", neck: "#8AA89A", ear: "#6E8A7A" });
  } else {      // hens are brown so they can hide on their nests
    L = { body: "#A58A62", shade: "#6E5A3E", light: "#C9B08A", wing: "#8E7452", tail: "#9C8260", bars: "#5A4632", neck: "#B09670", head: "#A08A68", headLight: "#C0A882",
      beak: "#C9B89A", legs: "#9A9086", tailK: 0.6, scallop: "#5A4632" };
    if (fawn) Object.assign(L, { body: "#E0CCA6", shade: "#B8A07A", light: "#F4E6C8", wing: "#D0BA92", tail: "#D8C29C", neck: "#E4D2AE", head: "#DCC8A2" });
  }
  if (mel) {
    const t = mel === 2 ? 0.85 : 0.45;
    for (const k of ["body", "shade", "light", "wing", "tail", "neck", "head", "headLight"]) L[k] = mixHex(L[k], male ? "#23283A" : "#3A3028", t);
    if (mel === 2) L.ring = null;
  }
  if (white) Object.assign(L, { body: "#F8F6F0", shade: "#DCD8CE", light: "#FFFFFF", wing: "#EEEAE0", tail: "#F2EEE6", bars: "#D8D2C6", neck: "#F8F6F0",
    head: "#F8F6F0", headLight: "#FFFFFF", ring: null, ear: null, scallop: null });
  L.species = "pheasant";
  L.size = clamp(gNum(G, "size"), 0.8, 1.25);
  L.chick = white ? "#FFF4D6" : mel ? "#5A4A3A" : "#C9A77E";
  if (!white) L.chickStripe = "#6A4E34";
  L.egg = { name: "Olive-brown", color: "#A5956C" };
  return L;
}
function ruffedLook(G, male) {
  const K = "ruffed", a = gCount(K, G, "amherst") / 2, yel = gAll(G, "yellow", "yg"), dt = gHas(G, "dark", "Dt");
  let L;
  if (male) {
    const Gd = { body: "#D8342A", shade: "#9C1E18", light: "#FF5A40", wing: "#2F4FA8", tail: "#B89048", bars: "#4A3420", neck: "#F2A33A", head: "#F2C14E",
      headLight: "#FFE27A", crest: "#FFD23A", cape: "#F28A2E", capeBar: "#1E1E22", beak: "#F2C14E", legs: "#C9A87A" };
    const Am = { body: "#F4F2EE", shade: "#C8C4BC", light: "#FFFFFF", wing: "#2F5F8A", tail: "#F2EFE8", bars: "#1E1E22", neck: "#2E6E4A", head: "#2E6E4A",
      headLight: "#4A9A6A", crest: "#C8302A", cape: "#FFFFFF", capeBar: "#1E1E22", beak: "#A8B0A0", legs: "#8E96A0" };
    L = {};
    for (const k in Gd) L[k] = mixHex(Gd[k], Am[k], a);   // Lady Amherst genes turn golden colors into white & green
    L.tailK = lerp(1.25, 1.7, a);
    if (yel) for (const k of ["body", "shade", "light"]) L[k] = mixHex(L[k], { body: "#F4C84A", shade: "#C89A2A", light: "#FFE27A" }[k], 0.8 * (1 - a));
    if (dt) L.neck = mixHex(L.neck, "#2A1E14", 0.6);
  } else {
    const b = mixHex("#A07A4E", "#7E5A3E", a);
    L = { body: b, shade: dk(b, 0.3), light: lt(b, 0.3), wing: dk(b, 0.1), tail: b, bars: "#3A2A1A", neck: lt(b, 0.1), head: lt(b, 0.1), headLight: lt(b, 0.25),
      beak: "#B8A88A", legs: a > 0.5 ? "#8E96A0" : "#C9A87A", tailK: 0.75, scallop: "#3A2A1A" };
    if (yel) for (const k of ["body", "light", "neck", "head"]) L[k] = lt(L[k], 0.3);
    if (dt) for (const k of ["body", "shade", "wing", "neck"]) L[k] = dk(L[k], 0.25);
  }
  L.species = "pheasant";
  L.size = clamp(gNum(G, "size"), 0.8, 1.2);
  L.chick = "#C9A77E"; L.chickStripe = "#6A4E34";
  L.egg = { name: "Cream", color: "#EEDDB8" };
  return L;
}
function silverPhLook(G, male) {
  const L = male
    ? { body: "#F4F4F2", shade: "#C8C8C6", light: "#FFFFFF", wing: "#F0F0EE", tail: "#F4F4F2", bars: "#8E8E92", neck: "#F4F4F2", head: "#1E1E22", headLight: "#3A3A42",
      crest: "#1E1E22", wattle: "#D8303A", breast: "#1E1E22", scallop: "#1E1E22", beak: "#D8D2C0", legs: "#D8303A", tailK: 1.2 }
    : { body: "#8A6A4A", shade: "#5E462E", light: "#A8886A", wing: "#7A5E42", tail: "#8A6A4A", bars: "#5A4430", neck: "#8A6A4A", head: "#7A5E42", headLight: "#9A7E62",
      crest: "#6E5238", wattle: "#C8403A", scallop: "#4A3624", beak: "#C9B89A", legs: "#D8605A", tailK: 0.7 };
  return Object.assign(L, { species: "pheasant", size: clamp(gNum(G, "size"), 0.8, 1.2), chick: "#B89868", chickStripe: "#6A4E34", egg: { name: "Cream", color: "#EEE2C8" } });
}
function reevesLook(G, male) {
  const L = male
    ? { body: "#D8A040", shade: "#9C6A1E", light: "#F2C870", wing: "#C89A4A", tail: "#E8E0D0", bars: "#8E5A2E", neck: "#FFFFFF", head: "#FFFFFF", headLight: "#FFFFFF",
      mask: "#1E1E22", breast: "#8E3A1E", wattle: "#D8303A", scallop: "#1E1E22", beak: "#D8D0B8", legs: "#9A9086", tailK: 3 }
    : { body: "#A07A50", shade: "#6E5234", light: "#C09A70", wing: "#8E6A44", tail: "#A08260", bars: "#5A4430", neck: "#C8A878", head: "#C8A878", headLight: "#DCC09A",
      scallop: "#5A4430", beak: "#C9B89A", legs: "#9A9086", tailK: 0.9 };
  return Object.assign(L, { species: "pheasant", size: clamp(gNum(G, "size"), 0.8, 1.25), chick: "#C9A77E", chickStripe: "#6A4E34", egg: { name: "Olive-brown", color: "#A8946A" } });
}

function turkeyLook(G, male) {
  const K = "turkey", base = gDom(K, G, "base"), narr = gAll(G, "narr", "n"), white = gAll(G, "white", "c"), sl = gCount(K, G, "slate"), palm = gAll(G, "palm", "cp");
  const L = { body: "#5A4432", shade: "#2E2218", light: "#8A6A48", sheen: "#4E7A5E", wing: "#6E5A46", wingBar: "#F4EFE6", tail: "#5A4432", tailBand: "#E6D6B8",
    neck: "#B89CA0", head: "#9CC8E8", wattle: "#D8303A", beard: "#1E1A16", beak: "#E6D8B8", legs: "#D9A89A" };
  if (base === "B") Object.assign(L, { body: "#1E1E22", shade: "#0E0E12", light: "#3A3A44", sheen: "#3A5A4A", wing: "#26262C", wingBar: null, tail: "#1E1E22", tailBand: "#2A2A2E", legs: "#8A6A6A" });
  else if (base === "b") Object.assign(L, { body: "#8E3A22", shade: "#5A2212", light: "#B8603A", sheen: "#A04A2A", wing: "#F2EEE6", wingBar: "#8E3A22", tail: "#F2EEE6", tailBand: "#B8603A" });
  if (narr && base !== "B") Object.assign(L, { body: "#4A4A4E", shade: "#26262A", light: "#C9C9CC", sheen: "#6A6A70", wing: "#8E8E92", wingBar: "#F6F6F4", tail: "#6E6E72", tailBand: "#E6E6E0" });
  if (sl) {
    const to = sl === 2 ? "#B8C0CC" : "#6F7A8A";
    for (const k of ["body", "shade", "light", "wing", "tail"]) L[k] = mixHex(L[k], k === "shade" ? dk(to, 0.3) : k === "light" ? lt(to, 0.3) : to, 0.75);
    L.sheen = "#8A96A8";
  }
  if (palm) Object.assign(L, { body: "#F6F4EE", shade: "#D8D4CC", light: "#FFFFFF", sheen: "#FFFFFF", wing: "#F6F4EE", wingBar: "#1E1E22", tail: "#F6F4EE", tailBand: "#1E1E22", palm: "#1E1E22" });
  if (white) Object.assign(L, { body: "#FBFAF6", shade: "#DCD8CE", light: "#FFFFFF", sheen: "#FFFFFF", wing: "#F4F2EC", wingBar: null, tail: "#FBFAF6", tailBand: "#F2EEE6", palm: null });
  if (male) Object.assign(L, { snoodK: 1, sheenA: 0.35 });
  else Object.assign(L, { beard: null, snoodK: 0.45, sheenA: 0.15, body: lt(L.body, 0.08), light: lt(L.light, 0.1), head: "#B8C8D8", wattle: "#C85A64" });   // hens: no beard, small snood
  L.species = "turkey";
  L.size = clamp(gNum(G, "size"), 0.6, 1.3);
  L.chick = white ? "#FFF4D0" : palm ? "#F0E6D0" : base === "B" ? "#3A3A3E" : base === "b" ? "#E0B890" : "#D8C29A";
  if (!white && !palm && base !== "B") L.chickStripe = "#8E6A48";
  L.egg = { name: "Speckled", color: "#E8D6B8", speckle: true };
  return L;
}

const FL_LEGS = { pk: "#E86A8A", gy: "#8E8E96", yl: "#E8C84A", rd: "#D8403A" };
const FL_BILL = { pb: ["#FCE3E8", 0.45], pp: ["#F4A6B8", 0.35], cb: ["#FCE3E8", 0.62], db: ["#7A2A3A", 0.75], yb: ["#F2D26A", 0.55] };
function flamingoLook(G, male) {
  const p = clamp(gNum(G, "pink"), 0, 1), body = mixHex("#F6EEEE", "#F2587F", p);
  const L = { species: "flamingo", body, shade: dk(body, 0.18), light: lt(body, 0.35), wing: mixHex(body, "#E8305E", 0.35 * p), wingTip: "#1E1E22", neck: body, head: body, eye: "#F2C14E" };
  L.legs = mixHex(FL_LEGS[G.legs[0]], FL_LEGS[G.legs[1]], 0.5);
  if (G.legs.includes("gy")) L.knee = "#E86A8A";      // Chilean flamingos have pink "knees"!
  L.bill = mixHex(FL_BILL[G.bill[0]][0], FL_BILL[G.bill[1]][0], 0.5);
  L.billTip = "#1E1E22";
  L.billTipK = (FL_BILL[G.bill[0]][1] + FL_BILL[G.bill[1]][1]) / 2;
  L.size = clamp(gNum(G, "size"), 0.7, 1.25);
  L.chick = "#C9C9CF";                                  // baby flamingos are gray!
  L.egg = { name: "Flamingo", color: "#FBF8F0" };
  return L;
}

function peafowlLook(G, male) {
  const K = "peafowl", g = gCount(K, G, "green") / 2, wN = gCount(K, G, "white");
  const cameo = gAll(G, "cameo", "ca"), purple = gAll(G, "purple", "pu"), bs = gAll(G, "bs", "bs"), opal = gAll(G, "opal", "op");
  const m = (a, b) => mixHex(a, b, g);
  let L;
  if (male) {
    L = { body: m("#1D5FB4", "#2E7A4A"), shade: m("#123D7A", "#1D5A34"), light: m("#3E86D8", "#5AAA6A"), neck: m("#1F6FCC", "#3F8A5A"), head: m("#1F6FCC", "#3F8A5A"),
      back: m("#3F9A6A", "#4A8A3A"), train: m("#2F8A5A", "#3A9A4A"), trainDark: "#1D5A3A", eyeRing: "#C9A04A", eyeMid: "#2AB0A0", eyeCore: "#1E3A9C",
      wing: m("#C8A27A", "#3A6AA8"), wingBar: m("#5A4030", "#2A4A6A"), crest: m("#1F6FCC", "#3F8A5A"), legs: "#8E8478", crestTall: g > 0.6, scales: g > 0.3 ? "#C9A04A" : null };
    if (cameo) Object.assign(L, { body: "#7A5A3E", shade: "#5A402A", light: "#A07E5E", neck: "#8E6A4A", head: "#8E6A4A", back: "#A08060", train: "#A08060", trainDark: "#6E5A40",
      eyeMid: "#B89A7A", eyeCore: "#5A4030", wing: "#C8B090", crest: "#8E6A4A" });
    if (purple) Object.assign(L, { neck: "#5A3A9A", head: "#5A3A9A", body: "#4A2E8A", light: "#6A4AB8", train: mixHex(L.train, "#5A4A8A", 0.5), crest: "#5A3A9A" });
    if (opal) Object.assign(L, { neck: "#8C98A8", head: "#8C98A8", body: "#7A8698", light: "#A8B4C4", shade: "#5A6678", train: "#9AA4A0", eyeCore: "#6A7A8A", crest: "#8C98A8" });
    if (bs) Object.assign(L, { wing: "#1E1E22", wingBar: null });
  } else {      // peahens: no long train, but a pretty green neck
    L = { body: m("#8C7A66", "#6A7A5A"), neck: m("#4E7A5A", "#3F7A4A"), head: m("#8C7A66", "#4E6A4A"), back: m("#7A6A58", "#4E6A4A"),
      wing: m("#8C7A66", "#3A5A7A"), wingBar: "#5A4A3A", crest: m("#7A6A58", "#3F7A4A"), legs: "#8E8478", train: null };
    if (cameo) Object.assign(L, { body: "#C8B89C", neck: "#B8A488", head: "#C8B89C", back: "#B8A488", wing: "#C8B89C", crest: "#B8A488" });
    if (purple) L.neck = "#6A5A7A";
    if (opal) Object.assign(L, { body: "#A8B0B8", neck: "#98A2AE", head: "#A8B0B8", back: "#98A2AE", wing: "#A8B0B8" });
    if (bs) Object.assign(L, { body: "#EDE3D0", neck: "#E0D6C0", head: "#EDE3D0", back: "#E0D6C0", wing: "#EDE3D0", crest: "#E0D6C0" });
    L.shade = dk(L.body, 0.3); L.light = lt(L.body, 0.25);
  }
  if (wN === 2) Object.assign(L, { body: "#FAFAF7", shade: "#DDDCD6", light: "#FFFFFF", neck: "#FAFAF7", head: "#FAFAF7", back: "#F2F1EC", wing: "#F2F1EC",
    wingBar: "#E2DFD6", crest: "#FAFAF7", legs: "#B8AFA4", noStripes: true, scales: null,
    ...(male ? { train: "#F2F1EC", trainDark: "#DEDCD4", eyeRing: "#E9E4D6", eyeMid: "#F4F1E8", eyeCore: "#E2DDCF" } : {}) });
  else if (wN === 1) L.pied = "#FAFAF7";
  L.species = "peafowl";
  L.size = clamp(gNum(G, "size"), 0.8, 1.2);
  L.chick = wN === 2 ? "#F4EEDD" : bs ? "#F0E8D6" : cameo ? "#D8C4A0" : "#C9AE82";
  L.egg = { name: "Peafowl", color: "#EAD4A8" };
  return L;
}

const LOOKS = {
  chicken: chickenLook, duck: duckLook, muscovy: muscovyLook, mule: muleLook, goose: gooseLook, swan: swanLook,
  quail: quailLook, calQuail: calQuailLook, bobwhite: bobwhiteLook, guinea: guineaLook,
  pheasant: pheasantLook, ruffed: ruffedLook, silverPh: silverPhLook, reeves: reevesLook,
  turkey: turkeyLook, flamingo: flamingoLook, peafowl: peafowlLook,
};

// A bird's genes (made from its breed the first time we need them)
function genoOf(c) {
  if (!c.geno) c.geno = genesFor(kindOf(c), BREEDS[c.breed].genes, c.sex);
  return c.geno;
}
// What a bird looks like (worked out once, then remembered)
function lookOf(c) {
  if (c._look) return c._look;
  const L = LOOKS[kindOf(c)](genoOf(c), isMaleSex(c.sex));
  L.name = c.cross || BREEDS[c.breed].name;
  c._look = L;
  return L;
}
const eggLookOf = (c) => lookOf(c).egg;

// Every breed's usual egg (for the Market and the incubator)
for (const k in BREEDS) {
  const kind = kindOfBreed(k);
  BREEDS[k].egg = LOOKS[kind](genesFor(kind, BREEDS[k].genes, "hen"), false).egg;
}

// ---------- Naming a new chick ----------
// Two parents of the same breed make that breed (maybe a new color of it,
// like a "Splash Andalusian"). Some famous crosses have their own names.
// Everything else is a one-of-a-kind mix, named after how it looks.
const KIND_NOUN = {
  chicken: "", duck: "Duck", muscovy: "Muscovy", mule: "Duck", goose: "Goose", swan: "Swan", quail: "Quail", calQuail: "Quail", bobwhite: "Bobwhite",
  guinea: "Guinea", pheasant: "Pheasant", ruffed: "Pheasant", silverPh: "Pheasant", reeves: "Pheasant", turkey: "Turkey", flamingo: "Flamingo", peafowl: "Peafowl",
};
const RED_DADS = ["rir", "newHampshire"];
const NAMED_CROSSES = [
  // Crosses named after their parents (dad first, like farmers write it)
  { name: "Black Star", kind: "chicken", dad: "rir", mom: "barred", emoji: "⭐", hint: "Rhode Island Red dad + Barred Rock mom",
    test: (m, d) => RED_DADS.includes(d.breed) && m.breed === "barred",
    fact: "A \"sex-link\": girl chicks hatch black and boy chicks have a white spot on their heads. Also called a Black Sex-Link." },
  { name: "Golden Comet", kind: "chicken", dad: "newHampshire", mom: "whiteRock", emoji: "☄️", hint: "New Hampshire dad + White Rock mom",
    test: (m, d) => RED_DADS.includes(d.breed) && m.breed === "whiteRock",
    fact: "Girls hatch red and boys hatch yellow, because Mom's silver gene only goes to her sons." },
  { name: "Red Star", kind: "chicken", dad: "rir", mom: "delaware", emoji: "🌟", hint: "Rhode Island Red dad + Delaware mom",
    test: (m, d) => RED_DADS.includes(d.breed) && m.breed === "delaware",
    fact: "Red Stars (Red Sex-Links) are super layers. Girls are red and boys are white." },
  { name: "Cinnamon Queen", kind: "chicken", dad: "newHampshire", mom: "wyandotte", emoji: "👸", hint: "New Hampshire dad + Silver Laced Wyandotte mom",
    test: (m, d) => RED_DADS.includes(d.breed) && m.breed === "wyandotte",
    fact: "Cinnamon Queen girls are cinnamon red. Their brothers come out silver!" },
  { name: "Speckledy", kind: "chicken", dad: "rir", mom: "marans", emoji: "🟤", hint: "Rhode Island Red dad + Cuckoo Marans mom",
    test: (m, d) => RED_DADS.includes(d.breed) && m.breed === "marans",
    fact: "A favorite in Britain: speckled hens that lay lots of dark brown eggs." },
  { name: "Austra White", kind: "chicken", dad: "australorp", mom: "leghorn", emoji: "🤍", hint: "Black Australorp dad + White Leghorn mom",
    test: (m, d) => d.breed === "australorp" && m.breed === "leghorn",
    fact: "With just one dominant-white gene, the black shows through as little specks." },
  { name: "Mulard", kind: "mule", dad: "muscovy", mom: "pekin", emoji: "🦆", hint: "A Muscovy dad + a Pekin mom", test: () => true,
    fact: "Also called a mule duck. Muscovies aren't the same kind of duck, so Mulards can't have babies." },
  { name: "Blute Swan", kind: "swan", dad: "blackSwan", mom: "muteSwan", emoji: "🦢", hint: "A Black Swan + a Mute Swan",
    test: (m, d) => [m.breed, d.breed].sort().join() === "blackSwan,muteSwan",
    fact: "\"Black\" + \"mute\" = blute! Blute swans come out a smoky gray-brown." },
  { name: "Spalding", kind: "peafowl", dad: "greenPeafowl", mom: "peacock", emoji: "🦚", hint: "A Green peafowl + an India Blue",
    test: (m, d, L, G) => gCount("peafowl", G, "green") === 1,
    fact: "Named after Mrs. Keith Spalding, who first raised them. Taller and shinier than India Blues!" },
  { name: "Golden-Amherst", kind: "ruffed", dad: "ladyAmherst", mom: "goldenPh", emoji: "🌈", hint: "A Lady Amherst + a Golden Pheasant",
    test: (m, d, L, G) => gCount("ruffed", G, "amherst") === 1,
    fact: "Golden and Lady Amherst pheasants are close cousins, so their babies can have babies too." },
  // Names that come from what the chick looks like (its genes)
  { name: "Sizzle", kind: "chicken", dad: "silkie", mom: "frizzle", pheno: true, emoji: "☁️", hint: "Silkie fluff + frizzle curls (takes two generations!)",
    test: (m, d, L) => L.silkie && L.frizzle > 0,
    fact: "A real breed! Silkie fluff is recessive, so it takes Silkie genes from both sides to make a Sizzle." },
  { name: "Showgirl", kind: "chicken", dad: "silkie", mom: "turken", pheno: true, emoji: "💃", hint: "Silkie fluff + a naked neck (takes two generations!)",
    test: (m, d, L) => L.silkie && L.naked > 0,
    fact: "A fluffy Silkie with a bare neck, like it's wearing a feather boa!" },
  { name: "Olive Egger", kind: "chicken", breed: "olive", pheno: true, emoji: "🫒", hint: "A blue-egg bird + a dark-brown-egg bird",
    test: (m, d, L) => /Olive/.test(L.egg.name) },
  { name: "Easter Egger", kind: "chicken", breed: "easter", pheno: true, emoji: "🐣", hint: "A blue-egg bird + any other chicken",
    test: (m, d, L) => /Blue|Mint|Green/.test(L.egg.name) },
];
const genoOfRec = (p) => p.geno || genesFor(kindOfBreed(p.breed), BREEDS[p.breed].genes, p.sex);

// A word for a bird's main color, and one for a fancy feature
function colorWords(kind, G, L) {
  const c = (id) => gCount(kind, G, id);
  switch (kind) {
    case "chicken": {
      let color;
      if (c("domW") === 2 || gAll(G, "recW", "c")) color = "White";
      else if (c("domW") === 1) color = "Speckled White";
      else if (c("blue") === 2) color = "Splash";
      else {
        const base = gDom(kind, G, "base"), silver = gHas(G, "silver", "S"), tone = gDom(kind, G, "tone");
        const shade = gAll(G, "lav", "lav") ? "Lavender" : gAll(G, "choc", "ch") ? "Chocolate" : c("blue") ? "Blue" : null;
        const pat = { col: "Columbian", lace: "Laced", dlace: "Double-Laced", spang: "Spangled", mot: base === "E" || base === "ER" ? "Mottled" : "Speckled" }[gDom(kind, G, "pat")];
        const red = silver ? "Silver" : tone === "di" ? "Buff" : tone === "Mh" ? "Red" : "Gold";
        if (c("bar")) color = base === "E" || base === "ER" ? "Barred" : "Crele";
        else if (base === "E") color = shade || (pat === "Mottled" ? "Mottled" : "Black");
        else if (base === "ER") color = shade ? `${shade} Copper` : silver ? "Black Silver-neck" : "Black Copper";
        else color = [pat && pat !== "Mottled" ? pat : null, base === "R" ? red : silver ? "Silver Partridge" : "Partridge"].filter(Boolean).join(" ");
        if (shade && base !== "E" && base !== "ER") color = `${shade} ${color}`;
      }
      const L2 = L || chickenLook(G, false);
      const trait = L2.silkie ? "Silkie" : L2.frizzle === 2 ? "Frazzled" : L2.frizzle ? "Frizzled" : L2.naked ? "Naked Neck" : L2.crest ? "Crested"
        : L2.rumpless ? "Rumpless" : L2.muffs ? "Bearded" : L2.longTail ? "Long-tailed" : L2.size < 0.62 ? "Bantam" : L2.featherFeet ? "Feather-footed" : null;
      return [color, trait];
    }
    case "duck":
      if (gAll(G, "white", "c")) return ["White", c("crest") ? "Crested" : gNum(G, "upright") > 0.6 ? "Runner" : null];
      return [[gDom(kind, G, "bib") === "mag" ? "Magpie" : gDom(kind, G, "bib") === "bib" ? "Bibbed" : null,
        gAll(G, "harl", "hq") ? "Harlequin" : c("blue") === 2 ? "Silver" : c("blue") ? "Blue" : gAll(G, "brown", "d") ? (gDom(kind, G, "base") === "E" ? "Chocolate" : "Khaki")
          : { E: "Black", M: "Mallard", md: "Dusky" }[gDom(kind, G, "base")]].filter(Boolean).join(" "),
        c("crest") ? "Crested" : gNum(G, "upright") > 0.6 ? "Runner" : null];
    case "muscovy":
      return [gAll(G, "white", "c") ? "White" : [c("pied") ? "Pied" : null, c("blue") === 2 ? "Splash" : c("blue") ? "Blue" : gAll(G, "choc", "ch") ? "Chocolate" : "Black"].filter(Boolean).join(" "), null];
    case "goose":
      return [gAll(G, "white", "c") || c("sd") === 2 ? "White" : gAll(G, "saddle", "sb") ? "Saddleback" : gAll(G, "buff", "g") ? "Buff" : c("sd") ? "Light Gray" : c("knob") ? "Brown" : "Gray",
        c("curl") ? "Curly" : c("knob") ? "Knobbed" : null];
    case "swan": return [["White", "Gray", "Black"][c("black")], null];
    case "quail":
      return [gAll(G, "white", "wh") ? "White" : [gAll(G, "tux", "s") ? "Tuxedo" : null,
        c("dark") === 2 ? "Tibetan" : c("dark") ? "Rosetta" : c("gold") === 2 ? "Golden" : c("gold") ? "Italian" : "Pharaoh"].filter(Boolean).join(" "), gAll(G, "celadon", "ce") ? "Celadon" : null];
    case "bobwhite": return [gAll(G, "snow", "sn") ? "Snowflake" : "Wild", null];
    case "guinea":
      return [gAll(G, "white", "c") ? "White" : [c("pied") ? "Pied" : null, gAll(G, "buff", "br") ? "Buff" : gAll(G, "lav", "lv") ? "Lavender" : !gHas(G, "pearl", "P") ? "Royal Purple" : "Pearl"].filter(Boolean).join(" "), null];
    case "pheasant":
      return [gAll(G, "white", "c") ? "White" : c("mel") === 2 ? "Melanistic" : c("mel") ? "Dark" : gAll(G, "fawn", "fw") ? "Buff" : gHas(G, "ring", "Rg") ? "Ringneck" : "Blackneck", null];
    case "ruffed":
      return [c("amherst") === 2 ? "Lady Amherst" : c("amherst") ? "Golden-Amherst" : gAll(G, "yellow", "yg") ? "Yellow Golden" : "Golden", gHas(G, "dark", "Dt") ? "Dark-throated" : null];
    case "turkey": {
      if (gAll(G, "white", "c")) return ["White", null];
      if (gAll(G, "palm", "cp")) return ["Royal Palm", null];
      const base = gDom(kind, G, "base");
      const col = base === "B" ? "Black" : c("slate") === 2 ? "Pale Slate" : c("slate") ? "Blue Slate" : gAll(G, "narr", "n") ? "Narragansett" : base === "b" ? "Red" : "Bronze";
      return [col, null];
    }
    case "flamingo": { const p = gNum(G, "pink"); return [p > 0.85 ? "Deep Pink" : p > 0.5 ? "Pink" : "Pale Pink", null]; }
    case "peafowl": {
      const w = c("white");
      if (w === 2) return ["White", null];
      const col = gAll(G, "cameo", "ca") ? "Cameo" : gAll(G, "purple", "pu") ? "Purple" : gAll(G, "opal", "op") ? "Opal" : c("green") === 2 ? "Green" : c("green") ? "Spalding" : "India Blue";
      return [[w ? "Pied" : null, gAll(G, "bs", "bs") ? "Black-shouldered" : null, col].filter(Boolean).join(" "), null];
    }
  }
  return ["", null];
}

// What to call a new baby, and which breed it counts as
function nameChick(kind, mom, dad, G, sex, L) {
  if (kind === "mule") return { breed: "mulard", cross: null };
  const W = KINDS[kind], mixKey = W.mix;
  const named = (x) => (x.breed ? { breed: x.breed, cross: null } : { breed: mixKey, cross: x.name });
  // 1. Famous crosses have their own names
  for (const x of NAMED_CROSSES) if (x.kind === kind && !x.pheno && x.test(mom, dad, L, G)) return named(x);
  // 2. Color varieties (quail, guineas, turkeys, peafowl...) are named by their color, like "Blue Slate"
  const [color, trait] = colorWords(kind, G, L), look = [trait, color].filter(Boolean).join(" ");
  if (W.varieties) {
    const match = Object.keys(BREEDS).find((k) => kindOfBreed(k) === kind && !BREEDS[k].cross &&
      colorWords(kind, genesFor(kind, BREEDS[k].genes, sex), null).filter(Boolean).reverse().join(" ") === look);
    if (match) return { breed: match, cross: null };
    return { breed: mom.breed === dad.breed ? mom.breed : mixKey, cross: `${look} ${KIND_NOUN[kind]}` };
  }
  // 3. Same breed: that breed (maybe a new color of it, like a "Splash Andalusian")
  if (mom.breed === dad.breed && !BREEDS[mom.breed].cross) {
    const B = BREEDS[mom.breed];
    if (mom.breed === "frizzle") {
      if (L.frizzle === 2) return { breed: mom.breed, cross: "Frazzle" };
      if (L.frizzle === 0) return { breed: mom.breed, cross: "Smooth Frizzle" };
    }
    const stdG = genesFor(kind, B.genes, sex);
    const [was] = colorWords(kind, stdG, LOOKS[kind](stdG, isMaleSex(sex)));
    return { breed: mom.breed, cross: was !== color && color ? `${color} ${B.short || B.name}` : null };
  }
  // 4. Names from genes: Sizzles, Showgirls, Olive Eggers, Easter Eggers
  for (const x of NAMED_CROSSES) if (x.kind === kind && x.pheno && x.test(mom, dad, L, G)) return named(x);
  // 5. Everything else is named after its parents, dad first: "Buff Orpington × Barred Rock"
  const dn = recName(dad), mn = recName(mom);
  if (/Mix|Mixed/.test(dn + mn)) return { breed: mixKey, cross: kind === "chicken" ? "Barnyard Mix" : `Mixed-breed ${KIND_NOUN[kind]}` };
  if (dn === mn) return { breed: mixKey, cross: `${dn} (2nd generation)` };
  const name = `${dn} × ${mn}`;
  return { breed: mixKey, cross: name.length <= 46 ? name : kind === "chicken" ? "Barnyard Mix" : `Mixed-breed ${KIND_NOUN[kind]}` };
}

// Could Mom and Dad's chicks be told apart, boys from girls, on hatching day?
const downLook = (L) => `${L.chick}|${L.chickSpot || ""}|${L.chickStripe || ""}|${L.chickSpotBig ? 1 : 0}`;
function isAutosexing(kind, momG, dadG) {
  const boys = new Set(), girls = new Set();
  for (let i = 0; i < 40; i++) {
    boys.add(downLook(LOOKS[kind](inheritGenes(kind, momG, dadG, "rooster"), true)));
    girls.add(downLook(LOOKS[kind](inheritGenes(kind, momG, dadG, "hen"), false)));
  }
  for (const b of boys) if (girls.has(b)) return false;
  return true;
}

// The chances of what the chicks will look like (we "pretend-hatch" lots of eggs!)
function hatchOdds(mom, dad) {
  const kind = kindOf(mom), mode = canMate(kind, kindOf(dad));
  if (mode === "mule") return { list: [{ label: "Mulard (mule duck)", pct: 100 }], autosex: false, names: ["Mulard"] };
  if (mode !== "yes") return { list: [], autosex: false, names: [] };
  const tally = new Map(), names = new Map(), N = 400, momG = genoOf(mom), dadG = genoOf(dad), momR = parentRec(mom), dadR = parentRec(dad);
  for (let i = 0; i < N; i++) {
    const sex = i % 2 ? "rooster" : "hen", G = inheritGenes(kind, momG, dadG, sex), L = LOOKS[kind](G, isMaleSex(sex));
    const [color, trait] = colorWords(kind, G, L);
    let label = [trait, color].filter(Boolean).join(" ") || "Wild";
    if (kind === "chicken" && !isMaleSex(sex)) label += ` · ${L.egg.name.toLowerCase()} eggs`;
    else if (kind === "chicken") label += " · rooster";
    tally.set(label, (tally.get(label) || 0) + 1);
    if (i % 4 === 0) { const nm = nameChick(kind, momR, dadR, G, sex, L); const n = nm.cross || BREEDS[nm.breed].name; names.set(n, (names.get(n) || 0) + 1); }
  }
  const list = [...tally].map(([label, n]) => ({ label, pct: Math.max(1, Math.round((n / N) * 100)) })).sort((a, b) => b.pct - a.pct).slice(0, 6);
  return { list, autosex: isAutosexing(kind, momG, dadG), names: [...names].sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]) };
}

// Did a chick show a gene that neither parent showed? (It was hiding!)
function showedHiddenGene(kind, momG, dadG, G) {
  for (const L of lociOf(kind)) {
    if (L.type !== "dom") continue;
    const kid = gDom(kind, G, L.id);
    if (kid !== gDom(kind, momG, L.id) && kid !== gDom(kind, dadG, L.id)) return true;
  }
  return false;
}

// ---------- Gene stickers ----------
const anyBird = (test) => FARM_ORDER.some((id) => farms[id].birds.some((c) => c.growth >= 0.12 && test(c, lookOf(c), kindOf(c))));
const GENE_STICKERS = [
  { id: "g_hidden", emoji: "🎁", name: "Hidden Gene", how: "Hatch a chick that shows a gene neither parent showed", done: () => game.stats.hidden >= 1 },
  { id: "g_sexlink", emoji: "🎀", name: "Boy or Girl?", how: "Hatch chicks you can tell apart on hatching day", done: () => game.stats.autosex >= 1 },
  { id: "g_splash", emoji: "💦", name: "Splash!", how: "Two blue genes make a splash chicken", done: () => anyBird((c, L, k) => k === "chicken" && L.pattern === "splash") },
  { id: "g_lavender", emoji: "💜", name: "Lavender", how: "Two lavender genes make a soft purple-gray bird", done: () => anyBird((c, L, k) => k === "chicken" && gAll(genoOf(c), "lav", "lav")) },
  { id: "g_frizzle", emoji: "🌀", name: "Frizzle", how: "A chicken with curly feathers", done: () => anyBird((c, L, k) => k === "chicken" && L.frizzle > 0) },
  { id: "g_frazzle", emoji: "🌪️", name: "Frazzle", how: "Two frizzle genes: extra curly!", done: () => anyBird((c, L, k) => k === "chicken" && L.frizzle === 2) },
  { id: "g_walnut", emoji: "🌰", name: "Walnut Comb", how: "Rose comb + pea comb = walnut comb", done: () => anyBird((c, L, k) => k === "chicken" && L.combType === "walnut" && !L.silkie) },
  { id: "g_green", emoji: "🟢", name: "Green Eggs", how: "Blue-egg genes + brown-egg genes", done: () => anyBird((c, L, k) => k === "chicken" && /Green|Olive|Mint/.test(L.egg.name)) },
  { id: "g_naked", emoji: "🦃", name: "Naked Neck", how: "A chicken with a bare neck", done: () => anyBird((c, L, k) => k === "chicken" && L.naked > 0) },
  { id: "g_rumpless", emoji: "✂️", name: "No Tail!", how: "A rumpless chicken (like an Araucana)", done: () => anyBird((c, L, k) => k === "chicken" && L.rumpless) },
  { id: "g_bantam", emoji: "🤏", name: "Tiny Bantam", how: "A teeny-tiny chicken", done: () => anyBird((c, L, k) => k === "chicken" && L.size < 0.55) },
  { id: "g_magpie", emoji: "🐧", name: "Magpie Duck", how: "A black-and-white magpie duck", done: () => anyBird((c, L, k) => k === "duck" && gDom("duck", genoOf(c), "bib") === "mag") },
  { id: "g_mulard", emoji: "🫏", name: "Mule Duck", how: "Hatch a duck + Muscovy baby", done: () => anyBird((c, L, k) => k === "mule") },
  { id: "g_blute", emoji: "🦢", name: "Blute Swan", how: "Hatch a black swan + mute swan baby", done: () => anyBird((c) => c.cross === "Blute Swan") },
  { id: "g_spalding", emoji: "🦚", name: "Spalding", how: "Hatch an India Blue + Green peafowl baby", done: () => anyBird((c, L, k) => k === "peafowl" && gCount("peafowl", genoOf(c), "green") === 1) },
  { id: "g_whitePea", emoji: "🤍", name: "White Peacock", how: "Two white genes: a snow-white peacock", done: () => anyBird((c, L, k) => k === "peafowl" && gCount("peafowl", genoOf(c), "white") === 2 && c.growth >= 1 && isMaleSex(c.sex)) },
];

// ---------- Boys and girls ----------
// Every boy bird is stored with sex "rooster" and every girl with "hen";
// KINDS has the real words (drake, gander, tom, peacock...).
const isRooster = (c) => isMaleSex(c.sex);           // true for every boy bird
const isChicken = (c) => kindOf(c) === "chicken";
const sexWord = (c) => KINDS[kindOf(c)][isRooster(c) ? "male" : "female"];
const canLay = (c) => !isRooster(c) && !KINDS[kindOf(c)].sterile;
const plural = (w) => ({ goose: "geese" }[w] || w + "s");
const cap1 = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// How much a young rooster looks like a grown-up rooster yet (0 to 1)
const roosterLook = (c) => (isRooster(c) && isChicken(c) && !isBaby(c) ? clamp((c.growth - 0.55) / 0.45) : 0);
// Boys of most kinds grow a bit bigger than girls (but girl quail are bigger!)
const maleK = (c) => (isRooster(c) && !isBaby(c) ? lerp(1, KINDS[kindOf(c)].maleSize || 1, clamp((c.growth - 0.55) / 0.45)) : 1);
// Birds that show off with their tails: only the boys!
const SHOW_MALES = new Set(["peafowl", "pheasant", "ruffed", "silverPh", "reeves", "turkey", "calQuail"]);

const ROOSTER_NAMES = [
  "Rocky", "Duke", "Captain", "Elvis", "Hank", "Rex", "Big Red", "Tex", "Gus", "Bruno",
  "Kevin", "Admiral", "Sir Cluck", "Chief", "Ziggy", "Maverick", "Buster", "Cosmo", "Rusty", "Colonel",
  "Mr. Waddles", "Sergeant", "Bingo", "Fred", "Moose", "Oscar", "Rolo", "Taco", "Sparky", "Jasper",
];
function roosterName() {
  const used = new Set();
  for (const id of FARM_ORDER) for (const c of farms[id].birds) used.add(c.name);
  const free = ROOSTER_NAMES.filter((n) => !used.has(n));
  return free.length ? pick(free) : freshName();
}

// ---------- The flock gauge: boys vs. girls ----------
const FLOCK_COLORS = { none: "#A9A39A", crowded: "#E0533D", fewHens: "#F2A33A", good: "#43A849", fewRoos: "#F2A33A" };
const FLOCK_BOOST = { none: 1, crowded: 0.85, fewHens: 1.1, good: 1.25, fewRoos: 1.1 };
const KIND_TITLE = {
  chicken: "Chickens", duck: "Ducks", muscovy: "Muscovies", goose: "Geese", swan: "Swans", quail: "Coturnix quail", calQuail: "California quail",
  bobwhite: "Bobwhites", guinea: "Guinea fowl", pheasant: "Pheasants", ruffed: "Golden & Amherst pheasants", silverPh: "Silver pheasants",
  reeves: "Reeves's pheasants", turkey: "Turkeys", flamingo: "Flamingos", peafowl: "Peafowl",
};
let flockCache = {};
function flockStats(farmId) {
  if (flockCache[farmId]) return flockCache[farmId];
  const out = {};
  for (const c of farms[farmId].birds) {
    const k = kindOf(c);
    if (KINDS[k].sterile) continue;
    const s = out[k] || (out[k] = { kind: k, males: 0, females: 0, young: 0 });
    if (c.growth < 1) s.young++; else if (isRooster(c)) s.males++; else s.females++;
  }
  for (const k in out) {
    const s = out[k], W = KINDS[k], [lo, hi] = W.ratio, r = s.males ? s.females / s.males : 0, M = W.male, Fm = W.female;
    s.ratio = r;
    s.key = !s.males ? "none"
      : W.pairs ? (r > 1.25 ? "fewRoos" : r < 0.5 ? "crowded" : r < 0.8 ? "fewHens" : "good")
      : r < lo * 0.5 ? "crowded" : r < lo ? "fewHens" : r <= hi ? "good" : "fewRoos";
    s.color = FLOCK_COLORS[s.key];
    s.boost = FLOCK_BOOST[s.key];
    s.label = W.pairs
      ? { none: `No ${M} yet`, crowded: `Too many ${plural(M)}!`, fewHens: `A ${M} needs a partner`, good: "Everyone has a partner!", fewRoos: `A ${Fm} needs a partner` }[s.key]
      : { none: `No ${M} yet`, crowded: `Too many ${plural(M)}!`, fewHens: `Needs more ${plural(Fm)}`, good: "Just right!", fewRoos: `Needs another ${M}` }[s.key];
    s.say = {
      none: `A ${M} is the dad of every baby. Eggs need one to hatch!`,
      crowded: `The ${plural(M)} keep squabbling and the ${plural(Fm)} are stressed, so they lay a little slower.`,
      fewHens: W.pairs ? `Add a ${Fm} so every ${M} has a partner.` : `Each ${M} wants a bigger family. Add a few more ${plural(Fm)}.`,
      good: `Your ${plural(Fm)} feel safe and happy, so they lay eggs 25% faster!`,
      fewRoos: W.pairs ? `Add a ${M} so every ${Fm} has a partner.` : `That's a lot of ${plural(Fm)} for one ${M}. Another ${M} would help.`,
    }[s.key];
  }
  flockCache[farmId] = out;
  return out;
}
const flockBoostOf = (c) => { const s = flockStats(farmOfBreed(c.breed))[kindOf(c)]; return s ? s.boost : 1; };

const flockBtn = $("flockBtn");
const flockText = $("flockText");
const flockDot = $("flockDot");
const flockSheet = $("flock");
function mainFlock(farmId) {
  const list = Object.values(flockStats(farmId));
  return list.sort((a, b) => b.males + b.females + b.young - (a.males + a.females + a.young))[0] || null;
}
function updateFlockBtn() {
  flockCache = {};
  const f = mainFlock(game.farm);
  flockBtn.hidden = !f;
  if (!f) return;
  const icons = game.farm === "backyard" ? ["🐓", "🐔"] : ["♂", "♀"];
  flockText.textContent = `${icons[0]} ${f.males} : ${f.females} ${icons[1]}`;
  flockDot.style.background = f.color;
  const W = KINDS[f.kind];
  flockBtn.setAttribute("aria-label", `Your flock: ${f.males} ${f.males === 1 ? W.male : plural(W.male)} and ${f.females} ${f.females === 1 ? W.female : plural(W.female)}. ${f.label}`);
}
function openFlock() {
  renderFlock();
  showSheet(flockSheet);
  Sound.tick();
}
function renderFlock() {
  flockCache = {};
  const rows = $("flockRows");
  rows.textContent = "";
  const stats = Object.values(flockStats(game.farm)).sort((a, b) => b.males + b.females - (a.males + a.females));
  if (!stats.length) rows.append(el("p", "flock-say", "No birds here yet!"));
  for (const s of stats) {
    const W = KINDS[s.kind], row = el("div", "flock-row");
    const head = el("div", "flock-row-head");
    const status = el("span", "flock-status", s.label);
    status.style.color = s.color;
    head.append(el("b", "flock-kind", KIND_TITLE[s.kind]), status);
    const counts = el("div", "flock-counts");
    const count = (emoji, n, word) => { const d = el("div", "flock-count"); d.append(el("span", "flock-emoji", emoji), el("b", null, String(n)), el("span", null, n === 1 ? word : plural(word))); counts.append(d); };
    count("♂", s.males, W.male);
    count("♀", s.females, W.female);
    if (s.young) count("🐣", s.young, "baby");
    // the gauge: how many girls there are for every boy
    const [lo, hi] = W.pairs ? [0.8, 1.25] : W.ratio, max = W.pairs ? 2 : Math.max(3, hi * 1.5), red = W.pairs ? 0.5 : lo * 0.5;
    const gauge = el("div", "gauge"), bar = el("div", "gauge-bar");
    for (const [cls, a, b] of [["red", 0, red], ["amber", red, lo], ["green", lo, hi], ["amber", hi, max]]) {
      const z = el("span", "zone " + cls);
      z.style.flex = String(Math.max(0.01, b - a));
      bar.append(z);
    }
    const marker = el("i", "gauge-marker");
    marker.hidden = !s.males;
    marker.style.left = `${(Math.min(s.ratio, max) / max) * 100}%`;
    gauge.append(bar, marker);
    row.append(head, counts, gauge, el("p", "flock-say", s.say), el("p", "flock-ideal", `Best: ${W.ideal}.`));
    const extraBoys = (s.key === "crowded" || s.key === "fewHens") && s.males > 1, extraGirls = s.key === "fewRoos" && W.pairs;
    if (extraBoys || extraGirls) {
      const word = extraBoys ? W.male : W.female, b = el("button", "rehome-btn small", `🏡 Find a home for one ${word}`);
      b.type = "button";
      b.addEventListener("click", () => {
        const pickOne = F.birds.filter((c) => kindOf(c) === s.kind && c.growth >= 1 && isRooster(c) === extraBoys && !c.leaving);
        if (pickOne.length) { rehomeBird(pickOne[pickOne.length - 1]); flockCache = {}; renderFlock(); }
      });
      row.append(b);
    }
    rows.append(row);
  }
}
flockBtn.addEventListener("click", () => { Sound.unlock(); if (!started) begin(); openFlock(); });
$("flockShop").addEventListener("click", () => { marketTab = "birds"; openMarket(); });

// ---------- A parent, remembered on its egg ----------
function parentRec(c) {
  return { breed: c.breed, geno: JSON.parse(JSON.stringify(genoOf(c))), sex: c.sex, name: c.name, id: c.id, cross: c.cross || null };
}
const recName = (p) => p.cross || BREEDS[p.breed].name;
function cleanRec(p) {
  if (!p || typeof p !== "object" || !BREEDS[p.breed]) return null;
  const sex = p.sex === "rooster" ? "rooster" : "hen";
  return {
    breed: p.breed, sex, geno: p.geno ? cleanGeno(kindOfBreed(p.breed), p.geno, sex) : null,
    name: typeof p.name === "string" ? p.name.slice(0, 16) : "", id: num(p.id, -1),
    cross: typeof p.cross === "string" ? p.cross.slice(0, 40) : null,
  };
}
const HEX6 = /^#[0-9a-fA-F]{6}$/;
function cleanEgg(e) {
  if (!e || typeof e !== "object" || typeof e.color !== "string" || !HEX6.test(e.color)) return null;
  return { name: typeof e.name === "string" ? e.name.slice(0, 20) : "Brown", color: e.color, speckle: e.speckle === true, blotch: e.blotch === true };
}

// ---------- Boy and girl sounds ----------
Object.assign(Sound, {
  crow(pitch = 1, pan = 0, v = 1) {   // "cock-a-doodle-DOOOO!"
    const syl = (t, f0, f1, dur, gain) => {
      this.tone({ type: "sawtooth", t, f0: f0 * pitch, f1: f1 * pitch, dur, gain: gain * v, filter: "bandpass", ff: 1500 * pitch, q: 2, pan });
      this.noise({ t, dur: dur * 0.6, gain: 0.04 * v, type: "bandpass", f: 2400, q: 1.5, pan });
    };
    syl(0, 480, 560, 0.12, 0.16);
    syl(0.16, 560, 620, 0.1, 0.15);
    syl(0.3, 620, 700, 0.12, 0.16);
    syl(0.48, 700, 880, 0.28, 0.18);
    syl(0.76, 880, 560, 0.55, 0.17);
  },
  tidbit(pan = 0, v = 1) {             // "tuk-tuk-tuk! Ladies, I found a snack!"
    for (let i = 0; i < 5; i++) this.bawk(i * 0.1, 300 + (i % 2) * 20, 0.06, 0.12 * v, pan);
  },
  alarm(pan = 0) {                     // "bawk bawk BAWK! Hawk!"
    this.bawk(0, 420, 0.1, 0.18, pan);
    this.bawk(0.14, 420, 0.1, 0.18, pan);
    this.tone({ type: "sawtooth", t: 0.3, f0: 640, f1: 980, dur: 0.22, gain: 0.2, filter: "bandpass", ff: 1700, q: 1.8, pan });
  },
  rasp(pan = 0, v = 1) {               // drakes can't really quack! They make a quiet raspy "rhaeb"
    this.tone({ type: "sawtooth", f0: 220, f1: 190, dur: 0.18, gain: 0.07 * v, filter: "bandpass", ff: 700, q: 3, pan });
    this.noise({ dur: 0.16, gain: 0.05 * v, type: "bandpass", f: 900, q: 2, pan });
  },
  buckwheat(pan = 0, v = 1) {          // only girl guineas say "buck-WHEAT!"
    this.tone({ type: "square", f0: 900, f1: 820, dur: 0.1, gain: 0.07 * v, filter: "bandpass", ff: 1400, q: 3, pan });
    this.tone({ type: "square", t: 0.16, f0: 1150, f1: 980, dur: 0.18, gain: 0.08 * v, filter: "bandpass", ff: 1500, q: 3, pan });
  },
  yelp(pan = 0, v = 1) {               // turkey hens: "yelp, yelp, yelp"
    for (let i = 0; i < 3; i++) this.tone({ type: "triangle", t: i * 0.16, f0: 820, f1: 560, dur: 0.1, gain: 0.08 * v, pan });
  },
  peahen(pan = 0, v = 1) {             // peahens: a short "ah-ah!"
    this.tone({ type: "sawtooth", f0: 700, f1: 620, dur: 0.14, gain: 0.08 * v, filter: "bandpass", ff: 1300, q: 2, pan });
    this.tone({ type: "sawtooth", t: 0.2, f0: 720, f1: 600, dur: 0.14, gain: 0.07 * v, filter: "bandpass", ff: 1300, q: 2, pan });
  },
});
const crowPitch = (c) => (lookOf(c).pitch || 1) * 0.9;

// ---------- Boy personalities ----------
const SHOW_OK = new Set(["idle", "walk", "peck", "scratch", "preen"]);
const canShow = (c) => c.loc === "yard" && SHOW_OK.has(c.state) && (!c.goal || c.goal === "wander");
const GUARD_KINDS = new Set(["chicken", "goose", "turkey", "guinea"]);   // these boys stand guard when a hawk flies over
let crowQuiet = 0, squabbleT = rand(25, 45);

function updateRoosters(dt) {
  crowQuiet -= dt;
  const bed = isBedtime();
  const males = F.birds.filter((c) => isRooster(c) && c.growth >= 1 && c.loc === "yard" && !KINDS[kindOf(c)].sterile);
  if (!males.length) return;
  for (const c of males) {
    c.crowT -= dt;
    if (c.crowT > 0 || bed) continue;
    if (crowQuiet <= 0 && canShow(c)) startCrow(c);
    else c.crowT = rand(2, 6);   // someone else is calling; wait a moment
  }
  // Too many boys? Now and then two of them puff up at each other
  if (!bed) {
    squabbleT -= dt;
    if (squabbleT <= 0) {
      squabbleT = rand(25, 50);
      const st = flockStats(game.farm);
      for (const k in st) {
        if (st[k].key !== "crowded") continue;
        const ms = males.filter((c) => kindOf(c) === k);
        if (ms.length >= 2) { startSquabble(ms); break; }
      }
    }
  }
}
// Roosters crow; other boys make their own calls (gobble, honk, "may-AWE"...)
function startCrow(c) {
  c.state = "crow"; c.goal = null; c.t = isChicken(c) ? 2.2 : 1.6; c.peckT = 0; c.crowed = false;
  c.flapT = 0.45;
  c.crowT = isChicken(c) ? rand(55, 120) : rand(70, 150);
  crowQuiet = isChicken(c) ? 5 : 3;
}
// The sun is up! Every rooster crows soon after leaving the coop.
function dawnChorus() {
  for (const c of F.birds) if (isRooster(c) && isChicken(c) && c.growth >= 1) c.crowT = rand(1, 8);
}
// "I found a snack!" The rooster bobs his head and calls the hens over.
function startTidbit(c, callHens) {
  c.state = "tidbit"; c.t = 1.5; c.peckT = 0;
  Sound.tidbit(panX(c.x), 0.8);
  if (!callHens) return;
  const sc = scaleAt(c.y);
  const hens = F.birds.filter((h) => h !== c && !isRooster(h) && isChicken(h) && h.growth >= 1 && canShow(h))
    .sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y)).slice(0, 2);
  for (const h of hens) {
    if (Math.hypot(h.x - c.x, h.y - c.y) > 360 * sc) continue;
    h.goal = "wander";
    walkTo(h, c.x + c.dir * rand(22, 40) * sc, c.y + rand(-10, 10), SETTINGS.runSpeed * 0.7, false);
  }
}
// Two boys walk up, puff out their feathers, and hop at each other
function startSquabble(males) {
  let a = null, b = null, bd = 1e9;
  for (const x of males) for (const y of males) {
    if (x === y || !canShow(x) || !canShow(y)) continue;
    const d = Math.hypot(x.x - y.x, x.y - y.y);
    if (d < bd) { bd = d; a = x; b = y; }
  }
  if (!a || bd > 420 * scaleAt(a.y)) return;
  const sc = scaleAt(b.y), side = a.x < b.x ? -1 : 1;
  a.goal = "squabble"; a.rival = b;
  walkTo(a, b.x + side * 34 * sc, b.y, SETTINGS.runSpeed * 0.8, false);
  b.state = "idle"; b.goal = null; b.t = 4; b.dir = -side;
}
function puffUp(c, rival) {
  c.state = "puff"; c.t = 1.7; c.peckT = 0; c.goal = null;
  c.dir = rival.x > c.x ? 1 : -1;
  c.vz = 150 * scaleAt(c.y); c.flapT = 0.6;
  feathers(c, 2);
}
// What boys do in their special states (called from the bird brain)
function updateRoosterState(c, dt) {
  switch (c.state) {
    case "crow":
      c.t -= dt; c.peckT += dt;
      if (!c.crowed && c.peckT > (isChicken(c) ? 0.45 : 0.2)) {
        c.crowed = true;
        const v = scene === "yard" ? 0.9 : 0.4;
        if (isChicken(c)) Sound.crow(crowPitch(c), panX(c.x), v);
        else Sound.call(c, panX(c.x), v);
        const sc = scaleAt(c.y);
        notes(c.x + c.dir * 16 * sc, c.y, headH(c) * sc + 6, 3, sc);
      }
      if (c.t <= 0) think(c);
      return true;
    case "tidbit":
      c.t -= dt; c.peckT += dt;
      if (c.t <= 0) {
        if (c.pile && c.pile.bites > 0) { c.state = "treatPeck"; c.biteT = 0; c.peckT = 0; }
        else { c.state = "peck"; c.t = rand(1, 2); c.peckT = 0; }
      }
      return true;
    case "guard":               // head up, watching the sky
      c.t -= dt;
      c.lookT -= dt;
      if (c.lookT <= 0) { c.lookT = rand(0.5, 1.2); c.dir *= -1; }
      if (c.t <= 0) { startCrow(c); }   // "All clear!"
      return true;
    case "puff":
      c.t -= dt; c.peckT += dt;
      if (c.peckT > 0.8 && c.peckT - dt <= 0.8) { c.vz = 130 * scaleAt(c.y); feathers(c, 1); }
      if (c.t <= 0) { c.goal = "wander"; wanderNear(c); }   // walk it off
      return true;
  }
  return false;
}

// ---------- Drawing a rooster's fancy feathers ----------
function isDark(hex) { const [r, g, b] = rgb(hex); return 0.3 * r + 0.59 * g + 0.11 * b < 80; }
// Long curved "sickle" tail feathers (drawn where the tail starts)
function drawSickles(g, B, R, now, c) {
  const L = lerp(0.45, 1, R) * (B.longTail ? 2.3 : 1);
  const sheen = isDark(B.tail) ? "#3F8F72" : B.light;
  g.save();
  g.rotate(Math.sin(now * 1.3 + c.id) * 0.04 - (B.longTail ? 0.35 : 0));
  const feather = (rot, len, col) => {
    g.save(); g.rotate(rot); g.scale(len * L, len * lerp(1, L, B.longTail ? 0.45 : 1));
    g.beginPath();
    g.moveTo(3, -1);
    g.quadraticCurveTo(-8, -64, -50, -16);         // up and over...
    g.quadraticCurveTo(-18, -44, -4, 4);           // ...and back down
    g.closePath();
    g.fillStyle = col; g.fill();
    g.strokeStyle = rgba(sheen, 0.55); g.lineWidth = 1.6 / (len * L);
    g.beginPath(); g.moveTo(2, -3); g.quadraticCurveTo(-8, -60, -46, -17); g.stroke();
    g.restore();
  };
  feather(0.28, 0.72, B.tail2 || B.tail);
  feather(0.05, 0.9, B.tail);
  feather(-0.18, 1, B.tail2 || B.tail);
  if (B.longTail) { feather(-0.35, 1.1, B.tail); feather(0.45, 0.8, B.tail2 || B.tail); }
  g.restore();
}
// Pointed, shiny neck feathers ("hackles") and back feathers ("saddle")
function drawHackles(g, B, R, headX, headY, by, flare) {
  const col = B.hackle || B.neck || B.body;
  g.save();
  g.globalAlpha = R;
  g.fillStyle = col;
  for (let i = 0; i < 6; i++) {
    const t = i / 5, px = lerp(headX - 3, 6, t), py = lerp(headY + 5, by - 10, t);
    const tx = px - 11 - 7 * t - flare * 8, ty = py + 10 + 4 * t - flare * 6;
    g.beginPath();
    g.moveTo(px + 5, py - 3);
    g.quadraticCurveTo(px - 3, py + 3, tx, ty);
    g.quadraticCurveTo(px + 2, py + 8, px + 6, py + 3);
    g.closePath(); g.fill();
  }
  for (let i = 0; i < 4; i++) {        // saddle feathers, flowing toward the tail
    const x = -6 - i * 5, y = by - 17 + i * 1.5;
    g.beginPath();
    g.moveTo(x + 5, y);
    g.quadraticCurveTo(x - 6, y + 2, x - 16, y + 12);
    g.quadraticCurveTo(x - 3, y + 7, x + 4, y + 5);
    g.closePath(); g.fill();
  }
  g.restore();
}
// Frizzled feathers curl up and out, like a feather duster!
function drawFrizzle(g, B, rx, ry, by, n, seed) {
  const R = seeded(seed * 17 + 3), count = n === 2 ? 17 : 11, k = n === 2 ? 1.35 : 1;
  for (let i = 0; i < count; i++) {
    const a = Math.PI * (0.95 + (i / (count - 1)) * 1.1) + (R() - 0.5) * 0.15;
    const x = -2 + Math.cos(a) * rx * 0.96, y = by + Math.sin(a) * ry * 0.96;
    g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2 + (R() - 0.5) * (n === 2 ? 0.9 : 0.4));
    g.beginPath(); g.moveTo(-3.4 * k, 1); g.quadraticCurveTo(-1, -8 * k, 3.4 * k, 1); g.closePath();
    g.fillStyle = i % 2 ? B.body : B.light; g.fill();
    g.strokeStyle = rgba(B.shade, 0.45); g.lineWidth = 0.8; g.stroke();
    g.restore();
  }
}

// ---------- Getting boys ----------
// Older farms get one free boy of each kind, so they can hatch babies right away
function giftMales() {
  game.maleGift = game.maleGift || {};
  if (game.roosterGift) game.maleGift.chicken = true;
  const met = [];
  for (const id of FARM_ORDER) {
    const st = farms[id];
    if (!st.unlocked) continue;
    const byKind = {};
    for (const c of st.birds) { const k = kindOf(c); if (!KINDS[k].sterile) (byKind[k] = byKind[k] || []).push(c); }
    for (const k in byKind) {
      if (game.maleGift[k]) continue;
      game.maleGift[k] = true;
      const list = byKind[k], grown = list.filter((c) => c.growth >= 1);
      if (list.some(isRooster) || !grown.length || st.birds.length >= capacityOf(id)) continue;
      const m = addBirdToFarm(id, pick(grown).breed, 1, "rooster");
      m.needsSpot = true; m.crowT = rand(4, 10);
      met.push(`${m.name} the ${KINDS[k].male === "male" ? KIND_NOUN[k].toLowerCase() : KINDS[k].male}`);
    }
  }
  if (!met.length) return "";
  const list = met.length > 1 ? `${met.slice(0, -1).join(", ")} and ${met[met.length - 1]}` : met[0];
  return `Say hello to ${list}! 💙 Now your birds can have babies.`;
}

// Things to remember about genes in the save
game.crossesSeen = {};    // famous crosses you've hatched
game.maleGift = {};       // kinds of birds that already got a free boy

// Older saves: a few crosses used to be their own breeds
const OLD_CROSS = {
  blackStar: { name: "Black Star", dad: "rir", mom: "barred" }, goldenComet: { name: "Golden Comet", dad: "rir", mom: "leghorn" },
  cinnamonQueen: { name: "Cinnamon Queen", dad: "rir", mom: "wyandotte" }, austraWhite: { name: "Austra White", dad: "australorp", mom: "leghorn" },
};
// Genes for a bird loaded from a save
function genoFromSave(b, sex) {
  const kind = kindOfBreed(b.breed);
  if (b.geno) return cleanGeno(kind, b.geno, sex);
  if (!BREEDS[b.breed].cross || kind === "mule") return null;        // made from its breed when needed
  // an older mix: rebuild its genes from its parents' breeds
  const find = (name) => Object.keys(BREEDS).find((k) => BREEDS[k].name === name && kindOfBreed(k) === kind);
  const any = () => pick(Object.keys(BREEDS).filter((k) => kindOfBreed(k) === kind && !BREEDS[k].cross));
  const M = (b.fromParents && b.fromParents.mom) || find(b.mom) || any(), D = (b.fromParents && b.fromParents.dad) || find(b.dad) || any();
  return inheritGenes(kind, genesFor(kind, BREEDS[M].genes, "hen"), genesFor(kind, BREEDS[D].genes, "rooster"), sex);
}

// ---------- Sticker book: facts and stickers for all the new birds ----------
Object.assign(FACTS, {
  newHampshire: "New Hampshires came from Rhode Island Reds, but they grow faster and are a lighter red.",
  whiteRock: "White Rocks secretly carry a silver gene. That's the key to making Golden Comets!",
  delaware: "Delawares are white with a black-striped neck. They were America's favorite broiler in the 1940s.",
  dominique: "The Dominique is America's oldest chicken breed. It's like a Barred Rock with a rose comb.",
  brownLeghorn: "Brown Leghorns have the \"wild\" colors: that's what chickens looked like in the jungle long ago!",
  goldWyandotte: "Gold Laced Wyandottes have gold feathers, each one outlined in black.",
  blueLacedRed: "Blue Laced Red Wyandottes carry one blue gene, so their lacing is blue instead of black.",
  lightSussex: "Light Sussex have the \"Columbian\" pattern: white body, black-striped neck, black tail.",
  cochin: "Blue Cochins carry one blue gene. Two blues make chicks that are black, blue, or splash!",
  buffCochin: "Cochins have so many fluffy feathers that they look like big pom-poms with feet.",
  lightBrahma: "Brahmas are gentle giants. Their pea combs keep them safe from frostbite in the cold.",
  jerseyGiant: "Jersey Giants are the biggest chicken breed from America. A rooster can weigh 13 pounds!",
  bcMarans: "Black Copper Marans lay the darkest eggs of all, as dark as a chocolate bar.",
  welsummer: "Welsummers lay dark eggs with speckles. The rooster on cereal boxes is a Welsummer!",
  barnevelder: "Barnevelders have double-laced feathers: two rings of black on every feather.",
  ameraucana: "Ameraucanas lay blue eggs and have beards and fluffy cheeks called muffs.",
  creamLegbar: "Cream Legbars lay blue eggs and are \"autosexing\": boy chicks look different from girl chicks.",
  blueAndalusian: "Blue Andalusians never breed true: blue × blue gives black, blue, AND splash chicks!",
  lavenderOrp: "Lavender is a recessive gene. It takes two copies to make that soft purple-gray color.",
  chocolateOrp: "The chocolate gene rides on the Z chromosome, so chocolate moms give it to all their sons.",
  ancona: "Anconas are black with white tips on their feathers, like someone splashed them with paint.",
  hamburg: "Silver Spangled Hamburgs have a round black spot at the tip of every feather.",
  turken: "Naked Necks have half as many feathers, which keeps them cool when it's hot.",
  frizzle: "Frizzle × Frizzle chicks can be frizzled, extra-curly \"frazzled,\" or smooth!",
  faverolles: "Salmon Faverolles have beards, feathery feet, and FIVE toes on each foot.",
  houdan: "Houdans have a crest, a beard, five toes, and a V-shaped comb like little horns.",
  sultan: "Sultans came from Turkey, where they lived in the gardens of the sultan's palace.",
  araucana: "Araucanas have no tail, little ear tufts, and lay blue eggs. They're from Chile!",
  ayamCemani: "Ayam Cemanis are black all over: feathers, skin, comb, beak, and even their insides!",
  sebright: "Sebright roosters are \"hen-feathered\": they don't grow long pointy rooster feathers.",
  serama: "The Serama is the smallest chicken in the world. Some weigh less than a can of soda!",
  phoenix: "Phoenix roosters can grow tails that are longer than a grown-up is tall.",
  spitzhauben: "Spitzhauben means \"pointy hood\" in German, because of its little forward-pointing crest.",
  rouen: "Rouens look like big Mallards. They're great to look at but lay fewer eggs.",
  cayuga: "Cayuga eggs start out nearly black, then get lighter as the laying season goes on.",
  khakiCampbell: "A Khaki Campbell can lay over 300 eggs a year, more than most chickens!",
  crestedDuck: "Crested ducks always have one crest gene. The puff on their head is a little cushion of feathers.",
  magpieDuck: "Magpie ducks are white with a black cap and a black back, like a magpie bird.",
  welshHarlequin: "Welsh Harlequins have a frosty \"harlequin\" gene that makes their colors pale and pretty.",
  appleyard: "Silver Appleyards were made by Reginald Appleyard in England to be pretty AND good layers.",
  buffDuck: "Buff ducks get their color from two genes at once: brown and blue together make buff!",
  muscovy: "Muscovies aren't related to Mallards. They hiss instead of quack and love to perch in trees.",
  whiteMuscovy: "Muscovy drakes are almost twice as big as the hens.",
  blueMuscovy: "Muscovies have red bumpy skin on their faces called caruncles.",
  toulouse: "Toulouse geese are big and gray, with a floppy chin pouch called a dewlap.",
  african: "African geese have a big knob on their bill and a dewlap under their chin.",
  chinese: "Chinese geese are the best-laying geese, and they make great watch-geese!",
  whiteChinese: "White Chinese geese have orange knobs instead of black ones.",
  sebastopol: "Sebastopol geese have long curly feathers that look like ribbons.",
  pilgrim: "Pilgrim ganders are white and the geese are gray, so you can tell them apart right away!",
  americanBuff: "American Buff geese are the color of creamy caramel, with orange bills and feet.",
  pomeranian: "Pomeranian geese have a gray \"saddle\" on their backs and a gray head.",
  polishSwan: "Polish swans carry a gene that makes their babies white instead of gray.",
  trumpeter: "Trumpeter swans are the biggest waterbirds in North America. Their call sounds like a trumpet!",
  goldenQuail: "Golden quail have two golden genes. With just one, they're called Italian quail.",
  englishWhite: "English White quail have a recessive white gene and dark eyes.",
  tibetan: "Tibetan quail have two dark genes. With just one, they're a reddish color called Rosetta.",
  tuxedoQuail: "Tuxedo quail have a white chest, like they're wearing a fancy suit.",
  celadonQuail: "Celadon quail lay sky-blue eggs with no spots. It's a recessive gene!",
  jumboQuail: "Jumbo quail are twice as big as regular Coturnix quail.",
  bobwhite: "Bobwhites say their own name: \"bob-WHITE!\" Boys have a white throat, girls have a tan one.",
  snowflake: "Snowflake Bobwhites are white with little black flecks, like snow with pepper.",
  lavenderGuinea: "Lavender guineas carry two lavender genes, which make their gray soft and light.",
  whiteGuinea: "White guineas are all white, even their babies (called keets).",
  royalPurple: "Royal Purple guineas don't have polka dots. They shine purple in the sun.",
  buffGuinea: "Buff guineas are a warm brown, with white polka dots.",
  piedGuinea: "Pied guineas have a white chest. Two pied genes make them mostly white!",
  blackneck: "English Blackneck pheasants don't have the white neck ring.",
  melanistic: "Melanistic pheasants are so dark they look black, but they shine green and purple.",
  whitePheasant: "White pheasants have two recessive white genes. Even the boys are all white!",
  buffPheasant: "Buff pheasants are a soft golden color instead of copper.",
  yellowGolden: "Yellow Golden pheasants have yellow where regular Goldens are red.",
  darkThroated: "Dark-throated Golden pheasants have a dark throat, and their hens are darker too.",
  ladyAmherst: "Lady Amherst pheasants have a white cape with black stripes and a very long tail.",
  silverPh: "Silver pheasant roosters are white with black stripes and have bright red faces and legs.",
  reeves: "Reeves's pheasants have the longest tail feathers of any bird, up to 7 feet long!",
  blackSpanish: "Black Spanish turkeys are black all over and shine green in the sun.",
  bourbonRed: "Bourbon Red turkeys come from Kentucky and are dark red with white wings and tail.",
  narragansett: "Narragansett turkeys are steel gray, black, and white. They're one of the oldest American breeds.",
  royalPalm: "Royal Palm turkeys are white with black stripes on every feather.",
  blueSlate: "Blue Slate turkeys carry one slate gene. They're a soft blue-gray.",
  whiteHolland: "White Holland turkeys have two recessive white genes. Only the tom's beard stays black!",
  midgetWhite: "Midget White turkeys are a smaller white turkey, about half the size of other turkeys.",
  chilean: "Chilean flamingos have gray legs with pink \"knees\" (really their ankles!).",
  greater: "Greater flamingos are the biggest and palest flamingos.",
  lesser: "Lesser flamingos are the smallest flamingos, but there are more of them than any other kind.",
  andean: "Andean flamingos have yellow legs and live high in the mountains of South America.",
  james: "James's flamingos were thought to be gone forever until they were found again in 1956!",
  greenPeafowl: "Green peafowl are a different species from India Blues. Even the hens are colorful!",
  piedPeacock: "Pied peafowl have one white gene. They have white patches all over.",
  cameoPeacock: "Cameo is brown, and it rides on the Z chromosome, like chocolate in chickens.",
  purplePeacock: "Purple peafowl shine purple instead of blue. It's a Z-chromosome gene too.",
  blackShoulder: "Black Shoulder peacocks have black wings. Their hens are almost white!",
  opalPeacock: "Opal peafowl are a soft gray-blue, like a stormy sky.",
});
SPECIAL_STICKERS.push(
  { id: "rooster", emoji: "🐓", name: "Cock-a-doodle-doo!", how: "Get a rooster for your flock", done: () => farms.backyard.birds.some((c) => isChicken(c) && isRooster(c)) },
  { id: "perfectFlock", emoji: "💚", name: "Perfect Flock", how: "Get the boy-girl balance just right", done: () => FARM_ORDER.some((id) => farms[id].unlocked && Object.values(flockStats(id)).some((s) => s.key === "good")) },
  ...GENE_STICKERS,
  ...NAMED_CROSSES.filter((x) => !x.breed).map((x) => ({ id: "x_" + x.name, emoji: x.emoji, name: x.name, how: x.hint, fact: x.fact, done: () => !!game.crossesSeen[x.name] })),
);


// ---------- Real gene names ----------
// Scientists write genes with short symbols. A "⁺" means the ordinary wild
// version. We only show symbols where the real ones match our genes.
const SYMBOLS = {
  chicken: {
    base: { E: "E", ER: "Eᴿ", R: "eᵂʰ", p: "e⁺" }, silver: { S: "S", s: "s⁺" }, bar: { B: "B", b: "b⁺" },
    domW: { I: "I", i: "i⁺" }, recW: { C: "C⁺", c: "c" }, blue: { Bl: "Bl", bl: "bl⁺" }, lav: { L: "Lav⁺", lav: "lav" },
    choc: { Ch: "Choc⁺", ch: "choc" }, silkie: { H: "H⁺", h: "h" }, frizzle: { F: "F", f: "f⁺" }, naked: { Na: "Na", na: "na⁺" },
    crest: { Cr: "Cr", cr: "cr⁺" }, beard: { Mb: "Mb", mb: "mb⁺" }, feet: { Pti: "Pti", pti: "pti⁺" }, toes: { Po: "Po", po: "po⁺" },
    rose: { Rc: "R", rc: "r⁺" }, pea: { Pc: "P", pc: "p⁺" }, vcomb: { D: "Dᵛ", d: "d⁺" }, blueEgg: { O: "O", o: "o⁺" },
    skin: { Fm: "Fm", fm: "fm⁺" }, skinY: { W: "W⁺", w: "w" }, rump: { Rp: "Rp", rp: "rp⁺" }, tufts: { Et: "Et", et: "et⁺" },
    henny: { Hf: "Hf", hf: "hf⁺" }, longTail: { Gt: "Gt⁺", gt: "gt" },
  },
  duck: { base: { E: "E", M: "M⁺", md: "mᵈ" }, blue: { Bl: "Bl", bl: "bl⁺" }, brown: { D: "D⁺", d: "d" }, white: { C: "C⁺", c: "c" }, harl: { Hq: "H⁺", hq: "h" }, crest: { Cr: "Cr", cr: "cr⁺" } },
  goose: { sd: { Sd: "Sd", sd: "sd⁺" }, buff: { G: "G⁺", g: "g" } },
  turkey: { base: { B: "B", "b+": "b⁺", b: "b" }, narr: { N: "N⁺", n: "n" }, white: { C: "C⁺", c: "c" }, palm: { Cp: "C⁺", cp: "cᵖ" } },
};
for (const kind in SYMBOLS) for (const L of LOCI[kind]) if (SYMBOLS[kind][L.id]) L.sym = SYMBOLS[kind][L.id];
// In ducks, the brown (khaki) gene rides on the Z chromosome, like silver in chickens
locusOf("duck", "brown").z = true;
// Breeds of these birds are color varieties, named by their color (like "Blue Slate")
for (const k of ["quail", "bobwhite", "guinea", "pheasant", "ruffed", "turkey", "peafowl", "muscovy"]) KINDS[k].varieties = true;

// ---------- Wild ancestors (they start the family trees) ----------
Object.assign(BREEDS, {
  junglefowl: { species: "chicken", name: "Red Junglefowl", price: 0, cross: true, wild: true, genes: { base: "p", size: 0.8, combSize: 0.9, brownEgg: 1 } },
  greylag:    { species: "goose", name: "Greylag Goose", price: 0, cross: true, wild: true, genes: { size: 0.9 } },
  swanGoose:  { species: "goose", name: "Swan Goose", price: 0, cross: true, wild: true, genes: { knob: ["K", "k"], size: 0.9 } },
  wildTurkey: { species: "turkey", name: "Wild Turkey", price: 0, cross: true, wild: true, genes: { size: 0.95 } },
});
for (const k of ["junglefowl", "greylag", "swanGoose", "wildTurkey"]) BREEDS[k].egg = LOOKS[kindOfBreed(k)](genesFor(kindOfBreed(k), BREEDS[k].genes, "hen"), false).egg;
Object.assign(FACTS, {
  junglefowl: "Every chicken in the world comes from this wild jungle bird (plus a little Grey Junglefowl, which gave chickens their yellow legs!).",
  greylag: "The wild ancestor of most farm geese. Greylags fly thousands of miles every year.",
  swanGoose: "A wild goose from China and Mongolia. Chinese and African geese come from it.",
  wildTurkey: "People in Mexico tamed wild turkeys about 2,000 years ago. All farm turkeys come from them.",
});

// Where each breed comes from, and when
const ORIGINS = {
  junglefowl: "Jungles of Southeast Asia · wild", rir: "Rhode Island, USA · 1800s", newHampshire: "New Hampshire, USA · 1910s", buff: "Orpington, England · 1894",
  barred: "Massachusetts, USA · 1860s", whiteRock: "USA · 1870s", leghorn: "Tuscany, Italy · 1800s", australorp: "Australia · 1920s", wyandotte: "New York, USA · 1880s",
  sussex: "Sussex, England · 1800s", easter: "USA · modern", delaware: "Delaware, USA · 1940", dominique: "USA · 1700s", brownLeghorn: "Tuscany, Italy",
  goldWyandotte: "Wisconsin, USA · 1880", blueLacedRed: "A Wyandotte color", lightSussex: "Sussex, England", cochin: "Shanghai, China · 1840s", buffCochin: "Shanghai, China",
  lightBrahma: "USA, from birds brought from China · 1850s", jerseyGiant: "New Jersey, USA · 1890s", marans: "Marans, France · 1920s", bcMarans: "Marans, France",
  welsummer: "Welsum, Netherlands · 1920s", barnevelder: "Barneveld, Netherlands · 1900s", ameraucana: "USA · 1970s", creamLegbar: "Cambridge, England · 1940s",
  blueAndalusian: "Andalusia, Spain · 1800s", olive: "USA · modern", lavenderOrp: "An Orpington color", chocolateOrp: "An Orpington color", ancona: "Ancona, Italy",
  hamburg: "Netherlands & Germany · 1700s", turken: "Transylvania, Romania", polish: "Netherlands · 1600s", silkie: "China · 1200s or earlier", frizzle: "Southeast Asia",
  faverolles: "Faverolles, France · 1860s", houdan: "Houdan, France", sultan: "Turkey · to England in 1854", araucana: "Chile", ayamCemani: "Java, Indonesia",
  sebright: "England · 1810", serama: "Malaysia · 1990s", phoenix: "Germany · 1880s", spitzhauben: "Appenzell, Switzerland",
  pekin: "China · to the USA in 1873", mallard: "Wild all over the northern world", rouen: "Rouen, France", runner: "Indonesia · 1800s", swedish: "Pomerania (Sweden & Germany)",
  call: "Netherlands · 1600s", cayuga: "New York, USA · 1840s", khakiCampbell: "England · 1901", crestedDuck: "Asia & the Netherlands", magpieDuck: "Wales · 1920s",
  welshHarlequin: "Wales · 1949", appleyard: "England · 1940s", buffDuck: "England · 1890s", muscovy: "Wild in Central & South America", whiteMuscovy: "A Muscovy color",
  blueMuscovy: "A Muscovy color", greylag: "Wild in Europe & Asia", swanGoose: "Wild in China & Mongolia", embden: "Emden, Germany", toulouse: "Toulouse, France",
  african: "Asia (not Africa!)", chinese: "China", whiteChinese: "China", sebastopol: "Around the Black Sea", pilgrim: "USA · 1930s", americanBuff: "USA · 1900s",
  pomeranian: "Pomerania (Germany & Poland)", muteSwan: "Wild in Europe & Asia", polishSwan: "A Mute Swan color", blackSwan: "Wild in Australia", trumpeter: "Wild in North America",
  coturnix: "Wild in Asia, Europe & Africa · tamed in Japan", goldenQuail: "A Coturnix color", englishWhite: "A Coturnix color", tibetan: "A Coturnix color",
  tuxedoQuail: "A Coturnix color", celadonQuail: "A Coturnix egg color", jumboQuail: "Bred to be big", california: "Wild in California, USA", bobwhite: "Wild in the eastern USA",
  snowflake: "A Bobwhite color", guinea: "Wild in Africa", lavenderGuinea: "A guinea color", whiteGuinea: "A guinea color", royalPurple: "A guinea color", buffGuinea: "A guinea color",
  piedGuinea: "A guinea color", ringneck: "China · to the USA in 1881", blackneck: "Around the Caucasus Mountains", melanistic: "A pheasant color", whitePheasant: "A pheasant color",
  buffPheasant: "A pheasant color", goldenPh: "Mountain forests of China", yellowGolden: "A Golden Pheasant color", darkThroated: "A Golden Pheasant color",
  ladyAmherst: "China & Myanmar", silverPh: "Southeast Asia & China", reeves: "China", wildTurkey: "Wild in North America", turkey: "USA · 1700s", blackSpanish: "Spain & Europe",
  bourbonRed: "Bourbon County, Kentucky · 1880s", narragansett: "Rhode Island, USA · 1700s", royalPalm: "Florida, USA · 1920s", blueSlate: "USA · 1800s",
  whiteHolland: "USA (not Holland!)", midgetWhite: "Massachusetts, USA · 1960s", flamingo: "Caribbean", chilean: "South America", greater: "Africa, Europe & Asia",
  lesser: "Africa & India", andean: "Andes Mountains", james: "Andes Mountains", peacock: "India & Sri Lanka", greenPeafowl: "Southeast Asia", whitePeacock: "An India Blue color",
  piedPeacock: "An India Blue color", cameoPeacock: "USA · 1960s", purplePeacock: "An India Blue color", blackShoulder: "England · 1800s (Darwin wrote about it!)",
  opalPeacock: "An India Blue color",
};
// Each breed's parents in the family tree (real history, simplified)
const TREE_PARENTS = {
  brownLeghorn: ["junglefowl"], leghorn: ["brownLeghorn"], ancona: ["junglefowl"], blueAndalusian: ["junglefowl"], hamburg: ["junglefowl"],
  polish: ["junglefowl"], spitzhauben: ["junglefowl"], houdan: ["polish"], sultan: ["polish"], faverolles: ["houdan", "lightBrahma"],
  cochin: ["junglefowl"], buffCochin: ["cochin"], frizzle: ["junglefowl"], lightBrahma: ["cochin"], silkie: ["junglefowl"], araucana: ["junglefowl"],
  ameraucana: ["araucana"], easter: ["araucana"], creamLegbar: ["brownLeghorn", "barred", "araucana"], olive: ["bcMarans", "ameraucana"],
  marans: ["junglefowl"], bcMarans: ["marans"], welsummer: ["junglefowl"], barnevelder: ["cochin"], sussex: ["junglefowl"], lightSussex: ["sussex", "lightBrahma"],
  dominique: ["junglefowl"], barred: ["dominique"], whiteRock: ["barred"], rir: ["cochin", "brownLeghorn"], newHampshire: ["rir"], delaware: ["barred", "newHampshire"],
  wyandotte: ["hamburg", "lightBrahma"], goldWyandotte: ["wyandotte"], blueLacedRed: ["goldWyandotte"], buff: ["hamburg", "buffCochin"], australorp: ["buff"],
  lavenderOrp: ["buff"], chocolateOrp: ["buff"], jerseyGiant: ["lightBrahma"], turken: ["junglefowl"], ayamCemani: ["junglefowl"], sebright: ["hamburg", "polish"],
  serama: ["junglefowl"], phoenix: ["junglefowl"],
  pekin: ["mallard"], rouen: ["mallard"], runner: ["mallard"], call: ["mallard"], cayuga: ["mallard"], swedish: ["mallard"], crestedDuck: ["mallard"],
  magpieDuck: ["mallard"], appleyard: ["rouen", "pekin"], khakiCampbell: ["runner", "rouen"], welshHarlequin: ["khakiCampbell"], buffDuck: ["runner", "rouen", "cayuga"],
  whiteMuscovy: ["muscovy"], blueMuscovy: ["muscovy"],
  embden: ["greylag"], toulouse: ["greylag"], pilgrim: ["greylag"], americanBuff: ["greylag"], pomeranian: ["greylag"], sebastopol: ["greylag"],
  chinese: ["swanGoose"], whiteChinese: ["chinese"], african: ["swanGoose"], polishSwan: ["muteSwan"],
  goldenQuail: ["coturnix"], englishWhite: ["coturnix"], tibetan: ["coturnix"], tuxedoQuail: ["tibetan"], celadonQuail: ["coturnix"], jumboQuail: ["coturnix"], snowflake: ["bobwhite"],
  lavenderGuinea: ["guinea"], whiteGuinea: ["guinea"], royalPurple: ["guinea"], buffGuinea: ["guinea"], piedGuinea: ["guinea"],
  blackneck: ["ringneck"], melanistic: ["ringneck"], whitePheasant: ["ringneck"], buffPheasant: ["ringneck"], yellowGolden: ["goldenPh"], darkThroated: ["goldenPh"],
  turkey: ["wildTurkey"], blackSpanish: ["wildTurkey"], bourbonRed: ["turkey", "whiteHolland"], narragansett: ["wildTurkey", "blackSpanish"], royalPalm: ["turkey"],
  blueSlate: ["blackSpanish"], whiteHolland: ["turkey"], midgetWhite: ["royalPalm", "whiteHolland"],
  whitePeacock: ["peacock"], piedPeacock: ["peacock"], cameoPeacock: ["peacock"], purplePeacock: ["peacock"], blackShoulder: ["peacock"], opalPeacock: ["peacock"],
};
const TREE_GROUPS = [
  { id: "chickens", title: "Chickens", icon: "🐔", kinds: ["chicken"] },
  { id: "ducks", title: "Ducks", icon: "🦆", kinds: ["duck", "muscovy", "mule"] },
  { id: "geese", title: "Geese & Swans", icon: "🦢", kinds: ["goose", "swan"] },
  { id: "quail", title: "Quail", icon: "🐦", kinds: ["quail", "calQuail", "bobwhite"] },
  { id: "guineas", title: "Guineas", icon: "🐦", kinds: ["guinea"] },
  { id: "pheasants", title: "Pheasants", icon: "🐦", kinds: ["pheasant", "ruffed", "silverPh", "reeves"] },
  { id: "turkeys", title: "Turkeys", icon: "🦃", kinds: ["turkey"] },
  { id: "flamingos", title: "Flamingos", icon: "🦩", kinds: ["flamingo"] },
  { id: "peafowl", title: "Peafowl", icon: "🦚", kinds: ["peafowl"] },
];

// ---------- The family tree ----------
// Like the sticker book: every breed starts gray and gets its colors when
// you raise one. Tap any bird to learn what makes it special.
let bookTab = "stickers", treeGroup = "chickens", treeSel = null, treeScroll = 0;
const crossGenoCache = {};
function treeNodes(group) {
  const nodes = new Map();
  for (const k in BREEDS) {
    const B = BREEDS[k];
    if (!group.kinds.includes(kindOfBreed(k)) || (B.cross && !B.wild)) continue;
    nodes.set(k, { id: k, key: k, name: B.name, wild: !!B.wild, parents: (TREE_PARENTS[k] || []).slice() });
  }
  for (const x of NAMED_CROSSES) {
    if (!x.dad || !group.kinds.includes(x.kind === "mule" ? "mule" : x.kind) || x.breed) continue;
    nodes.set("x:" + x.name, { id: "x:" + x.name, cross: x, name: x.name, parents: [x.dad, x.mom] });
  }
  for (const n of nodes.values()) n.parents = n.parents.filter((p) => nodes.has(p));
  return nodes;
}
const nodeOpen = (n) => n.wild || (n.cross ? !!game.crossesSeen[n.cross.name] : !!game.stickers[n.key]);
// A pretend bird to draw for a tree node
function nodeBird(n, sex) {
  if (!n.cross) return portraitBird(n.key, n.wild && n.key === "junglefowl" ? "rooster" : sex);
  const x = n.cross, kind = x.kind === "mule" ? "mule" : x.kind, s = sex || "hen";
  if (!crossGenoCache[x.name + s] && kind !== "mule") {
    const dadG = genesFor(kind, BREEDS[x.dad].genes, "rooster"), momG = genesFor(kind, BREEDS[x.mom].genes, "hen");
    let G = inheritGenes(kind, momG, dadG, s);
    if (x.name === "Sizzle" || x.name === "Showgirl") G.silkie = ["h", "h"];   // (it takes a second generation)
    if (x.name === "Showgirl") G.naked = ["Na", "Na"];
    crossGenoCache[x.name + s] = G;
  }
  const c = makeBird({ breed: kind === "mule" ? "mulard" : KINDS[kind].mix, geno: crossGenoCache[x.name + s] || null, cross: x.name, sex: s, growth: 1, name: "Tree" });
  nextId--;
  c.portrait = true;
  return c;
}
function renderTree() {
  const body = $("treeBody"), kindsEl = $("treeKinds");
  kindsEl.textContent = "";
  for (const gr of TREE_GROUPS) {
    const b = el("button", "tree-kind" + (gr.id === treeGroup ? " on" : ""), `${gr.icon} ${gr.title}`);
    b.type = "button";
    b.addEventListener("click", () => { treeGroup = gr.id; treeSel = null; Sound.tick(); renderTree(); body.scrollTop = 0; });
    kindsEl.append(b);
  }
  body.textContent = "";
  const group = TREE_GROUPS.find((g) => g.id === treeGroup), nodes = treeNodes(group);
  const all = [...nodes.values()].filter((n) => !n.wild), open = all.filter(nodeOpen).length;
  bookCount.textContent = `${open} of ${all.length} colored in`;
  if (treeSel && nodes.has(treeSel)) { renderTreeDetail(nodes.get(treeSel), nodes); return; }
  // children hang under their first parent
  const kids = new Map();
  for (const n of nodes.values()) if (n.parents.length) { const p = n.parents[0]; if (!kids.has(p)) kids.set(p, []); kids.get(p).push(n); }
  const byName = (a, b) => (!!a.cross - !!b.cross) || a.name.localeCompare(b.name);
  const roots = [...nodes.values()].filter((n) => !n.parents.length).sort((a, b) => (b.wild - a.wild) || byName(a, b));
  const branch = (list) => {
    const ul = el("ul", "tree");
    for (const n of list) {
      const li = el("li");
      const btn = el("button", "tree-node" + (nodeOpen(n) ? "" : " locked") + (n.wild ? " wild" : "") + (n.cross ? " cross" : ""));
      btn.type = "button";
      const cv = el("canvas", "tree-pic");
      drawPortrait(cv, nodeBird(n), 64, 52);
      const text = el("span", "tree-text");
      const sub = n.cross ? `${BREEDS[n.cross.dad].name} × ${BREEDS[n.cross.mom].name}` : n.wild ? "Wild ancestor" : n.parents.length > 1 ? `with ${n.parents.slice(1).map((p) => nodes.get(p).name).join(" & ")}` : ORIGINS[n.key] || "";
      text.append(el("b", null, n.name), el("small", null, sub));
      btn.append(cv, text);
      btn.addEventListener("click", () => { treeScroll = body.scrollTop; treeSel = n.id; Sound.tick(); renderTree(); body.scrollTop = 0; });
      li.append(btn);
      const ch = (kids.get(n.id) || []).sort(byName);
      if (ch.length) li.append(branch(ch));
      ul.append(li);
    }
    return ul;
  };
  body.append(branch(roots));
  requestAnimationFrame(() => { body.scrollTop = treeScroll; });
}
function renderTreeDetail(n, nodes) {
  const body = $("treeBody"), open = nodeOpen(n);
  const back = el("button", "tree-back", "‹ Back to the tree");
  back.type = "button";
  back.addEventListener("click", () => { treeSel = null; Sound.tick(); renderTree(); });
  const card = el("div", "tree-card" + (open ? "" : " locked"));
  const cv = el("canvas", "tree-big");
  drawPortrait(cv, nodeBird(n), 200, 160);
  const info = el("div", "tree-info");
  const tag = n.wild ? "Wild ancestor" : n.cross ? "Famous cross" : "Breed";
  info.append(el("span", "tree-tag", tag), el("h3", null, n.name));
  const where = n.cross ? "Made by hatching" : ORIGINS[n.key];
  if (where) info.append(el("p", "tree-origin", `🌍 ${where}`));
  info.append(el("p", "tree-fact", n.cross ? n.cross.fact : FACTS[n.key] || ""));
  // the genes that make it special
  const bird = nodeBird(n, "hen"), chips = el("div", "gene-row");
  for (const ch of geneChips(bird)) chips.append(el("span", "gene-chip" + (ch.shows ? "" : " carried"), ch.text));
  if (chips.childNodes.length) info.append(el("span", "field-label", "Special genes"), chips);
  const egg = lookOf(bird).egg, eggRow = el("p", "tree-egg"), dot = el("i", "egg-dot");
  dot.style.background = egg.color;
  eggRow.append(dot, document.createTextNode(`Lays ${egg.name.toLowerCase()} eggs`));
  if (!KINDS[kindOf(bird)].sterile) info.append(eggRow);
  // family: parents and babies in the tree
  const link = (id) => { const m = nodes.get(id), b = el("button", "tree-link" + (nodeOpen(m) ? "" : " locked"), m.name); b.type = "button"; b.addEventListener("click", () => { treeSel = id; Sound.tick(); renderTree(); }); return b; };
  if (n.parents.length) { const row = el("div", "tree-links"); row.append(el("span", "field-label", n.cross ? "Dad × Mom" : "Comes from")); n.parents.forEach((p) => row.append(link(p))); info.append(row); }
  const children = [...nodes.values()].filter((m) => m.parents.includes(n.id));
  if (children.length) { const row = el("div", "tree-links"); row.append(el("span", "field-label", "Led to")); children.forEach((m) => row.append(link(m.id))); info.append(row); }
  // how to get one
  let how;
  if (n.wild) how = "Wild birds can't be bought. Their great-great-grandchildren live on your farm!";
  else if (n.cross) how = `Hatch one: a ${BREEDS[n.cross.dad].name} dad and a ${BREEDS[n.cross.mom].name} mom.`;
  else {
    const B = BREEDS[n.key], farm = FARMS[farmOfBreed(n.key)];
    how = `Market: ${B.price} eggs at the ${farm.name}${B.tier > 1 ? ` (needs the ${COOP_TIERS[B.tier].name})` : ""}.`;
  }
  info.append(el("p", "tree-how", (open ? "" : "🔒 Raise one to color it in! ") + how));
  card.append(cv, info);
  body.append(back, card);
}
function setBookTab(tab) {
  bookTab = tab;
  $("tabStickers").classList.toggle("on", tab === "stickers");
  $("tabTree").classList.toggle("on", tab === "tree");
  $("tabStickers").setAttribute("aria-selected", String(tab === "stickers"));
  $("tabTree").setAttribute("aria-selected", String(tab === "tree"));
  bookGrid.hidden = tab !== "stickers";
  $("treeView").hidden = tab !== "tree";
  if (tab === "tree") renderTree(); else renderBook();
}
$("tabStickers").addEventListener("click", () => { Sound.tick(); setBookTab("stickers"); });
$("tabTree").addEventListener("click", () => { Sound.tick(); setBookTab("tree"); });

// ---------- Finding birds a new home ----------
// Too many roosters? Want fresh birds? A friendly farm down the road will
// take any bird, and they say thanks with a few eggs.
function rehomeGift(c) {
  if (c.growth < 1) return 1;
  const B = BREEDS[c.breed];
  return B.cross ? 3 * SP(c).eggValue : Math.max(2, Math.round(B.price * 0.4));
}
function rehomeBird(c) {
  if (!F.birds.includes(c) || c.leaving) return;
  const eggs = rehomeGift(c);
  game.eggs += eggs;
  game.stats.rehomed = (game.stats.rehomed || 0) + 1;
  updateHud(); bumpBasket();
  if (cardBird === c) hideSheet();
  if (hatchMom === c) hatchMom = null;
  if (hatchDad === c) hatchDad = null;
  if (c.loc === "yard" && scene === "yard") {       // a little goodbye wave of hearts, then off they go
    c.leaving = 1; c.state = "idle"; c.goal = null; c.t = 99; c.tagT = 0;
    const sc = scaleAt(c.y);
    hearts(c.x, c.y, c.z + (bodyH(c) + 20) * sc, sc);
  } else F.birds = F.birds.filter((b) => b !== c);
  Sound.chime();
  toast(`${c.name} went to live on a friendly farm down the road. They gave you ${eggs} ${eggs === 1 ? "egg" : "eggs"} to say thanks! 💛`, 3800);
  save();
}
function updateLeaving(dt) {
  if (!F.birds.some((c) => c.leaving)) return;
  for (const c of F.birds) if (c.leaving) { c.leaving = Math.max(0, c.leaving - dt * 0.9); c.alpha = c.leaving; }
  F.birds = F.birds.filter((c) => !c.leaving || c.leaving > 0.01);
}
const rehomeBtn = $("rehomeBtn");
let rehomeArm = false, rehomeTimer = 0;
function resetRehome() {
  rehomeArm = false;
  clearTimeout(rehomeTimer);
  rehomeBtn.classList.remove("arm");
  rehomeBtn.textContent = "🏡 Find a new home";
}
rehomeBtn.addEventListener("click", () => {
  const c = cardBird;
  if (!c) return;
  if (!rehomeArm) {                // tap once to ask, tap again to be sure
    rehomeArm = true;
    rehomeBtn.classList.add("arm");
    rehomeBtn.textContent = `Tap again to say goodbye to ${c.name}`;
    rehomeTimer = setTimeout(resetRehome, 3500);
    Sound.tick();
    return;
  }
  resetRehome();
  rehomeBird(c);
});


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
    birds: st.birds.filter((c) => !c.leaving).map((c) => ({
      breed: c.breed, name: c.name, x: c.x, y: c.y, growth: c.growth, food: c.food, water: c.water,
      joy: c.joy, laid: c.laid, eggClock: c.eggClock, loc: c.loc === "yard" ? "yard" : "coop", needsSpot: c.needsSpot, hat: c.hat || null,
      sex: c.sex, known: c.sexKnown, geno: genoOf(c), cross: c.cross || undefined, mom: c.mom || undefined, dad: c.dad || undefined, kids: c.kids || undefined,
    })),
    yardEggs: st.yardEggs.map((e) => ({ x: e.x, y: e.y, breed: e.breed, egg: e.egg, golden: e.golden })),
    nestEggs: st.nestEggs.map((e) => ({ box: e.box, breed: e.breed, egg: e.egg, golden: e.golden })),
    crates: id === game.farm ? fx.crates.filter((cr) => !cr.opened).map((cr) => ({ breed: cr.breed, sex: cr.sex })) : [],
    incubator: st.incubator.filter((e) => !e.baby).map((e) => ({ breed: e.breed, mom: e.mom, dad: e.dad, egg: e.egg, startedAt: e.startedAt, crack: e.crack || 0 })),
  };
}
function serialize() {
  const out = {
    v: 5, savedAt: Date.now(), eggs: game.eggs, farm: game.farm, time: game.time, day: game.day,
    totalEggs: game.totalEggs, hints: game.hints, muted: game.muted, farms: {},
    stickers: game.stickers, special: game.special, stats: game.stats, bookNew: game.bookNew, roosterGift: game.roosterGift,
    crossesSeen: game.crossesSeen, maleGift: game.maleGift,
    weather: { kind: weather.kind, left: weather.left, next: weather.next },
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
  for (let b of arr(s.birds)) {
    if (st.birds.length >= capacityOf(id)) break;
    const old = b && OLD_CROSS[b.breed];     // crosses that used to be breeds
    if (old) b = Object.assign({}, b, { breed: "mix", cross: old.name, fromParents: old });
    if (!b || !BREEDS[b.breed] || farmOfBreed(b.breed) !== id) continue;
    const c = makeBird({
      breed: b.breed,
      name: typeof b.name === "string" && b.name.trim() ? b.name.trim().slice(0, 16) : undefined,
      x: clampX(num(b.x, view.W * 0.5)), y: clampY(num(b.y, view.H * 0.7)),
      growth: num(b.growth, 1, 0.1, 1), food: num(b.food, 0.8, 0, 1), water: num(b.water, 0.8, 0, 1),
      joy: num(b.joy, 0.5, 0, 1), laid: Math.floor(num(b.laid, 0, 0, 1e6)), eggClock: num(b.eggClock, 30, 0, 600),
      sex: b.sex, sexKnown: b.known !== false, geno: genoFromSave(b, b.sex === "rooster" ? "rooster" : "hen"),
      cross: typeof b.cross === "string" ? b.cross.slice(0, 40) : null,
      mom: typeof b.mom === "string" ? b.mom.slice(0, 30) : null, dad: typeof b.dad === "string" ? b.dad.slice(0, 30) : null,
      kids: Math.floor(num(b.kids, 0, 0, 1e5)),
    });
    c.needsSpot = !!b.needsSpot;
    c.hat = HATS.some((h) => h.id && h.id === b.hat) ? b.hat : null;
    c.loc = b.loc === "coop" && isBedtime() ? "coop" : "yard";
    st.birds.push(c);
  }
  for (const cr of arr(s.crates)) {
    const breed = typeof cr === "string" ? cr : cr && cr.breed;   // older saves kept just the breed
    if (BREEDS[breed] && farmOfBreed(breed) === id && st.birds.length < capacityOf(id)) {
      const c = addBirdToFarm(id, breed, 0.12, cr && cr.sex);
      c.needsSpot = true;
    }
  }
  const boxes = nestCount(id);
  st.yardEggs = arr(s.yardEggs).filter((e) => e && BREEDS[e.breed]).slice(0, SETTINGS.maxYardEggs)
    .map((e) => ({ id: nextId++, x: clampX(num(e.x, view.W / 2)), y: clampY(num(e.y, view.H * 0.7)), breed: e.breed, egg: cleanEgg(e.egg) || undefined, golden: !!e.golden, glint: rand(0, 3) }));
  st.incubator = arr(s.incubator).filter((e) => e && BREEDS[e.breed] && farmOfBreed(e.breed) === id).slice(0, INCUBATOR_SLOTS)
    .map((e) => ({
      breed: e.breed, mom: cleanRec(e.mom), dad: cleanRec(e.dad), egg: cleanEgg(e.egg) || undefined,
      startedAt: num(e.startedAt, Date.now(), 0, Date.now()), crack: Math.floor(num(e.crack, 0, 0, 2)), wobble: 0,
    }));
  st.nestEggs = arr(s.nestEggs).filter((e) => e && BREEDS[e.breed] && e.box >= 0 && e.box < boxes).slice(0, boxes * SETTINGS.nestBoxHolds)
    .map((e) => ({ id: nextId++, box: Math.floor(e.box), breed: e.breed, egg: cleanEgg(e.egg) || undefined, golden: !!e.golden }));
}

function applySave(d) {
  game.eggs = Math.floor(num(d.eggs, 0, 0, 1e7));
  game.time = num(d.time, 0.1, 0, 0.9999);
  game.day = Math.floor(num(d.day, 1, 1, 1e6));
  game.totalEggs = Math.floor(num(d.totalEggs, 0, 0, 1e9));
  game.hints = d.hints && typeof d.hints === "object" ? d.hints : {};
  game.muted = !!d.muted;
  const obj = (v) => (v && typeof v === "object" ? v : {});
  game.stickers = obj(d.stickers);
  game.special = obj(d.special);
  game.stats = Object.assign(freshStats(), obj(d.stats));
  game.stats.seasons = obj(game.stats.seasons);
  game.bookNew = !!d.bookNew;
  game.roosterGift = !!d.roosterGift;
  game.crossesSeen = obj(d.crossesSeen);
  game.maleGift = obj(d.maleGift);
  if (d.weather && (d.weather.kind === "rain" || d.weather.kind === "snow" || d.weather.kind === "clear")) {
    weather.kind = d.weather.kind;
    weather.left = num(d.weather.left, 0, 0, 200);
    weather.next = num(d.weather.next, 120, 10, 400);
  }
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
  const gift = giftMales();

  // While you were away, time kept going on every farm
  const away = (Date.now() - num(d.savedAt, Date.now())) / 1000;
  if (away > 5) welcomeMsg = catchUpWhileAway(away);
  if (gift) welcomeMsg = gift;
  arriveFarm();
}
function starterFlock() {
  const c = places.coop, sc = scaleAt(c.y), g = view.H - view.horizon;
  // Three hens and a rooster to start
  ["rir", "buff", "barred", "rir"].forEach((breed, i) => {
    const ch = makeBird({ breed, sex: i === 3 ? "rooster" : "hen", x: c.x + (150 + i * 85) * sc, y: c.y + (46 + i * 30) * sc, growth: 1, eggClock: rand(20, 45) });
    ch.t = rand(0.3, 1.5);
    farms.backyard.birds.push(ch);
  });
  // A surprise egg hidden by the tree, so there's something to find right away
  farms.backyard.yardEggs.push({ id: nextId++, x: clampX(places.tree.x - 70 * scaleAt(places.tree.y)), y: clampY(view.horizon + g * 0.3), breed: "buff", golden: false, glint: 0 });
  game.roosterGift = true;
  game.maleGift = { chicken: true };
}


/* ================================================================
   18. THE GAME LOOP — the heartbeat
   ================================================================
   We move the game forward in small, equal steps (1/60th of a second)
   so it runs the same speed on every device, then paint one picture.
*/
const STEP = 1 / 60;
let frameNo = 0, lastFrame = performance.now(), acc = 0, saveT = 4, awayT = 0, hudT = 0;

function update(dt) {
  clock += dt;
  flockCache = {};            // recount boys and girls this frame
  const prev = game.time;
  game.time += dt / SETTINGS.dayLengthSeconds;
  if (game.time >= 1) { game.time -= 1; game.day++; onNewDay(); }
  timeEvents(prev <= game.time ? prev : prev - 1, game.time);
  updateTransition(dt);
  for (const c of F.birds) {
    updateNeeds(c, dt);
    if (c.loc === "yard") updateYardBird(c, dt); else updateInsideBird(c, dt);
    updatePose(c, dt);
  }
  separate(dt);
  updateLeaving(dt);
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
  updateIncubators(dt);
  updateWeather(dt);
  updateVisitors(dt);
  updateRoosters(dt);
  updateSceneFx(dt);
  updateAmbient(dt);
  Music.update();
  coachTimer -= dt;
  if (coachTimer <= 0) { coachTimer = 0.4; pickCoach(); }
  stickerT -= dt;
  if (stickerT <= 0) {
    stickerT = 1;
    checkStickers(false);
    if (openSheet === hatchSheet) updateSlotText();
    if (candleEgg) updateCandleText();
  }
  hudT -= dt;
  if (hudT <= 0) {
    hudT = 0.5;
    updateFarmBtn();
    updateFlockBtn();
    // Safety net: if the screen changed size and we somehow missed it, fix it now
    if (Math.round(view.w) !== window.innerWidth || Math.round(view.h) !== window.innerHeight) queueResize();
  }
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
  if (openSheet === hatchSheet) drawHatchSlots();
  if (candleEgg) drawCandle();
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
  frameNo++;
  if (document.activeElement !== nameInput || frameNo % 3 === 0) render();
  requestAnimationFrame(frame);
}

// Phones tell us their new size a moment AFTER turning, so we check again
// shortly after. We also wait while you're typing a name, because the
// keyboard popping up would otherwise make the whole farm redraw.
let resizeQueued = false, resizeLater = 0, resizePending = false;
function queueResize() {
  if (document.activeElement === nameInput) { resizePending = true; return; }
  if (!resizeQueued) {
    resizeQueued = true;
    requestAnimationFrame(() => { resizeQueued = false; resize(); });
  }
  clearTimeout(resizeLater);
  resizeLater = setTimeout(() => {
    if (Math.round(view.w) !== window.innerWidth || Math.round(view.h) !== window.innerHeight) resize();
  }, 400);
}
window.addEventListener("resize", queueResize);
window.addEventListener("orientationchange", queueResize);

function start() {
  resize();
  const data = loadSave();
  if (data && data.v === 5) applySave(data);
  else { starterFlock(); arriveFarm(); }
  Sound.muted = game.muted;
  setMuteUI();
  game.stats.seasons[SEASONS[seasonIndex()].id] = true;
  checkStickers(true);                 // quietly give stickers for the birds you already have
  if (game.bookNew) bookBtn.classList.add("new");
  setupOfflineHint();
  updateHud();
  updateFarmBtn();
  if (window.location.hash === "#coop" && game.farm === "backyard") { scene = "coop"; onSceneChanged(); }
  requestAnimationFrame((t) => { lastFrame = t; frame(t); });
}
start();
