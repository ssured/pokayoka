import { api } from '../../server/mux/protocol';
import MRPC from 'muxrpc';
import pull from 'pull-stream';
import pullWs from 'pull-ws';

let client = null;

export const getClient = () => client;

export const startClient = () => {
  if (client != null) return;
  pullWs.connect(
    'ws://localhost:9999',
    {
      binary: true,
      onConnect: (err, stream) => {
        if (err) throw new Error(err);
        client = MRPC(api, null)(); //remoteApi, localApi
        const clientStream = client.createStream();
        pull(clientStream, stream, clientStream);
        console.log('PULL CONNECT');

        client.hello('world', function(err, value) {
          if (err) throw err;
          console.log(value);
          // hello, world!
        });

        pull(client.stuff(), pull.log());
      },
    }
  );
};
