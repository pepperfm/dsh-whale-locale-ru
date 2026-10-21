import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {whaleDir} from './widget.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const root = fileURLToPath(new URL('../', import.meta.url));
fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
const browser = await chromium.launch({ ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {}), headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html lang="en"><body><div id="root"><textarea data-composer-input></textarea><div id="chat">菜单 Settings</div></div></body></html>' }));
  await page.goto('http://dsh-russian.test/');
  await page.evaluate(() => {
    window.localeMock = {
      active: 'ru', listeners: new Set(),
      getSnapshot() { return { active: this.active }; },
      subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
      setLocale(value) { this.active = value; for (const fn of this.listeners) fn(); }
    };
    const root = document.createElement('div');
    root.className = 'dshwv-root';
    root.innerHTML = '<div class="dshwv-ver">v0.4.2</div><button id="menu" title="菜单">菜单</button><span id="size">大小</span><span id="amount">123.45</span><input id="custom" value="菜单"><textarea id="custom-area">菜单</textarea><div class="dshwv-text" id="bubble">菜单</div><div class="dshwv-resnm" id="resource-name">菜单</div><div contenteditable="true" id="custom-editor">菜单</div><span id="unknown">自定义用户文字</span><span class="dshwv-rolename" id="role-name" title="菜单">菜单</span><span class="dshwv-audioname" id="audio-name">菜单</span><span class="dshwv-custnm" id="custom-name">菜单</span><span class="dshwv-btnlabel" id="selected-name">菜单</span><select id="option-values"><option value="custom">菜单</option></select>';
    document.body.append(root);
    window.originalMenuNode = document.getElementById('menu').firstChild;
    window.clickCount = 0;
    document.getElementById('menu').onclick = () => window.clickCount++;
  });
  const adapter = ['whale-text.js', 'whale-adapter.js'].map(file => fs.readFileSync(root + '/' + file, 'utf8').replaceAll('export function ', 'function ')).join('\n');
  await page.addScriptTag({ content: adapter });
  await page.evaluate(({dict,speech}) => { window.disposeWhaleRu = installWhaleTranslation(window.localeMock, dict, document, speech); }, {dict:JSON.parse(fs.readFileSync(root + '/locales/whale.json', 'utf8')),speech:JSON.parse(fs.readFileSync(root + '/locales/whale-speech.json', 'utf8'))});
  await page.waitForFunction(() => document.querySelector('#menu').textContent === 'Меню');
  assert.equal(await page.locator('#menu').getAttribute('title'), 'Меню');
  assert.equal(await page.locator('#size').textContent(), 'Размер');
  assert.equal(await page.locator('#chat').textContent(), '菜单 Settings');
  for (const id of ['custom', 'custom-area']) assert.equal(await page.locator('#' + id).inputValue(), '菜单');
  for (const id of ['bubble', 'resource-name', 'custom-editor', 'role-name', 'audio-name', 'custom-name', 'selected-name', 'option-values']) assert.equal(await page.locator('#' + id).textContent(), '菜单');
  assert.equal(await page.locator('#role-name').getAttribute('title'), '菜单');
  assert.equal(await page.locator('#unknown').textContent(), '自定义用户文字');
  assert.equal(await page.locator('#amount').textContent(), '123.45');
  assert.equal(await page.evaluate(() => originalMenuNode === document.querySelector('#menu').firstChild), true);
  await page.locator('#menu').click();
  assert.equal(await page.evaluate(() => clickCount), 1);
  await page.evaluate(() => { const portal = document.createElement('div'); portal.className = 'dshwv-usage-mask'; portal.innerHTML = '<button id="late">取消</button>'; document.body.append(portal); });
  await page.waitForFunction(() => document.querySelector('#late').textContent === 'Отмена');
  await page.evaluate(() => { document.querySelector('#size').textContent = '大小'; });
  await page.waitForFunction(() => document.querySelector('#size').textContent === 'Размер');
  await page.evaluate(() => { window.detachedPortal = document.querySelector('#late').parentElement; detachedPortal.remove(); localeMock.setLocale('en'); });
  await page.waitForFunction(() => document.querySelector('#menu').textContent === '菜单');
  assert.equal(await page.evaluate(() => detachedPortal.textContent), '取消');
  await page.evaluate(() => document.body.append(detachedPortal));
  assert.equal(await page.locator('#late').textContent(), '取消');
  assert.equal(await page.locator('#menu').getAttribute('title'), '菜单');
  await page.evaluate(() => localeMock.setLocale('ru'));
  await page.waitForFunction(() => document.querySelector('#menu').textContent === 'Меню');
  await page.evaluate(() => {
    const root = document.querySelector('.dshwv-root');
    const extra = document.createElement('div');
    extra.innerHTML = '<img class="dshwv-img" src="/dsh-whale/image.png?v=2"><button class="dshwv-rolebtn"><span id="builtin-role" class="dshwv-btnlabel">小鲸鱼</span></button><div class="dshwv-pop"><div class="dshwv-text" id="balance-card"><div>DeepSeek 余额</div><div>0.00 USD</div><div>今日已用 0.00 USD</div><div id="peak-label">峰</div><div>00:58:54</div></div><div class="dshwv-text" id="custom-card"><div>Мой текст</div><div>DeepSeek 余额</div><div>今日已用 0.00 USD</div><div>峰</div></div></div><div class="dshwv-roleitem"><img class="dshwv-rolethumb" src="/dsh-whale/image.png?v=2"><span class="dshwv-rolename"><span class="dshwv-nameinner"><span class="dshwv-namecopy" id="builtin-option">小鲸鱼</span></span></span></div><div class="dshwv-roleitem"><img class="dshwv-rolethumb" src="/dsh-whale/role-image.png?id=custom"><span class="dshwv-rolename" id="custom-option">小鲸鱼</span></div>';
    root.append(extra);
  });
  await page.waitForFunction(() => document.querySelector('#peak-label').textContent === 'Пик');
  assert.equal(await page.locator('#balance-card').textContent(), 'Баланс DeepSeek0.00 USDСегодня 0.00 USDПик00:58:54');
  assert.equal(await page.locator('#builtin-role').textContent(), 'Китёнок');
  assert.equal(await page.locator('#builtin-option').textContent(), 'Китёнок');
  assert.equal(await page.locator('#custom-option').textContent(), '小鲸鱼');
  assert.equal(await page.locator('#custom-card').textContent(), 'Мой текстDeepSeek 余额今日已用 0.00 USD峰');
  await page.evaluate(() => {
    const card = document.createElement('div'); card.className = 'dshwv-pop';
    card.innerHTML = '<div class="dshwv-text" id="speech-card" style="width:180px;height:80px"><div class="dshwv-trow" id="speech-row" style="font-size:32px">上班让我意识到时间是可以被浪费的...</div></div>';
    document.querySelector('.dshwv-root').append(card);
  });
  await page.waitForFunction(() => document.querySelector('#speech-row').textContent.startsWith('Работа научила'));
  await page.waitForFunction(() => document.querySelector('#speech-row').getBoundingClientRect().height <= 80);
  assert.ok(await page.evaluate(() => document.querySelector('#speech-row').scrollWidth <= document.querySelector('#speech-card').clientWidth + 1));
  await page.evaluate(() => { document.querySelector('#peak-label').textContent = '谷'; });
  await page.waitForFunction(() => document.querySelector('#peak-label').textContent === 'Льг.');
  await page.evaluate(() => localeMock.setLocale('en'));
  await page.waitForFunction(() => document.querySelector('#builtin-role').textContent === '小鲸鱼');
  assert.equal(await page.locator('#balance-card').textContent(), 'DeepSeek 余额0.00 USD今日已用 0.00 USD谷00:58:54');
  assert.equal(await page.locator('#speech-row').textContent(), '上班让我意识到时间是可以被浪费的...');
  assert.equal(await page.locator('#speech-row').evaluate(el => el.style.fontSize), '32px');
  await page.evaluate(() => localeMock.setLocale('ru'));
  await page.waitForFunction(() => document.querySelector('#builtin-role').textContent === 'Китёнок');
  await page.evaluate(() => disposeWhaleRu());
  assert.equal(await page.locator('#menu').textContent(), '菜单');
  await page.evaluate(dict => { document.querySelector('.dshwv-ver').textContent = 'v9.0.0'; window.disposeWhaleRu = installWhaleTranslation(localeMock, dict); }, JSON.parse(fs.readFileSync(root + '/locales/whale.json', 'utf8')));
  await page.evaluate(() => new Promise(resolve => queueMicrotask(resolve)));
  assert.equal(await page.locator('#menu').textContent(), '菜单');
  await page.evaluate(() => disposeWhaleRu());
  assert.deepEqual(errors, []);
  console.log('PASS: isolated browser lifecycle, native text-node identity, click handlers, portals, rerenders, user data, amounts, locale switches, disposal, version guard');

  // Actual installed widget source, with network isolated by a local mock (no real host/account access).
  const actual = await browser.newPage({ viewport: { width: 1646, height: 1000 } });
  const actualErrors = [];
  actual.on('pageerror', error => actualErrors.push(error.message));
  await actual.route('**/*', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><body><div id="root"><textarea data-composer-input></textarea></div></body></html>' }));
  await actual.goto('http://dsh-russian.test/');
  await actual.evaluate(() => {
    const fallback = { ok: true, version: '0.4.2', versionLabel: 'v0.4.2', currency: 'CNY', totalBalance: '123.45', todayUsage: '1.23', groups: [], fragments: [], roles: [], images: [], models: [], events: {}, items: [], pending: null };
    window.fetch = async () => ({ ok: true, status: 200, json: async () => structuredClone(fallback), arrayBuffer: async () => new ArrayBuffer(0) });
    window.localeMock = { getSnapshot() { return {active:'ru'}; }, subscribe() { return () => {}; } };
  });
  await actual.addScriptTag({ content: fs.readFileSync(path.join(whaleDir,'assets/whale-widget.js'), 'utf8') });
  await actual.waitForSelector('.dshwv-menu-btn');
  await actual.evaluate(() => {
    window.companionCleanups = [];
    window.__ModuleLoader__ = {load(module) {
      if(module.id !== 'dsh-whale-locale-ru') throw new Error('Wrong companion module');
      module.factory().apply({locale:localeMock,effect(fn){ companionCleanups.push(fn()); }});
    }};
  });
  await actual.addScriptTag({ content: fs.readFileSync(path.join(root,'lib/client.js'),'utf8') });
  try {
    await actual.waitForFunction(() => document.querySelector('.dshwv-menu-btn').title === 'Меню', null, { timeout: 5000 });
  } catch (error) {
    console.log('Actual widget diagnostic', await actual.evaluate(() => ({ version: document.querySelector('.dshwv-ver')?.textContent, title: document.querySelector('.dshwv-menu-btn')?.title, body: document.body.innerText.slice(-1200) })), actualErrors);
    throw error;
  }
  await actual.locator('.dshwv-menu-btn').click();
  await actual.waitForFunction(() => [...document.querySelectorAll('.dshwv-menu span')].some(el => el.textContent === 'Размер'));
  await actual.screenshot({ path: root + '/test-results/whale-russian-preview.png' });
  assert.deepEqual(actualErrors, []);
  await actual.waitForFunction(() => !!document.querySelector('style[data-plugin="dsh-whale-locale-ru"]'));
  assert.equal(await actual.locator('.dshwv-root').getAttribute('data-dsh-ru-whale-layout'), null);
  await actual.evaluate(() => { for(const cleanup of companionCleanups.reverse()) cleanup(); });
  await actual.waitForFunction(() => document.querySelector('.dshwv-menu-btn').title === '菜单');
  assert.equal(await actual.locator('[data-dsh-ru-whale-layout]').count(),0);
  console.log('PASS: actual npm Whale 0.4.2 + compiled companion: menu, scoped layout, disposal, no uncaught browser errors (mock backend)');
} finally {
  await browser.close();
}
