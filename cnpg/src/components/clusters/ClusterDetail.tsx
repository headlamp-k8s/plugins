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

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ClusterClass, CNPG_GROUP } from '../../resources/cluster';
import { isForbidden } from '../../utils/permissions';
import { LoadFailed, PermissionDenied } from '../common/EmptyStates';
import { BackupSection } from './BackupSection';
import { ClusterPhaseLabel } from './ClusterPhaseLabel';
import { InsightsPanel } from './InsightsPanel';
import { TopologySection } from './TopologySection';
import { useClusterBackupData } from './useClusterBackupData';

/**
 * Read-only detail view for one CloudNativePG Cluster.
 *
 * Answers the two day-2 questions the list view cannot: what does the cluster
 * look like instance by instance, and how confident can anyone be that it could
 * be restored.
 *
 * The body is Headlamp's own DetailsGrid, so the header, metadata block and
 * section layout match every built-in resource view. Its default header actions
 * are Restart, Scale, Edit and Delete — all four mutating — so `noDefaultActions`
 * is required, not cosmetic: this plugin is strictly read-only. `withEvents` is
 * likewise left off, since the plugin reads only the three CloudNativePG CRDs.
 */
export function ClusterDetail() {
  const { t } = useTranslation();
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace, name } = params;
  const title = name ?? t('Cluster');

  /*
   * DetailsGrid does its own fetch and renders whatever error comes back as
   * plain text, which would turn a denial into "...is forbidden..." instead of
   * naming the permission the user needs. So the same get is gated here first.
   *
   * This costs no extra request: DetailsGrid calls the identical
   * `ClusterClass.useGet`, and useGet is backed by react-query under a key
   * derived from cluster/name/namespace/endpoint, so both callers share one
   * in-flight query.
   */
  const [, error] = ClusterClass.useGet(name, namespace);

  if (error) {
    if (isForbidden(error)) {
      return (
        <PermissionDenied
          title={title}
          permission={{ verb: 'get', resource: 'clusters', apiGroup: CNPG_GROUP, namespace }}
        />
      );
    }

    return <LoadFailed title={title} message={error.message} />;
  }

  return (
    <DetailsGrid
      resourceType={ClusterClass}
      name={name}
      namespace={namespace}
      title={title}
      backLink="/cnpg/clusters"
      noDefaultActions
      headerSection={(cluster: ClusterClass | null) =>
        cluster?.status?.phaseReason ? (
          <Box sx={{ mb: 2 }}>
            <Alert severity="info">{cluster.status.phaseReason}</Alert>
          </Box>
        ) : null
      }
      extraInfo={(cluster: ClusterClass | null) =>
        cluster
          ? [
              { name: t('Phase'), value: <ClusterPhaseLabel cluster={cluster} /> },
              { name: t('Instances Ready'), value: cluster.instancesReadyText },
              {
                name: t('Primary'),
                value: cluster.currentPrimary ?? t('No primary elected'),
              },
              {
                name: t('PostgreSQL image'),
                value: cluster.status.image ?? cluster.spec.imageName ?? t('Unknown'),
              },
              {
                name: t('Timeline'),
                value:
                  typeof cluster.status.timelineID === 'number'
                    ? String(cluster.status.timelineID)
                    : t('Unknown'),
              },
            ]
          : null
      }
      extraSections={(cluster: ClusterClass | null) =>
        cluster ? [<ClusterSections key="cnpg-sections" cluster={cluster} />] : []
      }
    />
  );
}

/**
 * The CloudNativePG-specific sections, below the standard metadata block.
 *
 * A component rather than inline nodes so the backup hook has somewhere to live:
 * it is shared by the insights panel and the backup section, and calling it here
 * keeps it unconditional, below the point where the cluster is known to exist.
 */
function ClusterSections({ cluster }: { cluster: ClusterClass }) {
  const backupData = useClusterBackupData(cluster);

  return (
    <>
      <InsightsPanel cluster={cluster} backupData={backupData} />
      <TopologySection cluster={cluster} />
      <BackupSection cluster={cluster} backupData={backupData} />
    </>
  );
}
