import { SPOHub, StampedGetMessage, StampedPutMessage } from './spo-hub';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { OutgoingMessage, IdentificationMessage } from '../../server/wss';

export class SPOWs {
  public databaseId: string | null = null;
  private disposer: () => void;

  constructor(protected hub: SPOHub, protected ws: ReconnectingWebSocket) {
    this.disposer = hub.register(this, msg => {
      // @ts-ignore
      this[msg.type](msg);
    });

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
    this.ws.send(JSON.stringify(msg));
  }

  protected put(msg: StampedPutMessage) {
    this.ws.send(
      JSON.stringify({ ...msg, state: msg.state || msg.localState })
    );
  }

  public destroy() {
    this.disposer();
  }
}
