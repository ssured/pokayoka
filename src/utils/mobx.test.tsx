import React from 'react';
import { observable, onBecomeObserved, when, autorun } from 'mobx';
import { createUniverse, m } from './path-proxy';
import { nothing, isSomething } from './maybe';
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
    const s = createUniverse<Shape>(async path => {
      console.log(path.join(','));
      switch (path.join(',')) {
        case 'sjoerd':
          return {
            initialValue: {
              is: { '@': 'M', familyName: 'de Jong', givenName: 'Sjoerd' },
            },
            onActive: () => (activeCount += 1),
            onInactive: () => (activeCount -= 1),
          };
      }
      return { initialValue: {} };
    });

    const user = s['sjoerd'];
    const sjoerd = user();

    await when(() => isSomething(sjoerd.is.givenName));

    const disposer = autorun(() => {
      if (sjoerd.is.givenName === 'Sjoerd') {
        console.log(activeCount);
        disposer();
      }
    });

    expect(s['sjoerd']().is.givenName).toBe('Sjoerd');
    expect(sjoerd.is.givenName).toBe('Sjoerd');

    const rendered = <span>{m(sjoerd.is.givenName)}</span>;

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
