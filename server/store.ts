import { Express } from 'express';
import fs from 'fs-extra';
import mime from 'mime';
import path from 'path';

import { ObjectStorage, StampedPatch } from '../src/storage/object';
import { ServerAdapter } from '../src/storage/adapters/server';
import { pathForStorage, pathForCdn } from './config';

const cache: { [key: string]: ObjectStorage } = {};

function getStorage(name: string) {
  return name in cache
    ? cache[name]
    : (cache[name] = new ObjectStorage(
        new ServerAdapter(pathForStorage(name))
      ));
}

export function storeRoutes(app: Express) {
  // cdn
  app.get('/cdn/:project/:hash', (req, res) => {
    const { project, hash } = req.params;
    const file = path.join(pathForCdn(project), hash);
    res.setHeader('content-type', mime.getType(file) || 'text/plain');
    fs.createReadStream(file).pipe(res);
  });

  app.get('/data/:project/info', async (req, res) => {
    const { project } = req.params;
    const storage = getStorage(project);

    const id = await storage.getStorageId();

    res.json({ id });
  });

  app.get('/data/:project/patches', async (req, res) => {
    const { project } = req.params;
    let { since } = req.query;
    since = typeof since === 'string' ? since : '';

    const storage = getStorage(project);
    const patches: StampedPatch[] = [];
    let until = '';
    for await (const [logTimestamp, patch] of storage.patchesSince(since)) {
      patches.push(patch);
      if (logTimestamp > until) {
        until = logTimestamp;
      }
    }
    res.json({ patches, until });
  });
}
