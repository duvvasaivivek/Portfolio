/**
 * DOM behaviour: navigation, dialogs, contact form, clipboard, toast, motion preference.
 * No 3D code lives here; the page is fully usable if js/scenes.js never runs.
 */

import { projectsData, milestonesData, MILESTONE_COUNT, skillsData, architectureData, placesData } from './data.js';

const html = document.documentElement;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* -------------------------------------------------------------------
   Motion preference (footer toggle + system setting)
   ------------------------------------------------------------------- */

const MOTION_KEY = 'portfolio_motion';
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionToggle = $('#motionToggle');

function applyMotion(reduced, { persist = false, announce = false } = {}) {
  html.classList.toggle('reduce-motion', reduced);
  if (motionToggle) {
    motionToggle.textContent = reduced ? 'Motion: off' : 'Motion: on';
    motionToggle.setAttribute('aria-pressed', String(reduced));
  }
  if (persist) {
    try { localStorage.setItem(MOTION_KEY, reduced ? 'off' : 'on'); } catch (e) { /* storage unavailable */ }
  }
  document.dispatchEvent(new CustomEvent('motionchange', { detail: { reduced } }));
  if (announce) showToast(reduced ? 'Motion off' : 'Motion on');
}

(function initMotion() {
  let stored = null;
  try { stored = localStorage.getItem(MOTION_KEY); } catch (e) { /* ignore */ }
  const reduced = stored ? stored === 'off' : motionQuery.matches;
  applyMotion(reduced);
  motionQuery.addEventListener('change', (e) => {
    let s = null;
    try { s = localStorage.getItem(MOTION_KEY); } catch (err) { /* ignore */ }
    if (!s) applyMotion(e.matches);
  });
  if (motionToggle) {
    motionToggle.addEventListener('click', () => {
      applyMotion(!html.classList.contains('reduce-motion'), { persist: true, announce: true });
    });
  }
})();

/* -------------------------------------------------------------------
   Header: scrolled state and active section
   ------------------------------------------------------------------- */

const header = $('#siteHeader');
const navLinks = $$('.site-nav a');

function updateScrolled() {
  header.classList.toggle('scrolled', window.scrollY > 8);
}
updateScrolled();
window.addEventListener('scroll', updateScrolled, { passive: true });

(function initActiveNav() {
  const sections = $$('main section[id]');
  if (!('IntersectionObserver' in window) || !sections.length) return;
  const byId = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const id = entry.target.id;
      navLinks.forEach((a) => a.classList.remove('is-active'));
      const link = byId.get(id);
      if (link) link.classList.add('is-active');
    }
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach((s) => io.observe(s));
})();

/* -------------------------------------------------------------------
   Mobile navigation
   ------------------------------------------------------------------- */

const navToggle = $('#navToggle');
const navMenu = $('#navMenu');

function setNavOpen(open) {
  navMenu.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
}

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const open = !navMenu.classList.contains('open');
    setNavOpen(open);
    if (open) navLinks[0]?.focus();
  });
  navLinks.forEach((a) => a.addEventListener('click', () => setNavOpen(false)));
  document.addEventListener('click', (e) => {
    if (!navMenu.classList.contains('open')) return;
    if (!header.contains(e.target)) setNavOpen(false);
  });
}

/* -------------------------------------------------------------------
   Dialog helpers
   ------------------------------------------------------------------- */

const openers = new WeakMap();

function openDialog(dialog) {
  if (!dialog || dialog.open) return;
  openers.set(dialog, document.activeElement);
  dialog.showModal();
}

function wireDialog(dialog) {
  if (!dialog) return;
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    const opener = openers.get(dialog);
    if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
  });
}

/* -------------------------------------------------------------------
   Milestone drawer
   ------------------------------------------------------------------- */

const drawer = $('#milestoneDrawer');
const drawerEls = {
  date: $('#drawerDate'),
  cat: $('#drawerCat'),
  title: $('#drawerTitle'),
  org: $('#drawerOrg'),
  media: $('#drawerMedia'),
  img: $('#drawerImg'),
  desc: $('#drawerDesc'),
  impact: $('#drawerImpact'),
  tags: $('#drawerTags'),
  linkWrap: $('#drawerLinkWrap'),
  link: $('#drawerLink'),
  prev: $('#drawerPrevBtn'),
  next: $('#drawerNextBtn'),
  counter: $('#drawerCounter')
};
let currentMilestone = 1;

function fillDrawer(id) {
  const data = milestonesData[id];
  if (!data) return false;
  currentMilestone = Number(id);
  drawerEls.date.textContent = data.date;
  drawerEls.cat.textContent = data.category;
  drawerEls.title.textContent = data.title;
  drawerEls.org.textContent = `${data.org} · ${data.subtitle}`;
  drawerEls.desc.textContent = data.desc;
  drawerEls.impact.textContent = data.impact;
  drawerEls.tags.textContent = data.tags.join(', ');
  if (data.link) {
    drawerEls.linkWrap.hidden = false;
    drawerEls.link.href = data.link;
  } else {
    drawerEls.linkWrap.hidden = true;
  }
  if (data.img) {
    drawerEls.media.hidden = false;
    drawerEls.img.src = data.img;
    drawerEls.img.alt = `Photograph from ${data.title}`;
  } else {
    drawerEls.media.hidden = true;
    drawerEls.img.removeAttribute('src');
    drawerEls.img.alt = '';
  }
  drawerEls.counter.textContent = `${currentMilestone} of ${MILESTONE_COUNT}`;
  drawerEls.prev.disabled = currentMilestone <= 1;
  drawerEls.next.disabled = currentMilestone >= MILESTONE_COUNT;
  return true;
}

window.openMilestoneDrawer = function openMilestoneDrawer(id) {
  if (!drawer || !fillDrawer(id)) return;
  openDialog(drawer);
  drawer.querySelector('.drawer-body').scrollTop = 0;
};

if (drawer) {
  wireDialog(drawer);
  drawerEls.img.addEventListener('error', () => { drawerEls.media.hidden = true; });
  drawerEls.prev.addEventListener('click', () => { if (currentMilestone > 1) fillDrawer(currentMilestone - 1); });
  drawerEls.next.addEventListener('click', () => { if (currentMilestone < MILESTONE_COUNT) fillDrawer(currentMilestone + 1); });
}

/* -------------------------------------------------------------------
   Project dialog
   ------------------------------------------------------------------- */

const projectModal = $('#projectModal');
const modalBody = $('#modalBody');

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

window.openProjectModal = function openProjectModal(projectId) {
  const data = projectsData[projectId];
  if (!data || !projectModal || !modalBody) return;
  const repo = data.github
    ? `<a href="${escapeHtml(data.github)}" target="_blank" rel="noopener noreferrer">Repository</a>`
    : '<span class="case-meta">Repository not public</span>';
  modalBody.innerHTML = `
    <p class="eyebrow">${escapeHtml(data.category)}</p>
    <h2 class="modal-title" id="modalTitle">${escapeHtml(data.title)}</h2>
    <p class="case-meta">${escapeHtml(data.metric)}</p>
    <p class="modal-sub">Overview</p>
    <p>${escapeHtml(data.overview)}</p>
    <p class="modal-sub">Implementation</p>
    <ul>${data.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>
    <p class="modal-sub">Technologies</p>
    <p>${data.tags.map(escapeHtml).join(', ')}</p>
    <div class="modal-actions">${repo}<button type="button" class="text-link" data-close>Close</button></div>
  `;
  openDialog(projectModal);
  modalBody.scrollTop = 0;
};

if (projectModal) wireDialog(projectModal);

/* -------------------------------------------------------------------
   Delegated clicks
   ------------------------------------------------------------------- */

document.addEventListener('click', (e) => {
  const target = e.target instanceof Element ? e.target : null;
  if (!target) return;

  const closeBtn = target.closest('[data-close]');
  if (closeBtn) {
    closeBtn.closest('dialog')?.close();
    return;
  }

  const projectBtn = target.closest('[data-project]');
  if (projectBtn) {
    window.openProjectModal(projectBtn.getAttribute('data-project'));
    return;
  }

  const milestoneBtn = target.closest('[data-milestone-id]');
  if (milestoneBtn) {
    window.openMilestoneDrawer(milestoneBtn.getAttribute('data-milestone-id'));
    return;
  }

  const copyBtn = target.closest('[data-copy]');
  if (copyBtn) {
    copyText(copyBtn.getAttribute('data-copy'), copyBtn.getAttribute('data-copy-label') || 'Text');
  }
});

/* -------------------------------------------------------------------
   Contact form (mailto)
   ------------------------------------------------------------------- */

const contactForm = $('#contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#senderName').value.trim();
    const email = $('#senderEmail').value.trim();
    const subject = $('#msgSubject').value.trim();
    const message = $('#msgBody').value.trim();
    if (!name || !email || !message) {
      showToast('Please complete the name, email, and message fields.');
      return;
    }
    const body = `From: ${name} (${email})\n\n${message}`;
    const mailto = `mailto:duvvasaivivek@gmail.com?subject=${encodeURIComponent(subject || `Message from ${name} via portfolio`)}&body=${encodeURIComponent(body)}`;
    showToast('Opening your email client.');
    window.location.href = mailto;
  });
}

/* -------------------------------------------------------------------
   Clipboard and toast
   ------------------------------------------------------------------- */

function copyText(text, label) {
  if (!navigator.clipboard) {
    showToast('Could not copy. Please select the text manually.');
    return;
  }
  navigator.clipboard.writeText(text)
    .then(() => showToast(`${label} copied.`))
    .catch(() => showToast('Could not copy. Please select the text manually.'));
}

const toast = $('#siteToast');
let toastTimer = 0;

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2800);
}

window.showToast = showToast;

/* -------------------------------------------------------------------
   Dev-only consistency check between markup and data
   ------------------------------------------------------------------- */

if (['localhost', '127.0.0.1'].includes(location.hostname)) {
  $$('[data-project]').forEach((el) => {
    const key = el.getAttribute('data-project');
    if (!projectsData[key]) console.warn(`[portfolio] No projectsData entry for "${key}"`);
  });
  $$('.journey-btn[data-milestone-id]').forEach((el) => {
    const key = el.getAttribute('data-milestone-id');
    if (!milestonesData[key]) console.warn(`[portfolio] No milestonesData entry for "${key}"`);
  });
  const skillIds = new Set(skillsData.groups.flatMap((g) => g.items.map((i) => i.id)));
  $$('.term[data-skill]').forEach((el) => {
    const key = el.getAttribute('data-skill');
    if (!skillIds.has(key)) console.warn(`[portfolio] No skillsData item for "${key}"`);
  });
  Object.keys(projectsData).forEach((key) => {
    if (!architectureData[key]) console.warn(`[portfolio] No architectureData entry for "${key}"`);
    if (!document.getElementById(`project-${key}`)) console.warn(`[portfolio] No case row with id "project-${key}"`);
  });
  placesData.forEach((p) => {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) console.warn(`[portfolio] Place "${p.id}" has no coordinates`);
  });
}
