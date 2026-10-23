/**
 * Skills graph: skills on one bowed column, the eight projects on the facing column, and an
 * edge wherever a skill was used in a project. Every node carries an HTML label, so the view
 * reads as a diagram. Hovering a term in the matrix or a node in the graph highlights both;
 * selecting a skill pins it; selecting a project opens its dialog. Drag to turn.
 */

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { skillsData, projectsData, projectOrder } from './data.js';
import {
  createRenderer, ticker, observeVisibility, createDprGovernor, createResizeWatcher,
  attachPointer, createPicker, placeLabel, isLowDetail, readToken, blendColor, onContextLost,
  createOrbit
} from './scene-utils.js';

export function createSkillsScene(section, opts = {}) {
  const view = section.querySelector('.skills-view');
  const stage = view.querySelector('.skills-stage');
  const canvas = view.querySelector('.skills-canvas');
  const labelsEl = view.querySelector('.skills-labels');
  const terms = Array.from(section.querySelectorAll('.term[data-skill]'));

  const low = isLowDetail();
  let reducedMotion = !!opts.reducedMotion;

  /* Colors */
  const paperHex = readToken('--paper', '#F6F1E8');
  const inkColor = new THREE.Color(readToken('--lattice-node', '#17150F'));
  const accentColor = new THREE.Color(readToken('--lattice-node-active', '#6B1F2B'));
  const linkedColor = inkColor.clone().lerp(accentColor, 0.7);
  const dimNode = blendColor(paperHex, inkColor.getHex(), 0.35);
  const edgeBase = blendColor(paperHex, inkColor.getHex(), 0.3);
  const edgeDim = blendColor(paperHex, inkColor.getHex(), 0.1);

  /* Renderer, scene, camera */
  const renderer = createRenderer(canvas, { antialias: !low, maxDpr: low ? 1.5 : 2 });
  const governor = createDprGovernor(renderer);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 0, 8.4);
  camera.lookAt(0, 0, 0);
  const group = new THREE.Group();
  scene.add(group);

  /* Nodes: skills (grouped, with a gap between groups) and projects */
  const skills = [];
  skillsData.groups.forEach((g, gi) => g.items.forEach((item) => skills.push({ id: item.id, label: item.label, gi, projects: item.projects })));
  const projects = projectOrder.filter((id) => projectsData[id]).map((id) => ({ id, label: projectsData[id].title }));
  const S = skills.length;
  const P = projects.length;
  const N = S + P;
  const positions = [];
  const slots = S + skillsData.groups.length - 1;
  let slot = 0;
  skills.forEach((s, i) => {
    if (i > 0 && skills[i - 1].gi !== s.gi) slot++;
    const t = slot / Math.max(1, slots - 1);
    positions.push(new THREE.Vector3(-0.35, 2.3 - 4.6 * t, 0.6 * Math.sin(Math.PI * t)));
    slot++;
  });
  projects.forEach((p, j) => {
    const t = (j + 0.5) / P;
    positions.push(new THREE.Vector3(1.15, 1.9 - 3.8 * t, -0.6 * Math.sin(Math.PI * t)));
  });
  const skillIndex = new Map(skills.map((s, i) => [s.id, i]));
  const projectIndex = new Map(projects.map((p, j) => [p.id, S + j]));

  /* Edges */
  const edgeList = [];
  skills.forEach((s, i) => s.projects.forEach((pid) => {
    const j = projectIndex.get(pid);
    if (j !== undefined) edgeList.push([i, j]);
  }));
  const edgePositions = new Float32Array(edgeList.length * 6);
  const edgeColors = new Float32Array(edgeList.length * 6);
  edgeList.forEach(([a, b], e) => {
    const o = e * 6;
    edgePositions[o] = positions[a].x; edgePositions[o + 1] = positions[a].y; edgePositions[o + 2] = positions[a].z;
    edgePositions[o + 3] = positions[b].x; edgePositions[o + 4] = positions[b].y; edgePositions[o + 5] = positions[b].z;
    for (let v = 0; v < 2; v++) {
      edgeColors[o + v * 3] = edgeBase.r; edgeColors[o + v * 3 + 1] = edgeBase.g; edgeColors[o + v * 3 + 2] = edgeBase.b;
    }
  });
  const edgeGeom = new LineSegmentsGeometry();
  edgeGeom.setPositions(edgePositions);
  edgeGeom.setColors(edgeColors);
  const edgeMat = new LineMaterial({ color: 0xffffff, vertexColors: true, linewidth: 1.2, worldUnits: false });
  group.add(new LineSegments2(edgeGeom, edgeMat));
  const edgeColorBuffer = edgeGeom.attributes.instanceColorStart.data;

  const nodeGeom = new THREE.IcosahedronGeometry(0.06, 1);
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const nodeMesh = new THREE.InstancedMesh(nodeGeom, nodeMat, N);
  const mat4 = new THREE.Matrix4();
  const baseScale = (i) => (i >= S ? 1.35 : 1);
  for (let i = 0; i < N; i++) {
    mat4.makeScale(baseScale(i), baseScale(i), baseScale(i)).setPosition(positions[i]);
    nodeMesh.setMatrixAt(i, mat4);
    nodeMesh.setColorAt(i, inkColor);
  }
  nodeMesh.instanceMatrix.needsUpdate = true;
  nodeMesh.instanceColor.needsUpdate = true;
  group.add(nodeMesh);

  /* Labels */
  const labels = [];
  for (let i = 0; i < N; i++) {
    const el = document.createElement('span');
    el.className = `skills-label view-label ${i < S ? 'is-skill' : 'is-project'}`;
    el.textContent = i < S ? skills[i].label : projects[i - S].label;
    labelsEl.appendChild(el);
    labels.push(el);
  }

  /* State */
  const orbit = createOrbit(view, { rotX: 0.1, rotY: 0, pitchClamp: 0.45, yawClamp: 0.75 });
  const st = {
    hover: -1,
    pinned: -1,
    focus: -1,
    pointerNdc: new THREE.Vector2(),
    pointerDirty: false,
    width: 1, height: 1
  };
  const sceneObj = { dirty: true, tick, render };

  function linkedTo(f) {
    const set = new Set();
    edgeList.forEach(([a, b]) => {
      if (a === f) set.add(b);
      else if (b === f) set.add(a);
    });
    return set;
  }

  function applyFocus(f) {
    if (f === st.focus) return;
    st.focus = f;
    const linked = f >= 0 ? linkedTo(f) : null;
    for (let i = 0; i < N; i++) {
      let c = inkColor; let s = baseScale(i);
      if (f >= 0) {
        if (i === f) { c = accentColor; s *= 1.5; }
        else if (linked.has(i)) { c = linkedColor; s *= 1.2; }
        else c = dimNode;
      }
      mat4.makeScale(s, s, s).setPosition(positions[i]);
      nodeMesh.setMatrixAt(i, mat4);
      nodeMesh.setColorAt(i, c);
      labels[i].classList.toggle('is-hot', f >= 0 && (i === f || linked.has(i)));
      labels[i].classList.toggle('is-dim', f >= 0 && i !== f && !linked.has(i));
    }
    nodeMesh.instanceMatrix.needsUpdate = true;
    nodeMesh.instanceColor.needsUpdate = true;

    const arr = edgeColorBuffer.array;
    edgeList.forEach(([a, b], e) => {
      const c = f < 0 ? edgeBase : (a === f || b === f) ? accentColor : edgeDim;
      const o = e * 6;
      for (let v = 0; v < 2; v++) {
        arr[o + v * 3] = c.r; arr[o + v * 3 + 1] = c.g; arr[o + v * 3 + 2] = c.b;
      }
    });
    edgeColorBuffer.needsUpdate = true;

    terms.forEach((t) => {
      const i = skillIndex.get(t.getAttribute('data-skill'));
      t.classList.toggle('is-linked', f >= 0 && i !== undefined && (i === f || linked.has(i)));
    });
    sceneObj.dirty = true;
  }

  function resolve() {
    applyFocus(st.pinned >= 0 ? st.pinned : st.hover);
  }

  function setHover(i) {
    if (i === st.hover) return;
    st.hover = i;
    canvas.classList.toggle('is-hover', i >= 0);
    resolve();
  }

  function setPinned(i) {
    st.pinned = i;
    terms.forEach((t) => {
      const k = skillIndex.get(t.getAttribute('data-skill'));
      t.setAttribute('aria-pressed', String(k !== undefined && k === i));
    });
    resolve();
  }

  /* Matrix terms: plain text in HTML, promoted to toggle buttons while the graph is live */
  const termHandlers = terms.map((t) => {
    const i = skillIndex.get(t.getAttribute('data-skill'));
    const enter = () => { if (i !== undefined) setHover(i); };
    const leave = () => { if (st.hover === i) setHover(-1); };
    const click = () => { if (i !== undefined) setPinned(st.pinned === i ? -1 : i); };
    const key = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); click(); }
    };
    t.setAttribute('role', 'button');
    t.setAttribute('tabindex', '0');
    t.setAttribute('aria-pressed', 'false');
    t.addEventListener('pointerenter', enter);
    t.addEventListener('pointerleave', leave);
    t.addEventListener('focus', enter);
    t.addEventListener('blur', leave);
    t.addEventListener('click', click);
    t.addEventListener('keydown', key);
    return { enter, leave, click, key };
  });

  /* Pointer */
  const picker = createPicker(camera, [nodeMesh]);
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
      const i = hit && hit.instanceId !== undefined ? hit.instanceId : -1;
      if (i < 0) { if (st.pinned >= 0) setPinned(-1); return; }
      if (i >= S) {
        if (window.openProjectModal) window.openProjectModal(projects[i - S].id);
      } else {
        setPinned(st.pinned === i ? -1 : i);
      }
    },
    onLeave() {
      st.pointerDirty = false;
      setHover(-1);
    }
  });

  function onKeyDown(e) {
    if (e.key === 'Escape' && st.pinned >= 0) setPinned(-1);
  }
  document.addEventListener('keydown', onKeyDown);

  /* Per-frame update */
  const anchor = new THREE.Vector3();
  function tick(dt) {
    if (orbit.tick(dt)) sceneObj.dirty = true;
    group.rotation.set(orbit.rotX, orbit.rotY, 0);

    if (st.pointerDirty && !orbit.dragging) {
      st.pointerDirty = false;
      group.updateMatrixWorld(true);
      const hit = picker.pick(st.pointerNdc);
      setHover(hit && hit.instanceId !== undefined ? hit.instanceId : -1);
    }

    if (sceneObj.dirty) {
      group.updateMatrixWorld(true);
      for (let i = 0; i < N; i++) {
        anchor.copy(positions[i]).applyMatrix4(group.matrixWorld);
        placeLabel(labels[i], anchor, camera, st.width, st.height, i < S ? 'left' : 'right', 12);
      }
    }
  }

  let ready = false;
  function render(dt) {
    renderer.render(scene, camera);
    governor.sample(dt);
    if (!ready) { ready = true; view.classList.add('is-ready'); }
  }

  /* Observers */
  const sizeWatcher = createResizeWatcher(stage, (w, h, changed) => {
    if (!changed) return;
    st.width = w; st.height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    edgeMat.resolution.set(w, h);
    sceneObj.dirty = true;
  });

  const visibility = observeVisibility(view, {
    onEnter: () => ticker.add(sceneObj),
    onLeave: () => ticker.remove(sceneObj)
  });

  function destroy() {
    ticker.remove(sceneObj);
    visibility.disconnect();
    sizeWatcher.disconnect();
    pointer.destroy();
    document.removeEventListener('keydown', onKeyDown);
    terms.forEach((t, k) => {
      t.removeEventListener('pointerenter', termHandlers[k].enter);
      t.removeEventListener('pointerleave', termHandlers[k].leave);
      t.removeEventListener('focus', termHandlers[k].enter);
      t.removeEventListener('blur', termHandlers[k].leave);
      t.removeEventListener('click', termHandlers[k].click);
      t.removeEventListener('keydown', termHandlers[k].key);
      t.classList.remove('is-linked');
      t.removeAttribute('role');
      t.removeAttribute('tabindex');
      t.removeAttribute('aria-pressed');
    });
    labelsEl.replaceChildren();
    canvas.classList.remove('is-hover');
    view.classList.remove('is-ready', 'is-dragging');
    edgeGeom.dispose(); edgeMat.dispose(); nodeGeom.dispose(); nodeMat.dispose();
    renderer.dispose();
  }

  onContextLost(renderer, () => {
    destroy();
    section.classList.remove('skills--view');
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
