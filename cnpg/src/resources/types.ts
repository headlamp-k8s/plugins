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

import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

/**
 * Type definitions for the CloudNativePG CRDs consumed by this plugin.
 *
 * Shapes are taken from the `postgresql.cnpg.io/v1` API as of CNPG 1.29 and
 * 1.30, which are API-identical for every field used here. Every field is
 * optional on purpose: the plugin must render partial status without throwing,
 * and older/newer operators may omit fields entirely.
 */

/** Standard `metav1.Condition`, as used in `Cluster.status.conditions`. */
export interface CnpgCondition {
  type?: string;
  status?: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
  observedGeneration?: number;
}

/**
 * `Cluster.status`.
 *
 * Note on backup fields: `lastSuccessfulBackup`, `firstRecoverabilityPoint`,
 * and their `*ByMethod` variants are documented upstream as
 * "Deprecated: the field is not set for backup plugins" in both 1.29 and 1.30.
 * Clusters backed up through the barman-cloud *plugin* leave them empty, so
 * they can never be treated as authoritative.
 */
export interface CnpgClusterStatus {
  phase?: string;
  phaseReason?: string;
  instances?: number;
  readyInstances?: number;
  instanceNames?: string[];
  /**
   * Health buckets keyed by label, e.g. `{ healthy: ['pg-1-1'] }`.
   *
   * The value is `string[] | undefined` rather than `string[]` because this is
   * unvalidated JSON from the API server, not a type the plugin controls: a null
   * or absent bucket arrives as undefined whatever the CRD schema promises. The
   * declared `string[]` made the `?? []` guards at every read site look dead,
   * which is exactly how they get removed.
   */
  instancesStatus?: Record<string, string[] | undefined>;
  instancesReportedState?: Record<
    string,
    { isPrimary?: boolean; timeLineID?: number; ip?: string }
  >;
  currentPrimary?: string;
  targetPrimary?: string;
  currentPrimaryTimestamp?: string;
  targetPrimaryTimestamp?: string;
  currentPrimaryFailingSinceTimestamp?: string;
  timelineID?: number;
  conditions?: CnpgCondition[];
  /** Deprecated upstream; unset for plugin-based backups. */
  lastSuccessfulBackup?: string;
  /** Deprecated upstream; unset for plugin-based backups. */
  lastSuccessfulBackupByMethod?: Record<string, string>;
  /** Deprecated upstream; unset for plugin-based backups. */
  lastFailedBackup?: string;
  /** Deprecated upstream; unset for plugin-based backups. */
  firstRecoverabilityPoint?: string;
  /** Deprecated upstream; unset for plugin-based backups. */
  firstRecoverabilityPointByMethod?: Record<string, string>;
  pluginStatus?: Array<{
    name?: string;
    version?: string;
    status?: string;
    backupCapabilities?: string[];
    walCapabilities?: string[];
  }>;
  writeService?: string;
  readService?: string;
  image?: string;
}

/** `Cluster.spec`, limited to the fields this plugin reads. */
export interface CnpgClusterSpec {
  instances?: number;
  imageName?: string;
  primaryUpdateStrategy?: string;
  backup?: {
    barmanObjectStore?: Record<string, unknown>;
    volumeSnapshot?: Record<string, unknown>;
    target?: string;
    retentionPolicy?: string;
  };
  plugins?: Array<{
    name?: string;
    enabled?: boolean;
    isWALArchiver?: boolean;
    parameters?: Record<string, string>;
  }>;
  externalClusters?: Array<Record<string, unknown>>;
}

/**
 * The structural shape the pure analysis helpers operate on.
 *
 * Deliberately weaker than the full Kubernetes object: helpers and the rules
 * engine must be callable with a bare `{ status: {...} }` fixture, and must
 * cope with any part of it being absent.
 */
export interface CnpgClusterLike {
  metadata?: {
    name?: string;
    namespace?: string;
    creationTimestamp?: string;
    uid?: string;
  };
  spec?: CnpgClusterSpec;
  status?: CnpgClusterStatus;
}

/**
 * A `postgresql.cnpg.io/v1` Cluster object as returned by the API server.
 *
 * Structurally assignable to CnpgClusterLike, so KubeObject-backed instances
 * can be passed straight to the pure helpers.
 */
export interface CnpgClusterJson extends KubeObjectInterface {
  spec?: CnpgClusterSpec;
  status?: CnpgClusterStatus;
}

/** Reference from a Backup or ScheduledBackup to the Cluster it belongs to. */
export interface CnpgClusterReference {
  name?: string;
}

/**
 * `Backup.status`.
 *
 * Unlike the backup fields on `Cluster.status`, nothing here is deprecated, so
 * Backup objects are the authoritative record of what has actually been backed
 * up — including for clusters that archive through the barman-cloud plugin.
 */
export interface CnpgBackupStatus {
  /** One of: pending, started, running, finalizing, completed, failed,
   * walArchivingFailing, "invalid backup definition". */
  phase?: string;
  method?: string;
  startedAt?: string;
  stoppedAt?: string;
  error?: string;
  backupId?: string;
  backupName?: string;
  online?: boolean;
  beginLSN?: string;
  endLSN?: string;
}

/** `Backup.spec`, limited to the fields this plugin reads. */
export interface CnpgBackupSpec {
  cluster?: CnpgClusterReference;
  method?: string;
  target?: string;
  online?: boolean;
}

/** Structural shape of a Backup, for the pure helpers and their fixtures. */
export interface CnpgBackupLike {
  metadata?: {
    name?: string;
    namespace?: string;
    creationTimestamp?: string;
    uid?: string;
  };
  spec?: CnpgBackupSpec;
  status?: CnpgBackupStatus;
}

/** A `postgresql.cnpg.io/v1` Backup as returned by the API server. */
export interface CnpgBackupJson extends KubeObjectInterface {
  spec?: CnpgBackupSpec;
  status?: CnpgBackupStatus;
}

/** `ScheduledBackup.spec`, limited to the fields this plugin reads. */
export interface CnpgScheduledBackupSpec {
  cluster?: CnpgClusterReference;
  /** Six-field cron expression, seconds first, in the operator's timezone. */
  schedule?: string;
  suspend?: boolean;
  immediate?: boolean;
  method?: string;
  target?: string;
}

/** `ScheduledBackup.status`. */
export interface CnpgScheduledBackupStatus {
  lastCheckTime?: string;
  lastScheduleTime?: string;
  nextScheduleTime?: string;
  error?: string;
}

/** Structural shape of a ScheduledBackup, for the pure helpers. */
export interface CnpgScheduledBackupLike {
  metadata?: {
    name?: string;
    namespace?: string;
    creationTimestamp?: string;
    uid?: string;
  };
  spec?: CnpgScheduledBackupSpec;
  status?: CnpgScheduledBackupStatus;
}

/** A `postgresql.cnpg.io/v1` ScheduledBackup as returned by the API server. */
export interface CnpgScheduledBackupJson extends KubeObjectInterface {
  spec?: CnpgScheduledBackupSpec;
  status?: CnpgScheduledBackupStatus;
}
