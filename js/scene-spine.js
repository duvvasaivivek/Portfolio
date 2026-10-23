/**
 * Global spine: one ink hairline that runs the whole page length in a fixed canvas behind
 * the content. It keeps to the left gutter inside a section, sweeps to the middle of the page
 * at every section boundary and ties a knot there, and each knot carries an HTML link to that
 * section. The line draws itself as the page is scrolled, bends toward the pointer with a
 * spring, and the camera leans a few degrees toward the pointer so the knots, which sit nearer
 * the camera than the runs, shift against the faint drafting sheet behind them.
 *
 * Under reduced motion the line is fully drawn and nothing moves on its own; pointer bending
 * still works but settles instantly. Renders only when the pointer or the scroll changed.
 */

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import {
  createRenderer, ticker, createDprGovernor, readToken, blendColor, onContextLost, seededRandom,
  approach, placeLabel
} from './scene-utils.js';

const EXTENT = 24;
const DOTS = 16;
const DOT_WRAP = 10;
const LEAN = 0.1;
const DIST = 10;
const FOV = 45;
const SWEEP_UP_PX = 170;   /* reach of the sweep above a boundary, kept inside the section padding */
const SWEEP_DOWN_PX = 260; /* reach below the boundary, before the next heading */
const SPACING_PX = 6;      /* resampled point spacing along the page */
const REACH_PX = 300;      /* pointer influence radius */
const KNOT_Z = 1.2;
const RUN_Z = -0.8;

function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export function createSpineScene(canvas, opts = {}) {
  const labelsEl = document.getElementById('spineLabels');
  let reducedMotion = !!opts.reducedMotion;

  const paperHex = readToken('--paper', '#F6F1E8');
  const inkHex = new THREE.Color(readToken('--lattice-node', '#17150F')).getHex();
  const inkColor = new THREE.Color(inkHex);
  const accentColor = new THREE.Color(readToken('--lattice-node-active', '#6B1F2B'));
  const gridColor = blendColor(paperHex, inkHex, 0.07);
  const dotColor = blendColor(paperHex, inkHex, 0.18);
  const spineColor = blendColor(paperHex, inkHex, 0.62);

  const renderer = createRenderer(canvas, { antialias: true, maxDpr: 1.5 });
  const governor = createDprGovernor(renderer, { steps: [1.5, 1] });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, DIST);
  camera.lookAt(0, 0, 0);

  /* Drafting sheet behind everything */
  const sheet = new THREE.Group();
  sheet.rotation.x = -0.21;
  sheet.position.z = -1.5;
  scene.add(sheet);
  const gridPositions = [];
  for (let i = -EXTENT; i <= EXTENT; i++) {
    gridPositions.push(i, -EXTENT, 0, i, EXTENT, 0);
    gridPositions.push(-EXTENT, i, 0, EXTENT, i, 0);
  }
  const gridGeom = new LineSegmentsGeometry();
  gridGeom.setPositions(gridPositions);
  const gridMat = new LineMaterial({ color: gridColor.getHex(), linewidth: 1, worldUnits: false });
  const grid = new LineSegments2(gridGeom, gridMat);
  sheet.add(grid);

  const rand = seededRandom(11);
  const dotGeom = new THREE.IcosahedronGeometry(0.022, 1);
  const dotMat = new THREE.MeshBasicMaterial({ color: dotColor });
  const dots = new THREE.InstancedMesh(dotGeom, dotMat, DOTS);
  const dotBase = [];
  for (let i = 0; i < DOTS; i++) {
    dotBase.push(new THREE.Vector3((rand() - 0.5) * 12, (rand() - 0.5) * DOT_WRAP, (rand() - 0.5) * 3 - 1));
  }
  scene.add(dots);
  const mat4 = new THREE.Matrix4();
  function writeDots(drift) {
    for (let i = 0; i < DOTS; i++) {
      const b = dotBase[i];
      const y = ((((b.y + drift * 0.5) % DOT_WRAP) + DOT_WRAP * 1.5) % DOT_WRAP) - DOT_WRAP / 2;
      mat4.makeTranslation(b.x, y, b.z);
      dots.setMatrixAt(i, mat4);
    }
    dots.instanceMatrix.needsUpdate = true;
  }

  /* Spine: the page group moves with the scroll; points inside it are in document space */
  const page = new THREE.Group();
  scene.add(page);
  const spineMat = new LineMaterial({ color: spineColor.getHex(), linewidth: 1.4, worldUnits: false });
  let spineGeom = null;
  let spine = null;
  let base = null;        /* resampled points, x y z per point, document space */
  let docY = null;        /* each point's document y in px */
  let dispCur = null;     /* current pointer displacement per point */
  let dispTarget = null;
  let count = 0;
  let dirtyDisp = false;

  /* Knots and labels */
  const sections = Array.from(document.querySelectorAll('main > section.section'));
  const K = sections.length;
  const knotGeom = new THREE.IcosahedronGeometry(0.06, 1);
  const knotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const knots = new THREE.InstancedMesh(knotGeom, knotMat, Math.max(1, K));
  knots.frustumCulled = false;
  page.add(knots);
  const knotPos = sections.map(() => new THREE.Vector3());
  const knotDoc = new Float32Array(K);
  const knotShown = new Float32Array(K);

  const st = {
    yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0,
    scroll: window.scrollY,
    vw: 1, vh: 1, u: 0.01,
    pointerX: -1e9, pointerY: -1e9, pointerIn: false,
    drawn: -1, drawnTarget: 0,
    hot: -1,
    rebuild: 0
  };
  const sceneObj = { dirty: true, tick, render };

  function writeKnot(i, s, c) {
    mat4.makeScale(s, s, s).setPosition(knotPos[i]);
    knots.setMatrixAt(i, mat4);
    knots.setColorAt(i, c);
  }

  function setHot(i) {
    if (i === st.hot) return;
    st.hot = i;
    for (let k = 0; k < K; k++) {
      labels[k].classList.toggle('is-hot', k === i);
      writeKnot(k, Math.max(knotShown[k], 1e-4) * (k === i ? 1.5 : 1), k === i ? accentColor : inkColor);
    }
    knots.instanceMatrix.needsUpdate = true;
    if (knots.instanceColor) knots.instanceColor.needsUpdate = true;
    sceneObj.dirty = true;
  }

  const labels = sections.map((sec, i) => {
    const a = document.createElement('a');
    a.className = 'spine-label view-label';
    a.href = `#${sec.id}`;
    a.tabIndex = -1;
    const navLink = document.querySelector(`.site-header a[href="#${sec.id}"]`);
    const heading = sec.querySelector('h2');
    const num = document.createElement('span');
    num.className = 'spine-num';
    num.textContent = String(i + 1).padStart(2, '0');
    const name = document.createElement('span');
    name.className = 'spine-name';
    name.textContent = (navLink && navLink.textContent.trim()) || (heading && heading.textContent.trim()) || sec.id;
    a.append(num, name);
    a.addEventListener('pointerenter', () => setHot(i));
    a.addEventListener('pointerleave', () => { if (st.hot === i) setHot(-1); });
    labelsEl.appendChild(a);
    return a;
  });

  /* ---- Layout: measure the sections and resample the curve ---- */
  function build() {
    st.rebuild = 0;
    const vw = st.vw;
    const u = st.u;
    const docH = Math.max(document.documentElement.scrollHeight, st.vh);
    const containerLeft = Math.max(0, (vw - 1120) / 2) + Math.min(40, Math.max(20, vw * 0.04));
    const edgePx = Math.min(80, Math.max(18, containerLeft * 0.5));
    const toX = (px) => (px - vw / 2) * u;
    const toY = (py) => -py * u;
    const runZ = (y) => RUN_Z + 0.35 * Math.sin(y / 700);

    const pts = [];
    pts.push(new THREE.Vector3(toX(edgePx), toY(-120), RUN_Z));
    pts.push(new THREE.Vector3(toX(edgePx), toY(0), RUN_Z));
    let lastY = 0;
    sections.forEach((sec, i) => {
      const top = Math.round(sec.getBoundingClientRect().top + window.scrollY);
      knotDoc[i] = top;
      /* a waypoint midway down a long run keeps it straight */
      const mid = (lastY + top - SWEEP_UP_PX) / 2;
      if (mid - lastY > 300) pts.push(new THREE.Vector3(toX(edgePx), toY(mid), runZ(mid)));
      /* Come down the gutter to the rule, trace along it to the knot, leave below it: the stroke
         never rises into the section above, where the journey rail and the hero links sit. */
      pts.push(new THREE.Vector3(toX(edgePx), toY(top - SWEEP_UP_PX), runZ(top - SWEEP_UP_PX)));
      pts.push(new THREE.Vector3(toX(edgePx + 36), toY(top + 2), (RUN_Z + KNOT_Z) / 2));
      pts.push(new THREE.Vector3(toX(vw * 0.5), toY(top), KNOT_Z));
      pts.push(new THREE.Vector3(toX(edgePx), toY(top + SWEEP_DOWN_PX), runZ(top + SWEEP_DOWN_PX)));
      knotPos[i].set(toX(vw * 0.5), toY(top), KNOT_Z);
      lastY = top + SWEEP_DOWN_PX;
    });
    pts.push(new THREE.Vector3(toX(edgePx), toY(docH), RUN_Z));
    pts.push(new THREE.Vector3(toX(edgePx), toY(docH + 120), RUN_Z));

    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const n = Math.max(64, Math.round((docH + 240) / SPACING_PX));
    const sampled = curve.getPoints(n);
    count = sampled.length;
    base = new Float32Array(count * 3);
    docY = new Float32Array(count);
    dispCur = new Float32Array(count * 3);
    dispTarget = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      base[i * 3] = sampled[i].x; base[i * 3 + 1] = sampled[i].y; base[i * 3 + 2] = sampled[i].z;
      docY[i] = -sampled[i].y / u;
    }

    if (spine) { page.remove(spine); spineGeom.dispose(); }
    spineGeom = new LineSegmentsGeometry();
    spineGeom.setPositions(new Float32Array((count - 1) * 6));
    spineGeom.instanceCount = 0;
    spine = new LineSegments2(spineGeom, spineMat);
    spine.frustumCulled = false;
    page.add(spine);

    for (let i = 0; i < K; i++) writeKnot(i, Math.max(knotShown[i], 1e-4) * (st.hot === i ? 1.5 : 1), st.hot === i ? accentColor : inkColor);
    knots.instanceMatrix.needsUpdate = true;
    if (knots.instanceColor) knots.instanceColor.needsUpdate = true;

    st.drawn = -1;
    updateDrawTarget();
    updatePointerTarget();
    writeSpine();
    sceneObj.dirty = true;
  }

  function updateDrawTarget() {
    if (!count) return;
    if (reducedMotion) { st.drawnTarget = count - 1; return; }
    /* The lead grows toward the end of the page so the line completes at the last scroll position */
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - st.vh);
    const progress = Math.min(1, Math.max(0, st.scroll / maxScroll));
    const limit = st.scroll + st.vh * 0.82 + progress * (st.vh * 0.18 + 240);
    let lo = 0; let hi = count;
    while (lo < hi) { const m = (lo + hi) >> 1; if (docY[m] < limit) lo = m + 1; else hi = m; }
    st.drawnTarget = Math.min(count - 1, Math.max(2, lo));
  }

  function updatePointerTarget() {
    if (!count) return;
    const u = st.u;
    const reach = REACH_PX * u;
    const px = st.pointerIn ? (st.pointerX - st.vw / 2) * u : 1e9;
    const py = st.pointerIn ? -(st.pointerY + st.scroll) * u : 1e9;
    for (let i = 0; i < count; i++) {
      const o = i * 3;
      const dx = px - base[o];
      const dy = py - base[o + 1];
      const d = Math.sqrt(dx * dx + dy * dy);
      const f = d < reach ? smoothstep(1 - d / reach) : 0;
      dispTarget[o] = dx * f * 0.6;
      dispTarget[o + 1] = dy * f * 0.25;
      dispTarget[o + 2] = f * 0.7;
    }
    dirtyDisp = true;
  }

  function writeSpine() {
    const arr = spineGeom.attributes.instanceStart.data.array;
    for (let i = 0; i < count - 1; i++) {
      const o = i * 6;
      const a = i * 3;
      const b = a + 3;
      arr[o] = base[a] + dispCur[a]; arr[o + 1] = base[a + 1] + dispCur[a + 1]; arr[o + 2] = base[a + 2] + dispCur[a + 2];
      arr[o + 3] = base[b] + dispCur[b]; arr[o + 4] = base[b + 1] + dispCur[b + 1]; arr[o + 5] = base[b + 2] + dispCur[b + 2];
    }
    spineGeom.attributes.instanceStart.data.needsUpdate = true;
  }

  /* ---- Input ---- */
  function onPointerMove(e) {
    st.pointerX = e.clientX;
    st.pointerY = e.clientY;
    st.pointerIn = true;
    const nx = (e.clientX / Math.max(1, st.vw)) * 2 - 1;
    const ny = (e.clientY / Math.max(1, st.vh)) * 2 - 1;
    st.targetYaw = nx * LEAN;
    st.targetPitch = -ny * LEAN;
    updatePointerTarget();
    sceneObj.dirty = true;
  }
  function onPointerOut(e) {
    if (e && e.relatedTarget) return;
    st.pointerIn = false;
    st.targetYaw = 0; st.targetPitch = 0;
    updatePointerTarget();
    sceneObj.dirty = true;
  }
  function onScroll() {
    st.scroll = window.scrollY;
    updateDrawTarget();
    if (st.pointerIn) updatePointerTarget();
    sceneObj.dirty = true;
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerout', onPointerOut);
  window.addEventListener('blur', onPointerOut);
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Per frame ---- */
  const worldPos = new THREE.Vector3();
  function tick(dt) {
    if (st.rebuild) build();
    if (!count) return;

    const y = reducedMotion ? st.targetYaw : approach(st.yaw, st.targetYaw, dt, 160);
    const p = reducedMotion ? st.targetPitch : approach(st.pitch, st.targetPitch, dt, 160);
    if (Math.abs(y - st.yaw) > 1e-5 || Math.abs(p - st.pitch) > 1e-5) {
      st.yaw = y; st.pitch = p;
      sceneObj.dirty = true;
    }

    /* Draw progress: the line catches up with the scroll position */
    let drawn = st.drawn;
    if (reducedMotion) drawn = st.drawnTarget;
    else if (drawn < 0) drawn = Math.max(2, st.drawnTarget - 160);
    else drawn = approach(drawn, st.drawnTarget, dt, 140);
    if (Math.abs(drawn - st.drawnTarget) < 1) drawn = st.drawnTarget;
    if (drawn !== st.drawn) {
      st.drawn = drawn;
      const seg = Math.max(0, Math.min(count - 1, Math.floor(drawn)));
      spineGeom.instanceCount = seg;
      /* knots grow in as the line reaches them */
      const drawnDoc = docY[Math.min(count - 1, seg)];
      let changed = false;
      for (let i = 0; i < K; i++) {
        const want = reducedMotion ? 1 : smoothstep((drawnDoc - knotDoc[i] + 40) / 80);
        if (want !== knotShown[i]) {
          knotShown[i] = want;
          writeKnot(i, Math.max(want, 1e-4) * (st.hot === i ? 1.5 : 1), st.hot === i ? accentColor : inkColor);
          changed = true;
        }
      }
      if (changed) { knots.instanceMatrix.needsUpdate = true; if (knots.instanceColor) knots.instanceColor.needsUpdate = true; }
      sceneObj.dirty = true;
    }

    /* Pointer spring */
    if (dirtyDisp) {
      let still = true;
      const n = count * 3;
      if (reducedMotion) {
        dispCur.set(dispTarget);
      } else {
        const k = 1 - Math.exp(-dt / 110);
        for (let i = 0; i < n; i++) {
          const d = dispTarget[i] - dispCur[i];
          if (Math.abs(d) > 1e-4) { dispCur[i] += d * k; still = false; }
          else dispCur[i] = dispTarget[i];
        }
      }
      writeSpine();
      if (still) dirtyDisp = false;
      sceneObj.dirty = true;
    }

    if (!sceneObj.dirty) return;
    camera.position.set(Math.sin(st.yaw) * DIST, Math.sin(st.pitch) * DIST, Math.cos(st.yaw) * Math.cos(st.pitch) * DIST);
    camera.lookAt(0, 0, 0);
    page.position.y = (st.scroll + st.vh / 2) * st.u;
    const drift = st.scroll * 0.1 * st.u;
    grid.position.y = drift % 1;
    writeDots(drift);

    /* Labels follow their knots and stay hidden until the knot has been drawn */
    page.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    for (let i = 0; i < K; i++) {
      if (knotShown[i] < 0.5) { labels[i].classList.remove('is-visible'); continue; }
      worldPos.copy(knotPos[i]).applyMatrix4(page.matrixWorld);
      placeLabel(labels[i], worldPos, camera, st.vw, st.vh, 'right', 16);
    }
  }

  let ready = false;
  function render(dt) {
    renderer.render(scene, camera);
    governor.sample(dt);
    if (!ready) { ready = true; canvas.classList.add('is-ready'); }
  }

  /* ---- Sizing ---- */
  function resize() {
    st.vw = Math.max(1, window.innerWidth);
    st.vh = Math.max(1, window.innerHeight);
    renderer.setSize(st.vw, st.vh, false);
    camera.aspect = st.vw / st.vh;
    camera.updateProjectionMatrix();
    gridMat.resolution.set(st.vw, st.vh);
    spineMat.resolution.set(st.vw, st.vh);
    st.u = (2 * DIST * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / st.vh;
    st.rebuild = 1;
    sceneObj.dirty = true;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  /* Document height changes (images, fonts, dialogs) move the section boundaries */
  let lastDocH = 0;
  const bodyWatcher = new ResizeObserver(() => {
    const h = document.documentElement.scrollHeight;
    if (h !== lastDocH) { lastDocH = h; st.rebuild = 1; sceneObj.dirty = true; }
  });
  bodyWatcher.observe(document.body);

  ticker.add(sceneObj);

  function destroy() {
    ticker.remove(sceneObj);
    bodyWatcher.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerout', onPointerOut);
    window.removeEventListener('blur', onPointerOut);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', resize);
    labelsEl.replaceChildren();
    canvas.classList.remove('is-ready');
    gridGeom.dispose(); gridMat.dispose(); dotGeom.dispose(); dotMat.dispose();
    if (spineGeom) spineGeom.dispose();
    spineMat.dispose(); knotGeom.dispose(); knotMat.dispose();
    renderer.dispose();
  }

  onContextLost(renderer, () => {
    destroy();
    document.documentElement.classList.remove('spine');
  });

  return {
    destroy,
    setReducedMotion(v) {
      reducedMotion = !!v;
      st.drawn = -1;
      updateDrawTarget();
      sceneObj.dirty = true;
    },
    /* Dev-only probe read by the verification script */
    probe() {
      return { points: count, drawn: spineGeom ? spineGeom.instanceCount : 0, knots: Array.from(knotShown) };
    }
  };
}
