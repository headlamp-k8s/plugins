import { useTheme } from '@mui/material/styles';

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
 * Custom hook to get theme-aware colors that automatically updates when Headlamp theme changes.
 * Supports both light and dark color schemes from Material-UI theme.
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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return {
    background: theme.palette.background.default,
    text: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
    border: theme.palette.divider,
    inputBg: theme.palette.background.paper,
    inputBorder: theme.palette.divider,
    overlay: 'rgba(0,0,0,0.5)',
    chipBg: isDark ? '#3a3a3a' : '#e3f2fd',
    chipText: isDark ? '#90caf9' : '#1976d2',
  };
}
