import type { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface MongoUserRole {
  name: string;
  db: string;
}

export interface MongoUser {
  name: string;
  db?: string;
  passwordSecretRef?: {
    name: string;
    key?: string;
  };
  roles?: MongoUserRole[];
  scramCredentialsSecretName?: string;
  connectionStringSecretName?: string;
  connectionStringSecretNamespace?: string;
  additionalConnectionStringConfig?: Record<string, unknown>;
}

export interface MongoSecurity {
  authentication?: {
    modes?: string[];
    agentMode?: string;
    ignoreUnknownUsers?: boolean;
    agentCertificateSecretRef?: {
      name?: string;
    };
  };
  roles?: Array<{
    role: string;
    db: string;
    privileges?: unknown[];
    roles?: unknown[];
  }>;
  tls?: {
    enabled?: boolean;
    optional?: boolean;
    certificateKeySecretRef?: {
      name?: string;
    };
    caCertificateSecretRef?: {
      name?: string;
    };
    caConfigMapRef?: {
      name?: string;
    };
  };
}

export interface MongoDBCommunitySpec {
  members?: number;
  type?: string;
  version?: string;
  featureCompatibilityVersion?: string;
  security?: MongoSecurity;
  users?: MongoUser[];
  arbiters?: number;
  additionalMongodConfig?: Record<string, unknown>;
  additionalConnectionStringConfig?: Record<string, unknown>;
  clusterDomain?: string;
  [key: string]: unknown;
}

export interface MongoDBCommunityStatus {
  phase?: string;
  version?: string;
  message?: string;
  mongoUri?: string;
  currentMongoDBMembers?: number;
  currentMongoDBArbiters?: number;
  currentStatefulSetReplicas?: number;
  currentStatefulSetArbitersReplicas?: number;
}

export interface MongoDBCommunityObject extends KubeObjectInterface {
  spec?: MongoDBCommunitySpec;
  status?: MongoDBCommunityStatus;
}
