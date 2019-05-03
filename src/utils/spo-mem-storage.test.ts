import { many, RelationsOf } from '../model/base';
import { SPOHub } from './spo-hub';
import { SPOMemStorage } from './spo-mem-storage';
import { createObservable } from './spo-observable';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

describe('mem based SPO observable test', () => {
  let hub: SPOHub;
  let storage: SPOMemStorage;
  let state: number;
  let getCurrentState: () => string;

  beforeEach(() => {
    state = 0;
    getCurrentState = (() => {
      let currentState = state;
      let subState = 0;
      return () => {
        if (state > currentState) {
          currentState = state;
          subState = 0;
        }
        return [
          `000${currentState}`.substr(-3),
          `000${(subState += 1)}`.substr(-3),
        ].join('.');
      };
    })();
    hub = new SPOHub(getCurrentState);
    storage = new SPOMemStorage(hub);
  });

  test('local state generator', () => {
    expect(getCurrentState()).toBe('000.001');
    expect(getCurrentState()).toBe('000.002');
    state += 1;
    expect(getCurrentState()).toBe('001.001');
    expect(getCurrentState()).toBe('001.002');
  });

  test.only('basic', async () => {
    type User = { value: string };
    const userRelations: RelationsOf<User> = {};

    type Root = { [key: string]: User };
    const spo = createObservable<Root>(hub, many(userRelations));

    spo().test = { value: 'test' };
    await delay(1); // run async stuff

    expect(storage.data).toMatchSnapshot();

    // build a reference
    spo().testRef = spo().test;
    await delay(2); // run async stuff

    expect(storage.data).toMatchSnapshot();
    // a reference is stored instead of the data
    expect(Array.isArray(storage.data.testRef[0])).toBeTruthy();
    expect(spo().testRef.value).toBe('test');

    // update the source and check the reference
    spo().test.value = 'update';
    await delay(1); // run async stuff

    expect(spo().testRef.value).toBe('update');
  });

  test('nested', async () => {
    type Person = {
      identifier: string;
      name: string;
    };
    const personRelations: RelationsOf<Person> = {};
    type User = {
      identifier: string;
      name: string;
      is: Person;
    };
    const userRelations: RelationsOf<User> = {
      is: personRelations,
    };

    type Root = {
      [key: string]: User;
    };

    const spo = createObservable<Root>(hub, many(userRelations));

    spo().test1 = {
      identifier: 'test1',
      name: 'one',
      is: {
        identifier: 'p1',
        name: 'test1name',
      },
    };

    state += 1; // ?

    spo().test2 = {
      identifier: 'test2',
      name: 'two',
      is: spo.test1.is(),
    };

    await delay(1);

    expect(storage.data).toMatchSnapshot();
    expect(spo.test2.is().name).toBe('test1name');
  });
});
