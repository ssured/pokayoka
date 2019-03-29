(async function() {
  const results = new Map();
  const keys = new Set();
  for await (const data of storage.adapter.level.createReadStream({
    gte: ['spo'],
    lt: ['spo', undefined],
  })) {
    const [, s, p, o] = data.key;
    const [t] = data.value;

    const key = JSON.stringify([s, p]);
    if (!keys.has(key)) {
      keys.add(key);

      if (
        Array.isArray(o) &&
        !o.reduce((allS, i) => allS && typeof i === 'string', true)
      ) {
        results.set(s, [{ [p]: JSON.stringify(o) }, t]);
      } else {
        results.set(s, [{ [p]: o }, t]);
      }
    }

    //if (results.size === 100) break;
  }
  console.log(results);

  const subjs = new Set();
  for (const s of results.keys()) {
      subjs.add(s[0]);
  }
  for (const [s, [po, t]] of results.entries()) {
      const p = Object.keys(po)[0];
      const o = po[p];
      if (subjs.has(o)) {
          console.log(`${p} ${o} => [${o}]`)
          results.set(s, [{[p]: [o]}, t])
      }
  }

  console.log(await spot.commit(results));
})();
