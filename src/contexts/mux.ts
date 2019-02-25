import connect from 'pull-ws/client';

import pull from 'pull-stream';
import { muxClient } from '../mux/client';

import debug from 'debug';
import base, { filename } from 'paths.macro';
const log = debug(`${base}${filename}`);

import { useAuthentication } from './authentication';

import createContainer from 'constate';
import { useEffect, useState, useContext } from 'react';

export const MuxContainer = createContainer(() => {
  const { isAuthenticated } = useAuthentication();
  const [api, setApi] = useState<ReturnType<typeof muxClient> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setApi(null);
      return;
    }

    const { host, protocol } = window.location;
    const wsUrl = `ws${protocol.indexOf('https') > -1 ? 's' : ''}://${host}/`;

    connect(
      wsUrl,
      {
        binary: true,
        onConnect: (errEvent, stream) => {
          if (errEvent) {
            log('onConnect error %O', errEvent);
            return; // swallow the error throw err;
          }

          const client = muxClient();

          const clientStream = client.createStream(err =>
            console.log('mux stream ended with', err)
          );
          // https://github.com/ssbc/secret-stack/blob/bcb91e0b072fe6734301d89159bb55f688cb639f/index.js#L178-L180
          // client.once('closed', () => {
          //   console.log('mux stream client closed');
          // });

          pull(clientStream, stream, clientStream);

          log('mux stream connected');
          setApi(client);

          // pull(
          //   client.changesSince('bk0wb0a7sz', {}),
          //   drain(data => console.log('changes', data))
          // );
        },
      }
    );
  }, [isAuthenticated]);

  return api;
});

export const useMux = () => useContext(MuxContainer.Context);
