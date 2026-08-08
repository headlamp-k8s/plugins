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

/**
 * Represents the fallback scale bound constraints utilized when explicit values are left blank by the user.
 *
 * @property {number} [minScale] - The default minimum replica count threshold.
 * @property {number} [maxScale] - The default maximum replica count threshold.
 * @property {number} [maxScaleLimit] - The absolute cluster-enforced ceiling for the maximum replica count.
 * @property {number} [initialScale] - The default initial replica count provisioned upon creation.
 * @property {boolean} [allowZeroInitialScale] - Indicates whether an initial scale of zero is permitted by the cluster.
 * @property {string} [stableWindow] - The default duration over which metrics are averaged to make scaling decisions.
 * @property {string} [scaleDownDelay] - The default duration a revision must wait at zero concurrency before scaling down.
 * @property {number} [activationScaleDefault] - The default minimum replica count to scale up to from zero when a request arrives.
 */
export interface ScaleBoundsDefaultsData {
  minScale?: number;
  maxScale?: number;
  maxScaleLimit?: number;
  initialScale?: number;
  allowZeroInitialScale?: boolean;
  stableWindow?: string;
  scaleDownDelay?: string;
  activationScaleDefault?: number;
}

/**
 * Defines the properties injected into the stateless presentation layer of the scaling boundaries interface.
 *
 * @property {string} minScale - The explicitly configured minimum replica count threshold.
 * @property {string} maxScale - The explicitly configured maximum replica count threshold.
 * @property {string} initialScale - The explicitly configured initial replica count provisioned upon creation.
 * @property {string} activationScale - The explicitly configured minimum replica count to scale up to from zero.
 * @property {string} stableWindow - The explicitly configured duration over which metrics are averaged.
 * @property {string} scaleDownDelay - The explicitly configured duration a revision must wait at zero concurrency before scaling down.
 * @property {boolean} isReadOnly - Disables interactive fields within the section when the environment forbids modifications.
 * @property {ScaleBoundsDefaultsData | undefined} defaults - A collection of fallback constraints utilized when explicit values are left blank by the user.
 */
export interface PureScaleBoundsSectionProps {
  minScale: string;
  maxScale: string;
  initialScale: string;
  activationScale: string;
  stableWindow: string;
  scaleDownDelay: string;
  isReadOnly: boolean;
  defaults?: ScaleBoundsDefaultsData;
}

export default function ScaleBoundsSection({
  kservice,
  defaults,
  cluster,
}: {
  kservice: KService;
  defaults: AutoscalingDefaults | null;
  cluster: string;
}) {
  const { t } = useTranslation();
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

      notifySuccess(t('Scale bounds updated'));
    } catch (err: unknown) {
      const error = err as { message?: string } | undefined;
      const detail = error?.message?.trim();
      notifyError(
        detail
          ? t('Failed to update settings: {{ detail }}', { detail })
          : t('Failed to update settings')
      );
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
          {fallbackInfo ? t('Not set ({{ info }})', { info: fallbackInfo }) : t('Not set')}
        </Typography>
      )}
    </Typography>
  );

  return (
    <SectionBox title={t('Scale bounds & windows')}>
      <Stack spacing={2}>
        <NameValueTable
          rows={[
            {
              name: t('Min replicas (min-scale)'),
              value: isReadOnly ? (
                renderReadonly(
                  minScale,
                  resolvedMinScale !== undefined
                    ? t('Default: {{ value }}', { value: resolvedMinScale })
                    : undefined
                )
              ) : (
                <TextField
                  size="small"
                  type="number"
                  value={minScale}
                  onChange={e => setMinScale(e.target.value)}
                  inputProps={{ min: 0, step: 1, inputMode: 'numeric' }}
                  helperText={
                    resolvedMinScale !== undefined
                      ? t('Default: {{ value }}', { value: resolvedMinScale })
                      : undefined
                  }
                  sx={{ maxWidth: 400 }}
                />
              ),
            },
            {
              name: t('Max replicas (max-scale)'),
              value: isReadOnly ? (
                renderReadonly(
                  maxScale,
                  resolvedMaxScale !== undefined
                    ? t('Default: {{ value }}', { value: resolvedMaxScale })
                    : undefined
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
                        ? resolvedMaxScale === 0
                          ? t('Default: {{ value }} (cluster limit: {{ limit }}) — 0 = unlimited', {
                              value: resolvedMaxScale,
                              limit: resolvedMaxScaleLimit,
                            })
                          : t('Default: {{ value }} (cluster limit: {{ limit }})', {
                              value: resolvedMaxScale,
                              limit: resolvedMaxScaleLimit,
                            })
                        : resolvedMaxScale === 0
                        ? t('Default: {{ value }} — 0 = unlimited', { value: resolvedMaxScale })
                        : t('Default: {{ value }}', { value: resolvedMaxScale })
                      : resolvedMaxScaleLimit && resolvedMaxScaleLimit > 0
                      ? t('Cluster limit: {{ limit }}', { limit: resolvedMaxScaleLimit })
                      : undefined
                  }
                />
              ),
            },
            {
              name: t('Initial scale'),
              value: isReadOnly ? (
                renderReadonly(
                  initialScale,
                  resolvedInitialScale !== undefined
                    ? t('Default: {{ value }}', { value: resolvedInitialScale })
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
                        ? t('Default: {{ value }} (zero allowed)', { value: resolvedInitialScale })
                        : t('Default: {{ value }}', { value: resolvedInitialScale })
                      : undefined
                  }
                />
              ),
            },
            {
              name: t('Activation scale'),
              value: isReadOnly ? (
                renderReadonly(
                  activationScale,
                  defaults?.activationScaleDefault !== undefined
                    ? t('Default: {{ value }}', { value: defaults?.activationScaleDefault })
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
                      ? t('Default: {{ value }}', { value: defaults?.activationScaleDefault })
                      : undefined
                  }
                />
              ),
            },
            {
              name: t('Stable window'),
              value: isReadOnly ? (
                renderReadonly(
                  stableWindow,
                  resolvedStableWindow
                    ? t('Default: {{ value }}', { value: resolvedStableWindow })
                    : undefined
                )
              ) : (
                <TextField
                  size="small"
                  placeholder={t('e.g., 60s')}
                  value={stableWindow}
                  onChange={e => setStableWindow(e.target.value)}
                  helperText={t('Default: {{ value }} (6s to 1h)', {
                    value: resolvedStableWindow ?? '60s',
                  })}
                />
              ),
            },
            {
              name: t('Scale down delay'),
              value: isReadOnly ? (
                renderReadonly(
                  scaleDownDelay,
                  resolvedScaleDownDelay
                    ? t('Default: {{ value }}', { value: resolvedScaleDownDelay })
                    : undefined
                )
              ) : (
                <TextField
                  size="small"
                  placeholder={t('e.g., 15m')}
                  value={scaleDownDelay}
                  onChange={e => setScaleDownDelay(e.target.value)}
                  helperText={t('Default: {{ value }} (0s to 1h)', {
                    value: resolvedScaleDownDelay ?? '0s',
                  })}
                />
              ),
            },
          ]}
        />

        {!isReadOnly && (
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color={isValid() ? 'text.secondary' : 'error'}>
              {isValid() ? t('All inputs valid') : t('Fix invalid inputs')}
            </Typography>
            <Box display="flex" gap={1}>
              <Button variant="text" onClick={resetSection} aria-label={t('Reset (scale bounds)')}>
                {t('Reset')}
              </Button>
              <Button
                variant="contained"
                onClick={onSave}
                disabled={!isValid() || saving}
                aria-label={t('Save autoscaling (scale bounds)')}
              >
                {saving ? t('Saving…') : t('Save')}
              </Button>
            </Box>
          </Box>
        )}
      </Stack>
    </SectionBox>
  );
}
