import { SPOHub, StampedGetMessage, StampedPutMessage } from './spo-hub';
import ReconnectingWebSocket from 'reconnecting-websocket';

export class SPOWs {
  private disposer: () => void;

  constructor(protected hub: SPOHub, protected ws: ReconnectingWebSocket) {
    this.disposer = hub.register(this, msg => {
      // @ts-ignore
      this[msg.type](msg);
    });

    ws.onmessage = ev => {
      try {
        const msg = JSON.parse(ev.data);
        // @ts-ignore
        this.hub[msg.type](msg);
      } catch (e) {
        console.error('ws message error', e);
      }
    };
  }

  protected async get(msg: StampedGetMessage) {
    this.ws.send(JSON.stringify(msg));
  }

  protected put(msg: StampedPutMessage) {
    this.ws.send(JSON.stringify(msg));
  }

  public destroy() {
    this.disposer();
  }
}
