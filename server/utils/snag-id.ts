// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript#2117523
export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const hasAncestor = (id: string, ancestorId: string) =>
  id.indexOf(`${ancestorId}_`) === 0;

export const addAncestorIds = (ids: string[], rootId: string | null = null) =>
  ids
    .reduce(
      (ids, id) =>
        getAncestorIds(id)
          .concat(id)
          .reduce(
            (ids, id) => (ids.indexOf(id) === -1 ? ids.concat(id) : ids),
            ids
          ),
      [] as string[]
    )
    .sort()
    .filter(id => rootId == null || hasAncestor(id, rootId));

export const removeAncestorIds = (ids: string[]) =>
  ids.filter(id => ids.find(otherId => hasAncestor(otherId, id)) == null);

export const getParentId = (id: string) => {
  const parts = id.split('_');
  return parts.length > 1 ? parts.slice(0, -1).join('_') : null;
};

export const getDepth = (id: string) => id.split('_').length - 1;

export const getAncestorIds = (id: string) => {
  const ids = [];
  let current: string | null = id;
  while ((current = getParentId(current))) {
    ids.push(current);
  }
  return ids.reverse();
};

export const leafId = (id: string) => id.split('_').pop()!;
export const rootId = (id: string) => id.split('_').shift()!;
export const isRoot = (id: string) => id === rootId(id);

export const getType = (id: string) => {
  if (getParentId(id) == null) {
    return 'project';
  }
  const parts = leafId(id).split('$');
  return parts.length === 2 ? parts[0] : null;
};

export const getRandomPart = (id: string) => id.split('$').pop()!;

// guard for making 2 docs on the same time. This will add one second between bulk requests
let lastTimestamp = -Infinity;
export function generateId(
  Type: { name: string } | null = null,
  parent: { _id: string } | null = null
) {
  let timestamp = Math.floor(new Date().valueOf() / 1000);
  if (timestamp <= lastTimestamp) {
    timestamp = lastTimestamp + 1;
  }
  lastTimestamp = timestamp;
  return (
    (parent ? `${parent._id}_` : '') +
    (Type ? `${Type.name.toLowerCase()}$` : '') +
    (timestamp - parseInt('d00000', 36)).toString(36) +
    Math.random()
      .toString(36)
      .substr(2, 4)
  );
}

export function getDateFromId(id: string) {
  return new Date(
    (parseInt(getRandomPart(id).substr(0, 6), 36) + parseInt('d00000', 36)) *
      1000
  );
}
