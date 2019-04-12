export function isPromise<T>(p: unknown): p is Promise<T> {
  return p instanceof Promise;
}

export function isPromiseLike<T>(p: unknown): p is PromiseLike<T> {
  if (isPromise(p)) return true;
  // @ts-ignore
  const { then } = p || false;
  return then instanceof Function;
}
