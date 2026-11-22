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
import { DiffEditor } from '@monaco-editor/react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import jsYaml from 'js-yaml';
import React, { useMemo, useState } from 'react';
import { Container, KRevision } from '../../resources/knative';

export interface RevisionDiffModalProps {
  open: boolean;
  onClose: () => void;
  revision: KRevision;
  initialBaseRevisionName?: string;
}

type DiffMode = 'specTemplate' | 'spec' | 'fullResource';

interface EnvVarDiff {
  name: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  baseValue?: string;
  targetValue?: string;
}

function getEnvDiff(baseEnv: Container['env'] = [], targetEnv: Container['env'] = []): EnvVarDiff[] {
  const baseMap = new Map(baseEnv.map(e => [e.name, e.value ?? e.valueFrom?.configMapKeyRef?.name ?? e.valueFrom?.secretKeyRef?.name ?? '']));
  const targetMap = new Map(targetEnv.map(e => [e.name, e.value ?? e.valueFrom?.configMapKeyRef?.name ?? e.valueFrom?.secretKeyRef?.name ?? '']));

  const diffs: EnvVarDiff[] = [];

  targetMap.forEach((targetVal, name) => {
    if (!baseMap.has(name)) {
      diffs.push({ name, type: 'added', targetValue: targetVal });
    } else {
      const baseVal = baseMap.get(name);
      if (baseVal !== targetVal) {
        diffs.push({ name, type: 'modified', baseValue: baseVal, targetValue: targetVal });
      } else {
        diffs.push({ name, type: 'unchanged', baseValue: baseVal, targetValue: targetVal });
      }
    }
  });

  baseMap.forEach((baseVal, name) => {
    if (!targetMap.has(name)) {
      diffs.push({ name, type: 'removed', baseValue: baseVal });
    }
  });

  return diffs;
}

export function RevisionDiffModal({
  open,
  onClose,
  revision,
  initialBaseRevisionName,
}: RevisionDiffModalProps) {
  const theme = useTheme();
  const namespace = revision.metadata.namespace ?? '';
  const cluster = revision.cluster;

  const [allRevisions] = KRevision.useList({ namespace, cluster });

  // Filter revisions under same service or namespace
  const serviceRevisions = useMemo(() => {
    if (!allRevisions) return [revision];
    const filtered = allRevisions.filter(
      r => (revision.parentService ? r.parentService === revision.parentService : true)
    );

    return filtered.sort((a, b) => {
      const timeA = new Date(a.metadata.creationTimestamp ?? 0).getTime();
      const timeB = new Date(b.metadata.creationTimestamp ?? 0).getTime();
      return timeB - timeA; // Newest first
    });
  }, [allRevisions, revision]);

  const [targetRevName, setTargetRevName] = useState<string>(revision.metadata.name ?? '');

  const defaultBaseName = useMemo(() => {
    if (initialBaseRevisionName) return initialBaseRevisionName;
    const currentIndex = serviceRevisions.findIndex(r => r.metadata.name === targetRevName);
    if (currentIndex >= 0 && currentIndex + 1 < serviceRevisions.length) {
      return serviceRevisions[currentIndex + 1].metadata.name ?? '';
    }
    const previous = serviceRevisions.find(r => r.metadata.name !== targetRevName);
    return previous?.metadata.name ?? targetRevName;
  }, [serviceRevisions, targetRevName, initialBaseRevisionName]);

  const [baseRevName, setBaseRevName] = useState<string>(defaultBaseName);
  const [diffMode, setDiffMode] = useState<DiffMode>('specTemplate');

  const targetRevision = useMemo(
    () => serviceRevisions.find(r => r.metadata.name === targetRevName) ?? revision,
    [serviceRevisions, targetRevName, revision]
  );

  const baseRevision = useMemo(
    () => serviceRevisions.find(r => r.metadata.name === baseRevName) ?? null,
    [serviceRevisions, baseRevName]
  );

  // Extract objects for diff comparison
  const { originalContent, modifiedContent } = useMemo(() => {
    const extractContent = (rev: KRevision | null) => {
      if (!rev) return {};
      if (diffMode === 'specTemplate') {
        const rawSpec = rev.jsonData.spec as Record<string, any> | undefined;
        return rawSpec?.template ?? rev.spec ?? {};
      }
      if (diffMode === 'spec') {
        return rev.spec ?? {};
      }
      return rev.jsonData ?? {};
    };

    const baseData = extractContent(baseRevision);
    const targetData = extractContent(targetRevision);

    const original = jsYaml.dump(baseData, { noRefs: true, sortKeys: true });
    const modified = jsYaml.dump(targetData, { noRefs: true, sortKeys: true });

    return { originalContent: original, modifiedContent: modified };
  }, [baseRevision, targetRevision, diffMode]);

  // High level diff details
  const diffSummary = useMemo(() => {
    if (!baseRevision || !targetRevision) return null;

    const baseImage = baseRevision.primaryImage ?? '-';
    const targetImage = targetRevision.primaryImage ?? '-';
    const imageChanged = baseImage !== targetImage;

    const baseConcurrency = baseRevision.spec?.containerConcurrency ?? 'Default';
    const targetConcurrency = targetRevision.spec?.containerConcurrency ?? 'Default';
    const concurrencyChanged = baseConcurrency !== targetConcurrency;

    const baseTimeout = baseRevision.spec?.timeoutSeconds ?? 'Default';
    const targetTimeout = targetRevision.spec?.timeoutSeconds ?? 'Default';
    const timeoutChanged = baseTimeout !== targetTimeout;

    const envDiffs = getEnvDiff(
      baseRevision.containers[0]?.env,
      targetRevision.containers[0]?.env
    );
    const envChangedCount = envDiffs.filter(e => e.type !== 'unchanged').length;

    const baseLimits = baseRevision.containers[0]?.resources?.limits;
    const targetLimits = targetRevision.containers[0]?.resources?.limits;
    const limitsChanged = JSON.stringify(baseLimits) !== JSON.stringify(targetLimits);

    return {
      imageChanged,
      baseImage,
      targetImage,
      concurrencyChanged,
      baseConcurrency,
      targetConcurrency,
      timeoutChanged,
      baseTimeout,
      targetTimeout,
      envChangedCount,
      envDiffs,
      limitsChanged,
      baseLimits,
      targetLimits,
    };
  }, [baseRevision, targetRevision]);

  const isDarkTheme = theme.palette.mode === 'dark';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" PaperProps={{ sx: { height: '85vh' } }}>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Icon icon="mdi:compare" width={24} />
          <Typography variant="h6" component="span" fontWeight={600}>
            Compare Revisions - {revision.parentService ? `Service: ${revision.parentService}` : namespace}
          </Typography>
        </Stack>
        <IconButton aria-label="close" onClick={onClose} size="small">
          <Icon icon="mdi:close" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, overflow: 'hidden' }}>
        {serviceRevisions.length <= 1 && (
          <Alert severity="info" sx={{ py: 0.5 }}>
            Only 1 revision (<strong>{revision.metadata.name}</strong>) exists for service{' '}
            <strong>{revision.parentService || 'default'}</strong>. Update the Knative Service configuration to create a second revision (e.g. hello-00002) for side-by-side comparison.
          </Alert>
        )}
        {/* Revision Controls Header */}
        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel id="base-revision-select-label">Base Revision (Left)</InputLabel>
              <Select
                labelId="base-revision-select-label"
                value={baseRevName}
                label="Base Revision (Left)"
                onChange={e => setBaseRevName(e.target.value)}
              >
                {serviceRevisions.map(r => (
                  <MenuItem key={r.metadata.name} value={r.metadata.name}>
                    {r.metadata.name} {r.isReady ? ' (Ready)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
              ➔
            </Typography>

            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel id="target-revision-select-label">Target Revision (Right)</InputLabel>
              <Select
                labelId="target-revision-select-label"
                value={targetRevName}
                label="Target Revision (Right)"
                onChange={e => setTargetRevName(e.target.value)}
              >
                {serviceRevisions.map(r => (
                  <MenuItem key={r.metadata.name} value={r.metadata.name}>
                    {r.metadata.name} {r.isReady ? ' (Ready)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Mode Selector */}
          <ToggleButtonGroup
            value={diffMode}
            exclusive
            onChange={(_, val) => val && setDiffMode(val)}
            size="small"
            color="primary"
          >
            <ToggleButton value="specTemplate">
              <Icon icon="mdi:code-json" style={{ marginRight: 6 }} />
              spec.template
            </ToggleButton>
            <ToggleButton value="spec">Full Spec</ToggleButton>
            <ToggleButton value="fullResource">Full Resource</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Quick Highlights / Summary Bar */}
        {diffSummary && (
          <Card variant="outlined" sx={{ backgroundColor: theme.palette.background.default }}>
            <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" gap={1}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  Key Changes:
                </Typography>

                {diffSummary.imageChanged ? (
                  <Chip
                    icon={<Icon icon="mdi:docker" />}
                    label={`Image: ${diffSummary.baseImage.split('@')[0]} ➔ ${diffSummary.targetImage.split('@')[0]}`}
                    color="warning"
                    size="small"
                    variant="filled"
                  />
                ) : (
                  <Chip label="Image: Unchanged" size="small" variant="outlined" />
                )}

                {diffSummary.concurrencyChanged ? (
                  <Chip
                    icon={<Icon icon="mdi:speedometer" />}
                    label={`Concurrency: ${diffSummary.baseConcurrency} ➔ ${diffSummary.targetConcurrency}`}
                    color="info"
                    size="small"
                    variant="filled"
                  />
                ) : (
                  <Chip label={`Concurrency: ${diffSummary.targetConcurrency}`} size="small" variant="outlined" />
                )}

                {diffSummary.timeoutChanged && (
                  <Chip
                    icon={<Icon icon="mdi:timer-outline" />}
                    label={`Timeout: ${diffSummary.baseTimeout}s ➔ ${diffSummary.targetTimeout}s`}
                    color="info"
                    size="small"
                    variant="filled"
                  />
                )}

                {diffSummary.envChangedCount > 0 ? (
                  <Chip
                    icon={<Icon icon="mdi:variable" />}
                    label={`Env Vars: ${diffSummary.envChangedCount} changed`}
                    color="secondary"
                    size="small"
                    variant="filled"
                  />
                ) : (
                  <Chip label="Env Vars: Unchanged" size="small" variant="outlined" />
                )}

                {diffSummary.limitsChanged && (
                  <Chip
                    icon={<Icon icon="mdi:memory" />}
                    label="Resource Limits Changed"
                    color="secondary"
                    size="small"
                    variant="filled"
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Monaco Diff Viewer Container */}
        <Box sx={{ flexGrow: 1, minHeight: 400, borderRadius: 1, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
          <DiffEditor
            original={originalContent}
            modified={modifiedContent}
            language="yaml"
            theme={isDarkTheme ? 'vs-dark' : 'light'}
            options={{
              readOnly: true,
              renderSideBySide: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              fontSize: 13,
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
