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
import { Box, Chip, Divider, Link as MuiLink, Typography } from '@mui/material';
import { ImpactedResource, PolicyImpactSummary } from '../resources/policyImpact';
import { PolicyViewer } from './PolicyViewer';

interface MapNodeData {
  impact: PolicyImpactSummary;
  clipped: boolean;
  reportError?: string;
}

// How many failing resources to list in the sidebar panel.
const DISPLAYED_RESOURCES = 5;

// Status icon and color for a single resource row.
function ResourceStatusIcon({ status }: { status: ImpactedResource['status'] }) {
  const { t } = useTranslation();
  const statusLabels: Record<string, string> = {
    fail: t('Fail'),
    error: t('Error'),
    warn: t('Warn'),
    pass: t('Pass'),
    skip: t('Skip'),
  };
  const label = statusLabels[status] ?? status;

  if (status === 'fail' || status === 'error') {
    return (
      <Icon
        icon="mdi:close-circle"
        width="16"
        aria-label={label}
        style={{ color: 'rgb(211, 47, 47)', flexShrink: 0 }}
      />
    );
  }
  if (status === 'warn') {
    return (
      <Icon
        icon="mdi:alert-circle"
        width="16"
        aria-label={label}
        style={{ color: 'rgb(237, 108, 2)', flexShrink: 0 }}
      />
    );
  }
  if (status === 'skip') {
    return (
      <Icon
        icon="mdi:minus-circle"
        width="16"
        aria-label={label}
        style={{ color: 'rgb(120, 120, 120)', flexShrink: 0 }}
      />
    );
  }
  return (
    <Icon
      icon="mdi:check-circle"
      width="16"
      aria-label={label}
      style={{ color: 'rgb(46, 125, 50)', flexShrink: 0 }}
    />
  );
}

/**
 * Sidebar details panel rendered by the Map view when a Kyverno policy node is
 * clicked. Receives the node's `kubeObject` (the ClusterPolicy or Policy) and
 * `data.impact` (a PolicyImpactSummary pre-computed in mapSource.tsx's
 * useData()). Falls back to showing just the policy identity if `data.impact`
 * is not available.
 *
 * Intentionally does not make any additional API calls: all the data shown here
 * was fetched in the single useData() batch in mapSource.tsx, so clicking a node
 * never triggers new network requests.
 */
export function PolicyImpactNodeDetails({ node }: { node: any }) {
  const { t } = useTranslation();

  const policy = node.kubeObject;
  const name: string = policy?.metadata?.name ?? '(unknown)';
  const namespace: string | undefined = policy?.metadata?.namespace;
  const action: string = policy?.spec?.validationFailureAction ?? 'Audit';

  const data: MapNodeData | undefined = node.data;
  const impact = data?.impact;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold">
        {name}
      </Typography>
      {namespace && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {t('Namespace')}: {namespace}
        </Typography>
      )}

      <Box sx={{ mt: 1 }}>
        <Chip label={action} size="small" variant="outlined" />
      </Box>

      {impact && (
        <>
          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            {impact.counts.pass > 0 && (
              <Chip
                label={t('{{count}} passing', { count: impact.counts.pass })}
                color="success"
                size="small"
                variant="outlined"
              />
            )}
            {impact.counts.fail + impact.counts.error > 0 && (
              <Chip
                label={t('{{count}} failing', {
                  count: impact.counts.fail + impact.counts.error,
                })}
                color="error"
                size="small"
                variant="outlined"
              />
            )}
            {impact.counts.warn > 0 && (
              <Chip
                label={t('{{count}} warnings', { count: impact.counts.warn })}
                color="warning"
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {data?.reportError && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mb: 0.5 }}>
              {data.reportError}
            </Typography>
          )}
          {impact.resources.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              {t('No evaluated resources yet.')}
            </Typography>
          ) : (
            <>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.5 }}
              >
                {t('Affected resources (top {{count}}):', { count: DISPLAYED_RESOURCES })}
              </Typography>
              {impact.resources.slice(0, DISPLAYED_RESOURCES).map((res, i) => (
                <Box
                  key={
                    res.uid ?? `${res.kind ?? 'Unknown'}-${res.namespace ?? ''}-${res.name}-${i}`
                  }
                  sx={{ display: 'flex', gap: 0.75, alignItems: 'center', mb: 0.5 }}
                >
                  <ResourceStatusIcon status={res.status} />
                  <Typography variant="caption" noWrap title={res.name}>
                    {res.name}
                    {res.namespace && (
                      <Typography component="span" variant="caption" color="text.secondary">
                        {' '}
                        ({res.namespace})
                      </Typography>
                    )}
                  </Typography>
                </Box>
              ))}
              {(data?.clipped || impact.resources.length > DISPLAYED_RESOURCES) && (
                <MuiLink
                  component="button"
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    background: 'none',
                    border: 'none',
                    p: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() =>
                    Activity.launch({
                      id: namespace ? `kyverno-pol-${namespace}-${name}` : `kyverno-cpol-${name}`,
                      location: 'split-right',
                      icon: <Icon icon="mdi:shield-edit" />,
                      title: name,
                      content: (
                        <PolicyViewer
                          name={name}
                          namespace={namespace}
                          isClusterScoped={!namespace}
                        />
                      ),
                    })
                  }
                >
                  {t('More resources not shown. Open the policy detail page to see all.')}
                </MuiLink>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
}
