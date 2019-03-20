import { HamModel, HAM_PATH, maxStateFromHam } from './index';

import {
  types,
  getSnapshot,
  SnapshotOut,
  IAnyStateTreeNode,
} from 'mobx-state-tree';

describe('integrates with mst', () => {
  let state = 1;

  it('works with plain models', () => {
    const Author = HamModel.named('Author')
      .props({
        name: types.string,
      })
      .actions(self => ({
        setName(name: string) {
          self.name = name;
        },
      }));

    state = 1;

    const author = Author.create(
      { name: 'Rowling' },
      { machineState: () => state }
    );
    author.setName('JK Rowling');

    expect(getSnapshot(author)[HAM_PATH]).toEqual([
      1,
      {
        name: 1,
      },
    ]);
  });

  it('works with composed models', () => {
    const Author = types.compose(
      'Author',
      HamModel,
      types
        .model({
          name: types.string,
        })
        .actions(self => ({
          setName(name: string) {
            self.name = name;
          },
        }))
    );

    state = 1;

    let currentSnapshot: undefined | SnapshotOut<typeof Author> = undefined;

    const author = Author.create(
      { name: 'Rowling' },
      {
        waitUntilState: (state: number, cb: () => void) =>
          setTimeout(cb, state - Date.now() + 1),
        machineState: () => state,
        onSnapshot: (snapshot: SnapshotOut<typeof Author>) =>
          (currentSnapshot = snapshot),
      }
    );
    author.setName('JK Rowling');

    expect(currentSnapshot && currentSnapshot[HAM_PATH]).toEqual([
      1,
      {
        name: 1,
      },
    ]);
    expect(currentSnapshot && maxStateFromHam(currentSnapshot[HAM_PATH])).toBe(
      1
    );
  });

  it('works with nested models', () => {
    const Author = HamModel.named('Author')
      .props({
        name: types.model({ first: types.string, last: types.string }),
      })
      .actions(self => ({
        setName(first: string, last: string) {
          self.name.first = first;
          self.name.last = last;
        },
      }));

    state = 1;

    const author = Author.create(
      { name: { first: 'JK', last: 'Rowling' } },
      { machineState: () => state }
    );

    expect(getSnapshot(author)[HAM_PATH]).toEqual([
      1,
      {
        name: [1, { first: 1, last: 1 }],
      },
    ]);

    state = 2;

    author.setName('J', 'Rowlings');

    expect(getSnapshot(author)[HAM_PATH]).toEqual([
      1,
      {
        name: [1, { first: 2, last: 2 }],
      },
    ]);
  });

  it('merges nested models', () => {
    const notfications: SnapshotOut<typeof Author>[] = [];

    const Author = HamModel.named('Author')
      .props({
        name: types.model({ first: types.string, last: types.string }),
      })
      .actions(self => ({
        setName(first: string, last: string) {
          self.name.first = first;
          self.name.last = last;
        },
        notifyHamChange(obj: IAnyStateTreeNode) {
          notfications.push(getSnapshot(obj));
        },
      }));

    state = 1;

    const author1 = Author.create(
      { name: { first: 'JK', last: 'Rowling' } },
      { machineState: () => state }
    );

    expect(notfications.length).toBe(0);

    const author2 = Author.create(getSnapshot(author1), {
      machineState: () => state,
    });

    expect(notfications.length).toBe(0);

    state = 2;

    author1.setName('JK', 'Rowlings');

    expect(notfications.length).toBe(1);

    expect(getSnapshot(author1)[HAM_PATH]).toEqual([
      1,
      {
        name: [1, { first: 1, last: 2 }],
      },
    ]);

    state = 3;

    author2.setName('J', 'Rowling');

    expect(notfications.length).toBe(2);

    expect(getSnapshot(author2)[HAM_PATH]).toEqual([
      1,
      {
        name: [1, { first: 3, last: 1 }],
      },
    ]);

    state = 4;

    author1.merge(author2);

    expect(notfications.length).toBe(3);

    expect(getSnapshot(author1)).toEqual({
      [HAM_PATH]: [
        1,
        {
          name: [1, { first: 3, last: 2 }],
        },
      ],
      name: { first: 'J', last: 'Rowlings' },
    });

    state = 5;

    author2.merge(author1);

    expect(notfications.length).toBe(4);

    expect(getSnapshot(author2)).toEqual({
      [HAM_PATH]: [
        1,
        {
          name: [1, { first: 3, last: 2 }],
        },
      ],
      name: { first: 'J', last: 'Rowlings' },
    });

    expect(maxStateFromHam((getSnapshot(author2) as any)[HAM_PATH])).toBe(3);
  });

  it('notifies on changes', () => {
    const notfications: SnapshotOut<typeof Author>[] = [];

    const Author = HamModel.named('Author')
      .props({
        name: types.string,
      })
      .actions(self => ({
        setName(name: string) {
          self.name = name;
        },
        notifyHamChange(obj: IAnyStateTreeNode) {
          notfications.push(getSnapshot(obj));
        },
      }));

    state = 1;

    const author = Author.create(
      { name: 'Rowling' },
      { machineState: () => state }
    );

    expect(notfications.length).toBe(0);

    author.setName('JK Rowling');

    expect(notfications.length).toBe(1);

    expect(getSnapshot(author)[HAM_PATH]).toEqual([
      1,
      {
        name: 1,
      },
    ]);
  });
});
