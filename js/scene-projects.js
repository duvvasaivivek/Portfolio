/**
 * Projects architecture drawing: a sticky viewport beside the project list that shows the
 * active project as an exploded stack of thin plates, one per architecture layer, labelled in
 * HTML. The active project follows the row nearest the middle of the viewport, or the row
 * under the pointer or keyboard focus. Drag to orbit; select a plate to open the project dialog.
 */

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { architectureData, projectsData } from './data.js';
import {
  createRenderer, ticker, observeVisibility, createDprGovernor, createResizeWatcher,
  attachPointer, createPicker, placeLabel, projectToScreen, isLowDetail, readToken, blendColor, onContextLost,
  createOrbit, approach
} from './scene-utils.js';

const SLOTS = 4;
const GAP = 0.8;
const W = 2.1;
const D = 1.5;
const T = 0.06;

export function createProjectsScene(section, opts = {}) {
  const view = section.querySelector('.arch-view');
  const stage = view.querySelector('.arch-stage');
  const canvas = view.querySelector('.arch-canvas');
  const labelsEl = view.querySelector('.arch-labels');
  const titleEl = view.querySelector('.arch-title');
  const rows = Array.from(section.querySelectorAll('.case-row[id^="project-"]'));
  const rowIds = rows.map((r) => r.id.slice('project-'.length));

  const low = isLowDetail();
  let reducedMotion = !!opts.reducedMotion;

  /* Colors */
  const paperHex = readToken('--paper', '#F6F1E8');
  const inkColor = new THREE.Color(readToken('--lattice-node', '#17150F'));
  const accentColor = new THREE.Color(readToken('--lattice-node-active', '#6B1F2B'));
  const raised = new THREE.Color(readToken('--paper-raised', '#FCFAF5'));
  const sunk = new THREE.Color(readToken('--paper-sunk', '#EEE8DC'));
  const outlineColor = blendColor(paperHex, inkColor.getHex(), 0.7);
  const connectorColor = blendColor(paperHex, inkColor.getHex(), 0.32);

  /* Renderer, scene, camera */
  const renderer = createRenderer(canvas, { antialias: !low, maxDpr: low ? 1.5 : 2 });
  const governor = createDprGovernor(renderer);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 8.8);
  camera.lookAt(0, 0, 0);
  const group = new THREE.Group();
  group.position.x = -0.45; /* leaves room for the labels on the right */
  scene.add(group);

  /* Plate geometry: per-face colours stand in for lighting */
  const plateGeom = new THREE.BoxGeometry(W, T, D);
  const colors = new Float32Array(plateGeom.attributes.position.count * 3);
  const bottom = sunk.clone().lerp(inkColor, 0.08);
  for (let g = 0; g < 6; g++) {
    const c = g === 2 ? raised : g === 3 ? bottom : sunk;
    for (let v = 0; v < 4; v++) {
      const i = (g * 4 + v) * 3;
      colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b;
    }
  }
  plateGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const plateMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const edgesSource = new THREE.EdgesGeometry(plateGeom);
  const outlineGeom = new LineSegmentsGeometry().fromEdgesGeometry(edgesSource);
  const outlineMat = new LineMaterial({ color: outlineColor.getHex(), linewidth: 1.2, worldUnits: false });
  const outlineHotMat = new LineMaterial({ color: accentColor.getHex(), linewidth: 1.5, worldUnits: false });

  const plates = [];
  for (let i = 0; i < SLOTS; i++) {
    const mesh = new THREE.Mesh(plateGeom, plateMat);
    const outline = new LineSegments2(outlineGeom, outlineMat);
    mesh.userData.slot = i;
    group.add(mesh);
    group.add(outline);
    const label = document.createElement('div');
    label.className = 'arch-label view-label';
    const layer = document.createElement('span');
    layer.className = 'arch-layer';
    const items = document.createElement('span');
    items.className = 'arch-items';
    label.append(layer, items);
    labelsEl.appendChild(label);
    plates.push({ mesh, outline, label, layer, items, y: 0, s: 0, ty: 0, ts: 0 });
  }

  /* Connectors: hairlines at the four corners between consecutive plates */
  const connPositions = new Float32Array((SLOTS - 1) * 4 * 2 * 3);
  const connGeom = new THREE.BufferGeometry();
  connGeom.setAttribute('position', new THREE.BufferAttribute(connPositions, 3));
  const connMat = new THREE.LineBasicMaterial({ color: connectorColor.getHex() });
  const connectors = new THREE.LineSegments(connGeom, connMat);
  group.add(connectors);
  const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  function writeConnectors() {
    let o = 0;
    for (let k = 0; k < SLOTS - 1; k++) {
      const a = plates[k];
      const b = plates[k + 1];
      const s = Math.min(a.s, b.s) * 0.92;
      const y1 = a.y - (T / 2) * a.s;
      const y2 = b.y + (T / 2) * b.s;
      for (const [cx, cz] of CORNERS) {
        connPositions[o++] = cx * (W / 2) * s; connPositions[o++] = y1; connPositions[o++] = cz * (D / 2) * s;
        connPositions[o++] = cx * (W / 2) * s; connPositions[o++] = y2; connPositions[o++] = cz * (D / 2) * s;
      }
    }
    connGeom.attributes.position.needsUpdate = true;
  }

  /* State */
  const orbit = createOrbit(view, { rotX: 0.52, rotY: -0.72, pitchClamp: 1.1 });
  const st = {
    activeId: null,
    hoverId: null,
    scrollId: null,
    hot: -1,
    animating: true,
    pointerNdc: new THREE.Vector2(),
    pointerDirty: false,
    width: 1, height: 1,
    switchTimer: 0
  };
  const sceneObj = { dirty: true, tick, render };

  const transitionMs = () => (reducedMotion ? 0 : parseFloat(readToken('--dur-base', '240')) || 0);

  function writeLabels(id) {
    const layers = architectureData[id] || [];
    plates.forEach((p, i) => {
      const l = layers[i];
      p.layer.textContent = l ? l.layer : '';
      p.items.textContent = l ? l.items.join(', ') : '';
    });
    const idx = rowIds.indexOf(id);
    const data = projectsData[id];
    titleEl.textContent = data ? `${String(idx + 1).padStart(2, '0')} · ${data.title}` : '';
  }

  function setProject(id) {
    if (!id || id === st.activeId) return;
    st.activeId = id;
    const layers = architectureData[id] || [];
    const L = layers.length;
    for (let i = 0; i < SLOTS; i++) {
      const p = plates[i];
      if (i < L) { p.ty = ((L - 1) / 2 - i) * GAP; p.ts = 1; }
      else { p.ty = -((L - 1) / 2) * GAP - 0.25; p.ts = 0; }
    }
    rows.forEach((r) => {
      if (r.id === `project-${id}`) r.setAttribute('aria-current', 'true');
      else r.removeAttribute('aria-current');
    });
    clearTimeout(st.switchTimer);
    const ms = transitionMs();
    if (ms > 0) {
      labelsEl.classList.add('is-switching');
      st.switchTimer = window.setTimeout(() => {
        writeLabels(id);
        labelsEl.classList.remove('is-switching');
      }, ms);
    } else {
      writeLabels(id);
    }
    st.animating = true;
    sceneObj.dirty = true;
  }

  function resolveActive() {
    setProject(st.hoverId || st.scrollId || rowIds[0]);
  }

  /* Which row is nearest the middle of the viewport */
  let scrollRaf = 0;
  function measureScroll() {
    scrollRaf = 0;
    const mid = window.innerHeight * 0.5;
    let best = Infinity; let id = null;
    rows.forEach((r, i) => {
      const rect = r.getBoundingClientRect();
      const d = Math.abs(rect.top + rect.height / 2 - mid);
      if (d < best) { best = d; id = rowIds[i]; }
    });
    if (id && id !== st.scrollId) { st.scrollId = id; resolveActive(); }
  }
  function onScroll() {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(measureScroll);
  }

  /* Row hover and focus */
  const rowHandlers = rows.map((r, i) => {
    const enter = () => { st.hoverId = rowIds[i]; resolveActive(); };
    const leave = () => { if (st.hoverId === rowIds[i]) { st.hoverId = null; resolveActive(); } };
    r.addEventListener('pointerenter', enter);
    r.addEventListener('pointerleave', leave);
    r.addEventListener('focusin', enter);
    r.addEventListener('focusout', leave);
    return { enter, leave };
  });

  /* Plate hover and click */
  function setHot(i) {
    if (i === st.hot) return;
    st.hot = i;
    plates.forEach((p, k) => {
      p.outline.material = k === i ? outlineHotMat : outlineMat;
      p.label.classList.toggle('is-hot', k === i);
    });
    canvas.classList.toggle('is-hover', i >= 0);
    sceneObj.dirty = true;
  }

  const picker = createPicker(camera, plates.map((p) => p.mesh));
  const pointer = attachPointer(canvas, {
    onDown(e) { orbit.onDown(e); },
    onMove(e, ndc) {
      if (orbit.onMove(e)) {
        sceneObj.dirty = true;
      } else if (e.pointerType !== 'touch') {
        st.pointerNdc.copy(ndc);
        st.pointerDirty = true;
        sceneObj.dirty = true;
      }
    },
    onUp(e, ndc, s) {
      orbit.onUp(!reducedMotion);
      sceneObj.dirty = true;
      if (s.moved) return;
      group.updateMatrixWorld(true);
      const hit = picker.pick(ndc);
      if (hit && hit.object.scale.x > 0.5 && window.openProjectModal && st.activeId) {
        window.openProjectModal(st.activeId);
      }
    },
    onLeave() {
      st.pointerDirty = false;
      setHot(-1);
    }
  });

  /* Per-frame update */
  const anchor = new THREE.Vector3();
  const corner = new THREE.Vector3();
  const screenPt = { x: 0, y: 0, visible: false };
  function tick(dt) {
    if (orbit.tick(dt)) sceneObj.dirty = true;
    group.rotation.set(orbit.rotX, orbit.rotY, 0);

    if (st.animating) {
      let still = true;
      for (const p of plates) {
        if (reducedMotion) { p.y = p.ty; p.s = p.ts; }
        else {
          p.y = approach(p.y, p.ty, dt, 110);
          p.s = approach(p.s, p.ts, dt, 110);
          if (Math.abs(p.y - p.ty) > 0.002 || Math.abs(p.s - p.ts) > 0.002) still = false;
          else { p.y = p.ty; p.s = p.ts; }
        }
        p.mesh.position.y = p.y;
        p.mesh.scale.setScalar(Math.max(p.s, 1e-4));
        p.outline.position.y = p.y;
        p.outline.scale.setScalar(Math.max(p.s, 1e-4));
      }
      writeConnectors();
      sceneObj.dirty = true;
      if (still) st.animating = false;
    }

    if (st.pointerDirty && !orbit.dragging) {
      st.pointerDirty = false;
      group.updateMatrixWorld(true);
      const hit = picker.pick(st.pointerNdc);
      setHot(hit && hit.object.scale.x > 0.5 ? hit.object.userData.slot : -1);
    }

    if (sceneObj.dirty) {
      group.updateMatrixWorld(true);
      for (const p of plates) {
        if (p.s < 0.5) { p.label.classList.remove('is-visible'); continue; }
        /* Anchor on whichever right-hand corner is rightmost on screen, so the label clears the plate */
        let bestX = -Infinity;
        for (const cz of [D / 2, -D / 2]) {
          corner.set(W / 2 + 0.04, p.y, cz).applyMatrix4(group.matrixWorld);
          projectToScreen(corner, camera, st.width, st.height, screenPt);
          if (screenPt.x > bestX) { bestX = screenPt.x; anchor.copy(corner); }
        }
        placeLabel(p.label, anchor, camera, st.width, st.height, 'right', 16);
      }
    }
  }

  let ready = false;
  function render(dt) {
    renderer.render(scene, camera);
    governor.sample(dt);
    if (!ready) { ready = true; view.classList.add('is-ready'); }
  }

  /* Observers and listeners */
  const sizeWatcher = createResizeWatcher(stage, (w, h, changed) => {
    if (!changed) return;
    st.width = w; st.height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    outlineMat.resolution.set(w, h);
    outlineHotMat.resolution.set(w, h);
    sceneObj.dirty = true;
  });

  let scrollAttached = false;
  const visibility = observeVisibility(section, {
    onEnter: () => {
      ticker.add(sceneObj);
      if (!scrollAttached) { window.addEventListener('scroll', onScroll, { passive: true }); scrollAttached = true; }
      measureScroll();
    },
    onLeave: () => {
      ticker.remove(sceneObj);
      if (scrollAttached) { window.removeEventListener('scroll', onScroll); scrollAttached = false; }
    }
  });

  measureScroll();

  function destroy() {
    ticker.remove(sceneObj);
    visibility.disconnect();
    sizeWatcher.disconnect();
    pointer.destroy();
    if (scrollAttached) window.removeEventListener('scroll', onScroll);
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    clearTimeout(st.switchTimer);
    rows.forEach((r, i) => {
      r.removeEventListener('pointerenter', rowHandlers[i].enter);
      r.removeEventListener('pointerleave', rowHandlers[i].leave);
      r.removeEventListener('focusin', rowHandlers[i].enter);
      r.removeEventListener('focusout', rowHandlers[i].leave);
      r.removeAttribute('aria-current');
    });
    labelsEl.replaceChildren();
    labelsEl.classList.remove('is-switching');
    titleEl.textContent = '';
    canvas.classList.remove('is-hover');
    view.classList.remove('is-ready', 'is-dragging');
    plateGeom.dispose(); plateMat.dispose(); edgesSource.dispose(); outlineGeom.dispose();
    outlineMat.dispose(); outlineHotMat.dispose(); connGeom.dispose(); connMat.dispose();
    renderer.dispose();
  }

  onContextLost(renderer, () => {
    destroy();
    section.classList.remove('projects--view');
  });

  return {
    destroy,
    setReducedMotion(v) {
      reducedMotion = !!v;
      orbit.stop();
      st.animating = true;
      sceneObj.dirty = true;
    }
  };
}
