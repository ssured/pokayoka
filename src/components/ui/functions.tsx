import { getLuminance, rgba } from 'polished';

// https://github.com/jgthms/bulma/blob/1083f017a06b44d6f1e315de2b384798e69aeb35/sass/utilities/functions.sass#L58
export const findColorInvert = (color: string) =>
  getLuminance(color) > 0.55 ? rgba('#000', 0.7) : '#fff';
