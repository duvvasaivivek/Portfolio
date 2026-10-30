import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const url = 'http://127.0.0.1:8766/';
let server;
async function ready() {
  let response;
  try { response = await fetch(url, {signal:AbortSignal.timeout(700)}); }
  catch { return false; }
  const html = await response.text();
  if (!response.ok || !html.includes('id="journeyHeading"') || !html.includes('Duvva Sai Vivek')) {
    throw new Error('Port 8766 is being used by another app. Close that app and try again.');
  }
  return true;
}
try {
  if (!await ready()) {
    server = spawn(process.execPath, ['scripts/serve.mjs'], {cwd:root, stdio:'inherit', windowsHide:true});
    server.on('error', error => { console.error(error.message); process.exitCode = 1; });
    let started = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      if (await ready()) { started = true; break; }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!started) throw new Error('The portfolio preview could not start. Run npm run dev to see the error.');
  }
  console.log(`Interactive portfolio: ${url}#experience`);
  if (server) console.log('Keep this window open while previewing. Press Ctrl+C to stop.');
  if (process.platform === 'win32') {
    const browser = spawn('powershell.exe', ['-NoProfile','-Command',"Start-Process 'http://127.0.0.1:8766/#experience'"], {stdio:'ignore', windowsHide:true});
    browser.on('error', () => console.log('Open the preview URL above in your browser.'));
  }
} catch (error) {
  console.error(error.message);
  server?.kill();
  process.exitCode = 1;
}
process.on('SIGINT', () => { server?.kill(); process.exit(0); });
