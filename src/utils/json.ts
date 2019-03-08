export type JsonPrimitive = null | string | number | boolean;

export type JsonEntry = JsonPrimitive | JsonArray | JsonMap;

type JsonEntries = JsonEntry[];

export interface JsonArray extends JsonEntries {}

export interface JsonMap {
  [key: string]: JsonEntry;
}

export type JsonData = JsonMap | JsonArray;
