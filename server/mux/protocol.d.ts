import { Source } from 'pull-stream';

type MaybeError = Error | null;

export interface MuxProtocol {
  hello: (name: string, cb: (err: MaybeError, result: string) => void) => void;
  stuff: () => Source<string>;
}
