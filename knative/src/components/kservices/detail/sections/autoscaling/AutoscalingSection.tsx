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

import ConfigMap from '@kinvolk/headlamp-plugin/lib/k8s/configMap';
import { Stack } from '@mui/material';
import React from 'react';
import { KService } from '../../../../../resources/knative';
import { isNullable } from '../../../../../utils/nullable';
import AutoscalingSettings from './AutoscalingSettings';
import ScaleBoundsSection from './ScaleBoundsSection';

type KServiceSectionProps = {
  kservice: KService;
};

export function AutoscalingSection({ kservice }: KServiceSectionProps) {
  const { cluster } = kservice;

  const { data: autoscalerConfig } = ConfigMap.useGet('config-autoscaler', 'knative-serving', {
    cluster,
  });
  const { data: defaultsConfig } = ConfigMap.useGet('config-defaults', 'knative-serving', {
    cluster,
  });

  const autoDefaults = React.useMemo(() => {
    if (!autoscalerConfig && !defaultsConfig) {
      return null;
    }

    const DOC_DEFAULTS = {
      concurrencyTarget: 100,
      targetUtilizationPercentage: 70,
      rpsTarget: 200,
      containerConcurrency: 0,
      minScale: 0,
      maxScale: 0,
      initialScale: 1,
      scaleDownDelay: '0s',
      stableWindow: '60s',
      activationScaleDefault: 1,
    };

    const a = autoscalerConfig?.data ?? {};
    const d = defaultsConfig?.data ?? {};

    const parseNumberOrUndefined = (value?: string): number | undefined => {
      if (isNullable(value) || value === '') {
        return undefined;
      }
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    };

    const toNum = (value: string | undefined, fallback: number): number => {
      const parsed = parseNumberOrUndefined(value);
      return parsed ?? fallback;
    };

    return {
      concurrencyTarget: toNum(
        a['container-concurrency-target-default'],
        DOC_DEFAULTS.concurrencyTarget
      ),
      targetUtilizationPercentage: toNum(
        a['container-concurrency-target-percentage'],
        DOC_DEFAULTS.targetUtilizationPercentage
      ),
      rpsTarget: toNum(a['requests-per-second-target-default'], DOC_DEFAULTS.rpsTarget),
      containerConcurrency: toNum(d['container-concurrency'], DOC_DEFAULTS.containerConcurrency),
      minScale: toNum(a['min-scale'], DOC_DEFAULTS.minScale),
      maxScale: toNum(a['max-scale'], DOC_DEFAULTS.maxScale),
      maxScaleLimit: parseNumberOrUndefined(a['max-scale-limit']),
      initialScale: toNum(a['initial-scale'], DOC_DEFAULTS.initialScale),
      allowZeroInitialScale: String(a['allow-zero-initial-scale'] || '').toLowerCase() === 'true',
      scaleDownDelay: a['scale-down-delay'] || DOC_DEFAULTS.scaleDownDelay,
      stableWindow: a['stable-window'] || DOC_DEFAULTS.stableWindow,
      activationScaleDefault: DOC_DEFAULTS.activationScaleDefault,
    };
  }, [autoscalerConfig, defaultsConfig]);

  return (
    <Stack spacing={2}>
      <AutoscalingSettings cluster={cluster} kservice={kservice} defaults={autoDefaults} />
      <ScaleBoundsSection kservice={kservice} defaults={autoDefaults} cluster={cluster} />
    </Stack>
  );
}
