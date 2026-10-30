// Desktop 3D experience. Content and milestone controls also work without WebGL.
let instances = [];
const classes = [['experience','journey--stage'],['portfolio','projects--view'],['skills','skills--view']];

export async function enable({ reducedMotion = false } = {}) {
  if (instances.length) return;
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2');
  if (!gl) throw new Error('WebGL 2 is unavailable');
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  const [journey, projects, skills, spine] = await Promise.all([
    import('./scene-journey.js'),
    import('./scene-projects.js'), import('./scene-skills.js'), import('./scene-spine.js')
  ]);
  try {
    for (const [id, cls] of classes) {
      document.getElementById(id).classList.add(cls);
    }
    document.documentElement.classList.add('spine');
    instances.push(journey.createJourneyScene(document.getElementById('experience'), {reducedMotion}));
    instances.push(projects.createProjectsScene(document.getElementById('portfolio'), {reducedMotion}));
    instances.push(skills.createSkillsScene(document.getElementById('skills'), {reducedMotion}));
    instances.push(spine.createSpineScene(document.getElementById('spineCanvas'), {reducedMotion}));
  } catch (error) { disable(); throw error; }
}

export function disable() {
  for (const scene of instances) {
    try { scene.destroy(); } catch (error) { console.warn('Scene cleanup:', error); }
  }
  instances = [];
  for (const [id, cls] of classes) document.getElementById(id)?.classList.remove(cls);
  document.documentElement.classList.remove('spine');
}
