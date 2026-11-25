// Dapur Kilat — mouse and keyboard input.
// The renderer registers clickable rectangles each frame into `hotspots`;
// a click dispatches the topmost hotspot under the pointer. Keyboard shortcuts
// mirror the same actions so the whole game is playable either way.

import { INGREDIENTS } from './config.js';
import {
  takeIngredient, chopOnce, toggleCook, serveOrder,
  discardBurnt, startShift,
} from './state.js';

export function createInput(canvas, state, sfx, actions) {
  const input = {
    hotspots: [], // {x, y, w, h, action, label} rebuilt by the renderer
    hover: null,
  };

  function pointIn(r, x, y) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPoint(event);
    input.hover = null;
    for (let i = input.hotspots.length - 1; i >= 0; i--) {
      const h = input.hotspots[i];
      if (pointIn(h, p.x, p.y)) { input.hover = h; break; }
    }
    canvas.style.cursor = input.hover ? 'pointer' : 'default';
  });

  canvas.addEventListener('click', (event) => {
    sfx.ensure();
    const p = canvasPoint(event);
    for (let i = input.hotspots.length - 1; i >= 0; i--) {
      const h = input.hotspots[i];
      if (pointIn(h, p.x, p.y)) {
        runAction(h.action);
        return;
      }
    }
  });

  function runAction(action) {
    if (state.screen === 'title' && action === 'start') {
      sfx.start();
      startShift(state);
      return;
    }
    if (state.screen === 'over' && action === 'restart') {
      sfx.start();
      startShift(state);
      return;
    }
    if (state.screen !== 'playing' || state.paused) {
      if (action === 'pause') actions.togglePause();
      if (action === 'mute') actions.toggleMute();
      return;
    }
    if (action === 'pause') { actions.togglePause(); return; }
    if (action === 'mute') { actions.toggleMute(); return; }
    if (action.startsWith('ing:')) {
      const res = takeIngredient(state, action.slice(4));
      if (res === 'added' || res === 'to-board') sfx.add();
      else if (res === 'wrong' || res === 'busy') sfx.error();
      return;
    }
    if (action === 'chop') {
      const res = chopOnce(state);
      if (res === 'chopping') sfx.chop();
      else if (res === 'chopped') sfx.chopped();
      return;
    }
    if (action === 'cook') {
      const res = toggleCook(state);
      if (res === 'started') { sfx.cookStart(); sfx.startSizzle(); }
      else if (res === 'perfect' || res === 'ok') { sfx.stopSizzle(); sfx.serve(); }
      else if (res === 'burnt') { sfx.stopSizzle(); sfx.burnt(); }
      else if (res === 'not-ready') sfx.error();
      return;
    }
    if (action === 'serve') {
      const res = serveOrder(state);
      if (res) { sfx.serve(); sfx.coin(); }
      else sfx.error();
      return;
    }
    if (action === 'discard') {
      discardBurnt(state);
      sfx.click();
      return;
    }
    if (action.startsWith('ticket:')) {
      const idx = Number(action.slice(7));
      const actives = state.orders.filter((o) => o.state === 'active');
      if (idx >= 0 && idx < actives.length) {
        state.activeIndex = idx;
        sfx.click();
      }
      return;
    }
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const k = event.key.toLowerCase();
    if (k === 'm') { actions.toggleMute(); return; }
    if (k === 'p' || k === 'escape') { actions.togglePause(); return; }
    if (state.screen === 'title' && (k === 'enter' || k === ' ')) {
      event.preventDefault();
      sfx.start();
      startShift(state);
      return;
    }
    if (state.screen === 'over' && (k === 'r' || k === 'enter')) {
      sfx.start();
      startShift(state);
      return;
    }
    if (state.screen !== 'playing' || state.paused) return;
    const ing = INGREDIENTS.find((g) => g.key === k);
    if (ing) {
      const res = takeIngredient(state, ing.id);
      if (res === 'added' || res === 'to-board') sfx.add();
      else if (res === 'wrong' || res === 'busy') sfx.error();
      return;
    }
    if (k === ' ' || k === 'c') {
      event.preventDefault();
      const res = chopOnce(state);
      if (res === 'chopping') sfx.chop();
      else if (res === 'chopped') sfx.chopped();
      return;
    }
    if (k === 'f') {
      const res = toggleCook(state);
      if (res === 'started') { sfx.cookStart(); sfx.startSizzle(); }
      else if (res === 'perfect' || res === 'ok') { sfx.stopSizzle(); sfx.serve(); }
      else if (res === 'burnt') { sfx.stopSizzle(); sfx.burnt(); }
      else if (res === 'not-ready') sfx.error();
      return;
    }
    if (k === 'enter') {
      const res = serveOrder(state);
      if (res) { sfx.serve(); sfx.coin(); }
      else sfx.error();
      return;
    }
    if (k === 'x') { discardBurnt(state); return; }
    if (k === 'arrowright' || k === 'arrowleft') {
      const actives = state.orders.filter((o) => o.state === 'active');
      if (!actives.length) return;
      const dir = k === 'arrowright' ? 1 : -1;
      state.activeIndex = (state.activeIndex + dir + actives.length) % actives.length;
      sfx.click();
    }
  });

  return input;
}
