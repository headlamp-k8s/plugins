import { Icon } from '@iconify/react';
import { ApiProxy, K8s } from '@kinvolk/headlamp-plugin/lib';
import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button } from '@mui/material';
import { useState } from 'react';
import { useVeleroNamespace } from '../../config';
import { useVeleroAccess } from '../../hooks/useVeleroAccess';
import { VeleroBackupStorageLocation } from '../../resources/storage';
import { VeleroBackup } from '../../resources/velero';
import { getBackupStatusColor } from '../../utils/status';
import { veleroListFilterFunction } from '../../utils/veleroListFilter';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';
import BackupCreateForm from './CreateForm';
import type { BackupCreateInput } from './createTypes';

function BackupListContent() {
  const veleroNamespace = useVeleroNamespace();
  const { canCreateBackup } = useVeleroAccess();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [backups, error] = VeleroBackup.useList({ namespace: veleroNamespace });
  const [namespacesList] = K8s.ResourceClasses.Namespace.useList();
  const [bslList] = VeleroBackupStorageLocation.useList({ namespace: veleroNamespace });

  const namespaces = namespacesList ? namespacesList.map(ns => ns.getName()) : [];
  const storageLocations = bslList ? bslList.map(bsl => bsl.getName()) : [];

  const handleCreateBackup = async (values: BackupCreateInput) => {
    const body = {
      apiVersion: 'velero.io/v1',
      kind: 'Backup',
      metadata: {
        name: values.name,
        namespace: veleroNamespace,
      },
      spec: {
        includedNamespaces:
          values.includedNamespaces.length > 0 ? values.includedNamespaces : undefined,
        excludedNamespaces:
          values.excludedNamespaces.length > 0 ? values.excludedNamespaces : undefined,
        includedResources:
          values.includedResources.length > 0 ? values.includedResources : undefined,
        excludedResources:
          values.excludedResources.length > 0 ? values.excludedResources : undefined,
        storageLocation: values.storageLocation || undefined,
        ttl: values.ttl || undefined,
        snapshotVolumes: values.snapshotVolumes,
        defaultVolumesToFsBackup: values.defaultVolumesToFsBackup || undefined,
      },
    };

    await ApiProxy.apply(body);
    setShowCreateForm(false);
  };

  if (showCreateForm) {
    return (
      <Box padding={2}>
        <BackupCreateForm
          namespaces={namespaces}
          storageLocations={storageLocations}
          onSubmit={handleCreateBackup}
          onCancel={() => setShowCreateForm(false)}
        />
      </Box>
    );
  }

  return (
    <ResourceListView
      title="Velero Backups"
      data={backups}
      errorMessage={error?.message}
      enableRowActions={false}
      enableRowSelection={false}
      filterFunction={veleroListFilterFunction}
      headerProps={{
        noNamespaceFilter: true,
        titleSideActions: [],
        actions: canCreateBackup
          ? [
              <Button
                key="create-backup"
                variant="contained"
                color="primary"
                size="small"
                onClick={() => setShowCreateForm(true)}
                startIcon={<Icon icon="mdi:plus" />}
              >
                Create Backup
              </Button>,
            ]
          : [],
      }}
      columns={[
        'name',
        'namespace',
        {
          id: 'phase',
          label: 'Status',
          getValue: (backup: VeleroBackup) => backup.phase,
          render: (backup: VeleroBackup) => (
            <StatusLabel status={getBackupStatusColor(backup.phase)}>{backup.phase}</StatusLabel>
          ),
        },
        {
          id: 'triggered-by',
          label: 'Triggered by',
          getValue: (backup: VeleroBackup) => backup.triggeredByDisplay,
          render: (backup: VeleroBackup) => {
            if (!backup.scheduleName) {
              return 'Manual';
            }
            return (
              <Link
                routeName={veleroRouteNames.scheduleDetail}
                params={{ namespace: backup.getNamespace(), name: backup.scheduleName }}
                activeCluster={backup.cluster}
              >
                {backup.scheduleName}
              </Link>
            );
          },
        },
        {
          id: 'namespaces',
          label: 'Namespaces',
          getValue: (backup: VeleroBackup) => backup.includedNamespacesDisplay,
        },
        {
          id: 'started',
          label: 'Started',
          getValue: (backup: VeleroBackup) => backup.startTimestamp ?? '',
          render: (backup: VeleroBackup) =>
            backup.startTimestamp ? new Date(backup.startTimestamp).toLocaleString() : 'N/A',
        },
        'age',
      ]}
    />
  );
}

/** Cluster-wide Velero Backup list — Phase 2 views + Phase 4 create. */
export default function BackupList() {
  return (
    <VeleroInstallCheck>
      <BackupListContent />
    </VeleroInstallCheck>
  );
}
