type Msg = {
  '#'?: string; // allowed message identifier
};

type RequestMsg = {} & Msg;

type ResponseMsg = {
  '@'?: string; // answer to request identifier
} & Msg;

export const getData = 'getData';
export type GetData = {
  Request: {
    type: typeof getData;
    identifier: string;
  } & RequestMsg;
  Response: {
    type: typeof getData;
    snapshot: any;
  } & ResponseMsg;
};

export const putData = 'putData';
export type PutData = {
  Request: {
    type: typeof putData;
    snapshot: any;
  } & RequestMsg;
};

export type AnyRequestMessage = GetData['Request'] | PutData['Request'];
export type AnyResponseMessage = GetData['Response'];
export type AnyMessage = AnyRequestMessage | AnyResponseMessage;
