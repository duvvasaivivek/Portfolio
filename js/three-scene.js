/**
 * DUVVA SAI VIVEK - 3D INTERACTIVE WEBGL BACKGROUND
 * Rich, vibrant signature orange neural mesh with silky 60+ FPS performance
 * - Beautiful warm orange nodes (#fd6f00) with soft radial falloff
 * - Clearly visible orange lattice connections with elegant translucency
 * - Locked 1.0 pixel ratio, fast squared-distance checks, zero lag
 * - Pure GPU camera parallax on scroll and cursor
 */

(function () {
  'use strict';

  let scene, camera, renderer;
  let pointsMesh, linesMesh;
  let animationFrameId = null;
  let is3DActive = false;
  let container;

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;

  let targetScrollY = 0;
  let currentScrollY = 0;

  const PARTICLE_COUNT = 85;
  const CONNECTION_DIST = 95;
  const CONNECTION_DIST_SQ = CONNECTION_DIST * CONNECTION_DIST;
  const MAX_LINES = PARTICLE_COUNT * 6;
  const MAX_LINE_FLOATS = MAX_LINES * 6;

  let positions, velocities;

  // Rich warm orange particle texture with smooth radial falloff
  function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Rich warm orange gradient (no stark white core, authentic brand orange)
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 138, 36, 1.0)');     // Warm amber-orange core
    grad.addColorStop(0.35, 'rgba(253, 111, 0, 0.9)');   // Signature orange (#fd6f00)
    grad.addColorStop(0.75, 'rgba(253, 111, 0, 0.35)');  // Soft translucent aura
    grad.addColorStop(1, 'rgba(253, 111, 0, 0)');        // Smooth transparency

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    return new THREE.CanvasTexture(canvas);
  }

  function initThree() {
    container = document.getElementById('three-canvas-container');
    if (!container || !window.THREE) return;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1600);
    camera.position.z = 520;

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });
    renderer.setClearColor(0x000000, 0); // 100% transparent canvas
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1); // Locked to 1 for high frame rate without lag
    container.appendChild(renderer.domElement);

    createNeuralNetwork();

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  function createNeuralNetwork() {
    const particleTex = createParticleTexture();

    // Clearly visible, warm orange nodes
    const pMaterial = new THREE.PointsMaterial({
      size: 5.6,
      map: particleTex,
      transparent: true,
      opacity: 0.75,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    const geometry = new THREE.BufferGeometry();
    positions = new Float32Array(PARTICLE_COUNT * 3);
    velocities = [];

    const spreadX = 880;
    const spreadY = 720;
    const spreadZ = 520;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spreadX;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spreadY;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spreadZ;

      velocities.push({
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        vz: (Math.random() - 0.5) * 0.28
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    pointsMesh = new THREE.Points(geometry, pMaterial);
    scene.add(pointsMesh);

    // Warm orange connection lattice
    const linePositions = new Float32Array(MAX_LINE_FLOATS);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xfd6f00, // True brand orange
      transparent: true,
      opacity: 0.28,   // Visible, elegant translucency
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);
  }

  function onMouseMove(event) {
    mouse.targetX = (event.clientX - windowHalfX) * 0.25;
    mouse.targetY = (event.clientY - windowHalfY) * 0.25;
  }

  function onScroll() {
    targetScrollY = window.scrollY || window.pageYOffset;
  }

  function onResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
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

    // Smooth camera parallax
    mouse.x += (mouse.targetX - mouse.x) * 0.04;
    mouse.y += (mouse.targetY - mouse.y) * 0.04;
    currentScrollY += (targetScrollY - currentScrollY) * 0.05;

    camera.position.x = mouse.x * 0.22;
    camera.position.y = -mouse.y * 0.22 - currentScrollY * 0.09;
    camera.lookAt(0, -currentScrollY * 0.09, 0);

    // Fast particle drift and orange line connection
    if (pointsMesh && linesMesh) {
      const pPos = pointsMesh.geometry.attributes.position.array;
      const lPos = linesMesh.geometry.attributes.position.array;
      let lineFloatsCount = 0;

      const spreadXHalf = 440;
      const spreadYHalf = 360;
      const spreadZHalf = 260;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        pPos[i3] += velocities[i].vx;
        pPos[i3 + 1] += velocities[i].vy;
        pPos[i3 + 2] += velocities[i].vz;

        // Boundary reflection
        if (pPos[i3] < -spreadXHalf || pPos[i3] > spreadXHalf) velocities[i].vx = -velocities[i].vx;
        if (pPos[i3 + 1] < -spreadYHalf || pPos[i3 + 1] > spreadYHalf) velocities[i].vy = -velocities[i].vy;
        if (pPos[i3 + 2] < -spreadZHalf || pPos[i3 + 2] > spreadZHalf) velocities[i].vz = -velocities[i].vz;

        const px = pPos[i3];
        const py = pPos[i3 + 1];
        const pz = pPos[i3 + 2];

        // Optimized pair distance check (No Math.sqrt for non-matching pairs)
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          if (lineFloatsCount + 6 > MAX_LINE_FLOATS) break;
          const j3 = j * 3;
          const dx = px - pPos[j3];
          const dy = py - pPos[j3 + 1];
          const dz = pz - pPos[j3 + 2];
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < CONNECTION_DIST_SQ) {
            lPos[lineFloatsCount++] = px;
            lPos[lineFloatsCount++] = py;
            lPos[lineFloatsCount++] = pz;

            lPos[lineFloatsCount++] = pPos[j3];
            lPos[lineFloatsCount++] = pPos[j3 + 1];
            lPos[lineFloatsCount++] = pPos[j3 + 2];
          }
        }
      }

      linesMesh.geometry.setDrawRange(0, lineFloatsCount / 3);
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
      const saved = localStorage.getItem('portfolio_mode') || '3d';
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
