/*
 * Copyright 2026 The KubeAtlas Authors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Slim port of the kubeatlas cartography palette bridge. The main
 * kubeatlas web UI carries five themes (Parchment / Survey / Terrain
 * / Ink / Slate); the Headlamp plugin only needs one light + one dark
 * because Headlamp's MUI theme drives a binary light / dark mode.
 *
 * Cytoscape can't read CSS variables, so this typed bridge is what
 * buildAtlasStylesheet (lib/cytoscape.ts) consumes to paint the
 * graph. To pick up palette changes from the design tree, re-derive
 * from lithastra/kubeatlas-design/themes.tokens.json.
 */

export type AtlasScheme = 'light' | 'dark';

export interface AtlasEdgePalette {
  structural: string;
  config: string;
  secret: string;
  identity: string;
  traffic: string;
  policy: string;
  storage: string;
  federation: string;
}

export interface AtlasPalette {
  label: string;
  scheme: AtlasScheme;
  bg: string;
  surface: string;
  border: string;
  text1: string;
  text2: string;
  text3: string;
  nodeFill: string;
  healthy: string;
  warning: string;
  error: string;
  orphan: string;
  select: string;
  edges: AtlasEdgePalette;
}

export const themePalettes = {
  parchment: {
    label: 'Parchment',
    scheme: 'light',
    bg: '#F4EFE6',
    surface: '#ECE3D3',
    border: '#DDD0BB',
    text3: '#B5A48A',
    text2: '#6B5A45',
    text1: '#2B2418',
    nodeFill: '#F4EFE6',
    healthy: '#5C7F6B',
    warning: '#B8893A',
    error: '#A14638',
    orphan: '#7E6BA8',
    select: '#2F5E8C',
    edges: {
      structural: '#5C5142',
      config: '#6B8C76',
      secret: '#9B5B4E',
      identity: '#8A78B3',
      traffic: '#C49441',
      policy: '#4B6E94',
      storage: '#7A6B5A',
      federation: '#A14638',
    },
  },
  slate: {
    label: 'Slate',
    scheme: 'dark',
    bg: '#1B1D22',
    surface: '#24272E',
    border: '#353941',
    // text3 = #888E98 to clear WCAG AA contrast against bg / surface.
    text3: '#888E98',
    text2: '#A0A6B0',
    text1: '#E8E6DF',
    nodeFill: '#24272E',
    healthy: '#6FA88A',
    warning: '#D3A55C',
    error: '#C46857',
    orphan: '#9A87C6',
    select: '#5B92C9',
    edges: {
      structural: '#9A8E78',
      config: '#7FAE8C',
      secret: '#C4796B',
      identity: '#A593CE',
      traffic: '#D3A55C',
      policy: '#6699C9',
      storage: '#9A8B78',
      federation: '#C46857',
    },
  },
} satisfies Record<string, AtlasPalette>;

export type AtlasThemeName = keyof typeof themePalettes;

export const DEFAULT_THEME: AtlasThemeName = 'parchment';
export const DARK_THEME: AtlasThemeName = 'slate';

// paletteForScheme returns Parchment for light Headlamp mode and
// Slate for dark Headlamp mode — keeps the plugin's graph readable
// against whatever surface Headlamp paints around it.
export function paletteForScheme(scheme: AtlasScheme): AtlasPalette {
  return scheme === 'dark' ? themePalettes.slate : themePalettes.parchment;
}
