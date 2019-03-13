import path from 'path';
import fs from 'fs-extra';

export const baseDir = path.join(__dirname, '..');

export const cdnDir = path.join(baseDir, 'cdn');
fs.ensureDirSync(cdnDir);

export const dbDir = path.join(baseDir, 'db');
fs.ensureDirSync(dbDir);

export function pathForStorage(name: string) {
  return path.join(dbDir, name);
}

export function pathForCdn(name: string) {
  return path.join(cdnDir, name);
}
