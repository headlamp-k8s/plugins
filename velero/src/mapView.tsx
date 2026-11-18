import { Icon } from '@iconify/react';
import type {
  GraphNode,
  GraphSource,
} from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import { useMemo } from 'react';
import { useVeleroNamespace } from './config';
import {
  backupMapStatus,
  type MapObjectRef,
  scheduleMapStatus,
  storageMapStatus,
  veleroMapEdges,
} from './map/relationships';
import { VeleroBackupStorageLocation } from './resources/storage';
import { VeleroBackup, VeleroRestore, VeleroSchedule } from './resources/velero';
import { veleroIconName } from './veleroIcon';

type ScopedObject = {
  metadata: { uid?: string };
  cluster?: string;
  getName: () => string;
  getNamespace: () => string;
};

function refOf(object: ScopedObject): MapObjectRef | null {
  const uid = object.metadata.uid;
  if (!uid) {
    return null;
  }
  return {
    uid,
    name: object.getName(),
    namespace: object.getNamespace(),
    cluster: object.cluster,
  };
}

function nodeFor(
  object: ScopedObject,
  status: GraphNode['status'],
  weight: number
): GraphNode | null {
  const ref = refOf(object);
  if (!ref) {
    return null;
  }
  return {
    id: ref.uid,
    kubeObject: object as GraphNode['kubeObject'],
    status,
    weight,
  };
}

/**
 * Headlamp map source for Velero.
 * Schedules, Backups, Restores, and Backup Storage Locations in the configured namespace.
 */
export const veleroMapSource: GraphSource = {
  id: 'velero',
  label: 'Velero',
  icon: <Icon icon={veleroIconName} width="100%" height="100%" />,
  isEnabledByDefault: true,
  useData() {
    const veleroNamespace = useVeleroNamespace();
    const cluster = getCluster() || undefined;
    const listOpts = { namespace: veleroNamespace, cluster };

    const [schedules, schedulesError] = VeleroSchedule.useList(listOpts);
    const [backups, backupsError] = VeleroBackup.useList(listOpts);
    const [restores, restoresError] = VeleroRestore.useList(listOpts);
    const [storageLocations, storageError] = VeleroBackupStorageLocation.useList(listOpts);

    const loading =
      (schedules === null && !schedulesError) ||
      (backups === null && !backupsError) ||
      (restores === null && !restoresError) ||
      (storageLocations === null && !storageError);

    return useMemo(() => {
      if (loading) {
        return null;
      }

      const scheduleItems = schedules ?? [];
      const backupItems = backups ?? [];
      const restoreItems = restores ?? [];
      const locationItems = storageLocations ?? [];

      const nodes = [
        ...scheduleItems.map(item => nodeFor(item, scheduleMapStatus(item.statusDisplay), 1000)),
        ...backupItems.map(item => nodeFor(item, backupMapStatus(item.phase), 800)),
        ...restoreItems.map(item => nodeFor(item, backupMapStatus(item.phase), 700)),
        ...locationItems.map(item => nodeFor(item, storageMapStatus(item.phase), 900)),
      ].filter((item): item is GraphNode => item !== null);

      const edges = veleroMapEdges({
        schedules: scheduleItems.flatMap(item => {
          const ref = refOf(item);
          return ref ? [{ ...ref, storageLocation: item.storageLocation }] : [];
        }),
        backups: backupItems.flatMap(item => {
          const ref = refOf(item);
          return ref
            ? [{ ...ref, scheduleName: item.scheduleName, storageLocation: item.storageLocation }]
            : [];
        }),
        restores: restoreItems.flatMap(item => {
          const ref = refOf(item);
          return ref
            ? [{ ...ref, backupName: item.backupName, scheduleName: item.scheduleName }]
            : [];
        }),
        storageLocations: locationItems.flatMap(item => {
          const ref = refOf(item);
          return ref ? [ref] : [];
        }),
      });

      return { nodes, edges };
    }, [backups, loading, restores, schedules, storageLocations]);
  },
};
