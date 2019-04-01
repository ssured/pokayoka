import { Express } from 'express';
import fs from 'fs-extra';
import mime from 'mime';
import path from 'path';

import { ObjectStorage, StampedPatch } from '../src/storage/object';
import { ServerAdapter } from '../src/storage/adapters/server';
import { pathForStorage, pathForCdn } from './config';
import pify from 'pify';
import rimraf from 'rimraf';
import nano from 'nano';
import { copyDbFromSnagtracker } from './copy-db-from-snagtracker';
import console = require('console');
import { spoInObject } from '../src/utils/spo';
import { getType } from './utils/snag-id';

const cache = new Map<string, ObjectStorage>();

function getStorage(name: string) {
  if (!cache.has(name)) {
    cache.set(name, new ObjectStorage(new ServerAdapter(pathForStorage(name))));
  }
  return cache.get(name)!;
}
async function resetStorage(name: string) {
  if (cache.has(name)) {
    await cache.get(name)!.close();
    cache.delete(name);
  }
  try {
    await pify(rimraf)(pathForStorage(name));
  } catch (e) {
    console.log('rimraf failed', e);
  }
  const storage = getStorage(name);
  const fromDb = nano(
    // 'https://copyclient:6MYm9Tm&t3Uc@bgdd.snagtracker.com:6984'
    'http://admin:admin@localhost:5984'
  ).use<any>(name);
  const cdnPath = pathForCdn(name);

  await copyDbFromSnagtracker(fromDb, storage, cdnPath);

  console.log('copy from snagtracker done');
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

  app.get('/data/:project/reset', async (req, res) => {
    const { project } = req.params;
    console.log(`reset project ${project}`);

    // auto add this db to all known users
    const users = nano('http://admin:admin@localhost:5984').use<{
      name: string;
      type: string;
      roles: string[];
    }>('_users');
    const allUsers = (await users.list({ include_docs: true })).rows
      .map(row => row.doc!)
      .filter(doc => Array.isArray(doc.roles));
    const role = `member-${project}`;
    for (const user of allUsers) {
      if (user.roles.indexOf(role) === -1) {
        user.roles.push(role);
        console.log(`add ${role} to ${user.name}`);
        await users.insert(user);
      }
    }

    await resetStorage(project);
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

  app.get('/data/:project/spo', async (req, res) => {
    const { project } = req.params;
    let { since } = req.query;
    since = typeof since === 'string' ? since : '';

    const db = nano('http://admin:admin@localhost:5984').use<{}>(project);
    const all = await db.list({ include_docs: true });

    const result: any[] = [];

    for (const { doc: docWithArrays } of all.rows) {
      if (docWithArrays!._id[0] === '_') continue;
      delete (docWithArrays as any)['#'];

      // convert all arrays to objects with numbered indexes
      const doc = JSON.parse(
        JSON.stringify(
          docWithArrays,
          (_, value) =>
            Array.isArray(value)
              ? Object.entries(value).reduce((map, [key, value]) => {
                  (map as any)[key] = value;
                  return map;
                }, {})
              : value,
          2
        )
      );

      for (const tuple of spoInObject(doc._id.split('_'), doc)) {
        result.push(tuple);
      }

      result.push([[doc._id], 'type', getType(doc._id)]);

      if (doc._id.split('_').length > 1) {
        result.push([
          doc._id.split('_'),
          'parent',
          doc._id.split('_').slice(0, -1),
        ]);
        result.push([
          doc._id
            .split('_')
            .slice(0, -1)
            .concat('children'),
          ,
          doc._id,
          doc._id.split('_'),
        ]);
      }
    }

    res.json({ result });
  });
}
