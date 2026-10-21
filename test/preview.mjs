import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {whaleDir} from './widget.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const baseline=process.argv.includes('--baseline');
const browser=await chromium.launch({...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const p=new URL(route.request().url()).pathname;
  if(p.endsWith('.png'))return route.fulfill({contentType:'image/png',body:fs.readFileSync(path.join(whaleDir,'assets/DSniang1.png'))});
  return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:14px system-ui;background:#f5f5f7;color:#203170}</style></head><body><div id="root"><textarea data-composer-input></textarea></div></body></html>'});
 });
 await page.goto('http://dsh-russian.test/');
 await page.evaluate(()=>{
  const first={kind:'custom',modules:[
   // Match the screenshot without a balance-card header signature.
   {type:'balance',size:20,rgb:'indigo',tpl:'{balance_ds}'},
   {type:'today',size:4,tpl:'今日已用 {expense_ds}'},
   {type:'peak',size:2,peakStyle:'mini',tpl:'{status}',row:4,bold:true,offBgRgb:'bamboo'},
   {type:'peak',size:4,peakStyle:'count',tpl:'{countdown}',row:4},
   {type:'random',lines:[{t:'疯狂星期四你能V50亿token吗...',w:1,bold:true,size:12}]}]};
  const model={id:'deepseek',name:'DeepSeek',builtin:true,provider:'deepseek',balance:0,currency:'USD',todayUsage:0,todayUsageCurrency:'USD',balanceMode:'api',usageSource:'balance',canAdjustBalance:true};
  const data={ok:true,version:'0.4.2',versionLabel:'v0.4.2',currency:'USD',totalBalance:0,todayUsage:0,groups:[],fragments:[],roles:[],images:[],models:[model],settings:{},items:[],days:[],pending:null,config:{v:1,items:[first],lib:[],frames:[{id:'custom-menu',name:'菜单',shape:'classic'},{id:'custom-follow',name:'跟随保底',shape:'classic'}]}};
  window.fixtureData=data;window.configSnapshot=JSON.stringify(data.config);window.posts=[];
  window.fetch=async(url,options)=>{if(options?.method==='POST')posts.push({url,body:options.body});return{ok:true,status:200,json:async()=>structuredClone(data),arrayBuffer:async()=>new ArrayBuffer(0)}};
  window.localeMock={active:'ru',listeners:new Set(),getSnapshot(){return{active:this.active}},subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}};
  window.cleanups=[];window.__ModuleLoader__={load({factory}){factory().apply({locale:localeMock,effect(fn){cleanups.push(fn())}})}};
  window.switchLocale=value=>{localeMock.active=value;for(const fn of localeMock.listeners)fn()};
 });
 await page.addScriptTag({content:fs.readFileSync(path.join(whaleDir,'assets/whale-widget.js'),'utf8')});
 await page.addScriptTag({content:fs.readFileSync(root+(baseline?'/test-results/baseline-client.js':'/lib/client.js'),'utf8')});
 await page.waitForFunction(()=>document.querySelector('.dshwv-menu-btn')?.title==='Меню');
 await page.locator('.dshwv-menu-btn').click();
 await page.getByRole('button',{name:'Облачка по нажатию',exact:true}).click();
 await page.locator('.dshwv-bubmask:visible .dshwv-bubchip').first().click();
 async function settle(){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));}
 const preview=page.locator('.dshwv-bubmask:visible .dshwv-bubprev .dshwv-text').last();
 await preview.waitFor();
 const report=[];
 for(const width of [1440,630,390]) {
  await page.setViewportSize({width,height:1000});await settle();
  if(!baseline)await page.waitForFunction(()=>document.querySelector('.dshwv-bubmask[style*="flex"] .dshwv-bubprev .dshwv-trow')?.style.getPropertyPriority('white-space')==='important');
  await settle();
  const m=await preview.evaluate(card=>{
   const safe=card.getBoundingClientRect(),range=document.createRange(),overflow=[];
   for(const row of card.querySelectorAll('.dshwv-trow')){
    range.selectNodeContents(row);
    for(const r of range.getClientRects())if(r.left<safe.left-1||r.right>safe.right+1||r.top<safe.top-1||r.bottom>safe.bottom+1)overflow.push({text:row.textContent,r:r.toJSON(),safe:safe.toJSON()});
   }
   return{text:card.textContent,overflow,canvas:card.parentElement.getBoundingClientRect().toJSON(),rows:[...card.querySelectorAll('.dshwv-trow')].map(r=>({text:r.textContent,font:parseFloat(getComputedStyle(r).fontSize),height:r.getBoundingClientRect().height}))};
  });
  report.push({width,...m});
  await page.screenshot({path:root+'/test-results/first-click-'+(baseline?'before':'after')+'-'+width+'.png'});
  if(!baseline){
   assert.match(m.text,/0\.00 USD/);assert.doesNotMatch(m.text,/[\u3400-\u9fff]/);assert.match(m.text,/Сегодня 0.00 USD/);assert.match(m.text,/В этот безумный четверг/);assert.match(m.text,/Льг\.|Пик/);
   assert.deepEqual(m.overflow,[],JSON.stringify(m));
   assert.ok(m.canvas.left>=0 && m.canvas.right<=width,'unchanged preview canvas stays within viewport');
   assert.ok(m.rows.every(row=>row.font>=10),'all default preview rows remain readable');
   const speech=m.rows.find(r=>r.text.includes('безумный четверг'));
   assert.ok(speech.font>=8,'default preview speech must remain readable');assert.ok(speech.height>speech.font*1.5,'speech wraps, not clips');
   assert.match(await page.locator('.dshwv-bubmask:visible .dshwv-bubtitle').last().textContent(),/Нажатие 1/);
  }
 }
 if(!baseline){
  const speechDictionary=JSON.parse(fs.readFileSync(root+'/locales/whale-speech.json','utf8'));
  for(const phrase of ['菜单','今日已用','好模型...↓','疯狂星期四你能V50亿token吗...']) {
   await page.locator('.dshwv-bubmask:visible .dshwv-pvlab').filter({hasText:'Случайные фразы'}).last().click();
   const input=page.locator('.dshwv-bubmask:visible input.dshwv-linetx').last();
   await input.fill(phrase);await settle();assert.equal(await input.inputValue(),phrase);
   await input.locator('xpath=ancestor::div[contains(@class,"dshwv-bubcard")]').getByRole('button',{name:'Сохранить',exact:true}).click();
   await settle();
   assert.ok((await preview.textContent()).includes(speechDictionary[phrase]??phrase));
   assert.equal(await preview.locator('.dshwv-trow').first().evaluate(row=>row.style.whiteSpace),'normal');
  }
  await page.setViewportSize({width:1440,height:1000});await settle();
  const frameButton=page.locator('.dshwv-bubmask:visible .dshwv-framebtn').last();
  for(const name of ['菜单','跟随保底']) {
   await frameButton.click();
   const custom=page.locator('.dshwv-framemenu:visible .dshwv-fcardname').filter({hasText:new RegExp('^'+name+'$')}).last();
   assert.equal(await custom.textContent(),name);await custom.locator('..').click();await settle();
   assert.equal(await frameButton.locator('.dshwv-framebtntext').textContent(),'Рамка: '+name);
  }
  await frameButton.click();
  await page.locator('.dshwv-framemenu:visible .dshwv-fcardname').filter({hasText:'跟随保底框'}).last().locator('..').click();await settle();
  await page.evaluate(()=>{
   const box=document.createElement('div');box.className='dshwv-bubprev';box.id='opaque-preview';
   box.innerHTML='<div class="dshwv-text"><div class="dshwv-trow">菜单</div><div class="dshwv-trow">今日已用</div><div class="dshwv-trow">跟随保底</div></div><input value="今日已用"><textarea>菜单</textarea><span class="dshwv-fcardname">跟随保底</span><span class="dshwv-pvlab">菜单</span><span class="dshwv-pvlab">今日已用</span>';
   document.body.append(box);window.opaque=box;
  });await settle();
  assert.equal(await page.locator('#opaque-preview .dshwv-text').textContent(),'菜单今日已用跟随保底');
  assert.equal(await page.locator('#opaque-preview input').inputValue(),'今日已用');assert.equal(await page.locator('#opaque-preview textarea').inputValue(),'菜单');
  assert.equal(await page.locator('#opaque-preview .dshwv-fcardname').textContent(),'跟随保底');
  assert.deepEqual(await page.locator('#opaque-preview .dshwv-pvlab').allTextContents(),['菜单','今日已用']);
  // Native preview rerenders replace row identities, sometimes with identical content.
  await page.evaluate(()=>switchLocale('en'));await settle();
  const originalMarkup=await preview.innerHTML();
  await page.evaluate(()=>switchLocale('ru'));await settle();
  await preview.evaluate((card,markup)=>{card.innerHTML=markup;},originalMarkup);await settle();
  assert.equal(await preview.locator('.dshwv-trow').first().evaluate(row=>row.style.whiteSpace),'normal');
  const geometry=await preview.evaluate(card=>({stage:card.parentElement.getAttribute('style'),pop:card.parentElement.parentElement.getAttribute('style')}));
  await page.evaluate(()=>switchLocale('en'));await settle();
  assert.match(await preview.textContent(),/疯狂星期四/);assert.match(await preview.textContent(),/今日已用 0.00 USD/);
  assert.equal(await preview.locator('.dshwv-trow').first().evaluate(row=>row.style.getPropertyPriority('font-size')),'');
  assert.deepEqual(await preview.evaluate(card=>({stage:card.parentElement.getAttribute('style'),pop:card.parentElement.parentElement.getAttribute('style')})),geometry);
  await page.evaluate(()=>switchLocale('ru'));await settle();assert.match(await preview.textContent(),/В этот безумный четверг/);
  await page.evaluate(()=>{window.detachedPreview=document.querySelector('.dshwv-bubmask[style*="flex"] .dshwv-bubprev');detachedPreview.remove();for(const cleanup of cleanups)cleanup();});
  assert.match(await page.evaluate(()=>detachedPreview.textContent),/疯狂星期四/);
  assert.equal(await page.evaluate(()=>detachedPreview.querySelector('.dshwv-trow').style.getPropertyPriority('font-size')),'');
  assert.equal(await page.evaluate(()=>JSON.stringify(fixtureData.config)),await page.evaluate(()=>configSnapshot));
  assert.deepEqual(await page.evaluate(()=>posts),[]);assert.deepEqual(errors,[]);
 }
 fs.writeFileSync(root+'/test-results/preview-'+(baseline?'before':'after')+'.json',JSON.stringify(report,null,2));
 console.log('Actual compiled-bundle first-click preview:',baseline?'baseline captured':'passed at 1440, 630, 390');
}finally{await browser.close()}
