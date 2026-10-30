import { milestonesData, journeyOrder } from './data.js';
import { milestoneProject } from './profile.js';
import { journeyState } from './journey-state.js';

export function initJourney() {
  const drawer = document.getElementById('milestoneDrawer');
  if (!drawer) return;
  const field = id => document.getElementById(id);
  let current = 0;
  let opener = null;
  let drawerIds = [...journeyOrder];
  const section = field('experience');
  const rail = [...section.querySelectorAll('[data-journey-id]')];
  const filters = [...section.querySelectorAll('[data-journey-filter]')];
  const jump = field('journeyJump');
  function reflect(state) {
    const m = milestonesData[state.activeId];
    field('journeyActiveDate').textContent = m.date;
    field('journeyActiveTitle').textContent = m.title;
    field('journeyActiveOrg').textContent = m.org;
    field('journeyActiveBtn').dataset.milestoneId = state.activeId;
    field('journeyPrev').disabled = state.index === 0;
    field('journeyNext').disabled = state.index === state.ids.length - 1;
    field('journeyCount').textContent = `${state.index + 1} of ${state.ids.length}`;
    field('journeyProgress').max = state.ids.length;
    field('journeyProgress').value = state.index + 1;
    field('journeyAchievement').hidden = state.activeId !== 8;
    rail.forEach(button => {
      const id = Number(button.dataset.journeyId);
      button.closest('li').hidden = !state.ids.includes(id);
      if (id === state.activeId) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.journeyFilter === state.filter)));
    jump.replaceChildren(...state.ids.map(id => {
      const option = document.createElement('option'), item = milestonesData[id];
      option.value = id; option.textContent = `${item.date} · ${item.title} · ${item.org}`;
      return option;
    }));
    jump.value = state.activeId;
  }
  journeyState.subscribe(reflect);
  reflect(journeyState.snapshot());
  filters.forEach(button => button.addEventListener('click', () => journeyState.setFilter(button.dataset.journeyFilter)));
  function selectFromRail(id) {
    journeyState.select(id);
    if (!section.classList.contains('journey--stage')) {
      section.querySelector('.journey-story').scrollIntoView({block:'center', behavior:matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth'});
    }
  }
  rail.forEach(button => button.addEventListener('click', () => selectFromRail(button.dataset.journeyId)));
  jump.addEventListener('change', () => journeyState.select(jump.value));
  field('journeyPrev').addEventListener('click', () => journeyState.step(-1));
  field('journeyNext').addEventListener('click', () => journeyState.step(1));
  field('journeyList').addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    const button = event.target.closest('[data-journey-id]');
    if (!button) return;
    event.preventDefault();
    const { ids } = journeyState.snapshot();
    const index = ids.indexOf(Number(button.dataset.journeyId));
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? ids.length - 1 : Math.max(0, Math.min(ids.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)));
    rail.find(item => Number(item.dataset.journeyId) === ids[next]).focus({preventScroll:true});
    journeyState.select(ids[next]);
  });

  function fill(index) {
    const id = drawerIds[index];
    const m = milestonesData[id];
    if (!m) return;
    current = index;
    for (const [id, value] of Object.entries({drawerDate:m.date, drawerCat:m.category, drawerTitle:m.title, drawerOrg:`${m.org} · ${m.subtitle}`, drawerDesc:m.desc, drawerImpact:m.impact, drawerTags:m.tags.join(', '), drawerCounter:`${index + 1} of ${drawerIds.length}`})) field(id).textContent = value;
    const image = field('drawerImg');
    field('drawerMedia').hidden = !m.img;
    if (m.img) { image.src = m.img; image.alt = `Image from ${m.title}`; }
    else { image.removeAttribute('src'); image.alt = ''; }
    const repo = field('drawerLink');
    repo.hidden = !m.link;
    if (m.link) repo.href = m.link;
    else repo.removeAttribute('href');
    const project = field('drawerCase');
    project.hidden = !milestoneProject[id];
    if (milestoneProject[id]) project.href = `projects/${milestoneProject[id]}.html`;
    else project.removeAttribute('href');
    field('drawerPrevBtn').disabled = index === 0;
    field('drawerNextBtn').disabled = index === drawerIds.length - 1;
    drawer.querySelector('.drawer-body').scrollTop = 0;
  }

  window.openMilestoneDrawer = id => {
    drawerIds = journeyState.snapshot().ids;
    const index = drawerIds.indexOf(Number(id));
    if (index < 0) return;
    fill(index);
    if (!drawer.open) { opener = document.activeElement; drawer.showModal(); }
  };
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const milestone = event.target.closest('[data-milestone-id]');
    if (milestone) window.openMilestoneDrawer(milestone.dataset.milestoneId);
    if (event.target.closest('[data-close]')) drawer.close();
  });
  drawer.addEventListener('click', event => { if (event.target === drawer) drawer.close(); });
  drawer.addEventListener('close', () => { if (opener?.isConnected) opener.focus({preventScroll:true}); });
  field('drawerPrevBtn').addEventListener('click', () => { if (current > 0) fill(current - 1); });
  field('drawerNextBtn').addEventListener('click', () => { if (current < drawerIds.length - 1) fill(current + 1); });
  field('drawerImg').addEventListener('error', () => { field('drawerMedia').hidden = true; });
}
