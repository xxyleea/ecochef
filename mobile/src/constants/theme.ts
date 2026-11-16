import '@/global.css';

import { Platform } from 'react-native';

/** EcoChef palette — carried over from the 2024 Figma: leaf green brand + pastel feature cards. */
export const C = {
  brand: '#2F6B3F',
  brandSoft: '#E5F0E3',
  olive: '#8A9A3B',
  text: '#16201A',
  textMuted: '#5E6B62',
  bg: '#F7F8F4',
  surface: '#FFFFFF',
  border: '#E3E7DF',
  danger: '#C2410C',
  dangerSoft: '#FDE7DC',
  warn: '#B45309',
  warnSoft: '#FDF1D6',
  ok: '#2F6B3F',
  okSoft: '#E5F0E3',
  // feature card pastels (from the Figma home screen)
  pink: '#FFE4E6',
  pinkInk: '#E8562F',
  sky: '#D9F5FB',
  skyInk: '#1F8AA0',
  butter: '#FDF3D6',
  butterInk: '#B08A12',
  mint: '#D3F8EC',
  mintInk: '#137257',
} as const;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

export const Fonts = Platform.select({
  web: { sans: 'var(--font-display)', mono: 'var(--font-mono)' },
  default: { sans: undefined, mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});

export const MaxContentWidth = 640;
