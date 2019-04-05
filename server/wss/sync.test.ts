import { getMachineState, stateToMs } from './sync';

describe('machine state', () => {
  test('create', () => {
    expect(typeof getMachineState()).toBe('string');

    const state1 = getMachineState();
    const state2 = getMachineState();

    expect(state1).not.toBe(state2);
  });

  test('inverse', async () => {
    const waitMs = 10;
    // make sure s1 is a partial state
    let s1 = getMachineState();
    while (s1.split('.').length === 1) {
      s1 = getMachineState();
    }
    expect(s1.split('.').length).toBe(2);

    await new Promise(res => setTimeout(res, waitMs));
    const s2 = getMachineState();

    const t1 = stateToMs(s1);
    const t2 = stateToMs(s2);

    expect(typeof t1).toBe('number');

    expect(t2 - t1).toBeGreaterThanOrEqual(waitMs);
  });
});
