import React from 'react';
import {
  observable,
  onBecomeObserved,
  when,
  reaction,
  runInAction,
  autorun,
} from 'mobx';
import { createUniverse, ifExists } from './universe';
import console = require('console');
import { RelationsOf, many, Many } from '../model/base';

describe('linking observables', () => {
  test('it works', async () => {
    const universe = observable<any>({});

    universe.a = observable({});

    onBecomeObserved(universe, 'a', () => {
      universe.a.value = 'A';
    });

    await when(() => universe.a.value === 'A');

    expect(universe.a.value).toBe('A');

    universe.b = observable({});
    onBecomeObserved(universe, 'b', () => {
      universe.b = universe.a;
    });
    expect(universe.b).not.toBe(universe.a);

    await when(() => !!universe.b.value);
    expect(universe.b.value).toBe('A');
    expect(universe.b).toBe(universe.a);
  });
});

type M = {
  // member / person
  '@': 'M';
  familyName: string;
  givenName?: string;
};

const mRels: RelationsOf<M> = {};

type R = {
  // Role
  '@': 'R';
  roleName: string;
  member: M;
};
const rRels: RelationsOf<R> = {
  member: mRels,
};

type P = {
  // project
  '@': 'P';
  name: string;
  roles: Many<R>;
};
const pRels: RelationsOf<P> = {
  roles: many(rRels),
};

type U = {
  // user
  project: Many<P>;
  is: M;
};
const uRels: RelationsOf<U> = {
  project: many(pRels),
  is: mRels,
};

type Shape = { [key: string]: U };
const runtimeShape: RelationsOf<Shape> = many(uRels);

describe('pathproxy for ids', () => {
  test('nested objects', async () => {
    const { root: s, set } = createUniverse<Shape>({
      runtimeShape,
      resolve: path => {
        switch (path.join(',')) {
          case 'sjoerd':
            (async () => {
              await new Promise(res => setTimeout(res, 10));
              set(path, false, {
                is: { '@': 'M', familyName: 'de Jong', givenName: 'Sjoerd' },
                project: {},
              });
            })();
            break;
          default:
            console.log(path.join(','));
            break;
        }
      },
      updateListener: (path, value) => {
        console.log(path);
        console.log(value);
      },
    });

    const user = s['sjoerd']();
    await when(() => !!ifExists(user.project));

    expect(Object.keys(user.project).length).toBe(0);

    user.project['projectId'] = {
      '@': 'P',
      name: 'projectName',
      roles: {},
    };

    expect(user.project['projectId'].name).toBe('projectName');
  }, 100);

  test('types propagate', async () => {
    let activeCount = 0;
    const { root: s, set } = createUniverse<Shape>({
      runtimeShape,
      resolve: path => {
        console.log(JSON.stringify(path));
        switch (path.join(',')) {
          case 'sjoerd':
            (async () => {
              await new Promise(res => setTimeout(res, 10));
              set(path, false, {
                is: { '@': 'M', familyName: 'de Jong', givenName: 'Sjoerd' },
              });
            })();

            return {
              onActive: () => (activeCount += 1),
              onInactive: () => (activeCount -= 1),
            };
          case 'sander':
            set(path, false, {
              is: ['sjoerd', 'is'],
            });

            return {};
        }
        return {};
      },
      updateListener: (path, value) => {
        console.log(path);
        console.log(value);
      },
    });

    const user = s['sjoerd'];
    const sjoerd = user();

    const disposer = reaction(() => sjoerd.is.givenName, () => {});
    await new Promise(res => setTimeout(res, 20));
    expect(activeCount).toBe(1);
    disposer();
    expect(activeCount).toBe(0);

    // expect(s['sjoerd']().is.givenName).not.toBe('Sjoerd');
    await when(() => sjoerd.is.givenName === 'Sjoerd');
    expect(sjoerd.is.givenName).toBe('Sjoerd');
    expect(s['sjoerd']().is.givenName).toBe('Sjoerd');
    expect(s['sjoerd'].is().givenName).toBe('Sjoerd');

    const sander = s['sander']();
    await when(() => sander.is.givenName === 'Sjoerd');
    expect(sander.is.givenName).toBe('Sjoerd');
    expect(s['sander']().is.givenName).toBe('Sjoerd');
    expect(s['sander'].is().givenName).toBe('Sjoerd');

    sander.is.givenName = 'Sander';
    expect(sander.is.givenName).toBe('Sander');
    expect(sjoerd.is.givenName).toBe('Sander');

    // const maybeName = sjoerd.is.familyName;
    // const name = m(maybeName);
    // const maybeGivenName = sjoerd.is.givenName;
    // const givenName = m(maybeGivenName);

    // const sjoerdsProject = sjoerd.project['molukken'];
  }, 100);
});

/**
 *
 * Subject is lijst van strings, tenminste 2 lang
 * Eerste element is de gebruikersnaam en daarmee eigenaar van het object
 *
 * [['sjoerd', 'sjoerd'],"leeftijd"] = 38
 *
 * Als ik sander toegang wil geven dan schrijft sjoerd
 *
 * ['sander'] 'sjoerd' ['sjoerd','sjoerd']
 *
 * Als sander dan ['sander', 'sjoerd'] "leeftijd" wil lezen:
 * [['sander', 'sjoerd'], 'leeftijd'] bestaat niet
 * dus pad opzoeken
 * [['sander'], 'sjoerd'] = ['sjoerd','sjoerd']
 * replace zoekopdracht
 * [['sjoerd','sjoerd'], 'leeftijd'] => deze bestaat, dus antwoord 38
 *
 */
