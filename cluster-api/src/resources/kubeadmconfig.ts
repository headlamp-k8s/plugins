import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Condition, LocalObjectReference, Taint } from './common';

export class KubeadmConfig extends KubeObject<ClusterApiKubeadmConfig> {
  static readonly apiName = 'kubeadmconfigs';
  static readonly apiVersion = 'bootstrap.cluster.x-k8s.io/v1beta1';
  static readonly isNamespaced = true;
  static readonly kind = 'KubeadmConfig';

  static get detailsRoute() {
    return '/cluster-api/kubeadmconfigs/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }
}

export interface ClusterApiKubeadmConfig extends KubeObjectInterface {
  spec?: KubeadmConfigSpec;
  status?: KubeadmConfigStatus;
}

export interface KubeadmConfigSpec {
  clusterConfiguration?: ClusterConfiguration;
  initConfiguration?: InitConfiguration;
  joinConfiguration?: JoinConfiguration;
  files?: KubeadmFile[];
  diskSetup?: {
    partitions?: Partition[];
    filesystems?: Filesystem[];
  };
  mounts?: string[];
  bootCommands?: string[];
  preKubeadmCommands?: string[];
  postKubeadmCommands?: string[];
  users?: User[];
  ntp?: {
    servers?: string[];
    enabled?: boolean;
  };
  format?: string;
  verbosity?: number;
  useExperimentalRetryJoin?: boolean; // deprecated
  ignition?: IgnitionSpec;
}

export interface KubeadmConfigStatus {
  ready: boolean;
  dataSecretName?: string;
  failureReason?: string; // deprecated
  failureMessage?: string; // deprecated
  observedGeneration?: bigint;
  conditions?: Condition[];
  v1beta2?: {
    conditions?: Condition[];
  };
}

export interface APIServer extends ControlPlaneComponent {
  certSANs?: string[];
  timeoutForControlPlane?: number;
}

export interface ClusterConfiguration {
  etcd?: Etcd;
  networking?: {
    serviceSubnet?: string;
    podSubnet?: string;
    dnsDomain?: string;
  };
  kubernetesVersion?: string;
  controlPlaneEndpoint?: string;
  apiServer?: APIServer;
  controllerManager?: ControlPlaneComponent;
  scheduler?: ControlPlaneComponent;
  dns?: ImageMeta;
  certificatesDir?: string;
  imageRepository?: string;
  featureGates?: Record<string, boolean>;
  clusterName?: string;
}

export interface ConfigMapKeySelector extends LocalObjectReference {
  key: string;
  optional?: boolean;
}

export interface ControlPlaneComponent {
  extraArgs?: Record<string, string>;
  extraVolumes?: HostPathMount[];
  extraEnvs?: EnvVar[];
}

export interface Discovery {
  bootstrapToken?: {
    token?: string;
    apiServerEndpoint?: string;
    caCertHashes?: string[];
    unsafeSkipCAVerification?: boolean;
  };
}

export interface EnvVar {
  name: string;
  value?: string;
  valueFrom?: {
    fieldRef?: {
      apiVersion?: string;
      fieldPath: string;
    };
    resourceFieldRef?: {
      containerName?: string;
      resource: string;
      divisor?: string;
    };
    configMapKeyRef?: ConfigMapKeySelector;
    secretKeyRef?: SecretKeySelector;
  };
}

export interface Etcd {
  local?: LocalEtcd;
  external?: ExternalEtcd;
}

export interface ExternalEtcd extends ImageMeta {
  endpoints: string[];
  caFile: string;
  certFile: string;
  keyFile: string;
}

export interface Filesystem {
  device: string;
  filesystem: string;
  label?: string;
  partition?: string;
  overwrite?: boolean;
  replaceFS?: string;
  extraOpts?: string[];
}

export interface HostPathMount {
  name: string;
  hostPath: string;
  mountPath: string;
  readOnly?: boolean;
  pathType?: string;
}

export interface ImageMeta {
  imageRepository?: string;
  imageTag?: string;
}

export interface IgnitionSpec {
  containerLinuxConfig?: {
    additionalConfig?: string;
    strict?: boolean;
  };
}

export interface InitConfiguration {
  nodeRegistration?: NodeRegistrationOptions;
  caCertPath?: string;
  discovery?: Discovery;
  controlPlane?: {
    localAPIEndpoint?: {
      advertiseAddress: string;
      bindPort?: number;
    };
  };
  skipPhases?: string[];
  patches?: {
    directory?: string;
  };
}

export interface JoinConfiguration {
  nodeRegistration?: NodeRegistrationOptions;
  caCertPath?: string;
  discovery?: Discovery;
  controlPlane?: {
    localAPIEndpoint?: {
      advertiseAddress?: string;
      bindPort?: number;
    };
  };
  skipPhases?: string[];
  patches?: {
    directory?: string;
  };
}

export interface KubeadmFile {
  path: string;
  owner?: string;
  permissions?: string;
  encoding?: 'base64' | 'plain';
  append?: boolean;
  content?: string;
  contentFrom?: {
    secret: {
      name: string;
      key: string;
    };
  };
}

export interface LocalEtcd extends ImageMeta {
  dataDir?: string;
  extraArgs?: Record<string, string>;
  extraEnv?: Record<string, EnvVar>;
  serverCertSANs?: string[];
  peerCertSANs?: string[];
}

export interface NodeRegistrationOptions {
  name?: string;
  criSocket?: string;
  taints?: Taint[];
  kubeletExtraArgs?: Record<string, string>;
  ignorePreflightErrors?: string[];
  imagePullPolicy?: 'Always' | 'IfNotPresent' | 'Never';
  imagePullSerial?: boolean;
}

export interface Partition {
  device: string;
  layout: boolean;
  overwrite?: boolean;
  tableType?: string;
}

export interface SecretKeySelector extends LocalObjectReference {
  key: string;
  optional?: boolean;
}

export interface User {
  name: string;
  gecos?: string;
  groups?: string;
  homeDir?: string;
  inactive?: boolean;
  shell?: string;
  passwd?: string;
  passwdFrom?: {
    secret: {
      name: string;
      key: string;
    };
  };
}
