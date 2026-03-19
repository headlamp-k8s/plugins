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

import { NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
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
import { useKServiceEditMode } from '../../hooks/useKServiceEditMode';
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
  const { isEditMode } = useKServiceEditMode();
  const isReadOnly = !isEditMode || canPatchKService !== true || isLoading;
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
    if (hard !== '') {
      const n = Number(hard);
      if (!Number.isInteger(n) || n < 0) return false;
    }
    if (metric) {
      if (target === '') return false;
      const t = Number(target);
      if (!Number.isFinite(t) || t <= 0) return false;
    }
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

  React.useEffect(() => {
    if (!isEditMode) {
      resetSection();
    }
  }, [isEditMode]);

  const effectiveMetric = metric || 'concurrency';
  const resolvedDefaultTarget =
    effectiveMetric === 'rps' ? defaults?.rpsTarget : defaults?.concurrencyTarget;
  const resolvedDefaultUtil = defaults?.targetUtilizationPercentage;
  const resolvedDefaultHard = defaults?.containerConcurrency;

  const renderReadonly = (value: string, fallbackInfo?: string) => (
    <Typography variant="body2">
      {value !== '' ? (
        value
      ) : (
        <Typography component="span" color="text.secondary">
          Not set {fallbackInfo ? `(${fallbackInfo})` : ''}
        </Typography>
      )}
    </Typography>
  );

  return (
    <SectionBox title="Autoscaling metrics & concurrency">
      <Stack spacing={2}>
        <NameValueTable
          rows={[
            {
              name: 'Metric',
              value: isReadOnly ? (
                <Typography variant="body2">
                  {metric === 'concurrency' ? (
                    'Concurrency'
                  ) : metric === 'rps' ? (
                    'RPS'
                  ) : (
                    <Typography component="span" color="text.secondary">
                      Unset (cluster default)
                    </Typography>
                  )}
                </Typography>
              ) : (
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
                  >
                    <MenuItem value="">
                      <em>
                        Unset
                        {resolvedDefaultTarget !== undefined
                          ? ` (default target: ${resolvedDefaultTarget})`
                          : ' (use cluster default)'}
                      </em>
                    </MenuItem>
                    <MenuItem value="concurrency">Concurrency</MenuItem>
                    <MenuItem value="rps">RPS</MenuItem>
                  </Select>
                </FormControl>
              ),
            },
            {
              name: effectiveMetric === 'rps' ? 'RPS Target' : 'Concurrency Target',
              value: isReadOnly ? (
                renderReadonly(
                  target,
                  resolvedDefaultTarget !== undefined
                    ? `Default: ${resolvedDefaultTarget}`
                    : undefined
                )
              ) : (
                <TextField
                  size="small"
                  type="number"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  inputProps={{ min: 1, step: 1, inputMode: 'numeric' }}
                  helperText={
                    metric
                      ? resolvedDefaultTarget !== undefined
                        ? `Per-revision soft limit target (default: ${resolvedDefaultTarget})`
                        : 'Per-revision soft limit target'
                      : resolvedDefaultTarget !== undefined
                      ? `Disabled when Metric is unset (default: ${resolvedDefaultTarget})`
                      : 'Disabled when Metric is unset'
                  }
                  disabled={!metric}
                  sx={{ maxWidth: 400 }}
                />
              ),
            },
            {
              name: 'Target Utilization %',
              value: isReadOnly ? (
                renderReadonly(
                  util,
                  resolvedDefaultUtil !== undefined ? `Default: ${resolvedDefaultUtil}%` : undefined
                )
              ) : (
                <TextField
                  size="small"
                  type="number"
                  value={util}
                  onChange={e => setUtil(e.target.value)}
                  inputProps={{ min: 1, max: 100, step: 1, inputMode: 'numeric' }}
                  helperText={
                    resolvedDefaultUtil !== undefined
                      ? `Optional (default: ${resolvedDefaultUtil}%)`
                      : 'Optional'
                  }
                  sx={{ maxWidth: 400 }}
                />
              ),
            },
            {
              name: 'Hard limit (container concurrency)',
              value: isReadOnly ? (
                renderReadonly(
                  hard,
                  resolvedDefaultHard !== undefined ? `Default: ${resolvedDefaultHard}` : undefined
                )
              ) : (
                <TextField
                  size="small"
                  type="number"
                  value={hard}
                  onChange={e => setHard(e.target.value)}
                  inputProps={{ min: 0, step: 1, inputMode: 'numeric' }}
                  helperText={
                    resolvedDefaultHard !== undefined
                      ? `0 = no limit (default: ${resolvedDefaultHard})`
                      : '0 = no limit. Enforced upper bound per replica.'
                  }
                  sx={{ maxWidth: 400 }}
                />
              ),
            },
          ]}
        />

        {!isReadOnly && (
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color={isValid() ? 'text.secondary' : 'error'}>
              {isValid() ? 'All inputs valid' : 'Fix invalid inputs'}
            </Typography>
            <Box display="flex" gap={1}>
              <Button variant="text" onClick={resetSection} aria-label="Reset autoscaling">
                Reset
              </Button>
              <Button
                variant="contained"
                onClick={onSave}
                disabled={!isValid() || saving}
                aria-label="Save autoscaling"
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </Box>
          </Box>
        )}
      </Stack>
    </SectionBox>
  );
}
