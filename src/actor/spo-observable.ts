import { Actor, lookup } from '../utils/Actor';
import { SPOMessageType, objt } from './types';
import dset from 'dset';
import { observable, runInAction } from 'mobx';
import { ensureNever } from '../utils/index';
import {
  MessageType as PubSubMessageType,
  PublishMessage,
} from './spo-pub-sub';

declare global {
  interface ActorMessageType {
    spoObservable: Message;
    // dbState: SPOMessage;
  }
}

export type Message = PublishMessage;

export interface State {
  [key: string /* path [...subj, pred] */]: State | objt;
}

export class SPOObservableActor extends Actor<Message> {
  private pubsubActor = lookup('spoPubSub');
  public state = observable<State>({});

  async init() {
    // Subscribe to state updates
    this.pubsubActor.send({
      actorName: this.actorName!,
      type: PubSubMessageType.SUBSCRIBE,
    });
  }

  async onMessage(msg: Message) {
    switch (msg.type) {
      case PubSubMessageType.PUBLISH:
        const { payload } = msg;
        switch (payload.type) {
          case SPOMessageType.REQUEST:
            // ignore requests
            break;
          case SPOMessageType.TUPLE:
            // write to the local observable state
            runInAction(() => {
              dset(this.state, payload.s.concat(payload.p), payload.o);
            });
            break;
          default:
            ensureNever(payload);
        }
        break;
      default:
        ensureNever(msg.type);
    }
  }

  public request(id: string) {
    this.pubsubActor.send({
      type: PubSubMessageType.PUBLISH,
      payload: {
        type: SPOMessageType.REQUEST,
        s: [id],
      },
      sourceActorName: this.actorName!,
    });
  }
}
