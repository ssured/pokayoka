import Worker from 'worker-loader!./index';
import SubscribableEvent from 'subscribableevent';

import { ProtocolV1, isMessage } from '../../server/protocolv1';

const worker = new Worker();

type HandlerType = (message: ProtocolV1) => void;

const channel = new SubscribableEvent<HandlerType>();
worker.addEventListener(
  'message',
  ({ data }) => isMessage(data) && channel.fire(data)
);
// channel.subscribe(message => worker.postMessage(message))

export const client = {
  fire(message: ProtocolV1): void {
    worker.postMessage(message);
  },
  subscribe: (cb: HandlerType) => channel.subscribe(cb),
  unsubscribe: (cb: HandlerType) => channel.unsubscribe(cb),
};
