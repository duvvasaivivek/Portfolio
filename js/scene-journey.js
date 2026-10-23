/**
 * Journey stage: a sticky viewport in which the camera travels along a path past eight
 * milestone markers as the user scrolls. Hover highlights a marker; click opens the
 * existing milestone drawer; the HTML rail stays the accessible equivalent.
 */

import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { milestonesData, MILESTONE_COUNT } from './data.js';
import {
  createRenderer, ticker, observeVisibility, createDprGovernor, createResizeWatcher,
  attachPointer, createPicker, projectToScreen, isLowDetail, readToken, blendColor, onContextLost
} from './scene-utils.js';

const N = MILESTONE_COUNT;

export function createJourneyScene(section) {
  const track = section.querySelector('.journey-track');
  const stage = section.querySelector('.journey-stage');
  const canvas = section.querySelector('.journey-canvas');
  const buttons = Array.from(section.querySelectorAll('.journey-btn'));
  const list = section.querySelector('.journey-list');
  const card = {
    date: section.querySelector('#journeyActiveDate'),
    title: section.querySelector('#journeyActiveTitle'),
    org: section.querySelector('#journeyActiveOrg'),
    btn: section.querySelector('#journeyActiveBtn')
  };
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

  const baselinePts = baseline.getPoints(240);
  const baselineGeom = new LineGeometry();
  baselineGeom.setPositions(baselinePts.flatMap((p) => [p.x, p.y, p.z]));
  scene.add(new Line2(baselineGeom, lineMat));

  /* Markers */
  const MARKER_Y = 0.6;
  const tops = base.map((p) => p.clone().add(new THREE.Vector3(0, MARKER_Y, 0)));
  const stemPositions = [];
  base.forEach((p, i) => stemPositions.push(p.x, p.y, p.z, tops[i].x, tops[i].y, tops[i].z));
  const stemGeom = new LineSegmentsGeometry();
  stemGeom.setPositions(stemPositions);
  scene.add(new LineSegments2(stemGeom, lineMat));

  const markerGeom = new THREE.SphereGeometry(0.075, 20, 14);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const markers = new THREE.InstancedMesh(markerGeom, markerMat, N);
  const mat4 = new THREE.Matrix4();
  const lift = new Float32Array(N);
  const scale = new Float32Array(N).fill(1);
  function writeMarker(i) {
    mat4.makeScale(scale[i], scale[i], scale[i]).setPosition(tops[i].x, tops[i].y + lift[i], tops[i].z);
    markers.setMatrixAt(i, mat4);
  }
  for (let i = 0; i < N; i++) { writeMarker(i); markers.setColorAt(i, inkColor); }
  markers.instanceMatrix.needsUpdate = true;
  markers.instanceColor.needsUpdate = true;
  scene.add(markers);

  /* Year ticks and label anchors */
  const tick1 = base[0].clone().lerp(base[1], 0.5);
  const tick2 = base[N - 2].clone().lerp(base[N - 1], 0.5);
  const tickGeom = new LineSegmentsGeometry();
  tickGeom.setPositions([
    tick1.x, -0.14, tick1.z, tick1.x, 0.14, tick1.z,
    tick2.x, -0.14, tick2.z, tick2.x, 0.14, tick2.z
  ]);
  scene.add(new LineSegments2(tickGeom, lineMat));
  const yearAnchors = [
    base[0].clone().add(new THREE.Vector3(-1.0, 0.28, 0)),
    tick1.clone().add(new THREE.Vector3(0, 0.3, 0)),
    tick2.clone().add(new THREE.Vector3(0, 0.3, 0))
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
    const t = (window.scrollY - st.sectionTop) / st.travel;
    st.target = THREE.MathUtils.clamp(t, 0, 1);
    sceneObj.dirty = true;
  }

  function setActive(i) {
    if (i === st.active) return;
    st.active = i;
    const data = milestonesData[i + 1];
    if (data) {
      card.date.textContent = data.date;
      card.title.textContent = data.title;
      card.org.textContent = data.org;
      card.btn.setAttribute('data-milestone-id', String(i + 1));
    }
    buttons.forEach((b, idx) => {
      if (idx === i) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
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
      st.pointerDirty = true;
      sceneObj.dirty = true;
    },
    onUp(e, ndc, s) {
      if (s.moved) return;
      const hit = picker.pick(ndc);
      if (hit && hit.instanceId !== undefined && window.openMilestoneDrawer) {
        window.openMilestoneDrawer(hit.instanceId + 1);
      }
    },
    onLeave() {
      st.pointerDirty = false;
      setHover(-1);
    }
  });

  /* Keyboard: focusing a rail button travels to that marker; arrows move along the rail */
  function onFocusIn(e) {
    const btn = e.target.closest('.journey-btn');
    if (!btn || !btn.matches(':focus-visible')) return; // keyboard focus only; clicks open the drawer directly
    const i = buttons.indexOf(btn);
    if (i < 0 || i === st.active) return;
    window.scrollTo({ top: st.sectionTop + (i / (N - 1)) * st.travel, behavior: 'smooth' });
  }
  function onKeyDown(e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = buttons.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next = e.key === 'ArrowRight' ? Math.min(N - 1, i + 1) : Math.max(0, i - 1);
    buttons[next].focus();
  }
  list.addEventListener('focusin', onFocusIn);
  list.addEventListener('keydown', onKeyDown);

  /* Per-frame update */
  function tick(dt) {
    const diff = st.target - st.progress;
    if (Math.abs(diff) > 0.0005) {
      st.progress += diff * (1 - Math.exp(-dt / 90));
      sceneObj.dirty = true;
    } else if (st.progress !== st.target) {
      st.progress = st.target;
      sceneObj.dirty = true;
    }

    cameraPath.getPointAt(st.progress, camPos);
    lookPath.getPointAt(Math.min(1, st.progress + 0.05), lookPos);
    camera.position.copy(camPos);
    camera.lookAt(lookPos);

    setActive(Math.round(st.progress * (N - 1)));

    if (st.pointerDirty) {
      st.pointerDirty = false;
      camera.updateMatrixWorld();
      const hit = picker.pick(st.pointerNdc);
      setHover(hit && hit.instanceId !== undefined ? hit.instanceId : -1);
    }

    if (st.animating) {
      let still = true;
      const k = 1 - Math.exp(-dt / 120);
      for (let i = 0; i < N; i++) {
        const tl = i === st.active ? 0.22 : 0;
        const ts = i === st.active ? 1.45 : (i === st.hover ? 1.25 : 1);
        const dl = tl - lift[i];
        const ds = ts - scale[i];
        if (Math.abs(dl) > 0.001 || Math.abs(ds) > 0.001) {
          lift[i] += dl * k;
          scale[i] += ds * k;
          still = false;
        } else {
          lift[i] = tl; scale[i] = ts;
        }
        writeMarker(i);
        markers.setColorAt(i, i === st.active ? accentColor : inkColor);
      }
      markers.instanceMatrix.needsUpdate = true;
      markers.instanceColor.needsUpdate = true;
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

  function destroy() {
    ticker.remove(sceneObj);
    visibility.disconnect();
    stageWatcher.disconnect();
    bodyWatcher.disconnect();
    pointer.destroy();
    list.removeEventListener('focusin', onFocusIn);
    list.removeEventListener('keydown', onKeyDown);
    if (scrollAttached) window.removeEventListener('scroll', onScroll);
    buttons.forEach((b) => b.removeAttribute('aria-current'));
    yearEls.forEach((el) => el.classList.remove('is-visible'));
    canvas.classList.remove('is-hover');
    baselineGeom.dispose(); stemGeom.dispose(); tickGeom.dispose(); gridGeom.dispose();
    markerGeom.dispose(); markerMat.dispose(); lineMat.dispose(); gridMat.dispose();
    renderer.dispose();
  }

  onContextLost(renderer, () => {
    destroy();
    section.classList.remove('journey--stage');
  });

  return { destroy };
}
