import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export enum KedaTriggerMetricType {
  AVERAGEVALUE = 'AverageValue',
  VALUE = 'Value',
  UTILIZATION = 'Utilization',
}

export interface KedaTrigger {
  name?: string;
  type: string;
  metadata: {
    [key: string]: string;
  };
  authenticationRef?: {
    name: string;
    kind?: string;
  };
  useCachedMetrics?: boolean;
  metricType?: KedaTriggerMetricType;
}

export interface KedaAuthenticationSpec {
  podIdentity?: {
    provider: string;
    identityId: string;
    roleArn: string;
    identityOwner: string;
  };
  secretTargetRef?: Array<{
    parameter: string;
    name: string;
    key: string;
  }>;
  env?: Array<{
    parameter: string;
    name: string;
    containerName?: string;
  }>;
  hashiCorpVault?: {
    address?: string;
    [key: string]: any;
  };
  azureKeyVault?: {
    vaultUri?: string;
    [key: string]: any;
  };
  // Generic catch-all for all the various auth providers
  [key: string]: any;
}

export interface KedaAuthenticationStatus {
  scaledobjects?: string | string[];
  scaledjobs?: string | string[];
}

export class BaseKedaAuthentication extends KubeObject<KubeObjectInterface> {
  get spec(): KedaAuthenticationSpec {
    return (this.jsonData.spec as KedaAuthenticationSpec) ?? {};
  }

  get status(): KedaAuthenticationStatus {
    return (this.jsonData.status as KedaAuthenticationStatus) ?? {};
  }

  get podIdentity() {
    return this.spec.podIdentity?.provider ?? '';
  }

  get secretName() {
    return this.spec.secretTargetRef?.[0]?.name ?? '';
  }

  get envName() {
    return this.spec.env?.[0]?.name ?? '';
  }

  get vaultAddress() {
    return this.spec.hashiCorpVault?.address ?? this.spec.azureKeyVault?.vaultUri ?? '';
  }

  get scaledobjects(): string[] {
    const objs = this.status.scaledobjects;
    if (!objs) return [];
    return Array.isArray(objs) ? objs : [objs];
  }

  get scaledjobs(): string[] {
    const jobs = this.status.scaledjobs;
    if (!jobs) return [];
    return Array.isArray(jobs) ? jobs : [jobs];
  }
}
