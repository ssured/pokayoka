import pull, { drain, Source, Through } from 'pull-stream';

export const drainStream = <T = any>(
  source: Source<any>,
  throughs: Through<any, any>[] = [],
  onValue: (value: T) => boolean | void = () => {}
): Promise<T[]> & { abort: () => void } => {
  let res: any;
  const result: T[] = [];
  const d = drain(
    (value: T) => result.push(value) && onValue(value),
    () => res(result)
  );
  return Object.assign(
    new Promise<typeof result>((innerRes, rej) => {
      res = innerRes;
      try {
        pull(source, ...throughs, d);
      } catch (e) {
        rej(e);
      }
    }),
    { abort: (d as any).abort }
  );
};
