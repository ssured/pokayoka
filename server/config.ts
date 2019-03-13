import path from 'path';
import fs from 'fs-extra';

export const baseDir = path.join(__dirname, '..');

export const cdnDir = path.join(baseDir, 'cdn');
fs.ensureDirSync(cdnDir);

export const dbDir = path.join(baseDir, 'db');
fs.ensureDirSync(dbDir);

export function pathForStorage(name: string) {
  const dir = path.join(dbDir, name);
  fs.ensureDirSync(dir);
  return dir;
}

export function pathForCdn(name: string) {
  const dir = path.join(cdnDir, name);
  fs.ensureDirSync(dir);
  return dir;
}
