import { asyncReference, PENDING, asPlaceholder } from './asyncReference';
import {
  types,
  ReferenceIdentifier,
  getSnapshot,
  Instance,
} from 'mobx-state-tree';
import { when, configure } from 'mobx';
import { isNothing } from './maybe';

configure({ enforceActions: 'always' });

describe('asyncReference loads references using a side effect', () => {
  test('it loads a reference', async () => {
    const ModelOne = types.model({
      id: types.identifier,
      text: 'something',
    });

    const modelOneLoader = async (id: ReferenceIdentifier) => {
      await new Promise(res => setTimeout(res, 10));
      return ModelOne.create({ id: `${id}` });
    };

    const ModelTwo = types.model({
      id: types.identifier,
      one: asyncReference(ModelOne, modelOneLoader),
    });

    const two = ModelTwo.create({ id: 'two', one: 'one' });

    expect(two.id).toBe('two');
    expect(two.one.state).toBe(PENDING);

    expect(() => two.one.maybe.id).not.toThrow();

    await when(() => two.one.settled);

    expect(!isNothing(two.one.maybe) && two.one.maybe.text).toBe('something');

    expect(getSnapshot(two)).toEqual({ id: 'two', one: 'one' });
  }, 100);

  test('it updates a reference', async () => {
    const ModelOne = types.model('ONE', {
      id: types.identifier,
      text: 'something',
    });

    const modelOneLoader = async (id: ReferenceIdentifier) => {
      await new Promise(res => setTimeout(res, 10));
      return ModelOne.create({ id: `${id}` });
    };

    const ModelTwo = types
      .model('TWO', {
        id: types.identifier,
        ref: asyncReference(ModelOne, modelOneLoader),
        oRef: types.safeReference(ModelOne),
      })
      .actions(self => ({
        updateRef(instance: Instance<typeof ModelOne>) {
          self.ref = asPlaceholder(instance);
        },
      }));

    const two = ModelTwo.create({ id: 'two', ref: 'one', oRef: 'one' });

    const three = ModelOne.create({ id: 'three' });

    await when(() => two.ref.settled);

    two.updateRef(three);

    await when(() => two.ref.settled);

    expect(!isNothing(two.ref.maybe) && two.ref.maybe.text).toBe('something');

    expect(getSnapshot(two)).toEqual({ id: 'two', ref: 'three' });
  }, 100);
});
