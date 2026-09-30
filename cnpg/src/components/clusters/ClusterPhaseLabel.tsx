/*
 * Copyright 2026 The Kubernetes Authors
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
import { LightTooltip, StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';
import { ClusterClass } from '../../resources/cluster';
import { getPhaseSeverity, PhaseSeverity } from '../../utils/clusterPhase';

const STATUS_BY_SEVERITY: Record<PhaseSeverity, 'success' | 'warning' | 'error' | ''> = {
  healthy: 'success',
  progressing: 'warning',
  failed: 'error',
  unknown: '',
};

/**
 * Renders a cluster's phase as a severity-coloured label, with the operator's
 * phase reason (when present) available on hover.
 */
export function ClusterPhaseLabel({ cluster }: { cluster: ClusterClass }) {
  const { t } = useTranslation();
  const phase = cluster.phase;
  const severity = getPhaseSeverity(phase);
  const label = phase ?? t('Unknown');
  const reason = cluster.status.phaseReason;

  const statusLabel = <StatusLabel status={STATUS_BY_SEVERITY[severity]}>{label}</StatusLabel>;

  if (!reason) {
    return statusLabel;
  }

  return (
    <LightTooltip title={reason}>
      <span>{statusLabel}</span>
    </LightTooltip>
  );
}
