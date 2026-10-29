import { Platform } from 'react-native';

/**
 * ECOSPHERE Centralized Design System Tokens
 * Premium Light-Mode Visual Architecture
 */

export const colors = {
  // Brand Core
  forestGreen: '#146B3A',
  emerald: '#16A34A',
  deepGreen: '#064E3B',
  freshLime: '#C7F36B',
  warmYellow: '#FFD166',
  softGreen: '#EAF7EE',
  softGreenSubtle: '#F1F9F2',

  // Surfaces & Backgrounds
  mainBackground: '#F8FAF7',
  surfaceCard: '#FFFFFF',
  surfaceSubtle: '#F1F5F0',
  surfaceElevated: '#FFFFFF',

  // Typography
  primaryText: '#17231B',
  secondaryText: '#68756B',
  tertiaryText: '#8E9C91',
  inverseText: '#FFFFFF',

  // Borders & Dividers
  border: '#E4EBE3',
  borderLight: '#EDF2EC',
  borderStrong: '#CDD7CC',

  // AI & Special Accents
  aiAccent: '#EEE8FF',
  aiSurface: '#F7F4FF',
  aiBorder: '#DDD3FA',
  aiText: '#5925DC',

  // Semantic States
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // Backwards compatibility aliases
  background: '#F8FAF7',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardBackground: '#FFFFFF',
  primary: '#16A34A',
  primaryDark: '#146B3A',
  primaryLight: '#22C55E',
  brandGreen: '#16A34A',
  primaryGreen: '#16A34A',
  accentGreen: '#146B3A',
  text: '#17231B',
  textSecondary: '#68756B',
  subtext: '#68756B',
  textMuted: '#8E9C91',
  cardBorder: '#E4EBE3',
  glassBackground: '#FFFFFF',
  glassBorder: '#E4EBE3',
  darkVoid: '#17231B',
  splashBackground: '#F8FAF7',
  secondaryBackground: '#F1F5F0',
  blue: '#2563EB',
  brandBlue: '#2563EB',
  primaryBlue: '#2563EB',
  teal: '#0D9488',
  brandTeal: '#0D9488',
  purple: '#7C3AED',
  brandPurple: '#7C3AED',
  accent: '#16A34A',
  accentPurple: '#7C3AED',
  orange: '#EA580C',
  error: '#DC2626',
  borderPrimary: 'rgba(22, 163, 74, 0.25)',
  borderLightAlt: '#EDF2EC',
  glassBorderHighlight: '#CDD7CC',
  glowGreen: 'rgba(22, 163, 74, 0.12)',
  glowBlue: 'rgba(37, 99, 235, 0.12)',
  glowPurple: 'rgba(124, 58, 237, 0.12)',
  glowPrimary: 'rgba(22, 163, 74, 0.18)',
  glowSuccess: 'rgba(22, 163, 74, 0.18)',
};

export const typography = {
  // Headings: Plus Jakarta Sans with crisp system fallbacks
  headingFont: Platform.select({
    ios: 'Plus Jakarta Sans',
    android: 'PlusJakartaSans',
    default: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }),

  // Body & UI: Inter with crisp system fallbacks
  bodyFont: Platform.select({
    ios: 'Inter',
    android: 'Inter',
    default: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }),

  // Font family default for legacy usage
  fontFamily: Platform.select({
    ios: 'Inter',
    android: 'Inter',
    default: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }),

  sizes: {
    hero: 32,
    heading: 24,
    title: 19,
    subtitle: 16,
    body: 14,
    caption: 12,
    tiny: 11,
  },

  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  lineHeights: {
    hero: 40,
    heading: 32,
    title: 26,
    subtitle: 22,
    body: 20,
    caption: 16,
    tiny: 14,
  },
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  cards: 20, // 18-22px
  card: 20,
  cardSmall: 18,
  cardLarge: 22,
  inputs: 14,
  buttons: 14,
  bottomNavigation: 24,
  round: 9999,
  pill: 9999,
  xl: 22,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const shadows = {
  // Minimal soft shadow for cards (clean, modern light-mode feel)
  minimalSoft: Platform.select({
    ios: {
      shadowColor: '#17231B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#17231B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
  }),

  // Moderate soft shadow for elevated interactive cards & dialogs
  elevatedSoft: Platform.select({
    ios: {
      shadowColor: '#17231B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
    android: {
      elevation: 4,
    },
    default: {
      shadowColor: '#17231B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
  }),

  // Floating bar shadow (e.g. bottom navigation dock)
  floatingDock: Platform.select({
    ios: {
      shadowColor: '#17231B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.09,
      shadowRadius: 16,
    },
    android: {
      elevation: 6,
    },
    default: {
      shadowColor: '#17231B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.09,
      shadowRadius: 16,
    },
  }),

  // Legacy mappings for backwards compatibility
  soft: Platform.select({
    ios: {
      shadowColor: '#17231B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  primaryGlow: Platform.select({
    ios: {
      shadowColor: '#16A34A',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  successGlow: Platform.select({
    ios: {
      shadowColor: '#16A34A',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  purpleGlow: Platform.select({
    ios: {
      shadowColor: '#EEE8FF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }),
};

export const gradients = {
  emeraldToForest: ['#16A34A', '#146B3A'] as const,
  primary: ['#16A34A', '#146B3A'] as const,
  primaryAccent: ['#16A34A', '#C7F36B'] as const,
  lightSurface: ['#FFFFFF', '#F8FAF7'] as const,
  aiTint: ['#F7F4FF', '#EEE8FF'] as const,
  cardSubtle: ['#FFFFFF', '#F9FAF8'] as const,
  purple: ['#8B5CF6', '#38BDF8'] as const,
  tealBlue: ['#14B8A6', '#38BDF8'] as const,
  darkCard: ['#FFFFFF', '#FFFFFF'] as const,
  darkAtmosphere: ['#F8FAF7', '#F8FAF7'] as const,
  glass: ['#FFFFFF', '#FFFFFF'] as const,
  glassHighlight: ['#FFFFFF', '#FFFFFF'] as const,
  greenGlow: ['rgba(22, 163, 74, 0.08)', 'rgba(22, 163, 74, 0.0)'] as const,
};

export const designTokens = {
  colors,
  typography,
  radius,
  spacing,
  shadows,
  gradients,
};

export default designTokens;

