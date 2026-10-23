/**
 * Ambient background: a faint drafting grid on a tilted sheet behind the page, with a few
 * depth dots. The camera leans a few degrees toward the pointer and the sheet drifts with the
 * scroll. It renders only when the pointer or the scroll position changed, and it is muted
 * while the journey stage (which has its own grid) is on screen.
 */

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import {
  createRenderer, ticker, createDprGovernor, readToken, blendColor, onContextLost, seededRandom, approach
} from './scene-utils.js';

const EXTENT = 24;
const DOTS = 16;
const DOT_WRAP = 10;
const LEAN = 0.08;
const DIST = 10;
const FOV = 45;

export function createAmbientScene(canvas) {
  const paperHex = readToken('--paper', '#F6F1E8');
  const inkHex = new THREE.Color(readToken('--lattice-node', '#17150F')).getHex();
  const gridColor = blendColor(paperHex, inkHex, 0.07);
  const dotColor = blendColor(paperHex, inkHex, 0.18);

  const renderer = createRenderer(canvas, { antialias: true, maxDpr: 1.5 });
  const governor = createDprGovernor(renderer, { steps: [1.5, 1] });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, DIST);
  camera.lookAt(0, 0, 0);

  /* Sheet */
  const sheet = new THREE.Group();
  sheet.rotation.x = -0.21;
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

  /* Depth dots */
  const rand = seededRandom(11);
  const dotGeom = new THREE.IcosahedronGeometry(0.022, 1);
  const dotMat = new THREE.MeshBasicMaterial({ color: dotColor });
  const dots = new THREE.InstancedMesh(dotGeom, dotMat, DOTS);
  const dotBase = [];
  for (let i = 0; i < DOTS; i++) {
    dotBase.push(new THREE.Vector3((rand() - 0.5) * 12, (rand() - 0.5) * DOT_WRAP, (rand() - 0.5) * 3));
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

  /* State */
  const st = {
    yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0,
    scroll: window.scrollY, appliedScroll: -1,
    unitsPerPx: 0.01,
    muted: false,
    visible: true
  };
  const sceneObj = { dirty: true, tick, render };

  function onPointerMove(e) {
    const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
    st.targetYaw = nx * LEAN;
    st.targetPitch = -ny * LEAN;
    sceneObj.dirty = true;
  }
  function onScroll() {
    st.scroll = window.scrollY;
    sceneObj.dirty = true;
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  function tick(dt) {
    const y = approach(st.yaw, st.targetYaw, dt, 160);
    const p = approach(st.pitch, st.targetPitch, dt, 160);
    if (Math.abs(y - st.yaw) > 1e-5 || Math.abs(p - st.pitch) > 1e-5) {
      st.yaw = y; st.pitch = p;
      sceneObj.dirty = true;
    }
    if (!sceneObj.dirty) return;
    camera.position.set(Math.sin(st.yaw) * DIST, Math.sin(st.pitch) * DIST, Math.cos(st.yaw) * Math.cos(st.pitch) * DIST);
    camera.lookAt(0, 0, 0);
    if (st.scroll !== st.appliedScroll) {
      st.appliedScroll = st.scroll;
      const drift = st.scroll * 0.1 * st.unitsPerPx;
      grid.position.y = drift % 1;
      writeDots(drift);
    }
  }

  let ready = false;
  function render(dt) {
    renderer.render(scene, camera);
    governor.sample(dt);
    if (!ready) { ready = true; canvas.classList.add('is-ready'); }
  }

  /* Sizing: the canvas fills the viewport */
  function resize() {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    gridMat.resolution.set(w, h);
    st.unitsPerPx = (2 * DIST * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / h;
    st.appliedScroll = -1;
    sceneObj.dirty = true;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  /* Mute while the journey stage is on screen */
  function syncRunning() {
    if (st.muted) ticker.remove(sceneObj);
    else ticker.add(sceneObj);
    canvas.classList.toggle('is-muted', st.muted);
  }
  const journey = document.getElementById('experience');
  let journeyObserver = null;
  if (journey) {
    journeyObserver = new IntersectionObserver((entries) => {
      const on = entries.some((e) => e.isIntersecting);
      if (on !== st.muted) { st.muted = on; syncRunning(); }
    }, { threshold: 0 });
    journeyObserver.observe(journey);
  }
  syncRunning();

  function destroy() {
    ticker.remove(sceneObj);
    if (journeyObserver) journeyObserver.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', resize);
    canvas.classList.remove('is-ready', 'is-muted');
    gridGeom.dispose(); gridMat.dispose(); dotGeom.dispose(); dotMat.dispose();
    renderer.dispose();
  }

  onContextLost(renderer, () => {
    destroy();
    document.documentElement.classList.remove('ambient');
  });

  return { destroy };
}
