import type {
  GraphEdge,
  GraphNodeStatus,
} from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import {
  getBackupStatusColor,
  getScheduleStatusColor,
  getStorageStatusColor,
} from '../utils/status';

export type MapObjectRef = {
  uid: string;
  name: string;
  namespace: string;
  cluster?: string;
};

function sameScope(left: MapObjectRef, right: MapObjectRef): boolean {
  return left.namespace === right.namespace && (left.cluster ?? '') === (right.cluster ?? '');
}

function edge(source: string, target: string, label: string): GraphEdge {
  return {
    id: `${source}-${target}-${label}`,
    source,
    target,
    label,
  };
}

function colorToStatus(color: string): GraphNodeStatus | undefined {
  if (color === 'success' || color === 'error' || color === 'warning') {
    return color;
  }
  return undefined;
}

/** Map badge for a Backup or Restore phase. */
export function backupMapStatus(phase: string): GraphNodeStatus | undefined {
  return colorToStatus(getBackupStatusColor(phase));
}

/** Map badge for a Schedule statusDisplay value. */
export function scheduleMapStatus(status: string): GraphNodeStatus | undefined {
  return colorToStatus(getScheduleStatusColor(status));
}

/** Map badge for a BackupStorageLocation phase. */
export function storageMapStatus(phase: string): GraphNodeStatus | undefined {
  return colorToStatus(getStorageStatusColor(phase));
}

/**
 * Edges for the Headlamp map:
 * Schedule creates Backup, Backup or Schedule is restored, and both store in a BSL.
 * Objects in different namespaces or clusters are not linked.
 */
export function veleroMapEdges(input: {
  schedules: Array<MapObjectRef & { storageLocation?: string }>;
  backups: Array<MapObjectRef & { scheduleName?: string; storageLocation?: string }>;
  restores: Array<MapObjectRef & { backupName?: string; scheduleName?: string }>;
  storageLocations: MapObjectRef[];
}): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (const backup of input.backups) {
    const schedule = input.schedules.find(
      item => item.name === backup.scheduleName && sameScope(item, backup)
    );
    if (schedule) {
      edges.push(edge(schedule.uid, backup.uid, 'creates'));
    }

    const location = input.storageLocations.find(
      item => item.name === backup.storageLocation && sameScope(item, backup)
    );
    if (location) {
      edges.push(edge(backup.uid, location.uid, 'stores'));
    }
  }

  for (const schedule of input.schedules) {
    const location = input.storageLocations.find(
      item => item.name === schedule.storageLocation && sameScope(item, schedule)
    );
    if (location) {
      edges.push(edge(schedule.uid, location.uid, 'stores'));
    }
  }

  for (const restore of input.restores) {
    const backup = input.backups.find(
      item => item.name === restore.backupName && sameScope(item, restore)
    );
    if (backup) {
      edges.push(edge(backup.uid, restore.uid, 'restores'));
    }

    const schedule = input.schedules.find(
      item => item.name === restore.scheduleName && sameScope(item, restore)
    );
    if (schedule) {
      edges.push(edge(schedule.uid, restore.uid, 'restores'));
    }
  }

  return edges;
}
