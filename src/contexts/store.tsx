import React, { createContext, useContext } from 'react';
import { Storage } from '../storage/index';
import { WebAdapter } from '../storage/adapters/web';
import { Store } from '../graph/index';

const stores: { [key: string]: Store } = {};

function createStore(name: string): Store {
  if (stores[name]) return stores[name];

  const storage = new Storage(new WebAdapter(name));

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
      .then(patches => {
        console.log(patches);
        storage.mergePatches(patches);

        if (patches.length > 0) {
          const { t: maxTimestamp } = patches.slice(-1)[0];
          storage.updateTimestampForStorage(remoteId, maxTimestamp);
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

export const ProvideStore: React.SFC<{ name: string }> = ({
  name,
  children,
}) => (
  <StoreContext.Provider value={createStore(name)}>
    {children}
  </StoreContext.Provider>
);
