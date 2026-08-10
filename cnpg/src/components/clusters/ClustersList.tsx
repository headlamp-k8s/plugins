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
import { LightTooltip, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';
import { ClusterClass, CNPG_GROUP } from '../../resources/cluster';
import { isForbidden } from '../../utils/permissions';
import { LoadFailed, PermissionDenied } from '../common/EmptyStates';
import { ClusterPhaseLabel } from './ClusterPhaseLabel';

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
          // Sort on the raw timestamp; clusters that report nothing sort last.
          getValue: (cluster: ClusterClass) => cluster.lastSuccessfulBackup ?? '',
          render: (cluster: ClusterClass) => {
            const timestamp = cluster.lastSuccessfulBackup;
            if (!timestamp) {
              return (
                <LightTooltip
                  title={t(
                    'This cluster does not report a backup timestamp. Clusters using the barman-cloud plugin never populate this field; check Backup objects instead.'
                  )}
                >
                  <span>{t('Unknown')}</span>
                </LightTooltip>
              );
            }

            return (
              <LightTooltip title={timestamp}>
                <span>{Utils.timeAgo(timestamp)}</span>
              </LightTooltip>
            );
          },
        },
        'age',
      ]}
    />
  );
}
