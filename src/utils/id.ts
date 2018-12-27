const ID_TIME_START = parseInt('d00000', 36);
const DEVICE_ID_KEY = 'PY_deviceId';
const SESSION_ID_KEY = 'PY_sessionId';

export function generateId() {
  const timestamp = Math.floor(new Date().valueOf() / 1000);
  return (
    (timestamp - ID_TIME_START).toString(36) +
    Math.random()
      .toString(36)
      .substr(2, 6)
  );
}

export function getDateFromId(id: string) {
  return new Date((parseInt(id.substr(0, 6), 36) + ID_TIME_START) * 1000);
}

export function getDeviceId() {
  const id = self.localStorage.getItem(DEVICE_ID_KEY);
  if (id != null) return id;

  const newId = generateId();
  self.localStorage.setItem(DEVICE_ID_KEY, newId);
  return newId;
}

export function getSessionId() {
  const id = self.sessionStorage.getItem(SESSION_ID_KEY);
  if (id != null) return id;

  const newId = generateId();
  self.sessionStorage.setItem(SESSION_ID_KEY, newId);
  return newId;
}

export const instanceId = generateId();
