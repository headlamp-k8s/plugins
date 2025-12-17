// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Angelo Cesaro

import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';

/**
 * Typography configuration derived from MUI theme
 */
export interface TopologyTypography {
  fontFamily: string;
  fontSize: {
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  };
  fontWeight: {
    regular: number;
    medium: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: string;
}

/**
 * Color palette for topology elements
 */
export interface TopologyColors {
  // Canvas
  canvasBackground: string;
  gridColor: string;

  // Nodes
  nodeBackground: string;
  nodeBorder: string;
  nodeText: string;
  nodeTextSecondary: string;
  nodeHover: string;
  nodeSelected: string;
  nodeShadow: string;

  // Edges
  edgeStroke: string;
  edgeStrokeSelected: string;
  edgeLabelBg: string;
  edgeLabelText: string;

  // Semantic colors (Kafka-specific)
  broker: string;
  controller: string;
  zookeeper: string;
  nodePool: string;
  dual: string;

  // Status colors
  statusReady: string;
  statusNotReady: string;
  statusReadyBg: string;
  statusNotReadyBg: string;

  // UI elements
  controlsBg: string;
  controlsBorder: string;
  controlsText: string;
  controlsHover: string;
  overlay: string;
  highlight: string;
}

/**
 * Spacing values derived from MUI theme
 */
export interface TopologySpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

/**
 * Complete topology theme configuration
 */
export interface TopologyTheme {
  colors: TopologyColors;
  typography: TopologyTypography;
  spacing: TopologySpacing;
  isDark: boolean;
}

/**
 * Production-grade hook that provides comprehensive theme configuration
 * for XYFlow topology visualization.
 *
 * Features:
 * - Fully integrated with Headlamp's MUI theme
 * - Automatic updates on theme change (light/dark)
 * - Memoized for optimal performance
 * - Type-safe
 * - Extensible
 *
 * @returns Complete topology theme configuration
 *
 * @example
 * ```tsx
 * function KafkaTopology() {
 *   const theme = useTopologyTheme();
 *
 *   return (
 *     <div style={{ backgroundColor: theme.colors.canvasBackground }}>
 *       <span style={{
 *         fontFamily: theme.typography.fontFamily,
 *         fontSize: theme.typography.fontSize.medium
 *       }}>
 *         Topology
 *       </span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTopologyTheme(): TopologyTheme {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  return useMemo(() => {
    // Semantic colors with theme-aware brightness
    const semanticColors = {
      broker: isDark ? '#60a5fa' : '#2563eb',
      controller: isDark ? '#34d399' : '#059669',
      zookeeper: isDark ? '#fbbf24' : '#d97706',
      nodePool: isDark ? '#a78bfa' : '#7c3aed',
      dual: isDark ? '#f472b6' : '#db2777',
    };

    const colors: TopologyColors = {
      // Canvas - white for light mode, dark for dark mode
      canvasBackground: isDark ? '#1a1a1a' : '#ffffff',
      // Grid dots - visible in both modes
      gridColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(80, 80, 80, 0.55)',

      // Nodes - using MUI palette
      nodeBackground: muiTheme.palette.background.paper,
      // Light mode: use visible light grey border
      // Dark mode: use theme divider
      nodeBorder: isDark ? muiTheme.palette.divider : '#d1d5db',
      // Light mode: dark grey text for better contrast and readability
      // Dark mode: use theme default
      nodeText: isDark ? muiTheme.palette.text.primary : '#374151',
      nodeTextSecondary: isDark ? muiTheme.palette.text.secondary : '#6b7280',
      nodeHover: isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)',
      nodeSelected: muiTheme.palette.primary.main,
      nodeShadow: isDark
        ? '0 4px 6px rgba(0, 0, 0, 0.4)'
        : '0 4px 6px rgba(0, 0, 0, 0.1)',

      // Edges
      edgeStroke: muiTheme.palette.divider,
      edgeStrokeSelected: muiTheme.palette.primary.main,
      edgeLabelBg: muiTheme.palette.background.paper,
      // Light mode: dark grey text for better readability
      edgeLabelText: isDark ? muiTheme.palette.text.primary : '#374151',

      // Semantic colors
      broker: semanticColors.broker,
      controller: semanticColors.controller,
      zookeeper: semanticColors.zookeeper,
      nodePool: semanticColors.nodePool,
      dual: semanticColors.dual,

      // Status colors
      statusReady: isDark ? '#34d399' : '#059669',
      statusNotReady: isDark ? '#f87171' : '#dc2626',
      statusReadyBg: isDark
        ? 'rgba(16, 185, 129, 0.25)'
        : 'rgba(16, 185, 129, 0.15)',
      statusNotReadyBg: isDark
        ? 'rgba(239, 68, 68, 0.25)'
        : 'rgba(239, 68, 68, 0.15)',

      // UI elements
      controlsBg: isDark ? '#334155' : '#f1f5f9',
      controlsBorder: isDark ? '#475569' : '#cbd5e1',
      // Light mode: dark grey text for better readability
      controlsText: isDark ? muiTheme.palette.text.primary : '#374151',
      controlsHover: isDark ? '#475569' : '#e2e8f0',
      overlay: isDark
        ? 'rgba(0, 0, 0, 0.6)'
        : 'rgba(255, 255, 255, 0.6)',
      highlight: muiTheme.palette.primary.light,
    };

    const typography: TopologyTypography = {
      fontFamily: muiTheme.typography.fontFamily,
      fontSize: {
        small: muiTheme.typography.caption.fontSize || '12px',
        medium: muiTheme.typography.body2.fontSize || '14px',
        large: muiTheme.typography.body1.fontSize || '18px',
        xlarge: muiTheme.typography.h6.fontSize || '20px',
      },
      fontWeight: {
        regular: muiTheme.typography.fontWeightRegular,
        medium: muiTheme.typography.fontWeightMedium,
        bold: muiTheme.typography.fontWeightBold,
      },
      lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.8,
      },
      letterSpacing: '0.01em',
    };

    const spacing: TopologySpacing = {
      xs: muiTheme.spacing(0.5),
      sm: muiTheme.spacing(1),
      md: muiTheme.spacing(2),
      lg: muiTheme.spacing(3),
      xl: muiTheme.spacing(4),
    };

    return {
      colors,
      typography,
      spacing,
      isDark,
    };
  }, [muiTheme, isDark]);
}
