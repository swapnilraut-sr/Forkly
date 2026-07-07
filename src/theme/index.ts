/**
 * Forkly design tokens.
 *
 * Small, flat theme object shared across screens/components so the demo stays
 * visually consistent without pulling in a UI library.
 */

export const colors = {
  primary: '#FF5A3C', // Forkly orange-red
  primaryDark: '#D8391F',
  accent: '#1FB6A6',
  background: '#FFF9F5',
  surface: '#FFFFFF',
  border: '#F0E4DC',
  text: '#241A16',
  textMuted: '#8A7A72',
  textInverse: '#FFFFFF',
  success: '#2E9E5B',
  danger: '#D8391F',
  overlay: 'rgba(0,0,0,0.04)',
  star: '#F5A623',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '800' as const, color: colors.text },
  heading: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  price: { fontSize: 16, fontWeight: '700' as const, color: colors.primary },
} as const;
