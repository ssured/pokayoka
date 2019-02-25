import connect from 'pull-ws/client';

import pull, { drain } from 'pull-stream';
import { muxClient } from './mux/client';

import debug from 'debug';
import base, { filename } from 'paths.macro';
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

          pull(
            client.changesSince('bk0wb0a7sz', {}),
            drain(data => console.log('changes', data))
          );
        },
      }
    );
  }
}
