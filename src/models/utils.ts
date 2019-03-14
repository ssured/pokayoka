// helper which always returns the same object from the provided thunk
// used to manage circular dependencies in the object model
export const singleton = <T>(thunk: () => T) => {
  let value: T;
  return () => value || (value = thunk());
};
