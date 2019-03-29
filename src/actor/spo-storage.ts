/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import { Actor } from '../utils/Actor';

import {
  Request,
  Response,
  sendResponse,
} from '../utils/Actor/request-response';

import { Tuple, state, subj, SPOShape } from '../utils/spo';
import { SpotDB } from '../utils/spotdb';

declare global {
  interface ActorMessageType {
    spoStorage: Message;
  }
  interface RequestNameMap {
    LoadRequestMessage: LoadRequestMessage;
  }
  interface RequestNameResponsePairs {
    LoadRequestMessage: LoadResponseMessage;
  }
}

export enum MessageType {
  SAVE,
  LOAD_REQUEST,
  LOAD_RESPONSE,
}

export interface SaveMessage {
  type: MessageType.SAVE;
  tuples: Tuple[];
  state: state;
}

export type LoadRequestMessage = {
  type: MessageType.LOAD_REQUEST;
  subj: subj;
} & Request;

export type LoadResponseMessage = {
  type: MessageType.LOAD_RESPONSE;
  value: SPOShape;
} & Response;

export type Message = SaveMessage | LoadRequestMessage;

export class SpoStorageActor extends Actor<Message> {
  db: SpotDB = (null as unknown) as SpotDB; // temporary assignment because dependency will only be set in init

  async onMessage(msg: Message) {
    // @ts-ignore
    this[msg.type](msg);
  }

  async init() {
    this.db = new SpotDB('pokayoka');
  }

  async [MessageType.LOAD_REQUEST](msg: LoadRequestMessage) {
    const todos = (await get('todos')) as Todo[];
    sendResponse(msg, {
      todos: todos || [],
    });
  }

  async [MessageType.SAVE](msg: SaveMessage) {
    const data = new Map<subj, SPOShape>();
    for (const [subj, pred, objt] of msg.tuples) {
      data.set(subj, { [pred]: objt });
    }
    await this.db.commit(data);
  }
}
