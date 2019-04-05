import { RouteComponentProps } from '@reach/router';
import React, { useEffect, useState } from 'react';

import { useAccount } from '../../contexts/spo-hub';
import { observer } from 'mobx-react-lite';
import { Box, Heading } from 'grommet';
import { usePromise } from 'react-use';

export const Sync: React.FunctionComponent<
  RouteComponentProps<{}> & {}
> = observer(({}) => {
  const mounted = usePromise();
  const [cacheEntries, setCacheEntries] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const hashes = await mounted(
        caches
          .open('cdn')
          .then(cache => cache.keys())
          .then(keys => keys.map(c => c.url.split('/').pop()!))
      );
      // This line will not execute if <Demo> component gets unmounted.
      setCacheEntries(hashes);
    })();
  });

  const account = useAccount();
  return account.fold(
    user => (
      <Box>
        <Heading level="3">Cache entries: {cacheEntries.length}</Heading>
        <ul>
          {cacheEntries.map(c => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Box>
    ),
    partial => <pre>Loading, {partial.name}</pre>
  );
});
