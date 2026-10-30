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

import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { CNPG_GROUP, CNPG_VERSION } from './cluster';
import {
  CnpgBackupJson,
  CnpgBackupSpec,
  CnpgBackupStatus,
  CnpgScheduledBackupJson,
  CnpgScheduledBackupSpec,
  CnpgScheduledBackupStatus,
} from './types';

/**
 * Headlamp resource class for the CloudNativePG Backup CRD.
 *
 * Backup objects are the authoritative record of what has been backed up; the
 * equivalent fields on Cluster.status are deprecated upstream and are never set
 * for plugin-based backups.
 */
export class BackupClass extends KubeObject<CnpgBackupJson> {
  static apiVersion = `${CNPG_GROUP}/${CNPG_VERSION}`;
  static kind = 'Backup';
  static apiName = 'backups';
  static isNamespaced = true;

  get spec(): CnpgBackupSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): CnpgBackupStatus {
    return this.jsonData.status ?? {};
  }
}

/** Headlamp resource class for the CloudNativePG ScheduledBackup CRD. */
export class ScheduledBackupClass extends KubeObject<CnpgScheduledBackupJson> {
  static apiVersion = `${CNPG_GROUP}/${CNPG_VERSION}`;
  static kind = 'ScheduledBackup';
  static apiName = 'scheduledbackups';
  static isNamespaced = true;

  get spec(): CnpgScheduledBackupSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): CnpgScheduledBackupStatus {
    return this.jsonData.status ?? {};
  }
}
