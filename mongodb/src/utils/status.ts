/**
 * Map MongoDBCommunity phase string to Headlamp StatusLabel status type.
 *
 * @param phase - The status phase reported by MongoDBCommunity operator
 * @returns StatusLabel status string ('success' | 'warning' | 'error' | '')
 */
export function getMongoPhaseStatus(phase?: string): '' | 'success' | 'warning' | 'error' {
  if (!phase) {
    return 'warning';
  }

  const normalized = phase.toLowerCase();
  switch (normalized) {
    case 'running':
      return 'success';
    case 'pending':
    case 'creating':
    case 'updating':
      return 'warning';
    case 'failed':
    case 'error':
      return 'error';
    default:
      // Neutral styling for unknown or unmapped phases
      return '';
  }
}
