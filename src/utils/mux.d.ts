import { MuxProtocol } from '../../server/mux/protocol';

export const startClient: () => void;
export const getClient: () => MuxProtocol | null;
