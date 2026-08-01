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
  DiscoveryIntrospectionResult,
  inspectPrometheusDiscovery,
  KubernetesType,
} from '../../request';

export interface DiscoveryIntrospectionDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DiscoveryIntrospectionDialog({ open, onClose }: DiscoveryIntrospectionDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DiscoveryIntrospectionResult | null>(null);

  const runDiscovery = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await inspectPrometheusDiscovery();
      setResult(data);
    } catch (err: any) {
      setResult({
        steps: [],
        error: err?.message || String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      runDiscovery();
    }
  }, [open]);

  const hasEndpoint =
    result?.finalEndpoint && result.finalEndpoint.type !== KubernetesType.none;

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
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" py={4} gap={2}>
            <CircularProgress size={28} />
            <Typography variant="body2">{t('Running Prometheus autodetection search...')}</Typography>
          </Box>
        )}

        {!loading && result?.error && (
          <Box py={2}>
            <Alert severity="error">
              {t('Autodetection error: {{error}}', { error: result.error })}
            </Alert>
          </Box>
        )}

        {!loading && result && !result.error && (
          <Box display="flex" flexDirection="column" gap={2}>
            {hasEndpoint ? (
              <Alert severity="success">
                <Typography variant="subtitle2">
                  {t('Prometheus Endpoint Found')}
                </Typography>
                <Typography variant="body2">
                  {t('Endpoint URL')}:{' '}
                  <strong>
                    {result.finalEndpoint?.namespace}/
                    {result.finalEndpoint?.type}/
                    {result.finalEndpoint?.name}:
                    {result.finalEndpoint?.port}
                  </strong>
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning">
                {t('No reachable Prometheus instance detected. Check label selectors and cluster permissions.')}
              </Alert>
            )}

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
                  {result.steps.map(step => (
                    <TableRow key={step.sequence}>
                      <TableCell>{step.sequence}</TableCell>
                      <TableCell>
                        <Tooltip title={step.description} arrow placement="top">
                          <Typography variant="body2" style={{ cursor: 'help' }}>
                            {t(step.strategyName)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{step.resourceType}</TableCell>
                      <TableCell>
                        <code>{step.labelSelector}</code>
                      </TableCell>
                      <TableCell>
                        {step.matched ? (
                          <Chip label={t('Matched')} color="success" size="small" />
                        ) : step.error ? (
                          <Chip label={t('Error')} color="error" size="small" />
                        ) : (
                          <Chip label={t('No Match')} color="default" size="small" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
