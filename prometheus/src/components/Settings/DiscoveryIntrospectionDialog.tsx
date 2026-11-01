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

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  inspectPrometheusDiscovery,
  KubernetesType,
  PrometheusEndpoint,
  PrometheusSearchStrategyId,
  SearchStrategyStepResult,
} from '../../request';

export interface DiscoveryIntrospectionDialogProps {
  open: boolean;
  onClose: () => void;
  /** The cluster to run autodetection on. */
  cluster: string;
}

/**
 * Translated name and description of each search strategy.
 * The keys are written out so the translation extractor finds them.
 */
function useStrategyText(): Record<
  PrometheusSearchStrategyId,
  { name: string; description: string }
> {
  const { t } = useTranslation();
  return {
    customPod: {
      name: t('Custom Pod Label Search'),
      description: t(
        'Finds a Pod you labelled headlamp-prometheus=true, to point autodetection at a specific Prometheus. Checked first so it wins over the standard labels.'
      ),
    },
    customService: {
      name: t('Custom Service Label Search'),
      description: t(
        'Finds a Service you labelled headlamp-prometheus=true, to point autodetection at a specific Prometheus. Checked before the standard labels.'
      ),
    },
    standardPod: {
      name: t('Standard Pod Label Search'),
      description: t(
        'Finds a Pod with the standard app.kubernetes.io/name=prometheus label, which common Prometheus installations set, so it works without extra setup.'
      ),
    },
    standardService: {
      name: t('Standard Service Label Search'),
      description: t(
        'Finds a Service with the standard app.kubernetes.io/name=prometheus and app.kubernetes.io/component=server labels, which common Prometheus installations set on the server Service.'
      ),
    },
  };
}

export function DiscoveryIntrospectionDialog({
  open,
  onClose,
  cluster,
}: DiscoveryIntrospectionDialogProps) {
  const { t } = useTranslation();
  const strategyText = useStrategyText();
  const [loading, setLoading] = useState<boolean>(false);
  const [steps, setSteps] = useState<SearchStrategyStepResult[]>([]);
  const [finalEndpoint, setFinalEndpoint] = useState<PrometheusEndpoint | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    // Ignore a run that was replaced by a newer one or by closing the dialog.
    let active = true;
    setLoading(true);
    setSteps([]);
    setFinalEndpoint(null);

    inspectPrometheusDiscovery(cluster, step => {
      if (active) {
        setSteps(previous => [...previous, step]);
      }
    })
      .then(result => {
        if (active) {
          setFinalEndpoint(result.finalEndpoint);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, cluster]);

  const hasEndpoint = !!finalEndpoint && finalEndpoint.type !== KubernetesType.none;
  // A failed search ends autodetection with an error rather than "not found".
  const failedStep = steps.find(step => step.error);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="prometheus-discovery-dialog-title"
    >
      <DialogTitle id="prometheus-discovery-dialog-title">
        {t('Prometheus Autodetection Introspection')}
      </DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2}>
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" py={2} gap={2}>
              <CircularProgress size={28} />
              <Typography variant="body2">
                {t('Running Prometheus autodetection search...')}
              </Typography>
            </Box>
          )}

          {!loading && failedStep && (
            <Alert severity="error">
              {t('Autodetection failed: {{error}}', { error: failedStep.error })}
            </Alert>
          )}

          {!loading &&
            finalEndpoint &&
            !failedStep &&
            (hasEndpoint ? (
              <Alert severity="success">
                <Typography variant="subtitle2">{t('Prometheus Endpoint Found')}</Typography>
                <Typography variant="body2">
                  {t('Endpoint URL')}:{' '}
                  <strong>
                    {finalEndpoint.namespace}/{finalEndpoint.type}/{finalEndpoint.name}:
                    {finalEndpoint.port}
                  </strong>
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning">
                {t(
                  'No reachable Prometheus instance detected. Check label selectors and cluster permissions.'
                )}
              </Alert>
            ))}

          {steps.length > 0 && (
            <>
              <Typography variant="subtitle1" fontWeight="medium">
                {t('Search Progression History')}
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small" aria-label={t('Prometheus search strategies table')}>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>{t('Strategy Name')}</TableCell>
                      <TableCell>{t('Type')}</TableCell>
                      <TableCell>{t('Label Selector')}</TableCell>
                      <TableCell>{t('Status')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {steps.map(step => (
                      <TableRow key={step.sequence}>
                        <TableCell>{step.sequence}</TableCell>
                        <TableCell>
                          <Tooltip
                            title={strategyText[step.strategyId].description}
                            arrow
                            placement="top"
                          >
                            <Typography variant="body2" style={{ cursor: 'help' }}>
                              {strategyText[step.strategyId].name}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{step.resourceType}</TableCell>
                        <TableCell>
                          <code>{step.labelSelector}</code>
                        </TableCell>
                        <TableCell>
                          <StepStatus step={step} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * The result of one search step: matched, unreachable, failed or no match.
 */
function StepStatus({ step }: { step: SearchStrategyStepResult }) {
  const { t } = useTranslation();

  if (step.error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="flex-start" gap={0.5}>
        <Chip label={t('Error')} color="error" size="small" />
        <Typography variant="caption">{step.error}</Typography>
      </Box>
    );
  }

  if (!step.matched || !step.matchedResource) {
    return <Chip label={t('No Match')} color="default" size="small" variant="outlined" />;
  }

  const resource = step.matchedResource;
  if (resource.reachablePort) {
    return <Chip label={t('Matched')} color="success" size="small" />;
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={0.5}>
      <Chip label={t('Unreachable')} color="warning" size="small" />
      <Typography variant="caption">
        {t('{{namespace}}/{{name}}, ports: {{ports}}', {
          namespace: resource.namespace,
          name: resource.name,
          ports: resource.ports.join(', '),
        })}
      </Typography>
    </Box>
  );
}
