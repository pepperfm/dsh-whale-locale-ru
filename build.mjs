import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const root = new URL('./', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const whale = JSON.parse(read('locales/whale.json'));
const speech = JSON.parse(read('locales/whale-speech.json'));
const helpers = ['whale-text.js','whale-layout.js','whale-adapter.js'].map(name => read(name).replaceAll('export function ', 'function ')).join('\n');
const body = `window.__ModuleLoader__.load({
  id: 'dsh-whale-locale-ru',
  factory: function () {
    'use strict';
    const whale = ${JSON.stringify(whale)};
    const speech = ${JSON.stringify(speech)};
    ${helpers}
    return {
      name: 'dsh-whale-locale-ru',
      inject: ['locale'],
      apply(ctx) {
        ctx.effect(() => installWhaleTranslation(ctx.locale, whale, document, speech), 'Whale Russian: reversible 0.4.2 DOM adapter');
        ctx.effect(() => installWhaleLayout(ctx.locale), 'Whale Russian: reversible 0.4.2 layout');
      }
    };
  }
});
`;
fs.mkdirSync(new URL('lib/',root),{recursive:true});
fs.writeFileSync(new URL('lib/client.js',root),body);
fs.writeFileSync(new URL('lib/index.js',root),'/** Client-only companion: no host services or permissions. */\nexport function apply() {}\n');
console.log(JSON.stringify({whaleKeys:Object.keys(whale).length,speechKeys:Object.keys(speech).length,clientBytes:Buffer.byteLength(body)}));
