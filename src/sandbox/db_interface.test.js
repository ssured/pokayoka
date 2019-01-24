// Feit ABC {
//     id: 'abc',
//     title: 'vlek op muur',

// }

// Taak DEF {
//     id: 'def',
//     title: 'muur sauzen',

//     feiten: () => {
//         hexa.query(['def', $rel, $feit], [$feit, is_een, Taak], $Feit)
//     }
// }

// Hexastore {
//     DEF is_gebaseerd_op ABC
//     DEF is_een Taak
//     ABC is_een Feit
// }

// Hexastore index is een afgeleide van de informatie in de gewone database en wordt als
// zoek index gebruikt.

// Welke gegevens in hexastore index
// type van instantie
// label, IFCid, elementId
// relaties tussen entiteiten

const levelup = require('levelup');
const memdown = require('memdown');

const hasTerminated = Symbol.for('hasTerminated');
const notSet = Symbol.for('notSet');

// const getAsync = async key => {
//   await new Promise(r => setTimeout(r, 10));
//   return Promise.resolve({ data: key });
// };
// const setAsync = (key, value) => Promise.resolve(true);

const effect = () => {
  console.log('setup');
  return () => {
    console.log('cleanup');
  };
};

describe('async generator proxy', () => {
  test.skip('it works', async () => {
    const db = levelup(memdown());

    const _root = (key, value = notSet) =>
      value === notSet ? db.get(key) : db.put(key, value);

    const asyncGeneratorForKey = (object, key) => {
      let listeners = 0;
      let cb;
      let current;
      return async function*() {
        if (++listeners === 1) {
          // this is the first listener
          cb = effect();
          try {
            current = await object(key);
          } catch (e) {}
        }

        while (current === undefined || (yield current) !== hasTerminated) {
          current = await nextObject(key);
        }

        if (--listeners === 0 && cb) cb();
      };
    };

    const root = new Proxy(_root, {
      get(object, key) {
        if (!object[key]) {
          object[key] = () => {};
          const generator = asyncGeneratorForKey(object, key);
          object[key][Symbol.asyncIterator] = () => {
            const it = generator();
            const $return = it.return;
            it.return = value => {
              it.next(hasTerminated);
              return $return.call(it, value);
            };
            return it;
          };
        }
        return object[key];
      },
    });

    let last1, last2;

    await Promise.all([
      (async function() {
        let count = 0;
        for await (const num of root.property) {
          last1 = num;
          if (++count > 1) break;
        }
      })(),
      (async function() {
        let count = 0;
        for await (const num of root.property) {
          last2 = num;
          if (++count > 2) break;
        }
      })(),
      (async function() {
        await new Promise(r => setTimeout(r, 10));
        await root('property', 'first');
        await new Promise(r => setTimeout(r, 10));
        await root('property', 'second');
        await new Promise(r => setTimeout(r, 10));
        await root('property', 'third');
        await new Promise(r => setTimeout(r, 10));
        await root('property', 'fourth');
      })(),
    ]);

    expect(last1).toBe('third');
    expect(last2).toBe('fourth');
  });
});
