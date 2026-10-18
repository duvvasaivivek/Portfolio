/**
 * DUVVA SAI VIVEK - 3D INTERACTIVE WEBGL BACKGROUND
 * Refined, subtle, engineering-grade 3D visualization
 * Zero lag, 60+ FPS, strictly controlled GPU usage
 */

(function () {
  'use strict';

  let scene, camera, renderer;
  let pointsMesh, linesMesh;
  let animationFrameId = null;
  let is3DActive = false;
  let container;

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const windowHalf = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  const PARTICLE_COUNT = 90;
  const CONNECTION_DIST = 95;
  let positions, velocities;

  function initThree() {
    container = document.getElementById('three-canvas-container');
    if (!container || !window.THREE) return;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0c0e, 0.002);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 1500);
    camera.position.z = 580;

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    createRefinedNetwork();

    window.addEventListener('resize', onResize, false);
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  function createRefinedNetwork() {
    // Subtle points
    const pMaterial = new THREE.PointsMaterial({
      color: 0xfd6f00,
      size: 3,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    const geometry = new THREE.BufferGeometry();
    positions = new Float32Array(PARTICLE_COUNT * 3);
    velocities = [];

    const spread = 750;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = Math.random() * spread - spread / 2;
      positions[i * 3 + 1] = Math.random() * spread - spread / 2;
      positions[i * 3 + 2] = Math.random() * spread - spread / 2;

      velocities.push({
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        vz: (Math.random() - 0.5) * 0.25
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    pointsMesh = new THREE.Points(geometry, pMaterial);
    scene.add(pointsMesh);

    // Subtle connecting lines
    const maxLines = PARTICLE_COUNT * 8;
    const linePositions = new Float32Array(maxLines * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x333742,
      transparent: true,
      opacity: 0.35
    });

    linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);
  }

  function onMouseMove(event) {
    mouse.targetX = (event.clientX - windowHalf.x) * 0.2;
    mouse.targetY = (event.clientY - windowHalf.y) * 0.2;
  }

  function onResize() {
    windowHalf.x = window.innerWidth / 2;
    windowHalf.y = window.innerHeight / 2;
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  function onVisibilityChange() {
    if (document.hidden) {
      pauseLoop();
    } else if (is3DActive) {
      startLoop();
    }
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    mouse.x += (mouse.targetX - mouse.x) * 0.04;
    mouse.y += (mouse.targetY - mouse.y) * 0.04;

    camera.position.x = mouse.x;
    camera.position.y = -mouse.y;
    camera.lookAt(scene.position);

    if (pointsMesh && linesMesh) {
      const pPos = pointsMesh.geometry.attributes.position.array;
      const lPos = linesMesh.geometry.attributes.position.array;
      let vertexIndex = 0;
      const spread = 750;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pPos[i * 3] += velocities[i].vx;
        pPos[i * 3 + 1] += velocities[i].vy;
        pPos[i * 3 + 2] += velocities[i].vz;

        if (pPos[i * 3] < -spread / 2 || pPos[i * 3] > spread / 2) velocities[i].vx *= -1;
        if (pPos[i * 3 + 1] < -spread / 2 || pPos[i * 3 + 1] > spread / 2) velocities[i].vy *= -1;
        if (pPos[i * 3 + 2] < -spread / 2 || pPos[i * 3 + 2] > spread / 2) velocities[i].vz *= -1;

        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          const dx = pPos[i * 3] - pPos[j * 3];
          const dy = pPos[i * 3 + 1] - pPos[j * 3 + 1];
          const dz = pPos[i * 3 + 2] - pPos[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < CONNECTION_DIST) {
            lPos[vertexIndex++] = pPos[i * 3];
            lPos[vertexIndex++] = pPos[i * 3 + 1];
            lPos[vertexIndex++] = pPos[i * 3 + 2];

            lPos[vertexIndex++] = pPos[j * 3];
            lPos[vertexIndex++] = pPos[j * 3 + 1];
            lPos[vertexIndex++] = pPos[j * 3 + 2];
          }
        }
      }

      linesMesh.geometry.setDrawRange(0, vertexIndex / 3);
      pointsMesh.geometry.attributes.position.needsUpdate = true;
      linesMesh.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  function startLoop() {
    if (!animationFrameId) {
      animate();
    }
  }

  function pauseLoop() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  window.Portfolio3D = {
    init: function () {
      initThree();
      const saved = localStorage.getItem('portfolio_mode') || '2d';
      if (saved === '3d') {
        this.enable3D();
      } else {
        this.enable2D();
      }
    },
    enable3D: function () {
      is3DActive = true;
      document.body.classList.add('mode-3d');
      startLoop();
      localStorage.setItem('portfolio_mode', '3d');
      this.updateUI(true);
    },
    enable2D: function () {
      is3DActive = false;
      document.body.classList.remove('mode-3d');
      pauseLoop();
      localStorage.setItem('portfolio_mode', '2d');
      this.updateUI(false);
    },
    toggle: function () {
      if (is3DActive) {
        this.enable2D();
      } else {
        this.enable3D();
      }
    },
    isActive: function () {
      return is3DActive;
    },
    updateUI: function (active) {
      const btn = document.getElementById('modeToggleBtn');
      if (btn) {
        const badge = btn.querySelector('.mode-badge');
        if (active) {
          btn.classList.add('active');
          if (badge) badge.textContent = '3D ON';
        } else {
          btn.classList.remove('active');
          if (badge) badge.textContent = '2D ACTIVE';
        }
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Portfolio3D.init());
  } else {
    window.Portfolio3D.init();
  }
})();
