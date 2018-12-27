interface Shared<T> {
  ended?: boolean | Error;
}

export interface Sink<T> extends Shared<T> {
  write: (data: T) => void;
  end: (err?: boolean | Error) => void;
  paused: boolean;
  source?: Source<T>;
}

export interface Source<T> extends Shared<T> {
  pipe: <U extends Sink<T>>(sink: U) => U;
  resume: () => void;
  sink?: Sink<T>;
  abort: (err: Error) => void;
}

export interface Through<T> extends Sink<T>, Source<T> {}

export interface Duplex<T, U = T> {
  source: Source<T>;
  sink: Sink<U>;
}

//   import { Sink, Source, Through } from 'push-stream';

// function pipe<T>(this: Source<T>, sink: Sink<T>) {
//   this.sink = sink;
//   sink.source = this;
//   if (!sink.paused) this.resume();
//   return sink;
// }

// a stream that reads an array
class Values<T> implements Source<T> {
  sink?: Sink<T>;
  ended?: boolean | Error;

  private iterator: Iterator<T>;
  private result: IteratorResult<T>;

  constructor(iterable: Iterable<T>) {
    this.iterator = iterable[Symbol.iterator]();
    this.result = {} as any;
  }

  resume() {
    if (!this.sink || this.ended) return;

    while (!this.sink.paused && !this.result.done) {
      this.result = this.iterator.next()!;

      if (!this.result.done) {
        this.sink.write(this.result.value as any);
      }
    }

    if (this.result.done) this.sink.end();
  }

  pipe<U extends Sink<T>>(sink: U) {
    this.sink = sink;
    sink.source = this;
    this.resume();
    return sink;
  }

  abort(err?: boolean | Error) {
    this.ended = err;

    if (this.sink && !this.sink.ended) this.sink.end(err);
  }
}

function sinkFn<T>(fn: (data: T) => void): Sink<T> {
  return {
    paused: false,
    write(data) {
      fn(data);
    },
    end(err) {
      this.ended = err || true;
    },
  };
}

function throughMap<T, U>(fn: (value: T) => U): Sink<T> & Source<U> {
  return {
    paused: true,
    write(data) {
      if (!this.sink) throw new Error('no sink connected');

      this.sink.write(fn(data));
      this.paused = this.sink.paused;
    },
    end(err) {
      if (!this.sink) throw new Error('no sink connected');

      this.ended = err || true;
      this.sink.end(err);
    },
    resume() {
      if (!this.source) throw new Error('no source connected');

      this.source.resume();
    },
    pipe(sink) {
      this.sink = sink;
      sink.source = this;
      this.paused = this.sink.paused;
      if (!this.sink.paused) this.resume();
      return sink;
    },
    abort(err) {
      if (!this.source) throw new Error('no source connected');

      this.source.abort(err);
    },
  };
}

describe('push-stream', () => {
  test('types', () => {
    const result: string[] = [];
    const ary = [1, 2, 3];

    const numbers = new Values(ary);
    const nToS = throughMap((n: number) => String(n));
    const display = sinkFn((value: string) => result.push(value));

    numbers.pipe(nToS).pipe(display);

    expect(result).toEqual(['1', '2', '3']);
  });
});

class Collect<T> implements Sink<T> {
  public paused = false;
  public buffer = [] as T[];

  constructor(private cb: (err: null | Error, items?: T[]) => void) {}

  write(data: T) {
    this.buffer.push(data);
  }

  end(err?: boolean | Error) {
    if (err && err !== true) this.cb(err);
    else this.cb(null, this.buffer);
  }
}

describe('push-stream', () => {
  test('types', () => {
    const result: number[] = [];
    const ary = ['1', '2', '3'];

    const numbers = new Values(ary);
    const sToN = throughMap((s: string) => parseInt(s, 10));
    const collectNrs = new Collect((err, numbers?: number[]) => {
      if (!err && numbers) result.push(...numbers);
    });

    numbers.pipe(sToN).pipe(collectNrs);

    expect(result).toEqual([1, 2, 3]);
  });
});

class Async<T> implements Through<T> {
  buffer = [];
  paused = true;
  ended: boolean | Error = false;

  private inflight = 0;
  source?: Source<T>;
  sink?: Sink<T>;

  constructor(
    private fn: (
      data: T,
      cb: (err: null | boolean | Error, data: T) => void
    ) => void
  ) {}

  write(data: T) {
    this.paused = true;
    this.inflight += 1;
    this.fn(data, (err, _data) => {
      if (!this.sink) throw new Error('no sink attached');

      this.inflight -= 1;
      if (err && err !== true) {
        this.sink.end(err);
        return;
      }
      this.sink.write(_data);

      if (this.paused && !this.sink.paused) {
        this.paused = false;
        this.resume();
      }
    });
  }

  resume() {
    if (!this.sink) throw new Error('no sink attached');

    this.paused = false;
    if (this.ended && !this.inflight) {
      this.sink.end(this.ended === true ? undefined : this.ended);
    } else if (this.source) {
      this.source.resume();
    }
  }

  pipe<U extends Sink<T>>(sink: U) {
    this.sink = sink;
    sink.source = this;
    if (!this.sink.paused) this.resume();
    return sink;
  }

  end(err?: boolean | Error) {
    if (!this.sink) throw new Error('no sink attached');

    this.ended = err || true;
    if (!this.inflight) this.sink.end(this.ended);
  }

  abort(err: Error) {
    if (!this.source) throw new Error('no source connected');

    this.source.abort(err);
  }
}
