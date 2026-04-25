import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ClusterV1Condition, MetaV1Condition, Taint } from './common';

const KC_API_GROUP = 'bootstrap.cluster.x-k8s.io';
const KC_CRD_NAME = 'kubeadmconfigs.bootstrap.cluster.x-k8s.io';

/**
 * KubeadmConfig resource specification.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#kubeadmconfig
 */
export interface KubeadmConfigSpec {
  /** ClusterConfiguration contains the configuration for the cluster. */
  clusterConfiguration?: ClusterConfiguration;
  /** InitConfiguration contains the configuration for the node initialization. */
  initConfiguration?: InitConfiguration;
  /** JoinConfiguration contains the configuration for the node join. */
  joinConfiguration?: JoinConfiguration;
  /** Files specifies extra files to be created on the node. */
  files?: KubeadmFile[];
  /** DiskSetup specifies how to setup disks on the node. */
  diskSetup?: {
    /** Partitions specifies the partitions to create. */
    partitions?: Partition[];
    /** Filesystems specifies the filesystems to create. */
    filesystems?: Filesystem[];
  };
  /** Mounts specifies extra mount points. */
  mounts?: string[][];
  /** BootCommands specifies commands to run during boot. */
  bootCommands?: string[];
  /** PreKubeadmCommands specifies commands to run before kubeadm. */
  preKubeadmCommands?: string[];
  /** PostKubeadmCommands specifies commands to run after kubeadm. */
  postKubeadmCommands?: string[];
  /** Users specifies extra users to create on the node. */
  users?: User[];
  /** NTP specifies the NTP configuration. */
  ntp?: NTP;
  /** Format specifies the output format of the configuration (e.g. cloud-config). */
  format?: string;
  /** Verbosity specifies the verbosity level of kubeadm. */
  verbosity?: number;
  /** @deprecated */
  useExperimentalRetryJoin?: boolean;
  /** IgnitionSpec specifies the ignition configuration. */
  ignition?: IgnitionSpec;
}
export interface KubeadmConfigV1Beta2InlineStatus {
  conditions?: MetaV1Condition[];
}

export interface KubeadmConfigStatusV1Beta1 {
  ready: boolean;
  dataSecretName?: string;
  observedGeneration?: number;
  conditions?: ClusterV1Condition[];
  /** Backported v1beta2 conditions embedded inside a v1beta1 object. */
  v1beta2?: KubeadmConfigV1Beta2InlineStatus;
  /** @deprecated */
  failureReason?: string;
  /** @deprecated */
  failureMessage?: string;
}

export interface KubeadmConfigStatusV1Beta2 {
  ready: boolean;
  dataSecretName?: string;
  observedGeneration?: number;
  conditions?: MetaV1Condition[];
  deprecated?: {
    v1beta1?: {
      failureReason?: string;
      failureMessage?: string;
    };
  };
}

export type KubeadmConfigStatus = KubeadmConfigStatusV1Beta1 | KubeadmConfigStatusV1Beta2;

export type ClusterApiKubeadmConfig =
  | (KubeObjectInterface & { spec?: KubeadmConfigSpec; status?: KubeadmConfigStatusV1Beta1 })
  | (KubeObjectInterface & { spec?: KubeadmConfigSpec; status?: KubeadmConfigStatusV1Beta2 });

function isKCV1Beta2(
  status: KubeadmConfigStatus | undefined | null
): status is KubeadmConfigStatusV1Beta2 {
  return !!status && 'deprecated' in status;
}

interface NormalizedKCStatus {
  conditions?: ClusterV1Condition[] | MetaV1Condition[];
  failure?: { failureReason?: string; failureMessage?: string };
}

/**
 * Internal helper to normalize KubeadmConfig status across v1beta1/v1beta2.
 */
function normalizeKCStatus(item: ClusterApiKubeadmConfig | null | undefined): NormalizedKCStatus {
  const status = item?.status;
  if (!status) return {};

  if (isKCV1Beta2(status)) {
    const dep = status.deprecated?.v1beta1;
    return {
      conditions: status.conditions,
      failure:
        dep?.failureReason || dep?.failureMessage
          ? { failureReason: dep.failureReason, failureMessage: dep.failureMessage }
          : undefined,
    };
  }

  const s = status as KubeadmConfigStatusV1Beta1;
  return {
    conditions: s.v1beta2?.conditions?.length ? s.v1beta2.conditions : s.conditions,
    failure:
      s.failureReason || s.failureMessage
        ? { failureReason: s.failureReason, failureMessage: s.failureMessage }
        : undefined,
  };
}

export function getKCConditions(item: ClusterApiKubeadmConfig | null | undefined) {
  return normalizeKCStatus(item).conditions;
}

export function getKCFailure(item: ClusterApiKubeadmConfig | null | undefined) {
  return normalizeKCStatus(item).failure;
}

/**
 * KubeadmConfig is the KubeObject implementation for the Cluster API KubeadmConfig resource.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#kubeadmconfig
 */
export class KubeadmConfig extends KubeObject<ClusterApiKubeadmConfig> {
  static readonly apiName = 'kubeadmconfigs';
  static apiVersion = `${KC_API_GROUP}/v1beta1`;
  static readonly crdName = KC_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'KubeadmConfig';

  /**
   * Returns the route for the kubeadm config details page.
   */
  static get detailsRoute() {
    return '/cluster-api/kubeadmconfigs/:namespace/:name';
  }

  /**
   * Returns a version of the KubeadmConfig class with a specific API version.
   */
  static withApiVersion(version: string): typeof KubeadmConfig {
    const versionedClass = class extends KubeadmConfig {} as typeof KubeadmConfig;
    versionedClass.apiVersion = `${KC_API_GROUP}/${version}`;
    return versionedClass;
  }

  /**
   * Returns the kubeadm config specification.
   */
  get spec(): KubeadmConfigSpec | undefined {
    return this.jsonData.spec;
  }

  /**
   * Returns the raw status object.
   */
  get status(): KubeadmConfigStatus | undefined {
    return this.jsonData.status;
  }

  /**
   * Returns normalized conditions for the kubeadm config.
   */
  get conditions() {
    return getKCConditions(this.jsonData);
  }

  /**
   * Returns failure information if present.
   */
  get failure() {
    return getKCFailure(this.jsonData);
  }
}

export interface NTP {
  servers?: string[];
  enabled?: boolean;
}

export interface IgnitionSpec {
  containerLinuxConfig?: {
    additionalConfig?: string;
    strict?: boolean;
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
    fieldRef?: { apiVersion?: string; fieldPath: string };
    resourceFieldRef?: { containerName?: string; resource: string; divisor?: string };
    configMapKeyRef?: { name: string; key: string; optional?: boolean };
    secretKeyRef?: { name: string; key: string; optional?: boolean };
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

export interface InitConfiguration {
  nodeRegistration?: NodeRegistrationOptions;
  caCertPath?: string;
  discovery?: Discovery;
  controlPlane?: {
    localAPIEndpoint?: { advertiseAddress: string; bindPort?: number };
  };
  skipPhases?: string[];
  patches?: { directory?: string };
}

export interface JoinConfiguration {
  nodeRegistration?: NodeRegistrationOptions;
  caCertPath?: string;
  discovery?: Discovery;
  controlPlane?: {
    localAPIEndpoint?: { advertiseAddress?: string; bindPort?: number };
  };
  skipPhases?: string[];
  patches?: { directory?: string };
}

export interface KubeadmFile {
  path: string;
  owner?: string;
  permissions?: string;
  encoding?: 'base64' | 'plain';
  append?: boolean;
  content?: string;
  contentFrom?: { secret: { name: string; key: string } };
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

export interface User {
  name: string;
  gecos?: string;
  groups?: string;
  homeDir?: string;
  inactive?: boolean;
  shell?: string;
  passwd?: string;
  passwdFrom?: { secret: { name: string; key: string } };
}
