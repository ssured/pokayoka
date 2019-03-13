import { Express } from 'express';
import fs from 'fs-extra';
import mime from 'mime';

import { Storage, StampedPatch } from '../src/storage';
import { ServerAdapter } from '../src/storage/adapters/server';
import { pathForStorage, pathForCdn } from './config';

const cache: { [key: string]: Storage } = {};

function getStorage(name: string) {
  return name in cache
    ? cache[name]
    : (cache[name] = new Storage(new ServerAdapter(pathForStorage(name))));
}

export function storeRoutes(app: Express) {
  // cdn
  app.get('/cdn/:hash', (req, res) => {
    const { hash } = req.params;
    const file = pathForCdn(hash);
    res.setHeader('content-type', mime.getType(file) || 'text/plain');
    fs.createReadStream(file).pipe(res);
  });

  app.get('/data/:project/info', async (req, res) => {
    const { project } = req.params;
    const storage = getStorage(project);

    const id = await storage.getStorageId();
    const window = await storage.stateWindow();

    res.json({ id, window });
  });

  app.get('/data/:project/patches', async (req, res) => {
    const { project } = req.params;
    let { since } = req.query;
    since = typeof since === 'string' ? since : '';

    const storage = getStorage(project);
    const patches: StampedPatch[] = [];
    for await (const patch of storage.patchesSince(since)) {
      patches.push(patch);
    }
    res.json(patches);
  });
}
