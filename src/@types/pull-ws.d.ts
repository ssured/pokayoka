declare module 'pull-ws/client' {
  import { Through } from 'pull-stream';

  export default function connect(
    url: string,
    options: {
      binary: boolean;
      onConnect(err: Error | null | undefined, stream: Through): void;
    }
  ): any;
}

declare module 'pull-ws/server' {
  import { IncomingMessage } from 'http';
  import { Through } from 'pull-stream';
  import { ServerOptions } from 'ws';

  export default function createServer(
    options: ServerOptions,
    onConnect: (
      stream: Through & { remoteAddress: string },
      request: IncomingMessage
    ) => void
  ): any;
}
