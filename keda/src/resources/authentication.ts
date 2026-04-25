import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export enum PodIdentityProvider {
  NONE = 'none',
  AZURE_WORKLOAD = 'azure-workload',
  AWS = 'aws',
  AWS_EKS = 'aws-eks',
  GCP = 'gcp',
}

export interface AuthPodIdentity {
  provider: PodIdentityProvider | string;
  identityId?: string;
  identityTenantId?: string;
  identityAuthorityHost?: string;
  roleArn?: string;
  identityOwner?: string;
}

export interface AuthTargetRef {
  parameter: string;
  name: string;
  key: string;
}

export interface AuthEnvironment {
  parameter: string;
  name: string;
  containerName?: string;
}

export enum VaultAuthentication {
  TOKEN = 'token',
  KUBERNETES = 'kubernetes',
}

export enum VaultSecretType {
  GENERIC = '',
  SECRET_V2 = 'secretV2',
  SECRET = 'secret',
  PKI = 'pki',
}

export interface VaultPkiData {
  commonName?: string;
  altNames?: string;
  ipSans?: string;
  uriSans?: string;
  otherSans?: string;
  ttl?: string;
  format?: string;
}

export interface VaultSecret {
  parameter: string;
  path: string;
  key: string;
  type?: VaultSecretType;
  pkiData?: VaultPkiData;
}

export interface HashiCorpVault {
  address: string;
  authentication: VaultAuthentication;
  secrets: VaultSecret[];
  namespace?: string;
  credential?: {
    token?: string;
    serviceAccount?: string;
  };
  role?: string;
  mount?: string;
}

export interface AzureKeyVaultSecret {
  parameter: string;
  name: string;
  version?: string;
}

export interface SecretKeyRef {
  name: string;
  key: string;
}

export interface ValueFromSecret {
  secretKeyRef: SecretKeyRef;
}

export interface AzureKeyVaultClientSecret {
  valueFrom: ValueFromSecret;
}

export interface AzureKeyVaultCredentials {
  clientId: string;
  tenantId: string;
  clientSecret: AzureKeyVaultClientSecret;
}

export interface AzureKeyVaultCloudInfo {
  type: string;
  keyVaultResourceURL?: string;
  activeDirectoryEndpoint?: string;
}

export interface AzureKeyVault {
  vaultUri: string;
  secrets: AzureKeyVaultSecret[];
  credentials?: AzureKeyVaultCredentials;
  podIdentity?: AuthPodIdentity;
  cloud?: AzureKeyVaultCloudInfo;
}

export interface GCPSecretManagerSecret {
  parameter: string;
  id: string;
  version?: string;
}

export interface GCPSecretmanagerClientSecret {
  valueFrom: ValueFromSecret;
}

export interface GCPCredentials {
  clientSecret: GCPSecretmanagerClientSecret;
}

export interface GCPSecretManager {
  secrets: GCPSecretManagerSecret[];
  credentials?: GCPCredentials;
  podIdentity?: AuthPodIdentity;
}

export interface AwsSecretManagerSecret {
  parameter: string;
  name: string;
  versionId?: string;
  versionStage?: string;
  secretKey?: string;
}

export interface AwsSecretManagerValue {
  valueFrom: ValueFromSecret;
}

export interface AwsSecretManagerCredentials {
  accessKey: AwsSecretManagerValue;
  accessSecretKey: AwsSecretManagerValue;
  accessToken?: AwsSecretManagerValue;
}

export interface AwsSecretManager {
  secrets: AwsSecretManagerSecret[];
  credentials?: AwsSecretManagerCredentials;
  podIdentity?: AuthPodIdentity;
  region?: string;
}

export interface KedaAuthentication extends KubeObjectInterface {
  spec: {
    podIdentity?: AuthPodIdentity;
    secretTargetRef?: AuthTargetRef[];
    configMapTargetRef?: AuthTargetRef[];
    env?: AuthEnvironment[];
    hashiCorpVault?: HashiCorpVault;
    azureKeyVault?: AzureKeyVault;
    gcpSecretManager?: GCPSecretManager;
    awsSecretManager?: AwsSecretManager;
  };
  status?: {
    scaledobjects?: string;
    scaledjobs?: string;
  };
}

export class BaseKedaAuthentication extends KubeObject<KedaAuthentication> {
  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status ?? {};
  }

  get podIdentity(): string {
    return this.spec.podIdentity?.provider ?? '';
  }

  get secretName(): string {
    return this.spec.secretTargetRef?.[0]?.name ?? '';
  }

  get envName(): string {
    return this.spec.env?.[0]?.name ?? '';
  }

  get vaultAddress(): string {
    return this.spec.hashiCorpVault?.address ?? this.spec.azureKeyVault?.vaultUri ?? '';
  }

  get scaledobjects(): string[] {
    const objs = this.status.scaledobjects;
    if (!objs) return [];
    return objs
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  get scaledjobs(): string[] {
    const jobs = this.status.scaledjobs;
    if (!jobs) return [];
    return jobs
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
}
