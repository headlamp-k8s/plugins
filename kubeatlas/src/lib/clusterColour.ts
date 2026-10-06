/* ============================================================
 * clusterColour — deterministic hue per cluster ID.
 *
 * Shared by LeftClusterStrip (chip background) and the cytoscape
 * stylesheet (per-cluster node border), so the same prod cluster
 * paints the same hue in both places. Five-colour palette pulled
 * from the cartography theme's saturated accents; collisions on
 * federations larger than 5 clusters are acceptable for this
 * cosmetic mapping.
 * ============================================================ */
export const CLUSTER_CHIP_COLOURS = [
  '#2F5E8C',
  '#5C7F6B',
  '#B8893A',
  '#7E6BA8',
  '#9B5B4E',
] as const;

export function clusterColour(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  return CLUSTER_CHIP_COLOURS[Math.abs(h) % CLUSTER_CHIP_COLOURS.length];
}
