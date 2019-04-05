import levelup from 'levelup';
import leveldown from 'leveldown';
import encode from 'encoding-down';
import charwise, { CharwiseKey } from 'charwise';

import { JsonEntry } from '../../src/utils/json';
export type KeyType = CharwiseKey;
export type ValueType = JsonEntry;

import path from 'path';
import { generateId } from '../../src/utils/id';
import { Tuple, subj, pred, objt, state } from '../../src/utils/spo';
import { AbstractBatch } from 'abstract-leveldown';
import { getMachineState, stateToMs } from './sync';
import { ham } from '../../src/utils/ham';
import console = require('console');

export const level = levelup(
  encode<KeyType, ValueType>(
    leveldown(path.join(__dirname, '../../pokayokadb')),
    {
      keyEncoding: charwise,
      valueEncoding: 'json',
    }
  )
);

let id: string;
export async function levelId() {
  if (id) {
    return id;
  }
  try {
    return (id = (await level.get('id')) as string);
  } catch (e) {
    if (e.notFound) {
      id = generateId();
      await level.put('id', id);
      return id;
    }
    throw e;
  }
}

export async function current(
  subj: subj,
  pred: pred
): Promise<null | [objt, state]> {
  try {
    return (await level.get(['sp', subj, pred])) as any;
  } catch (e) {
    return null;
  }
}

// let lastMachineState: state | null = null;
let updateIsRunning = false;
let rerunUpdate = false;
async function updateFromTSP() {
  if (updateIsRunning) {
    rerunUpdate = true;
    return;
  }
  try {
    updateIsRunning = true;
    rerunUpdate = false;

    const currentState = getMachineState();
    const options = {
      gt: ['tsp'],
      lte: ['tsp', currentState],
    };
    // lastMachineState = currentState;

    for await (const data of level.createReadStream(options)) {
      const {
        key: [_, t, s, p],
        value: [o],
      } = (data as unknown) as {
        key: ['tsp', state, subj, pred];
        value: [objt];
      };

      const batch = await merge([s, p, o], t);

      if (batch.length > 0) {
        console.log('will merge', s.join('.'), p, o);
      }

      batch.push({
        type: 'del',
        key: (data as any).key,
      });

      await level.batch(batch);
    }
  } catch (e) {
    console.error('updateFromTSP failed with', e);
    rerunUpdate = true;
  } finally {
    updateIsRunning = false;
    if (rerunUpdate) {
      setTimeout(updateFromTSP, 100);
    }
  }
}

async function merge([s, p, o]: Tuple, t: state) {
  const batch: AbstractBatch[] = [];
  const curr = await current(s, p);
  const machineState = getMachineState();

  let doMerge = false;
  if (curr == null) {
    doMerge = true;
  } else {
    const [currentValue, currentState] = curr;
    const result = ham(machineState, t, currentState, o, currentValue);
    console.log({ curr, t, result });

    doMerge = result.resolution === 'merge' && result.incoming;
  }

  if (doMerge) {
    batch.push(
      {
        type: 'put',
        key: ['sp', s, p],
        value: [o, t],
      },
      {
        type: 'put',
        key: ['log', machineState, s, p, t],
        value: [o],
      },
      { type: 'put', key: ['spo', s, p, o], value: true },
      { type: 'put', key: ['pso', p, s, o], value: true },
      { type: 'put', key: ['ops', o, p, s], value: true },
      { type: 'put', key: ['sop', s, o, p], value: true },
      { type: 'put', key: ['osp', o, s, p], value: true },
      { type: 'put', key: ['pos', p, o, s], value: true }
    );

    if (curr) {
      // remove old items
      const [o] = curr;
      batch.push(
        { type: 'del', key: ['spo', s, p, o] },
        { type: 'del', key: ['pso', p, s, o] },
        { type: 'del', key: ['ops', o, p, s] },
        { type: 'del', key: ['sop', s, o, p] },
        { type: 'del', key: ['osp', o, s, p] },
        { type: 'del', key: ['pos', p, o, s] }
      );
    }
  }

  return batch;
}

export async function persist([s, p, o]: Tuple, t: state) {
  const machineState = getMachineState();

  const batch: AbstractBatch[] = [
    { type: 'put', key: ['tsp', t, s, p], value: [o] },
  ];

  await level.batch(batch);

  if (t < machineState) {
    updateFromTSP();
  }
}
