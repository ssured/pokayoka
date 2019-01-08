// https://github.com/jgthms/bulma/blob/67d2ef779b8058df15a92459401c0848b8883e44/sass/utilities/initial-variables.sass
import { hsl } from 'polished';
import { findColorInvert } from './functions';

// Colors

export const black = hsl(0, 0.0, 0.04);
export const blackBis = hsl(0, 0.0, 0.07);
export const blackTer = hsl(0, 0.0, 0.14);

export const greyDarker = hsl(0, 0.0, 0.21);
export const greyDark = hsl(0, 0.0, 0.29);
export const grey = hsl(0, 0.0, 0.48);
export const greyLight = hsl(0, 0.0, 0.71);
export const greyLighter = hsl(0, 0.0, 0.86);

export const whiteTer = hsl(0, 0.0, 0.96);
export const whiteBis = hsl(0, 0.0, 0.98);
export const white = hsl(0, 0.0, 1);

export const orange = hsl(14, 1, 0.53);
export const yellow = hsl(48, 1, 0.67);
export const green = hsl(141, 0.71, 0.48);
export const turquoise = hsl(171, 1, 0.41);
export const cyan = hsl(204, 0.86, 0.53);
export const blue = hsl(217, 0.71, 0.53);
export const purple = hsl(271, 1, 0.71);
export const red = hsl(348, 1, 0.61);

// Typography

export const familySansSerif =
  'BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif';
export const familyMonospace = 'monospace';
export const renderMode = 'optimizeLegibility';

export const size1 = '3rem';
export const size2 = '2.5rem';
export const size3 = '2rem';
export const size4 = '1.5rem';
export const size5 = '1.25rem';
export const size6 = '1rem';
export const size7 = '0.75rem';

export const weightLight = 300;
export const weightNormal = 400;
export const weightMedium = 500;
export const weightSemibold = 600;
export const weightBold = 700;

// Responsiveness

// The container horizontal gap, which acts as the offset for breakpoints
export const gap = 64; // px
// 960, 1152, and 1344 have been chosen because they are divisible by both 12 and 16
export const tablet = 769; // px'
// 960px container + 4rem
export const desktop = 960 + 2 * gap; // px + (2 * $gap)
// 1152px container + 4rem
export const widescreen = 1152 + 2 * gap; // px + (2 * $gap)
export const widescreenEnabled = true;
// 1344px container + 4rem
export const fullhd = 1344 + 2 * gap; // px + (2 * $gap)
export const fullhdEnabled = true;

// Miscellaneous

export const easing = 'ease-out';
export const radiusSmall = 2; // px
export const radius = 4; // px
export const radiusLarge = 6; // px
export const radiusRounded = 290486; // px
export const speed = 86; // ms

// Flags

export const variableColumns = true;

// https://github.com/jgthms/bulma/blob/67d2ef779b8058df15a92459401c0848b8883e44/sass/utilities/derived-variables.sass
export const primary = turquoise;

export const info = cyan;
export const success = green;
export const warning = yellow;
export const danger = red;

export const light = whiteTer;
export const dark = greyDarker;

// Invert colors

export const orangeInvert = findColorInvert(orange);
export const yellowInvert = findColorInvert(yellow);
export const greenInvert = findColorInvert(green);
export const turquoiseInvert = findColorInvert(turquoise);
export const cyanInvert = findColorInvert(cyan);
export const blueInvert = findColorInvert(blue);
export const purpleInvert = findColorInvert(purple);
export const redInvert = findColorInvert(red);

export const primaryInvert = turquoiseInvert;
export const infoInvert = cyanInvert;
export const successInvert = greenInvert;
export const warningInvert = yellowInvert;
export const dangerInvert = redInvert;
export const lightInvert = dark;
export const darkInvert = light;

// General colors

export const background = whiteTer;

export const border = greyLighter;
export const borderHover = greyLight;

// Text colors

export const text = greyDark;
export const textInvert = findColorInvert(text);
export const textLight = grey;
export const textStrong = greyDarker;

// Code colors

export const code = red;
export const codeBackground = background;

export const pre = text;
export const preBackground = background;

// Link colors

export const link = blue;
export const linkInvert = blueInvert;
export const linkVisited = purple;

export const linkHover = greyDarker;
export const linkHoverBorder = greyLight;

export const linkFocus = greyDarker;
export const linkFocusBorder = blue;

export const linkActive = greyDarker;
export const linkActiveBorder = greyDark;

// Typography

export const familyPrimary = familySansSerif;
export const familySecondary = familySansSerif;
export const familyCode = familyMonospace;

export const sizeSmall = size7;
export const sizeNormal = size6;
export const sizeMedium = size5;
export const sizeLarge = size4;

// Lists and maps
export const customColors: { [key: string]: [string, string] } = {};
export const customShades: { [key: string]: string } = {};

export const colors = {
  white: [white, black],
  black: [black, white],
  light: [light, lightInvert],
  dark: [dark, darkInvert],
  primary: [primary, primaryInvert],
  link: [link, linkInvert],
  info: [info, infoInvert],
  success: [success, successInvert],
  warning: [warning, warningInvert],
  danger: [danger, dangerInvert],
  ...customColors,
};

export const shades = {
  blackBis,
  blackTer,
  greyDarker,
  greyDark,
  grey,
  greyLight,
  greyLighter,
  whiteTer,
  whiteBis,
  ...customShades,
};

export const sizes = [size1, size2, size3, size4, size5, size6, size7];
