import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {projectOrder,milestonesData,journeyOrder} from '../js/data.js';
import {profile} from '../js/profile.js';
const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);
const pages=['index.html',...projectOrder.map(id=>`projects/${id}.html`)];
const ids=new Map();
for(const page of pages){const html=await readFile(page,'utf8');const list=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(list.length,new Set(list).size,`${page}: duplicate IDs`);ids.set(page,new Set(list));assert.match(html,/<h1[ >]/);assert.doesNotMatch(html,/saivivekduvva|Late 2024|Early 2025|Mid 2025|Oct–Dec 2025|Nov 2025–Jan 2026|Dec 2025–Jan 2026/);}
let links=0;
for(const page of pages){const html=await readFile(page,'utf8');for(const [,ref] of html.matchAll(/\s(?:href|src)="([^"]+)"/g)){if(/^(https?:|mailto:|tel:|data:)/.test(ref))continue;const [withoutHash,hash]=ref.split('#');const clean=decodeURIComponent(withoutHash.split('?')[0]);const target=clean?path.posix.normalize(path.posix.join(path.posix.dirname(page),clean)):page;assert.ok(!target.startsWith('../'),`${page}: path escapes root`);assert.ok((await stat(target)).isFile(),`${page}: missing ${ref}`);if(hash&&ids.has(target))assert.ok(ids.get(target).has(hash),`${page}: missing fragment ${ref}`);links++;}for(const [,set]of html.matchAll(/\ssrcset="([^"]+)"/g)){for(const candidate of set.split(',')){const target=path.join(path.dirname(page),candidate.trim().split(/\s/)[0]);assert.ok((await stat(target)).isFile(),`Missing srcset ${target}`);}}}
for(const folder of ['js','scripts'])for(const file of await readdir(folder)){if(!/\.(js|mjs)$/.test(file))continue;const checked=spawnSync(process.execPath,['--check',path.join(folder,file)],{encoding:'utf8'});assert.equal(checked.status,0,checked.stderr);}
assert.equal(milestonesData[8].date,'Mar 2026');assert.equal(milestonesData[1].date,'Oct 2025');assert.equal(milestonesData[4].date,'Dec 2025');for(const id of [2,3,6,7])assert.equal(milestonesData[id].date,'Jan 2026');assert.equal(milestonesData[5].date,'Nov 2025');assert.ok((await stat(profile.resume)).size>1000);
const homepage=await readFile('index.html','utf8');
const timeline=homepage.match(/<ol class="journey-list"[^>]*>([\s\S]*?)<\/ol>/)?.[1];
assert.ok(timeline,'Missing Journey timeline');
assert.deepEqual([...timeline.matchAll(/data-journey-id="(\d+)"/g)].map(m=>Number(m[1])),journeyOrder,'Journey buttons must use chronological IDs');
assert.deepEqual([...journeyOrder].sort((a,b)=>a-b),Object.keys(milestonesData).map(Number).sort((a,b)=>a-b),'Every milestone must appear once');
const dates=journeyOrder.map(id=>Date.parse('1 '+milestonesData[id].date));
assert.ok(dates.every((date,i)=>Number.isFinite(date)&&(i===0||date>=dates[i-1])),'Journey dates must ascend');
for(const id of ['spineCanvas','spineLabels','journeyActiveDate','journeyActiveTitle','journeyActiveOrg','journeyActiveBtn','milestoneDrawer','drawerPrevBtn','drawerNextBtn'])assert.ok(ids.get('index.html').has(id),`Missing interactive hook: ${id}`);
console.log(`Passed: ${pages.length} HTML pages, ${links} local links/assets, image sources, section anchors, confirmed dates, and JavaScript syntax.`);
