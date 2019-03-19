import { Actor, ActorHandle, lookup } from '../utils/Actor';
import { SPOMessage } from './types';

declare global {
  interface ActorMessageType {
    spoPubSub: Message;
  }
}

export enum MessageType {
  SUBSCRIBE,
  PUBLISH,
}

export interface SubscribeMessage {
  type: MessageType.SUBSCRIBE;
  actorName: string;
}

export interface PublishMessage {
  type: MessageType.PUBLISH;
  sourceActorName?: string;
  payload: SPOMessage;
}

export type Message = SubscribeMessage | PublishMessage;

interface Subscriber {
  name: string;
  handle: ActorHandle<any>;
}

export class SpoPubSubActor extends Actor<Message> {
  subscribers: Subscriber[] = [];

  async onMessage(msg: Message) {
    // @ts-ignore
    this[msg.type](msg);
  }

  // tslint:disable-next-line function-name
  async [MessageType.SUBSCRIBE](msg: SubscribeMessage) {
    const handle = lookup(msg.actorName as any);
    this.subscribers.push({
      handle,
      name: msg.actorName,
    });
  }

  // tslint:disable-next-line function-name
  async [MessageType.PUBLISH](msg: PublishMessage) {
    for (const { name, handle } of this.subscribers) {
      if (name === msg.sourceActorName) {
        continue;
      }
      handle.send(msg);
    }
  }
}
