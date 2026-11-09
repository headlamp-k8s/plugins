import { Icon } from '@iconify/react';
import { ApiProxy, K8s } from '@kinvolk/headlamp-plugin/lib';
import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button } from '@mui/material';
import { useState } from 'react';
import { useVeleroNamespace } from '../../config';
import { useVeleroAccess } from '../../hooks/useVeleroAccess';
import { VeleroBackup, VeleroRestore } from '../../resources/velero';
import { getRestoreStatusColor } from '../../utils/status';
import { veleroListFilterFunction } from '../../utils/veleroListFilter';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';
import RestoreCreateForm from './CreateForm';
import type { RestoreCreateInput } from './createTypes';

function RestoreSourceCell({ restore }: { restore: VeleroRestore }) {
  if (restore.backupName) {
    return (
      <Link
        routeName={veleroRouteNames.backupDetail}
        params={{ namespace: restore.getNamespace(), name: restore.backupName }}
        activeCluster={restore.cluster}
      >
        {restore.backupName}
      </Link>
    );
  }
  if (restore.scheduleName) {
    return (
      <Link
        routeName={veleroRouteNames.scheduleDetail}
        params={{ namespace: restore.getNamespace(), name: restore.scheduleName }}
        activeCluster={restore.cluster}
      >
        {`Schedule: ${restore.scheduleName}`}
      </Link>
    );
  }
  return <>N/A</>;
}

function RestoreListContent() {
  const veleroNamespace = useVeleroNamespace();
  const { loading: accessLoading, canCreateRestore } = useVeleroAccess();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [restores, error] = VeleroRestore.useList({ namespace: veleroNamespace });
  const [backupsList] = VeleroBackup.useList({ namespace: veleroNamespace });
  const [namespacesList] = K8s.ResourceClasses.Namespace.useList();

  const backups = backupsList ? backupsList.map(b => b.getName()) : [];
  const namespaces = namespacesList ? namespacesList.map(ns => ns.getName()) : [];

  const handleCreateRestore = async (values: RestoreCreateInput) => {
    const body = {
      apiVersion: 'velero.io/v1',
      kind: 'Restore',
      metadata: {
        name: values.name,
        namespace: veleroNamespace,
      },
      spec: {
        backupName: values.backupName,
        includedNamespaces:
          values.includedNamespaces.length > 0 ? values.includedNamespaces : undefined,
        excludedNamespaces:
          values.excludedNamespaces.length > 0 ? values.excludedNamespaces : undefined,
        restorePVs: values.restorePVs,
      },
    };

    // POST only so duplicate names surface as AlreadyExists instead of silent apply/update.
    await ApiProxy.post(`/apis/velero.io/v1/namespaces/${veleroNamespace}/restores`, body);
    setShowCreateForm(false);
  };

  if (showCreateForm) {
    return (
      <Box padding={2}>
        <RestoreCreateForm
          backups={backups}
          namespaces={namespaces}
          onSubmit={handleCreateRestore}
          onCancel={() => setShowCreateForm(false)}
        />
      </Box>
    );
  }

  return (
    <ResourceListView
      title="Velero Restores"
      data={restores}
      errorMessage={error?.message}
      enableRowActions={false}
      enableRowSelection={false}
      filterFunction={veleroListFilterFunction}
      headerProps={{
        noNamespaceFilter: true,
        titleSideActions: [],
        actions:
          !accessLoading && canCreateRestore
            ? [
                <Button
                  key="create-restore"
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => setShowCreateForm(true)}
                  startIcon={<Icon icon="mdi:plus" />}
                >
                  Create Restore
                </Button>,
              ]
            : [],
      }}
      columns={[
        'name',
        'namespace',
        {
          id: 'backup-source',
          label: 'Backup source',
          getValue: (restore: VeleroRestore) => restore.sourceDisplay,
          render: (restore: VeleroRestore) => <RestoreSourceCell restore={restore} />,
        },
        {
          id: 'phase',
          label: 'Status',
          getValue: (restore: VeleroRestore) => restore.phase,
          render: (restore: VeleroRestore) => (
            <StatusLabel status={getRestoreStatusColor(restore.phase)}>{restore.phase}</StatusLabel>
          ),
        },
        {
          id: 'namespaces',
          label: 'Namespaces',
          getValue: (restore: VeleroRestore) => restore.includedNamespacesDisplay,
        },
        {
          id: 'errors',
          label: 'Errors',
          getValue: (restore: VeleroRestore) => restore.errors,
        },
        {
          id: 'warnings',
          label: 'Warnings',
          getValue: (restore: VeleroRestore) => restore.warnings,
        },
        {
          id: 'started',
          label: 'Started',
          getValue: (restore: VeleroRestore) => restore.startTimestamp ?? '',
          render: (restore: VeleroRestore) =>
            restore.startTimestamp ? new Date(restore.startTimestamp).toLocaleString() : 'N/A',
        },
        'age',
      ]}
    />
  );
}

/** Cluster-wide Velero Restore list — Phase 2 views + Phase 4 create. */
export default function RestoreList() {
  return (
    <VeleroInstallCheck>
      <RestoreListContent />
    </VeleroInstallCheck>
  );
}
