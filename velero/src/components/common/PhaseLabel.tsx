import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { phaseToStatus, VeleroPhase } from '../../resources/common';

interface PhaseLabelProps {
  phase?: VeleroPhase;
}

/**
 * Renders a Velero phase with a color. Used by every list and detail view so
 * the phases look the same everywhere.
 */
export function PhaseLabel({ phase }: PhaseLabelProps) {
  if (!phase) {
    return <span>-</span>;
  }

  return <StatusLabel status={phaseToStatus(phase)}>{phase}</StatusLabel>;
}
