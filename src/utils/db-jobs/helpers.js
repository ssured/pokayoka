const pull = require('pull-stream');
const pl = require('pull-level');
const charwise = require('charwise');

function encodeDecodeForPath(path) {
  const reversed = [...path].reverse();

  function encode(key) {
    return reversed.reduce((encoded, key) => [key, encoded], [key]);
  }

  function decode(nested) {
    // if (!Array.isArray(nested)) debugger;
    return reversed.reduce(nested => nested[1], nested)[0];
  }

  return {
    encode,
    decode,
  };
}

function createSourceAndSinkFor(
  db,
  path,
  sourceOptions = { live: true, sync: false },
  sinkOptions = {
    windowSize: 100,
    windowTime: 100,
  }
) {
  const { encode, decode } = encodeDecodeForPath(path);

  function createSource(options) {
    const query = {
      keyEncoding: charwise,
      ...sourceOptions,
      ...options,
      ...('gte' in options ? { gte: encode(options.gte) } : {}),
      ...('gt' in options ? { gt: encode(options.gt) } : {}),
      ...('lte' in options ? { lte: encode(options.lte) } : {}),
      ...('lt' in options ? { lt: encode(options.lt) } : {}),
    };
    return pull(
      pl.read(db, query),
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
