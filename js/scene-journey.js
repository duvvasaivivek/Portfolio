/**
 * Journey stage: a sticky viewport in which the camera travels along a path past eight
 * milestone markers as the user scrolls. Controls and marker picks share selection;
 * the HTML rail and detail drawer stay usable without WebGL.
 */

import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { milestonesData, journeyOrder } from './data.js';
import { journeyState, routePosition } from './journey-state.js';
import {
  createRenderer, ticker, observeVisibility, createDprGovernor, createResizeWatcher,
  attachPointer, createPicker, projectToScreen, isLowDetail, readToken, blendColor, onContextLost
} from './scene-utils.js';

const N = journeyOrder.length;

export function createJourneyScene(section, {reducedMotion = false} = {}) {
  const track = section.querySelector('.journey-track');
  const stage = section.querySelector('.journey-stage');
  const canvas = section.querySelector('.journey-canvas');
  let state = journeyState.snapshot();
  section.classList.toggle('journey--still', reducedMotion);
  const yearEls = Array.from(section.querySelectorAll('.journey-years span'));

  const low = isLowDetail();

  /* Colors */
  const paperHex = readToken('--paper', '#F6F1E8');
  const inkColor = new THREE.Color(readToken('--lattice-node', '#17150F'));
  const accentColor = new THREE.Color(readToken('--lattice-node-active', '#6B1F2B'));
  const lineColor = blendColor(paperHex, inkColor.getHex(), 0.45);

  /* Renderer */
  const renderer = createRenderer(canvas, { antialias: !low, maxDpr: low ? 1.5 : 2 });
  const governor = createDprGovernor(renderer);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 100);

  /* Path */
  const base = [];
  for (let i = 0; i < N; i++) base.push(new THREE.Vector3(-7 + i * 2, 0, Math.sin(i * 1.3) * 1.5));
  const pre = base[0].clone().multiplyScalar(2).sub(base[1]);
  const post = base[N - 1].clone().multiplyScalar(2).sub(base[N - 2]);
  const baseline = new THREE.CatmullRomCurve3([pre, ...base, post], false, 'centripetal');
  const CAMERA_OFFSET = new THREE.Vector3(-1.4, 2.6, 6.8);
  const LOOK_OFFSET = new THREE.Vector3(0.9, 0.15, 0);
  const cameraPath = new THREE.CatmullRomCurve3(base.map((p) => p.clone().add(CAMERA_OFFSET)), false, 'centripetal');
  const lookPath = new THREE.CatmullRomCurve3(base.map((p) => p.clone().add(LOOK_OFFSET)), false, 'centripetal');

  const lineMat = new LineMaterial({ color: lineColor.getHex(), linewidth: 1.4, worldUnits: false });
  const gridColor = blendColor(paperHex, inkColor.getHex(), 0.11);
  const gridMat = new LineMaterial({ color: gridColor.getHex(), linewidth: 1, worldUnits: false });

  /* Ground grid: graph-paper reference plane that gives the path depth */
  const gridPositions = [];
  for (let x = -12; x <= 12; x += 1) gridPositions.push(x, -0.02, -5, x, -0.02, 5);
  for (let z = -5; z <= 5; z += 1) gridPositions.push(-12, -0.02, z, 12, -0.02, z);
  const gridGeom = new LineSegmentsGeometry();
  gridGeom.setPositions(gridPositions);
  scene.add(new LineSegments2(gridGeom, gridMat));

  const baselineGeom = new LineGeometry();
  baselineGeom.setPositions(baseline.getPoints(240).flatMap(p => [p.x, p.y, p.z]));
  scene.add(new Line2(baselineGeom, lineMat));

  /* Markers */
  const MARKER_Y = 0.6;
  const tops = base.map((p) => p.clone().add(new THREE.Vector3(0, MARKER_Y, 0)));
  const stemGeom = new LineSegmentsGeometry();
  function updateStems() {
    const positions = state.ids.flatMap(id => {
      const i = journeyOrder.indexOf(id), p = base[i], top = tops[i];
      return [p.x,p.y,p.z,top.x,top.y,top.z];
    });
    stemGeom.setPositions(positions);
  }
  updateStems();
  scene.add(new LineSegments2(stemGeom, lineMat));

  // Original board-pin proportions: a small matte head on a fine upright stem.
  const markerGeom = new THREE.SphereGeometry(0.075, 20, 14);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const markers = new THREE.InstancedMesh(markerGeom, markerMat, N);
  const mat4 = new THREE.Matrix4();
  const scale = new Float32Array(N).fill(1);
  function writeMarker(i) {
    mat4.makeScale(scale[i], scale[i], scale[i]).setPosition(tops[i].x, tops[i].y, tops[i].z);
    markers.setMatrixAt(i, mat4);
  }
  for (let i = 0; i < N; i++) { writeMarker(i); markers.setColorAt(i, inkColor); }
  markers.instanceMatrix.needsUpdate = true;
  markers.instanceColor.needsUpdate = true;
  scene.add(markers);

  /* Year ticks and label anchors */
  const yearStarts = journeyOrder.map((id, i) => i === 0 || milestonesData[id].year !== milestonesData[journeyOrder[i - 1]].year ? i : -1).filter(i => i >= 0);
  const ticks = yearStarts.slice(1).map(i => base[i - 1].clone().lerp(base[i], 0.5));
  const tickGeom = new LineSegmentsGeometry();
  tickGeom.setPositions(ticks.flatMap(t => [t.x, -0.14, t.z, t.x, 0.14, t.z]));
  scene.add(new LineSegments2(tickGeom, lineMat));
  const yearAnchors = [
    base[0].clone().add(new THREE.Vector3(-1.0, 0.28, 0)),
    ...ticks.map(t => t.clone().add(new THREE.Vector3(0, 0.3, 0)))
  ];

  /* State */
  const st = {
    progress: 0, target: 0,
    active: -1, hover: -1,
    sectionTop: 0, travel: 1,
    width: 1, height: 1,
    pointerNdc: new THREE.Vector2(),
    pointerDirty: false,
    animating: true
  };
  let navigationTarget = null;
  const parallax = new THREE.Vector2(), parallaxTarget = new THREE.Vector2();
  let emphasis = 0;
  const sceneObj = { dirty: true, tick, render };
  const camPos = new THREE.Vector3();
  const lookPos = new THREE.Vector3();
  const screen = { x: 0, y: 0, visible: false };

  /* Layout */
  function readLayout() {
    const rect = track.getBoundingClientRect();
    st.sectionTop = rect.top + window.scrollY;
    st.travel = Math.max(1, track.offsetHeight - stage.offsetHeight);
    updateTarget();
  }

  function updateTarget() {
    if (reducedMotion) {
      st.target = state.index / Math.max(1, state.ids.length - 1);
      sceneObj.dirty = true;
      return;
    }
    const t = (window.scrollY - st.sectionTop) / st.travel;
    st.target = THREE.MathUtils.clamp(t, 0, 1);
    if (navigationTarget !== null && Math.abs(st.target - navigationTarget) < 0.001) navigationTarget = null;
    sceneObj.dirty = true;
  }

  function setActive(i) {
    if (i === st.active) return;
    st.active = i;
    st.animating = true;
  }

  function setHover(i) {
    if (i === st.hover) return;
    st.hover = i;
    canvas.classList.toggle('is-hover', i >= 0);
    st.animating = true;
    sceneObj.dirty = true;
  }

  /* Pointer */
  const picker = createPicker(camera, [markers]);
  const pointer = attachPointer(canvas, {
    onMove(e, ndc) {
      if (e.pointerType === 'touch') return;
      st.pointerNdc.copy(ndc);
      if (!reducedMotion) parallaxTarget.set(ndc.x * 0.16, ndc.y * 0.09);
      st.pointerDirty = true;
      sceneObj.dirty = true;
    },
    onUp(e, ndc, s) {
      if (s.moved) return;
      const hit = picker.pick(ndc);
      if (hit && hit.instanceId !== undefined) journeyState.select(journeyOrder[hit.instanceId]);
    },
    onLeave() {
      st.pointerDirty = false;
      parallaxTarget.set(0, 0);
      setHover(-1);
    }
  });

  function syncState(next, source) {
    const filterChanged = state.filter !== next.filter;
    state = next;
    setActive(journeyOrder.indexOf(state.activeId));
    st.animating = true;
    sceneObj.dirty = true;
    if (filterChanged) {
      setHover(-1);
      updateStems();
    }
    if (source === 'scroll') return;
    readLayout();
    if (reducedMotion) return;
    navigationTarget = state.index / Math.max(1, state.ids.length - 1);
    window.scrollTo({top:st.sectionTop + navigationTarget * st.travel, behavior:'smooth'});
  }
  const unsubscribe = journeyState.subscribe(syncState);
  function cancelTravel(event) {
    if (event.type === 'keydown' && (!['PageUp','PageDown','ArrowUp','ArrowDown','Home','End',' '].includes(event.key) || event.target.closest('button,select,input,textarea'))) return;
    navigationTarget = null;
  }
  window.addEventListener('wheel', cancelTravel, {passive:true});
  window.addEventListener('touchstart', cancelTravel, {passive:true});
  window.addEventListener('keydown', cancelTravel);

  /* Per-frame update */
  function tick(dt) {
    const target = navigationTarget ?? st.target;
    const diff = target - st.progress;
    if (Math.abs(diff) > 0.0005) {
      st.progress += diff * (reducedMotion ? 1 : 1 - Math.exp(-dt / 160));
      sceneObj.dirty = true;
    } else if (st.progress !== target) {
      st.progress = target;
      sceneObj.dirty = true;
    }

    const pathProgress = routePosition(st.progress, state.ids);
    cameraPath.getPoint(pathProgress, camPos);
    lookPath.getPoint(pathProgress, lookPos);
    const kCamera = reducedMotion ? 1 : 1 - Math.exp(-dt / 220);
    const targetEmphasis = state.activeId === 8 ? 0.7 : 0;
    if (parallax.distanceTo(parallaxTarget) > 0.0001 || Math.abs(emphasis - targetEmphasis) > 0.0001) sceneObj.dirty = true;
    parallax.lerp(parallaxTarget, kCamera);
    emphasis += (targetEmphasis - emphasis) * kCamera;
    camPos.x += parallax.x; camPos.y += parallax.y; camPos.z -= emphasis;
    camera.position.copy(camPos);
    camera.lookAt(lookPos);

    // Keep the requested title stable while scrolling to a stop.
    if (!reducedMotion && navigationTarget === null && Math.abs(st.progress - st.target) < 0.012) {
      journeyState.select(state.ids[Math.round(st.progress * (state.ids.length - 1))], 'scroll');
    }
    setActive(journeyOrder.indexOf(state.activeId));

    if (st.pointerDirty) {
      st.pointerDirty = false;
      camera.updateMatrixWorld();
      const hit = picker.pick(st.pointerNdc);
      setHover(hit && hit.instanceId !== undefined ? hit.instanceId : -1);
    }

    if (st.animating) {
      let still = true;
      const k = reducedMotion ? 1 : 1 - Math.exp(-dt / 120);
      for (let i = 0; i < N; i++) {
        const ts = !state.ids.includes(journeyOrder[i]) ? 0 : i === st.active ? 1.45 : (i === st.hover ? 1.25 : 1);
        const ds = ts - scale[i];
        if (Math.abs(ds) > 0.001) {
          scale[i] += ds * k;
          still = false;
        } else {
          scale[i] = ts;
        }
        writeMarker(i);
        markers.setColorAt(i, i === st.active ? accentColor : inkColor);
      }
      markers.instanceMatrix.needsUpdate = true;
      markers.instanceColor.needsUpdate = true;
      markers.computeBoundingSphere();
      sceneObj.dirty = true;
      if (still) st.animating = false;
    }

    if (sceneObj.dirty) {
      camera.updateMatrixWorld();
      yearAnchors.forEach((a, i) => {
        projectToScreen(a, camera, st.width, st.height, screen);
        const el = yearEls[i];
        if (!el) return;
        el.classList.toggle('is-visible', screen.visible);
        if (screen.visible) el.style.transform = `translate(${Math.round(screen.x)}px, ${Math.round(screen.y)}px) translate(-50%, -100%)`;
      });
    }
  }

  function render(dt) {
    renderer.render(scene, camera);
    governor.sample(dt);
  }

  /* Observers and listeners */
  const stageWatcher = createResizeWatcher(stage, (w, h, changed) => {
    if (!changed) return;
    st.width = w; st.height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    lineMat.resolution.set(w, h);
    gridMat.resolution.set(w, h);
    readLayout();
  });
  const bodyWatcher = createResizeWatcher(document.body, () => readLayout());

  const onScroll = () => updateTarget();
  let scrollAttached = false;
  const visibility = observeVisibility(track, {
    onEnter: () => {
      readLayout();
      ticker.add(sceneObj);
      if (!scrollAttached) { window.addEventListener('scroll', onScroll, { passive: true }); scrollAttached = true; }
    },
    onLeave: () => {
      ticker.remove(sceneObj);
      if (scrollAttached) { window.removeEventListener('scroll', onScroll); scrollAttached = false; }
    }
  });

  let destroyed = false;
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    ticker.remove(sceneObj);
    visibility.disconnect();
    stageWatcher.disconnect();
    bodyWatcher.disconnect();
    pointer.destroy();
    unsubscribe();
    window.removeEventListener('wheel', cancelTravel);
    window.removeEventListener('touchstart', cancelTravel);
    window.removeEventListener('keydown', cancelTravel);
    if (scrollAttached) window.removeEventListener('scroll', onScroll);
    yearEls.forEach((el) => el.classList.remove('is-visible'));
    canvas.classList.remove('is-hover');
    baselineGeom.dispose(); stemGeom.dispose(); tickGeom.dispose(); gridGeom.dispose();
    markerGeom.dispose(); markerMat.dispose(); lineMat.dispose(); gridMat.dispose();
    section.classList.remove('journey--still');
    renderer.dispose();
  }

  onContextLost(renderer, () => {
    destroy();
    section.classList.remove('journey--stage');
  });

  return { destroy };
}
