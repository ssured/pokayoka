// just to learn

test('Iterable', () => {
  class Test implements Iterable<number> {
    constructor(private numbers: number[]) {}
    // tslint:disable-next-line function-name
    *[Symbol.iterator]() {
      yield* this.numbers;
    }
  }

  const test = new Test([1, 2]);
  expect([...test]).toEqual([1, 2]);
  expect([...test]).toEqual([1, 2]);
});
