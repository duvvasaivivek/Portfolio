import { milestonesData, journeyOrder } from '../js/data.js';
const h = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const first = milestonesData[journeyOrder[0]];
const years = [...new Set(journeyOrder.map(id=>milestonesData[id].year))];
const shortNames = {1:'GDG',5:'Elevate Labs',4:'Hackxios',2:'AIgnite',3:'Devfest',6:'Infosys',7:'IBM',8:'Agentica'};

export const journey = `
<section class="section journey" id="experience" aria-labelledby="journeyHeading">
  <div class="journey-track">
    <div class="journey-stage">
      <canvas class="journey-canvas" aria-hidden="true"></canvas>
      <div class="journey-overlay container">
        <div class="journey-head">
          <p class="eyebrow">02 / Journey</p>
          <h2 id="journeyHeading">Internships, hackathons,<br>and everything learned along the way.</h2>
          <p>Eight milestones, October 2025 to March 2026. Select one to explore the work behind it.</p>
          <a class="skip-stage text-link" href="#skills">Skip the journey ↓</a>
          <button class="text-link journey-view-toggle" type="button" id="journeyVisualToggle" aria-pressed="false" hidden>Enable 3D experience</button>
          <p class="journey-visual-status" id="journeyVisualStatus" role="status"></p>
        </div>
        <div class="journey-controls">
          <div class="journey-filters" role="group" aria-label="Filter journey">
            <button type="button" data-journey-filter="all" aria-pressed="true">All</button>
            <button type="button" data-journey-filter="internships" aria-pressed="false">Internships</button>
            <button type="button" data-journey-filter="hackathons" aria-pressed="false">Hackathons</button>
          </div>
          <label class="journey-jump">Jump to milestone<select id="journeyJump">${journeyOrder.map(id=>`<option value="${id}">${h(milestonesData[id].date)} · ${h(milestonesData[id].title)} · ${h(milestonesData[id].org)}</option>`).join('')}</select></label>
        </div>
        <div class="journey-story">
        <div class="journey-active" aria-live="polite" aria-atomic="true">
          <span class="journey-active-date" id="journeyActiveDate">${first.date}</span>
          <h3 id="journeyActiveTitle">${h(first.title)}</h3>
          <p id="journeyActiveOrg">${h(first.org)}</p>
          <button type="button" class="text-link" id="journeyActiveBtn" data-milestone-id="${first.id}">Open details →</button>
        </div>
        <aside class="journey-achievement" id="journeyAchievement" aria-label="Agentica achievement" hidden>
          <img src="Images/hackathons/agentica.jpeg" alt="Agentica event badges, notebook and pens" width="320" height="180" loading="lazy">
          <div><p class="eyebrow">Agentica 2.0 · Mar 2026</p><p class="achievement-rank">6th <span>of 240+ teams</span></p><p>Team ByteBuilders · IIIT Sri City</p><a class="text-link" href="projects/civility.html">Explore Civility →</a></div>
        </aside>
        </div>
        <div class="journey-navigation"><button type="button" id="journeyPrev">← Previous</button><span id="journeyCount" role="status">1 of 8</span><button type="button" id="journeyNext">Next →</button></div>
        <progress class="journey-progress" id="journeyProgress" value="1" max="8" aria-label="Journey milestone"></progress>
        <ol class="journey-list" id="journeyList">
          ${journeyOrder.map(id=>{const m=milestonesData[id];return `<li class="journey-item"><button class="journey-btn" type="button" data-journey-id="${id}"><span class="journey-short" aria-hidden="true">${shortNames[id]}</span><span class="journey-marker" aria-hidden="true"></span><span class="journey-date">${m.date}</span><span class="journey-main"><span class="journey-category">${h(m.category)}</span><span class="journey-title">${h(m.title)}</span><span class="journey-org">${h(m.subtitle)}</span></span><span class="journey-cta">Select →</span></button><noscript><p>${h(m.desc)}</p></noscript></li>`}).join('')}
        </ol>
      </div>
      <div class="journey-years" aria-hidden="true">${years.map(year=>`<span>${year}</span>`).join('')}</div>
    </div>
  </div>
</section>`;

export const milestoneDrawer = `
<dialog class="milestone-drawer" id="milestoneDrawer" aria-labelledby="drawerTitle">
  <div class="drawer-panel">
    <div class="drawer-head"><span class="eyebrow" id="drawerDate"></span><button class="text-link" type="button" data-close>Close ×</button></div>
    <div class="drawer-body">
      <p class="eyebrow" id="drawerCat"></p><h2 id="drawerTitle"></h2><p id="drawerOrg"></p>
      <figure id="drawerMedia" hidden><img id="drawerImg" alt=""></figure>
      <h3>What I built</h3><p id="drawerDesc"></p>
      <h3>Outcome</h3><p id="drawerImpact"></p>
      <h3>Technologies</h3><p id="drawerTags"></p>
      <div class="drawer-links"><a class="text-link" id="drawerCase" hidden>Explore project →</a><a class="text-link" id="drawerLink" target="_blank" rel="noopener noreferrer" hidden>Repository ↗</a></div>
    </div>
    <div class="drawer-foot"><button class="text-link" type="button" id="drawerPrevBtn">← Previous</button><span id="drawerCounter"></span><button class="text-link" type="button" id="drawerNextBtn">Next →</button></div>
  </div>
</dialog>`;

export const spine = '<canvas class="spine-canvas" id="spineCanvas" aria-hidden="true"></canvas><div class="spine-labels" id="spineLabels" aria-hidden="true"></div>';
