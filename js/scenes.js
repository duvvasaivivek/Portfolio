/**
 * Bootstrap for the 3D layer. Imports nothing heavy itself: it decides, synchronously,
 * which scenes are allowed, fixes the page layout accordingly, and lazy-loads the scene
 * modules (and Three.js with them) only when they are needed.
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
const journeyAllowed = () => WEBGL && !reduced() && window.innerWidth >= 1024;

const latticeEl = document.getElementById('skillsLattice');
const journeyEl = document.getElementById('experience');

/* ---------------- Hero lattice ---------------- */

let heroScene = null;
let heroLoading = false;

/* The hero visual is hidden below 640px (see style.css), so phones never fetch Three.js. */
const heroAllowed = () => WEBGL && !!latticeEl && window.innerWidth >= 640;

function loadHero() {
  if (heroScene || heroLoading || !heroAllowed()) return;
  heroLoading = true;
  import('./scene-hero.js')
    .then((m) => {
      heroScene = m.createHeroScene(latticeEl, { reducedMotion: reduced() });
    })
    .catch((err) => {
      console.warn('[portfolio] hero scene unavailable', err);
      html.classList.add('no-webgl');
    })
    .finally(() => { heroLoading = false; });
}

if (heroAllowed()) {
  const start = () => requestAnimationFrame(() => requestAnimationFrame(loadHero));
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

/* ---------------- Journey stage ---------------- */

let journeyScene = null;
let journeyModule = null;
let journeyObserver = null;

function startJourneyScene() {
  if (journeyScene || !journeyEl.classList.contains('journey--stage')) return;
  try {
    journeyScene = journeyModule.createJourneyScene(journeyEl);
  } catch (err) {
    console.warn('[portfolio] journey scene unavailable', err);
    journeyEl.classList.remove('journey--stage');
  }
}

function armJourney() {
  if (journeyObserver || !journeyEl) return;
  journeyObserver = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    journeyObserver.disconnect();
    journeyObserver = null;
    if (journeyModule) { startJourneyScene(); return; }
    import('./scene-journey.js')
      .then((m) => { journeyModule = m; startJourneyScene(); })
      .catch((err) => {
        console.warn('[portfolio] journey module failed to load', err);
        journeyEl.classList.remove('journey--stage');
      });
  }, { rootMargin: '800px 0px' });
  journeyObserver.observe(journeyEl);
}

function syncJourneyMode() {
  if (!journeyEl) return;
  const want = journeyAllowed();
  const has = journeyEl.classList.contains('journey--stage');
  if (want && !has) {
    journeyEl.classList.add('journey--stage');
    if (journeyModule) startJourneyScene();
    else armJourney();
  } else if (!want && has) {
    journeyEl.classList.remove('journey--stage');
    if (journeyObserver) { journeyObserver.disconnect(); journeyObserver = null; }
    if (journeyScene) { journeyScene.destroy(); journeyScene = null; }
  } else if (want && has && !journeyScene && !journeyObserver) {
    armJourney();
  }
}

syncJourneyMode();

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => { syncJourneyMode(); loadHero(); }, 150);
}, { passive: true });

document.addEventListener('motionchange', () => {
  syncJourneyMode();
  if (heroScene) heroScene.setReducedMotion(reduced());
});
