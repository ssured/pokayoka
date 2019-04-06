import { SPOHub, StampedGetMessage, StampedPutMessage } from './spo-hub';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { IncomingMessage, OutgoingMessage } from '../../server/wss';

export class SPOWs {
  public databaseId: string | null = null;
  private disposer: () => void;
  public connections = 0;

  private send(msg: IncomingMessage) {
    this.ws.send(JSON.stringify(msg));
  }

  constructor(protected hub: SPOHub, protected ws: ReconnectingWebSocket) {
    this.disposer = hub.register(this, msg => {
      // @ts-ignore
      this[msg.type](msg);
    });

    const lastKnowRemoteState = ''; // FIXME: implement a cache for this

    ws.onopen = async () => {
      // this is either a first connection or a reconnection after the network was out
      this.connections += 1;
      this.send({
        type: 'tuplessince',
        state: lastKnowRemoteState,
      });
    };

    ws.onclose = () => {
      this.connections -= 1;
    };

    ws.onmessage = ev => {
      try {
        const msg = JSON.parse(ev.data) as OutgoingMessage;

        switch (msg.type) {
          case 'identification':
            this.databaseId = msg.databaseId;
            break;
          default:
            // @ts-ignore
            this.hub[msg.type](msg, this);
        }
      } catch (e) {
        console.error('ws message error', e);
      }
    };
  }

  protected async get(msg: StampedGetMessage) {
    this.send(msg);
  }

  protected put(msg: StampedPutMessage) {
    this.send(msg);
  }

  public destroy() {
    this.disposer();
  }
}
