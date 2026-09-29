/** Render a MultiKueueConfig's ordered list of worker cluster names. */
export function renderClusters(clusters?: string[]) {
  if (!clusters || clusters.length === 0) {
    return '-';
  }

  return clusters.join(', ');
}

/** Render the number of worker clusters configured, preserving explicit zero. */
export function renderClusterCount(clusters?: string[]) {
  return clusters?.length ?? 0;
}