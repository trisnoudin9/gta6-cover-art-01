// Vice Cover — wires the editor: photo slots, layout / grade / lettering picks,
// per-panel crop controls, live preview, and PNG export in three post sizes.
// A `?shot=` query loads a fixed scene for screenshots instead (./shots.js).
import { drawCover, panelRects, defaultPhotoFor, GRADES, LAYOUTS } from './cover.js';
import { runShot } from './shots.js';

const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  landscape: { w: 1920, h: 1080, label: '1920 × 1080' },
};

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');

const state = {
  photos: [null, null, null],
  photoNames: ['— empty —', '— empty —', '— empty —'],
  layout: 'hero',
  aspect: 'square',
  grade: 'sunset',
  letterStyle: 'block',
  title: 'Sunset Heist',
  subtitle: 'Neon Bay Nights',
  selectedPanel: 0,
  panels: [],
  effects: { sun: true, skyline: true, palms: true, halftone: true },
};

function resetPanels() {
  const count = LAYOUTS[state.layout].panels;
  state.panels = Array.from({ length: count }, (_, i) => ({
    photo: defaultPhotoFor(state.layout, i),
    zoom: 1,
    panX: 0,
    panY: 0,
  }));
  state.selectedPanel = 0;
  syncPanelControls();
}

function redraw() {
  const size = SIZES[state.aspect];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCover(canvas, state);
}

function setStatus(text) {
  status.textContent = text;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function setPhotoSlot(slot, img, name) {
  state.photos[slot] = img;
  state.photoNames[slot] = name;
  document.getElementById(`slotname-${slot}`).textContent = name;
  redraw();
}

// --- photo slots -----------------------------------------------------------
for (let slot = 0; slot < 3; slot++) {
  const input = document.getElementById(`photo-${slot}`);
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const img = await loadImage(URL.createObjectURL(file));
      await setPhotoSlot(slot, img, file.name);
      setStatus(`Photo ${slot + 1} loaded: ${file.name}`);
    } catch {
      setStatus('That file could not be read as a photo.');
    }
  });
  for (const sample of ['boulevard', 'pier']) {
    document.getElementById(`sample-${slot}-${sample}`).addEventListener('click', async () => {
      const img = await loadImage(`samples/${sample}.jpg`);
      await setPhotoSlot(slot, img, `${sample}.jpg (sample)`);
      setStatus(`Photo ${slot + 1} set to the ${sample} sample.`);
    });
  }
}

// --- option groups ---------------------------------------------------------
function bindGroup(name, apply) {
  document.querySelectorAll(`[data-group="${name}"]`).forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(`[data-group="${name}"]`).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      apply(btn.dataset.value);
    });
  });
}

bindGroup('layout', (value) => { state.layout = value; resetPanels(); redraw(); });
bindGroup('grade', (value) => { state.grade = value; redraw(); });
bindGroup('letter', (value) => { state.letterStyle = value; redraw(); });
bindGroup('aspect', (value) => { state.aspect = value; redraw(); });

// --- caption ---------------------------------------------------------------
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

// --- effects ---------------------------------------------------------------
for (const key of ['sun', 'skyline', 'palms', 'halftone']) {
  document.getElementById(`fx-${key}`).addEventListener('change', (e) => {
    state.effects[key] = e.target.checked;
    redraw();
  });
}

// --- per-panel crop --------------------------------------------------------
const panelSelect = document.getElementById('panel-select');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panx');
const panYInput = document.getElementById('pany');
const panelPhoto = document.getElementById('panel-photo');

function syncPanelControls() {
  panelSelect.innerHTML = '';
  state.panels.forEach((_, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Panel ${i + 1}`;
    panelSelect.appendChild(opt);
  });
  panelSelect.value = String(state.selectedPanel);
  const p = state.panels[state.selectedPanel];
  zoomInput.value = String(p.zoom);
  panXInput.value = String(p.panX);
  panYInput.value = String(p.panY);
  panelPhoto.value = String(p.photo);
  document.getElementById('zoom-val').textContent = `${Math.round(p.zoom * 100)}%`;
  document.getElementById('panx-val').textContent = `${Math.round(p.panX * 100)}`;
  document.getElementById('pany-val').textContent = `${Math.round(p.panY * 100)}`;
}

panelSelect.addEventListener('change', () => {
  state.selectedPanel = Number(panelSelect.value);
  syncPanelControls();
});
panelPhoto.addEventListener('change', () => {
  state.panels[state.selectedPanel].photo = Number(panelPhoto.value);
  redraw();
});
zoomInput.addEventListener('input', () => {
  state.panels[state.selectedPanel].zoom = Number(zoomInput.value);
  syncPanelControls();
  redraw();
});
panXInput.addEventListener('input', () => {
  state.panels[state.selectedPanel].panX = Number(panXInput.value);
  syncPanelControls();
  redraw();
});
panYInput.addEventListener('input', () => {
  state.panels[state.selectedPanel].panY = Number(panYInput.value);
  syncPanelControls();
  redraw();
});

// Click a panel on the preview to select it for cropping.
canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  const fx = (e.clientX - r.left) / r.width;
  const fy = (e.clientY - r.top) / r.height;
  const rects = panelRects(state.layout, state.aspect);
  const hit = rects.findIndex((rect) => fx >= rect.x && fx <= rect.x + rect.w && fy >= rect.y && fy <= rect.y + rect.h);
  if (hit >= 0) {
    state.selectedPanel = hit;
    syncPanelControls();
    setStatus(`Panel ${hit + 1} selected — use Zoom and Pan to crop it.`);
  }
});

// --- export ----------------------------------------------------------------
function exportPNG(aspect) {
  const size = SIZES[aspect];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, { ...state, aspect });
  off.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — please try again.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved vice-cover-${size.w}x${size.h}.png`);
  }, 'image/png');
}

document.getElementById('export-square').addEventListener('click', () => exportPNG('square'));
document.getElementById('export-portrait').addEventListener('click', () => exportPNG('portrait'));
document.getElementById('export-landscape').addEventListener('click', () => exportPNG('landscape'));
document.getElementById('export-all').addEventListener('click', () => {
  exportPNG('square');
  setTimeout(() => exportPNG('portrait'), 350);
  setTimeout(() => exportPNG('landscape'), 700);
  setStatus('Exporting all three sizes…');
});

// --- screenshot scenes -----------------------------------------------------
async function loadShotScene(scene) {
  state.aspect = scene.aspect;
  state.layout = scene.layout;
  state.grade = scene.grade;
  state.letterStyle = scene.letterStyle;
  state.title = scene.title;
  state.subtitle = scene.subtitle;
  titleInput.value = scene.title;
  subtitleInput.value = scene.subtitle;
  document.querySelectorAll('[data-group="aspect"]').forEach((b) => b.classList.toggle('active', b.dataset.value === scene.aspect));
  document.querySelectorAll('[data-group="layout"]').forEach((b) => b.classList.toggle('active', b.dataset.value === scene.layout));
  document.querySelectorAll('[data-group="grade"]').forEach((b) => b.classList.toggle('active', b.dataset.value === scene.grade));
  document.querySelectorAll('[data-group="letter"]').forEach((b) => b.classList.toggle('active', b.dataset.value === scene.letterStyle));
  resetPanels();
  for (let slot = 0; slot < 3; slot++) {
    const img = await loadImage(`samples/${scene.photos[slot]}.jpg`);
    await setPhotoSlot(slot, img, `${scene.photos[slot]}.jpg (sample)`);
  }
  redraw();
}

const shot = new URLSearchParams(location.search).get('shot');
resetPanels();
if (shot) {
  runShot(shot, new URLSearchParams(location.search), { loadShotScene });
} else {
  loadImage('samples/boulevard.jpg').then((img) => setPhotoSlot(0, img, 'boulevard.jpg (sample)')).catch(() => redraw());
  loadImage('samples/pier.jpg').then((img) => setPhotoSlot(1, img, 'pier.jpg (sample)')).catch(() => {});
  redraw();
}
