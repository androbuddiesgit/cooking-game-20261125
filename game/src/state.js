// Dapur Kilat — game state and rules. Pure logic, no drawing here.
// An order moves: gather ingredients -> chop what needs chopping -> cook on
// its station (stop the bar in the green zone) -> plate -> serve.

import {
  DISHES, DISH_BY_ID, ING_BY_ID, MAX_ORDERS, SHIFT_SECONDS,
  PATIENCE_EARLY, PATIENCE_LATE, LATE_AFTER_SECONDS, SPAWN_EVERY_SECONDS,
  CHOPS_PER_ITEM, COOK_PERFECT, COOK_OK, COOK_BURN_AFTER,
  COMBO_STEP, COMBO_MAX_BONUS,
} from './config.js';
import { makeRng, pick } from './rng.js';

let nextOrderId = 1;

export function newOrder(rng, elapsed) {
  const dish = pick(rng, DISHES);
  const patience = elapsed >= LATE_AFTER_SECONDS ? PATIENCE_LATE : PATIENCE_EARLY;
  return {
    id: nextOrderId++,
    dishId: dish.id,
    gathered: {}, // ing id -> true once on the tray
    chopped: {}, // ing id -> true once chopped
    cook: 0, // 0..1+ fraction of cook time elapsed
    cooking: false,
    cooked: null, // null | 'perfect' | 'ok' | 'burnt'
    plated: false,
    patience,
    maxPatience: patience,
    state: 'active', // active | served | expired
  };
}

export function createState(seed) {
  const rng = makeRng(seed);
  const state = {
    screen: 'title', // title | playing | over
    seed,
    rng,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    orders: [],
    activeIndex: 0,
    board: { ing: null, chops: 0 }, // item currently on the chopping board
    spawnIn: 2,
    toast: '',
    toastUntil: 0,
    paused: false,
    frozen: false, // screenshot mode: render the state, never advance it
    muted: false,
    stars: 0,
    lastTickSecond: -1,
  };
  return state;
}

export function activeOrder(state) {
  const actives = state.orders.filter((o) => o.state === 'active');
  if (!actives.length) return null;
  return actives[Math.min(state.activeIndex, actives.length - 1)];
}

export function dishOf(order) {
  return DISH_BY_ID[order.dishId];
}

export function orderNeeds(order) {
  return dishOf(order).needs;
}

// Is this ingredient still missing from the order (or waiting to be chopped)?
export function ingredientStatus(order, ingId) {
  const need = orderNeeds(order).find((n) => n.ing === ingId);
  if (!need) return 'not-needed';
  if (!order.gathered[ingId]) return 'missing';
  if (need.chop && !order.chopped[ingId]) return 'needs-chop';
  return 'ready';
}

export function orderReadyToCook(order) {
  return orderNeeds(order).every((n) => {
    if (!order.gathered[n.ing]) return false;
    if (n.chop && !order.chopped[n.ing]) return false;
    return true;
  });
}

export function startShift(state) {
  state.screen = 'playing';
  state.elapsed = 0;
  state.timeLeft = SHIFT_SECONDS;
  state.coins = 0;
  state.served = 0;
  state.lost = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.orders = [];
  state.activeIndex = 0;
  state.board = { ing: null, chops: 0 };
  state.spawnIn = 0.5;
  state.stars = 0;
  state.lastTickSecond = -1;
  for (let i = 0; i < MAX_ORDERS; i++) state.orders.push(newOrder(state.rng, 0));
}

export function say(state, text) {
  state.toast = text;
  state.toastUntil = state.elapsed + 2.2;
}

// Player taps an ingredient bin. Returns 'added' | 'to-board' | 'done' |
// 'wrong' | 'busy' | 'no-order' so the caller can play the right sound.
export function takeIngredient(state, ingId) {
  const order = activeOrder(state);
  if (!order || state.screen !== 'playing' || state.paused) return 'no-order';
  const need = orderNeeds(order).find((n) => n.ing === ingId);
  if (!need) {
    say(state, `${ING_BY_ID[ingId].name} tidak ada di pesanan ini!`);
    return 'wrong';
  }
  if (order.gathered[ingId]) return 'done';
  if (need.chop) {
    if (state.board.ing) {
      say(state, 'Talenan masih dipakai — cincang dulu!');
      return 'busy';
    }
    state.board = { ing: ingId, chops: 0 };
    order.gathered[ingId] = true;
    say(state, `${ING_BY_ID[ingId].name} ke talenan — cincang 3x!`);
    return 'to-board';
  }
  order.gathered[ingId] = true;
  return 'added';
}

// One chop on the board (click the board, Space, or C).
export function chopOnce(state) {
  const order = activeOrder(state);
  if (!order || !state.board.ing) return 'empty';
  state.board.chops += 1;
  if (state.board.chops >= CHOPS_PER_ITEM) {
    order.chopped[state.board.ing] = true;
    const done = state.board.ing;
    state.board = { ing: null, chops: 0 };
    say(state, `${ING_BY_ID[done].name} tercincang!`);
    return 'chopped';
  }
  return 'chopping';
}

// Start or stop cooking on the dish's station. Stopping judges the timing.
export function toggleCook(state) {
  const order = activeOrder(state);
  if (!order || state.screen !== 'playing' || state.paused) return 'no-order';
  if (order.cooked === 'burnt') return 'burnt';
  if (order.plated) return 'plated';
  if (!orderReadyToCook(order)) {
    say(state, 'Lengkapi bahan dulu sebelum memasak!');
    return 'not-ready';
  }
  if (!order.cooking) {
    order.cooking = true;
    order.cook = 0;
    say(state, 'Memasak… hentikan di zona hijau!');
    return 'started';
  }
  order.cooking = false;
  const t = order.cook;
  if (t >= COOK_PERFECT[0] && t <= COOK_PERFECT[1]) {
    order.cooked = 'perfect';
    say(state, 'Sempurna! Piring siap dihidangkan.');
  } else if (t >= COOK_OK[0] && t <= COOK_OK[1]) {
    order.cooked = 'ok';
    say(state, 'Matang. Hidangkan segera!');
  } else {
    order.cooked = 'burnt';
    say(state, 'Hangus! Masak ulang hidangan ini.');
  }
  order.plated = order.cooked === 'perfect' || order.cooked === 'ok';
  return order.cooked;
}

// After a burnt dish, clear the cook and start the same order's cooking over.
export function redoCook(state) {
  const order = activeOrder(state);
  if (!order) return;
  order.cook = 0;
  order.cooking = false;
  order.cooked = null;
  order.plated = false;
  say(state, 'Wajan dibersihkan — masak lagi!');
}

export function serveOrder(state) {
  const order = activeOrder(state);
  if (!order || !order.plated || order.state !== 'active') return null;
  const dish = dishOf(order);
  const patienceShare = Math.max(0, order.patience / order.maxPatience);
  const base = dish.price;
  const timeBonus = Math.round(10 * patienceShare);
  const comboBonus = Math.min(COMBO_MAX_BONUS, state.combo * COMBO_STEP);
  const earned = base + timeBonus + comboBonus;
  state.coins += earned;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  order.state = 'served';
  const perfect = order.cooked === 'perfect';
  say(state, perfect
    ? `Sempurna! +${earned} koin (kombo x${state.combo})`
    : `Terhidang! +${earned} koin`);
  return { earned, perfect };
}

export function discardBurnt(state) {
  const order = activeOrder(state);
  if (order && order.cooked === 'burnt') redoCook(state);
}

function expireOrder(state, order) {
  order.state = 'expired';
  state.lost += 1;
  state.combo = 0;
  say(state, `Pesanan ${dishOf(order).name} kedaluwarsa!`);
}

export function endShift(state) {
  state.screen = 'over';
  state.stars = state.served >= 12 ? 3 : state.served >= 8 ? 2 : state.served >= 4 ? 1 : 0;
}

// Advance timers, cooking, patience and spawning by dt seconds.
export function update(state, dt, sfx) {
  if (state.screen !== 'playing' || state.paused || state.frozen) return;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);

  const whole = Math.ceil(state.timeLeft);
  if (whole <= 10 && whole !== state.lastTickSecond && whole > 0) {
    state.lastTickSecond = whole;
    sfx.tick();
  }

  // Cooking progress; overcooking burns the dish on its own.
  const order = activeOrder(state);
  if (order && order.cooking) {
    order.cook += dt / dishOf(order).cookSeconds;
    if (order.cook >= COOK_BURN_AFTER) {
      order.cooking = false;
      order.cooked = 'burnt';
      order.plated = false;
      sfx.burnt();
      say(state, 'Kelamaan — hangus!');
    }
  }

  // Patience drains on every active ticket.
  for (const o of state.orders) {
    if (o.state !== 'active') continue;
    o.patience -= dt;
    if (o.patience <= 0) {
      expireOrder(state, o);
      sfx.expired();
    }
  }
  // Served and expired tickets leave the board at once; the toast reports them.
  state.orders = state.orders.filter((o) => o.state === 'active');

  // Refill the board up to MAX_ORDERS.
  state.spawnIn -= dt;
  const activeCount = state.orders.filter((o) => o.state === 'active').length;
  if (state.spawnIn <= 0 && activeCount < MAX_ORDERS && state.timeLeft > 8) {
    state.orders.push(newOrder(state.rng, state.elapsed));
    state.spawnIn = SPAWN_EVERY_SECONDS;
  }
  if (state.activeIndex >= activeCount && activeCount > 0) state.activeIndex = activeCount - 1;

  if (state.timeLeft <= 0) {
    if (sfx.sizzleNodes) sfx.stopSizzle();
    endShift(state);
  }
}
