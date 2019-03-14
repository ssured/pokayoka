import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';
import { Storage } from '../src/storage';
import { ServerAdapter } from '../src/storage/adapters/server';

const log = debug(__filename.replace(`${__dirname}/`, '').replace('.ts', ''));

const cdnDir = path.join(__dirname, '../cdn');
fs.ensureDirSync(cdnDir);

const dbDir = path.join(__dirname, '../db');
fs.ensureDirSync(dbDir);

(async function main() {
  try {
    const toDbName = 'bk0wb0a7sz';
    const adapter = new ServerAdapter(path.join(dbDir, toDbName));
    const toDb = new Storage(adapter);

    // const id = 'coaxs1v6zs';
    // const obj = await toDb.getObject(id);
    // log(obj);

    // log(await toDb.getInverse(obj));

    log(
      (await adapter.queryList({
        gt: ['pos', 'type', 'project', null],
        lt: ['pos', 'type', 'project', undefined],
      })).map(JSON.stringify as any)
    );

    // log(
    //   await adapter.queryList({
    //     gte: ['sp', [id]],
    //     lt: ['sp', [id, undefined]],
    //   })
    // );

    // const patches: StampedPatch[] = [];
    // // let count = 0;
    // for await (const patch of toDb.patchesSince('')) {
    //   patches.push(patch);
    //   // log({ patch });
    //   // count += 1;
    //   // if (count > 10) break;
    // }
    // console.log(JSON.stringify(patches));
  } catch (e) {
    log('Uncaught error %O', e);
  }
})();
