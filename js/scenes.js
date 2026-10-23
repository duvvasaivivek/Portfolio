/**
 * Bootstrap for the 3D layer. Imports nothing heavy itself: it decides, synchronously,
 * which scenes are allowed, fixes the page layout accordingly (one class per scene on its
 * section), and lazy-loads the scene modules (and Three.js with them) only when needed.
 *
 * Every scene module exports a factory `(el, { reducedMotion }) => { destroy(), setReducedMotion? }`.
 */

const html = document.documentElement;
const params = new URLSearchParams(location.search);
const NO_3D = params.has('no3d');

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

const WEBGL = !NO_3D && supportsWebGL();
if (!WEBGL) html.classList.add('no-webgl');

const reduced = () => html.classList.contains('reduce-motion');
const wide = (min) => window.innerWidth >= min;

/* ---------------- Registry ---------------- */

const registry = [];
let importFailed = false;

function registerScene(def) {
  const s = {
    ...def,
    target: def.target || def.el,
    rootMargin: def.rootMargin || '800px 0px',
    active: false,
    failed: false,
    loading: false,
    mod: null,
    instance: null,
    observer: null
  };
  if (s.el) registry.push(s);
  return s;
}

function disable(s) {
  s.failed = true;
  sync(s);
}

function start(s) {
  if (s.instance || !s.mod || !s.active) return;
  try {
    s.instance = s.mod[s.factory](s.el, { reducedMotion: reduced() });
  } catch (err) {
    console.warn(`[portfolio] ${s.id} scene unavailable`, err);
    disable(s);
  }
}

function load(s) {
  if (s.instance || s.loading || !s.active) return;
  if (s.mod) { start(s); return; }
  s.loading = true;
  import(s.module)
    .then((m) => {
      s.mod = m;
      s.loading = false;
      if (s.active) start(s);
    })
    .catch((err) => {
      s.loading = false;
      console.warn(`[portfolio] ${s.id} module failed to load`, err);
      /* Almost always Three.js itself failed to fetch: fall back to the plain page everywhere. */
      importFailed = true;
      html.classList.add('no-webgl');
      registry.forEach(sync);
    });
}

function arm(s) {
  if (s.observer || s.instance || s.loading) return;
  if (s.eager) {
    const go = () => requestAnimationFrame(() => requestAnimationFrame(() => load(s)));
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
    return;
  }
  s.observer = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    s.observer.disconnect();
    s.observer = null;
    load(s);
  }, { rootMargin: s.rootMargin });
  s.observer.observe(s.el);
}

function sync(s) {
  const want = WEBGL && !importFailed && !s.failed && s.allowed();
  if (want && !s.active) {
    s.active = true;
    if (s.className) s.target.classList.add(s.className);
    arm(s);
  } else if (!want && s.active) {
    s.active = false;
    if (s.className) s.target.classList.remove(s.className);
    if (s.observer) { s.observer.disconnect(); s.observer = null; }
    if (s.instance) {
      try { s.instance.destroy && s.instance.destroy(); } catch (err) { console.warn(`[portfolio] ${s.id} destroy failed`, err); }
      s.instance = null;
    }
  } else if (want && s.active && !s.instance && !s.observer && !s.loading) {
    arm(s);
  }
}

/* ---------------- Scenes ---------------- */

const latticeEl = document.getElementById('skillsLattice');

/* Hero visual is hidden below 640px (see style.css), so phones never fetch Three.js. */
registerScene({
  id: 'hero', el: latticeEl, eager: true,
  allowed: () => wide(640),
  module: './scene-hero.js', factory: 'createHeroScene'
});

/* Scroll-driven camera: off under reduced motion, where the HTML list is the better experience. */
registerScene({
  id: 'journey', el: document.getElementById('experience'), className: 'journey--stage',
  allowed: () => !reduced() && wide(1024),
  module: './scene-journey.js', factory: 'createJourneyScene'
});

registerScene({
  id: 'about', el: document.getElementById('about'), className: 'about--view',
  allowed: () => wide(1024),
  module: './scene-about.js', factory: 'createAboutScene'
});

registerScene({
  id: 'projects', el: document.getElementById('portfolio'), className: 'projects--view',
  allowed: () => wide(1024),
  module: './scene-projects.js', factory: 'createProjectsScene'
});

registerScene({
  id: 'skills', el: document.getElementById('skills'), className: 'skills--view',
  allowed: () => wide(1024),
  module: './scene-skills.js', factory: 'createSkillsScene'
});

/* Motion is the only value of the background, so the Motion toggle turns it off entirely. */
registerScene({
  id: 'ambient', el: document.getElementById('ambientCanvas'), target: html, className: 'ambient', eager: true,
  allowed: () => !reduced() && wide(1024),
  module: './scene-ambient.js', factory: 'createAmbientScene'
});

registry.forEach(sync);

/* ---------------- Reactions ---------------- */

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => registry.forEach(sync), 150);
}, { passive: true });

document.addEventListener('motionchange', () => {
  registry.forEach((s) => {
    sync(s);
    if (s.instance && s.instance.setReducedMotion) s.instance.setReducedMotion(reduced());
  });
});

if (['localhost', '127.0.0.1'].includes(location.hostname)) {
  window.__scenes = () => registry.map((s) => ({
    id: s.id, active: s.active, loaded: !!s.mod, live: !!s.instance, armed: !!s.observer, failed: s.failed
  }));
}
