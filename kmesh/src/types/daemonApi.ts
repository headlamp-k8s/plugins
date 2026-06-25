/**
 * TypeScript types for the Kmesh Daemon Admin API (port 15200).
 *
 * These mirror the Go structs defined in:
 *   - kmesh.net/kmesh/pkg/status/api.go
 *   - kmesh.net/kmesh/pkg/status/status_server.go
 *
 * Endpoint reference:
 *   GET  /version                              → KmeshVersion
 *   GET  /debug/ready                          → string ("OK")
 *   GET  /debug/loggers[?name=<logger>]        → string[] | LoggerInfo
 *   POST /debug/loggers                        → (body: LoggerInfo)
 *   GET  /debug/config_dump/kernel-native      → ConfigDump (ADS / kernel-native mode)
 *   GET  /debug/config_dump/dual-engine        → WorkloadDump (workload / dual-engine mode)
 *   GET  /debug/config_dump/bpf/kernel-native  → (BPF map dump, ADS mode)
 *   GET  /debug/config_dump/bpf/dual-engine    → WorkloadBpfDump
 *   POST /accesslog?enable=<bool>
 *   POST /monitoring?enable=<bool>
 *   POST /workload_metrics?enable=<bool>
 *   POST /connection_metrics?enable=<bool>
 *   POST /authz?enable=<bool>
 */

// ---------------------------------------------------------------------------
// /version
// ---------------------------------------------------------------------------

export interface KmeshVersion {
  /** The semantic version of the Kmesh daemon */
  version: string;
  /** Git commit hash of the build */
  gitRevision: string;
  /** Git branch of the build */
  gitBranch: string;
  /** Timestamp when the daemon was built */
  buildTime: string;
  /** Go runtime version used for the build */
  goVersion: string;
  /** Operating system of the build */
  os: string;
  /** Architecture of the build (e.g., amd64, arm64) */
  arch: string;
}

// ---------------------------------------------------------------------------
// /debug/loggers
// ---------------------------------------------------------------------------

export interface LoggerInfo {
  /** Name of the logger component */
  name: string;
  /** Current logging level (e.g., info, debug, error) */
  level: string;
}

// ---------------------------------------------------------------------------
// /debug/config_dump/dual-engine  (workload / dual-engine mode)
// ---------------------------------------------------------------------------

export interface Locality {
  /** Region of the locality */
  region?: string;
  /** Zone of the locality */
  zone?: string;
  /** Subzone of the locality */
  subzone?: string;
}

export interface ApplicationTunnel {
  /** Tunnel protocol (e.g., HBONE) */
  protocol: string;
  /** Port used for the application tunnel */
  port?: number;
}

/**
 * Represents a single workload endpoint configured in the daemon.
 * Mapped from kmesh/pkg/status/api.go
 */
export interface DaemonWorkload {
  /** Unique identifier for the workload (e.g., pod UID) */
  uid?: string;
  /** List of IP addresses associated with this workload */
  addresses: string[];
  /** Optional waypoint proxy address assigned to this workload */
  waypoint?: string;
  /** Traffic protocol used by the workload (e.g., HTTP, TCP) */
  protocol: string;
  /** Name of the pod or workload instance */
  name: string;
  /** Kubernetes namespace where the workload resides */
  namespace: string;
  /** Service account associated with the workload */
  serviceAccount: string;
  /** Name of the parent workload (e.g., Deployment name) */
  workloadName: string;
  /** Type of the parent workload (e.g., Deployment, DaemonSet) */
  workloadType: string;
  /** Canonical name used for telemetry and routing */
  canonicalName: string;
  /** Canonical revision used for telemetry and routing */
  canonicalRevision: string;
  /** ID of the cluster where the workload is running */
  clusterId: string;
  /** Trust domain for mTLS identity */
  trustDomain?: string;
  /** Locality information (region, zone, subzone) */
  locality?: Locality;
  /** Name of the node where the workload is scheduled */
  node: string;
  /** Network identifier for the workload */
  network?: string;
  /** Current operational status of the workload */
  status: string;
  /** Configuration for application-level tunneling (e.g., HBONE) */
  applicationTunnel?: ApplicationTunnel;
  /** List of service names associated with this workload */
  services?: string[];
  /** List of authorization policy names applied to this workload */
  authorizationPolicies?: string[];
}

/** Network port mapping for a service. */
export interface Port {
  /** The port exposed by the service */
  servicePort: number;
  /** The underlying target port on the pods */
  targetPort: number;
}

/** Load balancing configuration for a service. */
export interface LoadBalancer {
  /** Load balancing algorithm/mode */
  mode: string;
  /** Routing preferences for traffic distribution */
  routingPreferences: string[];
}

/** Waypoint proxy configuration for a service. */
export interface DaemonWaypoint {
  /** Destination address of the waypoint proxy */
  destination: string;
}

/**
 * Represents a Kubernetes service as seen by the Kmesh daemon.
 * Mapped from kmesh/pkg/status/api.go
 */
export interface DaemonService {
  /** Name of the Kubernetes service */
  name: string;
  /** Namespace where the service is defined */
  namespace: string;
  /** Fully qualified hostname of the service */
  hostname: string;
  /** Virtual IPs (ClusterIPs) assigned to the service */
  vips: string[];
  /** List of port mappings for the service */
  ports: Port[];
  /** Load balancing configuration and preferences */
  loadBalancer?: LoadBalancer;
  /** Waypoint proxy configuration assigned to handle traffic for this service */
  waypoint?: DaemonWaypoint;
}

/**
 * Opaque rule for authorization, mirrors security.Rule proto.
 */
export interface SecurityRule {
  // Opaque — mirrors security.Rule proto; keep as unknown for now
  [key: string]: unknown;
}

/**
 * Represents an AuthorizationPolicy enforced by the Kmesh daemon.
 * Mapped from kmesh/pkg/status/api.go
 */
export interface DaemonAuthorizationPolicy {
  /** Name of the AuthorizationPolicy resource */
  name: string;
  /** Namespace where the policy is defined */
  namespace: string;
  /** Scope of the policy (e.g., global, namespace, workload) */
  scope: string;
  /** Action taken when rules match (ALLOW, DENY, CUSTOM, AUDIT) */
  action: string;
  /** List of rules evaluated by the policy */
  rules: SecurityRule[];
}

/** Response shape for GET /debug/config_dump/dual-engine */
export interface WorkloadDump {
  workloads: DaemonWorkload[];
  services: DaemonService[];
  policies: DaemonAuthorizationPolicy[];
}

// ---------------------------------------------------------------------------
// /debug/config_dump/bpf/dual-engine  (BPF map dump, workload mode)
// ---------------------------------------------------------------------------

export interface BpfServiceValue {
  /** Number of endpoints associated with this service */
  endpointCount: string;
  /** Load balancing policy applied to the service */
  lbPolicy: string;
  /** Service port */
  servicePort?: string;
  /** Target port */
  targetPort?: string;
  /** Address of the waypoint proxy handling this service */
  waypointAddr?: string;
  /** Port of the waypoint proxy */
  waypointPort?: number;
}

export interface BpfBackendValue {
  /** IP address of the backend endpoint */
  ip: string;
  /** Number of services pointing to this backend */
  serviceCount: number;
  /** List of service names this backend belongs to */
  services: string[];
  /** Address of the waypoint proxy for this backend */
  waypointAddr?: string;
  /** Port of the waypoint proxy */
  waypointPort?: number;
}

export interface BpfFrontendValue {
  /** Upstream identifier for the frontend */
  upstreamId?: string;
}

export interface BpfWorkloadPolicyValue {
  /** List of policy identifiers applied to the workload */
  policyIds?: string[];
}

export interface BpfEndpointValue {
  /** Unique identifier of the backend providing this endpoint */
  backendUid?: string;
}

/** Response shape for GET /debug/config_dump/bpf/dual-engine */
export interface WorkloadBpfDump {
  workloadPolicies: BpfWorkloadPolicyValue[];
  backends: BpfBackendValue[];
  endpoints: BpfEndpointValue[];
  frontends: BpfFrontendValue[];
  services: BpfServiceValue[];
}

// ---------------------------------------------------------------------------
// /debug/config_dump/kernel-native  (ADS / kernel-native mode)
// ---------------------------------------------------------------------------

/** Opaque xDS resource — proto-JSON encoded */
export type XdsResource = Record<string, unknown>;

export interface ConfigResources {
  /** Dump of all dynamic cluster configurations */
  clusterConfigs?: XdsResource[];
  /** Dump of all dynamic listener configurations */
  listenerConfigs?: XdsResource[];
  /** Dump of all dynamic route configurations */
  routeConfigs?: XdsResource[];
}

/** Response shape for GET /debug/config_dump/kernel-native */
export interface ConfigDump {
  dynamicResources?: ConfigResources;
}

// ---------------------------------------------------------------------------
// Generic daemon request state
// ---------------------------------------------------------------------------

export type DaemonRequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DaemonRequestState<T> {
  /** Current lifecycle status of the request. */
  status: DaemonRequestStatus;
  /** Populated on success. */
  data: T | null;
  /** Populated on error. */
  error: string | null;
}
