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
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import React from 'react';
import { KService } from '../../../../../resources/knative';
import { useNotify } from '../../../../common/notifications/useNotify';
import { useKServiceEditMode } from '../../hooks/useKServiceEditMode';
import { useKServicePermissions } from '../../permissions/KServicePermissionsProvider';

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

export default function ScaleBoundsSection({
  kservice,
  defaults,
  cluster,
}: {
  kservice: KService;
  defaults: AutoscalingDefaults | null;
  cluster: string;
}) {
  const [saving, setSaving] = React.useState(false);
  const { canPatchKService, isLoading } = useKServicePermissions();
  const { isEditMode } = useKServiceEditMode();
  const isReadOnly = !isEditMode || canPatchKService !== true || isLoading;
  const anns = kservice.spec.template.metadata?.annotations ?? {};

  const [minScale, setMinScale] = React.useState<string>(
    anns['autoscaling.knative.dev/min-scale'] ?? ''
  );
  const [maxScale, setMaxScale] = React.useState<string>(
    anns['autoscaling.knative.dev/max-scale'] ?? ''
  );
  const [initialScale, setInitialScale] = React.useState<string>(
    anns['autoscaling.knative.dev/initial-scale'] ?? ''
  );
  const [activationScale, setActivationScale] = React.useState<string>(
    anns['autoscaling.knative.dev/activation-scale'] ?? ''
  );
  const [scaleDownDelay, setScaleDownDelay] = React.useState<string>(
    anns['autoscaling.knative.dev/scale-down-delay'] ?? ''
  );
  const [stableWindow, setStableWindow] = React.useState<string>(
    anns['autoscaling.knative.dev/window'] ?? ''
  );

  const { notifySuccess, notifyError } = useNotify();

  function resetSection() {
    const a = kservice.spec.template.metadata?.annotations ?? {};
    setMinScale(a['autoscaling.knative.dev/min-scale'] ?? '');
    setMaxScale(a['autoscaling.knative.dev/max-scale'] ?? '');
    setInitialScale(a['autoscaling.knative.dev/initial-scale'] ?? '');
    setActivationScale(a['autoscaling.knative.dev/activation-scale'] ?? '');
    setScaleDownDelay(a['autoscaling.knative.dev/scale-down-delay'] ?? '');
    setStableWindow(a['autoscaling.knative.dev/window'] ?? '');
  }

  function isValid(): boolean {
    const numericOrEmpty = (v: string, min?: number) =>
      v === '' || (!Number.isNaN(Number(v)) && Number(v) >= (min ?? 0));
    if (!numericOrEmpty(minScale, 0)) return false;
    if (!numericOrEmpty(maxScale, 0)) return false;
    if (!numericOrEmpty(initialScale, 0)) return false;
    if (!numericOrEmpty(activationScale, 1)) return false;
    const durationOk = (v: string) => v === '' || /^[0-9]+(ms|s|m|h)$/.test(v);
    if (!durationOk(scaleDownDelay)) return false;
    if (!durationOk(stableWindow)) return false;
    return true;
  }

  async function onSave() {
    if (!isValid() || !cluster) return;
    try {
      setSaving(true);
      const patchBody = KService.buildAutoscalingPatch({
        minScale: minScale === '' ? undefined : Number(minScale),
        maxScale: maxScale === '' ? undefined : Number(maxScale),
        initialScale: initialScale === '' ? undefined : Number(initialScale),
        activationScale: activationScale === '' ? undefined : Number(activationScale),
        scaleDownDelay: scaleDownDelay === '' ? undefined : scaleDownDelay,
        stableWindow: stableWindow === '' ? undefined : stableWindow,
      });

      if (patchBody) {
        await kservice.patch(patchBody);
      }

      notifySuccess('Scale bounds updated');
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

  const resolvedMinScale = defaults?.minScale;
  const resolvedMaxScale = defaults?.maxScale;
  const resolvedMaxScaleLimit = defaults?.maxScaleLimit;
  const resolvedInitialScale = defaults?.initialScale;
  const resolvedAllowZeroInitial = defaults?.allowZeroInitialScale;
  const resolvedScaleDownDelay = defaults?.scaleDownDelay;
  const resolvedStableWindow = defaults?.stableWindow;

  // Helper to keep the rows array clean
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
    <SectionBox title="Scale bounds & windows">
      <Stack spacing={2}>
        <NameValueTable
          rows={[
            {
              name: 'Min replicas (min-scale)',
              value: isReadOnly ? (
                renderReadonly(
                  minScale,
                  resolvedMinScale !== undefined ? `Default: ${resolvedMinScale}` : undefined
                )
              ) : (
                <TextField
                  size="small"
                  type="number"
                  value={minScale}
                  onChange={e => setMinScale(e.target.value)}
                  inputProps={{ min: 0, step: 1, inputMode: 'numeric' }}
                  helperText={
                    resolvedMinScale !== undefined ? `Default: ${resolvedMinScale}` : undefined
                  }
                  sx={{ maxWidth: 400 }}
                />
              ),
            },
            {
              name: 'Max replicas (max-scale)',
              value: isReadOnly ? (
                renderReadonly(
                  maxScale,
                  resolvedMaxScale !== undefined ? `Default: ${resolvedMaxScale}` : undefined
                )
              ) : (
                <TextField
                  size="small"
                  type="number"
                  value={maxScale}
                  onChange={e => setMaxScale(e.target.value)}
                  inputProps={{ min: 0, step: 1, inputMode: 'numeric' }}
                  helperText={
                    resolvedMaxScale !== undefined
                      ? resolvedMaxScaleLimit && resolvedMaxScaleLimit > 0
                        ? `Default: ${resolvedMaxScale} (cluster limit: ${resolvedMaxScaleLimit})${
                            resolvedMaxScale === 0 ? ' — 0 = unlimited' : ''
                          }`
                        : `Default: ${resolvedMaxScale}${
                            resolvedMaxScale === 0 ? ' — 0 = unlimited' : ''
                          }`
                      : resolvedMaxScaleLimit && resolvedMaxScaleLimit > 0
                      ? `Cluster limit: ${resolvedMaxScaleLimit}`
                      : undefined
                  }
                />
              ),
            },
            {
              name: 'Initial scale',
              value: isReadOnly ? (
                renderReadonly(
                  initialScale,
                  resolvedInitialScale !== undefined
                    ? `Default: ${resolvedInitialScale}`
                    : undefined
                )
              ) : (
                <TextField
                  size="small"
                  type="number"
                  value={initialScale}
                  onChange={e => setInitialScale(e.target.value)}
                  inputProps={{ min: 0, step: 1, inputMode: 'numeric' }}
                  helperText={
                    resolvedInitialScale !== undefined
                      ? resolvedAllowZeroInitial
                        ? `Default: ${resolvedInitialScale} (zero allowed)`
                        : `Default: ${resolvedInitialScale}`
                      : undefined
                  }
                />
              ),
            },
            {
              name: 'Activation scale',
              value: isReadOnly ? (
                renderReadonly(
                  activationScale,
                  defaults?.activationScaleDefault !== undefined
                    ? `Default: ${defaults?.activationScaleDefault}`
                    : undefined
                )
              ) : (
                <TextField
                  size="small"
                  type="number"
                  value={activationScale}
                  onChange={e => setActivationScale(e.target.value)}
                  inputProps={{ min: 1, step: 1, inputMode: 'numeric' }}
                  helperText={
                    defaults?.activationScaleDefault !== undefined
                      ? `Default: ${defaults?.activationScaleDefault}`
                      : undefined
                  }
                />
              ),
            },
            {
              name: 'Stable window',
              value: isReadOnly ? (
                renderReadonly(
                  stableWindow,
                  resolvedStableWindow ? `Default: ${resolvedStableWindow}` : undefined
                )
              ) : (
                <TextField
                  size="small"
                  placeholder="e.g., 60s"
                  value={stableWindow}
                  onChange={e => setStableWindow(e.target.value)}
                  helperText={`Default: ${resolvedStableWindow ?? '60s'} (6s to 1h)`}
                />
              ),
            },
            {
              name: 'Scale down delay',
              value: isReadOnly ? (
                renderReadonly(
                  scaleDownDelay,
                  resolvedScaleDownDelay ? `Default: ${resolvedScaleDownDelay}` : undefined
                )
              ) : (
                <TextField
                  size="small"
                  placeholder="e.g., 15m"
                  value={scaleDownDelay}
                  onChange={e => setScaleDownDelay(e.target.value)}
                  helperText={`Default: ${resolvedScaleDownDelay ?? '0s'} (0s to 1h)`}
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
              <Button variant="text" onClick={resetSection} aria-label="Reset (scale bounds)">
                Reset
              </Button>
              <Button
                variant="contained"
                onClick={onSave}
                disabled={!isValid() || saving}
                aria-label="Save autoscaling (scale bounds)"
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
