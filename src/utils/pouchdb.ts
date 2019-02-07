export const winningRev = (rev1: string, rev2: string) =>
  parseInt(rev1, 10) > parseInt(rev2, 10) ? rev1 : rev2;
