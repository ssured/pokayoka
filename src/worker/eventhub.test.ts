import { EventHub } from './eventhub';

describe('Hubs transfer messages', () => {
  it('works as a duo', () => {
    const a = new EventHub<string>();
    const b = new EventHub<string>();

    a.connect(b);

    let aValue: string;
    a.subscribe(message => (aValue = message));

    let bValue: string;
    b.subscribe(message => (bValue = message));

    a.fire('testa');

    expect(aValue!).toBeUndefined();
    expect(bValue!).toBe('testa');

    b.fire('testb');
    expect(aValue!).toBe('testb');
    expect(bValue!).toBe('testa');
  });

  it('works as a line', () => {
    const a = new EventHub<string>();
    const mid = new EventHub<string>();
    const b = new EventHub<string>();

    a.connect(mid).connect(b);

    let aValue: string;
    a.subscribe(message => (aValue = message));

    let bValue: string;
    b.subscribe(message => (bValue = message));

    a.fire('testa');

    expect(aValue!).toBeUndefined();
    expect(bValue!).toBe('testa');

    b.fire('testb');
    expect(aValue!).toBe('testb');
    expect(bValue!).toBe('testa');
  });

  it('works as a star', () => {
    const a = new EventHub<string>();
    const mid = new EventHub<string>();
    const b = new EventHub<string>();
    const c = new EventHub<string>();

    mid.connect(a);
    mid.connect(b);
    mid.connect(c);

    let aValue: string;
    a.subscribe(message => (aValue = message));

    let bValue: string;
    b.subscribe(message => (bValue = message));

    let cValue: string;
    c.subscribe(message => (cValue = message));

    a.fire('testa');
    expect(aValue!).toBeUndefined();
    expect(bValue!).toBe('testa');
    expect(cValue!).toBe('testa');

    b.fire('testb');
    expect(aValue!).toBe('testb');
    expect(bValue!).toBe('testa');
    expect(cValue!).toBe('testb');

    c.fire('testc');
    expect(aValue!).toBe('testc');
    expect(bValue!).toBe('testc');
    expect(cValue!).toBe('testb');
  });
});
