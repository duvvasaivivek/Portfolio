import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.pdf':'application/pdf'};
const server=http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const parts=pathname.split('/').filter(Boolean);
    if(parts.some(p=>p.startsWith('.')) || !['index.html','projects','Images','Resumes','css','js','favicon.svg','favicon-32.png','apple-touch-icon.png'].includes(parts[0]||'index.html')){res.writeHead(404);res.end('Not found');return;}
    let target=path.resolve(root,'.'+pathname);
    if(target!==path.resolve(root)&&!target.startsWith(root)){res.writeHead(403);res.end();return;}
    if((await stat(target)).isDirectory())target=path.join(target,'index.html');
    res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(target));
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(8766,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:8766'));
