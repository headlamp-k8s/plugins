/**
 * Render a MultiKueueConfig's worker cluster names in spec order, which is the order the
 * Incremental dispatcher nominates them in, most preferred first.
 */
export function renderClusters(clusters?: string[]) {
  return clusters?.length ? clusters.join(', ') : '-';
}
