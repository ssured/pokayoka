const fetchMachine = Machine({
  id: 'step',
  initial: 'one',
  states: {
    one: {
      on: { NEXT: 'two' },
    },
    two: {
      on: { NEXT: 'three', PREV: 'one' },
    },
    three: {
      type: 'final',
      on: { PREV: 'two' },
    },
  },
});
