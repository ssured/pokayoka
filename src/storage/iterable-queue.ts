import { Queue } from 'typescript-collections';

export function* itemsIn<T>(queue: Queue<T>) {
  while (!queue.isEmpty()) {
    yield queue.dequeue() as T;
  }
}

export class IterableQueue<T> extends Queue<T> implements Iterable<T> {
  // tslint:disable-next-line function-name
  [Symbol.iterator]() {
    return itemsIn(this);
  }
}
