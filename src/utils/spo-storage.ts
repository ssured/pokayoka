import { SPOHub, StampedGetMessage, StampedPutMessage } from './spo-hub';
import { SpotDB } from './spotdb';
import { ham } from './ham';

export class SPOStorage {
  private disposer: () => void;

  constructor(protected hub: SPOHub, protected db: SpotDB) {
    this.disposer = hub.register(this, msg => {
      // @ts-ignore
      this[msg.type](msg);
    });
  }

  protected async get(msg: StampedGetMessage) {
    const { subj, pred } = msg;
    if (pred) {
      for await (const result of this.db.query(v => [
        {
          s: subj,
          p: pred,
          o: v('o'),
        },
      ])) {
        return this.hub.put({ tuple: result.tuples[0] }, this);
      }
    }

    for await (const result of this.db.query(v => [
      {
        s: { gte: subj, lt: [...subj, undefined] },
        p: v('p'),
        o: v('o'),
      },
    ])) {
      // console.log(
      //   `spo-storage put ${result.tuples.length} ${JSON.stringify(
      //     result.tuples[0]
      //   )}`
      // );
      this.hub.put({ tuple: result.tuples[0] }, this);
    }
  }

  protected async put(msg: StampedPutMessage) {
    const [subj, pred, incomingValue, incomingState] = msg.tuple;
    const [, , currentValue = undefined, currentState = ''] =
      (await this.db.get(subj, pred)) || [];
    const machineState = msg.localState;

    const result = ham(
      machineState,
      incomingState,
      currentState,
      incomingValue,
      currentValue
    );

    if (result.resolution === 'merge' && result.incoming) {
      // console.log('merge', msg);
      this.db.commit([msg.tuple]);
    }
  }

  public destroy() {
    this.disposer();
  }
}
