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

import { CnpgClusterLike } from '../resources/types';

/** Ready/desired instance counts, with `null` standing for "not reported". */
export interface InstancesReady {
  ready: number | null;
  desired: number | null;
}

/**
 * Returns the cluster's reported phase, or null when the operator has not set
 * one yet (for example, immediately after the Cluster is created).
 */
export function getClusterPhase(cluster: CnpgClusterLike | undefined): string | null {
  return cluster?.status?.phase || null;
}

/**
 * Returns how many instances are ready out of how many are wanted.
 *
 * `status.instances` is the operator's own count of detected instances;
 * `spec.instances` is the declared target and is used when status is not
 * populated yet. Either side may be missing, and missing is reported as null
 * rather than guessed at.
 */
export function getInstancesReady(cluster: CnpgClusterLike | undefined): InstancesReady {
  const status = cluster?.status;
  const ready = typeof status?.readyInstances === 'number' ? status.readyInstances : null;
  const desired =
    typeof status?.instances === 'number'
      ? status.instances
      : typeof cluster?.spec?.instances === 'number'
      ? cluster.spec.instances
      : null;

  return { ready, desired };
}

/** Renders instance readiness for display, e.g. `2/3`, `?/3`, or `—`. */
export function formatInstancesReady({ ready, desired }: InstancesReady): string {
  if (ready === null && desired === null) {
    return '—';
  }

  return `${ready ?? '?'}/${desired ?? '?'}`;
}

/**
 * Returns the instance currently acting as primary, or null when no primary
 * has been elected (a bootstrapping or fully down cluster).
 */
export function getCurrentPrimary(cluster: CnpgClusterLike | undefined): string | null {
  return cluster?.status?.currentPrimary || null;
}

/**
 * Returns the most recent successful backup timestamp reported *on the Cluster
 * object*, or null when none is reported.
 *
 * Upstream marks these fields "Deprecated: the field is not set for backup
 * plugins", so null here means "the Cluster does not say", not "no backup
 * exists" — a cluster backed up via the barman-cloud plugin always returns
 * null. Callers that need a real answer must consult Backup objects.
 */
export function getLastSuccessfulBackup(cluster: CnpgClusterLike | undefined): string | null {
  const status = cluster?.status;
  if (status?.lastSuccessfulBackup) {
    return status.lastSuccessfulBackup;
  }

  const byMethod = Object.values(status?.lastSuccessfulBackupByMethod ?? {}).filter(Boolean);
  if (byMethod.length === 0) {
    return null;
  }

  return byMethod.reduce((latest, current) => (current > latest ? current : latest));
}
