const pull = require('pull-stream');
const pl = require('pull-level');

function encodeDecodeForPath(path) {
  const reversed = [...path].reverse();

  function encode(key) {
    let root = [key];
    reversed.forEach(key => (root = [key, root]));
    return root;
  }

  function decode(nested) {
    if (!Array.isArray(nested)) debugger;
    let key = nested;
    while (key[1]) key = key[1];
    return key[0];
  }

  return {
    encode,
    decode,
  };
}

function createSourceAndSinkFor(
  db,
  path,
  sourceOptions = { sync: false, live: true },
  sinkOptions = {
    windowSize: 100,
    windowTime: 100,
  }
) {
  const { encode, decode } = encodeDecodeForPath(path);

  function createSource(options) {
    return pull(
      pl.read(db, {
        ...sourceOptions,
        ...options,
        gte: 'gte' in options && encode(options.gte),
        lte: 'lte' in options && encode(options.lte),
      }),
      pull.map(item => ({ ...item, key: decode(item.key) }))
    );
  }

  function createSink(options) {
    return pull(
      pull.map(item => ({ ...item, key: encode(item.key) })),
      pl.write(db, { ...sinkOptions, ...options })
    );
  }

  return { createSource, createSink };
}

module.exports = {
  encodeDecodeForPath,
  createSourceAndSinkFor,
};
