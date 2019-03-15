import React, { createContext, useContext, useMemo } from 'react';
import { ObjectStorage } from '../storage/object';
import { WebAdapter } from '../storage/adapters/web';
import { Store } from '../graph/index';
import { IAnyModelType } from 'mobx-state-tree';
import { observableAsyncPlaceholder } from '../graph/asyncPlaceholder';

const stores: { [key: string]: Store } = {};

function createStore(name: string): Store {
  if (stores[name]) return stores[name];

  const adapter = new WebAdapter(name);
  const storage = new ObjectStorage(adapter);

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
      .then(async ({ patches, until }) => {
        console.log(`Got ${patches.length} patches, until: ${until}`);
        storage.mergePatches(patches);

        if (patches.length > 0) {
          storage.updateTimestampForStorage(remoteId, until);
        }
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
