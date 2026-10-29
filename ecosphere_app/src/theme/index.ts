import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';
import { gradients } from './gradients';
import { animations } from './animations';
import { designTokens } from './tokens';

export const fonts = {
  heading: typography.headingFont,
  body: typography.bodyFont,
  bodyMedium: typography.bodyFont,
  headingFont: typography.headingFont,
  bodyFont: typography.bodyFont,
};

export const Theme = {
  colors,
  typography,
  fonts,
  spacing,
  radius,
  shadows,
  gradients,
  animations,
  tokens: designTokens,
};

export { designTokens };
export type ThemeType = typeof Theme;
export default Theme;
