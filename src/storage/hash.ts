// from https://github.com/epoberezkin/fast-json-stable-stringify/blob/e0017726aa0cf7696c6685c27a5d7529e8e5e7cc/index.js

import { JsonEntry, JsonArray, JsonMap } from '../utils/json';
import sha256Hash from '../utils/hash';

const cache = new WeakMap<JsonArray | JsonMap, string>();

let cacheIsEnabled = true;
export function disableCacheForTesting() {
  cacheIsEnabled = false;
}

// makes a deterministic hash of data
// ignores array order (treats it as a set)
export function hash(
  data: JsonEntry,
  ignoreArrayOrder: boolean = false
): string {
  // @ts-ignore
  if (cacheIsEnabled && cache.has(data)) return cache.get(data);

  const seen = new Set<JsonMap>();
  function stringify(node: JsonEntry): string | undefined {
    // @ts-ignore
    if (node && node.toJSON && typeof node.toJSON === 'function') {
      // @ts-ignore
      node = node.toJSON(); // tslint:disable-line
    }

    if (node === undefined) return;
    if (typeof node === 'number') return isFinite(node) ? String(node) : 'null';
    if (typeof node !== 'object') return JSON.stringify(node);

    if (node === null) return 'null';

    if (Array.isArray(node)) {
      // make a determinisic hash of an array by
      // hashing all items individually
      const hashes = node.map(item => {
        const hash = stringify(item);
        return hash ? `"${hash}"` : 'null';
      });
      if (ignoreArrayOrder) {
        hashes.sort();
      }
      return `[${hashes.join(',')}]`;
    }

    if (seen.has(node)) {
      throw new TypeError('Converting circular structure to JSON');
    }
    seen.add(node);

    let out = '';
    for (const key of Object.keys(node).sort()) {
      const value = stringify(node[key]);
      if (!value) continue;
      if (out.length > 0) out += ',';
      out += JSON.stringify(key) + ':' + value; // tslint:disable-line prefer-template
    }

    seen.delete(node);

    return `{${out}}`;
  }

  const result = sha256Hash(stringify(data) || 'null');

  if (data != null && typeof data === 'object') {
    cache.set(data, result);
  }

  return result;
}
