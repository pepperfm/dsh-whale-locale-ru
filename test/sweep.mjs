import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {whaleDir} from './widget.mjs';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright-core');
const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.join(whaleDir,'assets/whale-widget.js');
fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
const browser=await chromium.launch({...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),headless:true});
const report=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const pathname=new URL(route.request().url()).pathname;
  if(pathname==='/dsh-whale/image.png'||pathname==='/dsh-whale/role-image.png')return route.fulfill({contentType:'image/png',body:fs.readFileSync(path.join(whaleDir,'assets/DSniang1.png'))});
  if(pathname.endsWith('.gif'))return route.fulfill({contentType:'image/gif',body:fs.readFileSync(path.join(whaleDir,'assets/rua.gif'))});
  return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:14px system-ui;background:#f5f5f7;color:#203170}</style></head><body><div id="root"><textarea data-composer-input></textarea></div></body></html>'});
 });
 await page.goto('http://dsh-russian.test/');
 await page.evaluate(()=>{
  const groups=[{id:'duck',name:'小黄鸭',preset:true},{id:'fx1',name:'音效1',preset:true},{id:'custom',name:'小黄鸭',preset:false}];
  const fragments=[{id:'cost_a',name:'每轮消耗·默认',preset:true},{id:'ask_a',name:'提问·默认',preset:true},{id:'approve_a',name:'授权·默认',preset:true},{id:'exp_orb',name:'Minecraft·经验球',preset:true},{id:'end_a',name:'A',preset:true},{id:'custom-file',name:'菜单',preset:false}];
  const model={id:'deepseek',name:'DeepSeek',builtin:true,provider:'deepseek',balance:0,currency:'USD',todayUsage:0,todayUsageCurrency:'USD',balanceMode:'api',usageSource:'balance',canAdjustBalance:true};
  const events={press:{vol:.9},turnCost:{on:true,vol:1,volSet:false,bubbleOn:true},question:{on:true,soundOn:true,sel:'frag:ask_a',vol:1,bubbleOn:true},approval:{on:true,soundOn:true,sel:'frag:approve_a',vol:1,bubbleOn:true}};
  const data={ok:true,version:'0.4.2',versionLabel:'v0.4.2',currency:'USD',totalBalance:0,todayUsage:0,groups,fragments,roles:[],images:[],models:[model],events,settings:{events,taskEnd:{on:true,sel:'frag:cost_a'},wait:{charClose:false}},taskEnd:{on:true,sel:'frag:cost_a'},soundSet:'duck',vol:.9,sound:true,pressOn:true,turnCostOn:true,turnCostCloseMs:5000,items:[],days:[],pending:null};
  window.fetch=async()=>({ok:true,status:200,json:async()=>structuredClone(data),arrayBuffer:async()=>new ArrayBuffer(0)});
  window.localeMock={active:'ru',listeners:new Set(),getSnapshot(){return{active:this.active}},subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}};
 });
 await page.addScriptTag({content:fs.readFileSync(source,'utf8')});
 const files=['whale-text.js','whale-layout.js','whale-adapter.js'].filter(f=>fs.existsSync(root+'/'+f));
 for(const file of files)await page.addScriptTag({content:fs.readFileSync(root+'/'+file,'utf8').replaceAll('export function ','function ')});
 await page.evaluate(({dict,speech})=>{window.disposeWhaleRu=installWhaleTranslation(localeMock,dict,document,speech);if(typeof installWhaleLayout==='function')window.disposeLayout=installWhaleLayout(localeMock);},{dict:JSON.parse(fs.readFileSync(root+'/locales/whale.json','utf8')),speech:JSON.parse(fs.readFileSync(root+'/locales/whale-speech.json','utf8'))});
 await page.waitForFunction(()=>document.querySelector('.dshwv-menu-btn')?.title==='Меню');
 await page.locator('.dshwv-menu-btn').click();
 async function snapshot(name){
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const state=await page.evaluate(()=>{
   const chinese=[],clipped=[];
   for(const el of document.querySelectorAll('[class^="dshwv-"], [class*=" dshwv-"]')){
    if(!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
    if(el.closest('select,textarea,input,[contenteditable],.dshwv-resnm,.dshwv-text,.dshwv-rolename,.dshwv-audioname,.dshwv-custnm'))continue;
    for(const node of el.childNodes)if(node.nodeType===3&&/[\u3400-\u9fff]/.test(node.nodeValue))chinese.push({tag:el.tagName,cls:el.className,text:node.nodeValue.trim()});
    for(const attr of ['title','aria-label','placeholder'])if(/[\u3400-\u9fff]/.test(el.getAttribute(attr)||''))chinese.push({attr,cls:el.className,text:el.getAttribute(attr)});
    const r=el.getBoundingClientRect();
    if((el.tagName==='BUTTON'||el.classList.contains('dshwv-menu-row'))&&r.width>0&&(el.scrollWidth>el.clientWidth+2||r.left<-.5||r.right>innerWidth+.5))clipped.push({cls:el.className,text:el.textContent.trim().slice(0,100),width:r.width,scroll:el.scrollWidth,client:el.clientWidth,x:r.x,right:r.right});
   }
   return{chinese,clipped};
  });
  report.push({name,...state});
  await page.screenshot({path:root+'/test-results/'+name+'.png'});
 }
 await snapshot('main-menu');
 await page.getByText('Настройки звуков и облачков',{exact:true}).click();
 await page.waitForSelector('#dshwv-waitcharclose');
 await snapshot('sound-collapsed');
 const card=page.locator('.dshwv-bubcard').filter({has:page.locator('#dshwv-waitcharclose')});
 const entries=card.locator(':scope > .dshwv-menu-row');
 for(let i=0;i<await entries.count();i++)await entries.nth(i).click();
 await snapshot('sound-expanded');
 // Open the built-in sound dropdown without changing its value.
 const dropdown=card.locator('.dshwv-custbtn').first();
 if(await dropdown.count()) {await dropdown.click();await snapshot('sound-dropdown');await dropdown.click();}
 const edits=card.getByText('Изменить текст уведомления',{exact:true});
 if(await edits.count()) {
  await edits.first().click();await snapshot('sound-message-editor');
  const cancel=page.getByRole('button',{name:'Отмена',exact:true});if(await cancel.count())await cancel.last().click();
 }
 if(await card.count())await card.getByRole('button',{name:'Отмена',exact:true}).click();
 // Switch to accounting; no request hits the real DSH server.
 const accounting=page.getByText('- = Расходы китёнка = -',{exact:true});
 if(await accounting.count()) {await accounting.click();await snapshot('accounting');}
 for(const width of [990,630,390]){
  await page.setViewportSize({width,height:862});
  await page.waitForFunction(()=>{const r=document.querySelector('.dshwv-menu-btn').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+.5;});
  await snapshot('accounting-'+width);
 }
 await page.setViewportSize({width:1440,height:1000});
 const modelSettings=page.locator('.dshwv-usage-sub .dshwv-audiorow').getByRole('button',{name:'Настройки',exact:true});
 if(await modelSettings.count()) {
  await modelSettings.first().click();await snapshot('model-settings');
  const modelCard=page.locator('.dshwv-usage-mask:visible .dshwv-usage-card').last();
  const edit=modelCard.getByRole('button',{name:'Изменить',exact:true});
  if(await edit.count()) {await edit.first().click();await snapshot('model-alert-editor');const cancel=page.getByRole('button',{name:'Отмена',exact:true});if(await cancel.count())await cancel.last().click();}
  const close=page.locator('.dshwv-usage-mask:visible').getByRole('button',{name:/Закрыть|Назад/});if(await close.count())await close.last().click();
 }
 // Close residual modal overlays through their own Cancel/Close buttons only.
 for(let n=0;n<4;n++){const mask=page.locator('.dshwv-usage-mask:visible');if(!await mask.count())break;const buttons=mask.getByRole('button',{name:/Отмена|Закрыть|Назад/});if(!await buttons.count())break;await buttons.last().click();}
 const back=page.locator('.dshwv-menu').getByRole('button',{name:'‹ Назад',exact:true});if(await back.count())await back.click();
 const resources=page.locator('.dshwv-menuview .dshwv-menu-row').filter({hasText:'Медиаресурсы'}).getByRole('button',{name:'Управление',exact:true});
 if(await resources.count()){
  await resources.click();await snapshot('resources');
  const resourceMask=page.locator('.dshwv-resmask:visible');const rows=resourceMask.locator('.dshwv-rescard > .dshwv-menu-row');for(let i=0;i<await rows.count();i++)await rows.nth(i).click();await snapshot('resources-expanded');
  const close=resourceMask.locator('.dshwv-resclose');if(await close.count())await close.click();
 }
 const snap=page.locator('.dshwv-menuview .dshwv-menu-row').filter({hasText:'Привязка и отражение'}).getByRole('button',{name:'Настроить',exact:true});
 if(await snap.count()){await snap.click();await snapshot('snap-settings');const cancel=page.locator('.dshwv-snapmask:visible').getByRole('button',{name:'Отмена',exact:true});if(await cancel.count())await cancel.click();}
 const bubbles=page.getByRole('button',{name:'Облачка по нажатию',exact:true});
 if(await bubbles.count()) {
  await bubbles.click();await snapshot('bubble-sequence');
  const frameButton=page.locator('.dshwv-bubmask:visible .dshwv-framebtn').first();
  if(await frameButton.count()){
   await frameButton.click();await snapshot('frame-library');
   const create=page.getByTitle('Создать рамку облачка',{exact:true});
   if(await create.count()){
    await create.last().click();await snapshot('frame-editor');
    const folds=page.locator('.dshwv-framemask:visible .dshwv-menu-row');
    for(let i=0;i<await folds.count();i++)if(await folds.nth(i).evaluate(el=>el.nextElementSibling?.hasAttribute('data-open')))await folds.nth(i).click();
    await snapshot('frame-editor-expanded');
    const cancel=page.locator('.dshwv-framemask:visible').getByRole('button',{name:'Отмена',exact:true});if(await cancel.count())await cancel.last().click();
   }
  }
 }
 report.push({name:'browser-errors',errors});
 fs.writeFileSync(root+'/test-results/ui-sweep.json',JSON.stringify(report,null,2));
 const failures=report.filter(item=>item.chinese?.length||item.clipped?.length||item.errors?.length);
 if(failures.length)throw new Error('UI audit failed: '+failures.map(item=>item.name).join(', '));
 console.log(JSON.stringify(report.map(r=>({name:r.name,untranslated:r.chinese?.length,clipped:r.clipped?.length,errors:r.errors})),null,2));
}catch(error){fs.writeFileSync(root+'/test-results/ui-sweep-partial.json',JSON.stringify(report,null,2));throw error;}finally{await browser.close()}
// The content editor is a separate surface, not the sequence or frame editor.
// Exercise the actual widget with the shipped compiled locale bundle as well.
await import('./preview.mjs');
