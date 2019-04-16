import { grommet } from 'grommet/themes';
import { deepMerge } from 'grommet/utils';

export const theme = deepMerge(grommet, {
  global: {
    colors: {
      active: 'dark-6',
    },
    elevation: {
      light: {
        small: '0 0 1px 0 rgba(0, 0, 0, 0.40), 0 1px 2px 0 rgba(0,0,0,0.40)',
        medium: '0 0 2px 0 rgba(0,0,0,0.40), 0 2px 4px 0 rgba(0,0,0,0.40)',
        large: '0 0 1px 0 rgba(0,0,0,0.40), 0 4px 8px 0 rgba(0,0,0,0.40)',
        xlarge: '0 0 1px 0 rgba(0,0,0,0.40), 0 8px 16px 0 rgba(0,0,0,0.40)',
      },
    },
    size: {
      avatar: '36px',
      sidebar: '60px',
    },
  },
});

export const colorsLightToDark = [
  'white',
  'light-1',
  'light-2',
  'light-3',
  'light-4',
  'dark-4',
  'dark-3',
  'dark-2',
  'dark-1',
  'black',
];

export const sizesSmallToBig = [
  'none',
  'xsmall',
  'small',
  'medium',
  'large',
  'xlarge',
];
