/**
 * Strimzi API version detection.
 *
 * Probes the standard Kubernetes API-groups discovery endpoint (/apis) once
 * per page load to determine whether Strimzi is installed and which API
 * version it serves.
 *
 * Strimzi 1.0.0 promoted all CRDs to v1 and retired v1beta2.
 * Earlier releases only serve v1beta2.
 * If kafka.strimzi.io is absent from the API groups list, Strimzi is not
 * installed and the plugin should render a friendly empty state rather than
 * making API calls that will all return 404.
 */
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

export interface StrimziApiVersions {
  /** False while the probe is still in flight. */
  ready: boolean;
  /** True if the kafka.strimzi.io API group was found on the cluster. */
  installed: boolean;
  /** Version served by kafka.strimzi.io (Kafka, KafkaTopic, KafkaUser, …). */
  kafka: string;
  /** Version served by core.strimzi.io (StrimziPodSet). */
  core: string;
}

/** Used before the probe resolves (optimistic: don't flash "not installed"). */
const PENDING_VERSIONS: StrimziApiVersions = {
  ready: false,
  installed: true,
  kafka: 'v1beta2',
  core: 'v1beta2',
};

let _cache: StrimziApiVersions | null = null;
/** Single shared promise so we never fire more than one /apis request. */
let _probePromise: Promise<StrimziApiVersions> | null = null;

interface ApiGroup {
  name: string;
  versions: Array<{ version: string }>;
  preferredVersion?: { version: string };
}

function pickVersion(group: ApiGroup): string {
  // Prefer the server-advertised preferredVersion; fall back to checking the
  // versions list for v1, then default to v1beta2.
  if (group.preferredVersion?.version) return group.preferredVersion.version;
  const versions = group.versions.map(v => v.version);
  return versions.includes('v1') ? 'v1' : 'v1beta2';
}

/**
 * Runs the probe. Throws on transient failures (network, auth) so that the
 * caller can choose not to cache the result and retry on the next call.
 */
async function runProbe(): Promise<StrimziApiVersions> {
  const data = await ApiProxy.request('/apis');
  const groups: ApiGroup[] = data?.groups ?? [];

  const kafkaGroup = groups.find(g => g.name === 'kafka.strimzi.io');
  const coreGroup = groups.find(g => g.name === 'core.strimzi.io');

  if (!kafkaGroup) {
    // API discovery worked but kafka.strimzi.io is absent: Strimzi is not installed.
    return { ready: true, installed: false, kafka: 'v1beta2', core: 'v1beta2' };
  }

  return {
    ready: true,
    installed: true,
    kafka: pickVersion(kafkaGroup),
    core: coreGroup ? pickVersion(coreGroup) : 'v1beta2',
  };
}

/**
 * Resolves the Strimzi API versions available on the current cluster.
 *
 * The result is cached after a successful probe. On transient failures
 * (network errors, proxy not ready) the promise is cleared so the next
 * caller will retry rather than permanently pinning to the v1beta2 default.
 */
export function resolveStrimziApiVersions(): Promise<StrimziApiVersions> {
  if (_cache) return Promise.resolve(_cache);
  if (!_probePromise) {
    _probePromise = runProbe()
      .then(result => {
        _cache = result;
        return result;
      })
      .catch((): StrimziApiVersions => {
        // Clear the promise so the next call will retry the probe.
        _probePromise = null;
        // Return a safe default without caching so future retries are possible.
        return { ready: true, installed: true, kafka: 'v1beta2', core: 'v1beta2' };
      });
  }
  return _probePromise;
}

/**
 * Returns the cached versions synchronously.
 * Returns PENDING_VERSIONS (ready: false) before the probe completes.
 */
export function getStrimziApiVersions(): StrimziApiVersions {
  return _cache ?? PENDING_VERSIONS;
}

/** Clears the cache. Useful in tests. */
export function _resetStrimziApiVersionCache(): void {
  _cache = null;
  _probePromise = null;
}
