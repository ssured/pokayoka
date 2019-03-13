import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';
import { Storage, StampedPatch } from '../src/storage';
import { ServerAdapter } from '../src/storage/adapters/server';
import console = require('console');

const log = debug(__filename.replace(`${__dirname}/`, '').replace('.ts', ''));

const cdnDir = path.join(__dirname, '../cdn');
fs.ensureDirSync(cdnDir);

const dbDir = path.join(__dirname, '../db');
fs.ensureDirSync(dbDir);

(async function main() {
  try {
    const fromDbName = 'bk0wb0a7sz';
    const toDbName = `pokayoka${fromDbName}`;
    const adapter = new ServerAdapter(path.join(dbDir, toDbName));
    const toDb = new Storage(adapter);

    // const id = 'co9fbyh0wu';
    // const obj = await toDb.getObject(id);
    // log(obj);

    // log(await toDb.getInverse(obj));

    // log(
    //   await adapter.queryList({
    //     gte: ['sp', [id]],
    //     lt: ['sp', [id, undefined]],
    //   })
    // );

    log(await toDb.stateWindow());

    const patches: StampedPatch[] = [];
    let count = 0;
    for await (const patch of toDb.patchesSince('')) {
      // patches.push(patch);
      log({ patch });
      count += 1;
      if (count > 10) break;
    }
    console.log(JSON.stringify(patches));
  } catch (e) {
    log('Uncaught error %O', e);
  }
})();
