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

/**
 * Cluster phase strings, copied verbatim from the CloudNativePG API package
 * (api/v1/cluster_types.go). Identical in 1.29 and 1.30.
 */
export const PHASE_HEALTHY = 'Cluster in healthy state';

/** Phases that require a human before the cluster can make progress. */
const FAILED_PHASES = new Set([
  'Cluster is unrecoverable and needs manual intervention',
  'Invalid cluster definition',
  'Waiting for user action',
  'Unable to create required cluster objects',
  'Cluster has incomplete or invalid image catalog',
  'Cluster cannot proceed to reconciliation due to an unknown plugin being required',
  'Cluster cannot proceed to reconciliation due to an error while interacting with plugins',
  'Cluster cannot execute instance online upgrade due to missing architecture binary',
]);

/** Phases where the operator is actively working and will likely converge. */
const PROGRESSING_PHASES = new Set([
  'Switchover in progress',
  'Failing over',
  'Setting up primary',
  'Creating a new replica',
  'Upgrading cluster',
  'Upgrading Postgres major version',
  'Cluster upgrade delayed',
  'Primary instance is being restarted in-place',
  'Primary instance is being restarted without a switchover',
  'Waiting for the instances to become active',
  'Online upgrade in progress',
  'Applying configuration',
  'Promoting to primary cluster',
]);

export type PhaseSeverity = 'healthy' | 'progressing' | 'failed' | 'unknown';

/**
 * Classifies a cluster phase string into a severity for display.
 *
 * Phases this build does not recognise are reported as `unknown` rather than
 * assumed healthy: a newer operator can add phases, and silently rendering an
 * unrecognised phase as green would hide exactly the problems this plugin
 * exists to surface.
 */
export function getPhaseSeverity(phase: string | null | undefined): PhaseSeverity {
  if (!phase) {
    return 'unknown';
  }

  if (phase === PHASE_HEALTHY) {
    return 'healthy';
  }

  if (FAILED_PHASES.has(phase)) {
    return 'failed';
  }

  if (PROGRESSING_PHASES.has(phase)) {
    return 'progressing';
  }

  return 'unknown';
}
