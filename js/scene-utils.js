/**
 * Shared runtime for the two Three.js scenes: renderer factory, one rAF ticker with
 * dirty-gating, DPR governor, visibility and resize observers, pointer and picking helpers.
 */

import * as THREE from 'three';

/* ---------------- Environment ---------------- */

export function prefersReducedMotion() {
  return document.documentElement.classList.contains('reduce-motion')
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isLowDetail() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const mem = navigator.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  return coarse || mem <= 4 || cores <= 4;
}

export function readToken(name, fallback = '') {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Opaque color equal to `ink` drawn at `alpha` over `paper`. Avoids transparent materials. */
export function blendColor(paperHex, inkHex, alpha) {
  const paper = new THREE.Color(paperHex);
  const ink = new THREE.Color(inkHex);
  return paper.lerp(ink, alpha);
}

export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- Renderer ---------------- */

export function createRenderer(canvas, { antialias = true, maxDpr = 2 } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias,
    powerPreference: 'high-performance'
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  return renderer;
}

export function onContextLost(renderer, cb) {
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cb();
  }, { once: true });
}

/**
 * Steps the pixel ratio down when frames are consistently slow. Never steps back up.
 */
export function createDprGovernor(renderer, { steps = [2, 1.5, 1] } = {}) {
  const current = renderer.getPixelRatio();
  const ladder = steps.filter((s) => s < current - 0.01);
  const samples = new Float32Array(60);
  let count = 0;
  let level = -1;
  let onChange = null;

  return {
    sample(dt) {
      if (level >= ladder.length - 1 && ladder.length) return;
      if (!ladder.length) return;
      samples[count++] = dt;
      if (count < samples.length) return;
      let sum = 0;
      for (let i = 0; i < samples.length; i++) sum += samples[i];
      const mean = sum / samples.length;
      count = 0;
      if (mean > 20) {
        level++;
        renderer.setPixelRatio(ladder[level]);
        if (onChange) onChange(ladder[level]);
      }
    },
    set onChange(fn) { onChange = fn; }
  };
}

/* ---------------- Ticker ---------------- */

const scenes = new Set();
let rafId = 0;
let last = 0;

function loop(now) {
  rafId = 0;
  if (!scenes.size || document.hidden) { last = 0; return; }
  const dt = last ? Math.min(now - last, 50) : 16.7;
  last = now;
  for (const s of scenes) {
    s.tick(dt, now);
    if (s.dirty) {
      s.dirty = false;
      s.render(dt);
    }
  }
  rafId = requestAnimationFrame(loop);
}

function startLoop() {
  if (!rafId && scenes.size && !document.hidden) {
    last = 0;
    rafId = requestAnimationFrame(loop);
  }
}

export const ticker = {
  add(scene) {
    scenes.add(scene);
    scene.dirty = true;
    startLoop();
  },
  remove(scene) {
    scenes.delete(scene);
  }
};

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    last = 0;
  } else {
    startLoop();
  }
});

/* ---------------- Observers ---------------- */

export function observeVisibility(el, { onEnter, onLeave, rootMargin = '0px' } = {}) {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) onEnter && onEnter(entry);
      else onLeave && onLeave(entry);
    }
  }, { rootMargin, threshold: 0 });
  io.observe(el);
  return io;
}

/** ResizeObserver whose callback runs at most once per frame. */
export function createResizeWatcher(el, cb) {
  let pending = 0;
  let lastWidth = -1;
  let lastHeight = -1;
  const ro = new ResizeObserver((entries) => {
    const entry = entries[entries.length - 1];
    const box = entry.contentRect;
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      const w = Math.max(1, Math.round(box.width));
      const h = Math.max(1, Math.round(box.height));
      if (w === lastWidth && h === lastHeight) { cb(w, h, false); return; }
      lastWidth = w;
      lastHeight = h;
      cb(w, h, true);
    });
  });
  ro.observe(el);
  return ro;
}

/* ---------------- Pointer ---------------- */

/**
 * Unified pointer handling on a canvas. Handlers receive (event, ndc) where ndc is a
 * THREE.Vector2 in normalized device coordinates. `moved` becomes true once the pointer
 * has travelled more than 4px from the pointerdown position.
 */
export function attachPointer(canvas, handlers = {}) {
  const ndc = new THREE.Vector2();
  const state = { down: false, moved: false, startX: 0, startY: 0, lastX: 0, lastY: 0 };

  function toNdc(e) {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    ndc.set((e.offsetX / w) * 2 - 1, -(e.offsetY / h) * 2 + 1);
    return ndc;
  }

  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    state.down = true;
    state.moved = false;
    state.startX = state.lastX = e.clientX;
    state.startY = state.lastY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    handlers.onDown && handlers.onDown(e, toNdc(e), state);
  }

  function onMove(e) {
    if (state.down) {
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      if (!state.moved && (dx * dx + dy * dy) > 16) state.moved = true;
    }
    handlers.onMove && handlers.onMove(e, toNdc(e), state);
    state.lastX = e.clientX;
    state.lastY = e.clientY;
  }

  function onUp(e) {
    if (!state.down) return;
    state.down = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    handlers.onUp && handlers.onUp(e, toNdc(e), state);
  }

  function onCancel(e) {
    const wasDown = state.down;
    state.down = false;
    if (wasDown && handlers.onUp) handlers.onUp(e, ndc, { ...state, moved: true });
  }

  function onLeave(e) {
    handlers.onLeave && handlers.onLeave(e, state);
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onCancel);
  canvas.addEventListener('lostpointercapture', onCancel);
  canvas.addEventListener('pointerleave', onLeave);

  return {
    state,
    destroy() {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('lostpointercapture', onCancel);
      canvas.removeEventListener('pointerleave', onLeave);
    }
  };
}

/* ---------------- Easing ---------------- */

/** Moves `current` toward `target` with time constant `tau` (ms). Frame-rate independent. */
export function approach(current, target, dt, tau) {
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

/* ---------------- Orbit ---------------- */

/**
 * Drag-to-rotate with inertia, shared by every scene that can be turned by hand.
 * Feed it pointer events from attachPointer; call tick(dt) each frame, which returns true
 * while inertia is still changing the rotation. Adds is-dragging / is-touched to `root`.
 */
export function createOrbit(root, opts = {}) {
  const pitchClamp = opts.pitchClamp ?? 1.2;
  const yawClamp = opts.yawClamp ?? Infinity;
  const yawHome = opts.rotY ?? 0;
  const speed = opts.speed ?? 0.005;
  const damp = opts.damp ?? 0.94;
  const clampPitch = (v) => Math.min(pitchClamp, Math.max(-pitchClamp, v));
  const clampYaw = (v) => Math.min(yawHome + yawClamp, Math.max(yawHome - yawClamp, v));
  const o = {
    rotX: opts.rotX ?? 0,
    rotY: opts.rotY ?? 0,
    velX: 0,
    velY: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    onDown(e) {
      o.dragging = true;
      o.lastX = e.clientX; o.lastY = e.clientY;
      o.velX = 0; o.velY = 0;
      root.classList.add('is-dragging');
      root.classList.add('is-touched');
    },
    onMove(e) {
      if (!o.dragging) return false;
      const dx = e.clientX - o.lastX;
      const dy = e.clientY - o.lastY;
      o.lastX = e.clientX; o.lastY = e.clientY;
      o.velY = dx * speed;
      o.velX = dy * speed;
      o.rotY = clampYaw(o.rotY + o.velY);
      o.rotX = clampPitch(o.rotX + o.velX);
      return true;
    },
    onUp(inertia = true) {
      o.dragging = false;
      root.classList.remove('is-dragging');
      if (!inertia) { o.velX = 0; o.velY = 0; }
    },
    tick(dt) {
      if (o.dragging) return false;
      if (Math.abs(o.velX) + Math.abs(o.velY) <= 1e-4) {
        o.velX = 0; o.velY = 0;
        return false;
      }
      o.rotY = clampYaw(o.rotY + o.velY);
      o.rotX = clampPitch(o.rotX + o.velX);
      const d = Math.pow(damp, dt / 16.667);
      o.velX *= d; o.velY *= d;
      return true;
    },
    stop() { o.velX = 0; o.velY = 0; }
  };
  return o;
}

/* ---------------- Picking and projection ---------------- */

export function createPicker(camera, targets) {
  const raycaster = new THREE.Raycaster();
  raycaster.params.Line = { threshold: 0.0001 };
  return {
    pick(ndc) {
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(targets, false);
      return hits.length ? hits[0] : null;
    }
  };
}

const projScratch = new THREE.Vector3();

/** World position to CSS pixels inside a canvas of size w x h. Writes into `out`. */
export function projectToScreen(worldPos, camera, w, h, out) {
  projScratch.copy(worldPos).project(camera);
  out.x = (projScratch.x + 1) * 0.5 * w;
  out.y = (1 - projScratch.y) * 0.5 * h;
  out.visible = projScratch.z < 1 && Math.abs(projScratch.x) <= 1.15 && Math.abs(projScratch.y) <= 1.15;
  return out;
}

const labelScratch = { x: 0, y: 0, visible: false };

/**
 * Places an HTML label at the projection of `worldPos` inside a w x h canvas and toggles
 * its is-visible class. Modes: 'tip' sits below-right of the point and flips to the left
 * past 55% of the width (hero style); 'above' centres the label over the point; 'left' and
 * 'right' sit beside it, vertically centred. Returns whether the point is on screen.
 */
export function placeLabel(el, worldPos, camera, w, h, mode = 'tip', pad = 14) {
  projectToScreen(worldPos, camera, w, h, labelScratch);
  const x = Math.round(labelScratch.x);
  const y = Math.round(labelScratch.y);
  const visible = labelScratch.visible;
  el.classList.toggle('is-visible', visible);
  if (!visible) return false;
  let t;
  if (mode === 'above') t = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
  else if (mode === 'right') t = `translate(${x + pad}px, ${y}px) translate(0, -50%)`;
  else if (mode === 'left') t = `translate(${x - pad}px, ${y}px) translate(-100%, -50%)`;
  else t = x > w * 0.55 ? `translate(calc(${x - pad}px - 100%), ${y + pad}px)` : `translate(${x + pad}px, ${y + pad}px)`;
  el.style.transform = t;
  return true;
}

export { THREE };
