// Dapur Kilat — deterministic setups for the entry's screenshots.
// `?shot=<name>&seed=<n>` builds a fixed game state from the seeded RNG and
// freezes the clock, so the same URL always renders the same frame. These are
// real renders of the game's own code, not mock-ups.

import { createState, newOrder, startShift } from './state.js';

function freeze(state) {
  state.frozen = true;
  state.screen = 'playing';
}

export function applyShot(state, shot, seed) {
  const rngSeed = Number.isFinite(seed) ? seed : 1;
  const fresh = createState(rngSeed);
  fresh.screen = 'playing';
  fresh.elapsed = 0;

  if (shot === 'kitchen') {
    // Opening rush: three fresh orders, full patience, a long shift ahead.
    startShift(fresh);
    fresh.timeLeft = 138;
    fresh.elapsed = 12;
    fresh.coins = 0;
    fresh.orders[0].patience = 48;
    fresh.orders[1].patience = 52;
    fresh.orders[2].patience = 44;
    freeze(fresh);
    return fresh;
  }

  if (shot === 'assembly') {
    // One dish mid-assembly: ingredients gathered, one item on the board
    // half-chopped, the wok already cooking in the green zone.
    startShift(fresh);
    fresh.timeLeft = 104;
    fresh.elapsed = 46;
    fresh.coins = 58;
    fresh.combo = 2;
    fresh.served = 2;
    const order = fresh.orders[0];
    order.dishId = 'nasi-goreng';
    order.gathered = { nasi: true, telur: true, cabai: true, ayam: true };
    order.chopped = { cabai: true };
    order.patience = 38;
    fresh.board = { ing: 'ayam', chops: 2 };
    fresh.activeIndex = 0;
    // A second order waits behind it, also partly gathered.
    const second = fresh.orders[1];
    second.dishId = 'mie-ayam';
    second.gathered = { mie: true, ayam: true };
    second.patience = 30;
    freeze(fresh);
    return fresh;
  }

  if (shot === 'serve') {
    // A plate ready to serve: dish cooked perfectly, Serve button glowing.
    startShift(fresh);
    fresh.timeLeft = 82;
    fresh.elapsed = 68;
    fresh.coins = 96;
    fresh.combo = 3;
    fresh.bestCombo = 3;
    fresh.served = 3;
    const order = fresh.orders[0];
    order.dishId = 'soto-ayam';
    order.gathered = { kaldu: true, ayam: true, telur: true, tomat: true };
    order.chopped = { ayam: true };
    order.cook = 0.74;
    order.cooked = 'perfect';
    order.plated = true;
    order.patience = 41;
    fresh.activeIndex = 0;
    const second = fresh.orders[1];
    second.dishId = 'tumis-kangkung';
    second.gathered = { sayur: true };
    second.patience = 22;
    freeze(fresh);
    return fresh;
  }

  if (shot === 'rush') {
    // Late-shift rush: low timer, one ticket almost out of patience,
    // a burnt dish being redone, high combo.
    startShift(fresh);
    fresh.timeLeft = 42;
    fresh.elapsed = 108;
    fresh.coins = 214;
    fresh.combo = 4;
    fresh.bestCombo = 5;
    fresh.served = 7;
    const first = fresh.orders[0];
    first.dishId = 'mie-ayam';
    first.gathered = { mie: true, ayam: true, sayur: true, cabai: true };
    first.chopped = { ayam: true, sayur: true, cabai: true };
    first.cook = 0.55;
    first.cooking = true;
    first.patience = 9;
    const second = fresh.orders[1];
    second.dishId = 'nasi-goreng';
    second.gathered = { nasi: true, telur: true };
    second.patience = 26;
    const third = fresh.orders[2];
    third.dishId = 'soto-ayam';
    third.patience = 47;
    fresh.activeIndex = 0;
    freeze(fresh);
    return fresh;
  }

  // Unknown shot name: plain start of a shift.
  startShift(fresh);
  freeze(fresh);
  return fresh;
}
