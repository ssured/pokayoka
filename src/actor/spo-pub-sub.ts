import mlts from 'monotonic-lexicographic-timestamp';
import { Actor, ActorHandle, lookup } from '../utils/Actor';

import { subj, pred, Tuple, state } from '../utils/spo';

declare global {
  interface ActorMessageType {
    spoPubSub: Message;
  }
}

export const getLocalState = mlts() as () => state;

export enum MessageType {
  SUBSCRIBE,
  REQUEST,
  PUBLISH,
}

export interface SubscribeMessage {
  type: MessageType.SUBSCRIBE;
  actorName: string;
}

export interface RequestMessage {
  type: MessageType.REQUEST;
  localState?: state;
  sourceActorName: string;
  s: subj;
  p?: pred;
}

// outbound messages are guaranteed to have a local timestamp
// but typing might not fit the actor model helpers
export interface StampedRequestMessage extends RequestMessage {
  localState: state;
}

export interface PublishMessage {
  type: MessageType.PUBLISH;
  localState?: state;
  sourceActorName: string;
  tuple: Tuple;
  state?: state;
}
export interface StampedPublishMessage extends PublishMessage {
  localState: state;
}

export type Message = SubscribeMessage | RequestMessage | PublishMessage;

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
  async [MessageType.REQUEST](msg: RequestMessage) {
    const stampedMsg = {
      ...msg,
      localState: getLocalState(),
    } as StampedRequestMessage;
    for (const { name, handle } of this.subscribers) {
      if (name === msg.sourceActorName) {
        continue;
      }
      handle.send(stampedMsg);
    }
  }

  // tslint:disable-next-line function-name
  async [MessageType.PUBLISH](msg: PublishMessage) {
    const stampedMsg = {
      ...msg,
      localState: getLocalState(),
    } as StampedPublishMessage;
    for (const { name, handle } of this.subscribers) {
      if (name === msg.sourceActorName) {
        continue;
      }
      handle.send(stampedMsg);
    }
  }
}
