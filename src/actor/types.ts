type Primitive = boolean | string | number | null;

export type subj = string[];
export type pred = string;
export type objt = Primitive | subj;

export enum SPOMessageType {
  REQUEST,
  WRITE,
  TUPLE,
}

export interface RequestMessage {
  type: SPOMessageType.REQUEST;
  s: subj;
}

export interface TupleMessage {
  type: SPOMessageType.TUPLE;
  s: subj;
  p: pred;
  o: objt;
}

export type SPOMessage = RequestMessage | TupleMessage;
