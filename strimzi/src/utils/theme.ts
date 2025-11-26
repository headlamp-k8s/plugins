// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Angelo Cesaro

import { useEffect, useState } from 'react';

export interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  inputBg: string;
  inputBorder: string;
  overlay: string;
  chipBg?: string;
  chipText?: string;
}

/**
 * Custom hook to get theme-aware colors that automatically updates when system theme changes.
 * Supports both light and dark color schemes.
 *
 * @returns ThemeColors object with color values for current theme
 *
 * @example
 * ```tsx
 * const colors = useThemeColors();
 * <div style={{ backgroundColor: colors.background, color: colors.text }}>
 *   Content
 * </div>
 * ```
 */
export function useThemeColors(): ThemeColors {
  // Initialize with current theme
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    // Early return if matchMedia is not supported
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Handler for theme changes
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDark(e.matches);
    };

    // Set initial value
    handleChange(mediaQuery);

    // Listen for theme changes
    // Using both addEventListener and addListener for better browser compatibility
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup listener on unmount
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return {
    background: isDark ? '#1e1e1e' : '#ffffff',
    text: isDark ? '#e0e0e0' : '#000000',
    textSecondary: isDark ? '#b0b0b0' : '#666666',
    border: isDark ? '#404040' : '#ddd',
    inputBg: isDark ? '#2a2a2a' : '#ffffff',
    inputBorder: isDark ? '#505050' : '#ddd',
    overlay: 'rgba(0,0,0,0.5)',
    chipBg: isDark ? '#3a3a3a' : '#e3f2fd',
    chipText: isDark ? '#90caf9' : '#1976d2',
  };
}
