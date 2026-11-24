import { Icon } from '@iconify/react';
import type {
  GraphNode,
  GraphSource,
} from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { type ComponentType, useMemo } from 'react';
import BackupDetail from './components/backups/Detail';
import BslDetail from './components/bsl/Detail';
import RestoreDetail from './components/restores/Detail';
import ScheduleDetail from './components/schedules/Detail';
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

type ResourceClass = {
  apiName: string;
  apiVersion: string | string[];
};

/** CRD name Headlamp uses to open the generic custom-resource details panel. */
function crdName(resourceClass: ResourceClass): string {
  const apiVersion = Array.isArray(resourceClass.apiVersion)
    ? resourceClass.apiVersion[0]
    : resourceClass.apiVersion;
  const group = apiVersion.includes('/') ? apiVersion.split('/')[0] : '';
  return group ? `${resourceClass.apiName}.${group}` : resourceClass.apiName;
}

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

type DetailProps = { name?: string; namespace?: string; cluster?: string };

/** Shows the existing Velero detail page for the selected map node. */
function makeDetailsComponent(Detail: ComponentType<DetailProps>): GraphNode['detailsComponent'] {
  return function NodeDetails({ node }) {
    const object = node.kubeObject;
    if (!object) {
      return null;
    }
    return (
      <Detail name={object.getName()} namespace={object.getNamespace()} cluster={object.cluster} />
    );
  };
}

const ScheduleNodeDetails = makeDetailsComponent(ScheduleDetail);
const BackupNodeDetails = makeDetailsComponent(BackupDetail);
const RestoreNodeDetails = makeDetailsComponent(RestoreDetail);
const StorageNodeDetails = makeDetailsComponent(BslDetail);

function nodeFor(
  object: ScopedObject,
  status: GraphNode['status'],
  weight: number,
  resourceClass: ResourceClass,
  detailsComponent: GraphNode['detailsComponent']
): GraphNode | null {
  const ref = refOf(object);
  if (!ref) {
    return null;
  }
  return {
    id: ref.uid,
    kubeObject: object as GraphNode['kubeObject'],
    customResourceDefinition: crdName(resourceClass),
    detailsComponent,
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
    const listOpts = { namespace: veleroNamespace };

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
        ...scheduleItems.map(item =>
          nodeFor(
            item,
            scheduleMapStatus(item.statusDisplay),
            1000,
            VeleroSchedule,
            ScheduleNodeDetails
          )
        ),
        ...backupItems.map(item =>
          nodeFor(item, backupMapStatus(item.phase), 800, VeleroBackup, BackupNodeDetails)
        ),
        ...restoreItems.map(item =>
          nodeFor(item, backupMapStatus(item.phase), 700, VeleroRestore, RestoreNodeDetails)
        ),
        ...locationItems.map(item =>
          nodeFor(
            item,
            storageMapStatus(item.phase),
            900,
            VeleroBackupStorageLocation,
            StorageNodeDetails
          )
        ),
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
