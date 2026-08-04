import { StatusLabelProps } from '@kinvolk/headlamp-plugin/lib/components/common';

/**
 * Phases reported by Velero on Backup, Restore and Schedule objects.
 * See https://velero.io/docs for the full lifecycle.
 */
export type VeleroPhase =
  | 'New'
  | 'FailedValidation'
  | 'InProgress'
  | 'WaitingForPluginOperations'
  | 'WaitingForPluginOperationsPartiallyFailed'
  | 'Completed'
  | 'PartiallyFailed'
  | 'Failed'
  | 'Deleting'
  | 'Enabled'
  | 'Available'
  | 'Unavailable'
  | string;

/** Common label selector used in backup/restore specs. */
export interface LabelSelector {
  matchLabels?: Record<string, string>;
}

/** Progress counters Velero updates while a backup or restore runs. */
export interface VeleroProgress {
  totalItems?: number;
  itemsBackedUp?: number;
  itemsRestored?: number;
}

/**
 * Maps a Velero phase to one of the status colors Headlamp's StatusLabel knows
 * about, so all our list views show the same colors for the same phase.
 */
export function phaseToStatus(phase?: VeleroPhase): StatusLabelProps['status'] {
  switch (phase) {
    case 'Completed':
    case 'Available':
    case 'Enabled':
      return 'success';
    case 'Failed':
    case 'FailedValidation':
    case 'PartiallyFailed':
    case 'WaitingForPluginOperationsPartiallyFailed':
    case 'Unavailable':
      return 'error';
    case 'New':
    case 'InProgress':
    case 'WaitingForPluginOperations':
    case 'Deleting':
      return 'warning';
    default:
      return '';
  }
}

/** Small helper so we don't print an empty cell when a list is missing. */
export function joinOrDash(items?: string[]) {
  if (!items || items.length === 0) {
    return '-';
  }

  return items.join(', ');
}
