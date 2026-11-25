// Dapur Kilat — entry point: boot, game loop, pause/mute actions.
// Open game/index.html in a desktop browser. Optional query:
//   ?shot=kitchen|assembly|serve|rush&seed=1  — frozen screenshot setups
//   ?seed=7 — a different deal of orders for a fresh shift

import { VIEW_W, VIEW_H } from './config.js';
import { createState, update } from './state.js';
import { createSfx } from './audio.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const seed = Number.parseInt(params.get('seed') || '20261125', 10) || 20261125;
const shot = params.get('shot');

const sfx = createSfx();
const state = shot ? applyShot(createState(seed), shot, seed) : createState(seed);

const actions = {
  togglePause() {
    if (state.screen !== 'playing') return;
    state.paused = !state.paused;
    if (state.paused) sfx.stopSizzle();
    sfx.click();
  },
  toggleMute() {
    state.muted = !state.muted;
    sfx.setMuted(state.muted);
    if (!state.muted) sfx.click();
  },
};

const input = createInput(canvas, state, sfx, actions);

// Read-only handle for automated play-testing (does not affect gameplay).
window.__dapur = { get state() { return state; } };

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(state, dt, sfx);
  render(ctx, state, input);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Keep the canvas crisp on hidpi screens without changing its game size.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H, 1.15);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();
