import { generateId } from '../utils/id';
import SubscribableEvent from 'subscribableevent';

type EventFunction<T> = (message: T) => void;
type EventFunctionTrail<T> = (message: T, trail?: string[]) => void;

export class EventHub<T> {
  private readonly connections = new Map<string, EventHub<T>>();
  private in = new SubscribableEvent<EventFunction<T>>();
  private out = new SubscribableEvent<EventFunction<T>>();

  constructor(public readonly id = generateId()) {
    this.out.subscribe(message => this.propagate(message));
  }

  subscribe(f: EventFunction<T>) {
    return this.in.subscribe(f);
  }

  fire(message: T) {
    return this.out.fire(message);
  }

  private propagate: EventFunctionTrail<T> = (message, trail) => {
    if (trail != null) {
      if (trail.indexOf(this.id) > -1) return; // we saw this message before (cycle)
      this.in.fire(message);
    }

    const fromId = trail && trail[trail.length - 1];
    const nextTrail = (trail || []).concat(this.id);

    for (const [id, hub] of this.connections.entries()) {
      if (id === fromId) continue; // do not send back
      hub.propagate(message, nextTrail);
    }
  };

  connect(hub: EventHub<T>): EventHub<T> {
    if (hub !== this && !this.connections.has(hub.id)) {
      this.connections.set(hub.id, hub);
      hub.connect(this);
    }
    return hub;
  }
}
