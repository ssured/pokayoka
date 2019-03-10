const I = x => x;

const anyProp = Symbol.for('anyProp');

const createPathProxy = (cb, path = [], parent) => {
  const proxy = new Proxy(() => (cb || I)(path), {
    get(source, key) {
      if (key === '..') return parent;
      return createPathProxy(
        cb && (cb[key] || cb[anyProp]),
        path.concat(key),
        proxy
      );
    },
  });
  return proxy;
};

module.exports = {
  createPathProxy,
  anyProp,
};
