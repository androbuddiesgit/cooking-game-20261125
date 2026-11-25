// Dapur Kilat — game configuration: canvas size, ingredients, dishes, tuning.
// Every dish is an original warung recipe invented for this game.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 3;

// One ingredient bin on the counter. `chop` means it must visit the chopping
// board before it counts as gathered; `cook` is only descriptive — the dish
// itself decides which station cooks it.
export const INGREDIENTS = [
  { id: 'nasi',   name: 'Nasi',   key: '1', color: '#f5f0e1', dark: '#cbbf9a' },
  { id: 'mie',    name: 'Mie',    key: '2', color: '#f7c948', dark: '#c98f1b' },
  { id: 'telur',  name: 'Telur',  key: '3', color: '#fff7e6', dark: '#e0a458' },
  { id: 'ayam',   name: 'Ayam',   key: '4', color: '#e07856', dark: '#a34a2e', chop: true },
  { id: 'cabai',  name: 'Cabai',  key: '5', color: '#d7263d', dark: '#8f1626', chop: true },
  { id: 'sayur',  name: 'Sayur',  key: '6', color: '#43aa4b', dark: '#2b6e31', chop: true },
  { id: 'kaldu',  name: 'Kaldu',  key: '7', color: '#e8a33d', dark: '#a86f14' },
  { id: 'tomat',  name: 'Tomat',  key: '8', color: '#e8483f', dark: '#a02722' },
];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((g) => [g.id, g]));

// A dish: the ingredients it needs, which station cooks it, how long the cook
// takes, and what it pays. `needs` entries may ask for chopping first.
export const DISHES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng Kilat', short: 'NasGor',
    station: 'wok', cookSeconds: 5, price: 28, color: '#e8a33d',
    needs: [
      { ing: 'nasi' }, { ing: 'telur' },
      { ing: 'cabai', chop: true }, { ing: 'ayam', chop: true },
    ],
  },
  {
    id: 'mie-ayam', name: 'Mie Ayam Geprek', short: 'MieAyam',
    station: 'wok', cookSeconds: 5, price: 30, color: '#f7c948',
    needs: [
      { ing: 'mie' }, { ing: 'ayam', chop: true },
      { ing: 'sayur', chop: true }, { ing: 'cabai', chop: true },
    ],
  },
  {
    id: 'soto-ayam', name: 'Soto Ayam Hangat', short: 'Soto',
    station: 'pot', cookSeconds: 6, price: 32, color: '#f2c14e',
    needs: [
      { ing: 'kaldu' }, { ing: 'ayam', chop: true },
      { ing: 'telur' }, { ing: 'tomat' },
    ],
  },
  {
    id: 'tumis-kangkung', name: 'Tumis Kangkung Pedas', short: 'Tumis',
    station: 'wok', cookSeconds: 4, price: 24, color: '#43aa4b',
    needs: [
      { ing: 'sayur', chop: true }, { ing: 'cabai', chop: true },
      { ing: 'tomat' }, { ing: 'telur' },
    ],
  },
];

export const DISH_BY_ID = Object.fromEntries(DISHES.map((d) => [d.id, d]));

// Patience (seconds) an order waits before the customer walks away.
export const PATIENCE_EARLY = 55;
export const PATIENCE_LATE = 42;
export const LATE_AFTER_SECONDS = 60;

// How often a new order appears once a slot is free.
export const SPAWN_EVERY_SECONDS = 9;

// Chops needed to finish one item on the board.
export const CHOPS_PER_ITEM = 3;

// Cooking stop zones, as fractions of the dish's cook time. Stopping inside
// the green zone is perfect; yellow is fine; past the end burns the dish.
export const COOK_PERFECT = [0.6, 0.9];
export const COOK_OK = [0.4, 1.0];
export const COOK_BURN_AFTER = 1.12;

// Serve bonus: coins scale with the patience left on the ticket.
export const COMBO_STEP = 2; // extra coins per combo level, capped below
export const COMBO_MAX_BONUS = 12;

// Layout: fixed rectangles so input hit-testing and drawing agree.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 62 },
  board: { x: 24, y: 74, w: 1232, h: 118 },
  counter: { x: 24, y: 208, w: 560, h: 330 },
  stations: { x: 608, y: 208, w: 336, h: 330 },
  plate: { x: 968, y: 208, w: 288, h: 330 },
  bottomBar: { x: 24, y: 554, w: 1232, h: 142 },
};
