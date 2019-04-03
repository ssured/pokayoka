import { Express } from 'express';
import fs from 'fs-extra';
import mime from 'mime';
import path from 'path';

import { pathForCdn } from './config';

export function storeRoutes(app: Express) {
  app.get('/cdn/:project/:hash', (req, res) => {
    const { project, hash } = req.params;
    const file = path.join(pathForCdn(project), hash);
    res.setHeader('content-type', mime.getType(file) || 'text/plain');
    fs.createReadStream(file).pipe(res);
  });
}
