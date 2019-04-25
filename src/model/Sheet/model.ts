import * as yup from 'yup';
import { generateId } from '../../utils/id';
import { Omit } from '../../utils/typescript';
import { RelationsOf, many } from '../base';

declare global {
  type PSheet = {
    '@type': 'PSheet';
    identifier: string;
    name: string;
    width: number;
    height: number;
    images: Record<string, string>; // keys start with $ and encode x,y,z, values are the sha hash
    $thumb: string;
    /**
     * CDN hash of source file
     */
    $source?: string;
  };
}

export const sheetRelations: RelationsOf<PSheet> = {
  images: many({}),
};

export const pSheetSchema = yup.object<PSheet>().shape({
  '@type': yup.string().oneOf(['PSheet']),
  identifier: yup.string().required(),
  name: yup.string().required(),
  width: yup
    .number()
    .integer()
    .positive()
    .required(),
  height: yup
    .number()
    .integer()
    .positive()
    .required(),
  images: yup.object().required(),
  $thumb: yup.string(),
  $source: yup.string(),
});

export const isPSheet = (v: unknown): v is PSheet =>
  pSheetSchema.isValidSync(v);

export const newSheet = (
  required: Omit<PSheet, '@type' | 'identifier' | 'images' | '$source'>
): PSheet => ({
  '@type': 'PSheet',
  identifier: generateId(),
  images: {},
  ...required,
});
