import { api } from '../../server/mux/protocol';
import MRPC from 'muxrpc';
import pull from 'pull-stream';
import pullWs from 'pull-ws';
import debounce from 'pull-debounce';
import tee from 'pull-tee';

let client = null;

export const getClient = () => client;

export const startClient = () => {
  if (client != null) return;
  pullWs.connect('ws://localhost:9999', {
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

      // pull(client.stuff(), pull.log());
      // read changes from server
      const db = 'bk0wb0a7sz';
      const server = 'localhost:5984-uniq-id';
      const key = `seq-${server}-${db}`;

      pull(
        client.changesSince(db, {
          since: localStorage.getItem(key) || 0,
        }),
        tee(
          pull(
            pull.filter(({ seq }) => !!seq), // only items which contain a real change
            debounce(10), // debounce as writing to localStorage is slow
            pull.drain(({ seq }) => localStorage.setItem(key, seq))
          )
        ),
        pull.log()
      );

      // send data to server
      pull(pull.values([1, 2, 3]), client.log());

      console.log('done onconnect');
    },
  });
};
