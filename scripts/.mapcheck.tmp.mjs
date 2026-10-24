import { chromium } from 'playwright-core';
const [B, share] = process.argv.slice(2);
const b = await chromium.launch({ args:['--no-sandbox','--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
const errs=[]; p.on('pageerror',e=>errs.push('PE '+e.message.slice(0,300))); p.on('console',m=>{if(m.type()==='error'||/spatial|cesium/i.test(m.text()))errs.push(m.type()+' '+m.text().slice(0,200))});
const js=[]; p.on('request',r=>{ if(/esium/.test(r.url())) js.push(r.url().split('/').pop().slice(0,40)) });
if (share) await p.goto(B+'/?_vercel_share='+share,{waitUntil:'load'});
const t0=Date.now();
await p.goto(B+'/story?map=live',{waitUntil:'load'});
await p.evaluate(()=>document.querySelector('.s-tl-section')?.scrollIntoView({block:'start'}));
try { await p.waitForFunction(()=>window.__DARWIN_SPATIAL_VIEWER__?.getStatus?.().isReady===true,null,{timeout:90000}); console.log('READY ms', Date.now()-t0); }
catch { console.log('NOT READY; status=', await p.evaluate(()=>JSON.stringify(window.__DARWIN_SPATIAL_VIEWER__?.getStatus?.() ?? 'no viewer'))); }
console.log('cesium reqs:', js.length, js.slice(0,4).join(' '));
console.log('errors:\n'+errs.slice(0,8).join('\n'));
await b.close();
