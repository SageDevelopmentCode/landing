/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 90, android: 86 }) ?? 0;

export const floatingTabBarStyle = {
  position: 'absolute' as const,
  bottom: Platform.select({ ios: 24, android: 20 }) ?? 20,
  marginHorizontal: 24,
  paddingHorizontal: 16,
  height: 64,
  borderRadius: 32,
  backgroundColor: '#ffffff',
  borderTopWidth: 0,
  borderTopColor: 'transparent',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 12,
};
export const MaxContentWidth = 800;

export const Brand = {
  coral: '#f29a8f',
  coralHover: '#e88d82',
  coralActive: '#d47f75',
  sage700: '#5E7C68',
  sage800: '#4A6354',
  welcomeBg: '#FFF9F5',
} as const;

export const FontFamilies = {
  heading: 'Merriweather_700Bold',
  headingRegular: 'Merriweather_400Regular',
  body: 'Poppins_400Regular',
  bodySemiBold: 'Poppins_600SemiBold',
  signature: 'DancingScript_700Bold',
} as const;
