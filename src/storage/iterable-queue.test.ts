import { IterableQueue } from './iterable-queue';

describe('Iterable FIFO queue', () => {
  test('implements iterable', () => {
    const q = new IterableQueue<number>();
    q.add(1);
    q.add(2);

    const numbers: number[] = [];

    for (const number of q) {
      numbers.push(number);
    }

    expect(numbers).toEqual([1, 2]);
  });
});
