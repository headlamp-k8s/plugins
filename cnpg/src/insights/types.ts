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
import { BackupRecord, ScheduledBackupRecord } from '../utils/backupFacts';

/**
 * The insights seam.
 *
 * Findings are produced by providers and rendered by the UI without the UI
 * knowing which provider produced them. Phase 1 registers exactly one real
 * provider — the deterministic rules engine — but the contract is fixed here
 * so a metrics provider, or a provider backed by an out-of-cluster diagnosis
 * service, can be added later without touching the panel.
 */

export type Severity = 'critical' | 'warning' | 'info' | 'unknown';

/**
 * Severity ordering for display. Findings the plugin could not evaluate sort
 * below real findings but above informational ones, because an unevaluated
 * check is a gap in the answer rather than a reassurance.
 */
export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  unknown: 2,
  info: 3,
};

export interface Finding {
  /** Stable identifier for the check that produced this finding. */
  id: string;
  severity: Severity;
  /** One-line headline, phrased as the answer to a day-2 question. */
  message: string;
  /** The facts the finding rests on, so a reader can check the reasoning. */
  evidence: string[];
  /** Name of the provider that produced it. Set by the registry, not by rules. */
  source: string;
}

/**
 * Everything a provider is given about one cluster.
 *
 * `now` is passed in rather than read from the clock so that every rule is a
 * pure function of its input and time-dependent rules are testable.
 */
export interface InsightsContext {
  cluster: CnpgClusterLike;
  backups: BackupRecord[];
  scheduledBackups: ScheduledBackupRecord[];
  now: number;
}

export interface InsightsProvider {
  /** Stamped onto every finding this provider returns. */
  name: string;
  /**
   * May return synchronously or asynchronously. The rules engine is pure and
   * synchronous; a future provider that has to make a network call returns a
   * promise, and the registry handles both.
   */
  getFindings(context: InsightsContext): Finding[] | Promise<Finding[]>;
}
