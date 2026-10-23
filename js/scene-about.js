/**
 * About globe: a hairline globe with coastlines and markers for the venues of the hackathons
 * and the institute. Opens centred on India, drag to rotate, drifts home after a pause, hover
 * a marker for its label, select to pin it.
 */

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { placesData } from './data.js';
import { COASTLINES } from './geo-coastlines.js';
import {
  createRenderer, ticker, observeVisibility, createDprGovernor, createResizeWatcher,
  attachPointer, createPicker, placeLabel, isLowDetail, readToken, blendColor, onContextLost,
  createOrbit, approach
} from './scene-utils.js';

const R = 1;
const HOME = { lat: 18, lon: 78 };
const IDLE_MS = 4000;

function toVec(lat, lon, r, out) {
  const phi = THREE.MathUtils.degToRad(lat);
  const lambda = THREE.MathUtils.degToRad(lon);
  return out.set(Math.cos(phi) * Math.sin(lambda) * r, Math.sin(phi) * r, Math.cos(phi) * Math.cos(lambda) * r);
}

export function createAboutScene(section, opts = {}) {
  const fig = section.querySelector('.globe');
  const stage = fig.querySelector('.globe-stage');
  const canvas = fig.querySelector('.globe-canvas');
  const label = fig.querySelector('.globe-label');
  const labelName = label.querySelector('.view-label-name');
  const labelNote = label.querySelector('.view-label-note');

  const low = isLowDetail();
  let reducedMotion = !!opts.reducedMotion;

  /* Colors */
  const paperHex = readToken('--paper', '#F6F1E8');
  const inkColor = new THREE.Color(readToken('--lattice-node', '#17150F'));
  const accentColor = new THREE.Color(readToken('--lattice-node-active', '#6B1F2B'));
  const raised = new THREE.Color(readToken('--paper-raised', '#FCFAF5'));
  const gridColor = blendColor(paperHex, inkColor.getHex(), 0.13);
  const coastColor = blendColor(paperHex, inkColor.getHex(), 0.55);

  /* Renderer, scene, camera */
  const renderer = createRenderer(canvas, { antialias: !low, maxDpr: low ? 1.5 : 2 });
  const governor = createDprGovernor(renderer);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 4.1);
  camera.lookAt(0, 0, 0);
  const globe = new THREE.Group();
  scene.add(globe);

  /* Opaque sphere just under the lines so the far side is hidden */
  const sphereGeom = new THREE.SphereGeometry(R * 0.985, 48, 32);
  const sphereMat = new THREE.MeshBasicMaterial({ color: raised });
  globe.add(new THREE.Mesh(sphereGeom, sphereMat));

  /* Graticule every 15 degrees */
  const v = new THREE.Vector3();
  const gridPositions = [];
  const STEPS = 48;
  for (let lon = -180; lon < 180; lon += 15) {
    for (let k = 0; k < STEPS; k++) {
      const a = -90 + (180 * k) / STEPS;
      const b = -90 + (180 * (k + 1)) / STEPS;
      toVec(a, lon, R, v); gridPositions.push(v.x, v.y, v.z);
      toVec(b, lon, R, v); gridPositions.push(v.x, v.y, v.z);
    }
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    for (let k = 0; k < STEPS * 2; k++) {
      const a = -180 + (360 * k) / (STEPS * 2);
      const b = -180 + (360 * (k + 1)) / (STEPS * 2);
      toVec(lat, a, R, v); gridPositions.push(v.x, v.y, v.z);
      toVec(lat, b, R, v); gridPositions.push(v.x, v.y, v.z);
    }
  }
  const gridGeom = new LineSegmentsGeometry();
  gridGeom.setPositions(gridPositions);
  const gridMat = new LineMaterial({ color: gridColor.getHex(), linewidth: 1, worldUnits: false });
  globe.add(new LineSegments2(gridGeom, gridMat));

  /* Coastlines */
  const coastPositions = [];
  for (const line of COASTLINES) {
    for (let i = 0; i + 3 < line.length; i += 2) {
      toVec(line[i + 1] / 10, line[i] / 10, R * 1.002, v); coastPositions.push(v.x, v.y, v.z);
      toVec(line[i + 3] / 10, line[i + 2] / 10, R * 1.002, v); coastPositions.push(v.x, v.y, v.z);
    }
  }
  const coastGeom = new LineSegmentsGeometry();
  coastGeom.setPositions(coastPositions);
  const coastMat = new LineMaterial({ color: coastColor.getHex(), linewidth: 1.2, worldUnits: false });
  globe.add(new LineSegments2(coastGeom, coastMat));

  /* Markers: stem plus bead */
  const places = placesData;
  const M = places.length;
  const tops = places.map((p) => toVec(p.lat, p.lon, R * 1.09, new THREE.Vector3()));
  const stemPositions = [];
  places.forEach((p, i) => {
    toVec(p.lat, p.lon, R, v);
    stemPositions.push(v.x, v.y, v.z, tops[i].x, tops[i].y, tops[i].z);
  });
  const stemGeom = new LineSegmentsGeometry();
  stemGeom.setPositions(stemPositions);
  const stemMat = new LineMaterial({ color: inkColor.getHex(), linewidth: 1.2, worldUnits: false });
  globe.add(new LineSegments2(stemGeom, stemMat));

  const beadGeom = new THREE.SphereGeometry(0.032, 14, 10);
  const beadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const beads = new THREE.InstancedMesh(beadGeom, beadMat, M);
  const mat4 = new THREE.Matrix4();
  function writeBead(i, s, c) {
    mat4.makeScale(s, s, s).setPosition(tops[i]);
    beads.setMatrixAt(i, mat4);
    beads.setColorAt(i, c);
  }
  for (let i = 0; i < M; i++) writeBead(i, 1, inkColor);
  beads.instanceMatrix.needsUpdate = true;
  beads.instanceColor.needsUpdate = true;
  globe.add(beads);

  /* State */
  const homeX = THREE.MathUtils.degToRad(HOME.lat);
  const homeY = -THREE.MathUtils.degToRad(HOME.lon);
  const orbit = createOrbit(fig, { rotX: homeX, rotY: homeY, pitchClamp: 1.3 });
  const st = {
    hover: -1,
    pinned: -1,
    shown: -1,
    lastInteract: 0,
    pointerNdc: new THREE.Vector2(),
    pointerDirty: false,
    width: 1, height: 1
  };
  const sceneObj = { dirty: true, tick, render };

  function show(i) {
    if (i === st.shown) return;
    st.shown = i;
    for (let k = 0; k < M; k++) writeBead(k, k === i ? 1.6 : 1, k === i ? accentColor : inkColor);
    beads.instanceMatrix.needsUpdate = true;
    beads.instanceColor.needsUpdate = true;
    if (i >= 0) {
      labelName.textContent = places[i].name;
      labelNote.textContent = places[i].note;
      label.hidden = false;
    } else {
      label.hidden = true;
    }
    canvas.classList.toggle('is-hover', st.hover >= 0);
    sceneObj.dirty = true;
  }

  const resolve = () => show(st.pinned >= 0 ? st.pinned : st.hover);

  /* Pointer */
  const picker = createPicker(camera, [beads]);
  const pointer = attachPointer(canvas, {
    onDown(e) {
      orbit.onDown(e);
      st.lastInteract = performance.now();
    },
    onMove(e, ndc) {
      st.lastInteract = performance.now();
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
      st.lastInteract = performance.now();
      sceneObj.dirty = true;
      if (s.moved) return;
      globe.updateMatrixWorld(true);
      const hit = picker.pick(ndc);
      const i = hit && hit.instanceId !== undefined ? hit.instanceId : -1;
      st.pinned = i >= 0 && i !== st.pinned ? i : -1;
      label.classList.toggle('is-pinned', st.pinned >= 0);
      resolve();
    },
    onLeave() {
      st.pointerDirty = false;
      st.hover = -1;
      canvas.classList.remove('is-hover');
      resolve();
    }
  });

  /* Per-frame update */
  const worldPos = new THREE.Vector3();
  function tick(dt, now) {
    if (orbit.tick(dt)) {
      sceneObj.dirty = true;
    } else if (!orbit.dragging && !reducedMotion && st.pinned < 0 && st.hover < 0 && now - st.lastInteract > IDLE_MS) {
      const nx = approach(orbit.rotX, homeX, dt, 700);
      const ny = approach(orbit.rotY, homeY, dt, 700);
      if (Math.abs(nx - orbit.rotX) > 1e-5 || Math.abs(ny - orbit.rotY) > 1e-5) {
        orbit.rotX = nx; orbit.rotY = ny;
        sceneObj.dirty = true;
      }
    }
    globe.rotation.set(orbit.rotX, orbit.rotY, 0);

    if (st.pointerDirty && !orbit.dragging) {
      st.pointerDirty = false;
      globe.updateMatrixWorld(true);
      const hit = picker.pick(st.pointerNdc);
      const i = hit && hit.instanceId !== undefined ? hit.instanceId : -1;
      if (i !== st.hover) { st.hover = i; canvas.classList.toggle('is-hover', i >= 0); resolve(); }
    }

    if (st.shown >= 0 && sceneObj.dirty) {
      globe.updateMatrixWorld(true);
      worldPos.copy(tops[st.shown]).applyMatrix4(globe.matrixWorld);
      placeLabel(label, worldPos, camera, st.width, st.height, 'tip');
    }
  }

  let ready = false;
  function render(dt) {
    renderer.render(scene, camera);
    governor.sample(dt);
    if (!ready) { ready = true; fig.classList.add('is-ready'); }
  }

  /* Observers */
  const sizeWatcher = createResizeWatcher(stage, (w, h, changed) => {
    if (!changed) return;
    st.width = w; st.height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    gridMat.resolution.set(w, h);
    coastMat.resolution.set(w, h);
    stemMat.resolution.set(w, h);
    sceneObj.dirty = true;
  });

  const visibility = observeVisibility(fig, {
    onEnter: () => ticker.add(sceneObj),
    onLeave: () => ticker.remove(sceneObj)
  });

  function destroy() {
    ticker.remove(sceneObj);
    visibility.disconnect();
    sizeWatcher.disconnect();
    pointer.destroy();
    label.hidden = true;
    label.classList.remove('is-pinned');
    canvas.classList.remove('is-hover');
    fig.classList.remove('is-ready', 'is-dragging');
    sphereGeom.dispose(); sphereMat.dispose(); gridGeom.dispose(); gridMat.dispose();
    coastGeom.dispose(); coastMat.dispose(); stemGeom.dispose(); stemMat.dispose();
    beadGeom.dispose(); beadMat.dispose();
    renderer.dispose();
  }

  onContextLost(renderer, () => {
    destroy();
    section.classList.remove('about--view');
  });

  return {
    destroy,
    setReducedMotion(v) {
      reducedMotion = !!v;
      orbit.stop();
      sceneObj.dirty = true;
    }
  };
}
