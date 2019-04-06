import { SPOHub, StampedGetMessage, StampedPutMessage } from './spo-hub';
import { SpotDB } from './spotdb';

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
      this.hub.put({ tuple: result.tuples[0] }, this);
    }
  }

  protected put(msg: StampedPutMessage) {
    this.db.commit([msg.tuple]);
  }

  public destroy() {
    this.disposer();
  }
}
