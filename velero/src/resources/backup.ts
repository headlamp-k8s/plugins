import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface BackupSpec {
  storageLocation: string;
  ttl?: string;
  includedNamespaces?: string[];
  excludedNamespaces?: string[];
}

export interface BackupStatus {
  phase?: string;
  completionTimestamp?: string;
  expiration?: string;
  version?: string;
}

export interface BackupKubeObject extends KubeObjectInterface {
  spec: BackupSpec;
  status: BackupStatus;
}

export class Backup extends KubeObject {
  static kind = 'Backup';
  static apiName = 'backups';
  static apiVersion = 'velero.io/v1';
  static isNamespaced = true;

  constructor(json: BackupKubeObject) {
    super(json);
  }

  get spec(): BackupSpec {
    return (this.jsonData as BackupKubeObject).spec || ({} as BackupSpec);
  }

  get status(): BackupStatus {
    return (this.jsonData as BackupKubeObject).status || ({} as BackupStatus);
  }

  get phase(): string {
    return this.status.phase || 'Unknown';
  }

  get storageLocation(): string {
    return this.spec.storageLocation || '';
  }

  get completionTimestamp(): string {
    return this.status.completionTimestamp || '';
  }

  get expiration(): string {
    return this.status.expiration || '';
  }
}
