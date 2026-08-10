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
  Loader,
  NameValueTable,
  SectionBox,
  SectionHeader,
} from '@kinvolk/headlamp-plugin/lib/components/common';
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
 */
export function ClusterDetail() {
  const { t } = useTranslation();
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace, name } = params;
  const [cluster, error] = ClusterClass.useGet(name, namespace);
  const title = name ?? t('Cluster');

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

  if (!cluster) {
    return <Loader title={t('Loading cluster details')} />;
  }

  return <ClusterDetailContent cluster={cluster} title={title} />;
}

/**
 * The loaded detail view.
 *
 * Split from the fetch above so the backup hook is called unconditionally: the
 * cluster is known to exist here, so there is no early return above the hook.
 */
function ClusterDetailContent({ cluster, title }: { cluster: ClusterClass; title: string }) {
  const { t } = useTranslation();
  const backupData = useClusterBackupData(cluster);

  const image = cluster.status.image ?? cluster.spec.imageName ?? null;

  return (
    <>
      <SectionBox title={<SectionHeader title={title} />} backLink="/cnpg/clusters">
        <NameValueTable
          rows={[
            { name: t('Namespace'), value: cluster.metadata.namespace },
            { name: t('Phase'), value: <ClusterPhaseLabel cluster={cluster} /> },
            { name: t('Instances Ready'), value: cluster.instancesReadyText },
            {
              name: t('Primary'),
              value: cluster.currentPrimary ?? t('No primary elected'),
            },
            {
              name: t('PostgreSQL image'),
              value: image ?? t('Unknown'),
            },
            {
              name: t('Timeline'),
              value:
                typeof cluster.status.timelineID === 'number'
                  ? String(cluster.status.timelineID)
                  : t('Unknown'),
            },
            {
              name: t('Age'),
              value: cluster.metadata.creationTimestamp
                ? Utils.timeAgo(cluster.metadata.creationTimestamp)
                : t('Unknown'),
            },
          ]}
        />
        {cluster.status.phaseReason && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info">{cluster.status.phaseReason}</Alert>
          </Box>
        )}
      </SectionBox>

      <InsightsPanel cluster={cluster} backupData={backupData} />
      <TopologySection cluster={cluster} />
      <BackupSection cluster={cluster} backupData={backupData} />
    </>
  );
}
