import { UndefinedOrPartialSPO } from '../../utils/spo-observable';

declare global {
  type Sheet = Partial<{
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
    $source: string;
  }>;
}

export type PartialSheet = UndefinedOrPartialSPO<Sheet>;
