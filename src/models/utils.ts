export const singleton = <T>(create: () => T) => {
  let value: T;
  return () => value || (value = create());
};
