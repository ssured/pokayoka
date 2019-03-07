export type Primitive = null | string | number | boolean;

export type JsonEntry = Primitive | JsonArray | JsonMap;

interface IMap<TValue> {
  [key: string]: TValue;
}

export interface JsonArray extends ArrayLike<JsonEntry> {}

export interface JsonMap extends IMap<JsonEntry> {}

export type JsonData = JsonMap | JsonArray;
