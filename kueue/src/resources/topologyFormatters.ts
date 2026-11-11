export interface TopologyLevel {
  nodeLabel: string;
}

/** Render a single level's display string from its nodeLabel. */
export function renderTopologyLevel(level?: TopologyLevel | null): string {
  if (!level || !level.nodeLabel) {
    return '-';
  }
  return level.nodeLabel;
}

/** Render full topology levels hierarchy string. */
export function renderTopologyLevelsSummary(levels?: TopologyLevel[] | null): string {
  if (!levels || levels.length === 0) {
    return '-';
  }
  const rendered = levels.map(lvl => renderTopologyLevel(lvl)).filter(s => s !== '-');
  if (rendered.length === 0) {
    return '-';
  }
  return rendered.join(' → ');
}

/** Render total count of defined topology levels. */
export function renderTopologyLevelsCount(levels?: TopologyLevel[] | null): number {
  return levels?.length ?? 0;
}

/** Extract list of node labels. */
export function getTopologyNodeLabels(levels?: TopologyLevel[] | null): string[] {
  if (!levels || levels.length === 0) {
    return [];
  }
  return levels.map(l => l.nodeLabel || '').filter(Boolean);
}
