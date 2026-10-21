import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
export const whaleDir = process.env.DSH_WHALE_DIR || path.dirname(require.resolve('dsh-whale-widget/package.json'));
const metadata = JSON.parse(fs.readFileSync(path.join(whaleDir,'package.json'),'utf8'));
if(metadata.version !== '0.4.2') throw new Error('Browser fixtures require original dsh-whale-widget 0.4.2');
