/**
 * Hero skills lattice: four clusters of skill nodes joined by thin edges, drawn as ink on
 * paper. Drag to rotate (with inertia), hover a node to highlight it and its neighbours.
 */

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { skillsData } from './data.js';
import {
  createRenderer, ticker, observeVisibility, createDprGovernor, createResizeWatcher,
  attachPointer, createPicker, projectToScreen, isLowDetail, seededRandom, readToken,
  blendColor, onContextLost
} from './scene-utils.js';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function fibonacciPoint(i, n, radius, out) {
  const y = 1 - ((i + 0.5) * 2) / n;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = i * GOLDEN_ANGLE;
  return out.set(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius);
}

export function createHeroScene(root, opts = {}) {
  const canvas = root.querySelector('.lattice-canvas');
  const label = root.querySelector('.lattice-label');
  const labelName = label.querySelector('.lattice-label-name');
  const labelGroup = label.querySelector('.lattice-label-group');

  const low = isLowDetail();
  let reducedMotion = !!opts.reducedMotion;

  /* Colors from CSS tokens */
  const paperHex = readToken('--paper', '#F6F1E8');
  const inkColor = new THREE.Color(readToken('--lattice-node', '#17150F'));
  const accentColor = new THREE.Color(readToken('--lattice-node-active', '#6B1F2B'));
  const edgeColor = blendColor(paperHex, inkColor.getHex(), 0.3);
  const neighbourColor = inkColor.clone().lerp(accentColor, 0.7);

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

  /* Edges: k-nearest within cluster, one bridge per cluster pair */
  const k = low ? 2 : 3;
  const edgeSet = new Set();
  const addEdge = (a, b) => { if (a !== b) edgeSet.add(a < b ? `${a}-${b}` : `${b}-${a}`); };
  for (let i = 0; i < N; i++) {
    const same = [];
    for (let j = 0; j < N; j++) {
      if (j !== i && nodes[j].gi === nodes[i].gi) same.push([nodes[i].pos.distanceToSquared(nodes[j].pos), j]);
    }
    same.sort((a, b) => a[0] - b[0]);
    for (let m = 0; m < Math.min(k, same.length); m++) addEdge(i, same[m][1]);
  }
  if (!low) {
    const groupsCount = skillsData.groups.length;
    for (let a = 0; a < groupsCount; a++) {
      for (let b = a + 1; b < groupsCount; b++) {
        let best = Infinity; let pair = null;
        for (let i = 0; i < N; i++) {
          if (nodes[i].gi !== a) continue;
          for (let j = 0; j < N; j++) {
            if (nodes[j].gi !== b) continue;
            const d = nodes[i].pos.distanceToSquared(nodes[j].pos);
            if (d < best) { best = d; pair = [i, j]; }
          }
        }
        if (pair) addEdge(pair[0], pair[1]);
      }
    }
  }
  const edgeList = Array.from(edgeSet, (s) => s.split('-').map(Number));
  const adjacency = nodes.map(() => new Set());
  edgeList.forEach(([a, b]) => { adjacency[a].add(b); adjacency[b].add(a); });

  const edgePositions = new Float32Array(edgeList.length * 6);
  const edgeColors = new Float32Array(edgeList.length * 6);
  edgeList.forEach(([a, b], e) => {
    const o = e * 6;
    edgePositions[o] = nodes[a].pos.x; edgePositions[o + 1] = nodes[a].pos.y; edgePositions[o + 2] = nodes[a].pos.z;
    edgePositions[o + 3] = nodes[b].pos.x; edgePositions[o + 4] = nodes[b].pos.y; edgePositions[o + 5] = nodes[b].pos.z;
    for (let v = 0; v < 2; v++) {
      edgeColors[o + v * 3] = edgeColor.r; edgeColors[o + v * 3 + 1] = edgeColor.g; edgeColors[o + v * 3 + 2] = edgeColor.b;
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
  const st = {
    rotX: 0.18, rotY: -0.5, velX: 0, velY: 0,
    dragging: false, lastX: 0, lastY: 0,
    autoUntil: performance.now() + 6000,
    scrollP: -1,
    pointerNdc: new THREE.Vector2(),
    pointerDirty: false,
    hovered: -1,
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
    edgeList.forEach(([a, b], e) => {
      const c = (a === idx || b === idx) ? accentColor : edgeColor;
      const o = e * 6;
      for (let v = 0; v < 2; v++) {
        arr[o + v * 3] = c.r; arr[o + v * 3 + 1] = c.g; arr[o + v * 3 + 2] = c.b;
      }
    });
    edgeColorBuffer.needsUpdate = true;

    if (idx >= 0) {
      labelName.textContent = nodes[idx].item.label;
      labelGroup.textContent = nodes[idx].groupLabel;
      label.hidden = false;
      positionLabel();
    } else {
      label.hidden = true;
    }
    sceneObj.dirty = true;
  }

  const screen = { x: 0, y: 0, visible: true };
  const worldPos = new THREE.Vector3();
  function positionLabel() {
    if (st.hovered < 0) return;
    group.updateMatrixWorld(true);
    worldPos.copy(nodes[st.hovered].pos).applyMatrix4(group.matrixWorld);
    projectToScreen(worldPos, camera, st.width, st.height, screen);
    const x = Math.round(screen.x);
    const y = Math.round(screen.y);
    label.style.transform = x > st.width * 0.55
      ? `translate(calc(${x - 14}px - 100%), ${y + 14}px)`
      : `translate(${x + 14}px, ${y + 14}px)`;
  }

  /* Pointer */
  const picker = createPicker(camera, [nodeMesh]);
  const pointer = attachPointer(canvas, {
    onDown(e) {
      st.dragging = true;
      st.lastX = e.clientX; st.lastY = e.clientY;
      st.velX = 0; st.velY = 0;
      root.classList.add('is-dragging');
      root.classList.add('is-touched');
      applyHighlight(-1);
    },
    onMove(e, ndc) {
      if (st.dragging) {
        const dx = e.clientX - st.lastX;
        const dy = e.clientY - st.lastY;
        st.lastX = e.clientX; st.lastY = e.clientY;
        st.velY = dx * 0.005;
        st.velX = dy * 0.005;
        st.rotY += st.velY;
        st.rotX = THREE.MathUtils.clamp(st.rotX + st.velX, -1.2, 1.2);
        st.autoUntil = 0;
        sceneObj.dirty = true;
      } else if (e.pointerType !== 'touch') {
        st.pointerNdc.copy(ndc);
        st.pointerDirty = true;
        sceneObj.dirty = true;
      }
    },
    onUp() {
      st.dragging = false;
      root.classList.remove('is-dragging');
      if (reducedMotion) { st.velX = 0; st.velY = 0; }
      sceneObj.dirty = true;
    },
    onLeave() {
      st.pointerDirty = false;
      if (!st.dragging) applyHighlight(-1);
    }
  });

  /* Per-frame update */
  function tick(dt, now) {
    const dt60 = dt / 16.667;

    if (!st.dragging) {
      const speed = Math.abs(st.velX) + Math.abs(st.velY);
      if (speed > 1e-4) {
        st.rotY += st.velY;
        st.rotX = THREE.MathUtils.clamp(st.rotX + st.velX, -1.2, 1.2);
        const damp = Math.pow(0.94, dt60);
        st.velX *= damp; st.velY *= damp;
        sceneObj.dirty = true;
      } else {
        st.velX = 0; st.velY = 0;
        if (!reducedMotion && st.hovered < 0 && now < st.autoUntil) {
          const ease = THREE.MathUtils.clamp((st.autoUntil - now) / 1500, 0, 1);
          st.rotY += 0.0022 * dt60 * ease;
          sceneObj.dirty = true;
        }
      }
    }

    const p = reducedMotion ? 0 : THREE.MathUtils.clamp(window.scrollY / Math.max(1, window.innerHeight), 0, 1);
    if (p !== st.scrollP) { st.scrollP = p; sceneObj.dirty = true; }

    group.rotation.set(st.rotX + 0.18 * p, st.rotY, 0);
    group.scale.setScalar(1 - 0.08 * p);

    if (st.pointerDirty && !st.dragging) {
      st.pointerDirty = false;
      group.updateMatrixWorld(true);
      const hit = picker.pick(st.pointerNdc);
      applyHighlight(hit && hit.instanceId !== undefined ? hit.instanceId : -1);
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
  createResizeWatcher(root, (w, h, changed) => {
    if (!changed) return;
    st.width = w; st.height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    edgeMat.resolution.set(w, h);
    sceneObj.dirty = true;
  });

  observeVisibility(root, {
    onEnter: () => ticker.add(sceneObj),
    onLeave: () => ticker.remove(sceneObj)
  });

  onContextLost(renderer, () => {
    ticker.remove(sceneObj);
    pointer.destroy();
    root.classList.remove('is-ready');
  });

  return {
    setReducedMotion(v) {
      reducedMotion = !!v;
      st.autoUntil = 0;
      st.velX = 0; st.velY = 0;
      sceneObj.dirty = true;
    }
  };
}
