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
import {
  LightTooltip,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import React from 'react';
import { ClusterClass } from '../../resources/cluster';
import {
  getInstanceTopology,
  InstanceHealth,
  InstanceTopologyEntry,
  isSwitchoverInProgress,
} from '../../utils/topology';

const STATUS_BY_HEALTH: Record<InstanceHealth, 'success' | 'warning' | 'error' | ''> = {
  healthy: 'success',
  replicating: 'warning',
  failed: 'error',
  unknown: '',
};

/**
 * Per-instance topology: who is primary, who is a replica, and what the
 * operator says about each one.
 *
 * Everything here is reported state. Nothing in this view can change it — the
 * plugin performs no switchover, failover, or any other mutation.
 */
export function TopologySection({ cluster }: { cluster: ClusterClass }) {
  const { t } = useTranslation();
  const instances = getInstanceTopology(cluster.jsonData);
  const switchover = isSwitchoverInProgress(cluster.jsonData);

  return (
    <SectionBox title={t('Topology')}>
      {switchover && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('The operator is moving the primary from {{ current }} to {{ target }}.', {
            current: cluster.status.currentPrimary,
            target: cluster.status.targetPrimary,
          })}
        </Alert>
      )}

      {instances.length === 0 ? (
        <Alert severity="info">
          {t(
            'This cluster reports no instances yet. That is expected while it is being created, and unexpected otherwise.'
          )}
        </Alert>
      ) : (
        <SimpleTable
          columns={[
            {
              label: t('Instance'),
              getter: (instance: InstanceTopologyEntry) => instance.name,
            },
            {
              label: t('Role'),
              getter: (instance: InstanceTopologyEntry) =>
                instance.role === 'primary'
                  ? t('Primary')
                  : instance.role === 'replica'
                  ? t('Replica')
                  : t('Unknown'),
            },
            {
              label: t('Reported state'),
              getter: (instance: InstanceTopologyEntry) => (
                <StatusLabel status={STATUS_BY_HEALTH[instance.health]}>
                  {instance.healthLabel ?? t('Unknown')}
                </StatusLabel>
              ),
            },
            {
              label: t('Timeline'),
              getter: (instance: InstanceTopologyEntry) =>
                instance.timelineId === null ? (
                  <LightTooltip
                    title={t('The instance has not reported a timeline to the operator.')}
                  >
                    <span>{t('Unknown')}</span>
                  </LightTooltip>
                ) : (
                  String(instance.timelineId)
                ),
            },
            {
              label: t('Pod IP'),
              getter: (instance: InstanceTopologyEntry) => instance.ip ?? '—',
            },
          ]}
          data={instances}
          emptyMessage={t('No instances reported')}
        />
      )}

      <Box sx={{ mt: 1 }}>
        <LightTooltip
          title={t(
            'Instance state is what the operator last reported. This plugin is read-only and never triggers a switchover or failover.'
          )}
        >
          <Box component="span" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            {t('Read-only view of operator-reported state')}
          </Box>
        </LightTooltip>
      </Box>
    </SectionBox>
  );
}
