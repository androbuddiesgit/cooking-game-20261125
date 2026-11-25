// Dapur Kilat — every pixel is drawn on one canvas, no image assets.
// The renderer also registers the clickable rectangles for input.js, so the
// drawing and the hit-testing always agree.

import {
  VIEW_W, VIEW_H, INGREDIENTS, ING_BY_ID, LAYOUT, SHIFT_SECONDS,
} from './config.js';
import { activeOrder, dishOf, ingredientStatus, orderReadyToCook } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = '700', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---- food icons, drawn with canvas shapes ----

export function drawIngredientIcon(ctx, id, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (id === 'nasi') {
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath(); ctx.ellipse(0, r * 0.25, r * 0.95, r * 0.6, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f5f0e1';
    ctx.beginPath(); ctx.ellipse(0, r * 0.3, r * 0.8, r * 0.45, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#d8cba6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.5, 0); ctx.lineTo(r * 0.5, 0); ctx.stroke();
  } else if (id === 'mie') {
    ctx.strokeStyle = '#f7c948'; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, i * r * 0.45);
      ctx.quadraticCurveTo(0, i * r * 0.45 - r * 0.4, r * 0.8, i * r * 0.45);
      ctx.stroke();
    }
  } else if (id === 'telur') {
    ctx.fillStyle = '#fff7e6';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.7, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(r * 0.02, -r * 0.06, r * 0.16, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'ayam') {
    ctx.fillStyle = '#e07856';
    ctx.beginPath(); ctx.ellipse(-r * 0.1, r * 0.1, r * 0.7, r * 0.55, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f5f0e1'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r * 0.45, -r * 0.35); ctx.lineTo(r * 0.8, -r * 0.7); ctx.stroke();
    ctx.fillStyle = '#f5f0e1';
    ctx.beginPath(); ctx.arc(r * 0.85, -r * 0.75, r * 0.18, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'cabai') {
    ctx.strokeStyle = '#d7263d'; ctx.lineWidth = r * 0.42; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.4); ctx.quadraticCurveTo(0, r * 0.9, r * 0.75, -r * 0.5); ctx.stroke();
    ctx.strokeStyle = '#43aa4b'; ctx.lineWidth = r * 0.2;
    ctx.beginPath(); ctx.moveTo(r * 0.75, -r * 0.5); ctx.lineTo(r * 0.95, -r * 0.85); ctx.stroke();
  } else if (id === 'sayur') {
    ctx.fillStyle = '#43aa4b';
    for (const [dx, dy, rot] of [[-0.35, 0.1, -0.5], [0.3, -0.1, 0.5], [0, -0.35, 0]]) {
      ctx.save(); ctx.translate(dx * r, dy * r); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.55, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = '#2b6e31'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * 0.6, r * 0.5); ctx.lineTo(r * 0.6, r * 0.5); ctx.stroke();
  } else if (id === 'kaldu') {
    ctx.fillStyle = '#c65f2e';
    ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 0.9, r * 0.55, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#e8a33d';
    ctx.beginPath(); ctx.ellipse(0, r * 0.15, r * 0.72, r * 0.34, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (const dx of [-0.35, 0, 0.35]) {
      ctx.beginPath(); ctx.moveTo(dx * r, -r * 0.2);
      ctx.quadraticCurveTo(dx * r + r * 0.15, -r * 0.55, dx * r, -r * 0.8); ctx.stroke();
    }
  } else if (id === 'tomat') {
    ctx.fillStyle = '#e8483f';
    ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.75, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c22e28';
    ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.1, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#43aa4b';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.6, r * 0.3, r * 0.16, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawDishOnPlate(ctx, dish, x, y, r, quality) {
  // A plated dish: a mound in the dish's colour, garnish, and steam.
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = dish.color;
  ctx.beginPath(); ctx.ellipse(0, r * 0.15, r * 0.85, r * 0.5, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.ellipse(0, r * 0.18, r * 0.6, r * 0.32, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#43aa4b';
  for (const [dx, dy] of [[-0.35, -0.25], [0.25, -0.35], [0.05, -0.1]]) {
    ctx.beginPath(); ctx.ellipse(dx * r, dy * r, r * 0.16, r * 0.08, 0.4, 0, Math.PI * 2); ctx.fill();
  }
  if (quality === 'perfect') {
    ctx.fillStyle = '#ffd60a';
    ctx.font = `700 ${Math.round(r * 0.5)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('★', r * 0.7, -r * 0.55);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (const dx of [-0.3, 0.15]) {
    ctx.beginPath(); ctx.moveTo(dx * r, -r * 0.5);
    ctx.quadraticCurveTo(dx * r + r * 0.12, -r * 0.8, dx * r, -r * 1.05); ctx.stroke();
  }
  ctx.restore();
}

// ---- sections ----

function drawTopBar(ctx, state, input) {
  const b = LAYOUT.topBar;
  ctx.fillStyle = '#3d2b1f';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = '#ffd60a';
  rr(ctx, 24, 12, 46, 38, 8); ctx.fill();
  text(ctx, '🍳', 47, 32, 24, '#3d2b1f', '700', 'center');
  text(ctx, 'DAPUR KILAT', 82, 26, 26, '#fff7e6');
  text(ctx, 'warung rush — masak cepat, hidangkan tepat waktu', 82, 46, 12, '#d8cba6', '400');

  // Coins + combo.
  ctx.fillStyle = '#ffd60a';
  ctx.beginPath(); ctx.arc(560, 31, 15, 0, Math.PI * 2); ctx.fill();
  text(ctx, '¢', 560, 32, 18, '#7a5b00', '700', 'center');
  text(ctx, String(state.coins), 582, 32, 24, '#fff7e6');
  if (state.combo >= 2) {
    ctx.fillStyle = '#ff6b35';
    rr(ctx, 640, 14, 108, 34, 17); ctx.fill();
    text(ctx, `🔥 KOMBO x${state.combo}`, 694, 32, 15, '#fff', '700', 'center');
  }

  // Shift timer: big digits + bar, red under 30 seconds.
  const urgent = state.timeLeft <= 30 && state.screen === 'playing';
  const tx = 900;
  text(ctx, '⏱ SHIFT', tx, 20, 12, '#d8cba6', '700');
  text(ctx, fmtTime(state.timeLeft), tx, 44, 26, urgent ? '#ff5a5a' : '#fff7e6');
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  rr(ctx, 1010, 20, 150, 12, 6); ctx.fill();
  ctx.fillStyle = urgent ? '#ff5a5a' : '#43aa4b';
  rr(ctx, 1010, 20, Math.max(6, 150 * (state.timeLeft / SHIFT_SECONDS)), 12, 6); ctx.fill();
  text(ctx, `terhidang ${state.served} · gagal ${state.lost}`, 1085, 48, 11, '#d8cba6', '400', 'center');

  // Pause + mute buttons.
  const pause = { x: 1180, y: 12, w: 38, h: 38, action: 'pause', label: 'pause' };
  const mute = { x: 1224, y: 12, w: 38, h: 38, action: 'mute', label: 'mute' };
  for (const btn of [pause, mute]) {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    rr(ctx, btn.x, btn.y, btn.w, btn.h, 8); ctx.fill();
    input.hotspots.push(btn);
  }
  text(ctx, state.paused ? '▶' : '⏸', 1199, 32, 16, '#fff7e6', '700', 'center');
  text(ctx, state.muted ? '🔇' : '🔊', 1243, 32, 15, '#fff7e6', '700', 'center');
}

function drawBoard(ctx, state, input) {
  const b = LAYOUT.board;
  ctx.fillStyle = '#6b4423';
  rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
  ctx.fillStyle = '#8a5a33';
  rr(ctx, b.x + 6, b.y + 6, b.w - 12, b.h - 12, 9); ctx.fill();
  text(ctx, '📋 PAPAN PESANAN', b.x + 18, b.y + 22, 13, '#ffe9b0');
  text(ctx, 'klik tiket untuk memilih pesanan aktif', b.x + 190, b.y + 22, 11, '#e8c98f', '400');

  const actives = state.orders.filter((o) => o.state === 'active');
  const active = activeOrder(state);
  for (let i = 0; i < 3; i++) {
    const x = b.x + 18 + i * 400;
    const y = b.y + 36;
    const w = 384;
    const h = 70;
    const order = actives[i];
    if (!order) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      rr(ctx, x, y, w, h, 8); ctx.fill();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = 'rgba(255,233,176,0.5)'; ctx.lineWidth = 1.5;
      rr(ctx, x, y, w, h, 8); ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'menunggu pesanan…', x + w / 2, y + h / 2, 13, '#e8c98f', '400', 'center');
      continue;
    }
    const dish = dishOf(order);
    const isActive = order === active;
    ctx.fillStyle = isActive ? '#fffdf5' : '#f5ecd7';
    rr(ctx, x, y, w, h, 8); ctx.fill();
    if (isActive) {
      ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 3;
      rr(ctx, x, y, w, h, 8); ctx.stroke();
    }
    input.hotspots.push({ x, y, w, h, action: `ticket:${i}`, label: 'ticket' });
    ctx.fillStyle = dish.color;
    rr(ctx, x, y, w, 26, 8); ctx.fill();
    ctx.fillRect(x, y + 14, w, 12);
    text(ctx, `#${order.id} ${dish.name}`, x + 10, y + 13, 14, '#3d2b1f');
    text(ctx, `${dish.price} koin`, x + w - 10, y + 13, 12, '#3d2b1f', '700', 'right');
    // Ingredient checklist.
    let ix = x + 12;
    for (const need of dish.needs) {
      const st = ingredientStatus(order, need.ing);
      const g = ING_BY_ID[need.ing];
      ctx.fillStyle = st === 'ready' ? '#43aa4b' : st === 'needs-chop' ? '#f59e0b' : '#e8e0cc';
      ctx.beginPath(); ctx.arc(ix + 13, y + 46, 13, 0, Math.PI * 2); ctx.fill();
      drawIngredientIcon(ctx, need.ing, ix + 13, y + 46, 9);
      if (st === 'ready') text(ctx, '✓', ix + 13, y + 46, 13, '#fff', '700', 'center');
      else if (need.chop && st !== 'ready') text(ctx, '🔪', ix + 24, y + 36, 9, '#3d2b1f', '700', 'center');
      ix += 34;
    }
    // Patience bar.
    const pw = 150;
    const px = x + w - pw - 10;
    const share = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = '#e0d5bd';
    rr(ctx, px, y + 40, pw, 12, 6); ctx.fill();
    ctx.fillStyle = share > 0.5 ? '#43aa4b' : share > 0.25 ? '#f59e0b' : '#d7263d';
    rr(ctx, px, y + 40, Math.max(8, pw * share), 12, 6); ctx.fill();
    text(ctx, `${Math.ceil(order.patience)} dtk`, px + pw / 2, y + 46, 10, '#3d2b1f', '700', 'center');
    if (order.cooked === 'perfect') text(ctx, '★ SEMPURNA', px + pw / 2, y + 62, 10, '#b8860b', '700', 'center');
    else if (order.cooked === 'burnt') text(ctx, 'HANGUS — masak ulang (X)', px + pw / 2, y + 62, 10, '#d7263d', '700', 'center');
    else if (order.plated) text(ctx, 'SIAP DIHIDANGKAN', px + pw / 2, y + 62, 10, '#2b6e31', '700', 'center');
  }
}

function drawCounter(ctx, state, input) {
  const c = LAYOUT.counter;
  ctx.fillStyle = '#a06a3c';
  rr(ctx, c.x, c.y, c.w, c.h, 12); ctx.fill();
  ctx.fillStyle = '#8a5a33';
  rr(ctx, c.x + 8, c.y + 8, c.w - 16, c.h - 16, 9); ctx.fill();
  text(ctx, '🧺 MEJA BAHAN — klik bahan (tombol 1–8)', c.x + 16, c.y + 24, 13, '#ffe9b0');

  const order = activeOrder(state);
  INGREDIENTS.forEach((g, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = c.x + 16 + col * 134;
    const y = c.y + 44 + row * 138;
    const w = 122;
    const h = 126;
    const st = order ? ingredientStatus(order, g.id) : 'not-needed';
    const usable = order && st !== 'not-needed' && st !== 'ready';
    ctx.fillStyle = st === 'ready' ? '#d9ead3' : usable ? '#fffdf5' : '#efe6d0';
    rr(ctx, x, y, w, h, 10); ctx.fill();
    if (st === 'ready') {
      ctx.strokeStyle = '#43aa4b'; ctx.lineWidth = 3;
      rr(ctx, x, y, w, h, 10); ctx.stroke();
    }
    ctx.fillStyle = '#8a5a33';
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + 62, 42, 14, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = g.color;
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + 58, 40, 13, 0, Math.PI, 0); ctx.fill();
    drawIngredientIcon(ctx, g.id, x + w / 2, y + 48, 26);
    text(ctx, g.name, x + w / 2, y + 88, 14, '#3d2b1f', '700', 'center');
    if (g.chop && st !== 'ready') text(ctx, 'perlu dicincang 🔪', x + w / 2, y + 106, 10, '#8a5a33', '400', 'center');
    ctx.fillStyle = '#3d2b1f';
    rr(ctx, x + 6, y + 6, 20, 20, 5); ctx.fill();
    text(ctx, g.key, x + 16, y + 16, 12, '#ffd60a', '700', 'center');
    if (st === 'ready') text(ctx, '✓ sudah', x + w / 2, y + 106, 11, '#2b6e31', '700', 'center');
    else if (st === 'not-needed' && order) text(ctx, '—', x + w / 2, y + 106, 11, '#b0a284', '700', 'center');
    input.hotspots.push({ x, y, w, h, action: `ing:${g.id}`, label: g.name });
  });
}

function drawStations(ctx, state, input) {
  const s = LAYOUT.stations;
  ctx.fillStyle = '#5d4037';
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.fillStyle = '#4e342e';
  rr(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 16, 9); ctx.fill();
  text(ctx, '🔪 TALENAN & KOMPOR', s.x + 16, s.y + 24, 13, '#ffe9b0');

  const order = activeOrder(state);

  // Chopping board.
  const bx = s.x + 16;
  const by = s.y + 44;
  const bw = 150;
  const bh = 110;
  ctx.fillStyle = '#d9b380';
  rr(ctx, bx, by, bw, bh, 8); ctx.fill();
  ctx.strokeStyle = '#a67c52'; ctx.lineWidth = 2;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath(); ctx.moveTo(bx + 12, by + i * 26); ctx.lineTo(bx + bw - 12, by + i * 26); ctx.stroke();
  }
  text(ctx, 'TALENAN', bx + bw / 2, by + 14, 11, '#6b4423', '700', 'center');
  if (state.board.ing) {
    drawIngredientIcon(ctx, state.board.ing, bx + bw / 2, by + 58, 26);
    const done = state.board.chops;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < done ? '#43aa4b' : '#e8e0cc';
      ctx.beginPath(); ctx.arc(bx + 52 + i * 24, by + 96, 7, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    text(ctx, 'kosong', bx + bw / 2, by + 58, 13, '#8a5a33', '400', 'center');
    text(ctx, 'bahan yang perlu cincang', bx + bw / 2, by + 78, 10, '#cbb59a', '400', 'center');
    text(ctx, 'otomatis ke sini', bx + bw / 2, by + 94, 10, '#cbb59a', '400', 'center');
  }
  input.hotspots.push({ x: bx, y: by, w: bw, h: bh, action: 'chop', label: 'chop' });

  // Wok + pot, side by side on the stove.
  const stations = [
    { id: 'wok', label: 'WAJAN (F)', x: s.x + 182, flame: '#ff6b35' },
    { id: 'pot', label: 'Panci (F)', x: s.x + 256, flame: '#4aa3ff' },
  ];
  for (const st of stations) {
    const x = st.x;
    const y = by;
    const w = 66;
    const h = 110;
    const isDishStation = order && dishOf(order).station === st.id;
    const cooking = order && order.cooking && isDishStation;
    ctx.fillStyle = isDishStation ? '#fff3d6' : '#3e2723';
    rr(ctx, x, y, w, h, 8); ctx.fill();
    if (cooking) {
      ctx.fillStyle = st.flame;
      ctx.beginPath();
      ctx.moveTo(x + 12, y + h - 8);
      ctx.quadraticCurveTo(x + w / 2, y + h - 44, x + w - 12, y + h - 8);
      ctx.closePath(); ctx.fill();
    }
    if (st.id === 'wok') {
      ctx.fillStyle = '#263238';
      ctx.beginPath(); ctx.ellipse(x + w / 2, y + 42, 28, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#37474f';
      ctx.beginPath(); ctx.ellipse(x + w / 2, y + 40, 28, 10, 0, Math.PI, 0); ctx.fill();
      if (order && isDishStation && order.cook > 0 && !order.plated) {
        ctx.fillStyle = dishOf(order).color;
        ctx.beginPath(); ctx.ellipse(x + w / 2, y + 40, 20, 6, 0, Math.PI, 0); ctx.fill();
      }
    } else {
      ctx.fillStyle = '#90a4ae';
      ctx.fillRect(x + 8, y + 26, w - 16, 30);
      ctx.fillStyle = '#eceff1';
      ctx.fillRect(x + 8, y + 26, w - 16, 6);
      if (order && isDishStation && order.cook > 0 && !order.plated) {
        ctx.fillStyle = '#e8a33d';
        ctx.fillRect(x + 12, y + 30, w - 24, 4);
      }
    }
    text(ctx, st.label, x + w / 2, y + 12, 10, isDishStation ? '#3d2b1f' : '#cbb59a', '700', 'center');
    input.hotspots.push({ x, y, w, h, action: 'cook', label: st.label });
  }

  // Cooking progress bar with the perfect zone.
  const barX = s.x + 16;
  const barY = s.y + 176;
  const barW = s.w - 32;
  text(ctx, 'MEMASAK — hentikan di zona hijau (F / klik kompor)', barX, barY - 8, 11, '#ffe9b0', '700');
  ctx.fillStyle = '#3e2723';
  rr(ctx, barX, barY, barW, 26, 8); ctx.fill();
  if (order && (order.cooking || order.cook > 0)) {
    const dish = dishOf(order);
    const t = Math.min(order.cook, 1.15);
    // Zones: ok yellow 0.40–1.00, perfect green 0.60–0.90.
    ctx.fillStyle = '#f59e0b';
    rr(ctx, barX + barW * 0.4, barY + 3, barW * 0.6, 20, 5); ctx.fill();
    ctx.fillStyle = '#43aa4b';
    rr(ctx, barX + barW * 0.6, barY + 3, barW * 0.3, 20, 5); ctx.fill();
    ctx.fillStyle = t >= 1.0 ? '#d7263d' : '#fff';
    rr(ctx, barX + 2, barY + 3, Math.max(4, barW * Math.min(t, 1.12) - 4), 20, 5); ctx.fill();
    ctx.fillStyle = '#3d2b1f';
    ctx.fillRect(barX + barW * Math.min(t, 1.12) - 2, barY, 4, 26);
    text(ctx, order.cooked === 'burnt' ? 'HANGUS!' : order.cooked === 'perfect' ? '★ SEMPURNA' : order.cooked === 'ok' ? 'Matang' : `${dish.name} — ${Math.round(t * 100)}%`, barX + barW / 2, barY + 40, 12, order.cooked === 'burnt' ? '#ff8a80' : '#ffe9b0', '700', 'center');
  } else {
    text(ctx, order ? 'lengkapi bahan, lalu klik wajan / panci' : 'tidak ada pesanan aktif', barX + barW / 2, barY + 40, 12, '#cbb59a', '400', 'center');
  }

  // Burnt-dish reset.
  if (order && order.cooked === 'burnt') {
    const dx = s.x + 16;
    const dy = s.y + 252;
    ctx.fillStyle = '#d7263d';
    rr(ctx, dx, dy, 150, 34, 8); ctx.fill();
    text(ctx, '🗑 Buang & masak ulang (X)', dx + 75, dy + 18, 12, '#fff', '700', 'center');
    input.hotspots.push({ x: dx, y: dy, w: 150, h: 34, action: 'discard', label: 'discard' });
  }

  // Ready-to-cook hint.
  if (order && orderReadyToCook(order) && !order.cooking && !order.cooked) {
    ctx.fillStyle = '#ffd60a';
    rr(ctx, s.x + 16, s.y + 292, s.w - 32, 26, 8); ctx.fill();
    text(ctx, `Siap dimasak di ${dishOf(order).station === 'wok' ? 'WAJAN' : 'PANCI'} — klik / tekan F`, s.x + s.w / 2, s.y + 305, 12, '#3d2b1f', '700', 'center');
  }
}

function drawPlate(ctx, state, input) {
  const p = LAYOUT.plate;
  ctx.fillStyle = '#ece5d8';
  rr(ctx, p.x, p.y, p.w, p.h, 12); ctx.fill();
  ctx.fillStyle = '#fffdf5';
  rr(ctx, p.x + 8, p.y + 8, p.w - 16, p.h - 16, 9); ctx.fill();
  text(ctx, '🍽 PIRING SAJI', p.x + 16, p.y + 24, 13, '#3d2b1f');

  const order = activeOrder(state);
  const cx = p.x + p.w / 2;
  const cy = p.y + 130;
  // Plate.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(cx, cy, 92, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8cba6'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, 92, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#e8e0cc'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, 68, 0, Math.PI * 2); ctx.stroke();

  if (order && order.plated) {
    drawDishOnPlate(ctx, dishOf(order), cx, cy, 62, order.cooked);
    text(ctx, dishOf(order).name, cx, cy + 122, 15, '#3d2b1f', '700', 'center');
    text(ctx, order.cooked === 'perfect' ? '★ dimasak sempurna' : 'matang — siap dihidangkan', cx, cy + 142, 11, '#2b6e31', '400', 'center');
  } else if (order && order.cooked === 'burnt') {
    ctx.fillStyle = '#3d2b1f';
    ctx.beginPath(); ctx.ellipse(cx, cy + 10, 55, 26, 0, Math.PI, 0); ctx.fill();
    text(ctx, 'hangus…', cx, cy + 122, 14, '#d7263d', '700', 'center');
  } else if (order) {
    // Ghost of the dish: show what is being assembled.
    const done = dishOf(order).needs.filter((n) => order.gathered[n.ing]).length;
    const total = dishOf(order).needs.length;
    ctx.fillStyle = '#e8e0cc';
    ctx.beginPath(); ctx.ellipse(cx, cy + 10, 55, 26, 0, Math.PI, 0); ctx.fill();
    text(ctx, `${dishOf(order).name}`, cx, cy + 122, 14, '#8a7a5c', '700', 'center');
    text(ctx, `bahan ${done}/${total} · ${orderReadyToCook(order) ? 'siap dimasak' : 'kumpulkan bahan'}`, cx, cy + 142, 11, '#8a7a5c', '400', 'center');
  } else {
    text(ctx, 'tidak ada pesanan', cx, cy + 122, 13, '#b0a284', '400', 'center');
  }

  // Serve button.
  const bx = p.x + 24;
  const by = p.y + 268;
  const bw = p.w - 48;
  const bh = 46;
  const canServe = order && order.plated;
  ctx.fillStyle = canServe ? '#43aa4b' : '#c9bda1';
  rr(ctx, bx, by, bw, bh, 10); ctx.fill();
  if (canServe) {
    ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 3;
    rr(ctx, bx, by, bw, bh, 10); ctx.stroke();
  }
  text(ctx, canServe ? '✅ HIDANGKAN (Enter)' : 'HIDANGKAN (Enter)', bx + bw / 2, by + bh / 2 + 1, 16, canServe ? '#fff' : '#8a7a5c', '700', 'center');
  input.hotspots.push({ x: bx, y: by, w: bw, h: bh, action: 'serve', label: 'serve' });
}

function drawBottomBar(ctx, state) {
  const b = LAYOUT.bottomBar;
  ctx.fillStyle = '#3d2b1f';
  rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
  const order = activeOrder(state);
  text(ctx, '🧾 NAMPAN PESANAN AKTIF', b.x + 18, b.y + 22, 13, '#ffe9b0');
  if (order) {
    const dish = dishOf(order);
    let x = b.x + 18;
    text(ctx, `${dish.name} —`, x, b.y + 52, 14, '#fff7e6');
    x += ctx.measureText(`${dish.name} —`).width + 12;
    for (const need of dish.needs) {
      const st = ingredientStatus(order, need.ing);
      const g = ING_BY_ID[need.ing];
      ctx.fillStyle = st === 'ready' ? '#43aa4b' : '#5d4037';
      rr(ctx, x, b.y + 38, 92, 28, 14); ctx.fill();
      ctx.fillStyle = st === 'ready' ? '#fff' : '#d8cba6';
      ctx.font = '700 12px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${st === 'ready' ? '✓ ' : ''}${g.name}${need.chop && st === 'needs-chop' ? ' 🔪' : ''}`, x + 10, b.y + 52);
      x += 100;
    }
    text(ctx, `stasiun: ${dish.station === 'wok' ? 'wajan' : 'panci'} · ${dish.price} koin`, b.x + 18, b.y + 88, 12, '#d8cba6', '400');
  } else {
    text(ctx, 'Tidak ada pesanan aktif.', b.x + 18, b.y + 52, 14, '#d8cba6', '400');
  }
  text(ctx, 'Cara main: klik bahan 1–8 → cincang di talenan (Spasi) → masak di wajan/panci (F, hentikan di hijau) → hidangkan (Enter).', b.x + 18, b.y + 116, 12, '#ffe9b0', '400');
  text(ctx, '← → ganti pesanan · P jeda · M suara · R mulai ulang', b.x + 18, b.y + 134, 11, '#b0a284', '400');

  if (state.toast && state.elapsed < state.toastUntil) {
    const tw = ctx.measureText(state.toast).width + 36;
    const tx = (VIEW_W - tw) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    rr(ctx, tx, 668, tw, 34, 17); ctx.fill();
    text(ctx, state.toast, VIEW_W / 2, 686, 14, '#fff7e6', '700', 'center');
  }
}

function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(20, 12, 6, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawTitle(ctx, state, input) {
  overlay(ctx, 0.45);
  const x = 290;
  const y = 110;
  const w = 700;
  const h = 480;
  ctx.fillStyle = '#fff7e6';
  rr(ctx, x, y, w, h, 18); ctx.fill();
  ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 4;
  rr(ctx, x, y, w, h, 18); ctx.stroke();
  text(ctx, '🍳', 640, y + 62, 54, '#3d2b1f', '700', 'center');
  text(ctx, 'DAPUR KILAT', 640, y + 118, 52, '#d7263d', '700', 'center');
  text(ctx, 'Warung Rush — game memasak cepat', 640, y + 152, 18, '#6b4423', '400', 'center');
  const lines = [
    'Pesanan masuk di papan atas. Kumpulkan bahan dari meja,',
    'cincang yang perlu dicincang, masak di wajan atau panci,',
    'dan hidangkan sebelum pelanggan kehabisan sabar.',
    '',
    '• Klik bahan (atau tombol 1–8)  • Spasi / klik talenan: cincang',
    '• F / klik kompor: mulai & hentikan masakan di zona hijau',
    '• Enter: hidangkan  • ← →: ganti pesanan  • P: jeda',
    '',
    `Shift ${SHIFT_SECONDS / 60} menit 30 detik · 4 resep warung asli · kombo menaikkan koin`,
  ];
  let ly = y + 196;
  for (const line of lines) {
    text(ctx, line, 640, ly, 15, '#3d2b1f', line.startsWith('•') ? '400' : '700', 'center');
    ly += 24;
  }
  const bx = 490;
  const by = y + 396;
  ctx.fillStyle = '#43aa4b';
  rr(ctx, bx, by, 300, 56, 12); ctx.fill();
  ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 3;
  rr(ctx, bx, by, 300, 56, 12); ctx.stroke();
  text(ctx, '▶ MULAI SHIFT (Enter)', 640, by + 29, 20, '#fff', '700', 'center');
  input.hotspots.push({ x: bx, y: by, w: 300, h: 56, action: 'start', label: 'start' });
  text(ctx, '100% buatan sendiri — resep, gambar & suara original', 640, y + h - 18, 11, '#b0a284', '400', 'center');
}

function drawGameOver(ctx, state, input) {
  overlay(ctx, 0.55);
  const x = 340;
  const y = 130;
  const w = 600;
  const h = 440;
  ctx.fillStyle = '#fff7e6';
  rr(ctx, x, y, w, h, 18); ctx.fill();
  ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 4;
  rr(ctx, x, y, w, h, 18); ctx.stroke();
  text(ctx, '⏱ SHIFT SELESAI!', 640, y + 56, 36, '#d7263d', '700', 'center');
  let stars = '';
  for (let i = 0; i < 3; i++) stars += i < state.stars ? '★' : '☆';
  text(ctx, stars, 640, y + 108, 40, '#f59e0b', '700', 'center');
  const rows = [
    ['Koin didapat', `${state.coins} ¢`],
    ['Pesanan terhidang', `${state.served}`],
    ['Pesanan kedaluwarsa', `${state.lost}`],
    ['Kombo terbaik', `x${state.bestCombo}`],
  ];
  let ry = y + 168;
  for (const [label, value] of rows) {
    text(ctx, label, x + 60, ry, 17, '#6b4423', '400');
    text(ctx, value, x + w - 60, ry, 17, '#3d2b1f', '700', 'right');
    ry += 36;
  }
  const verdict = state.stars === 3 ? 'Koki legendaris! Warungmu penuh sesak.'
    : state.stars === 2 ? 'Dapur yang solid — pelanggan kembali lagi.'
    : state.stars === 1 ? 'Lumayan! Latihan lagi shift berikutnya.'
    : 'Dapur berantakan… coba lagi, koki!';
  text(ctx, verdict, 640, y + 330, 16, '#3d2b1f', '700', 'center');
  const bx = 490;
  const by = y + 360;
  ctx.fillStyle = '#43aa4b';
  rr(ctx, bx, by, 300, 52, 12); ctx.fill();
  text(ctx, '↻ MAIN LAGI (R)', 640, by + 27, 19, '#fff', '700', 'center');
  input.hotspots.push({ x: bx, y: by, w: 300, h: 52, action: 'restart', label: 'restart' });
}

export function render(ctx, state, input) {
  input.hotspots = [];
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  // Kitchen backdrop: warm wall, tiled backsplash, wooden floor.
  const wall = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  wall.addColorStop(0, '#f7e8c9');
  wall.addColorStop(0.75, '#f3d9a4');
  wall.addColorStop(0.75, '#c98f5f');
  wall.addColorStop(1, '#a06a3c');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#2e7d6b';
  ctx.fillRect(0, 196, VIEW_W, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let x = 0; x < VIEW_W; x += 64) ctx.fillRect(x, 196, 2, 12);
  // Hanging pans on the wall.
  ctx.fillStyle = '#5d4037';
  for (const px of [120, 220, 1060, 1160]) {
    ctx.beginPath(); ctx.arc(px, 92, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(px - 3, 66, 6, 12);
  }

  drawTopBar(ctx, state, input);
  drawBoard(ctx, state, input);
  drawCounter(ctx, state, input);
  drawStations(ctx, state, input);
  drawPlate(ctx, state, input);
  drawBottomBar(ctx, state);

  if (state.screen === 'title') drawTitle(ctx, state, input);
  else if (state.screen === 'over') drawGameOver(ctx, state, input);
  else if (state.paused) {
    overlay(ctx, 0.45);
    text(ctx, '⏸ JEDA', VIEW_W / 2, VIEW_H / 2 - 10, 44, '#fff7e6', '700', 'center');
    text(ctx, 'tekan P untuk lanjut', VIEW_W / 2, VIEW_H / 2 + 34, 16, '#ffe9b0', '400', 'center');
  }
}
