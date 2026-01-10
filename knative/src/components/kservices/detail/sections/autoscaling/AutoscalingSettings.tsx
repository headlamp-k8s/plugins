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

import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { KService } from '../../../../../resources/knative';
import { useNotify } from '../../../../common/notifications/useNotify';
import { useKServicePermissions } from '../../permissions/KServicePermissionsProvider';

type MetricType = '' | 'concurrency' | 'rps';

type AutoscalingDefaults = {
  concurrencyTarget: number;
  targetUtilizationPercentage: number;
  rpsTarget: number;
  containerConcurrency: number;
  minScale: number;
  maxScale: number;
  maxScaleLimit?: number;
  initialScale: number;
  allowZeroInitialScale: boolean;
  scaleDownDelay: string;
  stableWindow: string;
  activationScaleDefault: number;
};

type AutoscalingSettingsProps = {
  cluster: string;
  kservice: KService;
  defaults: AutoscalingDefaults | null;
};

export default function AutoscalingSettings({
  cluster,
  kservice,
  defaults,
}: AutoscalingSettingsProps) {
  const [saving, setSaving] = React.useState(false);
  const { canPatchKService, isLoading } = useKServicePermissions();
  const isReadOnly = canPatchKService !== true || isLoading;
  const anns = kservice.spec.template?.metadata?.annotations ?? {};
  const templateSpec = kservice.spec.template?.spec;

  const [metric, setMetric] = React.useState<MetricType>(
    (anns['autoscaling.knative.dev/metric'] as MetricType) || ''
  );
  const [target, setTarget] = React.useState<string>(anns['autoscaling.knative.dev/target'] ?? '');
  const [util, setUtil] = React.useState<string>(
    anns['autoscaling.knative.dev/target-utilization-percentage'] ?? ''
  );
  const [hard, setHard] = React.useState<string>(
    typeof templateSpec?.containerConcurrency === 'number'
      ? String(templateSpec.containerConcurrency)
      : ''
  );

  const { notifySuccess, notifyError } = useNotify();

  function resetSection() {
    const a = kservice.spec.template?.metadata?.annotations ?? {};
    setMetric((a['autoscaling.knative.dev/metric'] as MetricType) || '');
    setTarget(a['autoscaling.knative.dev/target'] || '');
    setUtil(a['autoscaling.knative.dev/target-utilization-percentage'] || '');
    setHard(
      typeof templateSpec?.containerConcurrency === 'number'
        ? String(templateSpec.containerConcurrency)
        : ''
    );
  }

  function isValid(): boolean {
    // hard limit: integer >= 0 or empty
    if (hard !== '') {
      const n = Number(hard);
      if (!Number.isInteger(n) || n < 0) return false;
    }
    // metric+target consistency
    if (metric) {
      if (target === '') return false;
      const t = Number(target);
      if (!Number.isFinite(t) || t <= 0) return false;
    } else {
      // when metric is unset, target should be empty (we allow user to clear)
    }
    // utilization: 1-100 float, or empty
    if (util !== '') {
      const u = Number(util);
      if (!Number.isFinite(u) || u <= 0 || u > 100) return false;
    }
    return true;
  }

  async function onSave() {
    if (!isValid() || !cluster) return;
    try {
      setSaving(true);
      const metricToSave = metric ? (metric as 'concurrency' | 'rps') : undefined;
      const patchBody = KService.buildAutoscalingPatch({
        metric: metricToSave,
        target: target === '' ? undefined : Number(target),
        targetUtilization: util === '' ? undefined : Number(util),
        containerConcurrency: hard === '' ? undefined : Number(hard),
      });

      if (patchBody) {
        await kservice.patch(patchBody);
      }

      notifySuccess('Autoscaling updated');
    } catch (err: unknown) {
      const error = err as { message?: string } | undefined;
      const detail = error?.message?.trim();
      notifyError(detail ? `Failed to update settings: ${detail}` : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  }

  const effectiveMetric = metric || 'concurrency';
  const resolvedDefaultTarget =
    effectiveMetric === 'rps' ? defaults?.rpsTarget : defaults?.concurrencyTarget;
  const resolvedDefaultUtil = defaults?.targetUtilizationPercentage;
  const resolvedDefaultHard = defaults?.containerConcurrency;

  return (
    <SectionBox title="Autoscaling metrics & concurrency">
      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel id="metric-label">Metric</InputLabel>
            <Select
              size="small"
              labelId="metric-label"
              label="Metric"
              value={metric}
              onChange={(e: SelectChangeEvent<string>) =>
                setMetric((e.target.value as MetricType) || '')
              }
              disabled={isReadOnly}
            >
              <MenuItem value="">
                <em>
                  Unset
                  {resolvedDefaultTarget !== null
                    ? ` (default target: ${resolvedDefaultTarget})`
                    : ' (use cluster default)'}
                </em>
              </MenuItem>
              <MenuItem value="concurrency">Concurrency</MenuItem>
              <MenuItem value="rps">RPS</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            type="number"
            label={effectiveMetric === 'rps' ? 'RPS target' : 'Concurrency target'}
            value={target}
            onChange={e => setTarget(e.target.value)}
            inputProps={{ min: 1, step: 1, inputMode: 'numeric' }}
            helperText={
              metric
                ? resolvedDefaultTarget !== null
                  ? `Per-revision soft limit target (default: ${resolvedDefaultTarget})`
                  : 'Per-revision soft limit target'
                : resolvedDefaultTarget !== null
                ? `Disabled when Metric is unset (default: ${resolvedDefaultTarget})`
                : 'Disabled when Metric is unset'
            }
            disabled={!metric || isReadOnly}
          />

          <TextField
            size="small"
            type="number"
            label="Target utilization %"
            value={util}
            onChange={e => setUtil(e.target.value)}
            inputProps={{ min: 1, max: 100, step: 1, inputMode: 'numeric' }}
            helperText={
              resolvedDefaultUtil !== null
                ? `Optional (default: ${resolvedDefaultUtil}%)`
                : 'Optional'
            }
            disabled={isReadOnly}
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            size="small"
            type="number"
            label="Hard limit (containerConcurrency)"
            value={hard}
            onChange={e => setHard(e.target.value)}
            inputProps={{ min: 0, step: 1, inputMode: 'numeric' }}
            helperText={
              resolvedDefaultHard !== null
                ? `0 = no limit (default: ${resolvedDefaultHard})`
                : '0 = no limit. Enforced upper bound per replica.'
            }
            disabled={isReadOnly}
          />
        </Stack>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color={isValid() ? 'text.secondary' : 'error'}>
            {isValid() ? 'All inputs valid' : 'Fix invalid inputs'}
          </Typography>
          <Box display="flex" gap={1}>
            {!isReadOnly && (
              <Button variant="text" onClick={resetSection} aria-label="Reset autoscaling">
                Reset
              </Button>
            )}
            {!isReadOnly && (
              <Button
                variant="contained"
                onClick={onSave}
                disabled={!isValid() || saving}
                aria-label="Save autoscaling"
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            )}
          </Box>
        </Box>
      </Stack>
    </SectionBox>
  );
}
