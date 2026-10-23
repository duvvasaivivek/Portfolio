/**
 * Hero skills lattice: four clusters of skill nodes drawn as ink on paper. An edge joins two
 * skills that were used in the same project (the more projects shared, the darker the line);
 * skills used in none of the listed projects get one faint link to a group neighbour so they do
 * not float. Drag to rotate (with inertia), hover a node to highlight it and the skills it was
 * used with, select a node to pin its label, which lists the projects that used it.
 */

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { skillsData, projectsData } from './data.js';
import {
  createRenderer, ticker, observeVisibility, createDprGovernor, createResizeWatcher,
  attachPointer, createPicker, placeLabel, isLowDetail, seededRandom, readToken,
  blendColor, onContextLost, createOrbit
} from './scene-utils.js';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function fibonacciPoint(i, n, radius, out) {
  const y = 1 - ((i + 0.5) * 2) / n;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = i * GOLDEN_ANGLE;
  return out.set(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function createHeroScene(root, opts = {}) {
  const canvas = root.querySelector('.lattice-canvas');
  const label = root.querySelector('.lattice-label');
  const labelName = label.querySelector('.lattice-label-name');
  const labelGroup = label.querySelector('.lattice-label-group');
  const labelProjects = label.querySelector('.lattice-label-projects');

  const low = isLowDetail();
  let reducedMotion = !!opts.reducedMotion;

  /* Colors from CSS tokens */
  const paperHex = readToken('--paper', '#F6F1E8');
  const inkColor = new THREE.Color(readToken('--lattice-node', '#17150F'));
  const accentColor = new THREE.Color(readToken('--lattice-node-active', '#6B1F2B'));
  const neighbourColor = inkColor.clone().lerp(accentColor, 0.7);
  const edgeColorFor = (w) => blendColor(paperHex, inkColor.getHex(), w === 0 ? 0.14 : w === 1 ? 0.26 : w === 2 ? 0.4 : 0.55);

  /* Renderer, scene, camera */
  const renderer = createRenderer(canvas, { antialias: !low, maxDpr: low ? 1.5 : 2 });
  const governor = createDprGovernor(renderer);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 6.2);
  camera.lookAt(0, 0, 0);
  const group = new THREE.Group();
  scene.add(group);

  /* Layout nodes: tetrahedral cluster centres, Fibonacci sphere within each cluster */
  const rand = seededRandom(7);
  const centers = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]
    .map((v) => new THREE.Vector3(...v).normalize().multiplyScalar(1.55));
  const nodes = [];
  const tmp = new THREE.Vector3();
  skillsData.groups.forEach((g, gi) => {
    const n = g.items.length;
    g.items.forEach((item, i) => {
      fibonacciPoint(i, n, 0.72, tmp);
      tmp.x += (rand() - 0.5) * 0.16;
      tmp.y += (rand() - 0.5) * 0.16;
      tmp.z += (rand() - 0.5) * 0.16;
      tmp.add(centers[gi % centers.length]);
      nodes.push({ pos: tmp.clone(), gi, item, groupLabel: g.label });
    });
  });
  const N = nodes.length;

  /* Edges: shared projects, weighted; faint group link for skills used in no listed project */
  const edgeWeight = new Map();
  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const shared = nodes[i].item.projects.filter((p) => nodes[j].item.projects.includes(p)).length;
      if (shared > 0) edgeWeight.set(key(i, j), shared);
    }
  }
  for (let i = 0; i < N; i++) {
    if (nodes[i].item.projects.length) continue;
    let best = Infinity; let nearest = -1;
    for (let j = 0; j < N; j++) {
      if (j === i || nodes[j].gi !== nodes[i].gi) continue;
      const d = nodes[i].pos.distanceToSquared(nodes[j].pos);
      if (d < best) { best = d; nearest = j; }
    }
    if (nearest >= 0 && !edgeWeight.has(key(i, nearest))) edgeWeight.set(key(i, nearest), 0);
  }
  const edgeList = Array.from(edgeWeight, ([k, w]) => [...k.split('-').map(Number), w]);
  const adjacency = nodes.map(() => new Set());
  edgeList.forEach(([a, b, w]) => { if (w > 0) { adjacency[a].add(b); adjacency[b].add(a); } });

  const edgePositions = new Float32Array(edgeList.length * 6);
  const edgeColors = new Float32Array(edgeList.length * 6);
  const baseEdgeColors = edgeList.map(([, , w]) => edgeColorFor(w));
  edgeList.forEach(([a, b], e) => {
    const o = e * 6;
    edgePositions[o] = nodes[a].pos.x; edgePositions[o + 1] = nodes[a].pos.y; edgePositions[o + 2] = nodes[a].pos.z;
    edgePositions[o + 3] = nodes[b].pos.x; edgePositions[o + 4] = nodes[b].pos.y; edgePositions[o + 5] = nodes[b].pos.z;
    const c = baseEdgeColors[e];
    for (let v = 0; v < 2; v++) {
      edgeColors[o + v * 3] = c.r; edgeColors[o + v * 3 + 1] = c.g; edgeColors[o + v * 3 + 2] = c.b;
    }
  });
  const edgeGeom = new LineSegmentsGeometry();
  edgeGeom.setPositions(edgePositions);
  edgeGeom.setColors(edgeColors);
  const edgeMat = new LineMaterial({ color: 0xffffff, vertexColors: true, linewidth: 1.25, worldUnits: false });
  const edges = new LineSegments2(edgeGeom, edgeMat);
  group.add(edges);
  const edgeColorBuffer = edgeGeom.attributes.instanceColorStart.data;

  /* Nodes */
  const nodeGeom = new THREE.IcosahedronGeometry(0.075, 1);
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const nodeMesh = new THREE.InstancedMesh(nodeGeom, nodeMat, N);
  const mat4 = new THREE.Matrix4();
  for (let i = 0; i < N; i++) {
    mat4.makeTranslation(nodes[i].pos.x, nodes[i].pos.y, nodes[i].pos.z);
    nodeMesh.setMatrixAt(i, mat4);
    nodeMesh.setColorAt(i, inkColor);
  }
  nodeMesh.instanceMatrix.needsUpdate = true;
  nodeMesh.instanceColor.needsUpdate = true;
  group.add(nodeMesh);

  /* State */
  const orbit = createOrbit(root, { rotX: 0.18, rotY: -0.5, pitchClamp: 1.2 });
  const st = {
    autoUntil: performance.now() + 6000,
    scrollP: -1,
    pointerNdc: new THREE.Vector2(),
    pointerDirty: false,
    hovered: -1,
    pinned: -1,
    width: 1, height: 1
  };

  const sceneObj = { dirty: true, tick, render };

  /* Highlighting */
  function applyHighlight(idx) {
    if (idx === st.hovered) return;
    st.hovered = idx;
    const neigh = idx >= 0 ? adjacency[idx] : null;
    for (let i = 0; i < N; i++) {
      let s = 1; let c = inkColor;
      if (i === idx) { s = 1.6; c = accentColor; }
      else if (neigh && neigh.has(i)) { s = 1.2; c = neighbourColor; }
      mat4.makeScale(s, s, s).setPosition(nodes[i].pos);
      nodeMesh.setMatrixAt(i, mat4);
      nodeMesh.setColorAt(i, c);
    }
    nodeMesh.instanceMatrix.needsUpdate = true;
    nodeMesh.instanceColor.needsUpdate = true;

    const arr = edgeColorBuffer.array;
    edgeList.forEach(([a, b, w], e) => {
      const c = (w > 0 && (a === idx || b === idx)) ? accentColor : baseEdgeColors[e];
      const o = e * 6;
      for (let v = 0; v < 2; v++) {
        arr[o + v * 3] = c.r; arr[o + v * 3 + 1] = c.g; arr[o + v * 3 + 2] = c.b;
      }
    });
    edgeColorBuffer.needsUpdate = true;

    if (idx >= 0) {
      const node = nodes[idx];
      labelName.textContent = node.item.label;
      labelGroup.textContent = node.groupLabel;
      const used = node.item.projects.filter((p) => projectsData[p]);
      labelProjects.innerHTML = used.length
        ? 'Used in: ' + used.map((p) => `<a href="#project-${escapeHtml(p)}" tabindex="-1">${escapeHtml(projectsData[p].title)}</a>`).join(', ')
        : 'Not used in the listed projects';
      label.hidden = false;
      positionLabel();
    } else {
      label.hidden = true;
    }
    sceneObj.dirty = true;
  }

  function setPinned(idx) {
    st.pinned = idx;
    label.classList.toggle('is-pinned', idx >= 0);
    if (idx >= 0) applyHighlight(idx);
  }

  const worldPos = new THREE.Vector3();
  function positionLabel() {
    if (st.hovered < 0) return;
    group.updateMatrixWorld(true);
    worldPos.copy(nodes[st.hovered].pos).applyMatrix4(group.matrixWorld);
    placeLabel(label, worldPos, camera, st.width, st.height, 'tip');
  }

  /* Pointer */
  const picker = createPicker(camera, [nodeMesh]);
  const pointer = attachPointer(canvas, {
    onDown(e) {
      orbit.onDown(e);
      if (st.pinned < 0) applyHighlight(-1);
    },
    onMove(e, ndc) {
      if (orbit.onMove(e)) {
        st.autoUntil = 0;
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
      if (hit && hit.instanceId !== undefined) {
        setPinned(hit.instanceId === st.pinned ? -1 : hit.instanceId);
        if (st.pinned < 0) applyHighlight(hit.instanceId);
      } else if (st.pinned >= 0) {
        setPinned(-1);
        applyHighlight(-1);
      }
    },
    onLeave() {
      st.pointerDirty = false;
      if (!orbit.dragging && st.pinned < 0) applyHighlight(-1);
    }
  });

  function onKeyDown(e) {
    if (e.key === 'Escape' && st.pinned >= 0) {
      setPinned(-1);
      applyHighlight(-1);
    }
  }
  document.addEventListener('keydown', onKeyDown);

  /* Per-frame update */
  function tick(dt, now) {
    if (orbit.tick(dt)) {
      sceneObj.dirty = true;
    } else if (!orbit.dragging && !reducedMotion && st.hovered < 0 && now < st.autoUntil) {
      const ease = THREE.MathUtils.clamp((st.autoUntil - now) / 1500, 0, 1);
      orbit.rotY += 0.0022 * (dt / 16.667) * ease;
      sceneObj.dirty = true;
    }

    const p = reducedMotion ? 0 : THREE.MathUtils.clamp(window.scrollY / Math.max(1, window.innerHeight), 0, 1);
    if (p !== st.scrollP) { st.scrollP = p; sceneObj.dirty = true; }

    group.rotation.set(orbit.rotX + 0.18 * p, orbit.rotY, 0);
    group.scale.setScalar(1 - 0.08 * p);

    if (st.pointerDirty && !orbit.dragging) {
      st.pointerDirty = false;
      if (st.pinned < 0) {
        group.updateMatrixWorld(true);
        const hit = picker.pick(st.pointerNdc);
        applyHighlight(hit && hit.instanceId !== undefined ? hit.instanceId : -1);
      }
    }

    if (st.hovered >= 0 && sceneObj.dirty) positionLabel();
  }

  let ready = false;
  function render(dt) {
    renderer.render(scene, camera);
    governor.sample(dt);
    if (!ready) { ready = true; root.classList.add('is-ready'); }
  }

  /* Sizing and visibility */
  const sizeWatcher = createResizeWatcher(root, (w, h, changed) => {
    if (!changed) return;
    st.width = w; st.height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    edgeMat.resolution.set(w, h);
    sceneObj.dirty = true;
  });

  const visibility = observeVisibility(root, {
    onEnter: () => ticker.add(sceneObj),
    onLeave: () => ticker.remove(sceneObj)
  });

  function destroy() {
    ticker.remove(sceneObj);
    visibility.disconnect();
    sizeWatcher.disconnect();
    pointer.destroy();
    document.removeEventListener('keydown', onKeyDown);
    label.hidden = true;
    label.classList.remove('is-pinned');
    root.classList.remove('is-ready', 'is-dragging');
    edgeGeom.dispose(); edgeMat.dispose(); nodeGeom.dispose(); nodeMat.dispose();
    renderer.dispose();
  }

  onContextLost(renderer, () => {
    destroy();
    document.documentElement.classList.add('no-webgl');
  });

  return {
    destroy,
    setReducedMotion(v) {
      reducedMotion = !!v;
      st.autoUntil = 0;
      orbit.stop();
      sceneObj.dirty = true;
    }
  };
}
