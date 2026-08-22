export interface TopologyLevel {
  name: string;
  nodeLabel: string;
}

/** Render a single level's display string. */
export function renderTopologyLevel(level?: TopologyLevel | null): string {
  if (!level || !level.name) {
    return '-';
  }
  const label = level.nodeLabel ? ` (${level.nodeLabel})` : '';
  return `${level.name}${label}`;
}

/** Render full topology levels hierarchy string. */
export function renderTopologyLevelsSummary(levels?: TopologyLevel[] | null): string {
  if (!levels || levels.length === 0) {
    return '-';
  }
  return levels.map(lvl => renderTopologyLevel(lvl)).join(' → ');
}

/** Render total count of defined topology levels. */
export function renderTopologyLevelsCount(levels?: TopologyLevel[] | null): number {
  return levels?.length ?? 0;
}

/** Extract list of level names. */
export function getTopologyLevelNames(levels?: TopologyLevel[] | null): string[] {
  if (!levels || levels.length === 0) {
    return [];
  }
  return levels.map(l => l.name).filter(Boolean);
}
