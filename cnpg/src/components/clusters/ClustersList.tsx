/*
 * Copyright 2026 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useTranslation, Utils } from '@kinvolk/headlamp-plugin/lib';
import {
  LightTooltip,
  Link as HeadlampLink,
  ResourceListView,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';
import { BackupClass } from '../../resources/backup';
import { ClusterClass, CNPG_GROUP } from '../../resources/cluster';
import { lastSuccessfulBackupByCluster } from '../../utils/backupFacts';
import { describeMissingPermission, isForbidden } from '../../utils/permissions';
import { LoadFailed, PermissionDenied } from '../common/EmptyStates';
import { ClusterPhaseLabel } from './ClusterPhaseLabel';
import { lastBackupSortValue, LastBackupState, lastBackupState } from './lastBackupCell';

/** A value the Backup objects do not answer, with the reason on hover. */
function UnknownBackup({ reason }: { reason: string }) {
  const { t } = useTranslation();

  return (
    <LightTooltip title={reason}>
      <span>{t('Unknown')}</span>
    </LightTooltip>
  );
}

/**
 * List view for CloudNativePG Clusters.
 *
 * Columns follow the day-2 questions the plugin is built to answer at a
 * glance: is it healthy, are all instances up, which instance is primary, and
 * how old is the last backup.
 */
export function ClustersList() {
  const { t } = useTranslation();
  const [clusters, error] = ClusterClass.useList();
  const title = t('PostgreSQL Clusters');

  // Read across every namespace once and index the result, rather than reading
  // per row. The last-backup time is derived from Backup objects for the same
  // reason the detail view does it: Cluster.status.lastSuccessfulBackup is
  // deprecated upstream and is never populated for plugin-based backups, so a
  // healthy plugin-backed cluster used to render here as though it had none.
  const [backups, backupsError] = BackupClass.useList();
  const backupIndex = React.useMemo(
    () => lastSuccessfulBackupByCluster(backups?.map(backup => backup.jsonData)),
    [backups]
  );

  // A denial on Backups degrades this one column; it must not take the rows
  // with it, because phase, readiness and primary are all still readable.
  const backupDenialReason = backupsError
    ? isForbidden(backupsError)
      ? t('Backup objects could not be read: {{ permission }}', {
          permission: describeMissingPermission({
            verb: 'list',
            resource: 'backups',
            apiGroup: CNPG_GROUP,
          }),
        })
      : t('Backup objects could not be read: {{ message }}', { message: backupsError.message })
    : '';

  if (error) {
    if (isForbidden(error)) {
      return (
        <PermissionDenied
          title={title}
          permission={{ verb: 'list', resource: 'clusters', apiGroup: CNPG_GROUP }}
        />
      );
    }

    return <LoadFailed title={title} message={error.message} />;
  }

  const lastBackupFor = (cluster: ClusterClass): LastBackupState =>
    lastBackupState({
      hasError: Boolean(backupsError),
      loaded: Boolean(backups),
      record: backupIndex.get(`${cluster.metadata.namespace ?? ''}/${cluster.metadata.name}`),
    });

  return (
    <ResourceListView
      title={title}
      data={clusters}
      // This plugin is strictly read-only. Headlamp's default row menu offers
      // Edit and Delete, and row selection exists to drive bulk deletion, so
      // both are switched off rather than left at their defaults.
      enableRowActions={false}
      enableRowSelection={false}
      columns={[
        {
          id: 'name',
          label: t('Name'),
          getValue: (cluster: ClusterClass) => cluster.metadata.name,
          render: (cluster: ClusterClass) => (
            <HeadlampLink
              routeName="cnpg-cluster-details"
              params={{
                namespace: cluster.metadata.namespace ?? '',
                name: cluster.metadata.name,
              }}
            >
              {cluster.metadata.name}
            </HeadlampLink>
          ),
        },
        {
          id: 'namespace',
          label: t('Namespace'),
          getValue: (cluster: ClusterClass) => cluster.metadata.namespace ?? '',
        },
        {
          id: 'phase',
          label: t('Phase'),
          getValue: (cluster: ClusterClass) => cluster.phase ?? t('Unknown'),
          render: (cluster: ClusterClass) => <ClusterPhaseLabel cluster={cluster} />,
        },
        {
          id: 'instances',
          label: t('Instances Ready'),
          getValue: (cluster: ClusterClass) => cluster.instancesReadyText,
        },
        {
          id: 'primary',
          label: t('Primary'),
          getValue: (cluster: ClusterClass) => cluster.currentPrimary ?? '—',
        },
        {
          id: 'lastBackup',
          label: t('Last Backup'),
          // Doubles as the table's repaint key — see lastBackupSortValue.
          getValue: (cluster: ClusterClass) => lastBackupSortValue(lastBackupFor(cluster)),
          render: (cluster: ClusterClass) => {
            const state = lastBackupFor(cluster);

            if (state.kind === 'denied') {
              return <UnknownBackup reason={backupDenialReason} />;
            }

            if (state.kind === 'loading') {
              return <UnknownBackup reason={t('Backup objects have not been read yet.')} />;
            }

            if (state.kind === 'none') {
              // Distinct from Unknown on purpose: the Backup objects were read
              // and none of them reports a successful backup for this cluster.
              return (
                <LightTooltip
                  title={t('No Backup object for this cluster has completed successfully.')}
                >
                  <span>{t('None')}</span>
                </LightTooltip>
              );
            }

            return (
              <LightTooltip title={`${state.completedAt} · ${state.record.name}`}>
                <span>{Utils.timeAgo(state.completedAt)}</span>
              </LightTooltip>
            );
          },
        },
        'age',
      ]}
    />
  );
}
