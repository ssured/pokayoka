import { UndefinedOrPartialSPO } from '../../utils/spo-observable';
import * as yup from 'yup';
import { generateId } from '../../utils/id';
import { Omit } from '../../utils/typescript';

declare global {
  type Sheet = {
    '@type': 'Sheet';
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

export type PartialSheet = UndefinedOrPartialSPO<Sheet>;

export const sheetSchema = yup.object<Sheet>().shape({
  // '@type': yup.string().oneOf(['Sheet']) as yup.Schema<'Sheet'>,
  // identifier: yup.string().required(),
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
  images: yup.object(),
  $thumb: yup.string(),
  $source: yup.string(),
});

export const isSheet = (v: unknown): v is Sheet => sheetSchema.isValidSync(v);

export const newSheet = (
  required: Omit<Sheet, '@type' | 'identifier' | 'images' | '$source'>
): Sheet => ({
  '@type': 'Sheet',
  identifier: generateId(),
  images: {},
  ...required,
});
