import { TopologyTheme } from '../hooks/useTopologyTheme';

/**
 * Helper function to convert hex color to rgba with opacity
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface SemanticColors {
  cluster: {
    border: string;
    bg: string;
    label: string;
  };
  nodePool: {
    border: string;
    bg: string;
    label: string;
  };
  controller: {
    border: string;
    bg: string;
    label: string;
  };
  broker: {
    border: string;
    bg: string;
    label: string;
  };
  zookeeper: {
    border: string;
    bg: string;
    label: string;
  };
  dual: {
    border: string;
    bg: string;
    label: string;
  };
}

/**
 * Generates semantic colors for Kafka topology components based on the current theme.
 * Uses theme-aware opacity and gradients for better visual hierarchy.
 *
 * @param theme - The topology theme from useTopologyTheme()
 * @returns Semantic colors object for different Kafka components
 */
export function getSemanticColors(theme: TopologyTheme): SemanticColors {
  const { colors, isDark } = theme;

  // Opacity values adjusted for theme
  // Light mode: very subtle opacity for clean, minimal look
  const bgOpacity = isDark ? 0.1 : 0.08;
  const gradientOpacity1 = isDark ? 0.25 : 0.12;
  const gradientOpacity2 = isDark ? 0.2 : 0.08;

  // Helper to darken color for label backgrounds in light mode
  const getLabelBackground = (baseColor: string): string => {
    if (isDark) {
      return baseColor;
    }
    // In light mode, use a lighter version
    return hexToRgba(baseColor, 0.1);
  };

  // Helper to get border color
  // Light mode: use light grey for subtle, consistent borders
  // Dark mode: use semantic color for better visibility
  const getBorderColor = (semanticColor: string): string => {
    return isDark ? semanticColor : colors.nodeBorder;
  };

  return {
    cluster: {
      border: getBorderColor(colors.nodePool), // Light grey in light mode, indigo in dark mode
      bg: hexToRgba(colors.nodePool, bgOpacity),
      label: getLabelBackground(colors.nodePool),
    },
    nodePool: {
      border: getBorderColor(colors.nodePool), // Light grey in light mode, purple in dark mode
      bg: hexToRgba(colors.nodePool, bgOpacity),
      label: getLabelBackground(colors.nodePool),
    },
    controller: {
      border: getBorderColor(colors.controller), // Light grey in light mode, green in dark mode
      bg: isDark
        ? `linear-gradient(135deg, rgba(52, 211, 153, ${gradientOpacity1}) 0%, rgba(16, 185, 129, ${gradientOpacity2}) 100%)`
        : `linear-gradient(135deg, rgba(5, 150, 105, ${gradientOpacity1}) 0%, rgba(4, 120, 87, ${gradientOpacity2}) 100%)`,
      label: getLabelBackground(colors.controller),
    },
    broker: {
      border: getBorderColor(colors.broker), // Light grey in light mode, blue in dark mode
      bg: isDark
        ? `linear-gradient(135deg, rgba(96, 165, 250, ${gradientOpacity1}) 0%, rgba(59, 130, 246, ${gradientOpacity2}) 100%)`
        : `linear-gradient(135deg, rgba(37, 99, 235, ${gradientOpacity1}) 0%, rgba(29, 78, 216, ${gradientOpacity2}) 100%)`,
      label: getLabelBackground(colors.broker),
    },
    zookeeper: {
      border: getBorderColor(colors.zookeeper), // Light grey in light mode, orange in dark mode
      bg: isDark
        ? `linear-gradient(135deg, rgba(251, 191, 36, ${gradientOpacity1}) 0%, rgba(245, 158, 11, ${gradientOpacity2}) 100%)`
        : `linear-gradient(135deg, rgba(217, 119, 6, ${gradientOpacity1}) 0%, rgba(180, 83, 9, ${gradientOpacity2}) 100%)`,
      label: getLabelBackground(colors.zookeeper),
    },
    dual: {
      border: getBorderColor(colors.dual), // Light grey in light mode, pink in dark mode
      bg: isDark
        ? `linear-gradient(135deg, rgba(244, 114, 182, ${gradientOpacity1}) 0%, rgba(236, 72, 153, ${gradientOpacity2}) 100%)`
        : `linear-gradient(135deg, rgba(219, 39, 119, ${gradientOpacity1}) 0%, rgba(190, 24, 93, ${gradientOpacity2}) 100%)`,
      label: getLabelBackground(colors.dual),
    },
  };
}
