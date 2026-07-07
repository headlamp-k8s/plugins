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

import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Box, Tooltip, Typography } from '@mui/material';

type Severity = 'success' | 'warning' | 'error' | '';

/**
 * Maps each operator `OperationalStatus` value to a `StatusLabel` severity.
 * Unlisted or future values fall through to neutral so the cell still renders
 * rather than breaking on an unknown state.
 */
const OPERATIONAL_SEVERITY: Record<string, Severity> = {
  OK: 'success',
  error: 'error',
  delayed: 'warning',
  detached: 'warning',
  servicing: 'warning',
  discovered: '',
};

/** Composite status derived from a BareMetalHost's independent status axes. */
export interface ComposedStatus {
  /** Operational status: the operator's verdict and the headline signal. */
  operationalStatus: string;
  /** `StatusLabel` severity derived from the operational status. */
  severity: Severity;
  /** Provisioning state: where the host sits in its lifecycle. */
  provisioningState: string;
  /** Error type, when one exists; independent of the provisioning state. */
  errorType: string;
  /** Human-readable error detail, shown on hover. */
  errorMessage: string;
}

/**
 * Derives the composite status from a BareMetalHost's `jsonData`.
 *
 * A BareMetalHost has no single `status.phase`; its condition is spread across
 * independent axes (operational status, provisioning state, error type), so a
 * host can be provisioned and in error at the same time. Operational status is
 * the headline, provisioning state the secondary line, and the error type is
 * surfaced separately. Kept free of JSX so it can be unit-tested directly.
 *
 * @param jsonData - The host's raw object (its `jsonData`).
 * @returns The composed status used by the list and detail views.
 */
export function composeStatus(jsonData: any): ComposedStatus {
  const status = jsonData?.status ?? {};
  const operationalStatus = status.operationalStatus ?? '';
  return {
    operationalStatus,
    severity: OPERATIONAL_SEVERITY[operationalStatus] ?? '',
    provisioningState: status.provisioning?.state ?? '',
    errorType: status.errorType ?? '',
    errorMessage: status.errorMessage ?? '',
  };
}

/**
 * Renders the composite status for the list view: operational status as the
 * colored headline, provisioning state beneath it, and the error type as a
 * separate badge carrying the error message on hover.
 *
 * @param props.host - The BareMetalHost to render the status for.
 */
export function HostStatusLabel({ host }: { host: KubeObject }) {
  const { operationalStatus, severity, provisioningState, errorType, errorMessage } = composeStatus(
    host?.jsonData
  );

  return (
    <Box>
      <StatusLabel status={severity}>{operationalStatus || 'Unknown'}</StatusLabel>
      {provisioningState && (
        <Typography variant="caption" color="textSecondary" display="block">
          {provisioningState}
        </Typography>
      )}
      {errorType && (
        <Tooltip title={errorMessage || errorType}>
          <Box component="span" sx={{ display: 'inline-block', mt: 0.5 }}>
            <StatusLabel status="error">{errorType}</StatusLabel>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}
