import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const root = new URL('../',import.meta.url);
const read = name => fs.readFileSync(new URL(name,root),'utf8');
test('compiled client is reproducible, standalone, native-locale injectable and host no-op',async()=>{
 const original = read('lib/client.js');
 execFileSync(process.execPath,['build.mjs'],{cwd:root});
 assert.equal(read('lib/client.js'),original);
 let definition;
 vm.runInNewContext(original,{window:{__ModuleLoader__:{load(value){definition=value;}}}});
 assert.equal(definition.id,'dsh-whale-locale-ru');
 const plugin=definition.factory();
 assert.deepEqual(Array.from(plugin.inject),['locale']);
 assert.equal(plugin.name,'dsh-whale-locale-ru');
 assert.doesNotMatch(original,/addLanguage\(|locale\.register\(|fetch\(|localStorage|sessionStorage/);
 const host=await import('../lib/index.js');
 assert.equal(host.apply(),undefined);
});
test('catalogs preserve placeholders in default speech and have frozen expected size',()=>{
 const dictionary=JSON.parse(read('locales/whale.json'));
 const speech=JSON.parse(read('locales/whale-speech.json'));
 assert.equal(Object.keys(dictionary).length,1031);
 assert.equal(Object.keys(speech).length,64);
 for(const [source,target] of Object.entries(speech)) {
  assert.equal(typeof target,'string');
  const placeholders=value=>value.match(/\{[^{}]+\}/g)||[];
  assert.deepEqual(placeholders(target).sort(),placeholders(source).sort(),source);
 }
});
