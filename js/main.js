import { initJourney } from './journey-ui.js';
initJourney();
document.documentElement.classList.add('js');
const $ = selector => document.querySelector(selector);
const toggle=$('#navToggle'),menu=$('#navMenu');
function closeMenu(restore=false){if(!menu||!toggle)return;menu.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');if(restore)toggle.focus();}
toggle?.addEventListener('click',()=>{const open=!menu.classList.contains('open');menu.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu()));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.classList.contains('open'))closeMenu(true);});
document.addEventListener('click',e=>{if(!$('#siteHeader')?.contains(e.target))closeMenu();});
const mobile=matchMedia('(max-width:700px)');mobile.addEventListener('change',()=>closeMenu());
let toastTimer;
function toast(message){const el=$('#siteToast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3200);}
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(button.dataset.copy);toast('Email address copied.');}catch{toast('Please select and copy the email address above.');}}));
const sections=document.querySelectorAll('main section[id]');
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;menu?.querySelectorAll('a').forEach(a=>{const current=a.getAttribute('href')===`#${entry.target.id}`;a.classList.toggle('is-active',current);if(current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}},{rootMargin:'-20% 0px -60% 0px'});sections.forEach(s=>observer.observe(s));}
// The optional diagrams share the same destinations as the ordinary project links.
window.openProjectModal=id=>{if(/^[a-z]+$/.test(id))location.href=`projects/${id}.html`;};
const visualToggle = $('#visualToggle'), visualStatus = $('#visualStatus');
const visualButtons = [visualToggle, $('#journeyVisualToggle')].filter(Boolean);
const visualStatuses = [visualStatus, $('#journeyVisualStatus')].filter(Boolean);
const wide = matchMedia('(min-width:1024px)'), motion = matchMedia('(prefers-reduced-motion:reduce)');
let scenes = null, enabled = false, desired = !new URLSearchParams(location.search).has('no3d');
let revision = 0, syncing = false;
let appliedMotion = motion.matches;
function reflect() {
  for (const button of visualButtons) {
    button.hidden = !wide.matches;
    button.setAttribute('aria-pressed', String(enabled));
    button.textContent = enabled ? 'Switch to simple view' : 'Enable 3D experience';
  }
}
function status(message) { visualStatuses.forEach(element => { element.textContent = message; }); }
async function syncVisuals() {
  revision++;
  if (syncing) return;
  syncing = true;
  visualButtons.forEach(button => { button.disabled = true; });
  let handled;
  do {
    handled = revision;
    const want = wide.matches && desired;
    try {
      if (enabled && (!want || appliedMotion !== motion.matches)) { scenes.disable(); enabled = false; }
      if (want && !enabled) {
        status('Loading the 3D experience...');
        scenes ??= await import('./scenes.js');
        appliedMotion = motion.matches;
        await scenes.enable({reducedMotion: appliedMotion});
        enabled = true;
      }
      status(enabled && appliedMotion ? 'Reduced motion: use the milestone controls to explore the 3D journey.' : '');
    } catch (error) {
      scenes?.disable(); enabled = false;
      status('3D could not load. The timeline and project links are still available.');
      console.warn('3D experience unavailable:', error);
    }
  } while (handled !== revision);
  syncing = false;
  visualButtons.forEach(button => { button.disabled = false; });
  reflect();
}
if (visualToggle) {
  reflect();
  visualButtons.forEach(button => button.addEventListener('click', async () => {
    desired = !enabled;
    const url = new URL(location.href);
    if (desired) url.searchParams.delete('no3d');
    else url.searchParams.set('no3d', '');
    history.replaceState(null, '', url);
    await syncVisuals();
    if (button.id === 'journeyVisualToggle') {
      const section = $('#experience');
      window.scrollTo({top:section.getBoundingClientRect().top + window.scrollY, behavior:'instant'});
    }
  }));
  wide.addEventListener('change', syncVisuals);
  motion.addEventListener('change', syncVisuals);
  syncVisuals();
}
