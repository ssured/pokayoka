// export const client: {
//     connect(
//       url: string,
//       options: {
//         binary: boolean;
//         onConnect(err: Error | null | undefined, stream: Through<any>): void;
//       }
//     ): any;
//   };

declare module 'pull-ws/server' {
  import { IncomingMessage } from 'http';
  import { Duplex } from 'pull-stream';
  import { ServerOptions } from 'ws';

  export default function createServer(
    options: ServerOptions,
    onConnect: (
      stream: Duplex & { remoteAddress: string },
      request: IncomingMessage
    ) => void
  ): any;
}
