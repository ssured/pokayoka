import React, { createContext, useContext, useMemo } from 'react';
import { Storage } from '../storage/index';
import { WebAdapter } from '../storage/adapters/web';
import { Store } from '../graph/index';
import { IAnyModelType } from 'mobx-state-tree';
import { observableAsyncPlaceholder } from '../graph/asyncPlaceholder';

const stores: { [key: string]: Store } = {};

function createStore(name: string): Store {
  if (stores[name]) return stores[name];

  const adapter = new WebAdapter(name);
  const storage = new Storage(adapter);

  (async function() {
    const { id: remoteId } = (await fetch(`/data/${name}/info`).then(res =>
      res.json()
    )) as {
      id: string;
      window: [string, string];
    };

    const timestamp = await storage.timestampForStorage(remoteId);

    fetch(`/data/${name}/patches?since=${timestamp}`)
      .then(res => res.json())
      .then(async patches => {
        console.log(patches);
        storage.mergePatches(patches);

        if (patches.length > 0) {
          const { t: maxTimestamp } = patches.slice(-1)[0];
          storage.updateTimestampForStorage(remoteId, maxTimestamp);
        }

        console.log(
          await adapter
            .queryList<[string, any, any, any], true>({
              gt: ['ops', 'site', '', null],
              lt: ['ops', 'site', [], undefined],
            })
            .then(result => {
              return result.map(({ key: [, o, p, s] }) => ({ s, p, o }));
            })
        );

        // console.log(await storage.getObject('c1d1ila9an'));
      });
  })();

  return (stores[name] = new Store(storage));
}

const StoreContext = createContext<Store>(null as any);

export const useStore = () => {
  const store = useContext(StoreContext);
  if (store == null) throw new Error('Store is not initialized');
  return store;
};

export const useModel = <T extends IAnyModelType>(
  model: () => T,
  id: string
) => {
  const store = useContext(StoreContext);

  return useMemo(() => {
    return observableAsyncPlaceholder(store.getInstance(model(), id), {
      id,
    });
  }, [store, model, id]);
};

export const ProvideStore: React.SFC<{ name: string }> = ({
  name,
  children,
}) => (
  <StoreContext.Provider value={createStore(name)}>
    {children}
  </StoreContext.Provider>
);
