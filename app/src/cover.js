// Vice Cover — draws a GTA 6-style multi-panel poster cover onto a canvas.
// Everything is drawn procedurally: sunset sky, retro sun, skyline, palm
// silhouettes, photo panels with a neon grade, and bold caption lettering.
// No artwork, logo or font from any game is used anywhere in this file.

export const GRADES = {
  sunset: {
    name: 'Sunset',
    sky: ['#ff9a3d', '#ff5e7a', '#b13d9e', '#3b1d5e'],
    sun: '#ffd76a',
    tint: 'rgba(255, 94, 122, 0.28)',
    tint2: 'rgba(59, 29, 94, 0.30)',
    title: '#ffffff',
    accent: '#ffd76a',
    band: 'rgba(24, 8, 40, 0.88)',
  },
  neon: {
    name: 'Neon Night',
    sky: ['#0b1035', '#3b1d8f', '#c2188b', '#ff2e88'],
    sun: '#39e6ff',
    tint: 'rgba(57, 230, 255, 0.20)',
    tint2: 'rgba(194, 24, 139, 0.34)',
    title: '#eafcff',
    accent: '#39e6ff',
    band: 'rgba(8, 6, 32, 0.90)',
  },
  miami: {
    name: 'Miami Pink',
    sky: ['#ffb3c8', '#ff6fa5', '#7a2bff', '#1c0b3d'],
    sun: '#fff3b0',
    tint: 'rgba(255, 111, 165, 0.26)',
    tint2: 'rgba(122, 43, 255, 0.30)',
    title: '#ffffff',
    accent: '#fff3b0',
    band: 'rgba(43, 10, 61, 0.88)',
  },
  golden: {
    name: 'Golden Hour',
    sky: ['#ffe29a', '#ff9e4f', '#e2543e', '#5e1f3d'],
    sun: '#fff8d6',
    tint: 'rgba(255, 158, 79, 0.24)',
    tint2: 'rgba(94, 31, 61, 0.28)',
    title: '#fff8ec',
    accent: '#ffe29a',
    band: 'rgba(46, 16, 10, 0.88)',
  },
};

export const LAYOUTS = {
  hero: { name: 'Hero + Strip', panels: 4 },
  triptych: { name: 'Three Panels', panels: 3 },
  grid: { name: 'Four Square', panels: 4 },
  cinema: { name: 'Cinema One', panels: 1 },
};

// Panel rectangles as fractions of the cover, per layout and aspect.
export function panelRects(layout, aspect) {
  const g = 0.012; // gutter fraction
  if (layout === 'triptych') {
    const w = (1 - g * 4) / 3;
    return [0, 1, 2].map((i) => ({ x: g + i * (w + g), y: g, w, h: 1 - g * 2 }));
  }
  if (layout === 'grid') {
    const w = (1 - g * 3) / 2;
    const h = (1 - g * 3) / 2;
    return [
      { x: g, y: g, w, h },
      { x: g * 2 + w, y: g, w, h },
      { x: g, y: g * 2 + h, w, h },
      { x: g * 2 + w, y: g * 2 + h, w, h },
    ];
  }
  if (layout === 'cinema') {
    return [{ x: g, y: g, w: 1 - g * 2, h: 1 - g * 2 }];
  }
  // hero: big panel on top, three small panels along the bottom.
  const heroH = aspect === 'portrait' ? 0.58 : aspect === 'landscape' ? 0.60 : 0.62;
  const stripH = 1 - heroH - g * 3;
  const sw = (1 - g * 4) / 3;
  return [
    { x: g, y: g, w: 1 - g * 2, h: heroH },
    { x: g, y: heroH + g * 2, w: sw, h: stripH },
    { x: g * 2 + sw, y: heroH + g * 2, w: sw, h: stripH },
    { x: g * 3 + sw * 2, y: heroH + g * 2, w: sw, h: stripH },
  ];
}

// Default photo slot for each panel of each layout.
export function defaultPhotoFor(layout, panelIndex) {
  if (layout === 'triptych') return panelIndex % 3;
  if (layout === 'grid') return panelIndex % 3;
  if (layout === 'cinema') return 0;
  return panelIndex === 0 ? 0 : panelIndex === 1 ? 1 : panelIndex === 2 ? 2 : 0;
}

function drawSun(ctx, x, y, r, color) {
  // Paint the sun on a scratch canvas so the retro slats can be cut out
  // of the sun alone, without erasing the sky behind it.
  const pad = 4;
  const s = document.createElement('canvas');
  s.width = Math.ceil((r + pad) * 2);
  s.height = Math.ceil((r + pad) * 2);
  const c = s.getContext('2d');
  c.translate(r + pad, r + pad);
  c.fillStyle = color;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.globalCompositeOperation = 'destination-out';
  let gapY = r * 0.08;
  let gapH = r * 0.06;
  while (gapY < r) {
    c.fillRect(-r - 2, gapY, r * 2 + 4, gapH);
    gapY += gapH + r * 0.16;
    gapH *= 1.5;
  }
  ctx.drawImage(s, x - r - pad, y - r - pad);
}

function drawSkyline(ctx, w, y, h, color) {
  ctx.fillStyle = color;
  let x = 0;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (x < w) {
    const bw = w * (0.04 + rnd() * 0.06);
    const bh = h * (0.35 + rnd() * 0.65);
    ctx.fillRect(x, y + h - bh, bw, bh);
    if (rnd() > 0.5) ctx.fillRect(x + bw * 0.3, y + h - bh - h * 0.18, bw * 0.4, h * 0.18);
    x += bw + w * 0.008;
  }
  // Lit windows.
  ctx.fillStyle = 'rgba(255, 215, 106, 0.85)';
  for (let i = 0; i < 90; i++) {
    const wx = rnd() * w;
    const wy = y + h * 0.25 + rnd() * h * 0.7;
    ctx.fillRect(wx, wy, Math.max(2, w * 0.004), Math.max(2, h * 0.006));
  }
}

function drawPalm(ctx, x, y, s, flip, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk, leaning slightly.
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(16, -55, 6, -110);
  ctx.stroke();
  // Fronds: long arcs that rise from the crown and droop at the tips,
  // like a real palm instead of straight spikes.
  ctx.lineWidth = 6;
  const fronds = [
    [-100, -18], [-78, -44], [-48, -62], [-14, -70], [18, -68], [52, -58], [82, -38], [104, -8],
  ];
  for (const [dx, dy] of fronds) {
    ctx.beginPath();
    ctx.moveTo(6, -110);
    ctx.quadraticCurveTo(6 + dx * 0.55, -110 + dy * 0.9 - 26, 6 + dx, -110 + dy + 34);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHalftone(ctx, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  const step = Math.max(14, w * 0.016);
  for (let y = step; y < h * 0.42; y += step) {
    for (let x = step / 2 + ((Math.round(y / step) % 2) * step) / 2; x < w; x += step) {
      const r = Math.max(1, step * 0.14 * (1 - y / (h * 0.5)));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Draws one photo into a panel rect with cover-fit, zoom and pan, then grades it.
function drawPanel(ctx, rect, photo, zoom, panX, panY, grade, w, h) {
  const x = rect.x * w;
  const y = rect.y * h;
  const pw = rect.w * w;
  const ph = rect.h * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, pw, ph);
  ctx.clip();
  if (photo) {
    const base = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight);
    const scale = base * zoom;
    const iw = photo.naturalWidth * scale;
    const ih = photo.naturalHeight * scale;
    const dx = x + (pw - iw) / 2 + panX * pw;
    // Faces sit in the upper part of a photo: when a wide panel crops the
    // photo top and bottom, anchor the crop to the top so heads stay in
    // frame (the Pan slider can still move it down).
    const dy = ih > ph ? y + panY * ph : y + (ph - ih) / 2 + panY * ph;
    ctx.drawImage(photo, dx, dy, iw, ih);
  } else {
    const g2 = ctx.createLinearGradient(x, y, x + pw, y + ph);
    g2.addColorStop(0, '#4a2358');
    g2.addColorStop(1, '#1c0b2e');
    ctx.fillStyle = g2;
    ctx.fillRect(x, y, pw, ph);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 ${Math.round(ph * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', x + pw / 2, y + ph / 2);
  }
  // Sunset / neon grade wash.
  const wash = ctx.createLinearGradient(x, y, x, y + ph);
  wash.addColorStop(0, grade.tint);
  wash.addColorStop(1, grade.tint2);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, pw, ph);
  // Warm light from the top corner.
  const glow = ctx.createRadialGradient(x + pw * 0.85, y + ph * 0.1, 0, x + pw * 0.85, y + ph * 0.1, pw * 0.9);
  glow.addColorStop(0, 'rgba(255, 214, 120, 0.20)');
  glow.addColorStop(1, 'rgba(255, 214, 120, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, pw, ph);
  // Vignette.
  const vg = ctx.createRadialGradient(x + pw / 2, y + ph / 2, Math.min(pw, ph) * 0.35, x + pw / 2, y + ph / 2, Math.max(pw, ph) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10, 4, 24, 0.38)');
  ctx.fillStyle = vg;
  ctx.fillRect(x, y, pw, ph);
  ctx.restore();
  // Comic frame: thick white edge, thin black inner line.
  ctx.save();
  ctx.lineWidth = Math.max(3, w * 0.006);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(x, y, pw, ph);
  ctx.lineWidth = Math.max(1.5, w * 0.0016);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.strokeRect(x + w * 0.004, y + w * 0.004, pw - w * 0.008, ph - w * 0.008);
  ctx.restore();
}

function drawLettering(ctx, state, grade, w, h, bandY, bandH) {
  const title = (state.title || 'SUNSET HEIST').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  const style = state.letterStyle || 'block';
  const cx = w / 2;
  const titleY = bandY + bandH * 0.52;
  let size = bandH * 0.52;
  const family = '"Arial Narrow", Impact, "Helvetica Neue", Arial, sans-serif';
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older canvas */ }
  const setFont = (s) => { ctx.font = `900 ${Math.round(s)}px ${family}`; };
  setFont(size);
  while (ctx.measureText(title).width > w * 0.88 && size > 14) {
    size -= 4;
    setFont(size);
    try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* noop */ }
  }
  if (style === 'neon') {
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = size * 0.35;
    ctx.fillStyle = grade.title;
    ctx.fillText(title, cx, titleY);
    ctx.shadowColor = '#39e6ff';
    ctx.shadowBlur = size * 0.18;
    ctx.fillText(title, cx, titleY);
  } else if (style === 'outline') {
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size * 0.10);
    ctx.strokeStyle = grade.title;
    ctx.strokeText(title, cx, titleY);
    ctx.fillStyle = 'rgba(20, 6, 36, 0.55)';
    ctx.fillText(title, cx, titleY);
  } else {
    // Block: hard offset shadow, black outline, bright fill.
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeStyle = '#14061f';
    ctx.fillStyle = '#14061f';
    ctx.fillText(title, cx + size * 0.07, titleY + size * 0.07);
    ctx.strokeText(title, cx, titleY);
    ctx.fillStyle = grade.title;
    ctx.fillText(title, cx, titleY);
  }
  ctx.shadowBlur = 0;
  try { ctx.letterSpacing = '0px'; } catch { /* noop */ }
  if (subtitle) {
    const subSize = Math.max(13, bandH * 0.16);
    ctx.font = `700 ${Math.round(subSize)}px ${family}`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.28)}px`; } catch { /* noop */ }
    ctx.fillStyle = grade.accent;
    ctx.fillText(subtitle, cx, bandY + bandH * 0.86);
  }
  ctx.restore();
}

/**
 * Draws the whole cover. `state` holds photos (images or null), layout,
 * aspect ('square' | 'portrait' | 'landscape'), grade key, title, subtitle,
 * letterStyle, panels [{photo, zoom, panX, panY}], effects {sun, skyline, palms, halftone}.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const aspect = state.aspect || 'square';

  // Sunset sky.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  if (state.effects?.halftone !== false) drawHalftone(ctx, w, h, 'rgba(255,255,255,0.20)');
  if (state.effects?.sun !== false) {
    drawSun(ctx, w * 0.78, h * 0.20, Math.min(w, h) * 0.13, grade.sun);
  }

  // Panels.
  const rects = panelRects(state.layout, aspect);
  rects.forEach((rect, i) => {
    const p = state.panels[i] || { photo: defaultPhotoFor(state.layout, i), zoom: 1, panX: 0, panY: 0 };
    drawPanel(ctx, rect, state.photos[p.photo] || null, p.zoom, p.panX, p.panY, grade, w, h);
  });

  // Caption band across the bottom.
  const bandH = h * (aspect === 'landscape' ? 0.24 : 0.20);
  const bandY = h - bandH;
  const band = ctx.createLinearGradient(0, bandY - h * 0.06, 0, h);
  band.addColorStop(0, 'rgba(20, 6, 36, 0)');
  band.addColorStop(0.35, grade.band);
  band.addColorStop(1, grade.band);
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY - h * 0.06, w, h - bandY + h * 0.06);

  // Skyline as a thin silhouette strip at the top of the caption band,
  // so it never covers the photo panels above it.
  if (state.effects?.skyline !== false) {
    drawSkyline(ctx, w, bandY + bandH * 0.02, bandH * 0.30, 'rgba(16, 5, 30, 0.9)');
  }
  if (state.effects?.palms !== false) {
    const s = Math.min(w, h) / 1080;
    drawPalm(ctx, w * 0.03, bandY + bandH * 0.66, s * 0.85, false, 'rgba(16, 5, 30, 0.95)');
    drawPalm(ctx, w * 0.97, bandY + bandH * 0.66, s * 0.75, true, 'rgba(16, 5, 30, 0.95)');
  }

  // Corner stamp: original wordmark for this maker, not a game logo.
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.round(h * 0.018)}px "Arial Narrow", Impact, sans-serif`;
  try { ctx.letterSpacing = `${Math.round(h * 0.004)}px`; } catch { /* noop */ }
  ctx.fillStyle = grade.accent;
  ctx.fillText('★ VICE COVER', w * 0.03, bandY + bandH * 0.10);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('NEON BAY', w * 0.97, bandY + bandH * 0.10);
  ctx.restore();

  drawLettering(ctx, state, grade, w, h, bandY, bandH);

  // Poster frame.
  ctx.save();
  ctx.lineWidth = Math.max(4, w * 0.008);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(w * 0.006, h * 0.006, w * 0.988, h * 0.988);
  ctx.restore();
}
