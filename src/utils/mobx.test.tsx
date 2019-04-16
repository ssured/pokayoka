import React from 'react';
import { observable, onBecomeObserved, when, reaction } from 'mobx';
import { createUniverse } from './path-proxy';
import console = require('console');

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

type P = {
  // project
  '@': 'P';
  name: string;
  roles: Record<string, M>;
};

type R = {
  // Role
  '@': 'R';
  roleName: string;
  member: M;
};

type M = {
  // member / person
  '@': 'M';
  familyName: string;
  givenName?: string;
};

type U = {
  // user
  project: Record<string, P>;
  is: M;
};

type Shape = Record<string, U>;

describe('pathproxy for ids', () => {
  test('types propagate', async () => {
    let activeCount = 0;
    const s = createUniverse<Shape>({
      resolve: (path, setValue) => {
        console.log(path.join(','));
        switch (path.join(',')) {
          case 'sjoerd':
            (async () => {
              await new Promise(res => setTimeout(res, 10));
              setValue({
                is: { '@': 'M', familyName: 'de Jong', givenName: 'Sjoerd' },
              });
            })();

            return {
              onActive: () => (activeCount += 1),
              onInactive: () => (activeCount -= 1),
            };
          case 'sander':
            setValue({
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
