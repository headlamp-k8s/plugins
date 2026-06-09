/*
 * Copyright 2025 The Kubernetes Authors
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

import { Icon } from '@iconify/react';
import { Activity, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Link as MuiLink, Typography } from '@mui/material';
import { usePolicyResultCounts } from '../hooks/usePolicyResultCounts';
import { KyvernoClusterPolicy } from '../resources/kyvernoPolicy';
import { PolicyViewer } from './PolicyViewer';

function openClusterPolicyActivity(item: KyvernoClusterPolicy) {
  Activity.launch({
    id: `kyverno-cpol-${item.jsonData.metadata.name}`,
    location: 'split-right',
    icon: <Icon icon="mdi:shield-edit" />,
    title: item.jsonData.metadata.name,
    content: <PolicyViewer name={item.jsonData.metadata.name} isClusterScoped />,
  });
}

export function ClusterPolicyList() {
  const { t } = useTranslation();
  const counts = usePolicyResultCounts();
  return (
    <ResourceListView
      title={t('Cluster Policies')}
      resourceClass={KyvernoClusterPolicy}
      columns={[
        {
          id: 'name',
          label: t('Name'),
          getValue: item => item.jsonData.metadata.name,
          render: item => (
            <MuiLink
              component="button"
              onClick={() => openClusterPolicyActivity(item)}
              sx={{ textAlign: 'left' }}
            >
              {item.jsonData.metadata.name}
            </MuiLink>
          ),
        },
        {
          id: 'ready',
          label: t('Ready'),
          getValue: item => (item.ready ? 'True' : 'False'),
          render: item => (
            <Chip
              label={item.ready ? 'True' : 'False'}
              color={item.ready ? 'success' : 'error'}
              size="small"
            />
          ),
          gridTemplate: '0.5fr',
        },
        {
          id: 'action',
          label: t('Action'),
          getValue: item => item.validationFailureAction,
          gridTemplate: '0.7fr',
        },
        {
          id: 'background',
          label: t('Background'),
          getValue: item => (item.background ? 'True' : 'False'),
          gridTemplate: '0.7fr',
        },
        {
          id: 'ruleTypes',
          label: t('Rule Types'),
          getValue: item => item.ruleTypes.join(', '),
          render: item => (
            <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
              {item.ruleTypes.map(rt => (
                <Chip key={rt} label={rt} size="small" variant="outlined" />
              ))}
            </Box>
          ),
        },
        {
          id: 'rules',
          label: t('Rules'),
          getValue: item => item.rules.length,
          gridTemplate: '0.4fr',
        },
        {
          id: 'results',
          label: t('Results'),
          getValue: item => counts.forCluster(item.jsonData.metadata.name)?.total ?? 0,
          render: item => {
            const c = counts.forCluster(item.jsonData.metadata.name);
            if (counts.loading && !c) return <Typography variant="body2">…</Typography>;
            if (!c || c.total === 0) return <Typography variant="body2">—</Typography>;
            return (
              <Typography variant="body2" color={c.fail > 0 ? 'error' : 'text.primary'}>
                {t('{{fail}} / {{total}} failed', { fail: c.fail, total: c.total })}
              </Typography>
            );
          },
          gridTemplate: '0.8fr',
        },
        'age',
      ]}
    />
  );
}
