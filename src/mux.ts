import connect from 'pull-ws/client';
import MRPC from 'muxrpc';

import debug from 'debug';
import pull, { drain } from 'pull-stream';
import base, { filename } from 'paths.macro';
import { muxClient } from './mux/client';
const log = debug(`${base}${filename}`);

export function startMux() {
  {
    const { host, protocol } = window.location;
    const wsUrl = `ws${protocol.indexOf('https') > -1 ? 's' : ''}://${host}/`;

    // const ws = new WebSocket(wsUrl);
    // ws.addEventListener('message', ({ data }) => {
    //   log('message', data);
    // });

    connect(
      wsUrl,
      {
        binary: true,
        onConnect: (err, stream) => {
          if (err) {
            log('onConnect error %O', err);
            throw err;
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

          pull(
            client.changesSince('bk0wb0a7sz', {}),
            drain(data => console.log('changes', data))
          );
        },
      }
    );
  }
}
