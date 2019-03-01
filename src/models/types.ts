import { types } from 'mobx-state-tree';
import { type } from 'os';

// use this
export const mustBeOverwritten = types.custom<unknown, undefined>({
  name: 'mustBeOverwritten',
  fromSnapshot() {
    return undefined;
  },
  toSnapshot() {
    return undefined;
  },
  isTargetType() {
    return false;
  },
  getValidationMessage() {
    return 'mustBeOverwritten';
  },
});

function isString(s: string) {
  return typeof s === 'string';
}

export const isText = isString;
export const text = types.refinement('text', types.string, isText);

export const isLabel = (s: string) => isString(s) && !s.match(/\n/);
export const label = types.refinement(
  'label',
  types.string,
  isLabel,
  'label cannot contain newline'
);

export const isGloballyUniqueId = (s: string) => isString(s) && s.length === 22;
export const globallyUniqueId = types.refinement(
  'globallyUniqueId',
  types.string,
  isGloballyUniqueId
);

export const elementCompositionEnum = types.optional(
  types.enumeration('IfcElementCompositionEnum', [
    '.COMPLEX.',
    '.ELEMENT.',
    '.PARTIAL.',
  ]),
  '.ELEMENT.'
);

export const internalOrExternalEnum = types.optional(
  types.enumeration('IfcInternalOrExternalEnum', [
    '.INTERNAL.',
    '.EXTERNAL.',
    '.NOTDEFINED.',
  ]),
  '.NOTDEFINED.'
);

// http://www.buildingsmart-tech.org/ifc/IFC4/final/html/schema/ifcmeasureresource/lexical/ifccompoundplaneanglemeasure.htm
// IfcCompoundPlaneAngleMeasure is a compound measure of plane angle in degrees, minutes, seconds, and optionally millionth-seconds of arc.
type CompoundPlaneAngleMeasure =
  | [number, number, number]
  | [number, number, number, number];

type Sign = -1 | 0 | 1;
function sign(value: number): Sign {
  return value === 0 ? 0 : value > 1 ? 1 : -1;
}
function sameSign(a: number, b: number): boolean {
  const signA = sign(a);
  const signB = sign(b);
  return signA === 0 || signB === 0 || signA === signB;
}

const isCompoundPlaneAngleMeasure = (
  array: number[] | undefined
): array is CompoundPlaneAngleMeasure =>
  array != null &&
  (array.length === 3 || array.length === 4) &&
  array.reduce(
    (allOk, value) => allOk && isFinite(value) && sameSign(array[0], value),
    true
  ) &&
  array[1] >= -60 &&
  array[1] <= 60 &&
  array[2] >= -60 &&
  array[2] <= 60 &&
  (array.length === 3 || (array[3] >= -1000000 && array[3] <= 1000000));

export const compoundPlaneAngleMeasure = types.refinement(
  types.array(types.number),
  isCompoundPlaneAngleMeasure
);

export const postalAddress = types.model('postalAddress', {
  internalLocation: types.maybe(label),
  addressLines: types.maybe(types.array(label)),
  postalBox: types.maybe(label),
  town: types.maybe(label),
  region: types.maybe(label),
  postalCode: types.maybe(label),
  country: types.maybe(label),
});
