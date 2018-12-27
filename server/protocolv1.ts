export const ID = '#';
export const ACK = '@';

export type Message = {
  [ID]?: string;
  [ACK]?: string;
};

export const AskMessageType = 'ask';
export type AskMessage = Message & {
  type: typeof AskMessageType;
  id: string;
};

export const TellMessageType = 'tell';
export type TellMessage = Message & {
  type: typeof TellMessageType;
  doc: {
    _id: string;
    [key: string]: any;
  };
};

export type ProtocolV1 = AskMessage | TellMessage;

export const isMessage = (obj: any): obj is ProtocolV1 => {
  return (
    typeof obj === 'object' &&
    (obj.type === AskMessageType || obj.type === TellMessageType)
  );
};
